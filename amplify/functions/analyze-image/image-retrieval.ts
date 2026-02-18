import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * Error thrown when image validation fails
 */
export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/**
 * Allowed image file extensions
 */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic'];

/**
 * Maximum allowed file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validates image file extension against whitelist
 * 
 * @param key - S3 object key (file path)
 * @returns true if extension is valid
 * @throws {ImageValidationError} If extension is not in whitelist
 * 
 * Requirements: 1.3 - Validate image format (JPEG, PNG, HEIC)
 */
export function validateImageExtension(key: string): boolean {
  const lowerKey = key.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => lowerKey.endsWith(ext));
  
  if (!hasValidExtension) {
    throw new ImageValidationError(
      `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
    );
  }
  
  return true;
}

/**
 * Validates image file size
 * 
 * @param size - File size in bytes
 * @returns true if size is valid
 * @throws {ImageValidationError} If file size exceeds maximum
 * 
 * Requirements: 1.4 - Validate file size (reject >10MB)
 */
export function validateImageSize(size: number): boolean {
  if (size > MAX_FILE_SIZE) {
    throw new ImageValidationError(
      `File size ${size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (10MB)`
    );
  }
  
  return true;
}

/**
 * Retrieves image from S3 and returns as Buffer
 * 
 * @param bucket - S3 bucket name
 * @param key - S3 object key
 * @returns Image data as Buffer
 * @throws {ImageValidationError} If validation fails
 * @throws {Error} If S3 retrieval fails
 * 
 * Requirements: 1.3, 1.4 - Fetch image from S3 with validation
 */
export async function getImageFromS3(bucket: string, key: string): Promise<Buffer> {
  // Validate file extension before attempting retrieval
  validateImageExtension(key);
  
  // Create S3 client
  const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  
  try {
    // Fetch object from S3
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    const response = await s3Client.send(command);
    
    // Validate content length
    if (response.ContentLength) {
      validateImageSize(response.ContentLength);
    }
    
    // Convert stream to buffer
    if (!response.Body) {
      throw new Error('S3 response body is empty');
    }
    
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Validate actual buffer size (in case ContentLength was not provided)
    validateImageSize(buffer.length);
    
    return buffer;
  } catch (error) {
    // Re-throw validation errors as-is
    if (error instanceof ImageValidationError) {
      throw error;
    }
    
    // Wrap S3 errors with context
    throw new Error(`Failed to retrieve image from S3: ${(error as Error).message}`);
  }
}
