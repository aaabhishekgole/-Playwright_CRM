# Gadget Seva Hub Architecture

## System Overview

Gadget Seva Hub is a role-based operations platform for Indian device-service workflows. It supports claim registration, pickup scheduling, runner execution, hub inward, estimates, cashless approval, repair, delivery, billing, notifications, and audit tracking.

The implementation in this repository uses one Spring Boot backend, one React web portal, and one hybrid Expo mobile shell for pickup riders.

## Runtime Architecture

```text
[ Web Admin Portal ]
       |
       |  JWT + REST
       v
[ Spring Boot Backend ] ---- [ SQL Database ]
       |                         |
       |                         +-- requests, users, pickups, invoices, payments,
       |                             notifications, status history, audit data
       |
       +---- [ Local / Signed File Storage ]
       |
       +---- [ Notification Gateway ]
       |         |- LOG mode for local development
       |         |- HTTP mode for SMS / WhatsApp integration
       |
       +---- [ Public Runner Portal APIs ]
       |
       +---- [ Rider App Inbox APIs ]

[ Runner Browser Portal ] ---> same backend
[ Hybrid Runner Mobile App ] -> WebView + same backend + same web flow
```

## Repository Modules

### `frontend`

- Vite + React admin portal
- role-aware sidebar and protected routes
- operational pages for service requests, pickup, hub, service center, estimates, cashless, delivery, billing, reports, and audit
- public runner browser inbox and public pickup portal
- shared toast system for module-level success and error feedback

### `backend`

- Spring Boot monolith
- JWT authentication and role checks
- service request orchestration
- attachment metadata management
- runner portal token handling
- billing, invoice, payment, and refund processing
- notification routing and logging

### `mobile`

- Expo hybrid runner app
- opens the same runner web flow through WebView
- supports deep link handoff from smart pickup URLs
- rider inbox login and notification consumption
- native alerts for sign-in, sync, and logout feedback

## Deployment Profiles

### Local Development

- database: file-backed H2 at `backend/.data/gadget-seva-hub.mv.db`
- backend port: `8081`
- frontend port: `5173`
- Flyway: disabled in local profile
- notification delivery: `LOG` by default

### Non-Local / Integrated Environment

- database: PostgreSQL
- Flyway: enabled
- Redis config exists in application settings
- notification delivery can switch to `HTTP` mode for SMS and WhatsApp gateways

## Core Business Flow

The live portal currently centers around this operational lifecycle:

```text
REQUEST_CREATED
-> PICKUP_ASSIGNED
-> PICKUP_IN_PROGRESS
-> CUSTOMER_NOT_AVAILABLE / CUSTOMER_RESCHEDULED / CUSTOMER_NOT_CONTACTABLE
-> PICKUP_COMPLETED
-> RECEIVED_AT_HUB
-> DIAGNOSIS_IN_PROGRESS
-> ESTIMATE_PREPARED
-> CASHLESS_PENDING_APPROVAL / ESTIMATE_APPROVED / TOTAL_LOSS
-> REPAIR_IN_PROGRESS
-> REPAIR_COMPLETED
-> READY_FOR_DISPATCH
-> DELIVERY_ASSIGNED
-> OUT_FOR_DELIVERY
-> DELIVERED
-> INVOICED
-> CLOSED
```

Cashless and total-loss branches are also supported.

## Key Architecture Areas

### 1. Request Intake

- claim registration captures customer, device, loan, COI, branch, employee, and partner data
- new records are stored in `service_requests`, `customers`, and `devices`
- every new request writes initial status history

### 2. Pickup Management

- admin or back-end team assigns a runner, schedule, and notes
- pickup runner receives a smart link by SMS, WhatsApp, and rider app inbox
- only the scheduled runner receives the rider inbox notification
- the runner can accept pickup, upload 10 mandatory photos plus optional extras, mark pickup complete, or log customer doorstep outcomes such as not available, reschedule, or not contactable

### 3. Hub And Service Center

- hub screens handle inward receipt, verification, and dispatch to service center
- service center screens handle diagnosis, estimate creation, repair, and total-loss decisions
- cashless screens support evidence review and approval queues

### 4. Delivery And Billing

- delivery screens support assignment, dispatch tracking, and completed handover
- billing screens support invoice generation, payment capture, reconciliation, refund handling, and closure
- all amounts are formatted in INR in the current frontend

### 5. Notifications

- notifications are stored in the `notifications` table
- delivery channels currently modeled in the app include `SMS`, `WHATSAPP`, `EMAIL`, and rider `APP`
- local mode logs notifications and keeps them queryable
- HTTP provider mode can forward SMS and WhatsApp traffic to an external gateway

### 6. Attachments And Evidence

- attachment metadata is stored in SQL
- actual files are served through the app storage abstraction
- private files can be exposed by signed access URLs
- pickup, cashless, repair, and billing flows rely on attachment types to validate evidence completeness

### 7. Feedback And UX Safety

- the web app uses a shared toast layer for submit success, validation failure, and workflow errors
- the hybrid runner app uses native alerts for important session and sync events
- stale auth sessions are handled so protected screens do not silently fail without feedback

## Web And Mobile Parity

The pickup runner flow is intentionally shared across browser and app:

- smart link opens `/runner-access/:token`
- on mobile, the link first tries the hybrid app deep link
- if the app is not installed, the same link falls back to the browser flow
- both app and browser open the same pickup portal UI and backend endpoints
- rider inbox exists in both the hybrid app and browser at `/runner-app`

This keeps functionality and UI behavior aligned across web and mobile without maintaining two separate pickup implementations.

## Authorization Model

Protected portal routes use role-aware menu access on the frontend plus method-level role checks on the backend.

Common examples

- request creation: `ADMIN`, `CUSTOMER_SUPPORT`, `BACKEND_TEAM`
- pickup assignment: `ADMIN`, `CUSTOMER_SUPPORT`, `BACKEND_TEAM`
- runner onboarding: `ADMIN`, `BACKEND_TEAM`
- runner mobile inbox: authenticated `PICKUP_AGENT` only
- invoice and payment actions: `ADMIN`, `FINANCE`, `MSE_TEAM`

## Important Source Files

- web route entry: `frontend/src/main.tsx`
- sidebar and role map: `frontend/src/utils/menuHierarchy.ts`
- workspace resolver: `frontend/src/pages/WorkspacePage.tsx`
- operational workflow UI: `frontend/src/pages/OperationalWorkspacePage.tsx`
- pickup dashboard: `frontend/src/pages/PickupManagementDashboardPage.tsx`
- runner inbox web UI: `frontend/src/pages/RunnerAppInboxPage.tsx`
- runner portal web UI: `frontend/src/pages/PickupRunnerPortalPage.tsx`
- hybrid app shell: `mobile/App.tsx`
- service request APIs: `backend/src/main/java/com/gadgetseva/controller/ServiceRequestController.java`
- runner public APIs: `backend/src/main/java/com/gadgetseva/controller/PublicPickupPortalController.java`
- rider inbox API: `backend/src/main/java/com/gadgetseva/controller/MobileRunnerController.java`

## Current Design Principles

- one workflow source of truth in the backend
- one shared pickup experience across browser and hybrid app
- strong role isolation on menu visibility and API access
- status transitions recorded through history instead of silent updates
- notification activity persisted even when external provider delivery is stubbed
- operational screens tied directly to API and DB-backed workflow data, not static mock pages
