---
inclusion: always
---

# Technology Stack & Engineering Standards

## 1. Frontend: Mobile-First PWA

**Framework**: React 18 + Vite (TypeScript).

**Platform Strategy**: Progressive Web App (PWA).
- Must use `vite-plugin-pwa`.
- Must implement "Add to Home Screen" prompt.

**UI Library**: Shadcn/UI + Tailwind CSS.
- Critical: Design must be touch-friendly (44px min touch targets).
- Use a Bottom Navigation Bar layout (Home, Search, Add, Messages, Profile).

**State Management**: TanStack Query (React Query) for server state.

## 2. Backend: AWS Serverless (Free Tier Optimized)

**IaC**: AWS CDK v2 (TypeScript). All infrastructure must be defined here.

**Compute**: AWS Lambda (Node.js 20.x).
- Rule: Keep lambdas small and single-purpose.
- **Cost Rule**: Do NOT use VPC / NAT Gateways unless absolutely critical. Connect to DynamoDB/S3 over public AWS endpoints to avoid hourly NAT charges.

**Database**: Amazon DynamoDB.
- Billing: On-Demand (Pay-per-request) is safer for prototypes, or Provisioned (5 RCU/5 WCU) for absolute free tier guarantee.
- Data Model: Use a pragmatic approach (One table per entity is fine for MVP speed).

**Storage**: Amazon S3 (Standard Class).
- Lifecycle Policy: Expire images after 30 days to save space.

## 3. AI & Intelligent Features (The "Wow" Factor)

**Image Recognition**: Amazon Rekognition.
- Trigger: S3 Upload -> Lambda -> Rekognition DetectLabels -> DynamoDB Update.
- Limit: Hard limit of 5,000 images/month.

**Matching Engine (The "Brain")**:
- Implementation: DynamoDB Streams.
- Flow: New Item Inserted -> Stream triggers "Matcher Lambda" -> Scans "Seekers" table -> Sends SNS/Push Notification.
- Matching Logic: Tag overlap (e.g., Item Tags ∩ Seeker Tags > 0).

## 4. Auth & User Profile

**Service**: Amazon Cognito (User Pools).
- Attributes: Email, Nickname, Geo-location (City/Zip).
