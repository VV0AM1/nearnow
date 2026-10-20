# NearNow — Implementation Status

Status of the work against `NearNow_AI_Agent_Implementation_Brief.md` (2026-10-19).

Legend: **Done** = implemented · **T** = covered by automated tests that pass · **NV** = not verified on a real device/simulator or deployment.

---

## 0. Findings from the repository inspection (beyond the brief)

All of these are fixed in this change.

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| F1 | Passwords stored and compared as **plaintext**. | Critical | bcrypt (12 rounds); legacy plaintext rows are verified once and re-hashed on next login. **T** |
| F2 | Hardcoded master OTP `123456` accepted for every account. | Critical | Removed. Codes are `crypto.randomInt`, stored as SHA-256, 10-minute expiry, locked after 5 wrong attempts. **T** |
| F3 | Socket.IO `joinRoom(userId)` was unauthenticated: anyone could subscribe to anyone's notifications. | Critical | JWT required in the handshake; the server joins the user's room itself; invalid tokens are disconnected. **T** |
| F4 | Public post/comment responses included every author's **email**, role and reputation. | High | Safe public projection (`id`, `name`, `avatar`) everywhere. **T** |
| F5 | Login "auto-heal" set the password to whatever was typed for users without an Auth row. | High | Removed. |
| F6 | Mobile map WebView built HTML from raw post titles (stored HTML/JS injection). | High | New bridge: markers carry only id/coords/fixed style; messages validated both ways. **T** |
| F7 | `seed-cities.ts` fabricated ~240 "Reported suspicious activity" posts; `prisma/seed.ts` seeded fake incidents at (0,0). | High | Seeds create geography only; optional demo fixtures are titled `[DEMO]` and refuse to run in production. |
| F8 | `check-users.ts` dumped all users including auth data. | High | Removed. |
| F9 | Login, OTP and forgot-password revealed whether an email was registered. | Medium | Generic responses. **T** |
| F10 | JWT secret silently fell back to `dev_secret`; JWT payload logged per request. | Medium | Required (≥32 chars) in production; logging removed. **T** |
| F11 | Feed SQL used `acos()` (errors on floating-point > 1); `0,0` meant "no location". | Medium | Stable haversine (`asin(least(1,…))`), nullable coordinates. **T** |
| F12 | Not a git repository → no history to scan; DB password was committed in both compose files. | Medium | Moved to `.env`; **rotate the old password** (see §6). |
| F13 | Web called non-existent routes (`/notifications/:id/read`), unsafe `:userId` routes, voted without auth, kept "saved" only in localStorage, listened for a socket event the server never sent, and requested `limit=1000`. | Medium | All fixed. |
| F14 | `next dev` was broken under Next 16 (Turbopack + PWA webpack plugin). | Low | `next dev --webpack`. |
| F15 | Web viewport blocked pinch-zoom (`userScalable: false`). | Low | Removed (accessibility). |
| F16 | Web live-feed socket handler inserted every new post, from any city, into the current feed. | Low | Filtered by area, radius and category. |

---

## 1. Completed work

### P0 — Safety, security, data integrity, configuration

- **Done** Config: `EXPO_PUBLIC_API_URL` (mobile; configuration-error screen if missing), `NEXT_PUBLIC_*` (web, no config logging), API startup validation in `src/common/env.ts` (fails fast in production). **T**
- **Done** `.env.example` for the root (compose), API, web and mobile; secrets moved out of `docker-compose*.yml`; Postgres mapping fixed to `5433:5432` and bound to localhost; production Postgres no longer published.
- **Done** Auth hardening (F1, F2, F5, F9, F10). Rate limits on signup, login, code sending and password reset. **T**
- **Done** DTO validation for every REST body and query: coordinates, radius (0.2–50 km), enums, lengths, pagination (≤100), dates, booleans from multipart. `forbidNonWhitelisted`; implicit conversion disabled because it turned `"false"` into `true`. **T**
- **Done** Ownership: notification, settings, saved and device routes derive the user from the JWT; `:userId` routes are removed; `markAsRead` is scoped to the owner (404 otherwise). **T**
- **Done** Blocked or deleted accounts are rejected on every request, including sockets; blocking revokes push tokens. **T**
- **Done** Socket authentication (F3). **T**
- **Done** Urgent help (former SOS), mobile and web:
  - The UI states that NearNow is not an emergency service and offers a "Call 112" button.
  - A 5-second countdown can be cancelled, is announced to screen readers and cannot be double-submitted.
  - Success is shown only after the server confirms, with the **real** number of people notified. Nothing claims anyone was dispatched.
