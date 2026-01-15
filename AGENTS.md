# AGENTS.md - Game Solo Development Guide

## Build Commands

```bash
# Install dependencies
npm install

# Development (requires 2 terminals)
npm run dev      # Vite dev server on port 5173
npm run server   # Express signaling server on port 3005

# Production build
npm run build    # TypeScript check + Vite build to /dist

# Preview production build
npm run preview

# Linting
npm run lint     # ESLint for all .ts/.tsx files

# Docker deployment
docker build -t game-solo .
docker run -p 3005:3005 game-solo
docker compose up --build -d
```

## Code Style Guidelines

### Imports and Exports
- Use absolute imports with paths defined in tsconfig (e.g., `import { BootScene } from './scenes/BootScene'`)
- Use named exports for components and utilities
- Export singletons (e.g., `connectionManager`) as named exports from their modules

### TypeScript
- Enable `strict: true` - no `any` types allowed
- Enable `noUnusedLocals: true` and `noUnusedParameters: true`
- Use discriminated unions for event types (see `ConnectionManager.ts:4-6`)
- Define interfaces/types at module level, not inline
- Use `unknown` for external data, validate with type guards (see `isGameEvent`)

### Naming Conventions
- **Classes**: PascalCase (e.g., `ConnectionManager`)
- **Functions/variables**: camelCase (e.g., `connectAsController`, `gameId`)
- **Constants**: SCREAMING_SNAKE_CASE or camelCase for module-level
- **Types**: PascalCase (e.g., `GameEvent`, `ConnectionState`)
- **Files**: kebab-case for directories, PascalCase for components (`.tsx`), camelCase for utilities (`.ts`)

### React Components
- Use functional components with hooks (`useState`, `useEffect`, `useRef`)
- Destructure props explicitly with TypeScript types
- Use early returns for conditional rendering
- Keep components focused - extract logic to custom hooks if needed
- Use `null` instead of `undefined` for optional values

### Error Handling
- Use try/catch with async functions, handle cleanup in `finally` blocks
- Log errors with context using `console.error`
- For ignored promise rejections, use `.catch(() => { })` with empty handler
- Update UI state to reflect error conditions (e.g., `updateState('disconnected')`)

### Phaser Integration
- Scenes extend `Phaser.Scene` classes
- Use Phaser's built-in physics (arcade physics configured in `PhaserGame.tsx:74-79`)
- Access game instance via `useRef` to avoid re-renders
- Handle audio context resume on user gesture

### Socket.IO & WebRTC
- Use `ConnectionManager` singleton for all P2P/socket communication
- Validate incoming events with type guards before processing
- Store connection state in a single source of truth
- Clean up connections on `beforeunload` event

### Formatting
- 2-space indentation
- Trailing commas for multi-line objects/arrays
- Single quotes for strings
- No unnecessary comments - let code explain itself
- Use `??` for nullish coalescing, `?.` for optional chaining
- Use `Set` for listener collections (see `stateListeners` in `ConnectionManager.ts`)
