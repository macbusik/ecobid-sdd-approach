import { defineFunction } from '@aws-amplify/backend';

export const analyzeImage = defineFunction({
  name: 'analyze-image',
  entry: './handler.ts',
  timeoutSeconds: 10,
  memoryMB: 512,
  resourceGroupName: 'storage',
  environment: {
    BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
  },
});
