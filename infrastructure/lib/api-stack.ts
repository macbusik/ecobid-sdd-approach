import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  itemsTable: dynamodb.Table;
  seekersTable: dynamodb.Table;
  bucket: s3.Bucket;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // API Gateway
    const api = new apigateway.RestApi(this, 'EcoBidApi', {
      restApiName: 'EcoBid API',
      description: 'API for EcoBid freecycling platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

    // Create Item Lambda (placeholder)
    const createItemHandler = new lambda.Function(this, 'CreateItemHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Create item handler', JSON.stringify(event));
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Item created' }),
          };
        };
      `),
      environment: {
        ITEMS_TABLE: props.itemsTable.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
    });

    props.itemsTable.grantWriteData(createItemHandler);
    props.bucket.grantPut(createItemHandler);

    // API Routes
    const items = api.root.addResource('items');
    items.addMethod('POST', new apigateway.LambdaIntegration(createItemHandler), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
  }
}
