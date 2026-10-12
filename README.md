# Futbolio.az

futbolio.az connects amateur mini-football teams in Baku with the players,
goalkeepers, referees and doctors they're missing for a game. Teams order
through WhatsApp/Instagram DM; this repo is the site that explains the
service and lets candidates self-register, plus the internal admin panel
Futbolio's team uses to manage those registrations.

Full product spec: `Futbolio_texniki_tapşırıq.pdf` (not committed to this
repo). Implementation plan/decisions: see the project's plan history.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript), Tailwind CSS |
| Backend | Django REST Framework, PostgreSQL |
| Async jobs | Celery + Redis (file scanning, retention purges, notifications) |
| File storage | S3-compatible — Hetzner Object Storage |
| Antivirus | ClamAV (every uploaded file is scanned before it's attached to an application) |
| Bot protection | Cloudflare Turnstile |
| Local dev orchestration | Docker Compose |

```
Browser ──> Cloudflare ──> frontend (Next.js, futbolio.az)
                       ──> backend  (DRF, api.futbolio.az) ──> Postgres
                                                           ──> Redis (Celery)
                                                           ──> S3-compatible storage
                                                           ──> ClamAV
```

## Local development

1. Copy the env file: `cp .env.example .env` — fill in the `AWS_S3_*` /
   `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` vars with a Hetzner Object
   Storage bucket + access key (Hetzner Cloud Console → Object Storage);
   every other default already works against the dockerized services below.
   `TURNSTILE_BYPASS=True` skips real Turnstile verification locally.
2. `docker compose up --build`
3. First boot only:
   - Create the first super_admin account:
     `docker compose exec backend python manage.py create_superadmin --email you@futbolio.az`
     (every other admin account is created through this one via the admin
     panel's "Admin Users" page — there is no public admin signup).
4. Open:
   - Frontend: http://localhost:3000
   - Backend API root: http://localhost:8000/api/
   - Mailpit (dev-only local inbox for admin emails): http://localhost:8025

### Running the frontend standalone against the dockerized backend

```
cd frontend
npm install
cp .env.local.example .env.local   # points NEXT_PUBLIC_API_URL at localhost:8000
npm run dev
```

### Environment variables

See `.env.example` (root, consumed by every docker-compose service) and
`frontend/.env.local.example` (frontend-only, for running `next dev` outside
Docker). Every variable that can safely stay blank in local development says
so inline.

## Tests

```
# Backend
docker compose exec backend pytest

# Frontend
cd frontend
npm run test:unit        # Vitest
npx playwright test      # e2e — needs the full docker compose stack running
```

## Regenerating frontend API types

The frontend's `lib/api/generated/schema.d.ts` is generated from the
backend's OpenAPI schema and checked into git so a backend contract change
is caught by CI if the generated types go stale:

```
cd frontend
npm run generate:types   # fetches http://localhost:8000/api/schema/
```

## Deployment notes

- `futbolio.az` → frontend, `api.futbolio.az` → backend, both behind
  Cloudflare (CDN/WAF/DDoS protection, Turnstile, Tunnel for origin access).
- Object storage is Hetzner Object Storage (S3-compatible) in every
  environment, local dev included — one bucket/access key per environment.
- `SESSION_COOKIE_DOMAIN=.futbolio.az` so the admin session cookie is shared
  between the two subdomains.
- Backups: daily Postgres dump (30-day retention, off-region, encrypted —
  set up via the hosting provider's managed backup feature, not in this repo).

## Folder map

```
backend/            Django project (package: config) + apps:
  common/              shared validators/enums/storage/security helpers
  accounts/            admin auth, mandatory TOTP 2FA, admin-user management
  applications/        the 3-role registration + admin CRUD/export
  files/               presigned uploads, AV/EXIF/thumbnail pipeline
  audit/               immutable audit log
  sitesettings/        admin-editable phone/social links/video cards/FAQ
  notifications/       pluggable new-application notification backends
frontend/            Next.js app (marketing site, registration wizard, admin panel)
docker-compose.yml    full local stack: postgres, redis, clamav, mailpit,
                       backend, celery-worker(+media), celery-beat, frontend
```
