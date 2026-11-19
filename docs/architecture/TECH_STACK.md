# Technology Stack

## Proposed, not yet approved
- TypeScript
- React + Vite
- Tailwind CSS (decision pending design-system needs)
- pnpm
- Vitest + React Testing Library
- Playwright E2E
- ESLint + Prettier
- GitHub Actions

## Must be decided before application scaffold
- React version and runtime baseline
- Router
- State management strategy
- UI primitives and design tokens
- API client generation approach
- Authentication SDK / OLAA ID integration
- Local persistence and sync approach
- Deployment provider

Do not install dependencies until decisions are recorded and approved.

## MVP decisions (2026-11-19)
The open items above are resolved for the MVP in `docs/decisions/ADR-001-mvp-web-stack.md`
(React 18 + Vite 5 + strict TypeScript, pnpm, hash router, in-repo store, plain CSS tokens,
localStorage persistence, Vitest + RTL, ESLint + Prettier, GitHub Actions). Auth, API
client, sync and deployment provider remain open.
