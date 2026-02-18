---
inclusion: always
---

# Product Vision: EcoBid (AWS 10k AIdeas Challenge)

## Elevator Pitch

EcoBid is a mobile-first PWA that streamlines the "freecycling" process. It replaces chaotic Facebook "trash groups" with a structured platform for giving away and claiming unwanted items. It solves the friction of "who commented first" by introducing a transparent Reservation Queue and uses AI to auto-match "Seekers" with "Givers".

## User Personas

**The Giver (Donor)**: Has a cluttered home. Wants to get rid of items fast without managing 50 DM conversations.

**The Seeker (Receiver)**: Individuals, teachers, or foundations looking for specific items (e.g., "plywood," "office chair").

**The Community**: Localized groups (Warsaw, Wroclaw) built around trust and reducing waste.

## Core Mechanisms (The "Secret Sauce")

### 1. The "Smart Give" Flow (AI Powered)

- User snaps a photo.
- AWS Rekognition auto-tags the item (e.g., "Chair", "Wood", "Furniture").
- System suggests a title and category.
- Item is posted to the local feed.

### 2. The "Reservation Queue" (No Bidding Wars)

**Problem**: On Facebook, it's a race of comments ("Priv", "Me!").

**Solution**: Users click "Reserve". They enter a Queue.

- Position #1 gets a reservation window (e.g., 4 hours) to chat/confirm pickup.
- If #1 expires or cancels, the item automatically offers itself to #2.
- No manual selection by the Giver is required (unless they choose to "bump" someone).

### 3. The "Seek & Match" Engine (Primary Traffic Driver)

- Users post "I am looking for X".
- **Auto-matching**: When a Giver uploads an item, the system checks "Seek" requests.
- **AI Logic**: If a Giver uploads "Plywood" and a School seeks "Wood sheets", the system notifies the School immediately.

## Strategic Constraints (AWS Free Tier)

- **Strict No-Cost Policy**: We rely on Free Tier limits (Lambda 400k GB-seconds, DynamoDB 25GB, Rekognition 5k images).
- **Prototyping Speed**: Logic first, visuals second. Use standard UI components.
