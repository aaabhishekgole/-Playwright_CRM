# Vercel Deployment

Deploy the admin portal from the `frontend` directory only.

## Vercel Project Settings

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

The project includes [vercel.json](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/vercel.json) so client-side routes like `/login`, `/runner-app`, and `/workspace/...` resolve to `index.html` instead of returning `404`.

## Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

```text
VITE_API_BASE_URL=/api
BACKEND_API_ORIGIN=https://your-backend-domain.example.com
```

The frontend reads `VITE_API_BASE_URL` in [api.ts](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/src/services/api.ts).

`BACKEND_API_ORIGIN` is used by the Vercel serverless proxy in [api/[...path].js](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/api/[...path].js). This keeps the real backend URL off the browser client and lets Vercel forward `/api/*` requests to your Spring Boot service.

## Backend Requirement

This repo's backend is Spring Boot and should be hosted on a Java-friendly platform such as Render, Railway, Fly.io, AWS, or Azure App Service.

If the backend is hosted on another domain, allow the Vercel frontend origin in the backend CORS setting:

```text
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-vercel-project.vercel.app,https://your-custom-domain.example.com
```

That property is used by [SecurityConfig.java](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/src/main/java/com/gadgetseva/config/SecurityConfig.java).

## Recommended Production Flow

1. Deploy the backend to Render or Railway first.
2. Copy the backend public origin into `BACKEND_API_ORIGIN`.
3. Set `VITE_API_BASE_URL=/api`.
4. Redeploy the Vercel frontend.

## What Vercel Will Host

- `frontend`: yes
- `backend`: no, not in its current Spring Boot form
- `mobile`: no, use Expo / EAS
