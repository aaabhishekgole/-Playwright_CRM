# Gadget Seva Hub Database Schema

## Storage Modes

### Local Development

- engine: H2
- JDBC URL: `jdbc:h2:file:./.data/gadget-seva-hub`
- file location: `backend/.data/gadget-seva-hub.mv.db`
- Flyway: disabled in `application-local.yml`

### Integrated / Production-Like Mode

- engine: PostgreSQL
- Flyway: enabled

The domain model is the same in both modes. Local mode exists for fast portal development and seeded workflow testing.

## Core Domain Tables

### Identity And Access

- `roles`
- `users`
- `tenants`

### Request Intake And Workflow

- `customers`
- `device_categories`
- `devices`
- `service_requests`
- `status_history`
- `pickups`
- `deliveries`
- `estimates`
- `repairs`

### Files, Notifications, And Audit

- `attachments`
- `notifications`
- `audit_logs`

### Billing

- `invoices`
- `invoice_items`
- `payments`

## Table Summary

### `roles`

Stores stable role names such as `ADMIN`, `PICKUP_AGENT`, `TECHNICIAN`, `FINANCE`, and `MSE_TEAM`.

### `users`

Stores all platform users including admins, pickup runners, delivery users, technicians, and finance users.

Important columns

- `full_name`
- `username`
- `password`
- `email`
- `phone`
- `whatsapp_number`
- `active`
- `role_id`
- `tenant_id`

### `customers`

Stores customer identity and contact information used in claim registration and communication.

### `device_categories`

Lookup table for categories such as mobile, TV, laptop, AC, and DSLR/camera workflows.

### `devices`

Stores device metadata.

Important columns

- `brand`
- `model`
- `serial_number`
- `imei_number`
- `qr_code_payload`
- `imei_validation_status`
- `device_category_id`

### `service_requests`

Primary workflow root entity.

Important columns

- `request_number`
- `customer_id`
- `device_id`
- `issue_summary`
- `issue_description`
- `priority`
- `status`
- `source_channel`
- `assigned_pickup_agent_id`
- `assigned_technician_id`
- `assigned_delivery_agent_id`
- `tenant_id`
- `loan_number`
- `certificate_of_insurance_number`
- `previous_ticket_number`
- `partner_reference`
- `project_name`
- `branch_name`
- `employee_code`
- `employee_name`
- `committed_at`
- `expected_completion_at`
- `sla_deadline_at`
- `actual_resolution_at`
- `tat_minutes`
- `sla_breached`
- `last_sla_alert_at`
- `breach_reason`

### `status_history`

Append-only request lifecycle timeline.

Important columns

- `service_request_id`
- `from_status`
- `to_status`
- `remarks`
- `changed_by`
- `changed_at`

### `pickups`

Stores pickup assignment and runner portal state.

Important columns

- `service_request_id`
- `agent_id`
- `scheduled_at`
- `pickup_otp`
- `accepted_at`
- `completed_at`
- `runner_portal_token`
- `runner_link_sent_at`
- `customer_confirmation`
- `notes`

### `deliveries`

Stores dispatch and last-mile delivery assignment details.

### `estimates`

Stores diagnosis, labor cost, parts cost, and estimate approval data.

### `repairs`

Stores repair execution and completion details.

### `attachments`

Stores metadata for all uploaded files.

Important columns

- `service_request_id`
- `tenant_id`
- `attachment_type`
- `file_name`
- `content_type`
- `object_key`
- `checksum`
- `private_file`
- `signed_url_expires_at`
- `uploaded_by`
- `uploaded_at`

Used for

- pickup evidence
- cashless evidence
- repair and QC images
- invoice and billing documents

### `notifications`

Stores all outbound communication attempts and app inbox records.

Important columns

- `service_request_id`
- `tenant_id`
- `channel`
- `recipient`
- `subject`
- `message`
- `delivery_status`
- `created_at`
- `attempt_count`
- `max_attempts`
- `next_retry_at`
- `payload_json`
- `error_message`

The same table is used for runner SMS, WhatsApp, customer/admin notifications, and rider app inbox records.

