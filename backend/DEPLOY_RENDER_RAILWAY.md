# Backend Deploy: Render / Railway

This backend is a Spring Boot service and should be deployed separately from the Vercel frontend.

## Required Runtime

- Java 21
- PostgreSQL for the default `jpa` persistence mode
- Redis if you want a managed Redis host instead of local defaults

Mongo is also supported when `SPRING_PROFILES_ACTIVE=mongo` and `APP_PERSISTENCE_TYPE=mongo`.

## Core Environment Variables

These are the main values you need in production:

```text
APP_PERSISTENCE_TYPE=jpa
DB_URL=jdbc:postgresql://...
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=...
STORAGE_BASE_URL=https://your-backend-domain.example.com
STORAGE_SIGNING_SECRET=...
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-vercel-project.vercel.app,https://your-custom-domain.example.com
APP_RUNNER_PORTAL_BASE_URL=https://your-vercel-project.vercel.app/runner-access
```

The backend now reads `PORT` automatically, so Render and Railway can inject their platform port without extra code changes.

## Render

Use [.env.render.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.render.example) as the template.

Suggested service setup:

- Runtime: `Java 21`
- Root Directory: `backend`
- Build Command: `mvn -q -DskipTests package`
- Start Command: `java -jar target/gadget-seva-hub-0.0.1-SNAPSHOT.jar`

If you deploy with Docker instead, point the service to [Dockerfile](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/Dockerfile).

### Render Step-by-Step

1. Create a PostgreSQL database in Render.
2. Create a Key Value service too if you want managed Redis.
3. Create a new `Web Service`.
4. Connect this repository.
5. Set `Root Directory` to `backend`.
6. Set:
   - Build Command: `mvn -q -DskipTests package`
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

## Railway

Use [.env.railway.example](/d:/Test%20Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend/.env.railway.example) as the template.

Suggested service setup:

- Root Directory: `backend`
- Build Command: `mvn -q -DskipTests package`
- Start Command: `java -jar target/gadget-seva-hub-0.0.1-SNAPSHOT.jar`

The Railway example uses reference variables so you can point the backend service at attached `Postgres` and `Redis` services.

## Vercel Frontend Pairing

Once the frontend is on Vercel, use its public domain in:

- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `APP_RUNNER_PORTAL_BASE_URL`

That keeps admin requests, runner access links, and signed file URLs aligned with the deployed frontend.
