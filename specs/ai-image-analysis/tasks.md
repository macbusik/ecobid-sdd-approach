# Implementation Plan: AI Image Analysis

## Overview

This implementation plan breaks down the AI Image Analysis feature into discrete coding tasks. The approach follows an incremental build pattern: set up infrastructure and core modules first, implement AI service integrations, add error handling and logging, then wire everything together. Each task builds on previous work to ensure no orphaned code.

## Tasks

- [x] 1. Set up Lambda function infrastructure and dependencies
  - Create `amplify/functions/analyze-image/resource.ts` with function definition
  - Create `amplify/functions/analyze-image/handler.ts` with basic handler structure
  - Add AWS SDK dependencies: `@aws-sdk/client-rekognition`, `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-s3`, `@aws-sdk/client-dynamodb`
  - Configure function in `amplify/backend.ts` with IAM permissions
  - Set up S3 trigger for image uploads
  - _Requirements: 1.1, 6.1, 6.2, 6.3, 6.4_

- [x] 2. Implement S3 event parsing and image retrieval
  - [x] 2.1 Create S3 event parser module
    - Write function to extract bucket name and object key from S3Event
    - Add validation for event structure
    - _Requirements: 1.2_
  
  - [ ]* 2.2 Write property test for S3 event parsing
    - **Property 1: S3 Event Parsing Correctness**
    - **Validates: Requirements 1.2**
  
  - [x] 2.3 Create image retrieval module
    - Write function to fetch image from S3 using GetObjectCommand
    - Add file extension validation (whitelist: .jpg, .jpeg, .png, .heic)
    - Add file size validation (reject >10MB)
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 2.4 Write property test for invalid file type rejection
    - **Property 2: Invalid File Type Rejection**
    - **Validates: Requirements 1.3**

- [x] 3. Implement Rekognition service integration
  - [x] 3.1 Create Rekognition service module
    - Write function to call DetectLabelsCommand with image buffer
    - Set MinConfidence to 70% and MaxLabels to 10
    - Implement label extraction from API response
    - Add error handling for service failures (continue with empty array)
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [ ]* 3.2 Write unit test for Rekognition API configuration
    - Test that MinConfidence is set to 70
    - Test that MaxLabels is set to 10
    - _Requirements: 2.2_
  
  - [ ]* 3.3 Write property test for label extraction
    - **Property 3: Label Extraction Correctness**
    - **Validates: Requirements 2.3**
  
  - [x] 3.4 Implement top-N label selection logic
    - Write function to filter and sort labels by confidence
    - Return top 10 labels when more than 10 are detected
    - _Requirements: 2.4_
  
  - [ ]* 3.5 Write property test for top-N label selection
    - **Property 4: Top-N Label Selection**
    - **Validates: Requirements 2.4**
  
  - [ ]* 3.6 Write unit test for Rekognition error handling
    - Test that service failures result in empty labels array
    - Test that errors are logged correctly
    - _Requirements: 2.5_

- [ ] 4. Checkpoint - Ensure Rekognition integration works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Bedrock service integration
  - [x] 5.1 Create prompt construction module
    - Write function to build prompt from label array
    - Include instructions for title, description, and condition generation
    - Include example JSON output format in prompt
    - Ensure prompt stays under 200 tokens
    - _Requirements: 3.1, 3.2, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 5.2 Write property test for prompt construction
    - **Property 5: Prompt Construction Completeness**
    - **Validates: Requirements 3.1, 3.2, 8.1, 8.2, 8.3, 8.4, 8.5**
  
  - [ ]* 5.3 Write property test for prompt token limit
    - **Property 9: Prompt Token Limit**
    - **Validates: Requirements 5.3**
  
  - [x] 5.4 Create Bedrock service module
    - Write function to call InvokeModelCommand with Claude 3 Haiku
    - Set model ID to `anthropic.claude-3-haiku-20240307-v1:0`
    - Set max_tokens to 500
    - Implement JSON response parsing
    - Add retry logic for malformed JSON (1 retry with error recovery)
    - Log token usage for monitoring
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 5.4, 5.5_
  
  - [ ]* 5.5 Write unit tests for Bedrock API configuration
    - Test that correct model ID is used
    - Test that max_tokens is set to 500
    - Test that token usage is logged
    - _Requirements: 3.3, 3.4, 5.4, 5.5_
  
  - [ ]* 5.6 Write property test for Bedrock response parsing
    - **Property 6: Bedrock Response Parsing**
    - **Validates: Requirements 3.5**
  
  - [ ]* 5.7 Write unit test for malformed JSON handling
    - Test retry logic when JSON parsing fails
    - _Requirements: 3.6_
  
  - [x] 5.8 Create fallback content generator
    - Write function to generate title, description, condition from labels
    - Use simple template-based approach (e.g., "Item: [label1], [label2]")
    - _Requirements: 3.7_
  
  - [ ]* 5.9 Write property test for fallback content generation
    - **Property 7: Fallback Content Generation**
    - **Validates: Requirements 3.7**