- **Done** DANGER posts are no longer broadcast. Every category needs an explicit opt-in, a chosen alert area and proximity; urgent requests are capped at 3 km. Every person is capped at 6 nearby alerts per hour, and each sender at 3 urgent posts per hour. Expired urgent posts have their location coarsened to about 1 km by a retention job. **T**
- **Done** No NYC/SF/(0,0) silent defaults anywhere (mobile and web). Users choose a city or share their location explicitly; `0,0` is accepted as a real coordinate. **T**
- **Done** Marketing: removed the invented "50k+ / 120k / 4.8/5 / 15 cities / 10,000+", "Live in San Francisco & New York", "verified residents", "exact location never shared", "AI-powered", the fake phone number, the inert newsletter form, the dead social links and the fake "Suspicious Activity" hero card. A configurable "Pilot in {city}" replaces them.
- **Done** Background location: the task, the "Live Safety Tracking" toggle and the `ACCESS_BACKGROUND_LOCATION` / `UIBackgroundModes` permissions are removed (Android explicitly blocks it). Permission texts now describe the real uses.
- **Done** Uploads:
  - The file type is detected from its bytes, never the extension.
  - Files are limited to 5 MB and 8000 px.
  - EXIF/XMP/text metadata, including GPS, is stripped from JPEG, PNG and WebP.
  - Files get random UUID names behind a `StorageAdapter` interface.
  - Responses are served with `nosniff` and a restrictive CSP.
  - A failed post creation removes its file. **T**
- **Done** Abuse reports use reason categories with optional details. Duplicate reports are rejected (409) and reporters are rate-limited; you cannot report your own post. Moderator review records who reviewed and when, plus an audit entry. **T**
- **Done** A content guard rejects payment card numbers (Luhn) and IBANs (mod-97) in posts, comments and contact messages. **T**

### P1 — Mobile app (Expo SDK 54)

**Foundation**
- **Done** Typed API layer: `lib/types.ts` (shared contracts), `lib/errors.ts` (error adapter: offline, timeout, 401/403/404/429, validation; 5xx bodies are never shown). **T**
- **Done** Auth state machine (`loading` / `signedOut` / `signedIn`).
  - The token lives in SecureStore and is restored on cold start. Expiry is read from the JWT and a timer signs the user out when it passes.
  - A burst of 401 responses clears the session exactly once, and the login screen then says the session expired.
  - Route guard in `app/_layout.tsx`. **T** (JWT logic)
- **Done** Onboarding and city picker. The app works fully without location permission and handles denied, permanently denied (with an Open Settings button) and unavailable states. Device location is coarsened to about 110 m before it is used.
- **Done** i18n: English, Spanish and Catalan. Device language is detected and can be changed in Profile. A test checks that all three languages have the same keys and placeholders. **T** — the Spanish and Catalan texts still need native-speaker review.

**Screens**
- **Done** Feed:
  - Server-side category, time-window, radius and search filters, with a 400 ms debounce and cancellation of stale requests.
  - Infinite scroll without duplicates, pull to refresh, an active-filter summary and Clear button.
  - Loading, empty (expand radius / change area / post), error and retry states. **T** (paging)
- **Done** Post cards show category, status (resolved, expired, removed, possibly outdated), source and confirmations, distance, area and approximate-location flag. Like and save use optimistic updates with rollback; share and report are on every card. Viewer state comes with the feed, so cards make no per-card requests.
- **Done** Map:
  - Safe WebView bridge; the HTML is built once per theme, so filter changes don't reload the map.
  - Clustering; marker shapes and a legend, so colour is never the only signal.
  - In-place detail sheet with "View details"; "Search this area" button; the map never snaps back to the user's position.
  - Recenter control, OSM/CARTO attribution, banners for tile failures and API errors, 100-post cap with a notice. **T** (bridge)
- **Done** Create post:
  1. Category, with guidance per category.
  2. Map pin, with "use my location" and an approximate-location switch (~300 m, on by default).
  3. Details: title/description limits with counters, lost-&-found fields, photo from camera or gallery with type and size checks.
  4. Review, showing exactly which location will be public.
  - Multipart `file` upload with progress, double-submit guard, discard confirmation, and navigation to the new post on success. **T** (form body)
- **Done** Post detail: comments, like/save/share/report, "still happening / no longer here" confirmation, resolve or mark returned and delete (author), lost-&-found possible matches (owner) and private contact request (others).
- **Done** Notifications: the server contract, tap-through to the post or contact requests, mark read, mark all read, pagination, unread badge in the header.
- **Done** Profile: name editing, avatar upload, statistics, area, alerts, saved posts, contact requests, language, theme, sign out (revokes push), and account deletion (type DELETE to confirm). Privacy and support links appear only when configured.
- **Done** Alert settings, stored on the server and driving delivery: area (use selected area / clear), radius, categories, pause, push, quiet hours with timezone.
- **Done** Area overview (replaces the safety rankings): counts by category, recency and resolved counts, the counting method, a disclaimer and a "Call 112" button.
- **Done** Push boundary: `lib/push.ts` + `expo-notifications`.
  - Registers only with an EAS project id, on a physical device, with permission granted, and when the server reports push available. Otherwise the app says why, honestly.
  - Notification taps open the post. Tokens are revoked on sign-out, and the server revokes `DeviceNotRegistered` tokens. **NV**
- **Done** Accessibility basics: labels and roles, minimum 44–48 pt touch targets, live regions for errors, toasts and countdowns, safe areas, a tab bar that doesn't cover content, visible tab labels, and keyboard-avoiding forms. **NV** on devices.
- **Done** Scripts: `typecheck`, `lint`, `test`, `export:ios`, `export:android`, `map-assets`.

