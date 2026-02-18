# EcoBid Quick Reference Guide

## Common Commands

### Development

```bash
# Start sandbox (deploys to AWS)
npx ampx sandbox

# Start sandbox with specific profile
npx ampx sandbox --profile my-aws-profile

# Generate TypeScript types from GraphQL schema
npx ampx generate graphql-client-code

# Generate amplify_outputs.json
npx ampx generate outputs --branch main
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific function
cd amplify/functions/analyze-image
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Deployment

```bash
# Deploy to production
npx ampx deploy --branch main

# Deploy to specific environment
npx ampx deploy --branch staging

# Check deployment status
aws cloudformation describe-stacks --region eu-central-1
```

### Monitoring

```bash
# Tail Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --region eu-central-1 --follow

# Get recent logs
aws logs tail /aws/lambda/FUNCTION_NAME --region eu-central-1 --since 10m

# List all Lambda functions
aws lambda list-functions --region eu-central-1 --query 'Functions[].FunctionName'

# List DynamoDB tables
aws dynamodb list-tables --region eu-central-1

# List S3 buckets
aws s3 ls
```

### Testing Image Upload

```bash
# Upload test image
aws s3 cp test_images/1.jpeg s3://BUCKET_NAME/uploads/test-1.jpeg --region eu-central-1

# Check if Lambda was triggered
aws logs tail /aws/lambda/FUNCTION_NAME --region eu-central-1 --since 2m

# Verify DynamoDB record
aws dynamodb scan --table-name ITEM_TABLE_NAME --region eu-central-1 --max-items 5
```

### Cleanup

```bash
# Delete sandbox resources
npx ampx sandbox delete

# Delete production deployment
npx ampx delete --branch main

