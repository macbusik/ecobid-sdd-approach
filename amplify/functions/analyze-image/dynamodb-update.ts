import { 
  DynamoDBClient, 
  UpdateItemCommand,
  UpdateItemCommandInput 
} from '@aws-sdk/client-dynamodb';

/**
 * Item update data structure
 */
export interface ItemUpdate {
  itemId: string;
  aiTags: string[];
  aiDescription: string;
  aiConditionAssessment: string;
}

/**
 * Retry configuration for exponential backoff
 * Requirements: 4.6 - Implement retry logic with exponential backoff (3 retries: 100ms, 200ms, 400ms)
 */
const RETRY_DELAYS = [100, 200, 400]; // milliseconds
const MAX_RETRIES = 3;

/**
 * Updates DynamoDB Item record with AI-generated metadata
 * 
 * @param update - Item update data with AI-generated content
 * @returns Promise that resolves when update is successful
 * @throws Error if all retry attempts fail
 * 
 * Requirements:
 * - 4.1: Update Item_Record in DynamoDB
 * - 4.2: Set aiTags field to array of detected labels
 * - 4.3: Set aiDescription field to generated description
 * - 4.4: Set aiConditionAssessment field to generated condition
 * - 4.5: Change status field from Draft_Status to Review_Status
 * - 4.6: Retry up to 3 times with exponential backoff
 * - 4.7: Throw exception if all retries fail
 */
export async function updateItemRecord(update: ItemUpdate): Promise<void> {
  const dynamodbClient = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
  });

  const command = buildUpdateCommand(update);
  
  let lastError: Error | undefined;
  
  // Initial attempt + retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await dynamodbClient.send(command);
      
      console.log('DynamoDB update successful:', {
        service: 'DynamoDB',
        operation: 'updateItemRecord',
        itemId: update.itemId,
        attempt: attempt + 1
      });
      
      return; // Success - exit function
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.warn('DynamoDB update failed:', {
        service: 'DynamoDB',
        operation: 'updateItemRecord',
        itemId: update.itemId,
        attempt: attempt + 1,
        error: lastError.message
      });
      
      // If this was the last attempt, don't wait
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt];
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  // All retries failed
  console.error('DynamoDB update failed after all retries:', {
    service: 'DynamoDB',
    operation: 'updateItemRecord',
    itemId: update.itemId,
    totalAttempts: MAX_RETRIES + 1,
    error: lastError?.message
  });
  
  throw new Error(`Failed to update item ${update.itemId} after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

/**
 * Builds DynamoDB UpdateItemCommand with generated content
 * 
 * @param update - Item update data
 * @returns UpdateItemCommand ready to execute
 * 
 * Requirements:
 * - 4.2: Map aiTags to DynamoDB attribute
 * - 4.3: Map aiDescription to DynamoDB attribute
 * - 4.4: Map aiConditionAssessment to DynamoDB attribute
 * - 4.5: Set status field to 'REVIEW'
 */
function buildUpdateCommand(update: ItemUpdate): UpdateItemCommand {
  const tableName = process.env.ITEM_TABLE_NAME;
  
  if (!tableName) {
    throw new Error('ITEM_TABLE_NAME environment variable is not set');
  }
  
  const input: UpdateItemCommandInput = {
    TableName: tableName,
    Key: {
      id: { S: update.itemId }
    },
    UpdateExpression: 'SET aiTags = :tags, aiDescription = :desc, aiConditionAssessment = :cond, #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status' // 'status' is a reserved word in DynamoDB
    },
    ExpressionAttributeValues: {
      ':tags': { L: update.aiTags.map(tag => ({ S: tag })) },
      ':desc': { S: update.aiDescription },
      ':cond': { S: update.aiConditionAssessment },
      ':status': { S: 'REVIEW' }
    }
  };
  
  return new UpdateItemCommand(input);
}

/**
 * Sleep utility for exponential backoff
 * 
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
