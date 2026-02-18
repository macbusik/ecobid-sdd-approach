import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import {
  validateImageExtension,
  validateImageSize,
  getImageFromS3,
  ImageValidationError
} from './image-retrieval';

const s3Mock = mockClient(S3Client);

describe('Image Retrieval Module', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  describe('validateImageExtension', () => {
    it('should accept .jpg extension', () => {
      expect(validateImageExtension('photo.jpg')).toBe(true);
    });

    it('should accept .jpeg extension', () => {
      expect(validateImageExtension('photo.jpeg')).toBe(true);
    });

    it('should accept .png extension', () => {
      expect(validateImageExtension('photo.png')).toBe(true);
    });

    it('should accept .heic extension', () => {
      expect(validateImageExtension('photo.heic')).toBe(true);
    });

    it('should accept uppercase extensions', () => {
      expect(validateImageExtension('photo.JPG')).toBe(true);
      expect(validateImageExtension('photo.PNG')).toBe(true);
    });

    it('should accept mixed case extensions', () => {
      expect(validateImageExtension('photo.JpG')).toBe(true);
    });

    it('should accept files with paths', () => {
      expect(validateImageExtension('uploads/user123/photo.jpg')).toBe(true);
    });

    it('should reject .gif extension', () => {
      expect(() => validateImageExtension('photo.gif')).toThrow(ImageValidationError);
    });

    it('should reject .bmp extension', () => {
      expect(() => validateImageExtension('photo.bmp')).toThrow(ImageValidationError);
    });

    it('should reject .webp extension', () => {
      expect(() => validateImageExtension('photo.webp')).toThrow(ImageValidationError);
    });

    it('should reject files without extension', () => {
      expect(() => validateImageExtension('photo')).toThrow(ImageValidationError);
    });

    it('should reject .txt extension', () => {
      expect(() => validateImageExtension('file.txt')).toThrow(ImageValidationError);
    });

    it('should include allowed extensions in error message', () => {
      try {
        validateImageExtension('photo.gif');
      } catch (error) {
        expect((error as Error).message).toContain('.jpg');
        expect((error as Error).message).toContain('.jpeg');
        expect((error as Error).message).toContain('.png');
        expect((error as Error).message).toContain('.heic');
      }
    });
  });

  describe('validateImageSize', () => {
    it('should accept file size of 1MB', () => {
      const size = 1 * 1024 * 1024;
      expect(validateImageSize(size)).toBe(true);
    });

    it('should accept file size of 5MB', () => {
      const size = 5 * 1024 * 1024;
      expect(validateImageSize(size)).toBe(true);
    });

    it('should accept file size exactly at 10MB limit', () => {
      const size = 10 * 1024 * 1024;
      expect(validateImageSize(size)).toBe(true);
    });

    it('should accept very small files', () => {
      expect(validateImageSize(1024)).toBe(true);
    });

    it('should reject file size of 11MB', () => {
      const size = 11 * 1024 * 1024;
      expect(() => validateImageSize(size)).toThrow(ImageValidationError);
    });

    it('should reject file size of 20MB', () => {
      const size = 20 * 1024 * 1024;
      expect(() => validateImageSize(size)).toThrow(ImageValidationError);
    });

    it('should reject file size just over 10MB', () => {
      const size = 10 * 1024 * 1024 + 1;
      expect(() => validateImageSize(size)).toThrow(ImageValidationError);
    });

    it('should include file size in error message', () => {
      const size = 15 * 1024 * 1024;
      try {
        validateImageSize(size);
      } catch (error) {
        expect((error as Error).message).toContain(size.toString());
        expect((error as Error).message).toContain('10MB');
      }
    });
  });

  describe('getImageFromS3', () => {
    it('should successfully retrieve valid image', async () => {
      const mockImageData = Buffer.from('fake-image-data');
      const mockStream = Readable.from([mockImageData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
        ContentLength: mockImageData.length
      });

      const result = await getImageFromS3('test-bucket', 'uploads/photo.jpg');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('fake-image-data');
    });

    it('should call S3 with correct parameters', async () => {
      const mockStream = Readable.from([Buffer.from('data')]);
      
      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
        ContentLength: 100
      });

      await getImageFromS3('my-bucket', 'path/to/image.png');

      const calls = s3Mock.commandCalls(GetObjectCommand);
      expect(calls.length).toBe(1);
      expect(calls[0].args[0].input).toEqual({
        Bucket: 'my-bucket',
        Key: 'path/to/image.png'
      });
    });

    it('should reject invalid file extension before S3 call', async () => {
      await expect(
        getImageFromS3('test-bucket', 'file.txt')
      ).rejects.toThrow(ImageValidationError);

      // S3 should not be called
      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(0);
    });

    it('should reject file size over 10MB', async () => {
      const largeSize = 15 * 1024 * 1024;
      const mockStream = Readable.from([Buffer.alloc(100)]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
        ContentLength: largeSize
      });

      await expect(
        getImageFromS3('test-bucket', 'large.jpg')
      ).rejects.toThrow(ImageValidationError);
    });

    it('should validate actual buffer size when ContentLength not provided', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      const mockStream = Readable.from([largeBuffer]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any
        // No ContentLength
      });

      await expect(
        getImageFromS3('test-bucket', 'photo.jpg')
      ).rejects.toThrow(ImageValidationError);
    });

    it('should handle S3 errors gracefully', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('Access Denied'));

      await expect(
        getImageFromS3('test-bucket', 'photo.jpg')
      ).rejects.toThrow('Failed to retrieve image from S3');
    });

    it('should handle missing response body', async () => {
      s3Mock.on(GetObjectCommand).resolves({
        Body: undefined,
        ContentLength: 100
      });

      await expect(
        getImageFromS3('test-bucket', 'photo.jpg')
      ).rejects.toThrow('S3 response body is empty');
    });

    it('should handle multiple chunks from stream', async () => {
      const chunk1 = Buffer.from('part1');
      const chunk2 = Buffer.from('part2');
      const chunk3 = Buffer.from('part3');
      const mockStream = Readable.from([chunk1, chunk2, chunk3]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
        ContentLength: chunk1.length + chunk2.length + chunk3.length
      });

      const result = await getImageFromS3('test-bucket', 'photo.jpg');
      
      expect(result.toString()).toBe('part1part2part3');
    });

    it('should accept all valid image extensions', async () => {
      const mockStream = Readable.from([Buffer.from('data')]);
      
      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
        ContentLength: 100
      });

      const extensions = ['.jpg', '.jpeg', '.png', '.heic'];
      
      for (const ext of extensions) {
        s3Mock.reset();
        s3Mock.on(GetObjectCommand).resolves({
          Body: Readable.from([Buffer.from('data')]) as any,
          ContentLength: 100
        });
        
        await expect(
          getImageFromS3('test-bucket', `photo${ext}`)
        ).resolves.toBeInstanceOf(Buffer);
      }
    });

    it('should use AWS_REGION environment variable', async () => {
      const originalRegion = process.env.AWS_REGION;
      process.env.AWS_REGION = 'us-west-2';

      const mockStream = Readable.from([Buffer.from('data')]);
      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
        ContentLength: 100
      });

      await getImageFromS3('test-bucket', 'photo.jpg');

      // Restore original
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      } else {
        delete process.env.AWS_REGION;
      }
    });
  });
});
