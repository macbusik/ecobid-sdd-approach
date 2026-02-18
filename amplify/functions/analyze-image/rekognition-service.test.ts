import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import { detectLabels, selectTopLabels, type RekognitionLabel } from './rekognition-service';

const rekognitionMock = mockClient(RekognitionClient);

describe('Rekognition Service', () => {
  beforeEach(() => {
    rekognitionMock.reset();
    vi.clearAllMocks();
  });

  describe('detectLabels', () => {
    it('should call DetectLabelsCommand with correct parameters', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      rekognitionMock.on(DetectLabelsCommand).resolves({
        Labels: [
          { Name: 'Chair', Confidence: 95.5 },
          { Name: 'Furniture', Confidence: 89.2 }
        ]
      });

      await detectLabels(imageBuffer);

      const calls = rekognitionMock.commandCalls(DetectLabelsCommand);
      expect(calls).toHaveLength(1);
      
      const commandInput = calls[0].args[0].input;
      expect(commandInput.MinConfidence).toBe(70);
      expect(commandInput.MaxLabels).toBe(10);
      expect(commandInput.Image?.Bytes).toBe(imageBuffer);
    });

    it('should extract label names and confidence scores correctly', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      rekognitionMock.on(DetectLabelsCommand).resolves({
        Labels: [
          { Name: 'Chair', Confidence: 95.5 },
          { Name: 'Furniture', Confidence: 89.2 },
          { Name: 'Wood', Confidence: 78.3 }
        ]
      });

      const result = await detectLabels(imageBuffer);

      expect(result).toEqual([
        { name: 'Chair', confidence: 95.5 },
        { name: 'Furniture', confidence: 89.2 },
        { name: 'Wood', confidence: 78.3 }
      ]);
    });

    it('should return empty array when no labels are detected', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      rekognitionMock.on(DetectLabelsCommand).resolves({
        Labels: []
      });

      const result = await detectLabels(imageBuffer);

      expect(result).toEqual([]);
    });

    it('should return empty array when Labels is undefined', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      rekognitionMock.on(DetectLabelsCommand).resolves({});

      const result = await detectLabels(imageBuffer);

      expect(result).toEqual([]);
    });

    it('should filter out labels with missing Name or Confidence', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      rekognitionMock.on(DetectLabelsCommand).resolves({
        Labels: [
          { Name: 'Chair', Confidence: 95.5 },
          { Name: undefined, Confidence: 89.2 }, // Missing name
          { Name: 'Wood', Confidence: undefined }, // Missing confidence
          { Name: 'Table', Confidence: 85.0 }
        ]
      });

      const result = await detectLabels(imageBuffer);

      expect(result).toEqual([
        { name: 'Chair', confidence: 95.5 },
        { name: 'Table', confidence: 85.0 }
      ]);
    });

    it('should return empty array and log error when Rekognition service fails', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      rekognitionMock.on(DetectLabelsCommand).rejects(new Error('Service unavailable'));

      const result = await detectLabels(imageBuffer);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Rekognition service error:',
        expect.objectContaining({
          service: 'Rekognition',
          operation: 'detectLabels',
          error: 'Service unavailable'
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return empty array when Rekognition service times out', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      rekognitionMock.on(DetectLabelsCommand).rejects(new Error('Request timeout'));

      const result = await detectLabels(imageBuffer);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('selectTopLabels', () => {
    it('should return all labels sorted by confidence when count is less than topN', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 85.0 },
        { name: 'Furniture', confidence: 95.5 },
        { name: 'Wood', confidence: 78.3 }
      ];

      const result = selectTopLabels(labels, 10);

      expect(result).toEqual([
        { name: 'Furniture', confidence: 95.5 },
        { name: 'Chair', confidence: 85.0 },
        { name: 'Wood', confidence: 78.3 }
      ]);
    });

    it('should return exactly topN labels when count exceeds topN', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Label1', confidence: 91.0 },
        { name: 'Label2', confidence: 88.0 },
        { name: 'Label3', confidence: 95.0 },
        { name: 'Label4', confidence: 82.0 },
        { name: 'Label5', confidence: 79.0 },
        { name: 'Label6', confidence: 93.0 }
      ];

      const result = selectTopLabels(labels, 3);

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { name: 'Label3', confidence: 95.0 },
        { name: 'Label6', confidence: 93.0 },
        { name: 'Label1', confidence: 91.0 }
      ]);
    });

    it('should sort labels by confidence in descending order', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Low', confidence: 70.0 },
        { name: 'High', confidence: 99.0 },
        { name: 'Medium', confidence: 85.0 }
      ];

      const result = selectTopLabels(labels, 10);

      expect(result[0].confidence).toBeGreaterThanOrEqual(result[1].confidence);
      expect(result[1].confidence).toBeGreaterThanOrEqual(result[2].confidence);
    });

    it('should handle empty array', () => {
      const labels: RekognitionLabel[] = [];

      const result = selectTopLabels(labels, 10);

      expect(result).toEqual([]);
    });

    it('should use default topN of 10 when not specified', () => {
      const labels: RekognitionLabel[] = Array.from({ length: 15 }, (_, i) => ({
        name: `Label${i}`,
        confidence: 90 - i
      }));

      const result = selectTopLabels(labels);

      expect(result).toHaveLength(10);
    });

    it('should not mutate the original array', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 85.0 },
        { name: 'Furniture', confidence: 95.5 }
      ];
      const originalLabels = [...labels];

      selectTopLabels(labels, 10);

      expect(labels).toEqual(originalLabels);
    });
  });
});
