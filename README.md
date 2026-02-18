# EcoBid - Freecycling Platform

A mobile-first PWA that streamlines the freecycling process with AI-powered matching and a transparent reservation queue system.

## Project Structure

This is a monorepo containing:
- `/frontend` - React 18 + Vite PWA with Tailwind CSS
- `/infrastructure` - AWS CDK v2 infrastructure (TypeScript)
- `/docs` - Architecture diagrams and logs

## Prerequisites

- Node.js 20.x or later
- npm or yarn
- AWS CLI configured (for infrastructure deployment)
- AWS CDK CLI (`npm install -g aws-cdk`)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
npm install --workspace=frontend

# Install infrastructure dependencies
npm install --workspace=infrastructure
```

### 2. Frontend Development

```bash
# Start development server
npm run dev:frontend

# Build for production
npm run build:frontend
```

The frontend will be available at `http://localhost:5173`

### 3. Infrastructure Deployment

```bash
# Bootstrap CDK (first time only)
cd infrastructure
npx cdk bootstrap

# Deploy all stacks
npm run deploy

# Or deploy specific stack
npx cdk deploy EcoBidAuthStack
```

## Architecture

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- TanStack Query for state management
- PWA with offline support

### Backend (AWS Serverless)
- **Auth**: Amazon Cognito User Pools
- **Database**: DynamoDB (3 tables: Items, Seekers, Reservations)
- **Storage**: S3 with 30-day lifecycle policy
- **Compute**: Lambda (Node.js 20.x)
- **API**: API Gateway with Cognito authorizer
- **AI**: Amazon Rekognition for image tagging

### Core Features
1. **Smart Give Flow**: AI-powered item tagging via Rekognition
2. **Reservation Queue**: Fair FIFO system with time windows
3. **Seek & Match Engine**: Automatic matching via DynamoDB Streams

## AWS Free Tier Optimization

This project is designed to stay within AWS Free Tier limits:
- Lambda: 400k GB-seconds/month
- DynamoDB: 25GB storage, 25 RCU/WCU
- Rekognition: 5,000 images/month
- S3: Images expire after 30 days
- No VPC/NAT Gateway (uses public endpoints)

## Development Workflow

1. Make changes to frontend or infrastructure
2. Test locally (frontend) or deploy to AWS (infrastructure)
3. Use `npm run watch` in infrastructure for live CDK updates
4. Check CloudWatch logs for Lambda debugging

## Next Steps

- [ ] Implement Lambda handlers in `infrastructure/lambda/handlers/`
- [ ] Add Shadcn/UI components to frontend
- [ ] Configure AWS Amplify in `frontend/src/lib/`
- [ ] Implement feature modules (feed, give, queue)
- [ ] Set up DynamoDB Streams trigger for matcher Lambda
- [ ] Add Rekognition integration in storage stack

## License

MIT
