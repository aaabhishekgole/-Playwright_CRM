ALTER TABLE customers ADD COLUMN secondary_email VARCHAR(120);
ALTER TABLE customers ADD COLUMN alternate_phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN whatsapp_number VARCHAR(20);
ALTER TABLE customers ADD COLUMN contact_person VARCHAR(120);
ALTER TABLE customers ADD COLUMN landmark VARCHAR(180);
ALTER TABLE customers ADD COLUMN google_map_link VARCHAR(255);

ALTER TABLE service_requests ADD COLUMN loan_number VARCHAR(60);
ALTER TABLE service_requests ADD COLUMN certificate_of_insurance_number VARCHAR(80);
ALTER TABLE service_requests ADD COLUMN previous_ticket_number VARCHAR(60);
ALTER TABLE service_requests ADD COLUMN project_name VARCHAR(120);
ALTER TABLE service_requests ADD COLUMN branch_name VARCHAR(120);
ALTER TABLE service_requests ADD COLUMN employee_code VARCHAR(80);
ALTER TABLE service_requests ADD COLUMN employee_name VARCHAR(120);
