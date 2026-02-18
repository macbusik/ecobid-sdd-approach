# EcoBid - Agentic Circular Marketplace

A mobile-first marketplace that transforms chaotic "Buy Nothing" groups into an efficient, AI-powered exchange system. We replace manual searching with **Autonomous Proxy Agents** and manual listing with **Multimodal AI Vision**.

## 🎉 Current Status: "Snap & Sell" Feature Deployed!

✅ **AI Image Analysis Pipeline** is live and operational:
- S3 event-triggered Lambda function
- Amazon Rekognition for object detection
- Amazon Bedrock (Claude 3 Haiku) for content generation
- DynamoDB storage with automatic metadata
- **Performance**: 2.97s execution, $0.0013 per image
- **Test Coverage**: 131 passing tests
- **Deployed**: AWS eu-central-1 region

See [docs/AMPLIFY_GEN2_APPROACH.md](docs/AMPLIFY_GEN2_APPROACH.md) for complete implementation details.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or later
- AWS CLI configured with credentials
- AWS account with Free Tier access

### Installation

```bash
# Install dependencies
npm install

# Start Amplify sandbox (deploys to AWS)
npx ampx sandbox

# In another terminal, test the pipeline
aws s3 cp test_images/1.jpeg s3://YOUR-BUCKET-NAME/uploads/test.jpeg
```

### Verify Deployment

```bash
# Check Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --region eu-central-1 --follow

# Check DynamoDB
aws dynamodb scan --table-name ITEM_TABLE_NAME --region eu-central-1
```

---

## 📁 Project Structure

```
/
├── amplify/                    # Backend Infrastructure (Amplify Gen 2)
│   ├── auth/                  # Cognito authentication
│   ├── data/                  # GraphQL schema + DynamoDB
│   ├── storage/               # S3 bucket configuration
│   ├── functions/
│   │   └── analyze-image/     # ✅ AI image analysis (DEPLOYED)
│   │       ├── handler.ts     # Main orchestration
│   │       ├── rekognition-service.ts
│   │       ├── bedrock-service.ts
│   │       ├── dynamodb-update.ts
│   │       └── *.test.ts      # 131 passing tests
│   └── backend.ts             # Main configuration
├── frontend/                   # React 18 + Vite PWA
│   └── src/
├── docs/                       # Documentation
│   ├── AMPLIFY_GEN2_APPROACH.md      # Architecture guide
│   ├── QUICK_REFERENCE.md            # Common commands
│   └── SPEC_DRIVEN_DEVELOPMENT.md    # SDD case study
├── specs/                      # Feature specifications
│   └── ai-image-analysis/     # ✅ Completed spec
│       ├── requirements.md    # EARS requirements
│       ├── design.md          # Design + properties
│       └── tasks.md           # Implementation tasks
└── test_images/               # Test data
```

---

## 🏗️ Architecture

### Technology Stack

**Framework**: AWS Amplify Gen 2 (Code-First TypeScript IaC)

**Frontend**: React 18 + Vite + Tailwind CSS + Shadcn/UI

**Backend**: Serverless (Lambda + DynamoDB + AppSync + S3)

**AI Pipeline**:
- **Vision**: Amazon Rekognition (Label Detection)
- **LLM**: Amazon Bedrock (Claude 3 Haiku)
- **Orchestration**: Event-driven Lambda functions

### Core Features

#### 1. ✅ Snap & Sell (Deployed)

**Problem**: Posting items is tedious.

**Solution**: Upload one photo, AI generates complete listing.

**Flow**:
1. User uploads image to S3 (`uploads/` prefix)
2. S3 event triggers Lambda automatically
3. Rekognition detects objects (70% confidence, top 10 labels)
4. Bedrock generates title, description, condition
5. DynamoDB stores AI metadata with status='REVIEW'

**Performance**:
- Execution: 2.97 seconds
- Cost: $0.0013 per image
- Token usage: ~285 tokens

#### 2. 🚧 Autonomous Proxy Agents (Planned)

**Problem**: "First come, first served" favors people glued to phones.

**Solution**: Deploy AI agents with natural language instructions.

**Flow**:
1. User: "Find me a wooden desk for a student, nearby"
2. Agent monitors new items via DynamoDB Streams
3. Agent evaluates semantic match using Bedrock
4. Agent places reservation automatically
5. User gets notification: "Your Agent found a match!"

---

## 📊 Metrics & Performance

### Development Time

- Requirements: 30 minutes
- Design: 45 minutes
- Implementation: 3 hours
- Testing: 1 hour
- Deployment: 30 minutes
- Documentation: 1 hour

**Total: 6.5 hours** (single development session)

### Code Quality

- Lines of code: ~1,500
- Test coverage: 131 tests (100% pass rate)
- TypeScript: 100%
- Linting: 0 errors
- Diagnostics: 0 errors

### Production Performance

- Execution time: 2.97 seconds
- Memory usage: 121 MB / 512 MB
- Cost per image: $0.0013
- Free Tier headroom: 95%

---

## 💰 AWS Free Tier Compliance

All resources configured to stay within Free Tier limits:

- ✅ Lambda: 400k GB-seconds/month (≈120k invocations)
- ✅ Rekognition: 5,000 images/month (main bottleneck)
- ✅ DynamoDB: 25 GB storage, on-demand billing
- ✅ S3: 5 GB storage, 20k GET requests
- ✅ Bedrock: Pay-as-you-go (~$0.00025 per image)
- ✅ No VPC/NAT Gateway (avoids hourly charges)

