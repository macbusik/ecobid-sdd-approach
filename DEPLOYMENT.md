# EcoBid Deployment Guide

This guide walks you through deploying the EcoBid infrastructure to AWS.

## Prerequisites

Before deploying, ensure you have the following tools installed:

### 1. AWS Account

You need an AWS account with appropriate permissions to create resources:
- Cognito User Pools
- DynamoDB Tables
- S3 Buckets
- Lambda Functions
- API Gateway
- IAM Roles

Sign up at: https://aws.amazon.com/

### 2. Node.js (18 or later)

**Check if installed:**
```bash
node --version
```

**Installation options:**

**Option A: Direct download**
- Download from: https://nodejs.org/
- Choose LTS version (18.x or later)

**Option B: Using nvm (recommended for developers)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install 18
nvm use 18
```

### 3. AWS CLI v2

**Check if installed:**
```bash
aws --version
```

**Installation:**

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**macOS:**
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Windows:**
Download and run the installer from: https://awscli.amazonaws.com/AWSCLIV2.msi

### 4. AWS CDK CLI

**Install globally:**
```bash
npm install -g aws-cdk
```

**Verify installation:**
```bash
cdk --version
```

### 5. Configure AWS Credentials

**Option A: Using AWS CLI**
```bash
aws configure
```

You'll be prompted for:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

**Option B: Using environment variables**
```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_DEFAULT_REGION=us-east-1
```

**Verify credentials:**
```bash
aws sts get-caller-identity
```

This should display your AWS account ID and user ARN.


## Deployment Instructions

### Step 1: Clone Repository and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ecobid-sdd-approach

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install infrastructure dependencies
cd infrastructure
npm install
cd ..
```

### Step 2: Bootstrap CDK (First Time Only)

CDK requires a one-time bootstrap to create necessary AWS resources:

```bash
cd infrastructure
cdk bootstrap
cd ..
```

This creates an S3 bucket and other resources needed for CDK deployments in your AWS account.

### Step 3: Run Deployment Script

The deployment script handles everything: building the frontend, deploying infrastructure, and syncing files to S3.

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Check for required dependencies
2. Verify AWS credentials
3. Display deployment summary and ask for confirmation
4. Build the React frontend
5. Deploy all CDK stacks (Auth, Database, Storage, API)
6. Extract CloudFormation outputs
7. Sync frontend build to S3
8. Display website URL and all outputs

**Expected deployment time:** 5-10 minutes


## Verification

After deployment completes, verify everything is working:

### 1. Check Website URL

The deployment script displays the website URL. Open it in your browser:

```
http://ecobid-web-<account-id>.s3-website-<region>.amazonaws.com
```

You should see the EcoBid Hello World page with:
- EcoBid title
- "Freecycling Made Simple" tagline
- Green success message
- List of upcoming features

### 2. Check AWS Console

Log into the AWS Console and verify resources were created:

**CloudFormation:**
- Navigate to CloudFormation service
- Verify 4 stacks are in CREATE_COMPLETE status:
  - EcoBidAuthStack
  - EcoBidDatabaseStack
  - EcoBidStorageStack
  - EcoBidApiStack

**Cognito:**
- Navigate to Cognito service
- Verify "ecobid-users" User Pool exists

**DynamoDB:**
- Navigate to DynamoDB service
- Verify tables exist:
  - ecobid-items
  - ecobid-seekers
  - ecobid-reservations

**S3:**
- Navigate to S3 service
- Verify buckets exist:
  - ecobid-web-<account-id> (contains frontend files)
  - ecobid-images-<account-id> (for user uploads)

**API Gateway:**
- Navigate to API Gateway service
- Verify "EcoBid API" exists

### 3. Check CloudFormation Outputs

View all deployment outputs:

```bash
# Auth Stack outputs
aws cloudformation describe-stacks --stack-name EcoBidAuthStack \
  --query 'Stacks[0].Outputs'

# Database Stack outputs
aws cloudformation describe-stacks --stack-name EcoBidDatabaseStack \
  --query 'Stacks[0].Outputs'

# Storage Stack outputs
aws cloudformation describe-stacks --stack-name EcoBidStorageStack \
  --query 'Stacks[0].Outputs'

# API Stack outputs
aws cloudformation describe-stacks --stack-name EcoBidApiStack \
  --query 'Stacks[0].Outputs'
```


## Troubleshooting

### AWS Credentials Issues

**Problem:** `Unable to locate credentials`

**Solution:**
```bash
# Configure credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-east-1

# Verify
aws sts get-caller-identity
```

### CDK Bootstrap Issues

**Problem:** `This stack uses assets, so the toolkit stack must be deployed`

**Solution:**
```bash
cd infrastructure
cdk bootstrap
```

### Frontend Build Failures

**Problem:** `npm run build` fails with TypeScript errors

**Solution:**
```bash
cd frontend
npm install  # Reinstall dependencies
npm run build  # Try build again
```

**Problem:** Missing dependencies

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### CDK Deployment Failures

**Problem:** `Stack already exists`

**Solution:**
```bash
cd infrastructure
cdk deploy --all  # Redeploy (updates existing stacks)
```

**Problem:** Insufficient IAM permissions

**Solution:**
- Ensure your AWS user has AdministratorAccess or equivalent permissions
- Required permissions: CloudFormation, S3, DynamoDB, Cognito, Lambda, API Gateway, IAM

**Problem:** Resource limit exceeded

**Solution:**
- Check AWS Service Quotas in AWS Console
- Request limit increase if needed

### S3 Sync Failures

**Problem:** `Access Denied` when syncing to S3

