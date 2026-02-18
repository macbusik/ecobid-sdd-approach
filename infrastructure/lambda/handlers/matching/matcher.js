"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    console.log('Matcher handler triggered', JSON.stringify(event));
    // TODO: Implement matching logic
    // 1. Parse new item from DynamoDB Stream
    // 2. Query Seekers table for matching tags
    // 3. Calculate tag overlap
    // 4. Send notifications to matched seekers
    for (const record of event.Records) {
        if (record.eventName === 'INSERT') {
            console.log('New item inserted:', record.dynamodb?.NewImage);
            // Matching logic here
        }
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRU8sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTBCLEVBQWlCLEVBQUU7SUFDekUsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFaEUsaUNBQWlDO0lBQ2pDLHlDQUF5QztJQUN6QywyQ0FBMkM7SUFDM0MsMkJBQTJCO0lBQzNCLDJDQUEyQztJQUUzQyxLQUFLLE1BQU0sTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuQyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzdELHNCQUFzQjtRQUN4QixDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUMsQ0FBQztBQWZXLFFBQUEsT0FBTyxXQWVsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCU3RyZWFtRXZlbnQgfSBmcm9tICdhd3MtbGFtYmRhJztcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IER5bmFtb0RCU3RyZWFtRXZlbnQpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgY29uc29sZS5sb2coJ01hdGNoZXIgaGFuZGxlciB0cmlnZ2VyZWQnLCBKU09OLnN0cmluZ2lmeShldmVudCkpO1xuXG4gIC8vIFRPRE86IEltcGxlbWVudCBtYXRjaGluZyBsb2dpY1xuICAvLyAxLiBQYXJzZSBuZXcgaXRlbSBmcm9tIER5bmFtb0RCIFN0cmVhbVxuICAvLyAyLiBRdWVyeSBTZWVrZXJzIHRhYmxlIGZvciBtYXRjaGluZyB0YWdzXG4gIC8vIDMuIENhbGN1bGF0ZSB0YWcgb3ZlcmxhcFxuICAvLyA0LiBTZW5kIG5vdGlmaWNhdGlvbnMgdG8gbWF0Y2hlZCBzZWVrZXJzXG5cbiAgZm9yIChjb25zdCByZWNvcmQgb2YgZXZlbnQuUmVjb3Jkcykge1xuICAgIGlmIChyZWNvcmQuZXZlbnROYW1lID09PSAnSU5TRVJUJykge1xuICAgICAgY29uc29sZS5sb2coJ05ldyBpdGVtIGluc2VydGVkOicsIHJlY29yZC5keW5hbW9kYj8uTmV3SW1hZ2UpO1xuICAgICAgLy8gTWF0Y2hpbmcgbG9naWMgaGVyZVxuICAgIH1cbiAgfVxufTtcbiJdfQ==