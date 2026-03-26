ALTER TABLE payments ADD COLUMN utr_number VARCHAR(80);
ALTER TABLE payments ADD COLUMN reconciliation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE payments ADD COLUMN reconciliation_remarks VARCHAR(255);
ALTER TABLE payments ADD COLUMN reconciled_at TIMESTAMP;

INSERT INTO roles (name)
SELECT 'BACKEND_TEAM'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'BACKEND_TEAM');

INSERT INTO roles (name)
SELECT 'MSE_TEAM'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'MSE_TEAM');

CREATE INDEX idx_payments_reconciliation_status ON payments(reconciliation_status, created_at DESC);
