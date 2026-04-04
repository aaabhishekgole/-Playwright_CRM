# Railway Deployment

Deploy the web app from the `frontend` directory.

## Service Setup

Create a Railway service with:

- Root Directory: `frontend`
- Builder: `Dockerfile`
- Dockerfile Path: `frontend/Dockerfile`

The Docker image builds the Vite app and serves it with Nginx.

## SPA Routing

[nginx.conf](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/nginx.conf) adds SPA fallback routing:

- `/login`
- `/runner-app`
- `/runner-access/:token`
- `/runner-portal/:token`
- `/workspace/...`

Without this file, deep-link refreshes can return `404` on Railway.

## Environment Variable

Set this on the Railway frontend service:

```text
VITE_API_BASE_URL=https://your-backend-domain.up.railway.app/api
```

If your backend service in Railway is named `backend`, you can use:

```text
VITE_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/api
```

Use [frontend/.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend/.env.railway.example) as the starting template.

## Recommended Flow

1. Deploy the backend service first.
2. Generate the backend public domain.
3. Set `VITE_API_BASE_URL` in the frontend service.
4. Deploy or redeploy the frontend service.
5. Validate `/login`, `/runner-app`, and `/runner-access/:token`.
