# Commentator Page Integration Guide

This document explains what was implemented for the live commentator interface and how to integrate it with `pubg-backend` team logging.

## What Was Added

- New commentator route in frontend:
  - `app/commentator/page.tsx`
- New sidebar navigation link:
  - `utils/NavigationLinks.ts` -> `Commentator Live`

## Data Sources Used

The commentator page consumes backend team logs using both socket and REST:

- Socket bootstrap event: `subscribe_commentary_feed`
- Socket snapshot event: `commentary_feed_snapshot`
- Live incremental event: `team_log_created`
- REST fallback endpoint: `GET /api/v1/team-log/snapshot`

## UX Choices for Distance Readability

- Large responsive text using `clamp(...)`
- Strong contrast surfaces and severity-specific accents
- Compact event cards that prioritize the `title` and `message`
- Top KPI panel for quick awareness:
  - connection state
  - total events
  - highlight count
  - critical count
- Last event timestamp indicator
- Pause/Resume live mode for focused commentary

## Environment Configuration

Create/update `pubg-points/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain/api/v1
# Optional override for socket origin
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain
```

For local development, no website is required. Use localhost values:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

You can also copy from `pubg-points/.env.example` and then adjust as needed.

Notes:

- If `NEXT_PUBLIC_SOCKET_URL` is not set, socket URL is derived from `NEXT_PUBLIC_API_URL` by removing `/api/v1`.
- Keep the frontend and backend protocols aligned (`https` with `https`, `http` with `http`).

## Socket Setup: Localhost vs Website

You can run socket completely on localhost.

- Frontend: `http://localhost:3000`
- Backend API + Socket.IO: `http://localhost:8000`

You only need a public website/domain when you deploy online.

## Backend Requirements

In backend environment:

```bash
CORS_ORIGIN=https://your-frontend-domain
```

Local backend example:

```bash
CORS_ORIGIN=http://localhost:3000
PORT=8000
```

You can copy from `pubg-backend/.env.example` and then set your actual database URI.

The backend already supports:

- `/api/v1/team-log/snapshot`
- `subscribe_commentary_feed` socket handler
- live `team_log_created` broadcast

## Run and Verify

1. Start backend:

```bash
cd pubg-backend
npm install
npm run dev
```

2. Start frontend:

```bash
cd pubg-points
npm install
npm run dev
```

3. Open commentator page:

- `http://localhost:3000/commentator`

4. Validation checklist:

- Initial logs appear immediately (snapshot)
- Live events appear on top when kills/eliminations/positions are updated
- Severity badge colors are visible and distinct
- Text remains readable on tablet/desktop at a distance

## Troubleshooting

- No data shown:
  - Check `NEXT_PUBLIC_API_URL`
  - Verify backend route `GET /api/v1/team-log/snapshot`
- Realtime not working:
  - Check socket connectivity in browser network tab
  - Set explicit `NEXT_PUBLIC_SOCKET_URL`
  - Ensure backend CORS origin exactly matches frontend origin
- Duplicate or missing events:
  - Page includes event de-duplication by log `_id`
  - Refresh snapshot button can restore feed state
