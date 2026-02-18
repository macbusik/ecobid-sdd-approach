---
inclusion: always
---

# Technology Stack: AWS Amplify Gen 2 (Hybrid Architecture)

## Core Framework

**Framework**: AWS Amplify Gen 2 (Code-First).

**Language**: TypeScript (Frontend & Backend).

**Infrastructure**: Defined in `amplify/backend.ts` and `amplify/data/resource.ts`. This compiles to standard CloudFormation/CDK.

## Frontend (Mobile PWA)

**Library**: React 18 + Vite.

**UI**: Tailwind CSS + Shadcn/UI (focus on Mobile UX: large buttons, bottom nav).

**PWA**: Must be installable (Manifest, Service Worker).

## The "Agentic" Backend (Serverless)

**Data Layer**: AWS Amplify Data (DynamoDB + AppSync).

**Real-time**: Uses GraphQL Subscriptions for live updates on auctions.

**Compute**: AWS Lambda (Node.js 20.x).

**Architecture**: Event-Driven. Use DynamoDB Streams to trigger Agents.

### AI Pipeline (The "Brain")

**Vision**: Amazon Rekognition (Label Detection, Bounding Boxes).

**LLM**: Amazon Bedrock (Claude 3 Haiku). 
- Note: Use Haiku for speed and low cost.

**Orchestration**: Use standard Lambda functions to chain these calls (keep it simple for Free Tier).

## Free Tier Compliance Rules (Strict)

- **No NAT Gateways**: Lambdas must use public endpoints or VPC endpoints only if free.
- **DynamoDB**: On-Demand mode (Pay-per-request).
- **Bedrock**: Monitor token usage closely. Use short prompts.
- **Lambda**: 400k GB-seconds/month limit.
- **Rekognition**: 5,000 images/month limit.
- **AppSync**: 250k query/mutation operations per month.

## Key Differences from CDK Approach

1. **Amplify Gen 2** provides higher-level abstractions for common patterns
2. **AppSync GraphQL** replaces API Gateway REST API for real-time capabilities
3. **Built-in Auth** with Amplify Auth (Cognito wrapper)
4. **Type-safe data layer** with automatic TypeScript generation
5. **Simplified deployment** with `npx ampx sandbox` for dev and `npx ampx deploy` for prod
