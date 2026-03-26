# Menu Mapping Blueprint

This repository now maps the merchant menu in three layers:

1. UI screen design mapping lives in `frontend/src/utils/menuBlueprints.ts`
2. Backend table and API mapping lives in the same blueprint source
3. Role-based visibility is enforced in `frontend/src/utils/menuHierarchy.ts`, `frontend/src/layouts/AppLayout.tsx`, and `frontend/src/main.tsx`

## How to read it

- Every menu item inherits a section-level backend footprint.
- Every menu item also gets a screen layout pattern derived from its item id such as `create`, `assign`, `pending`, `history`, `report`, or `settings`.
- The workspace UI renders this mapping directly so each menu screen shows:
  - UI Screen Design
  - DB Tables and APIs
  - Implementation Notes

## Module Coverage

### Dashboard
- Tables: `service_requests`, `notifications`, `status_history`, `audit_logs`, `invoices`
- APIs: `GET /api/service-requests`

### Service Requests
- Tables: `service_requests`, `customers`, `devices`, `tenants`, `status_history`
- APIs: `POST /api/service-requests`, `GET /api/service-requests`, `GET /api/service-requests/{id}`, `POST /api/service-requests/{id}/status`

### Pickup Management
- Tables: `pickups`, `service_requests`, `attachments`, `customers`, `devices`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`, `POST /api/service-requests/{id}/pickup`, `POST /api/service-requests/{id}/attachments`

### Hub Operations
- Tables: `service_requests`, `devices`, `attachments`, `status_history`, `tenants`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`, `POST /api/devices/scan-qr`, `POST /api/service-requests/{id}/status`, `POST /api/service-requests/{id}/attachments`

### Service Center
- Tables: `estimates`, `repairs`, `service_requests`, `devices`, `status_history`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`, `POST /api/service-requests/{id}/estimate`, `POST /api/service-requests/{id}/status`

### Estimates
- Tables: `estimates`, `service_requests`, `notifications`, `status_history`, `audit_logs`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`, `POST /api/service-requests/{id}/estimate`, `POST /api/service-requests/{id}/estimate/approve`

### Quality Check
- Tables: `repairs`, `service_requests`, `status_history`, `audit_logs`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`, `POST /api/service-requests/{id}/status`

### Delivery
- Tables: `deliveries`, `service_requests`, `attachments`, `notifications`, `status_history`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`, `POST /api/service-requests/{id}/delivery`, `POST /api/service-requests/{id}/status`

### Billing
- Tables: `invoices`, `invoice_items`, `payments`, `service_requests`, `audit_logs`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`, `POST /api/service-requests/{id}/invoice`, `POST /api/service-requests/{id}/payments`, `POST /api/service-requests/{id}/refunds`

### Notifications
- Tables: `notifications`, `service_requests`, `audit_logs`, `tenants`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`

### Users
- Tables: `users`, `roles`, `tenants`, `service_requests`
- APIs: `POST /api/auth/login`
- Note: CRUD admin APIs are still pending even though the UI structure is mapped.

### Reports
- Tables: `service_requests`, `pickups`, `deliveries`, `invoices`, `payments`, `audit_logs`, `notifications`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`

### Settings
- Tables: `tenants`, `users`, `attachments`, `notifications`, `service_requests`
- APIs: `GET /api/service-requests`, `GET /api/files/access`
- Note: dedicated settings admin APIs are still pending.

### Audit
- Tables: `audit_logs`, `status_history`, `service_requests`, `users`
- APIs: `GET /api/service-requests`, `GET /api/service-requests/{id}`

## Verification path

Open any mapped workspace route in the frontend and the page will show the screen design and backend mapping for that exact menu item.
