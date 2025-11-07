# Real-time Group Chat (Channels, Threads, Presence, Voice Notes)

A production-capable fullstack reference for a real-time group chat app with:
- Channels & threaded replies
- Presence (who's online & typing)
- Voice note recording & upload
- Simple JWT-based demo auth
- REST APIs + Socket.IO realtime server
- Expo React Native mobile client (TypeScript)
- Prisma ORM (SQLite for local dev)
- Docker Compose for local developer environment

This scaffold is intended to be readable, easy to run locally, and easy to extend to production.

Quickstart (local dev)
1. Copy environment files:
   cp .env.example .env
   cp server/.env.example server/.env
   cp mobile/.env.example mobile/.env

2. Start with Docker Compose (recommended):
   docker-compose up --build

   This will build server and mobile images (mobile uses expo dev server) and initialize the SQLite DB.

3. Mobile:
   - If using Expo CLI locally, you can run the mobile app with:
     cd mobile
     npm install
     npm run start

   - Or open Expo Dev Tools at http://localhost:19002 (the docker-compose setup exposes the server for the app).

4. Open the mobile app in Expo Go (scan the QR) or run on a simulator.

API & Sockets
- HTTP API: http://localhost:4000/api
  - POST /api/auth/login { name } -> { token, user }
  - GET  /api/channels -> list channels
  - POST /api/channels -> create channel
  - GET  /api/channels/:id/messages -> fetch messages (with threads)
  - POST /api/media/upload -> upload media (dev: stores in server/uploads)

- Socket.IO (ws://localhost:4000)
  - Authentication via "auth" handshake query param (token)
  - Events:
    - joinChannel / leaveChannel
    - presence:update (server emits participants)
    - message:new
    - message:typing

Why this scaffold is helpful
- Shows full-stack competencies: realtime architecture, mobile native features (audio), backend design, data modeling, security surface.
- Extensible to production: replace SQLite with Postgres, local file uploads with S3 pre-signed URLs, add push notifications, add proper OAuth SSO.

Production notes
- Use HTTPS/WSS and proper CORS + origin checks.
- Replace demo JWT auth with OAuth/OpenID Connect or a robust auth provider.
- Use Postgres and connection pooling (PGBouncer) in production.
- Serve static uploads from S3 or CDN; handle virus scanning and content moderation.
- Add rate-limiting, request size limits, and monitoring (Prometheus/Datadog).

If you want, I can now:
- Convert this dev scaffold to Postgres + seed data.
- Add S3 presigned upload flow and a worker to transcode audio to a streaming-friendly format.
- Implement push notifications and offline message caching.

Enjoy — the project files follow.
