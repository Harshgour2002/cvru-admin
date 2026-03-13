# CVRUK Admin Panel (Next.js)

Production-oriented admin panel currently scoped to Login + Events module.

## Tech Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- TanStack Query
- Fetch-based API client with JWT refresh interceptor
- React Hook Form + Zod

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure env:
   ```bash
   cp env.example .env.local  # or use committed .env for local default
   ```
3. Update API base url in `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```
   If you omit `http://`/`https://`, the client auto-normalizes to `http://` at runtime. If the variable is missing, it defaults to `http://localhost:8080`. Additionally, if misconfigured to the frontend origin and a same-origin `/api/*` returns 404, the client retries once against `http://localhost:8080`.
4. Start dev server:
   ```bash
   npm run dev
   ```

## Routes
- `/login`
- `/admin/events`

## Login Flow
1. User submits email/password on `/login`.
2. App calls `POST /api/auth/login`.
3. `accessToken` is kept in memory; `refreshToken` + roles are kept in localStorage.
4. Lightweight auth cookie is set for edge proxy gate to `/admin/*`.

## Session Expiry Behavior
1. Protected requests include `Authorization: Bearer <accessToken>`.
2. On 401, session is cleared and user is redirected to `/login`.

## CRUD Mapping
- Events → `/api/v1/events` (+ `/upcoming` and `/upcoming/{id}` for read)
- Events media → `/api/v1/events/{id}/image` and `/api/v1/events/{id}/brochure`

Events module supports list, create, edit, delete and media upload/remove workflows.

## Architecture Note
- `lib/api/client.ts`: shared API client + auth interceptors + centralized API error extraction.
- `lib/auth/session.ts`: session state with in-memory access token and localStorage refresh token/roles.
- `components/ui/*`: reusable Button/Input/FormField/DataTable/ConfirmDialog primitives.
- `app/(admin)/admin/*`: route-level module screens with forms and mutation wiring.
- `lib/shims/*`: local compatibility shims for React Hook Form, resolver, and query APIs used by this project.
