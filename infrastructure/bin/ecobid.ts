#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { StorageStack } from '../lib/storage-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Auth Stack (Cognito)
const authStack = new AuthStack(app, 'EcoBidAuthStack', { env });

// Database Stack (DynamoDB)
const databaseStack = new DatabaseStack(app, 'EcoBidDatabaseStack', { env });

// Storage Stack (S3 + Rekognition)
const storageStack = new StorageStack(app, 'EcoBidStorageStack', { 
  env,
  itemsTable: databaseStack.itemsTable,
});

// API Stack (API Gateway + Lambda)
const apiStack = new ApiStack(app, 'EcoBidApiStack', {
  env,
  userPool: authStack.userPool,
  itemsTable: databaseStack.itemsTable,
  seekersTable: databaseStack.seekersTable,
  bucket: storageStack.bucket,
});
