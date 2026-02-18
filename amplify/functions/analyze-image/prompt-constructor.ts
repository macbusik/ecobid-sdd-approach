/**
 * Prompt Construction Module
 * 
 * Builds prompts for Amazon Bedrock (Claude 3 Haiku) to generate item metadata
 * from detected labels. Ensures prompts stay under 200 tokens for cost optimization.
 */

export interface RekognitionLabel {
  name: string;
  confidence: number;
}

/**
 * Constructs a prompt for Bedrock to generate item listing metadata.
 * 
 * @param labels - Array of detected labels from Rekognition
 * @returns Formatted prompt string requesting title, description, and condition
 * 
 * Requirements: 3.1, 3.2, 8.1, 8.2, 8.3, 8.4, 8.5
 */
export function constructPrompt(labels: RekognitionLabel[]): string {
  const labelNames = labels.map(l => l.name).join(', ');
  
  const prompt = `You are an expert at creating appealing marketplace listings. Based on the following objects detected in an image, generate a listing.

Detected objects: ${labelNames}

Generate a JSON response with:
1. "title": A concise, appealing title (max 60 characters)
2. "description": A detailed, honest description (2-3 sentences)
3. "condition": Assessment of condition ("Excellent", "Good", "Fair", or "Poor")

Example output:
{
  "title": "Vintage Wooden Chair - Classic Design",
  "description": "Beautiful wooden chair with classic design. Shows minor wear consistent with age but structurally sound. Perfect for a reading nook or dining room.",
  "condition": "Good"
}

Respond ONLY with valid JSON:`;

  return prompt;
}
