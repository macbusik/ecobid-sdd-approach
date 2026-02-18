# Implementation Plan: Initial Infrastructure Deployment

## Overview

This implementation plan breaks down the initial infrastructure deployment into discrete coding tasks. The approach follows a logical sequence: first enhance the CDK infrastructure code, then create the deployment automation, then add the minimal frontend, and finally create documentation. Each task builds on previous work and includes testing sub-tasks to validate correctness early.

## Tasks

- [x] 1. Enhance StorageStack with web hosting bucket
  - [x] 1.1 Add web hosting S3 bucket to StorageStack
    - Modify `infrastructure/lib/storage-stack.ts`
    - Add new S3 bucket with `websiteIndexDocument` and `websiteErrorDocument` properties
    - Configure `publicReadAccess: true` and appropriate `BlockPublicAccess` settings
    - Set `removalPolicy: DESTROY` and `autoDeleteObjects: true` for development
    - Export `webBucket` as public readonly property
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 1.2 Add CloudFormation outputs for web hosting
    - Add `CfnOutput` for website URL using `bucketWebsiteUrl`
    - Add `CfnOutput` for web bucket name with export name `EcoBidWebBucketName`
    - _Requirements: 2.4, 3.5, 3.6_
  
  - [ ]* 1.3 Write unit tests for StorageStack web hosting configuration
    - Test that web bucket is created with correct configuration
    - Test that website URL output exists
    - Test that bucket name output exists with correct export name
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Create deployment script with dependency checking
  - [x] 2.1 Create deploy.sh script with basic structure
    - Create `deploy.sh` in project root
    - Add shebang (`#!/bin/bash`) and set error handling (`set -e`, `set -o pipefail`)
    - Add color code variables for output formatting
    - Set up logging to `deployment.log` file using `tee`
    - Make script executable (`chmod +x`)
    - _Requirements: 4.1, 4.12, 9.4_
  
  - [x] 2.2 Implement dependency checking functions
    - Add `check_dependencies()` function that checks for Node.js, AWS CLI, and CDK CLI
    - For each missing dependency, display error message with installation instructions
    - Exit with non-zero status if any dependency is missing
    - _Requirements: 4.2, 4.3_
  
  - [x] 2.3 Implement AWS credentials verification
    - Add `verify_aws_credentials()` function that runs `aws sts get-caller-identity`
    - Extract and display AWS account ID and region
    - Handle case where credentials are not configured
    - Display error message with configuration instructions if credentials missing
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 2.4 Add deployment confirmation prompt
    - Display account ID, region, and deployment summary
    - Prompt user for confirmation before proceeding
    - Exit gracefully if user declines
    - _Requirements: 6.5_
  
  - [ ]* 2.5 Write property test for dependency error messages
    - **Property 6: Missing Dependency Error Messages**
    - **Validates: Requirements 4.3**
    - Test that for any missing dependency, error message includes name and instructions

- [x] 3. Implement deployment script build and deploy logic
  - [x] 3.1 Add frontend build step
    - Navigate to `frontend` directory
    - Execute `npm run build`
    - Capture exit code and display error if build fails
    - Exit script with non-zero status on build failure
    - _Requirements: 4.4, 4.5_
  
  - [x] 3.2 Add CDK deployment step
    - Navigate to `infrastructure` directory
    - Execute `cdk deploy --all --require-approval never`
    - Capture exit code and display error if deployment fails
    - Exit script with non-zero status on deployment failure
    - _Requirements: 4.6, 4.7_
  
  - [x] 3.3 Add CloudFormation output parsing
    - Extract web bucket name from CDK deployment outputs
    - Parse outputs using `aws cloudformation describe-stacks`
    - Store bucket name in variable for S3 sync
    - _Requirements: 4.8_
  
  - [x] 3.4 Add S3 sync step
    - Execute `aws s3 sync frontend/dist/ s3://$WEB_BUCKET_NAME --delete`
    - Capture exit code and display error if sync fails
    - Provide manual sync command in error message
    - Exit with non-zero status on sync failure
    - _Requirements: 4.9, 4.10_
  
  - [ ]* 3.5 Write property test for error propagation
    - **Property 3: Deployment Script Error Propagation**
    - **Validates: Requirements 4.5, 4.7, 4.10, 9.1**
    - Test that for any command failure, script exits with non-zero status

- [x] 4. Add deployment script output display and error handling
  - [x] 4.1 Implement success output display
    - Display all CloudFormation outputs (User Pool ID, Client ID, Table Name, Bucket Names, URLs)
    - Format outputs in readable table format
    - Display website URL prominently
    - Display next steps checklist
    - _Requirements: 4.11, 3.8, 10.8_
  
  - [x] 4.2 Implement error handling with trap
    - Add `trap 'handle_error $? $LINENO' ERR` to catch errors
    - Implement `handle_error()` function that displays error context
    - Display last 20 lines of deployment.log on error
    - Provide cleanup instructions (`cdk destroy --all`)
    - _Requirements: 9.1, 9.5, 9.6_
  
  - [x] 4.3 Add Free Tier warning message
    - Display warning about AWS Free Tier limits at start of deployment
    - List key limits (Lambda requests, DynamoDB storage, S3 storage, Rekognition images)
    - Recommend setting up AWS Budgets for monitoring
    - _Requirements: 8.7_
  
  - [ ]* 4.4 Write property test for output display
    - **Property 4: CloudFormation Output Display**
    - **Validates: Requirements 3.8**
    - Test that for all CloudFormation outputs, script displays name and value
  
  - [ ]* 4.5 Write property test for error log display
    - **Property 7: Error Log Display**
    - **Validates: Requirements 9.5**
    - Test that for any error, relevant log section is displayed

