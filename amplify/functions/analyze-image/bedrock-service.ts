import { 
  BedrockRuntimeClient, 
  InvokeModelCommand,
  InvokeModelCommandOutput 
} from '@aws-sdk/client-bedrock-runtime';

/**
 * Generated content from Bedrock
 */
export interface GeneratedContent {
  title: string;
  description: string;
  condition: string;
}

/**
 * Claude 3 Haiku model identifier
 * Requirements: 3.3 - Use Claude 3 Haiku model
 */
const MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';

/**
 * Maximum tokens for response generation
 * Requirements: 3.4, 5.4 - Set max_tokens to 500
 */
const MAX_TOKENS = 500;

/**
 * Generates item listing metadata using Amazon Bedrock (Claude 3 Haiku)
 * 
 * @param prompt - Formatted prompt with detected labels
 * @returns Generated title, description, and condition assessment
 * 
 * Requirements:
 * - 3.3: Use Claude 3 Haiku model
 * - 3.4: Set max_tokens to 500
 * - 3.5: Parse JSON response
 * - 3.6: Retry logic for malformed JSON
 * - 5.4: Log token usage
 * - 5.5: Monitor token consumption
 */
export async function generateContent(prompt: string): Promise<GeneratedContent> {
  const bedrockClient = new BedrockRuntimeClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
  });

  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: MAX_TOKENS,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const response = await bedrockClient.send(command);
    
    // Parse response and extract content
    const content = parseBedrockResponse(response);
    
    // Log token usage for monitoring
    logTokenUsage(response);
    
    return content;
  } catch (error) {
    console.error('Bedrock service error:', {
      service: 'Bedrock',
      operation: 'generateContent',
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}

/**
 * Parses Bedrock API response and extracts generated content
 * Implements retry logic for malformed JSON
 * 
 * @param response - Bedrock API response
 * @returns Parsed generated content
 * 
 * Requirements: 3.5, 3.6 - Parse JSON response with retry for malformed JSON
 */
function parseBedrockResponse(response: InvokeModelCommandOutput): GeneratedContent {
  if (!response.body) {
    throw new Error('Empty response body from Bedrock');
  }

  // Decode response body
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  // Extract text content from Claude response format
  if (!responseBody.content || !Array.isArray(responseBody.content) || responseBody.content.length === 0) {
    throw new Error('Invalid response structure from Bedrock');
  }

  const textContent = responseBody.content[0].text;
  
  // First attempt: Parse JSON directly
  try {
    return parseContentJSON(textContent);
  } catch (firstError) {
    // If it's a validation error (missing fields), don't retry - just throw
    if (firstError instanceof Error && firstError.message.includes('Missing required fields')) {
      throw firstError;
    }
    
    console.warn('First JSON parse attempt failed, trying error recovery:', {
      error: firstError instanceof Error ? firstError.message : String(firstError)
    });
    
    // Second attempt: Try to extract JSON from text (error recovery)
    try {
      return parseContentJSONWithRecovery(textContent);
    } catch (secondError) {
      console.error('JSON parsing failed after retry:', {
        error: secondError instanceof Error ? secondError.message : String(secondError),
        textContent
      });
      
      throw new Error('Failed to parse Bedrock response after retry');
    }
  }
}

/**
 * Parses JSON content directly
 * 
 * @param text - JSON text from Bedrock response
 * @returns Parsed generated content
 */
function parseContentJSON(text: string): GeneratedContent {
  const parsed = JSON.parse(text);
  
  // Validate required fields
  if (!parsed.title || !parsed.description || !parsed.condition) {
    throw new Error('Missing required fields in generated content');
  }
  
  return {
    title: String(parsed.title),
    description: String(parsed.description),
    condition: String(parsed.condition)
  };
}

/**
 * Attempts to extract and parse JSON from text with error recovery
 * Handles cases where the model includes extra text around the JSON
 * 
 * @param text - Text that may contain JSON
 * @returns Parsed generated content
 * 
 * Requirements: 3.6 - Retry with error recovery for malformed JSON
 */
function parseContentJSONWithRecovery(text: string): GeneratedContent {
  // Try to find JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('No JSON object found in response text');
  }
  
  // Parse the extracted JSON
  return parseContentJSON(jsonMatch[0]);
}

/**
 * Logs token usage from Bedrock response for monitoring
 * 
 * @param response - Bedrock API response
 * 
 * Requirements: 5.4, 5.5 - Log token usage for monitoring Free Tier consumption
 */
function logTokenUsage(response: InvokeModelCommandOutput): void {
  if (!response.body) {
    return;
  }

  try {
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.usage) {
      console.log('Bedrock token usage:', {
        service: 'Bedrock',
        operation: 'generateContent',
        inputTokens: responseBody.usage.input_tokens,
        outputTokens: responseBody.usage.output_tokens,
        totalTokens: (responseBody.usage.input_tokens || 0) + (responseBody.usage.output_tokens || 0)
      });
    }
  } catch (error) {
    // Don't fail if we can't log token usage
    console.warn('Failed to log token usage:', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
