CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    partner_type VARCHAR(30),
    gstin VARCHAR(20),
    default_sla_hours INTEGER NOT NULL DEFAULT 48,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

INSERT INTO tenants (code, name, partner_type, gstin, default_sla_hours, active, created_by, updated_by)
VALUES ('GSH-CORE', 'Gadget Seva Hub Direct', 'DIRECT', '29ABCDE1234F1Z5', 48, TRUE, 'SYSTEM', 'SYSTEM');

ALTER TABLE users ADD COLUMN tenant_id BIGINT REFERENCES tenants(id);
ALTER TABLE customers ADD COLUMN gstin VARCHAR(20);
ALTER TABLE customers ADD COLUMN tenant_id BIGINT REFERENCES tenants(id);
ALTER TABLE devices ADD COLUMN qr_code_payload TEXT;
ALTER TABLE devices ADD COLUMN imei_validation_status VARCHAR(20) NOT NULL DEFAULT 'NOT_PROVIDED';
ALTER TABLE service_requests ADD COLUMN tenant_id BIGINT REFERENCES tenants(id);
ALTER TABLE service_requests ADD COLUMN partner_reference VARCHAR(60);
ALTER TABLE service_requests ADD COLUMN committed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE service_requests ADD COLUMN expected_completion_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '48 hour';
ALTER TABLE service_requests ADD COLUMN sla_deadline_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '48 hour';
ALTER TABLE service_requests ADD COLUMN actual_resolution_at TIMESTAMP;
ALTER TABLE service_requests ADD COLUMN tat_minutes BIGINT;
ALTER TABLE service_requests ADD COLUMN sla_breached BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE service_requests ADD COLUMN last_sla_alert_at TIMESTAMP;
ALTER TABLE service_requests ADD COLUMN breach_reason VARCHAR(255);
ALTER TABLE status_history ADD COLUMN before_value_json TEXT;
ALTER TABLE status_history ADD COLUMN after_value_json TEXT;
ALTER TABLE attachments ADD COLUMN tenant_id BIGINT REFERENCES tenants(id);
ALTER TABLE attachments ADD COLUMN checksum VARCHAR(128);
ALTER TABLE attachments ADD COLUMN private_file BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE attachments ADD COLUMN signed_url_expires_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN tenant_id BIGINT REFERENCES tenants(id);
ALTER TABLE notifications ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notifications ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 3;
ALTER TABLE notifications ADD COLUMN next_retry_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notifications ADD COLUMN payload_json TEXT;
ALTER TABLE notifications ADD COLUMN error_message VARCHAR(255);
ALTER TABLE notifications ALTER COLUMN delivery_status TYPE VARCHAR(30);
ALTER TABLE invoices ADD COLUMN tenant_id BIGINT REFERENCES tenants(id);
ALTER TABLE invoices ADD COLUMN customer_gstin VARCHAR(20);
ALTER TABLE invoices ADD COLUMN billing_state_code VARCHAR(10);
ALTER TABLE invoices ADD COLUMN place_of_supply VARCHAR(10);
ALTER TABLE invoices ADD COLUMN gst_type VARCHAR(20) NOT NULL DEFAULT 'CGST_SGST';
ALTER TABLE invoices ADD COLUMN cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN amount_due NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

UPDATE users SET tenant_id = (SELECT id FROM tenants WHERE code = 'GSH-CORE');
UPDATE customers SET tenant_id = (SELECT id FROM tenants WHERE code = 'GSH-CORE');
UPDATE service_requests SET tenant_id = (SELECT id FROM tenants WHERE code = 'GSH-CORE'), committed_at = created_at, expected_completion_at = created_at + INTERVAL '48 hour', sla_deadline_at = created_at + INTERVAL '48 hour';
UPDATE attachments SET tenant_id = (SELECT id FROM tenants WHERE code = 'GSH-CORE');
UPDATE notifications SET tenant_id = (SELECT id FROM tenants WHERE code = 'GSH-CORE'), next_retry_at = created_at;
UPDATE invoices SET tenant_id = (SELECT id FROM tenants WHERE code = 'GSH-CORE'), amount_due = total_amount;

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT,
    entity_name VARCHAR(80) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(40) NOT NULL,
    before_json TEXT,
    after_json TEXT,
    changed_by BIGINT REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(120) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    taxable_value NUMERIC(12, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES tenants(id),
    service_request_id BIGINT NOT NULL REFERENCES service_requests(id),
    invoice_id BIGINT NOT NULL REFERENCES invoices(id),
    payment_reference VARCHAR(40) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    refund_status VARCHAR(30) NOT NULL DEFAULT 'NOT_APPLICABLE',
    refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    refund_reason VARCHAR(255),
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,
    metadata_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE INDEX idx_service_request_sla ON service_requests(sla_breached, sla_deadline_at);
CREATE INDEX idx_notifications_queue ON notifications(delivery_status, next_retry_at);
CREATE INDEX idx_audit_logs_request ON audit_logs(service_request_id, changed_at DESC);
CREATE INDEX idx_payments_request ON payments(service_request_id, created_at DESC);