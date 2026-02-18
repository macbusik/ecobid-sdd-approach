import type { S3Event } from 'aws-lambda';

/**
 * Parsed S3 event data containing bucket and object information
 */
export interface S3EventData {
  bucket: string;
  key: string;
}

/**
 * Error thrown when S3 event structure is invalid
 */
export class S3EventParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'S3EventParseError';
  }
}

/**
 * Extracts bucket name and object key from S3 event
 * 
 * @param event - S3 event from Lambda trigger
 * @returns Parsed bucket name and object key
 * @throws {S3EventParseError} If event structure is invalid
 * 
 * Requirements: 1.2 - Extract S3 object key and bucket name from event
 */
export function parseS3Event(event: S3Event): S3EventData {
  // Validate event has Records array
  if (!event.Records || !Array.isArray(event.Records)) {
    throw new S3EventParseError('Invalid S3 event: missing or invalid Records array');
  }

  // Validate at least one record exists
  if (event.Records.length === 0) {
    throw new S3EventParseError('Invalid S3 event: Records array is empty');
  }

  const record = event.Records[0];

  // Validate record has s3 property
  if (!record.s3) {
    throw new S3EventParseError('Invalid S3 event: missing s3 property in record');
  }

  // Validate bucket information
  if (!record.s3.bucket || typeof record.s3.bucket.name !== 'string') {
    throw new S3EventParseError('Invalid S3 event: missing or invalid bucket name');
  }

  // Validate object information
  if (!record.s3.object || typeof record.s3.object.key !== 'string') {
    throw new S3EventParseError('Invalid S3 event: missing or invalid object key');
  }

  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  // Validate extracted values are non-empty
  if (!bucket || !key) {
    throw new S3EventParseError('Invalid S3 event: bucket or key is empty');
  }

  return { bucket, key };
}
