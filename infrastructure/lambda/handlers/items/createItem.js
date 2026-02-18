"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    console.log('Create item handler', JSON.stringify(event));
    // TODO: Implement item creation logic
    // 1. Parse request body
    // 2. Generate itemId
    // 3. Store in DynamoDB
    // 4. Return presigned S3 URL for image upload
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            message: 'Item created successfully',
            itemId: 'placeholder-id',
        }),
    };
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlSXRlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNyZWF0ZUl0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRU8sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUMxQixLQUEyQixFQUNLLEVBQUU7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFMUQsc0NBQXNDO0lBQ3RDLHdCQUF3QjtJQUN4QixxQkFBcUI7SUFDckIsdUJBQXVCO0lBQ3ZCLDhDQUE4QztJQUU5QyxPQUFPO1FBQ0wsVUFBVSxFQUFFLEdBQUc7UUFDZixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsa0JBQWtCO1lBQ2xDLDZCQUE2QixFQUFFLEdBQUc7U0FDbkM7UUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNuQixPQUFPLEVBQUUsMkJBQTJCO1lBQ3BDLE1BQU0sRUFBRSxnQkFBZ0I7U0FDekIsQ0FBQztLQUNILENBQUM7QUFDSixDQUFDLENBQUM7QUF0QlcsUUFBQSxPQUFPLFdBc0JsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoXG4gIGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudFxuKTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcbiAgY29uc29sZS5sb2coJ0NyZWF0ZSBpdGVtIGhhbmRsZXInLCBKU09OLnN0cmluZ2lmeShldmVudCkpO1xuXG4gIC8vIFRPRE86IEltcGxlbWVudCBpdGVtIGNyZWF0aW9uIGxvZ2ljXG4gIC8vIDEuIFBhcnNlIHJlcXVlc3QgYm9keVxuICAvLyAyLiBHZW5lcmF0ZSBpdGVtSWRcbiAgLy8gMy4gU3RvcmUgaW4gRHluYW1vREJcbiAgLy8gNC4gUmV0dXJuIHByZXNpZ25lZCBTMyBVUkwgZm9yIGltYWdlIHVwbG9hZFxuXG4gIHJldHVybiB7XG4gICAgc3RhdHVzQ29kZTogMjAwLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgbWVzc2FnZTogJ0l0ZW0gY3JlYXRlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgaXRlbUlkOiAncGxhY2Vob2xkZXItaWQnLFxuICAgIH0pLFxuICB9O1xufTtcbiJdfQ==