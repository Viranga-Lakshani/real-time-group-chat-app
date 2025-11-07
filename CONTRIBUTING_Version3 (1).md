```markdown
# Contributing

Thanks for exploring this chat reference app.

Local development
- Copy .env.example files and update if needed.
- Use Docker Compose to start server + db + mobile dev container:
  docker-compose up --build

- Alternatively run services locally:
  - Server:
    cd server
    npm install
    npx prisma generate
    npx prisma migrate dev --name init
    npm run dev
  - Mobile:
    cd mobile
    npm install
    npm start

Code style
- Keep code readable and commented. Add tests for server routes and socket flows.

PRs
- Small, focused PRs are easiest to review. Include migration steps for DB changes.
```