### `audit_logs`

Stores before-and-after operational and finance change logs.

### `invoices`

Stores GST-aware invoice summaries.

Important columns

- `service_request_id`
- `tenant_id`
- `invoice_number`
- `subtotal`
- `tax_amount`
- `total_amount`
- `payment_status`
- `issued_at`
- `paid_at`
- `customer_gstin`
- `billing_state_code`
- `place_of_supply`
- `gst_type`
- `cgst_amount`
- `sgst_amount`
- `igst_amount`
- `amount_paid`
- `amount_due`
- `refund_amount`

### `invoice_items`

Stores invoice line items used for GST-compliant invoice breakdowns.

### `payments`

Stores payment collection, reconciliation, and refund state.

Important columns

- `tenant_id`
- `service_request_id`
- `invoice_id`
- `payment_reference`
- `amount`
- `payment_method`
- `utr_number`
- `payment_status`
- `refund_status`
- `reconciliation_status`
- `refund_amount`
- `refund_reason`
- `reconciliation_remarks`
- `paid_at`
- `reconciled_at`
- `refunded_at`
- `metadata_json`

## Key Relationships

- `users.role_id -> roles.id`
- `users.tenant_id -> tenants.id`
- `service_requests.customer_id -> customers.id`
- `service_requests.device_id -> devices.id`
- `service_requests.tenant_id -> tenants.id`
- `service_requests.assigned_pickup_agent_id -> users.id`
- `service_requests.assigned_technician_id -> users.id`
- `service_requests.assigned_delivery_agent_id -> users.id`
- `status_history.service_request_id -> service_requests.id`
- `status_history.changed_by -> users.id`
- `pickups.service_request_id -> service_requests.id`
- `pickups.agent_id -> users.id`
- `deliveries.service_request_id -> service_requests.id`
- `deliveries.agent_id -> users.id`
- `estimates.service_request_id -> service_requests.id`
- `repairs.service_request_id -> service_requests.id`
- `repairs.technician_id -> users.id`
- `attachments.service_request_id -> service_requests.id`
- `notifications.service_request_id -> service_requests.id`
- `invoices.service_request_id -> service_requests.id`
- `invoice_items.invoice_id -> invoices.id`
- `payments.invoice_id -> invoices.id`
- `payments.service_request_id -> service_requests.id`

## Status Model

Current request lifecycle values:

- `REQUEST_CREATED`
- `PICKUP_ASSIGNED`
- `PICKUP_IN_PROGRESS`
- `CUSTOMER_NOT_AVAILABLE`
- `CUSTOMER_RESCHEDULED`
- `CUSTOMER_NOT_CONTACTABLE`
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

These statuses are guarded in backend transition rules and mirrored throughout the portal worklists.

## Important Index And Constraint Notes

- `roles(name)` is unique
- `users(username)` is unique
- `service_requests(request_number)` is unique
- `pickups.runner_portal_token` has a unique index
- operational list screens rely heavily on `service_requests.status`
- timeline screens rely on `status_history(service_request_id, changed_at)`

## Migration History In This Repo

The repository currently contains these SQL migrations:

- `V1__init.sql`
- `V2__enterprise_enhancements.sql`
- `V3__device_categories.sql`
- `V3__workflow_reconciliation_roles.sql`
- `V4__claim_registration_fields.sql`
- `V5__runner_pickup_portal.sql`
- `V6__pickup_runner_onboarding.sql`

Notable additions by later migrations:

- enterprise tables and SLA fields
- device category support
- workflow reconciliation and extended roles
- claim registration business fields
- runner portal token and acceptance tracking
- runner `whatsapp_number` for targeted pickup notifications

## Practical Verification Queries

Good tables to inspect during testing:

- `service_requests` for current status and owner
- `status_history` for lifecycle progression
- `pickups` for runner token, schedule, and acceptance/completion timestamps
- `attachments` for 10 mandatory pickup images and optional extras
- `notifications` for rider SMS, WhatsApp, app inbox, customer, and admin communication
- `invoices` and `payments` for INR billing and reconciliation state
