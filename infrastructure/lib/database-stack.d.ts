import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export declare class DatabaseStack extends cdk.Stack {
    readonly itemsTable: dynamodb.Table;
    readonly seekersTable: dynamodb.Table;
    readonly reservationsTable: dynamodb.Table;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
