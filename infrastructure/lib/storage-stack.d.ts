import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
interface StorageStackProps extends cdk.StackProps {
    itemsTable: dynamodb.Table;
}
export declare class StorageStack extends cdk.Stack {
    readonly bucket: s3.Bucket;
    readonly webBucket: s3.Bucket;
    constructor(scope: Construct, id: string, props: StorageStackProps);
}
export {};