- [ ] 6. Checkpoint - Ensure Bedrock integration works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement DynamoDB update module
  - [x] 7.1 Create DynamoDB update module
    - Write function to build UpdateItemCommand with generated content
    - Map aiTags, aiDescription, aiConditionAssessment to DynamoDB attributes
    - Set status field to 'REVIEW'
    - Implement retry logic with exponential backoff (3 retries: 100ms, 200ms, 400ms)
    - Throw exception if all retries fail
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 7.2 Write property test for DynamoDB update mapping
    - **Property 8: DynamoDB Update Mapping**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  
  - [ ]* 7.3 Write unit test for status transition
    - Test that status is set to 'REVIEW'
    - _Requirements: 4.5_
  
  - [ ]* 7.4 Write unit tests for retry logic
    - Test that retries occur with exponential backoff
    - Test that exception is thrown after 3 failed retries
    - _Requirements: 4.6, 4.7_

- [x] 8. Implement error handling and logging
  - [x] 8.1 Create structured logging module
    - Write function to log errors with service name, operation, and details
    - Write function to log info messages with metadata
    - Ensure all logs are valid JSON format
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 8.2 Write property test for error logging completeness
    - **Property 10: Error Logging Completeness**
    - **Validates: Requirements 7.1**
  
  - [ ]* 8.3 Write property test for structured log format
    - **Property 11: Structured Log Format**
    - **Validates: Requirements 7.5**
  
  - [ ]* 8.4 Write unit tests for logging scenarios
    - Test startup logging (image key and timestamp)
    - Test completion logging (metadata and duration)
    - Test error logging (full stack trace)
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 9. Wire all modules together in main handler
  - [x] 9.1 Implement main orchestration logic
    - Parse S3 event and extract bucket/key
    - Log processing start with image key and timestamp
    - Call image retrieval module
    - Call Rekognition service module
    - Call Bedrock service module (with fallback on failure)
    - Call DynamoDB update module
    - Log processing completion with metadata and duration
    - Implement top-level error handling with logging
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.2, 7.3, 7.4_
  
  - [ ]* 9.2 Write integration tests for end-to-end flow
    - Test successful processing path with mocked AWS services
    - Test error paths (S3 failure, Rekognition failure, Bedrock failure, DynamoDB failure)
    - Test graceful degradation (AI services fail but processing continues)
    - _Requirements: All_

- [x] 10. Configure infrastructure and permissions
  - [x] 10.1 Update amplify/backend.ts with complete configuration
    - Add IAM policy for rekognition:DetectLabels
    - Add IAM policy for bedrock:InvokeModel (scoped to Claude 3 Haiku)
    - Add IAM policy for s3:GetObject (scoped to uploads prefix)
    - Add IAM policy for dynamodb:UpdateItem (scoped to Item table)
    - Configure S3 event notification to trigger Lambda
    - Set Lambda timeout to 10 seconds
    - Set Lambda memory to 512 MB
    - Add environment variables (AWS_REGION, ITEM_TABLE_NAME, STORAGE_BUCKET_NAME, BEDROCK_MODEL_ID)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 10.2 Create resource.ts for function definition
    - Define function using Amplify Gen 2 defineFunction
    - Export function for use in backend.ts
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 11. Final checkpoint - End-to-end validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- AWS SDK v3 clients should be mocked using `aws-sdk-client-mock` for testing
- All code uses TypeScript with Node.js 20.x runtime
- Infrastructure is defined using Amplify Gen 2 patterns (not raw CDK)
