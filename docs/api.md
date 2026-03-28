# Gadget Seva Hub API Guide

## Overview

- Backend base URL: `http://localhost:8081`
- Local Swagger UI: `http://localhost:8081/swagger-ui/index.html`
- Auth model: JWT bearer token returned by `POST /api/auth/login`
- Primary API style: JSON over REST, except attachment upload endpoints which use multipart form data

## Roles Used By The API

- `ADMIN`
- `CUSTOMER_SUPPORT`
- `BACKEND_TEAM`
- `PICKUP_AGENT`
- `TECHNICIAN`
- `DELIVERY_AGENT`
- `FINANCE`
- `MSE_TEAM`

## Authentication

### `POST /api/auth/login`

Authenticates portal users and mobile runners.

Request

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

Response highlights

- JWT access token
- user id
- username
- full name
- role
- optional phone details used by runner/mobile flows

## Service Request APIs

Base path: `/api/service-requests`

### `POST /api/service-requests`

Creates a new claim or service request.

Access

- `ADMIN`
- `CUSTOMER_SUPPORT`
- `BACKEND_TEAM`

Used by

- Claim registration page
- Pickup intake flow
- New case request workflow

Payload areas

- customer details
- device details
- claim and policy fields
- branch and employee fields
- partner reference and project name

### `GET /api/service-requests`

Lists requests. Supports optional `status` filter.

Examples

- `GET /api/service-requests`
- `GET /api/service-requests?status=REQUEST_CREATED`
- `GET /api/service-requests?status=CLOSED`

Access

- all portal roles listed above

Used by

- dashboard queues
- pickup, hub, estimate, delivery, and billing worklists
- request search and list screens

### `GET /api/service-requests/{id}`

Returns full request detail for one case.

Response includes current workflow state plus related data such as

- customer and device
- pickup and delivery details
- estimate summary
- invoice and payment summary
- attachments
- notifications
- status history and audit-style timeline data

### `POST /api/service-requests/{id}/pickup`

Assigns or updates pickup scheduling.

Access

- `ADMIN`
- `CUSTOMER_SUPPORT`
- `BACKEND_TEAM`

Flow impact

- assigns pickup runner
- sets schedule and notes
- generates runner portal token and smart runner link
- creates notification records for SMS, WhatsApp, and rider app inbox
- moves status into pickup assignment flow

### `POST /api/service-requests/{id}/estimate`

Creates or updates estimate details.

Access

- `ADMIN`
- `BACKEND_TEAM`
- `TECHNICIAN`
- `FINANCE`
- `MSE_TEAM`

### `POST /api/service-requests/{id}/estimate/approve`

Approves estimate or records approval remarks.

Access

- `ADMIN`
- `CUSTOMER_SUPPORT`
- `BACKEND_TEAM`
- `FINANCE`
- `MSE_TEAM`

### `POST /api/service-requests/{id}/status`

Executes guarded workflow transitions.

Access

- all operational roles except anonymous users

Common statuses used in the live portal

- `REQUEST_CREATED`
- `PICKUP_ASSIGNED`
- `PICKUP_IN_PROGRESS`
- `PICKUP_COMPLETED`
- `RECEIVED_AT_HUB`
- `DIAGNOSIS_IN_PROGRESS`
- `ESTIMATE_PREPARED`
- `CASHLESS_PENDING_APPROVAL`
- `CASHLESS_REVISION_REQUIRED`
- `CASHLESS_REJECTED`
- `CASHLESS_APPROVED`
- `ESTIMATE_APPROVED`
- `REPAIR_IN_PROGRESS`
- `REPAIR_COMPLETED`
- `TOTAL_LOSS`
- `READY_FOR_DISPATCH`
- `DELIVERY_ASSIGNED`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `INVOICED`
- `CLOSED`

### `POST /api/service-requests/{id}/delivery`

Assigns or updates delivery scheduling and owner.

Access

- `ADMIN`
- `CUSTOMER_SUPPORT`
- `BACKEND_TEAM`

### `POST /api/service-requests/{id}/attachments`

Uploads a request attachment using multipart form data.

Form fields

- `attachmentType`
- `file`

Access

