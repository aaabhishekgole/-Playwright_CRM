# Backend Deploy: Render / Railway

This backend is a Spring Boot service and can be deployed on Railway or Render.

For the current preferred production setup in this repo, use:

- `frontend` on Railway
- `backend` on Railway
- `database` on Railway MongoDB
- `redis` on Railway Redis when needed

## Required Runtime

- Java 21
- MongoDB for the default persistence mode
- Redis if you want a managed Redis host instead of local defaults

JPA with PostgreSQL remains available as an alternative mode, but Mongo is now the default runtime path.

## Database Choice

For the default Railway path, use Railway-managed `Mongo` and `Redis`.

If you need the JPA alternative instead, you can still use:

- Railway-managed `Postgres`
- Render Postgres or another external PostgreSQL provider
- an external managed Redis provider if needed

Important:

- the backend connects through normal environment variables such as `MONGODB_URI`, `REDIS_HOST`, and `REDIS_PORT`
- Railway MongoDB is the simplest current fit if the rest of the stack is also on Railway

## Core Environment Variables

These are the main values you need in production:

```text
APP_PERSISTENCE_TYPE=mongo
MONGODB_URI=mongodb://...
JWT_SECRET=...
STORAGE_BASE_URL=https://your-backend-domain.example.com
STORAGE_SIGNING_SECRET=...
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-frontend-domain.example.com,https://your-custom-domain.example.com
APP_RUNNER_PORTAL_BASE_URL=https://your-frontend-domain.example.com/runner-access
```

The backend now reads `PORT` automatically, so Render and Railway can inject their platform port without extra code changes.

Storage note:

- keep `STORAGE_BASE_URL` pointed to the backend public URL
- keep `STORAGE_ROOT` on persistent storage
- do not point `STORAGE_BASE_URL` to the frontend domain

## Render

This section documents the JPA/PostgreSQL alternative deployment path.
If you want the default deployment mode described in this repo, use the Railway + MongoDB section below instead.

Use [.env.render.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.render.example) as the template.

Suggested service setup:

- Runtime: `Java 21`
- Root Directory: `backend`
- Build Command: `mvn -q -Dmaven.test.skip=true package`
- Start Command: `java -jar target/gadget-seva-hub-0.0.1-SNAPSHOT.jar`

If you deploy with Docker instead, point the service to [Dockerfile](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/Dockerfile).

### Render Step-by-Step

1. Create a PostgreSQL database in Render.
2. Create a Key Value service too if you want managed Redis.
3. Create a new `Web Service`.
4. Connect this repository.
5. Set `Root Directory` to `backend`.
6. Set:
   - Build Command: `mvn -q -Dmaven.test.skip=true package`
   - Start Command: `java -jar target/gadget-seva-hub-0.0.1-SNAPSHOT.jar`
7. Add the environment variables from [.env.render.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.render.example).
8. Replace the important placeholders:
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `STORAGE_BASE_URL`
   - `STORAGE_SIGNING_SECRET`
   - `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
   - `APP_RUNNER_PORTAL_BASE_URL`
9. Attach a persistent disk for file uploads and keep:
   - `STORAGE_ROOT=/var/data/uploads`
10. Deploy the service.
11. Validate Swagger after deployment:
    - `https://<your-render-service>.onrender.com/swagger-ui/index.html`
12. Use the final Render URL in the Vercel frontend as:
    - `BACKEND_API_ORIGIN=https://<your-render-service>.onrender.com`
13. If the database was provisioned in Vercel Marketplace, copy those database credentials into the Render backend env vars.

## Railway

Use [.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.railway.example) as the template.

Suggested service setup:

- Root Directory: `backend`
- Builder: `Dockerfile`
- Dockerfile Path: `backend/Dockerfile`
- Build Command: `mvn -q -Dmaven.test.skip=true package`
- Start Command: `java -jar target/gadget-seva-hub-0.0.1-SNAPSHOT.jar`

The Railway example uses reference variables so you can point the backend service at attached `Mongo` and `Redis` services.

### Railway Step-by-Step

1. Create a `Mongo` service in Railway.
2. Create a `Redis` service if you need Redis in production.
3. Create the backend service from this repository.
4. Set `Root Directory` to `backend`.
5. Use the Dockerfile at `backend/Dockerfile`.
6. Attach a persistent volume for uploads.
7. Add the env vars from [.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.railway.example).
8. Generate a public domain for the backend service.
9. Validate:
   - `https://<your-backend-domain>/swagger-ui/index.html`

If you use external MongoDB or Redis instead of Railway-managed services, replace the Railway reference variables with the provider connection values.

## Railway Frontend Pairing

Once the frontend is on Railway, use its public domain in:

- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `APP_RUNNER_PORTAL_BASE_URL`

That keeps admin requests, runner access links, and frontend routing aligned with the deployed Railway frontend domain.
