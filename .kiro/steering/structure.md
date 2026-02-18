---
inclusion: always
---

# Project Structure (Amplify Gen 2)

## Root Directory

```
/
├── amplify/              # Backend Infrastructure (IaC in TypeScript)
│   ├── auth/            # Authentication config
│   │   └── resource.ts
│   ├── data/            # Data models (GraphQL schema)
│   │   └── resource.ts
│   ├── functions/       # Business Logic (Lambdas)
│   │   ├── analyze-image/    # "Snap & Sell" Logic
│   │   │   └── handler.ts    # Rekognition + Bedrock integration
│   │   └── proxy-agent/      # "Auto-Bid" Logic
│   │       └── handler.ts    # Matching logic triggered by DB streams
│   └── backend.ts       # Main backend configuration
├── src/                 # Frontend (React PWA)
│   ├── components/      # Shared UI components
│   ├── features/        # Feature modules
│   │   ├── feed/       # Item feed/listing view
│   │   ├── camera/     # Photo capture & upload
│   │   └── chat/       # Messaging between users
│   └── App.tsx         # Main app with routing
├── package.json
└── vite.config.ts
```

## Key Files for AI Agents

### 1. Snap & Sell Logic
**File**: `amplify/functions/analyze-image/handler.ts`

**Purpose**: 
- Receives uploaded image from S3
- Calls Amazon Rekognition for object detection (bounding boxes)
- Calls Amazon Bedrock (Claude 3 Haiku) to generate descriptions
- Creates draft listings in DynamoDB

### 2. Autonomous Proxy Agent Logic
**File**: `amplify/functions/proxy-agent/handler.ts`

**Purpose**:
- Triggered by DynamoDB Streams when new items are listed
- Evaluates user-defined agent criteria (semantic matching)
- Automatically places reservations/bids if criteria match
- Sends notifications to users

## Data Models (GraphQL Schema)

**File**: `amplify/data/resource.ts`

Defines:
- `Item` - Listed items with AI-generated metadata
- `ProxyAgent` - User-defined autonomous agents
- `Reservation` - Queue system for item claims
- `User` - User profiles and preferences

## Frontend Structure

```
src/
├── components/
│   ├── ui/              # Shadcn/UI components
│   ├── BottomNav.tsx    # Mobile navigation
│   └── ItemCard.tsx     # Item display component
├── features/
│   ├── feed/
│   │   ├── FeedView.tsx
│   │   └── useItems.ts  # GraphQL queries
│   ├── camera/
│   │   ├── CameraCapture.tsx
│   │   └── useImageUpload.ts
│   └── chat/
│       ├── ChatView.tsx
│       └── useMessages.ts
└── lib/
    ├── amplify.ts       # Amplify configuration
    └── graphql/         # Generated GraphQL types
```

## Deployment Structure

- **Development**: `npx ampx sandbox` - Local development with hot reload
- **Production**: `npx ampx deploy` - Deploys to AWS with CloudFormation

## Key Differences from CDK Structure

1. **No separate `/infrastructure` directory** - Backend code lives in `/amplify`
2. **GraphQL-first** - Data layer defined via GraphQL schema, not CDK constructs
3. **Function co-location** - Lambda functions live with their configuration
4. **Type generation** - GraphQL types auto-generated for frontend
5. **Simplified auth** - No manual Cognito stack, uses Amplify Auth resource
