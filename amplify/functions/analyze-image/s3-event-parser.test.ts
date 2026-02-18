import { describe, test, expect } from 'vitest';
import type { S3Event } from 'aws-lambda';
import { parseS3Event, S3EventParseError } from './s3-event-parser';

describe('S3 Event Parser', () => {
  test('extracts bucket and key from valid S3 event', () => {
    const event: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploads/test-image.jpg',
            },
          },
        } as any,
      ],
    };

    const result = parseS3Event(event);

    expect(result.bucket).toBe('test-bucket');
    expect(result.key).toBe('uploads/test-image.jpg');
  });

  test('decodes URL-encoded object keys', () => {
    const event: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploads/test%20image%20%281%29.jpg',
            },
          },
        } as any,
      ],
    };

    const result = parseS3Event(event);

    expect(result.key).toBe('uploads/test image (1).jpg');
  });

  test('handles plus signs in object keys', () => {
    const event: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploads/test+image.jpg',
            },
          },
        } as any,
      ],
    };

    const result = parseS3Event(event);

    expect(result.key).toBe('uploads/test image.jpg');
  });

  test('throws error when Records array is missing', () => {
    const event = {} as S3Event;

    expect(() => parseS3Event(event)).toThrow(S3EventParseError);
    expect(() => parseS3Event(event)).toThrow('missing or invalid Records array');
  });

  test('throws error when Records array is empty', () => {
    const event: S3Event = {
      Records: [],
    };

    expect(() => parseS3Event(event)).toThrow(S3EventParseError);
    expect(() => parseS3Event(event)).toThrow('Records array is empty');
  });

  test('throws error when s3 property is missing', () => {
    const event: S3Event = {
      Records: [
        {} as any,
      ],
    };

    expect(() => parseS3Event(event)).toThrow(S3EventParseError);
    expect(() => parseS3Event(event)).toThrow('missing s3 property');
  });

  test('throws error when bucket name is missing', () => {
    const event: S3Event = {
      Records: [
        {
          s3: {
            bucket: {} as any,
            object: {
              key: 'test.jpg',
            },
          },
        } as any,
      ],
    };

    expect(() => parseS3Event(event)).toThrow(S3EventParseError);
    expect(() => parseS3Event(event)).toThrow('missing or invalid bucket name');
  });

  test('throws error when object key is missing', () => {
    const event: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {} as any,
          },
        } as any,
      ],
    };

    expect(() => parseS3Event(event)).toThrow(S3EventParseError);
    expect(() => parseS3Event(event)).toThrow('missing or invalid object key');
  });

  test('throws error when bucket name is empty string', () => {
    const event: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: '',
            },
            object: {
              key: 'test.jpg',
            },
          },
        } as any,
      ],
    };

    expect(() => parseS3Event(event)).toThrow(S3EventParseError);
    expect(() => parseS3Event(event)).toThrow('bucket or key is empty');
  });

  test('throws error when object key is empty string', () => {
    const event: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: '',
            },
          },
        } as any,
      ],
    };

    expect(() => parseS3Event(event)).toThrow(S3EventParseError);
    expect(() => parseS3Event(event)).toThrow('bucket or key is empty');
  });
});
