# CVRUK Admin Panel (Next.js)

Production-oriented admin panel for CVRUK backend modules.

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
   cp .env.example .env.local
   ```
3. Update API base url in `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

## Routes
- `/login`
- `/admin/events`
- `/admin/news`
- `/admin/courses`
- `/admin/sports`

## Login Flow
1. User submits email/password on `/login`.
2. App calls `POST /api/auth/login`.
3. `accessToken` is kept in memory; `refreshToken` + roles are kept in localStorage.
4. Lightweight auth cookie is set for middleware gate to `/admin/*`.

## Refresh Token Flow
1. Protected requests include `Authorization: Bearer <accessToken>`.
2. On 401, API client retry flow calls `POST /api/auth/refresh` once with refresh token.
3. If refresh succeeds, failed request is retried with new access token.
4. If refresh fails, session is cleared and user is redirected to `/login`.

## CRUD Mapping
- Events → `/api/v1/events` (+ `/upcoming` for list)
- Latest News → `/api/v1/news-latest`
- Courses → `/api/v1/courses`
- Sports → `/api/v1/sports`

Each module supports list, create, edit, delete with confirmation and toasts.

## Architecture Note
- `lib/api/client.ts`: shared API client + auth interceptors + centralized API error extraction.
- `lib/auth/session.ts`: session state with in-memory access token and localStorage refresh token/roles.
- `features/*/api.ts`: module-specific TanStack Query hooks for list and mutations.
- `components/ui/*`: reusable Button/Input/FormField/DataTable/ConfirmDialog primitives.
- `app/(admin)/admin/*`: route-level module screens with forms and mutation wiring.
- `lib/shims/*`: local compatibility shims for React Hook Form, resolver, and query APIs used by this project.
