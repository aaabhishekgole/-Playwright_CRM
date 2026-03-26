# Gadget Seva Hub Architecture

## High-Level Architecture

```text
[ React Admin CRM ] ----\\
                         \\
                          -> [ Spring Boot API ] -> [ PostgreSQL ]
                         /            |                |
[ React Native Mobile ]-/             |                -> status, audit, workflow data
                                      |
                                      +-> [ Redis ] for token/session cache and hot lookups
                                      |
                                      +-> [ S3-Compatible Storage ] for pickup and repair images
                                      |
                                      +-> [ Notification Adapter ] for email/SMS/push integrations
```

## Low-Level Architecture

- `frontend`: role-aware CRM used by admin, agent, technician, finance, and support users.
- `mobile`: lightweight field app for pickup and delivery executives.
- `backend`: Spring Boot monolith with modular packages for security, workflow orchestration, document storage, and audit history.
- `database`: PostgreSQL stores transactional data, lifecycle history, and invoice metadata.
- `cache`: Redis holds blacklist/session aids and frequently read workflow summaries.
- `object storage`: pickup images, estimate attachments, invoices, and signed proof-of-delivery assets.

## Core Modules

- `identity-access`: JWT login, refresh, role checks, user provisioning.
- `request-intake`: customer registration, device capture, service request creation.
- `workflow-engine`: guarded status transitions and SLA-friendly audit history.
- `pickup-operations`: assignment, image capture, pickup confirmation.
- `estimate-approval`: pricing, customer approval, revision tracking.
- `repair-operations`: technician notes, parts usage, repair completion.
- `delivery-operations`: final dispatch, OTP/signature confirmation, delivery closure.
- `billing`: invoice generation, payment status, settlement visibility.
- `attachments-notifications`: file storage abstraction plus notification publishing.

## User Roles

- `ADMIN`: full access, user and workflow administration.
- `CUSTOMER_SUPPORT`: creates requests, tracks progress, uploads docs.
- `PICKUP_AGENT`: views assigned pickups, uploads six-side images, confirms pickup.
- `TECHNICIAN`: updates diagnosis, repair progress, repair completion.
- `DELIVERY_AGENT`: views assigned deliveries, confirms OTP/signature.
- `FINANCE`: manages estimates, invoices, and payment state.

## Strict Workflow Lifecycle

```text
REQUEST_CREATED
-> PICKUP_ASSIGNED
-> PICKUP_IN_PROGRESS
-> PICKUP_COMPLETED
-> DIAGNOSIS_IN_PROGRESS
-> ESTIMATE_PREPARED
-> ESTIMATE_APPROVED
-> REPAIR_IN_PROGRESS
-> REPAIR_COMPLETED
-> DELIVERY_ASSIGNED
-> OUT_FOR_DELIVERY
-> DELIVERED
-> INVOICED
-> CLOSED
```

## Key Design Rules

- Every workflow change writes to `status_history`.
- Mutating APIs require authenticated users and role checks.
- Attachments are metadata-driven in PostgreSQL and binary data lives in object storage.
- Services enforce valid state transitions through a centralized rules utility.
- Audit columns are attached to all core transactional tables.

## Enterprise Enhancements

- `tenant-aware operations`: each request, invoice, notification, and attachment now carries tenant context for partner isolation.
- `sla monitoring`: requests track committed time, expected completion, SLA deadline, TAT, and breach alerts.
- `device intelligence`: IMEI values are validated and can be extracted from QR payloads.
- `secure attachments`: files are stored privately and exposed through expiring signed URLs.
- `notification engine`: queued notifications now support retry metadata and dead-letter handling.
- `audit and finance`: before/after audit logs, GST invoice generation, payment capture, and refund tracking are built into the workflow.