### P1 — Web (kept working, aligned with the API)

- **Done** Web clients updated for every changed endpoint; authenticated socket; real like and save; notification contract.
- **Done** Area prompt replaces the San Francisco defaults on the feed, map, search and area pages, and one chosen area is shared app-wide.
- **Done** Urgent-help modal (112, honest copy); report reasons now match the API.
- **Done** "Safety Command Center" replaced by an area overview with no rankings or scores; the map overlay no longer shows "risk" wording.
- **Done** Category labels match mobile; marketing claims are corrected.

### P2 — Neighbourhood Pulse & Lost and Found

- **Done** Post lifecycle:
  - Fields: `status`, `verificationStatus`, source fields (`sourceType/Name/Url/ExternalId`, unique per source), `expiresAt` (per category), `lastConfirmedAt`, `resolvedAt/By/Note`, `isApproximateLocation`.
  - Expiry and "may be outdated" are computed at query time; expired posts are hidden from the feed unless `includeInactive=true`. **T**
- **Done** `PostConfirmation`: one answer per person per post. The author cannot confirm, answers can't be flipped within 30 minutes, "community confirmed" needs 2 or more people within 24 hours, and an official-source label is never overridden. The author is told when several people say a report is no longer happening. **T**
- **Done** Resolve is limited to the author or a moderator. Moderator removal is a soft remove (hidden from the public, visible to the author and moderators), and every moderation-sensitive action writes a `ModerationAction` audit row. **T**
- **Done** Lost & Found:
  - A `LostFoundItem` entity holds direction, item type, time window and status.
  - Matching is deterministic and explainable: same or compatible item type, time windows within 3 days, distance within 5 km, word overlap, with readable reasons. Results are labelled "Possible match", visible to the owner only and dismissible.
  - Match notifications are capped per person per day.
  - Private contact requests (no email or phone shared) can be accepted with a reply, declined, blocked, or reported (which also blocks).
  - Marking an item returned closes the case, its pending requests and its matches. **T**
- **Done** Official data: provider interface only (`src/official-data/official-data.ts`), empty list, nothing fabricated; `/health` reports which providers are active.

### P3

- **Partly done** Local activity: community events are a normal, labelled category with a 14-day lifetime. There are no external event feeds, no event start/end dates and no reminders.
- **Not done** Trusted journey / check-in. It would need a verified delivery channel (push or email to contacts), retention rules and legal review, so nothing is shown in the UI.
- **Not done** Routing. No provider is configured and no route UI exists.

---

## 2. Key files

**API (`apps/api`)**
- `prisma/schema.prisma`, `prisma/migrations/20261019120000_trust_lifecycle_lost_found/` — new models and fields plus backfill.
- `src/common/*` — env validation, geo helpers, public user projection, rate limiter, audit, Prisma error filter.
- `src/auth/*` — credentials (bcrypt, OTP), service, controller, guards (incl. optional JWT), strategy.
- `src/posts/*` — lifecycle rules, mapper (public shape plus viewer state), content guard, DTOs, service (feed SQL, create, vote, confirm, resolve, remove, retention), controller.
- `src/notifications/*` — alert policy, Expo push adapter, owner-scoped endpoints.
- `src/lost-found/*` — matching, service (matches, dismissals, contact requests, blocks), controller.
- `src/uploads/*` — image sanitizer, storage adapter, upload service.
- `src/app.gateway.ts` — authenticated sockets.
- `src/main.ts` — pipeline, CORS from env, static uploads with safe headers.
- `test/app.e2e-spec.ts` — integration suite against a real database.

**Mobile (`apps/mobile`)**
- `lib/*` — config, types, errors, jwt, i18n (en/es/ca), map bridge and HTML, post form, push, storage.
- `context/*` — Auth, Location (area), Theme, Toast.
- `components/*` — ui kit, FeedPost, PostStatus, ReportSheet, LeafletMap, FilterBar, AreaHeader, AreaChooser, AuthForms, LostFoundPanel, SOSButton (urgent help).
- `app/*` — all screens listed in §1.

**Web (`apps/web`)**
- `lib/api.ts`, `lib/config.ts`, `lib/socket-provider.tsx`, `context/DashboardContext.tsx`, `context/NotificationContext.tsx`.
- `components/features/home/AreaPrompt.tsx`, `components/features/safety/*`, `hooks/useFeed.ts`, `hooks/useMapPosts.ts`, `hooks/useCreatePost.ts`, landing and footer copy.

**Retired files.** Files that were dead or harmful were moved, not deleted, to `legacy-removed/` at the repository root:
- mobile: template components, the background location task, old map assets route, the duplicate create modal, the old safety rankings screen;
- web: ranking components, unused layers panel.

Review that folder and delete it when you are satisfied. The removed GraphQL resolvers/models and `check-users.ts` were deleted outright; they were unused (the GraphQL module is commented out) or harmful.

---

## 3. Database migration

