# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language, and Claude AI generates working React code that renders in real-time.

## Common Commands

```bash
# Development (runs Next.js with Turbopack)
npm run dev

# Run all tests
npm test

# Run a single test file
npm test -- src/lib/__tests__/file-system.test.ts

# Run tests in watch mode
npm test -- --watch

# Build for production
npm run build

# Lint
npm run lint

# Database setup/reset
npm run setup          # Install deps, generate Prisma client, run migrations
npm run db:reset       # Reset database with force
```

## Architecture

### Core Flow

1. **Chat Interface** (`src/components/chat/ChatInterface.tsx`) - User describes components
2. **API Route** (`src/app/api/chat/route.ts`) - Streams AI responses using Vercel AI SDK
3. **AI Tools** - Two tools the AI uses to manipulate code:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) - View, create, edit files
   - `file_manager` (`src/lib/tools/file-manager.ts`) - Rename/delete files
4. **Virtual File System** (`src/lib/file-system.ts`) - In-memory file storage, never writes to disk
5. **JSX Transformer** (`src/lib/transform/jsx-transformer.ts`) - Transforms JSX to JS using Babel standalone, creates import maps with esm.sh for dependencies
6. **Preview Frame** (`src/components/preview/PreviewFrame.tsx`) - Renders components in sandboxed iframe using blob URLs

### Key Technical Details

**Virtual File System**: Files exist only in memory (`VirtualFileSystem` class). The AI creates/edits files via tools, and the frontend maintains state through React context. Files serialize to/from the database as JSON.

**JSX Transformation**: Uses `@babel/standalone` to transform TSX/JSX in the browser. Creates blob URLs for each file and builds an import map. Third-party dependencies resolve via `https://esm.sh/{package}`.

**Entry Point Discovery**: Preview looks for files in this order: `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx`, `/src/App.jsx`, `/src/App.tsx`, then falls back to first JSX/TSX file found.

**Import Aliases**: The virtual file system supports `@/` aliases mapping to root. When AI generates imports, it should use `@/components/Component` style.

**Authentication**: JWT-based auth using `jose` library. Session stored in HTTP-only cookie (`auth-token`). Auth required only for saving projects - anonymous users can generate components.

**Database**: SQLite via Prisma. Two models: `User` (email, password) and `Project` (name, messages JSON, data JSON, optional user relation).

### AI Generation Prompt

The system prompt for component generation is in `src/lib/prompts/generation.tsx`. Key constraints:
- Must create `/App.jsx` as entry point
- Use Tailwind CSS for styling
- Use `@/` aliases for local imports
- No HTML files (App.jsx is the entry point)

### File Structure Conventions

- UI components: `src/components/ui/` (shadcn/ui)
- Chat components: `src/components/chat/`
- Editor components: `src/components/editor/`
- Server actions: `src/actions/`
- React contexts: `src/lib/contexts/`
- Custom hooks: `src/hooks/`

### Testing

Uses Vitest with React Testing Library. Test files co-located with source files in `__tests__/` directories.

### Environment Variables

- `ANTHROPIC_API_KEY` - Optional. If not set, uses mock provider that returns static code.
- `JWT_SECRET` - Used for session signing (defaults to dev key)
