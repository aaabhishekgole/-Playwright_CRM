# Gadget Seva Hub Menu And Route Mapping

## Source Of Truth

The live menu and route system is currently driven by these files:

- menu hierarchy and role visibility: `frontend/src/utils/menuHierarchy.ts`
- protected route wiring: `frontend/src/main.tsx`
- workspace resolver: `frontend/src/pages/WorkspacePage.tsx`
- operational pickup and workflow pages: `frontend/src/pages/OperationalWorkspacePage.tsx`
- pickup overview dashboard: `frontend/src/pages/PickupManagementDashboardPage.tsx`

The old blueprint-style doc approach is no longer the primary source of truth. The current menu must be read from `menuHierarchy.ts` and the route wiring in `main.tsx`.

## Route Types

### Dedicated Pages

These routes go to purpose-built pages:

- `/` -> dashboard
- `/requests` -> all requests / open claims
- `/requests/:id` -> request details
- `/pickup-images` -> picked up devices and image gallery
- `/timeline` -> status history / recent activities
- `/estimate-approval` -> estimate approval queue
- `/cashless-approval` -> cashless approval queue
- `/payment-reconciliation` -> finance reconciliation screen
- `/delivery-tracking` -> delivery tracking screen
- `/workspace/service-requests/create-request` -> claim registration
- `/workspace/service-requests/open-requests` -> open claims worklist
- `/workspace/service-requests/in-progress` -> in-progress claims worklist
- `/workspace/service-requests/closed-requests` -> closed claims worklist
- `/workspace/service-requests/cancelled-requests` -> cancelled claims worklist
- `/workspace/service-requests/search-request` -> searchable claims list

### Specialized Workspace Pages

These still use the `/workspace/:sectionId/:itemId` pattern, but they resolve to custom pages instead of a plain placeholder:

- `pickup-dashboard` -> pickup dashboard
- `runner-onboarding` -> pickup runner onboarding form
- `assign-pickup` -> live pickup assignment operational page
- `pending-pickup` -> live pending pickup operational page
- `picked-up-devices` -> pickup images page
- `pickup-failed-cases` -> pickup failure operational page
- `pickup-history` -> pickup history operational page
- most hub, service-center, estimate, cashless, quality-check, delivery, and billing inner-flow items -> operational workflow page with API-backed actions

### Generic Workspace Pages

Some lower-priority admin, settings, reporting, and audit pages still render through the generic workspace/data-driven layout. They remain menu-visible and navigable, but are not all dedicated CRUD pages yet.

## Top-Level Menu Sections

### Dashboard

Section id: `dashboard`

Items

- `overview` -> `/`
- `sla-tat-summary` -> `/workspace/dashboard/sla-tat-summary`
- `recent-activities` -> `/workspace/dashboard/recent-activities`
- `alerts-escalations` -> `/workspace/dashboard/alerts-escalations`

Primary roles

- all operational roles

### Service Requests

Section id: `service-requests`

Items

- `create-request`
- `all-requests`
- `open-requests`
- `in-progress`
- `closed-requests`
- `cancelled-requests`
- `search-request`

Primary purpose

- intake, search, lifecycle list management, and request drilldown

### Pickup Management

Section id: `pickup-management`

Items

- `pickup-dashboard`
- `runner-onboarding`
- `assign-pickup`
- `pending-pickup`
- `picked-up-devices`
- `pickup-failed-cases`
- `pickup-history`

Primary purpose

- runner onboarding
- new case request to pickup assignment flow
- pending pickup execution
- pickup evidence gallery
- pickup performance and history

### Hub Operations

Section id: `hub-operations`

Items

- `device-received-at-hub`
- `pending-verification`
- `send-to-service-center`
- `inward-register`
- `hub-inventory`

### Service Center

Section id: `service-center`

Items

- `devices-under-inspection`
- `estimate-pending`
- `estimate-submitted`
- `under-repair`
- `repair-completed`
- `total-loss-cases`

### Estimates

Section id: `estimates`