One new migration, applied after the 12 existing ones: **`20261019120000_trust_lifecycle_lost_found`**.

- **Additive only.** New enums, nullable or defaulted columns, new tables and indexes. Four `NotificationType` values are added, which needs PostgreSQL 12 or later.
- **Data backfill (non-destructive):**
  - `NotificationSettings` rows with `latitude = 0 AND longitude = 0` get `NULL` coordinates ("no alert area").
  - Every existing post gets `expiresAt = createdAt + category lifetime`. Old reports therefore show as **expired** and drop out of the default feed.
- Verified: `prisma migrate deploy` on a fresh local DB, and `prisma migrate diff` (migrations vs schema) reports **no drift**. The e2e suite resets and migrates a dedicated `nearnow_test` database on every run.

**Applying to production (operator step; nothing was run against production):**
1. Back up the Neon database.
2. Run from `apps/api` with the production `DATABASE_URL`/`DIRECT_URL` set: `npx prisma migrate deploy`.
3. Deploy the API, then the web app, then ship a new mobile build. Old mobile builds call changed endpoints (`/notifications/me` now returns `{ items, unreadCount, … }`; `:userId` routes are gone).

**Optional cleanup of fabricated seed posts** (if `seed-cities.ts` or `prisma/seed.ts` was ever run against production). Review the counts first, then delete in a transaction:

```sql
SELECT count(*) FROM "Post" p JOIN "User" u ON u.id = p."authorId"
WHERE u.email IN ('seeder@nearnow.app', 'seed@example.com');
-- If those are all fabricated: DELETE FROM "Post" WHERE "authorId" IN
--   (SELECT id FROM "User" WHERE email IN ('seeder@nearnow.app', 'seed@example.com'));
```

---

## 4. Environment variables (placeholders only — see the `.env.example` files)

| App | Variable | Notes |
|-----|----------|-------|
| API (server-only) | `DATABASE_URL`, `DIRECT_URL` | Required. |
| | `JWT_SECRET` | Required in production, at least 32 characters. |
| | `JWT_EXPIRES_IN` | Default `7d`. |
| | `CORS_ORIGINS` | Comma-separated. Falls back to `FRONTEND_URL`; required in production. |
| | `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SERVICE` | Required in production for sign-in codes. Without them, the code is printed to the log in development only. |
| | `WEB_APP_URL`, `PUBLIC_BASE_URL`, `GOOGLE_CLIENT_ID`, `UPLOAD_DIR` | Optional. |
| | `PUSH_PROVIDER=expo` (+ optional `EXPO_ACCESS_TOKEN`) | Off by default. |
| | `GEOCODER_PROVIDER=nominatim` + `GEOCODER_USER_AGENT` | Off by default. |
| Web (public) | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_PILOT_CITY` | |
| Mobile (public) | `EXPO_PUBLIC_API_URL` | Required; the app shows a configuration screen without it. |
| | `EXPO_PUBLIC_EAS_PROJECT_ID` | Push only. |
| | `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_SUPPORT_EMAIL` | Links are hidden when empty. |
| Compose | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST_PORT` | |

**Local files created (untracked, ignored by git):**
- `apps/api/.env` — points at the local Docker Postgres; email unset, so codes are printed to the log.
- `apps/api/.env.production` — the production values you provided, for reference only. Nothing loads this file.
- `apps/web/.env.local`, `apps/mobile/.env` (localhost / Android emulator address), and `.env` at the root (compose).

Existing Render env vars (`FRONTEND_URL`, `JWT_SECRET`, email and Google) satisfy the new production startup checks. Adding `CORS_ORIGINS` is optional because `FRONTEND_URL` is used as the fallback.

---

## 5. Commands run and actual results (2026-10-19, Windows, Node 24, Docker Postgres 16)

| App | Command | Result |
|-----|---------|--------|
| API | `npx prisma migrate deploy` (local) | 13 migrations applied |
| API | `prisma migrate diff --from-migrations … --to-schema-datamodel …` | no drift |
| API | `npm run lint` | **0 errors, 0 warnings** (was 858 problems after formatting) |
| API | `npm run typecheck` / `npm run build` | pass / pass |
| API | `npx jest` (unit) | **61 passed** (16 suites; was 54 before the 2026-10-20 storage and push work) |
| API | `npm run test:e2e` (real Postgres `nearnow_test` + S3Mock) | **32 passed** (29 + 3 S3 storage): auth, cross-user access, moderation/audit, validation, feed filters, expiry, upload + EXIF stripping, votes, confirmations, reports, urgent-alert policy, lost & found + contact/block, account deletion, socket isolation |
| API | `npx ts-node prisma/seed.ts --demo` (local) | 3 cities, 3 `[DEMO]` posts |
| Mobile | `npx tsc --noEmit` / `npx eslint .` | pass / pass |
| Mobile | `npx jest` | **13 passed** |
| Mobile | `npx expo-doctor` | **18/18 checks passed** (after aligning SDK patch versions and adding `babel-preset-expo`) |
| Mobile | `npx expo export --platform android` / `--platform ios` | both bundle successfully |
| Web | `npm ci --legacy-peer-deps` | required, as on Vercel (`NPM_CONFIG_LEGACY_PEER_DEPS=true`) |
| Web | `npx tsc --noEmit` | pass |
| Web | `npx eslint .` | **0 errors**, 89 warnings (pre-existing `any` / unused) |
| Web | `npm run build` | pass, 15 routes |
| Live smoke test (in-app browser, local API + web dev) | landing → sign up → code → area prompt → choose Barcelona → feed + map with `[DEMO]` posts → post detail | landing copy verified; no author emails in API feed output |

