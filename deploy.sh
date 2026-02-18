#!/bin/bash

# EcoBid Deployment Script
# This script builds the frontend and deploys the infrastructure to AWS

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="deployment.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}EcoBid Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Error handler
handle_error() {
  local exit_code=$1
  local line_number=$2
  echo ""
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}Error occurred at line $line_number (exit code: $exit_code)${NC}"
  echo -e "${RED}========================================${NC}"
  echo ""
  echo "Check deployment.log for details:"
  echo ""
  tail -n 20 "$LOG_FILE"
  echo ""
  echo -e "${YELLOW}To clean up failed deployment:${NC}"
  echo "  cd infrastructure && cdk destroy --all"
  exit $exit_code
}

trap 'handle_error $? $LINENO' ERR

echo "Deployment started at $(date)"
echo ""

# Check dependencies
check_dependencies() {
  echo -e "${BLUE}Checking dependencies...${NC}"
  local missing_deps=0
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "  Install from: https://nodejs.org/ (version 18 or later)"
    echo "  Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    missing_deps=1
  else
    local node_version=$(node --version)
    echo -e "${GREEN}✓ Node.js ${node_version}${NC}"
  fi
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    echo "  npm comes with Node.js. Please install Node.js."
    missing_deps=1
  else
    local npm_version=$(npm --version)
    echo -e "${GREEN}✓ npm ${npm_version}${NC}"
  fi
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI is not installed${NC}"
    echo "  Install from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    echo "  Or use: pip install awscli"
    missing_deps=1
  else
    local aws_version=$(aws --version 2>&1 | cut -d' ' -f1)
    echo -e "${GREEN}✓ ${aws_version}${NC}"
  fi
  
  # Check CDK CLI
  if ! command -v cdk &> /dev/null; then
    echo -e "${RED}✗ AWS CDK CLI is not installed${NC}"
    echo "  Install with: npm install -g aws-cdk"
    missing_deps=1
  else
    local cdk_version=$(cdk --version 2>&1)
    echo -e "${GREEN}✓ CDK ${cdk_version}${NC}"
  fi
  
  echo ""
  
  if [ $missing_deps -eq 1 ]; then
    echo -e "${RED}Missing required dependencies. Please install them and try again.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}All dependencies are installed!${NC}"
  echo ""
}

# Verify AWS credentials
verify_aws_credentials() {
  echo -e "${BLUE}Verifying AWS credentials...${NC}"
  
  if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}✗ AWS credentials are not configured${NC}"
    echo ""
    echo "Please configure your AWS credentials:"
    echo "  1. Run: aws configure"
    echo "  2. Enter your AWS Access Key ID"
    echo "  3. Enter your AWS Secret Access Key"
    echo "  4. Enter your default region (e.g., us-east-1)"
    echo ""
    echo "Or set environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=your_key_id"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "  export AWS_DEFAULT_REGION=us-east-1"
    exit 1
  fi
  
  # Get account info
  local account_id=$(aws sts get-caller-identity --query Account --output text)
  local region=$(aws configure get region)
  
  if [ -z "$region" ]; then
    region=${AWS_DEFAULT_REGION:-us-east-1}
  fi
  
  echo -e "${GREEN}✓ AWS credentials verified${NC}"
  echo "  Account ID: ${account_id}"
  echo "  Region: ${region}"
  echo ""
  
  # Export for later use
  export AWS_ACCOUNT_ID=$account_id
  export AWS_REGION=$region
}

# Display Free Tier warning
display_free_tier_warning() {
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}AWS Free Tier Warning${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo ""
  echo "This deployment uses AWS Free Tier eligible services:"
  echo "  • Lambda: 400k GB-seconds/month"
  echo "  • DynamoDB: 25GB storage, 25 RCU/WCU"
  echo "  • S3: 5GB storage, 20k GET, 2k PUT requests"
  echo "  • Rekognition: 5,000 images/month"
  echo "  • Cognito: 50,000 MAUs"
  echo ""
  echo -e "${YELLOW}Recommendation: Set up AWS Budgets to monitor costs${NC}"
  echo "  https://console.aws.amazon.com/billing/home#/budgets"
  echo ""
}

# Deployment confirmation
confirm_deployment() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Deployment Summary${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  echo "  AWS Account: ${AWS_ACCOUNT_ID}"
  echo "  Region: ${AWS_REGION}"
  echo ""
  echo "This will deploy:"
  echo "  • Cognito User Pool (Authentication)"
  echo "  • DynamoDB Tables (Items, Seekers, Reservations)"
  echo "  • S3 Buckets (Web hosting, Images)"
  echo "  • API Gateway + Lambda Functions"
  echo "  • React PWA Frontend"
  echo ""
  
  read -p "Do you want to proceed with deployment? (yes/no): " confirm
  
  if [ "$confirm" != "yes" ]; then
    echo ""
    echo -e "${YELLOW}Deployment cancelled by user${NC}"
    exit 0
  fi
  
  echo ""
}

