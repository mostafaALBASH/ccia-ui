# UIGen

AI-powered React component generator with live preview.

## Prerequisites

- Node.js 18+
- npm

## Setup

1. **Optional** Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

The project will run without an API key. Rather than using a LLM to generate components, static code will be returned instead.

2. Install dependencies and initialize database

```bash
npm run setup
```

This command will:

- Install all dependencies
- Generate Prisma client
- Run database migrations

## Running the Application

### Development

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Sign up or continue as anonymous user
2. Describe the React component you want to create in the chat
3. View generated components in real-time preview
4. Switch to Code view to see and edit the generated files
5. Continue iterating with the AI to refine your components

## Features

- AI-powered component generation using Claude
- Live preview with hot reload
- Virtual file system (no files written to disk)
- Syntax highlighting and code editor
- Component persistence for registered users
- Export generated code

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma with SQLite
- Anthropic Claude AI
- Vercel AI SDK

## Claude Code Integrations

This repository is instrumented end-to-end with [Claude Code](https://docs.claude.com/en/docs/claude-code) to keep reviews, fixes, and checks close to the code. A quick map of what is wired up and where:

### GitHub Actions

- **`@claude` PR assistant** - [.github/workflows/claude.yml](.github/workflows/claude.yml) runs the [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action) whenever someone mentions `@claude` in an issue, PR comment, or review. It can install the project, run the dev server, query SQLite, and open fixes as commits on the PR branch.
- **Automated PR review** - [.github/workflows/claude-code-review.yml](.github/workflows/claude-code-review.yml) runs Claude on every opened / synchronized PR and posts an inline code review against CLAUDE.md conventions (virtual file system, JSX transformer, `@/` aliases, `/App.jsx` entry point, Tailwind, test coverage).

Both workflows require an `ANTHROPIC_API_KEY` repository secret.

### Local hook

- **Post-edit typecheck** - [.claude/settings.json](.claude/settings.json) registers a `PostToolUse` hook on `Write|Edit` that runs [.claude/hooks/typecheck-on-edit.cjs](.claude/hooks/typecheck-on-edit.cjs) after Claude touches a `.ts`/`.tsx` file. The hook runs `npm run typecheck` asynchronously (`async: true`, `asyncRewake: true`), so edits are not blocked but any type error is fed straight back into Claude's context - Claude fixes its own regressions in the same turn instead of discovering them later in CI.

### Custom slash commands

Available in [.claude/commands/](.claude/commands/):

- **`/run-app`** - runs `npm run setup`, starts `npm run dev:daemon`, tails `logs.txt`, and verifies `http://localhost:3000` responds.
- **`/check`** - runs the full local quality gate: `npm run typecheck`, `npm test -- --run`, `npm run build`.
- **`/audit`** - runs `npm audit` and applies non-breaking fixes.

### Project instructions

- [CLAUDE.md](CLAUDE.md) gives Claude the architectural ground-truth (virtual file system, JSX transformer, entry-point discovery, auth, DB) so every invocation - local or in CI - starts from the same mental model.
