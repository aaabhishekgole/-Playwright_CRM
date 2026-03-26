# Gadget Seva Hub Database Schema

## Primary Tables

- `roles`: system roles.
- `users`: application users with role mapping.
- `customers`: customer profile and contact details.
- `devices`: device identity and warranty metadata.
- `service_requests`: workflow root entity connecting customer and device.
- `status_history`: immutable workflow transition log.
- `pickups`: pickup assignment, schedule, agent notes, OTP confirmation.
- `estimates`: diagnosis summary, labor cost, parts cost, approval metadata.
- `repairs`: repair execution data and technician completion details.
- `deliveries`: delivery scheduling, dispatch, OTP/signature completion.
- `invoices`: final bill and payment status.
- `attachments`: object-storage backed files linked to request and step.
- `notifications`: outbound message log for auditability.

## Relationships

- `users.role_id -> roles.id`
- `service_requests.customer_id -> customers.id`
- `service_requests.device_id -> devices.id`
- `service_requests.assigned_pickup_agent_id -> users.id`
- `service_requests.assigned_technician_id -> users.id`
- `service_requests.assigned_delivery_agent_id -> users.id`
- `status_history.service_request_id -> service_requests.id`
- `status_history.changed_by -> users.id`
- `pickups.service_request_id -> service_requests.id`
- `pickups.agent_id -> users.id`
- `estimates.service_request_id -> service_requests.id`
- `repairs.service_request_id -> service_requests.id`
- `repairs.technician_id -> users.id`
- `deliveries.service_request_id -> service_requests.id`
- `deliveries.agent_id -> users.id`
- `invoices.service_request_id -> service_requests.id`
- `attachments.service_request_id -> service_requests.id`
- `notifications.service_request_id -> service_requests.id`

## Index Strategy

- `users(username)` unique for login.
- `roles(name)` unique for stable authorization lookups.
- `service_requests(request_number)` unique for business search.
- `service_requests(status, priority)` for dashboard queues.
- `service_requests(created_at)` for timeline and aging reports.
- `status_history(service_request_id, changed_at desc)` for timeline reads.
- `pickups(agent_id, scheduled_at)` for agent workload.
- `deliveries(agent_id, scheduled_at)` for dispatch workload.
- `attachments(service_request_id, attachment_type)` for request document lookups.

## Audit Strategy

- Core tables contain `created_at`, `updated_at`, `created_by`, `updated_by`.
- `status_history` is append-only and acts as the source of truth for lifecycle progression.
- `notifications` stores payload summary, channel, target, and send result.

## Migration

- Initial schema is defined in `backend/src/main/resources/db/migration/V1__init.sql`.

## Enterprise Enhancement Tables

- `tenants`: partner and direct-business tenant registry with default SLA policy.
- `audit_logs`: full before/after change ledger for workflow, billing, and file events.
- `invoice_items`: GST line items for compliant invoice rendering.
- `payments`: captured payments, refund state, and refund reason history.

## Enterprise Enhancement Columns

- `service_requests`: `tenant_id`, `partner_reference`, `committed_at`, `expected_completion_at`, `sla_deadline_at`, `actual_resolution_at`, `tat_minutes`, `sla_breached`, `last_sla_alert_at`, `breach_reason`
- `devices`: `qr_code_payload`, `imei_validation_status`
- `attachments`: `tenant_id`, `checksum`, `private_file`, `signed_url_expires_at`
- `notifications`: `tenant_id`, `attempt_count`, `max_attempts`, `next_retry_at`, `payload_json`, `error_message`
- `invoices`: GST breakdown, amount paid/due, refund amount, tenant context
