---
inclusion: always
---

# Monorepo Structure

## Root
- `package.json` (Workspaces orchestration)
- `.kiro/` (Agent configuration)
- `docs/` (Architecture diagrams, Kiro logs)

## /infrastructure (CDK Backend)
```
bin/
  ecobid.ts (App entry point)
lib/
  auth-stack.ts (Cognito)
  database-stack.ts (DynamoDB tables)
  api-stack.ts (API Gateway + Lambdas)
  storage-stack.ts (S3 + Rekognition triggers)
lambda/ (Source code for handlers)
  handlers/
    items/
      createItem.ts
    matching/
      matcher.ts
```

## /frontend (React PWA)
```
src/
  components/ (Shared UI: Button, Card, BottomNav)
  features/ (Domain specific)
    feed/ (Main list view)
    give/ (Camera flow, upload)
    queue/ (Reservation logic)
  lib/ (AWS Amplify configuration)
```
