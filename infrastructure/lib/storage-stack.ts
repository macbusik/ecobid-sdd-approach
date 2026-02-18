import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  itemsTable: dynamodb.Table;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly webBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // S3 Bucket for web hosting
    this.webBucket = new s3.Bucket(this, 'WebHostingBucket', {
      bucketName: `ecobid-web-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 Bucket for images
    this.bucket = new s3.Bucket(this, 'ItemImagesBucket', {
      bucketName: `ecobid-images-${this.account}`,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'], // Restrict in production
          allowedHeaders: ['*'],
        },
      ],
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30), // Free tier optimization
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda for Rekognition processing
    const rekognitionHandler = new lambda.Function(this, 'RekognitionHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Rekognition handler triggered', JSON.stringify(event));
          // TODO: Implement Rekognition DetectLabels
          return { statusCode: 200 };
        };
      `),
      environment: {
        ITEMS_TABLE: props.itemsTable.tableName,
      },
    });

    // Grant Rekognition permissions
    rekognitionHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['rekognition:DetectLabels'],
        resources: ['*'],
      })
    );

    // Grant S3 read permissions
    this.bucket.grantRead(rekognitionHandler);

    // Grant DynamoDB write permissions
    props.itemsTable.grantWriteData(rekognitionHandler);

    // S3 trigger for Lambda
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(rekognitionHandler)
    );

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Images bucket name',
      exportName: 'EcoBidImagesBucketName',
    });

    new cdk.CfnOutput(this, 'WebBucketName', {
      value: this.webBucket.bucketName,
      description: 'Web hosting bucket name',
      exportName: 'EcoBidWebBucketName',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: this.webBucket.bucketWebsiteUrl,
      description: 'Website URL',
      exportName: 'EcoBidWebsiteUrl',
    });
  }
}
