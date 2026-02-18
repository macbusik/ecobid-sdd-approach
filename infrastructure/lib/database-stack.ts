import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly itemsTable: dynamodb.Table;
  public readonly seekersTable: dynamodb.Table;
  public readonly reservationsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Items Table
    this.itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      tableName: 'ecobid-items',
      partitionKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Free tier friendly
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // For matching engine
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev only
    });

    // GSI for querying by location
    this.itemsTable.addGlobalSecondaryIndex({
      indexName: 'LocationIndex',
      partitionKey: { name: 'city', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Seekers Table
    this.seekersTable = new dynamodb.Table(this, 'SeekersTable', {
      tableName: 'ecobid-seekers',
      partitionKey: { name: 'seekerId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Reservations Table (Queue)
    this.reservationsTable = new dynamodb.Table(this, 'ReservationsTable', {
      tableName: 'ecobid-reservations',
      partitionKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'position', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'ItemsTableName', {
      value: this.itemsTable.tableName,
    });
  }
}