---

## 6. Manual QA still required (not verified here)

- **Mobile on real iOS/Android devices or simulators.** Only TypeScript, lint, unit tests and bundle export were run; the app was **not launched**. Check:
  - cold start / session restore / expiry;
  - permission allowed / denied / blocked;
  - camera and gallery upload, including the multipart boundary on both platforms;
  - map gestures and "Search this area";
  - keyboard behaviour, notches, small screens, dark mode, Android back, VoiceOver and TalkBack.
- **Push** needs an EAS project with APNs/FCM credentials, `PUSH_PROVIDER=expo` on the API, and a physical device.
- **Email delivery in production** (Gmail app password): verify that sign-in codes arrive.
- **Web admin moderation pages** and responsive layouts were type-checked and built but not clicked through.

---

## 7. Known blockers and risks

1. **Rotate exposed credentials.**
   - The Postgres password that was committed in `docker-compose*.yml`.
   - Everything shared in the chat session: the Neon DB password, the Gmail app password, the Google client secret and the JWT secret. Rotating the JWT secret signs everyone out once, which is acceptable.
2. **Upload persistence.** Render's free plan has an ephemeral disk, so uploaded photos are lost on redeploy. Add an object-storage adapter (`StorageAdapter`) or use a persistent disk.
3. **Single-instance rate limits.** The rate limiter lives in memory; scaling beyond one API instance needs Redis.
4. **Translations.** The Spanish and Catalan texts need native-speaker review. Server-generated notification texts and the API's validation messages are English only.
5. **Privacy and legal.** The account deletion policy (posts deleted, comments anonymised) and the data retention rules need legal review. The privacy policy and support URLs still need to be configured.
6. **Geocoding.** Neighbourhood labels come from seeded neighbourhoods unless `GEOCODER_PROVIDER` is configured. The web create form still uses client-side Nominatim for address display, within its usage policy for light use.
7. **Not implemented:** trusted journey, routing, official data feeds, event dates and reminders (see §1, P3).

---

## 8a. Innovation strategy (`NearNow_Innovation_Strategy_and_Agent_Addendum.md`, 2026-10-20)

The addendum keeps the order above (A → B → C first) and then adds the **local change-to-action loop** as the product's main differentiator. Tracking:

| Strategy stage | Item | Status |
|---|---|---|
| 0 — Release foundation | Phase A above | Partly done (code-side done; account-dependent steps blocked) |
| 1 — Finish mobile | Phases B and C above | Not started |
| 2 — Local Change Brief | "Since you last checked" brief built from existing lifecycle fields, deterministic, no LLM | Not started |
| 2 | One-tap reality check: add "I can't confirm" next to the existing still-happening / no-longer-present answers; impact receipt showing real counts | Not started (confirmation API exists) |
| 2 | Saved areas, topic lenses, quiet and controllable notifications | Partly done (one area, categories, quiet hours and pause exist) |
| 3 — Practicality Layer | Structured disruption subtypes, one reviewed official source, map plus accessible list, unknown shown as unknown | Not started (official-data interface exists) |
| 4 — Distribution | Public share pages with privacy rules, partner QR entry points | Not started |
| 4 | Area Desk partner dashboard | Not started — only after a committed pilot partner |
| 5 | Newcomer guide, event reminders, community missions, trusted journeys | Not started — each needs evidence first |
| — | Privacy-conscious analytics plan (outcome metrics, no GPS or content in analytics) | Not started |

Product guardrails from the addendum that are already enforced:
- no safety scores;
- no report counts presented as safety;
- an honest urgent-help flow;
- approximate locations;
- opt-in alerts with rate limits;
- a moderation audit trail.

These must be kept in every new feature.

## 8. Roadmap — next phases

The order matters. Device builds come first, because nothing can be judged on a phone without them. The UI rebuild comes **before** the remaining mobile features, so those features are built once in the new design instead of twice.

### Phase A — Release foundation (prerequisite for everything else)
Step-by-step for the account-dependent steps: `docs/RELEASE_SETUP.md`.

