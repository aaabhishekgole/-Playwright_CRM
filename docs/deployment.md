# Deployment Guide

This file stores the deployment process and the deployment-related code changes added for Gadget Seva Hub.

## Deployment Model

Use this split deployment approach for the current codebase:

- `frontend` -> Vercel
- `backend` -> Render or Railway
- `mobile` -> Expo / EAS

This is the supported path because:

- the frontend is a Vite React app
- the backend is Spring Boot on Java 21
- the mobile app is Expo native and should not be deployed on Vercel

## Deployment Changes Already Added

The repository already contains these deployment-oriented changes:

### Frontend / Vercel

- [frontend/vercel.json](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/vercel.json)
  Vercel project build settings plus SPA rewrite to `index.html`
- [frontend/api/[...path].js](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/api/%5B...path%5D.js)
  Vercel serverless proxy for `/api/*`
- [frontend/.env.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/.env.example)
  local and Vercel env examples
- [frontend/VERCEL.md](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/VERCEL.md)
  focused frontend deployment notes

### Backend / Render / Railway

- [backend/src/main/resources/application.yml](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/src/main/resources/application.yml)
  updated to read:
  - `PORT`
  - `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
  - `APP_RUNNER_PORTAL_BASE_URL`
- [backend/.env.render.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.render.example)
  Render-ready env template
- [backend/.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.railway.example)
  Railway-ready env template
- [backend/DEPLOY_RENDER_RAILWAY.md](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/DEPLOY_RENDER_RAILWAY.md)
  backend deployment notes

## Frontend Deployment On Vercel

Create a Vercel project from this repository with:

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

### Required Vercel Environment Variables

Set these in the Vercel project:

```text
VITE_API_BASE_URL=/api
BACKEND_API_ORIGIN=https://your-backend-domain.example.com
```

How they work:

- `VITE_API_BASE_URL=/api`
  keeps the browser talking to the same Vercel domain
- `BACKEND_API_ORIGIN=...`
  is read by the Vercel proxy in `frontend/api/[...path].js`
- requests to `/api/*` are forwarded by Vercel to the real Spring Boot backend

### Why This Proxy Exists

The proxy gives these benefits:

- the browser does not need the backend URL hardcoded into the client bundle
- the Vercel site and API appear under one public domain
- the frontend stays stable even when the backend host changes later

## Backend Deployment On Render

Use [backend/.env.render.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.render.example) as the starting template.

Suggested Render service settings:

- Root Directory: `backend`
- Runtime: `Java 21`
- Build Command: `mvn -q -DskipTests package`
- Start Command: `java -jar target/gadget-seva-hub-0.0.1-SNAPSHOT.jar`

Main production values to replace:

```text
DB_URL=jdbc:postgresql://...
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=...
STORAGE_BASE_URL=https://your-backend-service.onrender.com
STORAGE_SIGNING_SECRET=...
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-vercel-project.vercel.app,https://your-custom-domain.example.com
APP_RUNNER_PORTAL_BASE_URL=https://your-vercel-project.vercel.app/runner-access
```

### Render Step-by-Step

Use this order when deploying the backend on Render:

1. Create a PostgreSQL database in Render.
2. If you need Redis in production, create a Render Key Value service.
3. Create a new `Web Service`.
4. Connect this GitHub repository.
5. Set `Root Directory` to `backend`.
6. Choose `Java 21`.
7. Set:
   - Build Command: `mvn -q -DskipTests package`
   - Start Command: `java -jar target/gadget-seva-hub-0.0.1-SNAPSHOT.jar`
8. Add environment variables using [backend/.env.render.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.render.example).
9. For the first deploy, make sure these are set correctly:
   - `APP_PERSISTENCE_TYPE=jpa`
   - `DB_URL=jdbc:postgresql://<render-host>:5432/gadget_seva_hub`
   - `DB_USERNAME=<render-db-user>`
   - `DB_PASSWORD=<render-db-password>`
   - `JWT_SECRET=<your-32+-character-secret>`
   - `STORAGE_ROOT=/var/data/uploads`
   - `STORAGE_BASE_URL=https://<your-render-service>.onrender.com`
   - `STORAGE_SIGNING_SECRET=<your-storage-signing-secret>`
   - `APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://<your-vercel-project>.vercel.app`
   - `APP_RUNNER_PORTAL_BASE_URL=https://<your-vercel-project>.vercel.app/runner-access`
10. Attach a persistent disk and keep uploads under `/var/data/uploads`.
11. Deploy the service.
12. After the service is live, open:
    - `https://<your-render-service>.onrender.com/swagger-ui/index.html`
13. Copy the Render service URL. That becomes your backend public URL for Vercel.

Important:

- the backend now reads `PORT` automatically from platform envs
- uploads are stored locally by the backend, so a persistent disk is strongly recommended on Render
- once the Render URL is known, use it for `BACKEND_API_ORIGIN` in Vercel and `STORAGE_BASE_URL` in the backend

## Backend Deployment On Railway

Use [backend/.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.railway.example) as the starting template.

Suggested Railway service settings:

- Root Directory: `backend`
- Build Command: `mvn -q -DskipTests package`
- Start Command: `java -jar target/gadget-seva-hub-0.0.1-SNAPSHOT.jar`

Railway template notes:

- references attached `Postgres` service values
- references attached `Redis` service values
- uses `RAILWAY_PUBLIC_DOMAIN` for `STORAGE_BASE_URL`

## Backend Environment Values

These are the main backend env vars now supported by configuration:

```text
PORT
APP_PERSISTENCE_TYPE
DB_URL
DB_USERNAME
DB_PASSWORD
MONGODB_URI
REDIS_HOST
REDIS_PORT
JWT_SECRET
JWT_EXPIRATION_MINUTES
STORAGE_ROOT
STORAGE_BASE_URL
STORAGE_SIGNING_SECRET
APP_CORS_ALLOWED_ORIGIN_PATTERNS
APP_RUNNER_PORTAL_BASE_URL
REPAIR_CENTER_STATE_CODE
NOTIFICATION_PROVIDER
NOTIFICATION_TIMEOUT
NOTIFICATION_AUTH_HEADER
NOTIFICATION_API_KEY
NOTIFICATION_SMS_ENABLED
NOTIFICATION_SMS_URL
NOTIFICATION_SMS_SENDER_ID
NOTIFICATION_WHATSAPP_ENABLED
NOTIFICATION_WHATSAPP_URL
NOTIFICATION_WHATSAPP_NUMBER
NOTIFICATION_WHATSAPP_TEMPLATE_NAME
```

## Final Integration Process

Follow this order:

1. Deploy the backend first on Render or Railway.
2. Confirm the backend public URL.
3. Set backend envs:
   - `STORAGE_BASE_URL=https://your-backend-domain.example.com`
   - `APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-vercel-project.vercel.app,https://your-custom-domain.example.com`
   - `APP_RUNNER_PORTAL_BASE_URL=https://your-vercel-project.vercel.app/runner-access`
4. Deploy the frontend on Vercel from the `frontend` root directory.
5. Set Vercel envs:
   - `VITE_API_BASE_URL=/api`
   - `BACKEND_API_ORIGIN=https://your-backend-domain.example.com`
6. Redeploy Vercel so the env vars are applied.
7. Validate:
   - `/login`
   - `/runner-app`
   - `/runner-portal/:token`
   - admin login API
   - runner portal API
   - file attachment access

## Current Validation Done In Repo

These checks were already run after adding deployment support:

- frontend build
  `npm run build`
- backend compile
  `mvn -q -DskipTests compile`

## If Backend URL Is Not Ready Yet

You can still prepare the frontend project in Vercel first, but the final production setup is only complete after the backend URL is known and applied to:

- `BACKEND_API_ORIGIN`
- `STORAGE_BASE_URL`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `APP_RUNNER_PORTAL_BASE_URL`

## Related Deployment Files

- [frontend/VERCEL.md](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/VERCEL.md)
- [backend/DEPLOY_RENDER_RAILWAY.md](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/DEPLOY_RENDER_RAILWAY.md)