**Recommendation**: Set up AWS Budgets alert at $5/month threshold.

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Specific function
cd amplify/functions/analyze-image
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Results

```
✓ s3-event-parser.test.ts (15 tests)
✓ image-retrieval.test.ts (18 tests)
✓ rekognition-service.test.ts (12 tests)
✓ prompt-constructor.test.ts (10 tests)
✓ bedrock-service.test.ts (22 tests)
✓ fallback-content.test.ts (8 tests)
✓ dynamodb-update.test.ts (15 tests)
✓ logger.test.ts (14 tests)
✓ handler.test.ts (17 tests)

Total: 131 tests passing
```

### Integration Test

```bash
# Upload test image
aws s3 cp test_images/1.jpeg s3://BUCKET_NAME/uploads/test-1.jpeg

# Expected output in DynamoDB:
{
  "id": "test-1",
  "aiTags": ["Computer Hardware", "Electronics", "Laptop", "Mouse", "Phone"],
  "aiDescription": "This tech bundle includes a well-maintained computer...",
  "aiConditionAssessment": "Good",
  "status": "REVIEW"
}
```

---

## 📚 Documentation

- **[AMPLIFY_GEN2_APPROACH.md](docs/AMPLIFY_GEN2_APPROACH.md)** - Complete architecture guide
  - Why Amplify Gen 2 vs raw CDK
  - Core patterns (event-driven, GraphQL-first)
  - Critical lessons learned
  - Avoiding circular dependencies
  - IAM permissions scoping

- **[QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Common operations
  - Development commands
  - Testing procedures
  - Deployment process
  - Troubleshooting guide
  - Cost monitoring

- **[SPEC_DRIVEN_DEVELOPMENT.md](docs/SPEC_DRIVEN_DEVELOPMENT.md)** - SDD case study
  - Requirements → Design → Tasks workflow
  - Correctness properties
  - Incremental implementation
  - Lessons learned
  - Templates for future features

---

## 🔧 Development Workflow

### 1. Start Sandbox

```bash
npx ampx sandbox
```

This deploys REAL AWS resources to your account with hot-reload enabled.

### 2. Make Changes

Edit files in `amplify/` - changes are automatically deployed.

### 3. Test Changes

```bash
# Upload test image
aws s3 cp test_images/1.jpeg s3://BUCKET/uploads/test.jpeg

# Check logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow
```

### 4. Run Tests

```bash
cd amplify/functions/analyze-image
npm test
```

### 5. Deploy to Production

```bash
npx ampx deploy --branch main
```

---

## 🐛 Troubleshooting

### Circular Dependency Error

**Error**: `CloudformationStackCircularDependencyError`

**Solution**: Use `bucket.addEventNotification()` instead of `lambda.addEventSource()`

See [docs/AMPLIFY_GEN2_APPROACH.md#avoiding-circular-dependencies](docs/AMPLIFY_GEN2_APPROACH.md#1-avoiding-circular-dependencies) for details.

### Lambda Not Triggered

**Check**:
1. File uploaded to `uploads/` prefix
2. File has correct extension (`.jpg`, `.jpeg`, `.png`, `.heic`)
3. S3 event notification configured
4. Lambda has S3 invoke permission

```bash
# Check S3 notifications
aws s3api get-bucket-notification-configuration --bucket BUCKET_NAME
```

### Tests Failing

```bash
# Reinstall dependencies
cd amplify/functions/analyze-image
rm -rf node_modules package-lock.json
npm install
npm test
```

---

## 🎯 Next Steps

### Immediate

- [ ] Add frontend UI for image upload
- [ ] Implement user review flow for AI-generated listings
- [ ] Add image preview in item feed
- [ ] Set up CloudWatch alarms for errors

### Future Features

- [ ] Autonomous Proxy Agents (DynamoDB Streams + Bedrock)
- [ ] Bounding box detection for multiple items in one photo
- [ ] Image segmentation for cluttered photos
- [ ] User feedback loop to improve AI accuracy
- [ ] Real-time notifications via AppSync subscriptions

---

## 📖 Spec-Driven Development

This project follows a rigorous spec-driven development process:

1. **Requirements** (EARS syntax) → Clear acceptance criteria
2. **Design** (with correctness properties) → Formal specifications
3. **Tasks** (incremental) → Actionable implementation plan
4. **Implementation** (test-first) → High-quality code
5. **Deployment** (validated) → Production-ready

See [docs/SPEC_DRIVEN_DEVELOPMENT.md](docs/SPEC_DRIVEN_DEVELOPMENT.md) for the complete case study.

---

## 🤝 Contributing

1. Create a spec in `specs/FEATURE_NAME/`
2. Write requirements (EARS syntax)
3. Design with correctness properties
4. Break into incremental tasks
5. Implement with tests
6. Deploy and validate

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

Built with:
- AWS Amplify Gen 2
- Amazon Rekognition
- Amazon Bedrock (Claude 3 Haiku)
- Vitest for testing
- TypeScript for type safety

---

**Status**: ✅ Phase 1 Complete - "Snap & Sell" feature deployed and operational

**Next**: Phase 2 - Autonomous Proxy Agents
