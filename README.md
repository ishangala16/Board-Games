<div align="center">
  <h1>🌌 Board Games</h1>
  <p><strong>Cosmic-Themed Multiplayer Board Games Lounge</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?style=for-the-badge&logo=socket.io)](https://socket.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
</div>

> [!NOTE]
> **Board Games** is a real-time multiplayer gaming platform featuring a beautiful dark-mode interface styled with cosmic animated gradients and interactive canvas particle backgrounds.

---

## 🎮 Features & Supported Games

### 🎯 Sequence
* **Objective:** Connect 5 chips in a row (horizontal, vertical, or diagonal).
* **Mechanics:** Use Two-Eyed Jacks as wild cards and One-Eyed Jacks to remove opponent chips.
* **UI Features:** Dynamic card hands, cell highlights (yellow for playable, red for removable), and auto-locks for completed sequences.

### 💎 Splendor
* **Objective:** First player to reach 15 points wins.
* **Mechanics:** Collect gem tokens (White, Blue, Green, Red, Black, and Gold). Purchase development cards to build permanent gemstone bonuses. Attract Nobles for bonus points.

### 🏰 Carcassonne
* **Objective:** Score points by completing features and placing meeples.
* **Mechanics:** Place medieval terrain tiles (Cities, Roads, Monasteries) on a shared board.
* **UI Features:** Supports drag-to-pan, scroll-to-zoom, and tile rotation.

### 🎨 Azul
* **Objective:** Complete your decorative palace wall without breaking tiles.
* **Mechanics:** Draft mosaic tiles from circular factories. Manage tile overflow penalties and claim tile set completion bonuses.

> [!TIP]
> **Single-Player AI Mode**
> Toggle the "Play vs AI" mode in any lobby! The smart AI engine will analyze boards, build paths, evaluate market cards, rotate tiles, and score pattern lines automatically so you can play solo.

---

## ✨ Visual and Interaction Design

* 🌌 **Interactive Background**: Animated canvas-based particle network that drifts in the background. Particles establish links with nearby nodes and react to mouse cursor/touch hover gravity.
* 🎨 **Cosmic Theme**: Deep animated gradient background with a cardboard texture overlay. Visual accents use blue-purple-pink text gradients and glowing focus highlights.
* ⚡ **Micro-Animations**: Custom validation toasts paired with hand-shaking animations for instant feedback on invalid moves.
* 📱 **Responsive Layout**: Mobile-first design, overlapping card hands, floating widgets, and a toggleable slide-out chat panel.

---

## 🚀 Setup and Installation

### Prerequisites
Make sure you have Node.js installed (v18 or v20 recommended).

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```bash
echo "PORT=3000\nNODE_ENV=development" > .env
```

### 3. Run the Development Server
Real-time gameplay uses a combined HTTP and WebSockets connection. Start the server:
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺️ Visual Project Architecture

This project uses a centralized WebSocket server (Express + Socket.io) to manage various isolated game instances in real-time. Below is a visual representation of the architecture. *(These diagrams render natively in Obsidian and GitHub).*

### System Overview

```mermaid
graph TD
    Client[📱 Next.js Frontend] <-->|WebSockets / Socket.io| Server[🖥️ Express Server]
    
    Server --> GameManager[🎲 Game Manager]
    
    GameManager --> Room1[🏠 Room 1]
    GameManager --> Room2[🏠 Room N]
    
    Room1 --> AI[🤖 AI Player]
    Room1 --> GameLogic[🧠 Game Logic Engine]
    
    GameLogic --> Sequence[🎯 Sequence]
    GameLogic --> Splendor[💎 Splendor]
    GameLogic --> Carcassonne[🏰 Carcassonne]
    GameLogic --> Azul[🎨 Azul]
    
    classDef client fill:#1E293B,stroke:#3B82F6,stroke-width:2px,color:#fff;
    classDef server fill:#0F172A,stroke:#10B981,stroke-width:2px,color:#fff;
    classDef game fill:#312E81,stroke:#8B5CF6,stroke-width:2px,color:#fff;
    
    class Client client;
    class Server,GameManager server;
    class Room1,Room2,GameLogic,AI,Sequence,Splendor,Carcassonne,Azul game;
```

### Real-Time Gameplay Flow

```mermaid
sequenceDiagram
    participant Player as 👤 Player
    participant UI as 💻 Next.js UI
    participant Server as ⚙️ Express Server
    participant Game as 🎲 Game Engine

    Player->>UI: Create / Join Room
    UI->>Server: WebSocket Handshake (Join Room)
    Server-->>UI: Connected! Room ID Assigned
    Player->>UI: Select Game & Press Start
    UI->>Server: Start Game (e.g., Azul)
    Server->>Game: Initialize Game State
    Game-->>Server: Initial State Generated
    Server-->>UI: Broadcast State to all Players in Room
    
    loop Turn-Based Gameplay
        Player->>UI: Makes Move (Drag/Click)
        UI->>Server: Send Move Action
        Server->>Game: Validate & Apply Move
        alt Move Invalid
            Game-->>Server: Error
            Server-->>UI: Reject Move (Shake Animation)
        else Move Valid
            Game-->>Server: State Updated
            Server-->>UI: Broadcast New State to All Players
        end
        
        opt Play vs AI enabled
            Game->>Game: Trigger AI Turn Generation
            Game-->>Server: AI Move Executed
            Server-->>UI: Broadcast New State
        end
    end
```

---

## 📁 Directory Structure Breakdown

```mermaid
mindmap
  root((Board Games))
    app
      globals.css
      layout.tsx
      page.tsx
      test
    components
      Chat.tsx
      GameRoom.tsx
      HowToPlayModal.tsx
      InteractiveBackground.tsx
      Lobby.tsx
      VictoryModal.tsx
      games
        AzulBoard.tsx
        CarcassonneBoard.tsx
        SequenceBoard.tsx
        SplendorBoard.tsx
    lib
      db.ts
      GameManager.ts
      games
        AI.ts
        Azul.ts
        Carcassonne.ts
        Sequence.ts
        Splendor.ts
    server.ts
```

> [!IMPORTANT]
> If you are exploring this repository in **Obsidian**, the mermaid diagrams above will render natively as interactive graphs! You can also utilize Obsidian Canvas to lay out the markdown files visually.
