# ChronicCare

A calm, responsive chronic-care portfolio application based on `ChronicCare_Full_Stack_Build_and_Deployment_Guide.pdf` (11 October 2026). React + Vite, Express in Netlify Functions, MongoDB Atlas, React Three Fiber/Drei, and Recharts.

Live demo: https://chroniccare-vyshnavi.netlify.app

Source: https://github.com/Sri-Vyshnavi-Mandadapu/chroniccare (public)

Release verified 11 October 2026: production build and nine focused tests pass; browser journeys pass on desktop and mobile. The live homepage, `/patient/dashboard` SPA route, and `/api/health` return HTTP 200. The deployed health endpoint correctly reports `databaseConfigured: false`: Atlas is not connected. Production visibility is public; previews retain Netlify team-login protection. Deployment used Netlify CLI; automatic GitHub-to-Netlify builds are not configured.

## Two explicit modes

- **Explore the demo:** fictional patient Alex Morgan, synthetic glucose/BP readings, medication schedules, follow-ups and a demo care connection. Changes persist only in this browser’s localStorage. No account, database, or genuine patient information is needed.
- **Cloud accounts:** patient registration/login, opaque HttpOnly cookie sessions, MongoDB persistence, approved clinician invitations, access revocation, readings, medication schedules/dose logs and follow-up plans. These require the Atlas environment variables below. Without Atlas, the API reports `DATABASE_NOT_CONFIGURED`; it never pretends cloud data was saved.

## Features

- Lazy-loaded procedural 3D heart; drag interaction, pause control, reduced-motion preference, WebGL fallback, capped pixel ratio and offscreen rendering pause. The dashboard does not load the 3D bundle.
- Responsive patient dashboard, glucose and paired blood-pressure forms, history pagination, 7/30-day/custom trend filters, context filtering, accessible table view and CSV export.
- Medication schedules labelled by provenance, occurrence-specific taken/skipped/unknown logs, timezone-aware due-dose calculation and self-reported adherence.
- Follow-up completion with optimistic version checks. Clinicians can select only linked patients and create follow-ups.
- Invitation preview before consent, expiring single-use invitation tokens, and immediate subsequent-request access revocation.
- Account registration always creates a patient. Clinicians are provisioned through a controlled seed script, not public registration.

## Develop

Use Node 22 LTS, as specified by `.nvmrc` and Netlify configuration.

```sh
npm ci
npm run dev
```

`npm run dev` serves the frontend and browser demo. Use `npm run dev:full` for the integrated Netlify Functions runtime at the URL printed by Netlify (normally port 8888).

## Enable Atlas cloud storage

1. Create a MongoDB Atlas **Free** cluster and a dedicated database user limited to `chroniccare_demo`. Configure the network access list for your deployment.
2. Set these in Netlify **Project configuration → Environment variables**:
   - `MONGODB_URI`: your Atlas driver connection URI, with an encoded password.
   - `MONGODB_DB`: `chroniccare_demo`.
   - `APP_ORIGIN`: the exact HTTPS website origin, without a trailing slash.

   For this deployment, open https://app.netlify.com/projects/chroniccare-vyshnavi/configuration/env . `APP_ORIGIN` and `MONGODB_DB` are already configured. Add the missing `MONGODB_URI` with Functions access and production availability. The URI must contain an actual database-user password, not the `<db_password>` placeholder. Do not paste it into GitHub or chat.
3. Redeploy so Functions receive the variables. Keep credentials out of Git and never use a `VITE_` prefix for a secret.
4. Create a patient account and verify a saved reading survives logout/login and another device. `/api/health` checks routing; signed-in `/api/ready` checks database connectivity.

For local development copy `.env.example` to `.env`, fill its placeholders, and set `APP_ORIGIN=http://localhost:8888`.

To provision the fictional patient and an approved clinician, add a private `SEED_PASSWORD` of at least 12 characters to `.env`, then run `npm run seed`. This creates `alex@example.com` and `maya@example.com` without printing their password. Existing users are preserved. This script is only for the synthetic demo database.

## Publish

```sh
npm test
npm run build
npx netlify deploy --prod --dir=dist --functions=netlify/functions
```

`netlify.toml` defines the API rewrite before the SPA fallback. Function processes never call `app.listen()`. MongoDB connections are reused, with a pool size of five. A GitHub repository can be imported through Netlify’s Git integration for automatic future deploys; manual CLI publication also works.

## Validation

- `npm test`: validation, operator/unknown-field rejection, patient isolation, clinician link/revocation rules, unit conversion, timezone/schedule-version recurrence, API routing, and safe database-unavailable responses.
- `node scripts/browser-check.mjs` with the Vite server running: headless installed Microsoft Edge checks landing, demo reading save/reload, table view, follow-up completion, sharing revocation, mobile layout/navigation, and uncaught browser errors. Screenshots are written to ignored `artifacts/`.
- `npm audit --omit=dev`: production dependency audit.

## Deliberate release limits

This is a synthetic portfolio MVP, not a clinical service. No diagnosis, target recommendations, emergency alerts, medication-change recommendations or guaranteed background reminders. No recovery-email delivery is represented as working. No paid services are required.

Atlas-dependent journeys must be verified against your configured database before cloud accounts are considered released. Local rule tests do not establish deployed database isolation. Real health records are outside this release’s scope. Account deletion, verified email recovery, schedule editing UI, reading-correction UI (API exists), admin management UI, automated notifications and backup/restore rehearsal are deferred. Schedules are stored with versions and recurrence honors versions; this release creates the initial schedule and does not expose schedule edits. Export covers readings. Summary retrieval is capped at 10,000 observations per one-year query.

The access-control and cloud API are source-complete for the included MVP flows, but an unconfigured deployment exposes only the browser demo and API health/CSRF routes. Do not describe browser-local demo persistence as Atlas persistence.

## Structure

```text
src/main.jsx                 Landing, accounts, patient/clinician workspace
src/three/WellnessScene.jsx   Lazy-loaded decorative WebGL scene
src/lib/                     API client, synthetic data, dose recurrence
server/app.js                Express API, sessions, CSRF and access checks
server/models/               MongoDB schemas and unique/TTL indexes
server/services/rules.js     Validation and descriptive analytics
netlify/functions/api.js     Serverless entry point
tests/                       Focused security and behavior checks
```

Implementation references: [Express on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/express/) and [React Three Fiber installation](https://r3f.docs.pmnd.rs/getting-started/installation).
