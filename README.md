# Cozy Tabletop: Cosmic-Themed Multiplayer Board Games Lounge

Cozy Tabletop is a real-time board game platform built with Next.js, WebSockets (Socket.io), and Express. It features a responsive dark-mode interface styled with cosmic animated gradients and interactive canvas particle overlays.

Players can compete in real-time multiplayer lobbies or play against a smart heuristic AI in Sequence, Splendor, Carcassonne, and Azul.

---

## Features

### Supported Games
* **Sequence**
  * Connect 5 chips in a row (horizontal, vertical, or diagonal) to win.
  * Use Two-Eyed Jacks as wild cards and One-Eyed Jacks as action cards to remove opponent chips.
  * Displays dynamic card hands, cell highlights (yellow for playable, red for removable), and auto-locks completed sequences.
* **Splendor**
  * Collect gem tokens (White, Blue, Green, Red, Black, and Gold).
  * Purchase development cards from the market grid to build permanent gemstone bonuses.
  * Attract Nobles (3 points each) when resource conditions are met. First to 15 points wins.
* **Carcassonne**
  * Place medieval terrain tiles (Cities, Roads, and Monasteries) onto a shared board.
  * Supports drag-to-pan, scroll-to-zoom, and tile rotation.
  * Place meeples to claim structures and score points when features are completed.
* **Azul**
  * Draft mosaic tiles from circular factories or the center pool.
  * Place tiles in pattern lines to move them to your decorative palace wall at the end of the round.
  * Manage tile overflow penalties and claim tile set completion bonuses.

### Single-Player AI Mode
Toggle "Play vs AI" mode in the lobby to play solo against a heuristic AI player in any game.
* **Sequence AI**: Analyzes boards to build paths (+10 points) or block you (+5 points), prioritizes immediate wins, and removes threatening opponent chips.
* **Splendor AI**: Evaluates cards in the market, collects gem combinations to resolve deficits, and reserves cards when blocked.
* **Carcassonne AI**: Rotates and tests valid adjacent tile placements, prioritizing Monasteries for meeple placement.
* **Azul AI**: Scores pattern lines to complete rows while avoiding negative floor line overflows.

### Visual and Interaction Design
* **Interactive Background**: Animated canvas-based particle network that drifts in the background. Particles establish links with nearby nodes and react to mouse cursor/touch hover gravity.
* **Cosmic Theme**: Deep animated gradient background with a cardboard texture overlay. Visual accents use blue-purple-pink text gradients and glowing focus highlights.
* **Micro-Animations and Alerts**: Custom validation toasts paired with hand-shaking animations to provide instant feedback on invalid move attempts.
* **Responsive Layout**: Mobile-first design, overlapping card hands, floating widgets, and a toggleable slide-out chat panel that slides out from the right on mobile screens.
* **Copyable Room ID**: Glassmorphic copy button in the room header that copies the current Room ID to clipboard with visual "Copied!" feedback.

---

## Tech Stack
* **Frontend**: React, Next.js (Pages Router / Client-side rendering), Tailwind CSS
* **Backend**: Express Server, Socket.io (WebSocket client-server sync)
* **Language**: TypeScript

---

## Setup and Installation

### Prerequisites
Ensure Node.js (v18 or v20 recommended) is installed on your system.

### 1. Install Dependencies
Navigate to the project root directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
```

### 3. Run the Development Server
Real-time gameplay uses a combined HTTP and WebSockets connection. Run the server entry point:
```bash
npm run dev
```
This script starts the project using `ts-node` and spins up Next.js concurrently on port `3000`.

Open your browser and navigate to:
```
http://localhost:3000
```

---

## Project Architecture
```
├── app/                  # Next.js page layouts and global stylesheet
│   ├── globals.css       # Core styling & custom animations
│   ├── page.tsx          # Landing/Lobby entry container
│   └── test/             # Dev test page suites
├── components/           # React UI components
│   ├── Lobby.tsx         # Dashboard for game selection & AI toggles
│   ├── GameRoom.tsx      # Main game lobby wrapper & chat handler
│   ├── InteractiveBackground.tsx # Canvas interactive particle background
│   ├── Chat.tsx          # Real-time message exchange sidebar
│   ├── VictoryModal.tsx  # Game end celebration screen
│   ├── HowToPlayModal.tsx# Instructions deck for all games
│   └── games/            # Specialized board components (Azul, Sequence, etc.)
├── lib/                  # Shared game engines & logic
│   ├── GameManager.ts    # Server-side room routing & game instances
│   ├── games/            # Pure TypeScript rule classes
│   │   ├── AI.ts         # Move generator heuristics for all 4 games
│   │   ├── Sequence.ts   # Sequence rules & sequence checking
│   │   ├── Splendor.ts   # Splendor token & purchase engines
│   │   ├── Carcassonne.ts# Carcassonne scoring & tile mapping
│   │   └── Azul.ts       # Azul drafts & wall tile matching
└── server.ts             # Express server & Socket.io WebSocket listeners
```

---

## Deployment Configurations

### Google Cloud App Engine
WebSocket servers require a sticky/persistent single-instance runner to prevent Socket.io handshakes from failing across load balancers.

1. Ensure TypeScript is installed in production dependencies:
   ```bash
   npm install ts-node typescript --save
   ```
2. Verify scripts in `package.json`:
   ```json
   "scripts": {
     "build": "next build",
     "start": "ts-node --project tsconfig.json server.ts"
   }
   ```
3. Use the following `app.yaml` configuration:
   ```yaml
   runtime: nodejs20
   env: standard
   instance_class: F2
   automatic_scaling:
     max_instances: 1
   env_variables:
     NODE_ENV: "production"
   ```
4. Deploy using the gcloud CLI:
   ```bash
   gcloud app deploy
   ```

### Quick Ad-hoc Testing (Localtunnel)
To test multiplayer over the internet without deploying to cloud providers:
1. Run the local dev server (`npm run dev`).
2. Run this command in a separate terminal:
   ```bash
   npx localtunnel --port 3000
   ```
3. Share the generated public URL with other players.

---

## Developer Tests
To test individual mechanics in isolation without requiring multiple active players:
1. Start the dev server.
2. Navigate to:
   ```
   http://localhost:3000/test
   ```
From this dashboard, you can verify victory screens, sequence locks, chip removals, and token mechanics.
