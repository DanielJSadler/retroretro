# Retro Board

A collaborative retrospective board for agile teams, built with Next.js 16, React, TypeScript, and Tailwind CSS.

## Features

### Core Functionality

- **No Authentication Required** - Users enter their name to join a session
- **Colorful Sticky Notes** - Create notes in yellow, blue, green, red, or pink
- **Drag and Drop** - Freely move notes around the board
- **Edit & Delete** - Modify or remove your own notes

### Board Phases

1. **Writing Phase** - Notes are private, visible only to the creator
2. **Reveal Phase** - All notes become visible to everyone
3. **Discussion Phase** - Group and discuss notes together

### Timer Feature

- Configurable countdown timer for each phase
- Visual indicator when time is running low (red pulsing)
- Play/Pause/Reset controls
- Duration set in minutes

### Real-Time Collaboration

- Automatic polling for updates every 2 seconds
- See other participants in the session
- Active user indicators

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. Enter your name on the home page
2. Click "Join Session" to enter the board
3. Add notes using the "Add Note" form
4. Drag notes to position them on the board
5. Use Phase Controls to advance through phases
6. Set and start the timer for timed sessions

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + In-Memory Store
- **Real-time Sync**: Polling (2-second intervals)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── session/[sessionId]/
│   │       ├── join/route.ts
│   │       ├── notes/
│   │       │   ├── [noteId]/route.ts
│   │       │   └── route.ts
│   │       ├── phase/route.ts
│   │       ├── timer/
│   │       │   ├── pause/route.ts
│   │       │   ├── reset/route.ts
│   │       │   └── start/route.ts
│   │       └── route.ts
│   ├── board/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── NoteCreator.tsx
│   ├── ParticipantList.tsx
│   ├── PhaseControls.tsx
│   ├── StickyNote.tsx
│   └── Timer.tsx
├── context/
│   └── SessionContext.tsx
├── lib/
│   └── sessionStore.ts
└── types/
    └── index.ts
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Notes

- Session data is stored in-memory and will reset when the server restarts
- For production use, consider adding a database like Redis or PostgreSQL
- Multiple users can collaborate by opening the same URL in different browsers/tabs
# retroretro
