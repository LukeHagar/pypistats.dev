# PyPIStats.dev

PyPIStats.dev is an open-source, SvelteKit-based replacement for PyPI Stats. It provides fast, on-demand Python package download analytics sourced from BigQuery, backed by PostgreSQL and Redis. The platform exposes a clean web UI and a standards-friendly JSON API suitable for programmatic use.

Key features:
- On-demand per-package ingestion from BigQuery (no cron required)
- Idempotent database writes with Prisma and per-day/per-package dedupe locks (Redis)
- Recent (day/week/month) stats computed on-demand from overall series
- Additional dimensions: system, Python versions, installer tool
- Single Docker Compose stack for Postgres + Redis + app

## Deploy and run with Docker Compose (self-contained)

This repository is designed to deploy with `docker compose` as the primary (and only) method. The stack includes the web app, Postgres, and Redis.

1) Provide environment variables

- Recommended via a `.env` file at repo root (or in your platform’s UI — Coolify supports adding envs/secrets directly):

```
DATABASE_URL=postgresql://pypistats:pypistats@db:5432/pypistats?schema=public
REDIS_URL=redis://redis:6379

# BigQuery
GOOGLE_PROJECT_ID=your-project
# Prefer JSON for container environments
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

2) Start the stack locally

```
docker compose up --build
```

The app will be available at http://localhost:3000

3) Running in Coolify

- Add this repository as an application in Coolify and choose Docker Compose.
- In the service configuration, add your environment variables (DATABASE_URL, REDIS_URL, GOOGLE_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS_JSON) via Coolify’s UI. Coolify will inject them for you — no file changes needed.
- Deploy. The app will run the database migrations on startup and serve on port 3000.

## API overview

All endpoints return JSON. Examples (for package `numpy`):
- GET `/api/packages/numpy/recent?period=month`
- GET `/api/packages/numpy/overall?mirrors=false`
- GET `/api/packages/numpy/python_major?version=3`
- GET `/api/packages/numpy/python_minor?version=3.11`
- GET `/api/packages/numpy/system?os=Linux`
- GET `/api/packages/numpy/installer`

Each API request triggers on-demand ingestion if the package is missing or stale (up to yesterday), then serves from the database and cache.

## Development with Compose

- Dev server (hot reload) using the included dev override:

```
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
# App at http://localhost:5173
```

- Prisma migrations during development:

```
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web pnpm prisma migrate dev
```

## Contributing

Issues and PRs are welcome. Please ensure:
- Type-safe changes (Prisma and TypeScript) with clean lints
- No secrets committed; configure via `.env`/`env_file`

## License

MIT