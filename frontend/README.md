# Shazam Visual - Frontend

Next.js frontend for visual album cover search.

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure API URL:**
   Copy `.env.example` to `.env.local` and update if needed:
   ```bash
   cp .env.example .env.local
   ```

3. **Run development server:**
   ```bash
   pnpm dev
   ```

4. **Open browser:**
   Visit http://localhost:3000

## Features

- **Search by Text**: Enter text descriptions to find similar album covers
- **Search by Image**: Upload an image to find visually similar albums
- **Real-time Results**: See similarity scores and album/genre IDs
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hooks

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000` by default.
Update `NEXT_PUBLIC_API_URL` in `.env.local` to change the API endpoint.