- [x] 5. Create minimal frontend Hello World implementation
  - [x] 5.1 Update App.tsx with Hello World component
    - Modify `frontend/src/App.tsx`
    - Create centered layout with EcoBid title
    - Add "Freecycling Made Simple" tagline
    - Add success message indicating infrastructure is deployed
    - Add "AWS Free Tier Optimized" footer
    - Use Tailwind CSS classes for styling
    - _Requirements: 5.3_
  
  - [x] 5.2 Update index.html with PWA meta tags
    - Modify `frontend/index.html`
    - Add viewport meta tag
    - Add theme-color meta tag (green: #10b981)
    - Add description meta tag
    - Ensure title is set to "EcoBid"
    - _Requirements: 5.4_
  
  - [x] 5.3 Verify Vite PWA plugin configuration
    - Check `frontend/vite.config.ts` includes `vite-plugin-pwa`
    - Ensure plugin is configured (even if minimal)
    - _Requirements: 5.5_
  
  - [ ]* 5.4 Write unit test for frontend build
    - Test that `npm run build` succeeds
    - Test that output directory is `frontend/dist`
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 5.5 Write property test for build size constraint
    - **Property 5: Frontend Build Size Constraint**
    - **Validates: Requirements 5.6**
    - Test that for any successful build, dist/ directory size < 5MB

- [x] 6. Checkpoint - Test deployment script locally
  - Run `./deploy.sh` with mocked AWS commands to verify script logic
  - Verify dependency checks work correctly
  - Verify error handling works correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 7. Write infrastructure validation property tests
  - [ ]* 7.1 Write property test for prohibited resources
    - **Property 1: No Prohibited AWS Resources**
    - **Validates: Requirements 1.7, 8.4**
    - Parse all TypeScript files in infrastructure/lib/
    - Test that no VPC or NAT Gateway constructs exist
  
  - [ ]* 7.2 Write property test for Free Tier resource configuration
    - **Property 2: Free Tier Resource Configuration**
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - Synthesize CDK app to CloudFormation template
    - Test all Lambda functions use nodejs20.x runtime
    - Test all DynamoDB tables use PAY_PER_REQUEST billing
    - Test all S3 buckets use Standard storage class
  
  - [ ]* 7.3 Write property test for RemovalPolicy configuration
    - **Property 8: RemovalPolicy Configuration**
    - **Validates: Requirements 1.8**
    - Synthesize CDK app to CloudFormation template
    - Test all stateful resources have DeletionPolicy set to Delete

- [x] 8. Create DEPLOYMENT.md documentation
  - [x] 8.1 Write prerequisites section
    - List required tools (AWS account, Node.js 18+, AWS CLI v2, CDK CLI)
    - Include installation instructions for each tool
    - Include AWS credentials configuration instructions
    - _Requirements: 10.1, 10.2_
  
  - [x] 8.2 Write deployment instructions section
    - Document step-by-step deployment process
    - Include repository clone and dependency installation
    - Include CDK bootstrap command (first time only)
    - Include deploy.sh execution
    - _Requirements: 10.3_
  
  - [x] 8.3 Write verification section
    - Document how to verify deployment succeeded
    - Include checking website URL
    - Include checking AWS Console for resources
    - Include checking CloudFormation stack status
    - _Requirements: 10.6_
  
  - [x] 8.4 Write troubleshooting section
    - Document common errors and solutions
    - Include AWS credentials issues
    - Include CDK bootstrap issues
    - Include build failures
    - Include deployment failures
    - _Requirements: 10.4_
  
  - [x] 8.5 Write frontend configuration section
    - Document how to use CloudFormation outputs
    - Explain where to add User Pool ID and Client ID in frontend code
    - Include example configuration code
    - _Requirements: 10.5_
  
  - [x] 8.6 Write cleanup section
    - Document how to destroy infrastructure
    - Include `cdk destroy --all` command
    - Warn about data loss
    - _Requirements: 10.7_

- [ ] 9. Final integration test and verification
  - [ ] 9.1 Run full deployment to test AWS account
    - Execute `./deploy.sh` in clean environment
    - Verify all CloudFormation stacks are created successfully
    - Verify website URL is accessible
    - Verify Hello World page displays correctly
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 9.2 Verify all CloudFormation outputs
    - Check that User Pool ID output exists
    - Check that User Pool Client ID output exists
    - Check that table name output exists
    - Check that bucket name outputs exist
    - Check that API URL output exists
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ] 9.3 Test cleanup process
    - Run `cd infrastructure && cdk destroy --all`
    - Verify all resources are deleted
    - Verify no orphaned resources remain
    - _Requirements: 9.6_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify deployment script works end-to-end
  - Verify documentation is complete and accurate
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- The deployment script uses bash with strict error handling (`set -e`)
- CDK synthesis can be used for testing without actual AWS deployment: `cdk synth > template.json`
- Property tests for bash scripts should use `bats-core` testing framework
- Property tests for CDK/CloudFormation should use Node.js with `fast-check` library
- Integration test (task 9.1) requires actual AWS account and will create real resources
- All CloudFormation outputs use export names for cross-stack references
- The web hosting bucket uses public read access, which is acceptable for static assets
- Free Tier limits should be monitored using AWS Budgets (not part of this implementation)
