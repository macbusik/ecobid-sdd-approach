import * as cdk from 'aws-cdk-lib';
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
export declare class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps);
}
export {};
