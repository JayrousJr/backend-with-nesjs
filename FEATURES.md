# NestJS GraphQL Backend Template — Features

A production-ready backend template built on NestJS and GraphQL (code-first). Everything listed here is implemented and wired up — see the Roadmap at the bottom for what deliberately isn't.

---

## 1. Foundation & Configuration

- `ConfigModule` globally registered with Joi environment validation — the app fails fast on missing/invalid vars
- Typed `AppConfigService` wrapper for type-safe env access
- `.env.example` documenting every variable, optional features clearly marked
- Path aliases (`@common`, `@config`, `@prisma`, `@permissions`, `@db`) in `tsconfig.json`
- `setup.sh` — interactive scaffold that renames the project, creates `.env`, installs, and re-inits git

## 2. main.ts Hardening

- Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`
- `helmet()` security headers, `compression`, `cookie-parser`
- CSRF protection via `csrf-csrf` (REST cookie flows; GraphQL is Bearer-only by design)
- CORS origins from env, global `/api` prefix, graceful shutdown hooks
- Swagger/OpenAPI (toggleable via `SWAGGER_ENABLED`) with bearer auth

## 3. Database Layer

- Prisma ORM with PostgreSQL, migrations + seeder (demo admin/user accounts, roles, permissions)
- Every model: internal `id` (int, hidden via `@HideField`) + `uniqueId` (UUID v7) as the only externally exposed identifier
- Custom Prisma client extension: **soft deletes** (`isDeleted`/`deletedAt` auto-filtered), **audit stamping** (`createdById`/`updatedById`/`deletedById` from request context), automatic password hashing on user writes
- Repository pattern per module — services never touch Prisma directly
- Database health indicator at `GET /health`

## 4. Authentication & Authorization

- JWT access + refresh tokens; refresh rotation with server-side `Session` rows (individually revocable — "log out this device" / "log out everywhere")
- Sessions capture user agent + IP for the account-security screen
- Email verification flow (register → tokenized email → activate), resend support
- Password reset flow (forgot → tokenized email → reset), change-password for signed-in users
- Account lockout after repeated failed logins, with localized "locked for N minutes" errors
- **Google OAuth** (authorization-code flow, no passport strategy needed) — disabled until `GOOGLE_CLIENT_ID`/`SECRET` are set; creates verified accounts on first sign-in
- `JwtAuthGuard` global with `@Public()` escape hatch; `@AuthUser()`/`RequestContext` for the current user
- **Two-axis authorization**: coarse roles + fine-grained permissions (`users.delete`, `campaigns.send`, …) via `PermissionsGuard` + `@RequirePermission()`; admin role bypasses permission checks
- Roles/permissions manageable at runtime via GraphQL (role CRUD, permission assignment)

## 5. GraphQL API

- Code-first `GraphQLModule` (Apollo) with auto schema file
- Consistent response envelopes: `MutationResponse(Entity)`, `QueryListResponse(Entity)`, `createMessageResponse()` factories
- Offset pagination (`PaginationInput` → `data/total/page/totalPages/hasNextPage`)
- Reusable filter/order `InputType`s per module with `build*Where()` helpers
- `class-validator` on all inputs, error messages localized via i18n
- GraphQL subscriptions over the WebSocket transport (`PubSubService`)

## 6. Security & Request Hygiene

- `ThrottlerModule` global rate limiting (env-tunable)
- Request context via `AsyncLocalStorage` — current user + request ID available anywhere without prop drilling
- Consistent exception filters for REST and GraphQL (Prisma errors mapped, internals hidden)

## 7. Background Jobs & Scheduling

- BullMQ (Redis) job queues — mail sending is fully queue-backed with retry/backoff
- `@nestjs/schedule` cron jobs: scheduled campaign sends, nightly visitor-stat aggregation, data-retention purges

## 8. Real-time

- Socket.io gateway (`/ws` namespace) with JWT-verified handshakes and per-user rooms
- `emitToUser()` / `broadcast()` helpers; online-user tracking
- GraphQL subscription bridge via `PubSubService`

## 9. In-App Notifications

Persistent per-user notifications, pushed live over the gateway.

- `NotificationsService.notify(userId, input)` persists and emits in one call — fire-and-forget safe, a notification failure never breaks the producing operation
- Content stored as **frontend i18n keys + params**, so the UI renders each notification in the viewer's current locale
- GraphQL: `getMyNotifications` (paginated, with `unreadCount`), `markNotificationRead`, `markAllNotificationsRead`
- Built-in producers to copy: welcome on email verification, campaign sent/failed to the campaign creator

## 10. Newsletter & Campaigns

- Newsletter subscribe/unsubscribe (self-service) + admin subscriber listing
- Campaign lifecycle: draft → schedule/send → per-recipient delivery tracking (`CampaignRecipient` rows with status/error)
- Queue-backed fan-out; scheduled sends picked up by cron
- Admin recipient drill-down per campaign

## 11. Visitor Analytics

- Anonymous page-view tracking mutation (hashed IPs, session IDs)
- Nightly aggregation into daily `VisitorStat` rows (UTC-consistent bucketing)
- Paginated page-view and stats queries, permission-gated

## 12. File Handling

- Storage module with a **driver interface**: local disk for dev, S3-compatible (AWS/MinIO/R2) for prod, switched by `STORAGE_DRIVER`
- REST upload/download endpoints, `File` model in Prisma, avatar attachment on users

## 13. Internationalization (i18n)

- `nestjs-i18n` resolving locale from the `x-lang` header, `Accept-Language`, or the authenticated user's `preferredLocale`
- Validation messages, exception messages, and success messages all translated (`en`, `sw` included)
- `I18nSuccessInterceptor` — resolvers return `success.*` keys, responses carry localized text
- Localized transactional emails (verification, reset, newsletter confirmations)

## 14. Data Retention

- Configurable purges (env-driven, `0` disables): hard-delete of soft-deleted rows after N days, raw page-view pruning after N days (aggregates kept)
- Runs as a nightly cron with per-entity logging

## 15. Testing & CI

- Jest unit tests with mocked providers (services, resolvers, retention)
- E2E test wiring via Supertest (`test/`), run against real Postgres + Redis in CI
- GitHub Actions: pnpm install → prisma generate → typecheck → lint → migrate → unit → e2e → build, with Postgres/Redis service containers
- Husky + lint-staged pre-commit (eslint + prettier on staged files)

## 16. Developer Experience

- `docker-compose.yml` for local Postgres 16 + Redis 7 (healthchecked, persistent volumes)
- Webpack HMR dev loop (`pnpm start:dev`)
- Dependabot (weekly npm, grouped minor/patch; monthly actions)
- Conventional module layout — every domain module follows the same entity/dto/repository/service/resolver shape, documented in the README's "Creating a New Module" walkthrough

---

## Roadmap — deliberately not (yet) included

These are common asks that the template intentionally ships without. Env scaffolding exists where noted, so adding them later is additive:

- **2FA (TOTP)** — deferred; the auth flows were designed so a challenge step can slot in after password verification
- **Payments** — no payment module; M-Pesa/CRDB env vars are scaffolded in `.env.example` only
- **Kafka** — connection env vars are scaffolded; no producer/consumer code (the `EventEmitter2` + BullMQ + Socket.io trio covers most template needs)
- **Multi-tenancy enforcement** — `tenantId` column and env flag exist; query scoping/guards are not implemented
- **Audit log module** — audit _stamping_ (who created/updated/deleted) is built into the Prisma extension; a queryable audit-trail feature is not
- **Observability stack** — health checks are in; Prometheus metrics, structured log shipping, tracing, and backend Sentry are not (the `SENTRY_DSN` env var is reserved for it)
- **Production Dockerfile / CD pipeline** — CI is complete; image building and deployment are left to the consuming project