- [x] `eas.json` with `development` (dev client), `preview` (staging) and `production` profiles. Each reads `EXPO_PUBLIC_API_URL` from its EAS environment; `expo-dev-client` is installed; the push project id is read from `app.json` after `eas init`. **Done** (local checks: typecheck, lint, tests, both exports and expo-doctor 18/18 pass) — **Blocked** for real builds until you log in to EAS.
- [ ] iOS `bundleIdentifier`, Android `package`, app icon and splash screen. **Blocked:** needs your choice of a permanent ID.
- [ ] Development build installed on one iPhone and one Android phone. **Blocked:** Expo account; the iPhone also needs a paid Apple Developer account.
- [ ] Staging API (separate database) with the migration applied; the run-through in §6 performed and its results recorded. **Blocked:** Render and Neon access.
- [x] Object-storage adapter: `S3Storage` (Cloudflare R2, AWS S3 or any S3-compatible store) behind `StorageAdapter`, switched with `STORAGE_PROVIDER=s3`.
  - Random keys, `immutable` cache headers, public-URL serving.
  - Deletes only objects under its own URL; local disk stays the default.
  - Production startup warns when local disk is used.
  - **Done + tests pass:** unit tests, plus an integration test against the S3Mock container (`docker compose up -d s3mock`).
  - **Blocked** for real use until an R2 bucket and keys exist.
- [~] Push end to end.
  - **Done + tests pass:** Expo delivery receipts are fetched after 15 minutes and expire after 24 hours; tokens reported as `DeviceNotRegistered` are revoked at either the send or receipt step; failed receipt requests are retried.
  - **Blocked:** EAS/FCM/APNs credentials, `PUSH_PROVIDER=expo` on staging, and a test on a physical device.

### Phase B — Mobile UI rebuild: modern iOS look and feel
**Goal:** NearNow should feel like a first-party iOS app — calm, fast, legible and tactile — and stay native and accessible on Android.

**Design principles**
- Follow Apple's Human Interface Guidelines on iOS: large collapsing titles, system materials, SF Symbols, sheets instead of full-screen modals, context menus, swipe actions and Dynamic Type.
- On Android, use Material 3 equivalents (ripple feedback, navigation bar, Material icons) rather than a pixel copy of iOS.
- Content first: fewer borders and cards, more whitespace, clear grouping. Colour only for meaning; red is reserved for urgent help.
- Motion explains what changed (where a sheet came from, what was saved). Every animation respects the system Reduce Motion setting.
- Haptics only for meaningful outcomes: success, warnings, toggles and the urgent countdown.

**Design system (built first, used everywhere)**
- [x] Tokens (`apps/mobile/design/tokens.ts`, done; high-contrast variant still to do): colour (light, dark and high-contrast; one accent colour plus semantic colours), spacing on a 4-pt grid, corner radii (continuous corners), elevation and materials, plus a motion scale (spring presets, durations).
- [x] Typography (`design/Text.tsx`, done; still to test at the largest accessibility size on a device): the system font (SF Pro / Roboto) with text styles mirroring iOS (Large Title … Caption 2), all scaling with Dynamic Type, and tested at the largest accessibility size.
- [x] Icons (`design/Icon.tsx`, done; the Ionicons fallback for every mapped symbol is covered by a test): SF Symbols on iOS (`expo-symbols`), Material Symbols / Ionicons on Android, through one `<Icon>` component.
- [~] Component library (`apps/mobile/design/`; buttons, list rows, segmented control, chips, search/text fields, banner, skeleton, state views, avatar, badges, card and glass surface done; `components/ui.tsx` now wraps the kit so existing screens use it):
  - buttons (filled / tinted / plain), grouped list rows (Settings-style), segmented control, chips, search field
  - sheets with detents, toasts / banners, skeleton shimmer, empty / error states, avatar
  - post card, status badges, map callout card
  - still to do: sheets with detents (these will be native form sheets), toasts moved onto the kit, post card and map callout card (built with the screens that use them)
  - colour-contrast test `design/__tests__/tokens.test.ts` checks the WCAG AA text pairs in light and dark mode; it caught four failing pairs, and the tokens were fixed (dark mode now uses navy text on the blue accent)
- [x] A `/dev/gallery` screen (done; open it from Profile → "Design kit (dev only)") (development builds only) showing every component in light and dark mode for review.

**Technology (check compatibility with Expo SDK 54 before adopting each one)**
- Navigation:
  - [x] native tab bar via `expo-router` native tabs, which uses the system tab bar and gets iOS 26 Liquid Glass automatically (done: `app/(app)/_layout.tsx`, with SF Symbols on iOS, Ionicons on Android and the bar minimising on scroll; not yet checked on a device)
  - [x] native stack headers with large titles and the built-in search bar (done for Feed, Lost & Found and Profile: each tab is now a folder with its own stack, using `useLargeTitleOptions()` in `design/navigation.ts`; Map and Post keep their own layouts)
  - native form sheets (`presentation: 'formSheet'` with detents) for report, filters, urgent help and the map callout
