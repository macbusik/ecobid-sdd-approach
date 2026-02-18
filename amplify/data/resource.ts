import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== ECOBID DATA SCHEMA ===================================================
Agentic Marketplace Schema for EcoBid
- UserProfile: Stores user preferences for agent matching
- Item: Listings with AI-generated metadata (tags, descriptions, condition)
- Match: Records of successful agent-to-item matches
=========================================================================*/

const schema = a.schema({
  UserProfile: a
    .model({
      userId: a.string().required(),
      displayName: a.string(),
      location: a.string(),
      preferences: a.string(), // JSON string of user preferences for agent matching
      agentInstructions: a.string(), // Natural language instructions for proxy agent
      notificationPreferences: a.json(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.guest().to(['read']),
    ]),

  Item: a
    .model({
      title: a.string().required(),
      description: a.string(),
      category: a.string(),
      imageUrl: a.string(),
      imageKeys: a.string().array(), // S3 keys for multiple images
      
      // AI Analysis Results
      aiTags: a.string().array(), // AI-generated tags from Rekognition
      aiDescription: a.string(), // AI-generated description from Bedrock
      aiConditionAssessment: a.string(), // AI assessment of item condition
      
      // Item Status
      status: a.enum(['DRAFT', 'ACTIVE', 'RESERVED', 'COMPLETED', 'CANCELLED']),
      
      // Location & Metadata
      location: a.string(),
      condition: a.string(), // User-confirmed condition
      estimatedValue: a.float(),
      
      // Ownership
      ownerId: a.string().required(),
      ownerName: a.string(),
      
      // Timestamps
      listedAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'update', 'delete']),
      allow.guest().to(['read']),
    ]),

  Match: a
    .model({
      userId: a.string().required(), // The seeker who gets matched
      itemId: a.string().required(), // The item that matched
      
      // Match Details
      matchScore: a.float(), // Confidence score from AI matching
      matchReason: a.string(), // Explanation of why this matched
      agentInstructions: a.string(), // The instructions that triggered this match
      
      // Match Status
      status: a.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED']),
      
      // Timestamps
      matchedAt: a.datetime(),
      respondedAt: a.datetime(),
      expiresAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner().to(['read', 'update']),
      allow.guest().to(['read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
