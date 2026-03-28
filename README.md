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
- logging-based notification delivery by default, with optional HTTP gateway delivery for SMS / WhatsApp

Useful URLs:
- API docs: `http://localhost:8081/swagger-ui/index.html`
- H2 console: `http://localhost:8081/h2-console`

### Notifications

By default, notifications are queued and marked through the local logging gateway.

To switch SMS / WhatsApp delivery to a live provider or internal gateway, set these backend env vars:

```bash
NOTIFICATION_PROVIDER=HTTP
NOTIFICATION_API_KEY=your-provider-key
NOTIFICATION_AUTH_HEADER=authkey
NOTIFICATION_SMS_ENABLED=true
NOTIFICATION_SMS_URL=https://your-sms-gateway.example/send
NOTIFICATION_SMS_SENDER_ID=GSHUB
NOTIFICATION_WHATSAPP_ENABLED=true
NOTIFICATION_WHATSAPP_URL=https://your-whatsapp-gateway.example/send
NOTIFICATION_WHATSAPP_NUMBER=919999999999
NOTIFICATION_WHATSAPP_TEMPLATE_NAME=pickup_runner_link
```

The notification payload includes the request number, recipient, message, subject, and metadata such as the runner portal link.

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
