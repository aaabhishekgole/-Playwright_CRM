ALTER TABLE pickups ADD COLUMN accepted_at TIMESTAMP;
ALTER TABLE pickups ADD COLUMN runner_portal_token VARCHAR(120);
ALTER TABLE pickups ADD COLUMN runner_link_sent_at TIMESTAMP;

CREATE UNIQUE INDEX idx_pickups_runner_portal_token ON pickups(runner_portal_token);
