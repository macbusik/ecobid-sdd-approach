import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { updateItemRecord, ItemUpdate } from './dynamodb-update';
import fc from 'fast-check';

const dynamodbMock = mockClient(DynamoDBClient);

describe('DynamoDB Update Module', () => {
  beforeEach(() => {
    dynamodbMock.reset();
    vi.clearAllMocks();
    process.env.ITEM_TABLE_NAME = 'test-items-table';
  });

  afterEach(() => {
    delete process.env.ITEM_TABLE_NAME;
  });

  describe('updateItemRecord', () => {
    it('should update DynamoDB with all AI-generated fields', async () => {
      dynamodbMock.on(UpdateItemCommand).resolves({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair', 'Wooden', 'Furniture'],
        aiDescription: 'Beautiful wooden chair in good condition',
        aiConditionAssessment: 'Good'
      };

      await updateItemRecord(update);

      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      expect(calls).toHaveLength(1);
      
      const input = calls[0].args[0].input;
      expect(input.TableName).toBe('test-items-table');
      expect(input.Key).toEqual({ id: { S: 'item-123' } });
    });

    it('should map aiTags to DynamoDB list attribute', async () => {
      dynamodbMock.on(UpdateItemCommand).resolves({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair', 'Wooden'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      await updateItemRecord(update);

      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      const values = calls[0].args[0].input.ExpressionAttributeValues;
      
      expect(values?.[':tags']).toEqual({
        L: [{ S: 'Chair' }, { S: 'Wooden' }]
      });
    });

    it('should map aiDescription to DynamoDB string attribute', async () => {
      dynamodbMock.on(UpdateItemCommand).resolves({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Beautiful wooden chair',
        aiConditionAssessment: 'Good'
      };

      await updateItemRecord(update);

      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      const values = calls[0].args[0].input.ExpressionAttributeValues;
      
      expect(values?.[':desc']).toEqual({ S: 'Beautiful wooden chair' });
    });

    it('should map aiConditionAssessment to DynamoDB string attribute', async () => {
      dynamodbMock.on(UpdateItemCommand).resolves({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Excellent'
      };

      await updateItemRecord(update);

      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      const values = calls[0].args[0].input.ExpressionAttributeValues;
      
      expect(values?.[':cond']).toEqual({ S: 'Excellent' });
    });

    it('should set status field to REVIEW', async () => {
      dynamodbMock.on(UpdateItemCommand).resolves({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      await updateItemRecord(update);

      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      const values = calls[0].args[0].input.ExpressionAttributeValues;
      
      expect(values?.[':status']).toEqual({ S: 'REVIEW' });
    });

    it('should use ExpressionAttributeNames for status (reserved word)', async () => {
      dynamodbMock.on(UpdateItemCommand).resolves({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      await updateItemRecord(update);

      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      const names = calls[0].args[0].input.ExpressionAttributeNames;
      
      expect(names).toEqual({ '#status': 'status' });
    });

    it('should log success on successful update', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      dynamodbMock.on(UpdateItemCommand).resolves({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      await updateItemRecord(update);

      expect(consoleSpy).toHaveBeenCalledWith(
        'DynamoDB update successful:',
        expect.objectContaining({
          service: 'DynamoDB',
          operation: 'updateItemRecord',
          itemId: 'item-123',
          attempt: 1
        })
      );
    });

    it('should throw error when ITEM_TABLE_NAME is not set', async () => {
      delete process.env.ITEM_TABLE_NAME;

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      await expect(updateItemRecord(update)).rejects.toThrow(
        'ITEM_TABLE_NAME environment variable is not set'
      );
    });
  });

  describe('Retry Logic', () => {
    it('should retry up to 3 times with exponential backoff', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      // Fail first 2 attempts, succeed on 3rd
      dynamodbMock
        .on(UpdateItemCommand)
        .rejectsOnce(new Error('Throttling'))
        .rejectsOnce(new Error('Throttling'))
        .resolvesOnce({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      await updateItemRecord(update);

      // Should have made 3 attempts total
      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      expect(calls).toHaveLength(3);

      // Should have logged warnings for first 2 failures
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      
      // Should have logged retry delays
      expect(consoleLogSpy).toHaveBeenCalledWith('Retrying in 100ms...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Retrying in 200ms...');
    });

    it('should wait 100ms before first retry', async () => {
      vi.useFakeTimers();
      
      dynamodbMock
        .on(UpdateItemCommand)
        .rejectsOnce(new Error('Throttling'))
        .resolvesOnce({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      const promise = updateItemRecord(update);
      
      // Fast-forward time
      await vi.advanceTimersByTimeAsync(100);
      
      await promise;

      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      expect(calls).toHaveLength(2);
      
      vi.useRealTimers();
    });

    it('should wait 200ms before second retry', async () => {
      vi.useFakeTimers();
      
      dynamodbMock
        .on(UpdateItemCommand)
        .rejectsOnce(new Error('Throttling'))
        .rejectsOnce(new Error('Throttling'))
        .resolvesOnce({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      const promise = updateItemRecord(update);
      
      // Fast-forward through both delays
      await vi.advanceTimersByTimeAsync(100); // First retry
      await vi.advanceTimersByTimeAsync(200); // Second retry
      
      await promise;

      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      expect(calls).toHaveLength(3);
      
      vi.useRealTimers();
    });

    it('should wait 400ms before third retry', async () => {
      vi.useFakeTimers();
      
      dynamodbMock
        .on(UpdateItemCommand)
        .rejectsOnce(new Error('Throttling'))
        .rejectsOnce(new Error('Throttling'))
        .rejectsOnce(new Error('Throttling'))
        .resolvesOnce({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      const promise = updateItemRecord(update);
      
      // Fast-forward through all delays
      await vi.advanceTimersByTimeAsync(100); // First retry
      await vi.advanceTimersByTimeAsync(200); // Second retry
      await vi.advanceTimersByTimeAsync(400); // Third retry
      
      await promise;

      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      expect(calls).toHaveLength(4);
      
      vi.useRealTimers();
    });

    it('should throw exception if all retries fail', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      // Fail all attempts
      dynamodbMock.on(UpdateItemCommand).rejects(new Error('Service unavailable'));

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      await expect(updateItemRecord(update)).rejects.toThrow(
        'Failed to update item item-123 after 4 attempts: Service unavailable'
      );

      // Should have made 4 attempts (initial + 3 retries)
      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      expect(calls).toHaveLength(4);

      // Should have logged final error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'DynamoDB update failed after all retries:',
        expect.objectContaining({
          service: 'DynamoDB',
          operation: 'updateItemRecord',
          itemId: 'item-123',
          totalAttempts: 4
        })
      );
    });

    it('should succeed on first attempt without retries', async () => {
      dynamodbMock.on(UpdateItemCommand).resolves({});

      const update: ItemUpdate = {
        itemId: 'item-123',
        aiTags: ['Chair'],
        aiDescription: 'Test description',
        aiConditionAssessment: 'Good'
      };

      await updateItemRecord(update);

      // Should have made only 1 attempt
      const calls = dynamodbMock.commandCalls(UpdateItemCommand);
      expect(calls).toHaveLength(1);
    });
  });

  describe('Property-Based Tests', () => {
    // Feature: ai-image-analysis, Property 8: DynamoDB Update Mapping
    // **Validates: Requirements 4.2, 4.3, 4.4**
    it('Property 8: should correctly map all fields for any valid update', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            itemId: fc.string({ minLength: 1 }),
            aiTags: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
            aiDescription: fc.string({ minLength: 1 }),
            aiConditionAssessment: fc.constantFrom('Excellent', 'Good', 'Fair', 'Poor')
          }),
          async (update) => {
            // Reset mock for each iteration
            dynamodbMock.reset();
            dynamodbMock.on(UpdateItemCommand).resolves({});

            await updateItemRecord(update);

            const calls = dynamodbMock.commandCalls(UpdateItemCommand);
            
            // Verify exactly one call was made
            if (calls.length !== 1) {
              throw new Error(`Expected 1 call, got ${calls.length}`);
            }

            const input = calls[0].args[0].input;
            const values = input.ExpressionAttributeValues;

            // Verify all fields are mapped correctly
            if (input.Key?.id?.S !== update.itemId) {
              throw new Error(`Key mismatch: expected ${update.itemId}, got ${input.Key?.id?.S}`);
            }
            
            const expectedTags = { L: update.aiTags.map(tag => ({ S: tag })) };
            if (JSON.stringify(values?.[':tags']) !== JSON.stringify(expectedTags)) {
              throw new Error(`Tags mismatch`);
            }
            
            if (values?.[':desc']?.S !== update.aiDescription) {
              throw new Error(`Description mismatch`);
            }
            
            if (values?.[':cond']?.S !== update.aiConditionAssessment) {
              throw new Error(`Condition mismatch`);
            }
            
            if (values?.[':status']?.S !== 'REVIEW') {
              throw new Error(`Status mismatch`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
