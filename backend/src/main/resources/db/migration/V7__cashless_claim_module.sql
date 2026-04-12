-- ============================================================
-- V7: Cashless Claim Module
-- Additive only. No existing tables modified destructively.
-- ============================================================

-- 1. Add request_type to service_requests (NORMAL_REPAIR / CASHLESS_CLAIM)
ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS request_type VARCHAR(30) NOT NULL DEFAULT 'NORMAL_REPAIR';

-- 2. Core claims table
CREATE TABLE IF NOT EXISTS claims (
    id                      BIGSERIAL PRIMARY KEY,
    service_request_id      BIGINT NOT NULL REFERENCES service_requests(id),
    claim_number            VARCHAR(30) NOT NULL UNIQUE,
    claim_status            VARCHAR(40) NOT NULL DEFAULT 'CLAIM_SUBMITTED',
    imei_number             VARCHAR(20),
    serial_number           VARCHAR(50),
    imei_verified           BOOLEAN NOT NULL DEFAULT FALSE,
    imei_verified_by        BIGINT REFERENCES users(id),
    imei_verified_at        TIMESTAMPTZ,
    imei_verification_note  TEXT,
    approved_amount         NUMERIC(12,2),
    rejection_reason        TEXT,
    reupload_attempt_count  INT NOT NULL DEFAULT 0,
    max_reupload_attempts   INT NOT NULL DEFAULT 3,
    locked_for_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at             TIMESTAMPTZ,
    rejected_at             TIMESTAMPTZ,
    closed_at               TIMESTAMPTZ,
    created_by              VARCHAR(120),
    updated_by              VARCHAR(120),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Claim documents (versioned uploads)
CREATE TABLE IF NOT EXISTS claim_documents (
    id              BIGSERIAL PRIMARY KEY,
    claim_id        BIGINT NOT NULL REFERENCES claims(id),
    document_type   VARCHAR(60) NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    content_type    VARCHAR(100),
    object_key      VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    checksum        VARCHAR(64),
    version_number  INT NOT NULL DEFAULT 1,
    is_current      BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by     VARCHAR(120),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Claim approval logs (audit trail for approve/reject actions)
CREATE TABLE IF NOT EXISTS claim_approval_logs (
    id              BIGSERIAL PRIMARY KEY,
    claim_id        BIGINT NOT NULL REFERENCES claims(id),
    action          VARCHAR(40) NOT NULL,
    action_by       VARCHAR(120),
    action_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remarks         TEXT,
    approved_amount NUMERIC(12,2),
    rejection_reason TEXT
);

-- 5. Invoice verification table
CREATE TABLE IF NOT EXISTS invoice_verification (
    id                          BIGSERIAL PRIMARY KEY,
    claim_id                    BIGINT NOT NULL REFERENCES claims(id),
    invoice_status              VARCHAR(40) NOT NULL DEFAULT 'INVOICE_SUBMITTED',
    invoice_amount              NUMERIC(12,2),
    approved_amount             NUMERIC(12,2),
    excess_amount               NUMERIC(12,2),
    excess_proof_uploaded       BOOLEAN NOT NULL DEFAULT FALSE,
    excess_proof_url            VARCHAR(500),
    approval_threshold_breached BOOLEAN NOT NULL DEFAULT FALSE,
    admin_approval_required     BOOLEAN NOT NULL DEFAULT FALSE,
    admin_approved_by           BIGINT REFERENCES users(id),
    admin_approved_at           TIMESTAMPTZ,
    rejection_reason            TEXT,
    reupload_attempt_count      INT NOT NULL DEFAULT 0,
    submitted_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at                 TIMESTAMPTZ,
    rejected_at                 TIMESTAMPTZ,
    created_by                  VARCHAR(120),
    updated_by                  VARCHAR(120),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Insurance submissions
CREATE TABLE IF NOT EXISTS insurance_submissions (
    id              BIGSERIAL PRIMARY KEY,
    claim_id        BIGINT NOT NULL REFERENCES claims(id),
    sub_status      VARCHAR(40) NOT NULL DEFAULT 'READY_FOR_INSURANCE',
    submitted_by    VARCHAR(120),
    submitted_at    TIMESTAMPTZ,
    notes           TEXT,
    created_by      VARCHAR(120),
    updated_by      VARCHAR(120),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_claims_service_request  ON claims(service_request_id);
CREATE INDEX IF NOT EXISTS idx_claims_status           ON claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claim_docs_claim        ON claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_docs_current      ON claim_documents(claim_id, is_current);
CREATE INDEX IF NOT EXISTS idx_invoice_ver_claim       ON invoice_verification(claim_id);
CREATE INDEX IF NOT EXISTS idx_insurance_sub_claim     ON insurance_submissions(claim_id);
CREATE INDEX IF NOT EXISTS idx_svc_req_type            ON service_requests(request_type);
