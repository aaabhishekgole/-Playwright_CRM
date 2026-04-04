# Vercel Deployment

Deploy the web app from the `frontend` directory only.

## What Vercel Hosts

Vercel should host:

- the Vite frontend
- the public web domain for admin and runner entry flows
- the `/api/*` proxy in [api/[...path].js](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/api/[...path].js)

Vercel should not host the current backend directly:

- the backend is Spring Boot on Java 21
- the backend behaves like a long-running web service
- uploaded files are stored on persistent disk by the backend today

## Vercel Project Settings

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

The project includes [vercel.json](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/vercel.json) so client-side routes like `/login`, `/runner-app`, `/runner-access/:token`, and `/workspace/...` resolve to `index.html` instead of returning `404`.

## Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

```text
VITE_API_BASE_URL=/api
BACKEND_API_ORIGIN=https://your-backend-domain.example.com
```

The frontend reads `VITE_API_BASE_URL` in [api.ts](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/src/services/api.ts).

`BACKEND_API_ORIGIN` is used by the Vercel proxy in [api/[...path].js](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/api/[...path].js). This keeps the browser on the Vercel domain while forwarding `/api/*` requests to the Spring Boot backend.

## Backend Requirement

This repo's backend should be hosted on a Java-friendly platform such as:

- Render
- Railway
- Fly.io
- AWS
- Azure App Service

If the backend is hosted on another domain, allow the Vercel frontend origin in the backend CORS setting:

```text
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-vercel-project.vercel.app,https://your-custom-domain.example.com
```

Also set the runner portal base URL in the backend:

```text
APP_RUNNER_PORTAL_BASE_URL=https://your-vercel-project.vercel.app/runner-access
```

Those properties are read from [application.yml](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/src/main/resources/application.yml).

## Database Options

The frontend does not connect to the database directly. The backend does.

Common production choices:

- Neon Postgres via Vercel Marketplace
- Render Postgres
- Railway Postgres
- Upstash Redis via Vercel Marketplace if Redis is needed

Even when provisioned from Vercel Marketplace, the database is still a managed external service that the backend connects to using normal env vars.

## Recommended Production Flow

1. Provision PostgreSQL first.
2. Deploy the backend to Render or Railway.
3. Copy the backend public origin into `BACKEND_API_ORIGIN`.
4. Set `VITE_API_BASE_URL=/api`.
5. Redeploy the Vercel frontend.
6. Validate `/login`, `/runner-app`, `/runner-access/:token`, and API traffic.

## Summary

- `frontend`: yes, on Vercel
- `backend`: no, not in its current Spring Boot form
- `database`: managed provider, optionally linked through Vercel Marketplace
- `mobile`: no, use Expo / EAS
