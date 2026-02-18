import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { generateContent } from './bedrock-service';

const bedrockMock = mockClient(BedrockRuntimeClient);

// Helper to create mock Bedrock response body
function createMockBody(data: any) {
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  return encoded as any; // Type cast to bypass strict type checking in tests
}

describe('Bedrock Service', () => {
  beforeEach(() => {
    bedrockMock.reset();
    vi.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should call Bedrock with correct model ID', async () => {
      const mockResponse = {
        body: createMockBody({
          content: [{
            type: 'text',
            text: JSON.stringify({
              title: 'Test Item',
              description: 'A test description',
              condition: 'Good'
            })
          }],
          usage: {
            input_tokens: 50,
            output_tokens: 30
          }
        })
      };

      bedrockMock.on(InvokeModelCommand).resolves(mockResponse as any);

      await generateContent('Test prompt');

      const calls = bedrockMock.commandCalls(InvokeModelCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input.modelId).toBe('anthropic.claude-3-haiku-20240307-v1:0');
    });

    it('should set max_tokens to 500', async () => {
      const mockResponse = {
        body: createMockBody({
          content: [{
            type: 'text',
            text: JSON.stringify({
              title: 'Test Item',
              description: 'A test description',
              condition: 'Good'
            })
          }],
          usage: {
            input_tokens: 50,
            output_tokens: 30
          }
        })
      };

      bedrockMock.on(InvokeModelCommand).resolves(mockResponse as any);

      await generateContent('Test prompt');

      const calls = bedrockMock.commandCalls(InvokeModelCommand);
      const requestBody = JSON.parse(calls[0].args[0].input.body as string);
      expect(requestBody.max_tokens).toBe(500);
    });

    it('should parse valid JSON response correctly', async () => {
      const expectedContent = {
        title: 'Vintage Wooden Chair',
        description: 'Beautiful chair in good condition',
        condition: 'Good'
      };

      const mockResponse = {
        body: createMockBody({
          content: [{
            type: 'text',
            text: JSON.stringify(expectedContent)
          }],
          usage: {
            input_tokens: 50,
            output_tokens: 30
          }
        })
      };

      bedrockMock.on(InvokeModelCommand).resolves(mockResponse as any);

      const result = await generateContent('Test prompt');

      expect(result).toEqual(expectedContent);
    });

    it('should log token usage', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const mockResponse = {
        body: createMockBody({
          content: [{
            type: 'text',
            text: JSON.stringify({
              title: 'Test Item',
              description: 'A test description',
              condition: 'Good'
            })
          }],
          usage: {
            input_tokens: 50,
            output_tokens: 30
          }
        })
      };

      bedrockMock.on(InvokeModelCommand).resolves(mockResponse as any);

      await generateContent('Test prompt');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Bedrock token usage:',
        expect.objectContaining({
          service: 'Bedrock',
          operation: 'generateContent',
          inputTokens: 50,
          outputTokens: 30,
          totalTokens: 80
        })
      );
    });

    it('should handle malformed JSON with error recovery', async () => {
      const expectedContent = {
        title: 'Test Item',
        description: 'A test description',
        condition: 'Good'
      };

      // Response with extra text around JSON
      const mockResponse = {
        body: createMockBody({
          content: [{
            type: 'text',
            text: `Here is the JSON response:\n${JSON.stringify(expectedContent)}\nHope this helps!`
          }],
          usage: {
            input_tokens: 50,
            output_tokens: 30
          }
        })
      };

      bedrockMock.on(InvokeModelCommand).resolves(mockResponse as any);

      const result = await generateContent('Test prompt');

      expect(result).toEqual(expectedContent);
    });

    it('should throw error when JSON parsing fails after retry', async () => {
      const mockResponse = {
        body: createMockBody({
          content: [{
            type: 'text',
            text: 'This is not valid JSON at all'
          }],
          usage: {
            input_tokens: 50,
            output_tokens: 30
          }
        })
      };

      bedrockMock.on(InvokeModelCommand).resolves(mockResponse as any);

      await expect(generateContent('Test prompt')).rejects.toThrow(
        'Failed to parse Bedrock response after retry'
      );
    });

    it('should throw error when required fields are missing', async () => {
      const mockResponse = {
        body: createMockBody({
          content: [{
            type: 'text',
            text: JSON.stringify({
              title: 'Test Item'
              // Missing description and condition
            })
          }],
          usage: {
            input_tokens: 50,
            output_tokens: 30
          }
        })
      };

      bedrockMock.on(InvokeModelCommand).resolves(mockResponse as any);

      await expect(generateContent('Test prompt')).rejects.toThrow(
        'Missing required fields in generated content'
      );
    });

    it('should log error and throw when Bedrock service fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const serviceError = new Error('Service unavailable');

      bedrockMock.on(InvokeModelCommand).rejects(serviceError);

      await expect(generateContent('Test prompt')).rejects.toThrow('Service unavailable');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Bedrock service error:',
        expect.objectContaining({
          service: 'Bedrock',
          operation: 'generateContent',
          error: 'Service unavailable'
        })
      );
    });

    it('should throw error when response body is empty', async () => {
      const mockResponse = {
        body: undefined
      };

      bedrockMock.on(InvokeModelCommand).resolves(mockResponse as any);

      await expect(generateContent('Test prompt')).rejects.toThrow(
        'Empty response body from Bedrock'
      );
    });

    it('should throw error when response structure is invalid', async () => {
      const mockResponse = {
        body: createMockBody({
          content: [] // Empty content array
        })
      };

      bedrockMock.on(InvokeModelCommand).resolves(mockResponse as any);

      await expect(generateContent('Test prompt')).rejects.toThrow(
        'Invalid response structure from Bedrock'
      );
    });
  });
});
