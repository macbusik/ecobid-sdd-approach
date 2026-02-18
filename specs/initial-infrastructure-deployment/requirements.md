# Requirements Document

## Introduction

This feature establishes the initial AWS infrastructure deployment for the EcoBid platform. It implements a "Deployment First" strategy to verify AWS credentials, validate Free Tier compliance, and establish a working deployment pipeline. The deployment includes core infrastructure components (Cognito, DynamoDB, S3) and a minimal React PWA accessible via public AWS URL.

## Glossary

- **CDK (Cloud Development Kit)**: AWS Infrastructure as Code framework using TypeScript
- **OAC (Origin Access Control)**: AWS mechanism for securing S3 content delivery through CloudFront
- **PAY_PER_REQUEST**: DynamoDB billing mode that charges per API call (Free Tier: 25 GB storage, 2.5M read/write requests)
- **Deployment_Script**: Automated bash script that builds frontend and deploys infrastructure
- **CloudFormation**: AWS service that provisions infrastructure from CDK templates
- **Free_Tier**: AWS usage limits that incur no charges (Lambda: 400k GB-seconds, DynamoDB: 25GB, Rekognition: 5k images/month)
- **Web_Hosting_Bucket**: S3 bucket configured to serve the React PWA static files

## Requirements

### Requirement 1: Infrastructure Code Review and Validation

**User Story:** As a developer, I want to review and validate existing CDK infrastructure code, so that I can ensure it meets deployment requirements and Free Tier constraints.

#### Acceptance Criteria

1. WHEN reviewing the AuthStack, THE System SHALL verify Cognito User Pool configuration includes email sign-in, nickname attribute, and custom city/zipCode attributes
2. WHEN reviewing the DatabaseStack, THE System SHALL verify the ecobid-items table uses PAY_PER_REQUEST billing mode
3. WHEN reviewing the DatabaseStack, THE System SHALL verify DynamoDB streams are enabled on ecobid-items table for the matching engine
4. WHEN reviewing the StorageStack, THE System SHALL verify S3 bucket includes CORS configuration for web uploads
5. WHEN reviewing the StorageStack, THE System SHALL verify S3 lifecycle policy expires objects after 30 days
6. WHEN reviewing the StorageStack, THE System SHALL verify Rekognition Lambda handler has DetectLabels permissions
7. WHEN reviewing all stacks, THE System SHALL verify no VPC or NAT Gateway resources are defined
8. WHEN reviewing all stacks, THE System SHALL verify RemovalPolicy is set to DESTROY for development resources

### Requirement 2: S3 Web Hosting Configuration

**User Story:** As a developer, I want S3 configured for web hosting with appropriate access controls, so that the React app is publicly accessible while staying within Free Tier limits.

#### Acceptance Criteria

1. THE StorageStack SHALL create a separate Web_Hosting_Bucket for serving the React PWA
2. WHEN configuring the Web_Hosting_Bucket, THE System SHALL enable static website hosting with index.html as the index document
3. WHEN configuring the Web_Hosting_Bucket, THE System SHALL set public read access using bucket policy
4. WHEN configuring the Web_Hosting_Bucket, THE System SHALL output the website URL as a CloudFormation output
5. THE Web_Hosting_Bucket SHALL remain within AWS Free Tier limits

### Requirement 3: CloudFormation Outputs

**User Story:** As a developer, I want all critical resource identifiers exported as CloudFormation outputs, so that I can easily configure the frontend and verify deployment.

#### Acceptance Criteria

1. THE AuthStack SHALL output the Cognito User Pool ID with export name EcoBidUserPoolId
2. THE AuthStack SHALL output the Cognito User Pool Client ID with export name EcoBidUserPoolClientId
3. THE DatabaseStack SHALL output the ecobid-items table name
4. THE StorageStack SHALL output the images bucket name
5. THE StorageStack SHALL output the Web_Hosting_Bucket name
6. THE StorageStack SHALL output the website URL
7. THE ApiStack SHALL output the API Gateway URL
8. WHEN deployment completes, THE System SHALL display all outputs in the terminal

### Requirement 4: Deployment Script Creation

**User Story:** As a developer, I want a single deployment script that handles frontend build and infrastructure deployment, so that deployment is simple and repeatable.

#### Acceptance Criteria

1. THE Deployment_Script SHALL be named deploy.sh and located in the project root directory
2. WHEN executed, THE Deployment_Script SHALL check for required dependencies
3. WHEN dependencies are missing, THE Deployment_Script SHALL display helpful error messages with installation instructions
4. THE Deployment_Script SHALL build the frontend using npm run build in the frontend directory
5. WHEN frontend build fails, THE Deployment_Script SHALL exit with a non-zero status code and display the error
6. THE Deployment_Script SHALL deploy infrastructure using cdk deploy --all --require-approval never
7. WHEN CDK deployment fails, THE Deployment_Script SHALL exit with a non-zero status code and display the error
8. THE Deployment_Script SHALL extract the Web_Hosting_Bucket name from CloudFormation outputs
9. THE Deployment_Script SHALL sync frontend build output to the Web_Hosting_Bucket using aws s3 sync
10. WHEN S3 sync fails, THE Deployment_Script SHALL exit with a non-zero status code and display the error
11. WHEN deployment succeeds, THE Deployment_Script SHALL display the website URL and all CloudFormation outputs
12. THE Deployment_Script SHALL be executable