- Motion: `react-native-reanimated` 4 (already installed) for layout and entering/exiting animations, spring-based press feedback, and transitions from a card into its detail screen; `react-native-gesture-handler` for swipe actions and sheet gestures.
- Images: `expo-image` with caching, blur-hash placeholders and cross-fade.
- Materials: `expo-blur`, plus `expo-glass-effect` (Liquid Glass) on iOS 26 with a blur fallback on older versions.
- Native context menus (long-press on a post: save, share, view on map, report).
- **Map — [x] migrated (decided: Apple Maps on iOS, MapLibre + OpenFreeMap on Android).** One engine-independent contract (`components/map/types.ts`, the existing `ToMap` / `FromMap` messages) with platform files: `NativeMap.ios.tsx` (react-native-maps / MapKit, also works in Expo Go), `NativeMap.android.tsx` → `MapLibreMap.tsx` (MapLibre RN 11.5 with OpenFreeMap `positron` / `dark` styles, overridable via `EXPO_PUBLIC_MAP_STYLE_LIGHT` / `_DARK`), and the Leaflet WebView kept only as the fallback in Android Expo Go, which has no MapLibre native module. Markers are native views with shape + colour and a screen-reader label (title text is stripped before anything reaches the WebView, and that is tested). The area is drawn as a native circle/polygon. "Search this area" detects user gestures; distances come from tested helpers in `lib/geo.ts`. `react-native.config.js` keeps react-native-maps out of Android, so no Google Maps key is needed. Clustering is now done (`lib/cluster.ts`, tested): nearby markers merge into numbered cluster pins on both native engines, tapping one zooms in by two levels, and screen readers hear "N posts here". Still to do: a draggable pin in Create, and checking both engines on devices. Original note: — Apple Maps on iOS via `react-native-maps`, or MapLibre on both platforms. This brings native gestures, smooth clustering, VoiceOver-accessible markers and Apple-style callouts. It must be done as one complete migration, never left half-done.

**Screen-by-screen redesign**
- [x] Onboarding (done: two pages with a dot indicator — an intro with a brand mark and three feature rows, then the area choice as large tiles that show the location explanation before the system prompt; a warning banner and an Open Settings button when location is refused; a spring slide, or a cross-fade under Reduce Motion; illustrations are still to come) — a short paged intro with simple illustrations, the area choice as large tappable tiles, and the permission explanation shown before the system prompt.
- [~] Sign-in (done: brand header, kit text fields, errors and session notices as banners, a large one-time-code field with `oneTimeCode` / `one-time-code` autofill that only verifies once 6 digits are entered, and Back / Resend side by side; sign-up and password reset restyled the same way; still to do: Sign in with Apple, once it is configured) — a clean form, one-time-code autofill (`textContentType=oneTimeCode`), inline validation, and Sign in with Apple once it is configured (App Store rule if Google sign-in is offered).
- [~] Feed (done: large title showing the area name, native search bar in the header, urgent-help and notification buttons in the header, a row to change area / open the area overview, filter chips, cards rebuilt on the kit with `expo-image`, skeleton loading, pull-to-refresh with haptic; still to do: swipe actions, context menu and the "New posts" pill):
  - large title showing the area name, which collapses on scroll
  - pinned search, horizontal filter chips, cards with clear hierarchy
  - swipe actions (save / hide), long-press context menu, pull-to-refresh with haptic — still to do: the context menu needs a native menu library (e.g. `zeego`) added in a development build
  - "New posts" pill driven by real-time updates — still to do: it depends on the mobile socket client (see the Phase C real-time item)
