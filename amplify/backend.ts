import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { analyzeImage } from './functions/analyze-image/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  analyzeImage,
});

// Get references to resources
const { analyzeImage: analyzeImageFunction } = backend;
const { bucket } = backend.storage.resources;
const itemTable = backend.data.resources.tables['Item'];

// Grant IAM permissions for Rekognition
analyzeImageFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['rekognition:DetectLabels'],
    resources: ['*'],
  })
);

// Grant IAM permissions for Bedrock (scoped to Claude 3 Haiku)
analyzeImageFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['bedrock:InvokeModel'],
    resources: [
      'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-*',
    ],
  })
);

// Grant IAM permissions for S3 (scoped to uploads prefix)
analyzeImageFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['s3:GetObject'],
    resources: [`${bucket.bucketArn}/uploads/*`],
  })
);

// Grant IAM permissions for DynamoDB (scoped to Item table)
analyzeImageFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:UpdateItem', 'dynamodb:GetItem'],
    resources: [itemTable.tableArn],
  })
);

// Add environment variables (AWS_REGION is automatically provided by Lambda)
analyzeImageFunction.addEnvironment('ITEM_TABLE_NAME', itemTable.tableName);
analyzeImageFunction.addEnvironment('STORAGE_BUCKET_NAME', bucket.bucketName);

// Configure S3 event notifications using bucket.addEventNotification
// This avoids circular dependency by configuring from the bucket side
const lambdaDestination = new LambdaDestination(analyzeImageFunction.resources.lambda);

bucket.addEventNotification(
  EventType.OBJECT_CREATED,
  lambdaDestination,
  { prefix: 'uploads/', suffix: '.jpg' }
);

bucket.addEventNotification(
  EventType.OBJECT_CREATED,
  lambdaDestination,
  { prefix: 'uploads/', suffix: '.jpeg' }
);

bucket.addEventNotification(
  EventType.OBJECT_CREATED,
  lambdaDestination,
  { prefix: 'uploads/', suffix: '.png' }
);

bucket.addEventNotification(
  EventType.OBJECT_CREATED,
  lambdaDestination,
  { prefix: 'uploads/', suffix: '.heic' }
);