### Requirement 5: Frontend Build Configuration

**User Story:** As a developer, I want the frontend build optimized for production deployment, so that the deployed app is performant and properly configured.

#### Acceptance Criteria

1. THE Frontend SHALL build successfully using npm run build
2. WHEN building, THE System SHALL output production-optimized assets to frontend/dist
3. THE Frontend SHALL include a minimal Hello World React component as the initial landing page
4. THE Frontend SHALL include proper HTML meta tags for PWA support
5. THE Frontend build SHALL include Vite PWA plugin configuration
6. THE Frontend build output SHALL be under 5MB

### Requirement 6: AWS Credentials and Environment Verification

**User Story:** As a developer, I want to verify AWS credentials and environment configuration before deployment, so that I can catch configuration issues early.

#### Acceptance Criteria

1. WHEN running the Deployment_Script, THE System SHALL verify AWS credentials are configured
2. WHEN AWS credentials are missing, THE Deployment_Script SHALL display an error message with configuration instructions
3. THE Deployment_Script SHALL verify the AWS region is set
4. THE Deployment_Script SHALL display the AWS account ID and region before starting deployment
5. THE Deployment_Script SHALL prompt for confirmation before proceeding with deployment

### Requirement 7: Deployment Verification

**User Story:** As a developer, I want to verify the deployment succeeded and all resources are accessible, so that I can confirm the infrastructure is working correctly.

#### Acceptance Criteria

1. WHEN deployment completes, THE System SHALL verify the React app is accessible via the public website URL
2. WHEN deployment completes, THE System SHALL verify the Cognito User Pool exists in AWS
3. WHEN deployment completes, THE System SHALL verify the ecobid-items DynamoDB table exists with PAY_PER_REQUEST billing
4. WHEN deployment completes, THE System SHALL verify the S3 buckets exist
5. WHEN deployment completes, THE System SHALL verify the API Gateway endpoint is accessible
6. THE Deployment_Script SHALL output a checklist of verification steps for manual confirmation

### Requirement 8: Free Tier Compliance

**User Story:** As a developer, I want to ensure all deployed resources stay within AWS Free Tier limits, so that I don't incur unexpected costs.

#### Acceptance Criteria

1. THE System SHALL use Lambda Node.js 20.x runtime
2. THE System SHALL use DynamoDB PAY_PER_REQUEST billing
3. THE System SHALL use S3 Standard storage class
4. THE System SHALL NOT deploy VPC or NAT Gateway resources
5. THE System SHALL use Cognito User Pools
6. THE System SHALL use API Gateway REST API
7. THE Deployment_Script SHALL display a warning about Free Tier limits and monitoring recommendations

### Requirement 9: Error Handling and Rollback

**User Story:** As a developer, I want proper error handling and rollback capabilities, so that failed deployments don't leave the infrastructure in an inconsistent state.

#### Acceptance Criteria

1. WHEN any deployment step fails, THE Deployment_Script SHALL stop execution immediately
2. WHEN CDK deployment fails, THE System SHALL automatically rollback CloudFormation stacks
3. WHEN S3 sync fails, THE Deployment_Script SHALL display the error but NOT rollback infrastructure
4. THE Deployment_Script SHALL log all operations to a deployment.log file
5. WHEN errors occur, THE Deployment_Script SHALL display the relevant section of the log file
6. THE Deployment_Script SHALL provide instructions for manual cleanup if automatic rollback fails

### Requirement 10: Documentation and Next Steps

**User Story:** As a developer, I want clear documentation of the deployment process and next steps, so that I can understand what was deployed and what to do next.

#### Acceptance Criteria

1. THE System SHALL create a DEPLOYMENT.md file documenting the deployment process
2. THE DEPLOYMENT.md file SHALL include prerequisites
3. THE DEPLOYMENT.md file SHALL include step-by-step deployment instructions
4. THE DEPLOYMENT.md file SHALL include troubleshooting guidance for common errors
5. THE DEPLOYMENT.md file SHALL include instructions for updating the frontend configuration with CloudFormation outputs
6. THE DEPLOYMENT.md file SHALL include instructions for testing the deployed infrastructure
7. THE DEPLOYMENT.md file SHALL include instructions for destroying the infrastructure
8. WHEN deployment completes, THE Deployment_Script SHALL display next steps
