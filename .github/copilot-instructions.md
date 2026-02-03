# Retro Board - Copilot Instructions

## Project Overview

This is a Next.js 16 retrospective board application for team collaboration.

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS

## Key Features

- Session-based collaboration (no authentication)
- Colorful sticky notes with drag-and-drop
- Three phases: Writing (private), Reveal, Discussion
- Countdown timer with play/pause/reset
- Real-time sync via polling

## File Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (StickyNote, Timer, PhaseControls, etc.)
- `src/lib/` - Shared utilities and in-memory session store
- `src/types/` - TypeScript type definitions

## Development

- Run `npm run dev` to start development server
- Run `npm run build` to build for production
- Run `npm run lint` to check for linting issues

## Notes

- Session data is stored in-memory (resets on server restart)
- Polling interval is 2 seconds for real-time updates
