---
inclusion: always
---

# Product Vision: EcoBid (Agentic Circular Marketplace)

## Core Value Proposition

EcoBid is a mobile-first marketplace that transforms the chaotic "Buy Nothing" groups into an efficient, Agentic Exchange System.

We replace manual searching with **Autonomous Proxy Agents** and manual listing with **Multimodal AI Vision**.

## The "Wow" Features (Hackathon Priorities)

### 1. Snap & Sell (Multimodal Vision)

**Problem**: Posting items is tedious.

**Solution**: User takes one photo of a cluttered pile (e.g., garage sale style).

**AI Workflow**:
- **Segment**: AI identifies individual objects in the scene.
- **Tag & Describe**: Generates title, category, and condition for each item automatically.
- **Draft**: Creates 5-10 draft listings from a single click.

**Tech**: Amazon Rekognition (Bounding Boxes) + Bedrock (Claude 3 Haiku for descriptions).

### 2. Autonomous Proxy Agents (The "Brain")

**Problem**: "First come, first served" favors people glued to their phones.

**Solution**: Buyers deploy "Proxy Agents" with natural language instructions (e.g., "Find me a wooden desk for a student, nearby").

**AI Workflow**:
- **Listen**: Agent monitors the stream of new items (Event-Driven).
- **Reason**: Agent evaluates if an item matches the semantic intent of the user.
- **Act**: Agent places a "Reservation" or "Bid" instantly if criteria are met.

## User Journey

**Giver**: Snaps photo → Confirms AI suggestions → Item Listed.

**Seeker**: Says "I need a bike" → Closes app.

**System**: AI matches Item to Seeker → Notification: "Your Agent found a match!".

## Strategic Constraints (AWS Free Tier)

- **Strict No-Cost Policy**: We rely on Free Tier limits (Lambda 400k GB-seconds, DynamoDB 25GB, Rekognition 5k images).
- **Prototyping Speed**: Logic first, visuals second. Use standard UI components.
- **Agentic Focus**: Prioritize autonomous agent capabilities over manual workflows.