# Empty S3 bucket before deletion
aws s3 rm s3://BUCKET_NAME --recursive --region eu-central-1
```

---

## File Locations

### Infrastructure

- `amplify/backend.ts` - Main backend configuration
- `amplify/auth/resource.ts` - Cognito authentication
- `amplify/data/resource.ts` - GraphQL schema and DynamoDB
- `amplify/storage/resource.ts` - S3 bucket configuration
- `amplify/functions/*/resource.ts` - Lambda function configs

### Lambda Functions

- `amplify/functions/analyze-image/handler.ts` - Main handler
- `amplify/functions/analyze-image/*.ts` - Service modules
- `amplify/functions/analyze-image/*.test.ts` - Tests

### Configuration

- `amplify_outputs.json` - Generated config for frontend
- `.amplify/` - Build artifacts (gitignored)

### Documentation

- `docs/AMPLIFY_GEN2_APPROACH.md` - Architecture guide
- `specs/ai-image-analysis/` - Feature specification
- `README.md` - Project overview

---

## Environment Variables

### Lambda Function

Available in `amplify/functions/analyze-image/handler.ts`:

```typescript
process.env.AWS_REGION              // Auto-provided by Lambda
process.env.ITEM_TABLE_NAME         // DynamoDB table name
process.env.STORAGE_BUCKET_NAME     // S3 bucket name
process.env.BEDROCK_MODEL_ID        // Claude model ID
```

### Local Development

Set in `amplify/functions/analyze-image/resource.ts`:

```typescript
environment: {
  BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
}
```

---

## Troubleshooting

### Circular Dependency Error

**Error**: `CloudformationStackCircularDependencyError`

**Solution**: Use `bucket.addEventNotification()` instead of `lambda.addEventSource()`

```typescript
// ❌ Wrong
lambda.addEventSource(new S3EventSource(bucket, {...}));

// ✅ Correct
bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(lambda), {...});
```

### Lambda Not Triggered

**Check**:
1. S3 event notification is configured
2. File uploaded to correct prefix (`uploads/`)
3. File has correct extension (`.jpg`, `.jpeg`, `.png`, `.heic`)
4. Lambda has permission to be invoked by S3

```bash
# Check S3 event configuration
aws s3api get-bucket-notification-configuration --bucket BUCKET_NAME --region eu-central-1

# Check Lambda permissions
aws lambda get-policy --function-name FUNCTION_NAME --region eu-central-1
```

### TypeScript Compilation Errors

**Solution**: Run TypeScript compiler to see detailed errors

```bash
cd amplify
npx tsc --noEmit
```

### Tests Failing

**Common Issues**:
- AWS SDK mocks not configured correctly
- Missing test dependencies
- Incorrect import paths

```bash
# Reinstall dependencies
cd amplify/functions/analyze-image
rm -rf node_modules package-lock.json
npm install

# Run tests with verbose output
npm test -- --reporter=verbose
```

### Deployment Stuck

**Solution**: Check CloudFormation console for detailed error

```bash
# Get stack events
aws cloudformation describe-stack-events \
  --stack-name amplify-STACK-NAME \
  --region eu-central-1 \
  --max-items 20

# Cancel stuck deployment
aws cloudformation cancel-update-stack \
  --stack-name amplify-STACK-NAME \
  --region eu-central-1
```

---

## Cost Monitoring

### Set Up Budget Alert

```bash
# Create budget (via AWS Console)
# 1. Go to AWS Budgets
# 2. Create budget
# 3. Set amount: $5/month
# 4. Set alert at 80% threshold
# 5. Add email notification
```

### Check Current Costs

```bash
# Get month-to-date costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1
```

### Monitor Free Tier Usage

Services to watch:
- **Rekognition**: 5,000 images/month (main bottleneck)
- **Lambda**: 400,000 GB-seconds/month
- **DynamoDB**: 25 GB storage
- **S3**: 5 GB storage

---

## GraphQL API

### Endpoint

From `amplify_outputs.json`:
```json
{
  "data": {
    "url": "https://YOUR-API-ID.appsync-api.REGION.amazonaws.com/graphql"
  }
}
```

### Example Queries

```graphql
# List all items
query ListItems {
  listItems {
    items {
      id
      title
      aiDescription
      aiTags
      status
    }
  }
}

# Get specific item
query GetItem($id: ID!) {
  getItem(id: $id) {
    id
    title
    aiDescription
    aiConditionAssessment
    aiTags
    status
  }
}

# Create item (requires authentication)
mutation CreateItem($input: CreateItemInput!) {
  createItem(input: $input) {
    id
    title
    status
  }
}
```

---

## Useful AWS Console Links

- **CloudFormation**: https://console.aws.amazon.com/cloudformation
- **Lambda Functions**: https://console.aws.amazon.com/lambda
- **DynamoDB Tables**: https://console.aws.amazon.com/dynamodb
- **S3 Buckets**: https://console.aws.amazon.com/s3
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups
- **AppSync APIs**: https://console.aws.amazon.com/appsync
- **Cognito User Pools**: https://console.aws.amazon.com/cognito
- **Cost Explorer**: https://console.aws.amazon.com/cost-management/home#/cost-explorer

---

## Support Resources

- **Amplify Gen 2 Docs**: https://docs.amplify.aws/
- **AWS SDK for JavaScript v3**: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
- **Bedrock Documentation**: https://docs.aws.amazon.com/bedrock/
- **Rekognition Documentation**: https://docs.aws.amazon.com/rekognition/
- **AppSync Documentation**: https://docs.aws.amazon.com/appsync/

---

## Project-Specific Notes

### Test Image

Location: `test_images/1.jpeg`
- Size: 1.1 MB
- Content: Tech items (laptop, mouse, phone, etc.)
- Expected labels: Computer Hardware, Electronics, Laptop, Mouse, Phone

### Expected AI Output

```json
{
  "title": "Gently Used Tech Bundle - Computer, Mouse, Laptop, Phone",
  "description": "This tech bundle includes a well-maintained computer, mouse, laptop, and mobile phone. All items are in good working condition and ready to use. Perfect for a home office or personal use.",
  "condition": "Good",
  "tags": ["Computer Hardware", "Electronics", "Hardware", "Mouse", "Laptop", "Pc", "Wallet", "Mobile Phone", "Phone", "Table"]
}
```

### Performance Benchmarks

- Execution time: ~3 seconds
- Token usage: ~285 tokens
- Memory: ~120 MB
- Cost: ~$0.0013 per image
