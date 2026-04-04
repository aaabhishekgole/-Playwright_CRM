# Deployment Guide

This file documents the recommended production deployment path for Gadget Seva Hub on Railway.

## Recommended Deployment Model

Use this Railway-first deployment model for the current codebase:

- `frontend` -> Railway service using [frontend/Dockerfile](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/Dockerfile)
- `backend` -> Railway service using [backend/Dockerfile](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/Dockerfile)
- `database` -> Railway MongoDB
- `redis` -> Railway Redis if needed
- `mobile` -> Expo / EAS

This is the supported path because:

- the frontend is a Vite React SPA and can be containerized cleanly for Railway
- the backend is a Spring Boot Java 21 service and fits Railway well
- the backend stores uploaded files on persistent disk today
- the mobile app is Expo native and should not be deployed on Railway web hosting

## Recommended Production Topology

```text
[ Browser / Runner Portal ]
          |
          v
[ Railway Frontend Service ]
  - Vite production build
  - Nginx static hosting
  - SPA route fallback
          |
          v
[ Railway Backend Service ]
  - Spring Boot
  - Java 21
          |
          +--> [ Railway MongoDB ]
          |
          +--> [ Railway Redis ] (optional / if used)
          |
          +--> [ Persistent Volume for uploads ]
```

## Deployment Changes Already Added In Repo

### Frontend / Railway

- [frontend/Dockerfile](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/Dockerfile)
  Docker-based frontend deployment for Railway
- [frontend/nginx.conf](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/nginx.conf)
  SPA fallback so `/login`, `/runner-app`, `/runner-access/:token`, and workspace routes do not return `404`
- [frontend/.env.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/.env.example)
  local, Railway, and Vercel env examples
- [frontend/.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/.env.railway.example)
  Railway frontend env template
- [frontend/RAILWAY.md](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/RAILWAY.md)
  focused frontend deployment notes

### Backend / Railway

- [backend/Dockerfile](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/Dockerfile)
  Docker-based backend deployment for Railway
- [backend/src/main/resources/application.yml](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/src/main/resources/application.yml)
  reads:
  - `PORT`
  - `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
  - `APP_RUNNER_PORTAL_BASE_URL`
  - `STORAGE_ROOT`
  - `STORAGE_BASE_URL`
- [backend/.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.railway.example)
  Railway backend env template
- [backend/DEPLOY_RENDER_RAILWAY.md](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/DEPLOY_RENDER_RAILWAY.md)
  backend deployment notes with Railway steps

## Fastest Deployment Order

Follow this order for the smoothest Railway setup:

1. Create a Railway project.
2. Add a `Mongo` service.
3. Add a `Redis` service only if you need Redis in production.
4. Create the `backend` service from this repo with root directory `backend`.
5. Attach a persistent volume to the backend service for uploads.
6. Create the `frontend` service from this repo with root directory `frontend`.
7. Generate public domains for both services.
8. Set backend env vars using the frontend public domain and database credentials.
9. Set frontend env vars using the backend public domain.
10. Redeploy both services after env vars are finalized.
11. Validate login, runner flow, uploads, and file access.

## Frontend Deployment On Railway

Create a Railway service from this repository with:

- Root Directory: `frontend`
- Builder: `Dockerfile`
- Dockerfile Path: `frontend/Dockerfile`

Important:

- the frontend Docker image uses Nginx
- [frontend/nginx.conf](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/nginx.conf) now enables SPA route fallback
- this is required for routes such as `/login`, `/runner-app`, `/runner-access/:token`, and `/workspace/...`

### Required Frontend Environment Variable

Set this on the Railway frontend service:

```text
VITE_API_BASE_URL=https://your-backend-domain.up.railway.app/api
```

If you want to use Railway service references and your backend service is named `backend`, you can use:

```text
VITE_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/api
```

That value is read by [api.ts](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/src/services/api.ts).

## Backend Deployment On Railway

Create a Railway service from this repository with:

- Root Directory: `backend`
- Builder: `Dockerfile`
- Dockerfile Path: `backend/Dockerfile`

Suggested runtime behavior:

- Railway injects `PORT`
- Spring Boot reads `PORT` automatically
- MongoDB is provided by Railway `Mongo`
- Redis is optional

### Required Backend Environment Variables

Use [backend/.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.railway.example) as the starting point.

Main production values:

```text
APP_PERSISTENCE_TYPE=mongo
MONGODB_URI=${{Mongo.DATABASE_URL}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
JWT_SECRET=replace-with-a-32-plus-character-secret
JWT_EXPIRATION_MINUTES=120
STORAGE_ROOT=/data/uploads
STORAGE_BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
STORAGE_SIGNING_SECRET=replace-with-a-storage-signing-secret
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}},https://your-custom-frontend-domain.example.com
APP_RUNNER_PORTAL_BASE_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}/runner-access
```

Notes:

- replace `frontend` in variable references if your frontend service has a different service name
- if Redis is not used in production, you can remove or override the Redis values
- keep `STORAGE_BASE_URL` pointed to the backend public domain
- keep `STORAGE_ROOT` on the attached persistent volume

## Persistent Storage Requirement

The backend currently stores uploaded files locally through its storage layer, so the backend Railway service needs persistent storage.

Recommended backend storage settings:

- attach a Railway volume to the backend service
- set `STORAGE_ROOT=/data/uploads`
- keep file-serving URLs based on the backend domain through `STORAGE_BASE_URL`

Without a persistent volume, uploaded files can be lost between deployments or restarts.

## Environment Variable Matrix

### Frontend Service

```text
VITE_API_BASE_URL=https://your-backend-domain.up.railway.app/api
```

### Backend Service

```text
PORT
APP_PERSISTENCE_TYPE
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

Optional only for the JPA/PostgreSQL alternative:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
```

## Final Integration Checklist

After both Railway services are live, validate:

- frontend loads at the Railway frontend domain
- `/login`
- `/runner-app`
- `/runner-access/:token`
- admin login API
- runner portal API
- pickup photo upload
- file attachment access
- backend Swagger at `https://<your-backend-domain>/swagger-ui/index.html`

## Current Validation Done In Repo

These checks were already run after adding deployment support:

- frontend build
  `npm run build`
- backend compile
  `mvn -q -DskipTests compile`

## Related Deployment Files

- [frontend/RAILWAY.md](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/RAILWAY.md)
- [backend/DEPLOY_RENDER_RAILWAY.md](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/DEPLOY_RENDER_RAILWAY.md)
- [backend/.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.railway.example)
- [frontend/.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/.env.railway.example)
