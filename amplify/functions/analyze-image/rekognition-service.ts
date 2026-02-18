import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';

/**
 * Detected label with name and confidence score
 */
export interface RekognitionLabel {
  name: string;
  confidence: number;
}

/**
 * Minimum confidence threshold for label detection (70%)
 * Requirements: 2.2 - Request minimum confidence threshold of 70%
 */
const MIN_CONFIDENCE = 70;

/**
 * Maximum number of labels to return
 * Requirements: 2.2 - Request top 10 labels
 */
const MAX_LABELS = 10;

/**
 * Detects labels in an image using Amazon Rekognition
 * 
 * @param imageBuffer - Image data as Buffer
 * @returns Array of detected labels with confidence scores
 * 
 * Requirements:
 * - 2.1: Call Rekognition detectLabels API
 * - 2.2: Use 70% confidence threshold and max 10 labels
 * - 2.3: Extract label names and confidence scores
 * - 2.5: Handle service failures gracefully (return empty array)
 */
export async function detectLabels(imageBuffer: Buffer): Promise<RekognitionLabel[]> {
  const rekognitionClient = new RekognitionClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
  });

  try {
    const command = new DetectLabelsCommand({
      Image: {
        Bytes: imageBuffer
      },
      MinConfidence: MIN_CONFIDENCE,
      MaxLabels: MAX_LABELS
    });

    const response = await rekognitionClient.send(command);

    // Extract labels from response
    if (!response.Labels || response.Labels.length === 0) {
      return [];
    }

    // Map to our interface format
    const labels: RekognitionLabel[] = response.Labels
      .filter(label => label.Name && label.Confidence !== undefined)
      .map(label => ({
        name: label.Name!,
        confidence: label.Confidence!
      }));

    return labels;
  } catch (error) {
    // Log error and continue with empty array (graceful degradation)
    console.error('Rekognition service error:', {
      service: 'Rekognition',
      operation: 'detectLabels',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return [];
  }
}

/**
 * Filters and sorts labels by confidence, returning top N labels
 * 
 * @param labels - Array of labels with confidence scores
 * @param topN - Number of top labels to return (default: 10)
 * @returns Top N labels sorted by confidence in descending order
 * 
 * Requirements: 2.4 - Select top 10 labels by confidence score
 */
export function selectTopLabels(
  labels: RekognitionLabel[], 
  topN: number = MAX_LABELS
): RekognitionLabel[] {
  if (labels.length <= topN) {
    // Sort by confidence descending
    return [...labels].sort((a, b) => b.confidence - a.confidence);
  }

  // Sort by confidence descending and take top N
  return [...labels]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topN);
}
