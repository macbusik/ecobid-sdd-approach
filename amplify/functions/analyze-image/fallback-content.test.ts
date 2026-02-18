import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { generateFallbackContent } from './fallback-content';
import { RekognitionLabel } from './rekognition-service';

describe('Fallback Content Generator', () => {
  describe('Unit Tests', () => {
    test('generates content from empty labels array', () => {
      const result = generateFallbackContent([]);
      
      expect(result.title).toBe('Item for Sale');
      expect(result.description).toContain('Item available for pickup');
      expect(result.condition).toBe('Unknown');
    });

    test('generates title from single label', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 95.5 }
      ];
      
      const result = generateFallbackContent(labels);
      
      expect(result.title).toBe('Chair');
      expect(result.description).toContain('Chair');
    });

    test('generates title from multiple labels', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 95.5 },
        { name: 'Wooden', confidence: 89.2 },
        { name: 'Furniture', confidence: 85.0 }
      ];
      
      const result = generateFallbackContent(labels);
      
      expect(result.title).toBe('Chair, Wooden, Furniture');
      expect(result.description).toContain('Chair');
      expect(result.description).toContain('Wooden');
      expect(result.description).toContain('Furniture');
    });

    test('truncates long titles to 60 characters', () => {
      const labels: RekognitionLabel[] = [
        { name: 'VeryLongLabelNameThatExceedsTheMaximumCharacterLimit', confidence: 95.5 },
        { name: 'AnotherLongLabel', confidence: 89.2 },
        { name: 'YetAnotherLabel', confidence: 85.0 }
      ];
      
      const result = generateFallbackContent(labels);
      
      expect(result.title.length).toBeLessThanOrEqual(60);
      expect(result.title).toMatch(/\.\.\.$/);
    });

    test('estimates condition as Good for new/clean items', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 95.5 },
        { name: 'New', confidence: 89.2 }
      ];
      
      const result = generateFallbackContent(labels);
      
      expect(result.condition).toBe('Good');
    });

    test('estimates condition as Fair for used/worn items', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 95.5 },
        { name: 'Used', confidence: 89.2 }
      ];
      
      const result = generateFallbackContent(labels);
      
      expect(result.condition).toBe('Fair');
    });

    test('estimates condition as Fair for damaged items', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 95.5 },
        { name: 'Damaged', confidence: 89.2 }
      ];
      
      const result = generateFallbackContent(labels);
      
      expect(result.condition).toBe('Fair');
    });

    test('defaults condition to Good when no indicators present', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 95.5 },
        { name: 'Wooden', confidence: 89.2 }
      ];
      
      const result = generateFallbackContent(labels);
      
      expect(result.condition).toBe('Good');
    });

    test('includes all labels in description', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 95.5 },
        { name: 'Wooden', confidence: 89.2 },
        { name: 'Furniture', confidence: 85.0 },
        { name: 'Brown', confidence: 80.0 }
      ];
      
      const result = generateFallbackContent(labels);
      
      expect(result.description).toContain('Chair');
      expect(result.description).toContain('Wooden');
      expect(result.description).toContain('Furniture');
      expect(result.description).toContain('Brown');
    });

    test('description includes standard pickup text', () => {
      const labels: RekognitionLabel[] = [
        { name: 'Chair', confidence: 95.5 }
      ];
      
      const result = generateFallbackContent(labels);
      
      expect(result.description).toContain('Available for pickup');
      expect(result.description).toContain('contact for more details');
    });
  });

  describe('Property-Based Tests', () => {
    // Property 7: Fallback Content Generation
    // **Validates: Requirements 3.7**
    test('generates valid content for any non-empty label array', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              confidence: fc.float({ min: 0, max: 100 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (labels) => {
            const result = generateFallbackContent(labels);
            
            // Should always return valid content structure
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('condition');
            
            // Title should be non-empty string
            expect(typeof result.title).toBe('string');
            expect(result.title.length).toBeGreaterThan(0);
            
            // Title should not exceed 60 characters
            expect(result.title.length).toBeLessThanOrEqual(60);
            
            // Description should be non-empty string
            expect(typeof result.description).toBe('string');
            expect(result.description.length).toBeGreaterThan(0);
            
            // Condition should be one of valid values
            expect(['Good', 'Fair', 'Unknown']).toContain(result.condition);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('title length never exceeds 60 characters', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              confidence: fc.float({ min: 0, max: 100 })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (labels) => {
            const result = generateFallbackContent(labels);
            expect(result.title.length).toBeLessThanOrEqual(60);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('description always includes label information', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              confidence: fc.float({ min: 0, max: 100 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (labels) => {
            const result = generateFallbackContent(labels);
            
            // Description should contain at least one label name
            const containsLabel = labels.some(label => 
              result.description.includes(label.name)
            );
            expect(containsLabel).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('handles empty labels gracefully', () => {
      const result = generateFallbackContent([]);
      
      expect(result.title).toBe('Item for Sale');
      expect(result.description).toContain('Item available for pickup');
      expect(result.condition).toBe('Unknown');
    });

    test('condition estimation is deterministic', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              confidence: fc.float({ min: 0, max: 100 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (labels) => {
            const result1 = generateFallbackContent(labels);
            const result2 = generateFallbackContent(labels);
            
            // Same input should produce same output
            expect(result1.title).toBe(result2.title);
            expect(result1.description).toBe(result2.description);
            expect(result1.condition).toBe(result2.condition);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