- [x] Map (done: native map with clustering; a persistent bottom sheet (`design/Sheet.tsx` `DetentSheet`) with peek / half / full detents that you drag, flick or tap the handle to move, and that screen readers can adjust; the sheet header shows the post count and active filters, the selected post appears at the top of the sheet, and tapping a list row focuses that post on the map; a glass filter pill opens a native form sheet (`app/map-filters.tsx`, medium/large detents, changes apply live through `hooks/useMapFilters.ts`); floating glass recenter / legend controls sit above the peek height; not yet checked on devices) — full-bleed map with floating glass controls, a bottom sheet with detents (a post list at the low detent, details at the high one), and a filter sheet.
- [~] Create (done: 4-segment progress bar with an accessibility progress value; a two-column category grid with coloured symbols and a checkmark, plus guidance for the chosen category; a map step with a glass "use my location" button and an approximate-location ring drawn to scale (the server's ~300 m grid cell, computed from the reported map span); the approximate switch as a list row; Lost & Found chips with item-type symbols; a photo thumbnail with a remove button; a review card showing what becomes public, with the location row going back to the map; an upload progress bar. Still to do: present it as a native sheet and allow a draggable pin, which come with the native map migration) — a sheet-based flow with a progress indicator, a category grid with symbols, a draggable pin with a precision ring showing the approximate radius, photo attachment as a thumbnail strip, and a review step showing exactly what becomes public.
- [~] Post detail (partly done: rebuilt on the kit with a title1 heading, trust line, image via `expo-image`, metadata lines with icons, an actions card, a "still happening?" card with haptics and a checkmark on your answer, author actions as a grouped list, comments with avatars, and a pill-shaped comment composer whose send button is properly disabled; still to do: the stretchy hero header, sticky actions and the Lost & Found matches rail) — hero image with a stretchy header, a clear status and trust strip, sticky actions, an iMessage-style comment composer, and Lost & Found matches as a horizontal card rail.
- [x] Lost & Found (done: segmented All / Lost / Found control, radius chips, requests and report buttons in the header, skeleton loading, an empty state with a report action, and item-type symbols with text labels on cards) — a segmented Lost / Found control, item-type symbols and status badges.
- [x] Notifications (done: sections for Today / Yesterday / date via `groupByDay` in `lib/format.ts` (tested), inset grouped rows, unread dots, swipe left to mark read with a haptic, and a VoiceOver/TalkBack "Mark as read" action; the app root is now wrapped in `GestureHandlerRootView`) — grouped by day, swipe to mark read, unread dots.
- [x] Profile and settings (done: avatar with a camera badge, stats card, grouped sections for area/alerts/saved/contacts, an appearance segmented control, a language list with checkmarks, privacy/support, and sign-out / delete account; the delete dialog is on the kit and avoids the keyboard) — an iOS Settings-style grouped list (account, area, alerts, language, appearance, privacy, support, delete account).
- [x] Urgent help (done: bottom sheet with a grabber, a red "call first" card with a large Call 112 button, a countdown ring that pulses each second (static under Reduce Motion), a progress bar, a haptic and screen-reader announcement on every tick, and the same honest result/error wording; the ring is a bordered circle, not an SVG arc, since `react-native-svg` is not installed) — a calm but unmistakable sheet with a large Call 112 button, an accessible countdown ring, and the honest result screen.

**Acceptance criteria**
- [ ] 60 fps scrolling and animations on a mid-range Android phone and an iPhone 12 or newer; no dropped frames on tab switches.
- [ ] Dynamic Type at the largest accessibility size causes no clipped or overlapping text on any screen.
- [ ] VoiceOver and TalkBack can complete the main flows: sign in, choose area, read the feed, create a post, report, and send an urgent alert.
- [ ] Contrast meets WCAG AA in light and dark mode; status is never shown by colour alone.
- [ ] With Reduce Motion on, motion is replaced by cross-fades.
- [ ] Light and dark screenshots of every screen attached to this file, with before / after comparisons.

### Phase C — Remaining mobile features (built in the new design)
- [ ] Real-time updates on mobile (authenticated socket, "New posts" pill, notification badge), with a refresh from the server after reconnecting.
- [ ] Deep and universal links (`nearnow://post/…` and https links); sharing includes a link.
- [ ] Privacy & location screen: permission status, what is stored and for how long, plus links to the privacy policy and community guidelines.
- [ ] Reporters see the moderation outcome; comments can be reported, and authors can delete them.
- [ ] Editable bio; several saved areas with a "Near me / Saved area" switch.
- [ ] Map list view as an accessible alternative to markers; landscape tested.
- [ ] Image load fallback; neighbourhood choice inside a city.
- [ ] Lost & Found: an option to keep posts out of the main feed, optional colour/brand fields, and tests for match notifications.
- [ ] Automated screen tests for the main flows (React Native Testing Library) and an end-to-end smoke flow on a device (Maestro).

### Phase D — Web catches up with mobile
- [ ] Status, verification and staleness labels; confirm and resolve buttons.
- [ ] Lost & Found: fields, matches and contact requests.
- [ ] Approximate-location option on the create form.
- [ ] Address lookup moved to the server.
- [ ] Moderation history in the admin pages.
- [ ] Responsive, keyboard and dialog-accessibility pass; check behaviour when the backend is down.
- [ ] Remove unused GraphQL/Apollo code and clear the lint warnings.

### Phase E — P3 features
- [ ] Events: start/end time with time zone, organiser, cancelled status, save, and opt-in reminders that can be unsubscribed from.
- [ ] Official data: first provider after its terms are reviewed, plus `docs/official-data.md`.
- [ ] Trusted journey / check-in, only once a verified delivery channel exists (push or email to contacts), with tested expiry and privacy rules.
- [ ] Routing, only once a provider is chosen.

### Phase F — Hardening and launch readiness
- [ ] Shared API types package used by mobile and web.
- [ ] Redis-backed rate limits.
- [ ] Query timeouts and a review of database indexes using real query plans.
- [ ] Audit the logs for personal data and exact locations.
- [ ] Rehearse the migration on a copy of the production database.
- [ ] Native-speaker review of the Spanish and Catalan texts; translate server-generated messages.
- [ ] Legal review of privacy, data retention and account deletion.
- [ ] Rotate the exposed credentials; delete the `legacy-removed/` folder.

### Product decisions (agreed 2026-10-19)
1. **Brand:** keep the blue accent and the NearNow identity, refined into a cleaner, modern look (new palette, typography and icon treatment within the same identity).
2. **Map:** native maps at no cost.
   - iOS: Apple Maps via `react-native-maps` (no API key, no usage fees).
   - Android: MapLibre (`@maplibre/maplibre-react-native`) with free OpenFreeMap vector tiles (no key, no fees; attribution required).
   - Both need development builds (Phase A). Google Maps is avoided because it needs a billing account.
3. **Android:** Material-native styling sharing the same tokens, not a copy of iOS.
4. **Minimum iOS:** 16. Liquid Glass on iOS 26 devices, blur materials on older versions.
