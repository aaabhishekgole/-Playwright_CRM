# Gadget Seva Hub

This repository is set up to run locally without Docker.

## Local setup

### Backend

Requirements:
- Java 21
- Maven 3.9+

Run:
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The API starts on `http://localhost:8081` and uses:
- embedded H2 database stored under `backend/.data`
- local file uploads under `backend/uploads`
- seeded demo users with password `Admin@123`

Useful URLs:
- API docs: `http://localhost:8081/swagger-ui/index.html`
- H2 console: `http://localhost:8081/h2-console`

### Frontend

Requirements:
- Node.js 20+

Run:
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and talks to `http://localhost:8081/api` by default.

### Mobile

Requirements:
- Node.js 20+
- Expo CLI / Android Studio or Xcode as needed

Run:
```bash
cd mobile
npm install
npx expo start
```

## Demo users

- `admin`
- `support`
- `backend`
- `pickup`
- `tech`
- `delivery`
- `mse`
- `finance`

Password for all demo users: `Admin@123`
