---
description: Run the full local quality gate - typecheck, tests, and production build.
---

Run the project's full quality gate and report the results.

Execute these commands in order and show a short summary of each:

1. `npm run typecheck` - strict TypeScript check.
2. `npm test -- --run` - Vitest in single-run (non-watch) mode.
3. `npm run build` - production Next.js build.

For each step, report:
- Pass / fail
- Duration
- Any notable warnings

If any step fails, show the failing output (tail, not full) and stop before running the next step.

After all steps pass, reply with a single line: `Quality gate: PASS`.