# Build frontend
build_frontend() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Building Frontend${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  
  cd frontend
  
  echo "Running npm run build..."
  if ! npm run build; then
    echo ""
    echo -e "${RED}✗ Frontend build failed${NC}"
    echo ""
    echo "Common issues:"
    echo "  • Missing dependencies: run 'cd frontend && npm install'"
    echo "  • TypeScript errors: check src/ files"
    echo "  • Check the error messages above for details"
    exit 1
  fi
  
  cd ..
  
  echo ""
  echo -e "${GREEN}✓ Frontend build complete${NC}"
  echo ""
}

# Deploy infrastructure
deploy_infrastructure() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Deploying Infrastructure${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  
  cd infrastructure
  
  echo "Running cdk deploy --all..."
  if ! cdk deploy --all --require-approval never; then
    echo ""
    echo -e "${RED}✗ CDK deployment failed${NC}"
    echo ""
    echo "Common issues:"
    echo "  • CDK not bootstrapped: run 'cd infrastructure && cdk bootstrap'"
    echo "  • Missing dependencies: run 'cd infrastructure && npm install'"
    echo "  • AWS permissions: check your IAM permissions"
    echo "  • Check CloudFormation console for detailed error"
    exit 1
  fi
  
  cd ..
  
  echo ""
  echo -e "${GREEN}✓ Infrastructure deployment complete${NC}"
  echo ""
}

# Extract CloudFormation outputs
extract_outputs() {
  echo -e "${BLUE}Extracting deployment outputs...${NC}"
  
  # Get web bucket name from CloudFormation outputs
  WEB_BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name EcoBidStorageStack \
    --query 'Stacks[0].Outputs[?OutputKey==`WebBucketName`].OutputValue' \
    --output text 2>/dev/null || echo "")
  
  if [ -z "$WEB_BUCKET_NAME" ]; then
    echo -e "${RED}✗ Could not extract web bucket name from CloudFormation outputs${NC}"
    echo "  Check CloudFormation console for EcoBidStorageStack outputs"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Web bucket: ${WEB_BUCKET_NAME}${NC}"
  echo ""
}

# Sync frontend to S3
sync_to_s3() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Syncing Frontend to S3${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  
  echo "Uploading to s3://${WEB_BUCKET_NAME}..."
  
  if ! aws s3 sync frontend/dist/ s3://${WEB_BUCKET_NAME} --delete; then
    echo ""
    echo -e "${RED}✗ Failed to sync frontend to S3${NC}"
    echo ""
    echo "Infrastructure is deployed, but frontend upload failed."
    echo "You can manually sync with:"
    echo "  aws s3 sync frontend/dist/ s3://${WEB_BUCKET_NAME} --delete"
    exit 1
  fi
  
  echo ""
  echo -e "${GREEN}✓ Frontend synced to S3${NC}"
  echo ""
}

# Display deployment outputs
display_outputs() {
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}Deployment Successful!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  
  echo -e "${BLUE}CloudFormation Outputs:${NC}"
  echo ""
  
  # Get all outputs from all stacks
  echo "Auth Stack:"
  aws cloudformation describe-stacks --stack-name EcoBidAuthStack \
    --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' \
    --output table 2>/dev/null || echo "  (No outputs)"
  echo ""
  
  echo "Database Stack:"
  aws cloudformation describe-stacks --stack-name EcoBidDatabaseStack \
    --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' \
    --output table 2>/dev/null || echo "  (No outputs)"
  echo ""
  
  echo "Storage Stack:"
  aws cloudformation describe-stacks --stack-name EcoBidStorageStack \
    --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' \
    --output table 2>/dev/null || echo "  (No outputs)"
  echo ""
  
  echo "API Stack:"
  aws cloudformation describe-stacks --stack-name EcoBidApiStack \
    --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' \
    --output table 2>/dev/null || echo "  (No outputs)"
  echo ""
  
  # Get website URL
  WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name EcoBidStorageStack \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$WEBSITE_URL" ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Your EcoBid app is live!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Website URL:${NC} ${WEBSITE_URL}"
    echo ""
  fi
  
  echo -e "${YELLOW}Next Steps:${NC}"
  echo "  1. Open the website URL above to verify deployment"
  echo "  2. Save the User Pool ID and Client ID for frontend configuration"
  echo "  3. Check AWS Console to verify all resources are created"
  echo "  4. Set up AWS Budgets to monitor costs"
  echo ""
  echo -e "${YELLOW}To destroy infrastructure:${NC}"
  echo "  cd infrastructure && cdk destroy --all"
  echo ""
}

# Main execution
main() {
  display_free_tier_warning
  check_dependencies
  verify_aws_credentials
  confirm_deployment
  build_frontend
  deploy_infrastructure
  extract_outputs
  sync_to_s3
  display_outputs
  
  echo "Deployment completed at $(date)"
  echo "Full log available in: deployment.log"
}

# Run main function
main