Items

- `new-estimates`
- `awaiting-customer-approval`
- `approved-estimates`
- `rejected-estimates`
- `estimate-history`

### Cashless

Section id: `cashless`

Items

- `approval-queue`
- `pending-photos`
- `approved-cases`

### Quality Check

Section id: `quality-check`

Items

- `pending-qc`
- `qc-passed`
- `qc-failed`
- `rework-required`

### Delivery

Section id: `delivery`

Items

- `assign-delivery`
- `ready-for-dispatch`
- `out-for-delivery`
- `delivered`
- `delivery-failed`
- `delivery-history`

### Billing

Section id: `billing`

Items

- `generate-invoice`
- `pending-invoices`
- `payment-reconciliation`
- `paid-invoices`
- `refund-cases`
- `invoice-reports`

### Notifications

Section id: `notifications`

Items

- `sms-logs`
- `email-logs`
- `failed-notifications`
- `templates`

### Users

Section id: `users`

Items

- `admin-users`
- `delivery-executives`
- `hub-operators`
- `service-center-users`
- `customers`
- `roles-permissions`

### Reports

Section id: `reports`

Items

- `request-report`
- `pickup-report`
- `repair-report`
- `delivery-report`
- `sla-tat-report`
- `revenue-report`
- `audit-logs`

### Settings

Section id: `settings`

Items

- `status-configuration`
- `notification-settings`
- `sla-configuration`
- `file-storage-config`
- `system-preferences`

### Audit

Section id: `audit`

Items

- `activity-logs`
- `status-history`
- `user-actions`
- `change-logs`

## Role Visibility Summary

### Broad Operational Access

Visible to most roles:

- dashboard
- all requests
- request details
- SLA and recent activity views

### Pickup Roles

Pickup-facing screens are visible to combinations of:

- `ADMIN`
- `PICKUP_AGENT`
- `CUSTOMER_SUPPORT`
- `BACKEND_TEAM`

`runner-onboarding` is more restricted:

- `ADMIN`
- `BACKEND_TEAM`

### Finance Roles

Billing screens primarily use:

- `ADMIN`
- `FINANCE`
- `MSE_TEAM`

### Delivery Roles

Delivery screens primarily use:

- `ADMIN`
- `DELIVERY_AGENT`
- `CUSTOMER_SUPPORT`
- `BACKEND_TEAM`

## Public And Mobile Runner Flows

These routes are intentionally outside the protected admin sidebar, but they are part of the live menu ecosystem because pickup assignment sends riders here:

- `/runner-access/:token` -> smart entry point for browser or app redirection
- `/runner-portal/:token` -> public pickup execution page
- `/runner-app` -> browser version of rider inbox

The hybrid mobile app opens the same runner web flow through deep linking and WebView so rider behavior stays aligned with the browser fallback.

## Mapping Of Major Business Flows To Menu

### New Case Request

- Service Requests -> `Create Request`
- Pickup Management -> `Assign Pickup`

### Pickup Runner Execution

- Pickup Management -> `Pending Pickup`
- Pickup Management -> `Picked Up Devices`
- Pickup Management -> `Pickup History`
- public runner routes -> `/runner-access/:token`, `/runner-portal/:token`, `/runner-app`

### Hub To Repair

- Hub Operations -> inward and verification items
- Service Center -> inspection, estimate, repair, total loss
- Estimates -> approval and history
- Cashless -> approval queue and missing-photo review

### Dispatch To Billing

- Delivery -> assign, dispatch, delivered, history
- Billing -> invoice, payment reconciliation, paid invoices, refunds
- Audit / Reports -> timeline and reporting views

## Notes For Documentation And QA

- If a menu item is missing for a user, first check `roles` in `menuHierarchy.ts`
- If a route exists but renders a generic page, check `WorkspacePage.tsx`
- If a submenu should show live operational cards, it usually belongs in `OperationalWorkspacePage.tsx`
- Pickup runner onboarding and pickup assignment are now separate live flows and should be documented/tested independently
