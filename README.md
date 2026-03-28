# Real-Time AI Interview Assistant

Production-style starter for a live interview helper (ParakitAI-like) using:

- Frontend: Next.js App Router + Tailwind + Web Speech API
- Backend: Node.js + Express + Groq (`llama-3.3-70b-versatile` default) + SSE streaming
- Database: MongoDB (profile + past interview turns)

## Features

- Real-time mic speech-to-text in browser (Web Speech API)
- Instant transcript handoff to backend (`POST /ask`)
- Prompt includes:
  - candidate profile
  - selected mode (`HR` / `Technical` / `Startup`)
  - detected question type (`HR` / `TECHNICAL` / `BEHAVIORAL`)
  - recent question context from MongoDB
- Streaming assistant response tokens to UI
- Structured final response:
  - short answer
  - bullet points
  - confidence tips
- Floating top-right interview overlay with chat-style transcript
- Modular backend services and typed frontend modules

## Project Structure

```text
apps/
  api/   # Express, Groq, MongoDB
  web/   # Next.js App Router + Tailwind UI
  extension/ # Chrome extension floating overlay
```

## Quick Start

1. Install dependencies from repo root:

```bash
npm install
```

2. Configure env files:

```bash
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
```

3. Fill required API env values:

- `apps/api/.env`
  - `GROQ_API_KEY=...`
  - `GROQ_MODEL=llama-3.3-70b-versatile`
  - `GROQ_FALLBACK_MODELS=meta-llama/llama-4-scout-17b-16e-instruct,llama-3.1-8b-instant`
  - `MONGODB_URI=...`
  - `CORS_ORIGIN=*`

4. Run both apps:

```bash
npm run dev
```

5. Open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/health`

## Chrome Extension (Floating Overlay)

The repo also includes a Manifest V3 extension under `apps/extension`.

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click **Load unpacked**
4. Select `apps/extension`
5. Open any page (including Meet), click the extension icon, then press **Start**

Notes:

- This flow is explicit start/stop only (manual control).
- While listening, a visible indicator is shown in the floating panel.
- Use in mock interviews or sessions where participants have explicitly consented.

## API

### `POST /ask` (SSE stream)

Request:

```json
{
  "userId": "user-123",
  "transcript": "Tell me about a challenge you faced.",
  "mode": "HR",
  "profile": {
    "name": "Alex",
    "targetRole": "Software Engineer",
    "yearsExperience": 3,
    "strengths": ["communication", "problem solving"]
  }
}
```

Stream event payloads:

- `{ "type": "token", "token": "..." }`
- `{ "type": "done", "data": { "shortAnswer": "...", "bulletPoints": [...], "confidenceTips": [...], "questionType": "BEHAVIORAL", "raw": "..." } }`
- `{ "type": "error", "message": "..." }`

### `GET /profile/:userId`

Returns stored profile and recent turns.

## Production Notes

- API middleware: `helmet`, `cors`, JSON limits, compression (disabled for `/ask` stream), rate limiting
- Structured logs with `pino`
- Zod request and env validation
- Typed modular services for prompt building, classification, response parsing, and persistence
- Mongo indexes on `userId` for profile and turns

## Browser Requirement

Voice capture uses Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`), which is browser-dependent. Use a compatible Chromium browser for best results.
