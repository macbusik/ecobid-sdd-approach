import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { constructPrompt, RekognitionLabel } from './prompt-constructor';

describe('Prompt Constructor', () => {
  // Unit Tests - Specific examples and edge cases
  
  test('constructs prompt with single label', () => {
    const labels: RekognitionLabel[] = [
      { name: 'Chair', confidence: 95.5 }
    ];
    
    const prompt = constructPrompt(labels);
    
    expect(prompt).toContain('Chair');
    expect(prompt).toContain('title');
    expect(prompt).toContain('description');
    expect(prompt).toContain('condition');
  });

  test('constructs prompt with multiple labels', () => {
    const labels: RekognitionLabel[] = [
      { name: 'Chair', confidence: 95.5 },
      { name: 'Wooden', confidence: 89.2 },
      { name: 'Furniture', confidence: 87.1 }
    ];
    
    const prompt = constructPrompt(labels);
    
    expect(prompt).toContain('Chair, Wooden, Furniture');
  });

  test('constructs prompt with empty labels array', () => {
    const labels: RekognitionLabel[] = [];
    
    const prompt = constructPrompt(labels);
    
    expect(prompt).toContain('Detected objects:');
    expect(prompt).toContain('title');
    expect(prompt).toContain('description');
    expect(prompt).toContain('condition');
  });

  test('includes example JSON output format', () => {
    const labels: RekognitionLabel[] = [
      { name: 'Chair', confidence: 95.5 }
    ];
    
    const prompt = constructPrompt(labels);
    
    expect(prompt).toContain('Example output:');
    expect(prompt).toContain('"title":');
    expect(prompt).toContain('"description":');
    expect(prompt).toContain('"condition":');
  });

  test('includes instructions for title generation', () => {
    const labels: RekognitionLabel[] = [
      { name: 'Chair', confidence: 95.5 }
    ];
    
    const prompt = constructPrompt(labels);
    
    expect(prompt).toContain('concise, appealing title');
    expect(prompt).toContain('max 60 characters');
  });

  test('includes instructions for description generation', () => {
    const labels: RekognitionLabel[] = [
      { name: 'Chair', confidence: 95.5 }
    ];
    
    const prompt = constructPrompt(labels);
    
    expect(prompt).toContain('detailed, honest description');
    expect(prompt).toContain('2-3 sentences');
  });

  test('includes instructions for condition assessment', () => {
    const labels: RekognitionLabel[] = [
      { name: 'Chair', confidence: 95.5 }
    ];
    
    const prompt = constructPrompt(labels);
    
    expect(prompt).toContain('condition');
    expect(prompt).toContain('Excellent');
    expect(prompt).toContain('Good');
    expect(prompt).toContain('Fair');
    expect(prompt).toContain('Poor');
  });

  test('requests JSON-formatted output', () => {
    const labels: RekognitionLabel[] = [
      { name: 'Chair', confidence: 95.5 }
    ];
    
    const prompt = constructPrompt(labels);
    
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('Respond ONLY with valid JSON');
  });

  test('prompt stays under 200 tokens with 10 labels', () => {
    const labels: RekognitionLabel[] = [
      { name: 'Chair', confidence: 95.5 },
      { name: 'Wooden', confidence: 92.3 },
      { name: 'Furniture', confidence: 89.1 },
      { name: 'Indoor', confidence: 87.4 },
      { name: 'Seat', confidence: 85.2 },
      { name: 'Brown', confidence: 83.7 },
      { name: 'Vintage', confidence: 81.5 },
      { name: 'Classic', confidence: 79.8 },
      { name: 'Antique', confidence: 77.2 },
      { name: 'Hardwood', confidence: 75.6 }
    ];
    
    const prompt = constructPrompt(labels);
    
    // Rough token estimation: ~4 characters per token
    const estimatedTokens = prompt.length / 4;
    expect(estimatedTokens).toBeLessThan(200);
  });

  // Property-Based Tests
  
  /**
   * Feature: ai-image-analysis
   * Property 5: Prompt Construction Completeness
   * 
   * For any non-empty array of detected labels, the prompt constructor should 
   * generate a prompt that includes all label names and requests all three 
   * required fields (title, description, condition).
   * 
   * **Validates: Requirements 3.1, 3.2, 8.1, 8.2, 8.3, 8.4, 8.5**
   */
  test('Property 5: prompt includes all labels and required fields', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            confidence: fc.float({ min: 70, max: 100 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (labels) => {
          const prompt = constructPrompt(labels);
          
          // All label names should be included in the prompt
          labels.forEach(label => {
            expect(prompt).toContain(label.name);
          });
          
          // Prompt should request all three required fields
          expect(prompt).toContain('title');
          expect(prompt).toContain('description');
          expect(prompt).toContain('condition');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: ai-image-analysis
   * Property 9: Prompt Token Limit
   * 
   * For any array of labels (up to 10 labels), the generated prompt should 
   * contain fewer than 200 tokens to stay within cost constraints.
   * 
   * **Validates: Requirements 5.3**
   */
  test('Property 9: prompt stays under 200 tokens', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            confidence: fc.float({ min: 70, max: 100 })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (labels) => {
          const prompt = constructPrompt(labels);
          
          // Rough token estimation: ~4 characters per token
          // This is conservative; actual tokenization may vary
          const estimatedTokens = prompt.length / 4;
          expect(estimatedTokens).toBeLessThan(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: prompt is always non-empty string', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            confidence: fc.float({ min: 70, max: 100 })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (labels) => {
          const prompt = constructPrompt(labels);
          
          expect(typeof prompt).toBe('string');
          expect(prompt.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: prompt always includes example JSON format', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            confidence: fc.float({ min: 70, max: 100 })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (labels) => {
          const prompt = constructPrompt(labels);
          
          expect(prompt).toContain('Example output:');
          expect(prompt).toContain('{');
          expect(prompt).toContain('}');
        }
      ),
      { numRuns: 100 }
    );
  });
});
