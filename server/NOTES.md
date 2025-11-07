```markdown
Developer notes / next improvements

1) Production database
- Switch Prisma to Postgres in server/.env and Docker Compose, run prisma migrate deploy, and seed.

2) Auth
- Replace demo base64 token with proper JWT signed with JWT_SECRET and secure refresh tokens.
- Add email or OAuth providers for login.

3) Media
- Replace local uploads with S3 pre-signed URLs. Protect uploads and validate file types.
- Add background transcoding if you want to normalize voice notes.

4) Presence & scaling
- For multi-server Socket.IO, use Redis adapter to share presence/state between nodes.
- Persist presence heartbeat briefly to Redis for reliability.

5) Push notifications
- Implement FCM & APNs server (for mobile) to notify users when app is backgrounded.

6) Tests
- Add unit tests for server routes and Socket.IO flows.
- Add E2E tests for mobile with Detox or Appium.

7) Security & monitoring
- Add rate limiting, request size limits, input validation.
- Monitor with logs, metrics, and distributed tracing.

If you'd like, I can:
- Convert DB to Postgres and add migration automation.
- Implement S3 pre-signed uploads and a transcoder for voice notes.
- Add Redis adapter for Socket.IO and scale-out instructions.
