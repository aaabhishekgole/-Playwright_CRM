CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    username VARCHAR(80) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120),
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(180) NOT NULL,
    address_line2 VARCHAR(180),
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE TABLE devices (
    id BIGSERIAL PRIMARY KEY,
    brand VARCHAR(80) NOT NULL,
    model VARCHAR(80) NOT NULL,
    serial_number VARCHAR(120) NOT NULL UNIQUE,
    imei_number VARCHAR(50),
    warranty_status VARCHAR(30) NOT NULL,
    device_condition VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE TABLE service_requests (
    id BIGSERIAL PRIMARY KEY,
    request_number VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    device_id BIGINT NOT NULL REFERENCES devices(id),
    issue_summary VARCHAR(255) NOT NULL,
    issue_description TEXT,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(40) NOT NULL,
    source_channel VARCHAR(40) NOT NULL,
    assigned_pickup_agent_id BIGINT REFERENCES users(id),
    assigned_technician_id BIGINT REFERENCES users(id),
    assigned_delivery_agent_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE TABLE status_history (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL REFERENCES service_requests(id),
    from_status VARCHAR(40),
    to_status VARCHAR(40) NOT NULL,
    remarks VARCHAR(255),
    changed_by BIGINT REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pickups (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL UNIQUE REFERENCES service_requests(id),
    agent_id BIGINT NOT NULL REFERENCES users(id),
    scheduled_at TIMESTAMP NOT NULL,
    pickup_otp VARCHAR(10),
    completed_at TIMESTAMP,
    customer_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE TABLE estimates (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL UNIQUE REFERENCES service_requests(id),
    diagnosis_summary TEXT NOT NULL,
    parts_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    labor_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMP,
    approved_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE TABLE repairs (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL UNIQUE REFERENCES service_requests(id),
    technician_id BIGINT REFERENCES users(id),
    repair_notes TEXT,
    parts_used TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    quality_check_status VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE TABLE deliveries (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL UNIQUE REFERENCES service_requests(id),
    agent_id BIGINT NOT NULL REFERENCES users(id),
    scheduled_at TIMESTAMP NOT NULL,
    otp_code VARCHAR(10),
    signature_url VARCHAR(255),
    dispatched_at TIMESTAMP,
    delivered_at TIMESTAMP,
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL UNIQUE REFERENCES service_requests(id),
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(80),
    updated_by VARCHAR(80)
);

CREATE TABLE attachments (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL REFERENCES service_requests(id),
    attachment_type VARCHAR(40) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    object_key VARCHAR(255) NOT NULL UNIQUE,
    uploaded_by BIGINT REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT,
    channel VARCHAR(30) NOT NULL,
    recipient VARCHAR(120) NOT NULL,
    subject VARCHAR(150),
    message TEXT NOT NULL,
    delivery_status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_request_status_priority ON service_requests(status, priority);
CREATE INDEX idx_service_request_created_at ON service_requests(created_at);
CREATE INDEX idx_status_history_request_changed_at ON status_history(service_request_id, changed_at DESC);
CREATE INDEX idx_pickups_agent_schedule ON pickups(agent_id, scheduled_at);
CREATE INDEX idx_deliveries_agent_schedule ON deliveries(agent_id, scheduled_at);
CREATE INDEX idx_attachments_request_type ON attachments(service_request_id, attachment_type);

INSERT INTO roles (name) VALUES
    ('ADMIN'),
    ('CUSTOMER_SUPPORT'),
    ('PICKUP_AGENT'),
    ('TECHNICIAN'),
    ('DELIVERY_AGENT'),
    ('FINANCE');
