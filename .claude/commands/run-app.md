---
description: Install deps, generate Prisma client, run migrations, and start the UIGen dev server as a daemon.
---

Bring the UIGen app up end-to-end and verify it is serving.

Do the following in order:

1. Run `npm run setup` - installs dependencies (no `--legacy-peer-deps` needed), generates the Prisma client, and runs migrations.
2. Start the dev server with `npm run dev:daemon`. This writes logs to `logs.txt` and returns immediately.
3. Wait a few seconds, then tail `logs.txt` and confirm you see a line like `Ready in <n>ms` or `- Local: http://localhost:3000`.
4. Fetch `http://localhost:3000` with a simple HTTP check and confirm it returns `200`.
5. Report back:
   - Whether the app is running
   - The port it is listening on
   - Any warnings or errors from `logs.txt`

If any step fails, show the relevant lines from `logs.txt` and stop before attempting to fix - ask the user how they want to proceed.
