# 🌌 Cozy Tabletop: Cosmic-Themed Responsive Board Games Lounge

Cozy Tabletop is a high-fidelity, real-time board game platform built with Next.js, WebSockets (Socket.io), and Express. It features a premium, responsive dark mode styled with cosmic-inspired animated gradients and interactive canvas particle overlays. 

Players can compete in real-time multiplayer lobbies or play against a smart heuristic AI in **Sequence**, **Splendor**, **Carcassonne**, and **Azul**.

---

## ✨ Features

### 🎮 The Games
1. **Sequence (🃏)**
   - Connect 5 chips in a row (horizontal, vertical, or diagonal) to win.
   - Use Two-Eyed Jacks as wild cards and One-Eyed Jacks as action cards to remove opponent chips.
   - Dynamic cards hand overlay, cell highlights (yellow for playable, red for removable), and automatic sequence lock verification.
2. **Splendor (💎)**
   - Collect gem tokens (White, Blue, Green, Red, Black, and Gold).
   - Purchase development cards from the market grid to build permanent gemstone bonuses.
   - Attract Nobles (3 points each) when resource conditions are met. First to 15 points wins.
3. **Carcassonne (🏰)**
   - Place medieval terrain tiles (Cities, Roads, and Monasteries) onto a shared board.
   - Drag to pan, scroll to zoom, and rotate tiles.
   - Place meeples to claim structures and score points when features are completed.
4. **Azul (🟦)**
   - Draft mosaic tiles from circular factories or the center pool.
   - Place tiles in pattern lines to move them to your decorative palace wall at the end of the round.
   - Avoid floor overflow penalties and claim tile set completion bonuses.

### 🧠 Single-Player AI Mode
Toggle **Play vs AI** mode in the lobby to play solo against `"AI_PLAYER"` in any game. The AI runs customized heuristics:
- **Sequence AI**: Scores boards to build paths (+10 points) or block you (+5 points), prioritizes immediate wins, and removes threatening opponent chips.
- **Splendor AI**: Evaluates cards in the market, takes gem combinations to resolve deficits, and reserves cards when blocked.
- **Carcassonne AI**: Rotates and tests valid adjacent tile placements, automatically claiming Monasteries with meeples.
- **Azul AI**: Scores pattern lines to complete rows while avoiding negative floor line overflows.

### 🎨 Visual & Motion Design
- **Interactive Background**: An animated `<canvas>` particle network drifts behind the screen, establishing glowing links between nearby nodes and drawing nodes in with a smooth gravitational pull near the mouse cursor or touch points.
- **Cosmic Theme**: A sleek animated background gradient (`#080b11` to `#121824` to `#1a1128`) layered with a subtle cardboard noise texture overlay. Visual accents use blue-purple-pink text gradients and glowing indigo/purple focus highlights.
- **Micro-Animations & Toast Alerts**: Custom auto-dismissing warning toast overlays paired with hand-shaking and card-cell-shaking animations to give elegant feedback on invalid move attempts.
- **Responsive Mobile Layout**: Mobile-first designs, overlapping cards hand visibility, floating user widgets, and toggleable overlay room chats that default to closed on small viewports.

---

## 🛠️ Tech Stack
- **Frontend**: React, Next.js (Pages Router / Client-side rendering), Tailwind CSS
- **Backend**: Express Server, Socket.io (WebSocket client-server sync)
- **Real-Time State**: Multi-step action state loops managed on the server instance
- **Language**: TypeScript

---

## 🚀 Setup & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or v20 recommended).

### 1. Install Dependencies
Navigate to the project root directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory if it does not already exist:
```env
PORT=3000
NODE_ENV=development
```

### 3. Run the Development Server
Since the real-time gameplay uses a combined HTTP and WebSockets connection, you must run the server entry point (`server.ts`):
```bash
npm run dev
```
*(This script builds/runs the project using ts-node and spins up Next.js concurrently on port `3000`)*

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🏗️ Project Architecture
```
├── app/                  # Next.js page layouts and global stylesheet
│   ├── globals.css       # Core styling & custom shake animations
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

## 🛜 Deployment Configurations

### Google Cloud App Engine
WebSocket servers require a sticky/persistent single-instance runner to prevent Socket.io handshakes from failing across load balancers. 

1. Ensure TypeScript runs in production dependencies:
   ```bash
   npm install ts-node typescript --save
   ```
2. Build and verify scripts inside `package.json`:
   ```json
   "scripts": {
     "build": "next build",
     "start": "ts-node --project tsconfig.json server.ts"
   }
   ```
3. Use the following `app.yaml` config:
   ```yaml
   runtime: nodejs20
   env: standard
   instance_class: F2
   automatic_scaling:
     max_instances: 1
   env_variables:
     NODE_ENV: "production"
   ```
4. Deploy using gcloud CLI:
   ```bash
   gcloud app deploy
   ```

### Quick Ad-hoc Testing (Localtunnel)
If you want to quickly test multiplayer with a friend over the internet without deploying to cloud providers:
1. Fire up the local dev server (`npm run dev`).
2. Run this command in a separate terminal:
   ```bash
   npx localtunnel --port 3000
   ```
3. Share the generated public URL link with your friends!

---

## 🧪 Developer Tests
We have built an offline developer guide and testing suite to verify individual mechanics in isolation without requiring multiple connections.
Navigate to the following route in your browser when running locally:
```
http://localhost:3000/test
```
You can verify Victory screens, One-Eyed Jack chip removals, Locked Sequences, and Splendor token mechanics.
