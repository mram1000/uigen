# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/MessageInput.test.tsx

# Reset database (destructive)
npm run db:reset
```

All `next` commands require the `node-compat.cjs` polyfill — the npm scripts handle this automatically via `NODE_OPTIONS='--require ./node-compat.cjs'`. Do not call `next` directly without it.

After modifying `prisma/schema.prisma`, run `npx prisma migrate dev` to apply changes and regenerate the client. The Prisma client outputs to `src/generated/prisma` (not the default location).

## Architecture

### Overview

UIGen is a Next.js 15 App Router application where users describe React components in a chat interface and Claude generates them with live preview. All generated code lives in an **in-memory virtual file system** — nothing is written to disk.

### Virtual File System (`src/lib/file-system.ts`)

`VirtualFileSystem` is a tree-structured in-memory FS. It is the central shared state for generated code. The class is instantiated fresh on each API request (server-side) and maintained as React context on the client. Key points:
- `serialize()` / `deserializeFromNodes()` convert between the Map-based internal structure and a plain object for JSON transport and DB storage.
- Projects store both `messages` (JSON array) and `data` (serialized VFS) in the Prisma `Project` model.

### AI Pipeline (`src/app/api/chat/route.ts`)

The POST handler reconstructs a `VirtualFileSystem` from the client-sent `files`, then calls Vercel AI SDK `streamText` with two tools:
- **`str_replace_editor`** (`src/lib/tools/str-replace.ts`): create, str_replace, view, and insert operations on files.
- **`file_manager`** (`src/lib/tools/file-manager.ts`): rename and delete operations.

The AI operates on the server-side VFS instance; tool results mutate it. On finish, the final VFS state and full message history are persisted to the DB (authenticated users only).

**Provider selection** (`src/lib/provider.ts`): If `ANTHROPIC_API_KEY` is absent, a `MockLanguageModel` returns static hardcoded component code. When the key is present, the real model is `claude-haiku-4-5`.

### Live Preview (`src/components/preview/PreviewFrame.tsx` + `src/lib/transform/jsx-transformer.ts`)

The preview renders inside a sandboxed `<iframe>` using `srcdoc`. The pipeline:
1. All files from the VFS are passed to `createImportMap()`.
2. Each `.js/.jsx/.ts/.tsx` file is transformed with `@babel/standalone` (JSX + optional TypeScript).
3. Each transformed file becomes a blob URL; these are assembled into an ES module import map.
4. Third-party imports (e.g., `lucide-react`) are auto-mapped to `https://esm.sh/<package>`.
5. Missing local imports get placeholder stub modules to avoid crashes.
6. `createPreviewHTML()` generates the full HTML document with the import map, injected CSS, and a React root that mounts the entry point.

Entry point detection order: `/App.jsx` → `/App.tsx` → `/index.jsx` → `/index.tsx` → `/src/App.jsx` → first `.jsx`/`.tsx` found.

The `@/` import alias in generated code maps to the root of the virtual FS (e.g., `@/components/Foo` → `/components/Foo`), not to `src/`.

### Client State (React Contexts)

- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): Wraps the VFS instance; exposes file CRUD and a `handleToolCall` method that applies AI tool calls (streamed from the chat) to the VFS and triggers re-renders via `refreshTrigger`.
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): Manages the Vercel AI SDK `useChat` hook, routes incoming tool calls to `FileSystemContext.handleToolCall`, and tracks project state.

### Authentication

Custom JWT auth using `jose` — no NextAuth. Sessions are stored in an HTTP-only cookie (`auth-token`, 7-day expiry). Passwords are hashed with `bcrypt`. Auth logic lives in `src/lib/auth.ts` (server-only). The middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem` routes.

Anonymous users can generate components without signing in; work is tracked in `sessionStorage` via `src/lib/anon-work-tracker.ts`. On sign-up/sign-in, anonymous work can be migrated to their account.

### Database

SQLite via Prisma. Two models: `User` (email + hashed password) and `Project` (belongs to optional `User`, stores `messages` and `data` as JSON strings). Anonymous projects have `userId: null`.

### Server Actions (`src/actions/`)

Auth operations (`signUp`, `signIn`, `signOut`, `getUser`) live in `src/actions/index.ts` as Next.js Server Actions. Project CRUD lives in `src/actions/create-project.ts`, `get-project.ts`, and `get-projects.ts`.

### Generation Prompt (`src/lib/prompts/generation.tsx`)

The system prompt instructs the AI to follow these rules when generating code:
- Every project must have a root `/App.jsx` as its entry point — always create this first.
- All local imports must use the `@/` alias (e.g., `@/components/Foo`), not relative paths.
- Style exclusively with Tailwind CSS — no hardcoded styles.
- Do not create HTML files; `/App.jsx` is the entrypoint.

### Testing

Tests use Vitest + jsdom + React Testing Library. Test files are colocated in `__tests__/` directories next to the source they test.
