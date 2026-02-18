import { describe, test, expect, beforeEach, vi } from 'vitest';
import { handler } from './handler';
import type { S3Event } from 'aws-lambda';
import * as s3EventParser from './s3-event-parser';
import * as imageRetrieval from './image-retrieval';
import * as rekognitionService from './rekognition-service';
import * as promptConstructor from './prompt-constructor';
import * as bedrockService from './bedrock-service';
import * as fallbackContent from './fallback-content';
import * as dynamodbUpdate from './dynamodb-update';
import * as logger from './logger';

// Mock all modules
vi.mock('./s3-event-parser');
vi.mock('./image-retrieval');
vi.mock('./rekognition-service');
vi.mock('./prompt-constructor');
vi.mock('./bedrock-service');
vi.mock('./fallback-content');
vi.mock('./dynamodb-update');
vi.mock('./logger');

describe('handler - Main Orchestration', () => {
  const mockEvent: S3Event = {
    Records: [
      {
        s3: {
          bucket: { name: 'test-bucket' },
          object: { key: 'uploads/item-123.jpg' }
        }
      } as any
    ]
  };

  const mockImageBuffer = Buffer.from('fake-image-data');
  const mockLabels = [
    { name: 'Chair', confidence: 95.5 },
    { name: 'Furniture', confidence: 89.2 }
  ];
  const mockGeneratedContent = {
    title: 'Vintage Wooden Chair',
    description: 'Beautiful wooden chair in good condition',
    condition: 'Good'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(s3EventParser.parseS3Event).mockReturnValue({
      bucket: 'test-bucket',
      key: 'uploads/item-123.jpg'
    });
    vi.mocked(imageRetrieval.getImageFromS3).mockResolvedValue(mockImageBuffer);
    vi.mocked(rekognitionService.detectLabels).mockResolvedValue(mockLabels);
    vi.mocked(rekognitionService.selectTopLabels).mockReturnValue(mockLabels);
    vi.mocked(promptConstructor.constructPrompt).mockReturnValue('test prompt');
    vi.mocked(bedrockService.generateContent).mockResolvedValue(mockGeneratedContent);
    vi.mocked(dynamodbUpdate.updateItemRecord).mockResolvedValue(undefined);
    vi.mocked(logger.logInfo).mockImplementation(() => {});
    vi.mocked(logger.logError).mockImplementation(() => {});
  });

  describe('Successful Processing Path', () => {
    test('should orchestrate all modules in correct sequence', async () => {
      await handler(mockEvent);

      // Verify call sequence
      expect(s3EventParser.parseS3Event).toHaveBeenCalledWith(mockEvent);
      expect(imageRetrieval.getImageFromS3).toHaveBeenCalledWith('test-bucket', 'uploads/item-123.jpg');
      expect(rekognitionService.detectLabels).toHaveBeenCalledWith(mockImageBuffer);
      expect(rekognitionService.selectTopLabels).toHaveBeenCalledWith(mockLabels);
      expect(promptConstructor.constructPrompt).toHaveBeenCalledWith(mockLabels);
      expect(bedrockService.generateContent).toHaveBeenCalledWith('test prompt');
      expect(dynamodbUpdate.updateItemRecord).toHaveBeenCalledWith({
        itemId: 'item-123',
        aiTags: ['Chair', 'Furniture'],
        aiDescription: mockGeneratedContent.description,
        aiConditionAssessment: mockGeneratedContent.condition
      });
    });

    test('should log processing start with image key and timestamp', async () => {
      await handler(mockEvent);

      expect(logger.logInfo).toHaveBeenCalledWith(
        'Image analysis started',
        expect.objectContaining({
          imageKey: 'uploads/item-123.jpg',
          itemId: 'item-123',
          bucket: 'test-bucket',
          timestamp: expect.any(String)
        })
      );
    });

    test('should log processing completion with metadata and duration', async () => {
      await handler(mockEvent);

      expect(logger.logInfo).toHaveBeenCalledWith(
        'Image analysis completed successfully',
        expect.objectContaining({
          imageKey: 'uploads/item-123.jpg',
          itemId: 'item-123',
          duration: expect.any(Number),
          metadata: expect.objectContaining({
            title: mockGeneratedContent.title,
            description: mockGeneratedContent.description,
            condition: mockGeneratedContent.condition,
            tags: ['Chair', 'Furniture'],
            labelCount: 2
          })
        })
      );
    });

    test('should extract itemId from S3 key correctly', async () => {
      await handler(mockEvent);

      expect(dynamodbUpdate.updateItemRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'item-123'
        })
      );
    });
  });

  describe('Bedrock Fallback Handling', () => {
    test('should use fallback content when Bedrock fails', async () => {
      const bedrockError = new Error('Bedrock service unavailable');
      vi.mocked(bedrockService.generateContent).mockRejectedValue(bedrockError);
      
      const mockFallbackContent = {
        title: 'Chair, Furniture',
        description: 'Item: Chair, Furniture. Available for pickup.',
        condition: 'Good'
      };
      vi.mocked(fallbackContent.generateFallbackContent).mockReturnValue(mockFallbackContent);

      await handler(mockEvent);

      // Verify fallback was called
      expect(fallbackContent.generateFallbackContent).toHaveBeenCalledWith(mockLabels);
      
      // Verify fallback content was used in DynamoDB update
      expect(dynamodbUpdate.updateItemRecord).toHaveBeenCalledWith({
        itemId: 'item-123',
        aiTags: ['Chair', 'Furniture'],
        aiDescription: mockFallbackContent.description,
        aiConditionAssessment: mockFallbackContent.condition
      });

      // Verify error was logged
      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'generateContent',
          service: 'Bedrock',
          error: bedrockError
        })
      );

      // Verify fallback usage was logged
      expect(logger.logInfo).toHaveBeenCalledWith(
        'Using fallback content generation',
        expect.objectContaining({
          imageKey: 'uploads/item-123.jpg',
          itemId: 'item-123'
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle S3 event parse errors', async () => {
      const parseError = new s3EventParser.S3EventParseError('Invalid event structure');
      vi.mocked(s3EventParser.parseS3Event).mockImplementation(() => {
        throw parseError;
      });

      await expect(handler(mockEvent)).rejects.toThrow();

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'handler',
          service: 'ImageAnalyzer',
          metadata: expect.objectContaining({
            errorType: 'S3EventParseError'
          })
        })
      );
    });

    test('should handle image validation errors', async () => {
      const validationError = new imageRetrieval.ImageValidationError('Invalid file extension');
      vi.mocked(imageRetrieval.getImageFromS3).mockRejectedValue(validationError);

      await expect(handler(mockEvent)).rejects.toThrow();

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'handler',
          service: 'ImageAnalyzer',
          metadata: expect.objectContaining({
            errorType: 'ImageValidationError',
            imageKey: 'uploads/item-123.jpg',
            itemId: 'item-123'
          })
        })
      );
    });

    test('should handle DynamoDB update errors', async () => {
      const dynamoError = new Error('DynamoDB update failed');
      vi.mocked(dynamodbUpdate.updateItemRecord).mockRejectedValue(dynamoError);

      await expect(handler(mockEvent)).rejects.toThrow();

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'handler',
          service: 'ImageAnalyzer'
        })
      );
    });

    test('should log error with duration on failure', async () => {
      const error = new Error('Test error');
      vi.mocked(imageRetrieval.getImageFromS3).mockRejectedValue(error);

      await expect(handler(mockEvent)).rejects.toThrow();

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            duration: expect.any(Number)
          })
        })
      );
    });
  });

  describe('ItemId Extraction', () => {
    test('should extract itemId from various S3 key formats', async () => {
      const testCases = [
        { key: 'uploads/item-123.jpg', expectedId: 'item-123' },
        { key: 'uploads/my-item.png', expectedId: 'my-item' },
        { key: 'item-456.jpeg', expectedId: 'item-456' },
        { key: 'uploads/nested/path/item-789.heic', expectedId: 'item-789' }
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        
        vi.mocked(s3EventParser.parseS3Event).mockReturnValue({
          bucket: 'test-bucket',
          key: testCase.key
        });

        await handler(mockEvent);

        expect(dynamodbUpdate.updateItemRecord).toHaveBeenCalledWith(
          expect.objectContaining({
            itemId: testCase.expectedId
          })
        );
      }
    });
  });
});