- `ADMIN`
- `CUSTOMER_SUPPORT`
- `BACKEND_TEAM`
- `TECHNICIAN`
- `PICKUP_AGENT`
- `DELIVERY_AGENT`
- `MSE_TEAM`

Used for

- pickup images
- hub and service-center evidence
- estimate and cashless evidence
- invoice and billing files

### `DELETE /api/service-requests/{id}/attachments/{attachmentId}`

Deletes a request attachment when allowed by workflow rules.

### `POST /api/service-requests/{id}/invoice`

Creates a GST-ready invoice.

Access

- `ADMIN`
- `FINANCE`
- `MSE_TEAM`

### `POST /api/service-requests/{id}/payments`

Records a payment against an invoice.

Access

- `ADMIN`
- `FINANCE`
- `MSE_TEAM`

### `POST /api/service-requests/{id}/payments/{paymentId}/reconcile`

Records reconciliation result, UTR validation, and remarks.

Access

- `ADMIN`
- `FINANCE`
- `MSE_TEAM`

### `POST /api/service-requests/{id}/refunds`

Records a full or partial refund.

Access

- `ADMIN`
- `FINANCE`
- `MSE_TEAM`

## Public Runner Pickup Portal APIs

Base path: `/api/public/pickups`

These endpoints are anonymous by design and are protected by the generated runner token.

### `GET /api/public/pickups/{token}`

Returns pickup-specific request details for the runner portal.

### `POST /api/public/pickups/{token}/accept`

Runner accepts the assigned pickup from SMS, WhatsApp, browser, or mobile app.

System effect

- marks pickup accepted
- can move request from `PICKUP_ASSIGNED` to `PICKUP_IN_PROGRESS`
- stores customer and admin notification history

### `POST /api/public/pickups/{token}/attachments`

Uploads pickup evidence from the runner portal.

Form fields

- `attachmentType`
- `file`

Live business rule

- 10 pickup photos are required before final completion
- extra optional photos are also supported

### `DELETE /api/public/pickups/{token}/attachments/{attachmentId}`

Deletes a runner-uploaded pickup attachment when still allowed by the portal rules.

### `POST /api/public/pickups/{token}/complete`

Marks pickup complete after required evidence is uploaded.

System effect

- moves request to pickup-complete stage
- records pickup completion time
- triggers customer and admin notifications

## Mobile Runner Inbox API

Base path: `/api/mobile/runner`

### `GET /api/mobile/runner/notifications`

Returns rider app inbox items for the currently authenticated pickup runner only.

Access

- authenticated `PICKUP_AGENT` only

Response includes

- notification id
- subject and message
- request id and request number
- customer name
- device label
- current request status
- pickup schedule
- runner token for deep-linking back into the same pickup portal flow

## User And Runner APIs

Base path: `/api/users`

### `GET /api/users`

Lists users, optionally filtered by role and active status.

Examples

- `GET /api/users`
- `GET /api/users?role=PICKUP_AGENT`
- `GET /api/users?role=PICKUP_AGENT&activeOnly=true`

Used by

- pickup runner dropdown
- admin user lookups
- assignment screens

### `POST /api/users/pickup-runners`

Creates a pickup runner from the admin portal.

Access

- `ADMIN`
- `BACKEND_TEAM`

Business rules

- mobile number is mandatory
- WhatsApp number can be stored separately
- newly created active runners immediately appear in the pickup assignment dropdown

## Utility APIs

### `POST /api/devices/scan-qr`

Parses QR payload text and helps extract IMEI or device identifiers during inward and verification flows.

### `GET /api/files/access`

Returns signed access information for private attachment retrieval.

Used for

- private pickup and repair evidence
- invoice files
- secure browser downloads

## Notifications And Delivery Notes

When pickup is assigned, the system creates targeted notification records for the scheduled runner only:

- SMS to runner mobile number
- WhatsApp to runner WhatsApp number
- app inbox notification to the runner account

The same assignment also supports customer and admin notifications during accept and pickup completion.

If the live provider is not configured, these notifications are still stored in the database and available through logs and runner inbox flows.

## Related Frontend Routes

These are not backend APIs, but they are part of the same documented runner flow:

- `/runner-access/:token`
- `/runner-portal/:token`
- `/runner-app`

The hybrid mobile app opens the same runner portal and inbox flow through deep links and WebView.