**Solution:**
```bash
# Verify bucket exists
aws s3 ls | grep ecobid-web

# Manual sync
aws s3 sync frontend/dist/ s3://ecobid-web-<account-id> --delete
```

### Website Not Accessible

**Problem:** Website URL returns 404 or Access Denied

**Solution:**
1. Verify S3 bucket has website hosting enabled
2. Check bucket policy allows public read access
3. Verify files were synced to bucket:
   ```bash
   aws s3 ls s3://ecobid-web-<account-id>/
   ```
4. Try accessing index.html directly:
   ```
   http://ecobid-web-<account-id>.s3-website-<region>.amazonaws.com/index.html
   ```

### Deployment Log

Check `deployment.log` in the project root for detailed error messages:

```bash
tail -n 50 deployment.log
```


## Frontend Configuration

After deployment, you'll need to configure the frontend with AWS resource IDs for authentication and API calls.

### Get CloudFormation Outputs

The deployment script displays all outputs, but you can retrieve them anytime:

```bash
# Get User Pool ID
aws cloudformation describe-stacks --stack-name EcoBidAuthStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text

# Get User Pool Client ID
aws cloudformation describe-stacks --stack-name EcoBidAuthStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text

# Get API URL
aws cloudformation describe-stacks --stack-name EcoBidApiStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

### Configure AWS Amplify

Create `frontend/src/lib/aws-config.ts`:

```typescript
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX',  // Replace with your User Pool ID
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',  // Replace with your Client ID
      region: 'us-east-1',  // Replace with your region
    }
  },
  API: {
    REST: {
      EcoBidAPI: {
        endpoint: 'https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod',  // Replace with your API URL
        region: 'us-east-1',  // Replace with your region
      }
    }
  }
};
```

### Update main.tsx

Import and configure Amplify in `frontend/src/main.tsx`:

```typescript
import { Amplify } from 'aws-amplify';
import { awsConfig } from './lib/aws-config';

Amplify.configure(awsConfig);
```

### Redeploy Frontend

After updating configuration:

```bash
cd frontend
npm run build
cd ..

# Sync to S3
aws s3 sync frontend/dist/ s3://ecobid-web-<account-id> --delete
```


## Cleanup

To remove all deployed infrastructure and stop incurring any charges:

### Option 1: Using CDK Destroy

```bash
cd infrastructure
cdk destroy --all
```

This will:
- Delete all CloudFormation stacks
- Remove all AWS resources (Cognito, DynamoDB, S3, Lambda, API Gateway)
- Clean up IAM roles and policies

**Note:** You'll be prompted to confirm deletion for each stack.

### Option 2: Using AWS Console

1. Navigate to CloudFormation service
2. Select each stack (EcoBidAuthStack, EcoBidDatabaseStack, EcoBidStorageStack, EcoBidApiStack)
3. Click "Delete" for each stack
4. Wait for deletion to complete

### Important Notes

**Data Loss Warning:**
- All data in DynamoDB tables will be permanently deleted
- All files in S3 buckets will be permanently deleted
- User accounts in Cognito will be permanently deleted
- This action cannot be undone

**S3 Bucket Deletion:**
- Buckets are configured with `autoDeleteObjects: true`
- CDK will automatically empty buckets before deletion
- If manual deletion is needed:
  ```bash
  aws s3 rm s3://ecobid-web-<account-id> --recursive
  aws s3 rm s3://ecobid-images-<account-id> --recursive
  ```

**Verify Cleanup:**

After deletion, verify all resources are removed:

```bash
# Check CloudFormation stacks
aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE

# Check S3 buckets
aws s3 ls | grep ecobid

# Check DynamoDB tables
aws dynamodb list-tables | grep ecobid

# Check Cognito User Pools
aws cognito-idp list-user-pools --max-results 10 | grep ecobid
```

## AWS Free Tier Monitoring

To avoid unexpected charges, set up AWS Budgets:

### Create a Budget

1. Navigate to AWS Billing Console: https://console.aws.amazon.com/billing/
2. Click "Budgets" in the left sidebar
3. Click "Create budget"
4. Choose "Zero spend budget" or set a custom amount (e.g., $10/month)
5. Enter your email for alerts
6. Click "Create budget"

### Key Free Tier Limits

Monitor these services to stay within Free Tier:

- **Lambda:** 400,000 GB-seconds/month, 1M requests/month
- **DynamoDB:** 25 GB storage, 25 RCU/WCU provisioned capacity
- **S3:** 5 GB storage, 20,000 GET requests, 2,000 PUT requests
- **Rekognition:** 5,000 images/month
- **Cognito:** 50,000 MAUs (Monthly Active Users)
- **API Gateway:** 1M API calls/month (first 12 months)

### Cost Optimization Tips

1. **Delete test data regularly** to stay under DynamoDB storage limits
2. **Use S3 lifecycle policies** (already configured to expire images after 30 days)
3. **Monitor Lambda execution time** to stay under GB-seconds limit
4. **Limit Rekognition usage** to 5,000 images/month
5. **Set up CloudWatch alarms** for unusual activity

## Next Steps

After successful deployment:

1. ✅ Verify website is accessible
2. ✅ Save CloudFormation outputs (User Pool ID, Client ID, API URL)
3. ⏭️ Configure frontend with AWS resource IDs
4. ⏭️ Implement authentication flow
5. ⏭️ Build item listing and upload features
6. ⏭️ Implement reservation queue system
7. ⏭️ Add Rekognition image tagging
8. ⏭️ Build seek & match engine

## Support

For issues or questions:
- Check `deployment.log` for detailed error messages
- Review AWS CloudFormation events in AWS Console
- Check AWS CloudWatch logs for Lambda function errors
- Refer to AWS documentation: https://docs.aws.amazon.com/

## License

MIT
