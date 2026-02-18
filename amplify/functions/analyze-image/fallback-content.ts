import { RekognitionLabel } from './rekognition-service';
import { GeneratedContent } from './bedrock-service';

/**
 * Generates fallback content when Bedrock service fails
 * Uses simple template-based approach with detected labels
 * 
 * @param labels - Array of detected labels from Rekognition
 * @returns Generated title, description, and condition
 * 
 * Requirements: 3.7 - Use fallback values based on detected labels when Bedrock fails
 */
export function generateFallbackContent(labels: RekognitionLabel[]): GeneratedContent {
  // Handle empty labels case
  if (!labels || labels.length === 0) {
    return {
      title: 'Item for Sale',
      description: 'Item available for pickup. Please contact for more details.',
      condition: 'Unknown'
    };
  }

  // Generate title from top labels
  const title = generateTitle(labels);
  
  // Generate description from labels
  const description = generateDescription(labels);
  
  // Estimate condition from labels
  const condition = estimateCondition(labels);

  return {
    title,
    description,
    condition
  };
}

/**
 * Generates a title from detected labels
 * Format: "Label1, Label2" or "Label1" (max 60 characters)
 * 
 * @param labels - Array of detected labels
 * @returns Generated title
 */
function generateTitle(labels: RekognitionLabel[]): string {
  // Take top 3 labels for title
  const topLabels = labels.slice(0, 3).map(l => l.name);
  
  // Join with commas
  let title = topLabels.join(', ');
  
  // Truncate if too long (max 60 characters)
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }
  
  return title;
}

/**
 * Generates a description from detected labels
 * Format: "Item: [label1], [label2], [label3]. Available for pickup."
 * 
 * @param labels - Array of detected labels
 * @returns Generated description
 */
function generateDescription(labels: RekognitionLabel[]): string {
  const labelNames = labels.map(l => l.name).join(', ');
  
  return `Item: ${labelNames}. Available for pickup. Please contact for more details about condition and availability.`;
}

/**
 * Estimates item condition based on detected labels
 * Looks for condition-related keywords in labels
 * 
 * @param labels - Array of detected labels
 * @returns Estimated condition
 */
function estimateCondition(labels: RekognitionLabel[]): string {
  const labelNames = labels.map(l => l.name.toLowerCase());
  
  // Check for condition indicators in labels
  const goodIndicators = ['new', 'clean', 'pristine', 'excellent'];
  const fairIndicators = ['used', 'worn', 'vintage', 'old'];
  const poorIndicators = ['damaged', 'broken', 'torn', 'scratched'];
  
  // Check for poor condition indicators
  if (poorIndicators.some(indicator => labelNames.some(label => label.includes(indicator)))) {
    return 'Fair';
  }
  
  // Check for good condition indicators
  if (goodIndicators.some(indicator => labelNames.some(label => label.includes(indicator)))) {
    return 'Good';
  }
  
  // Check for fair condition indicators
  if (fairIndicators.some(indicator => labelNames.some(label => label.includes(indicator)))) {
    return 'Fair';
  }
  
  // Default to Good if no indicators found
  return 'Good';
}
