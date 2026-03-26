# Gadget Seva Hub API Summary

## Authentication

- `POST /api/auth/login`: returns access token and role information.

## Service Requests

- `POST /api/service-requests`: create a request with customer and device data.
- `GET /api/service-requests`: list requests with optional status filter.
- `GET /api/service-requests/{id}`: fetch one request with timeline-ready details.
- `POST /api/service-requests/{id}/pickup`: assign or update pickup.
- `POST /api/service-requests/{id}/estimate`: create estimate.
- `POST /api/service-requests/{id}/estimate/approve`: approve estimate.
- `POST /api/service-requests/{id}/status`: execute a guarded status transition.
- `POST /api/service-requests/{id}/delivery`: assign or update delivery.
- `POST /api/service-requests/{id}/attachments`: register uploaded file metadata.

## Example Workflow

1. Support creates a service request.
2. Admin assigns a pickup agent.
3. Pickup agent marks pickup completed with images.
4. Technician prepares an estimate.
5. Finance or customer support marks estimate approved.
6. Technician completes repair.
7. Admin assigns delivery.
8. Delivery agent confirms delivery with OTP/signature.
9. Finance generates invoice and closes request.

## Enterprise Enhancement APIs

- `POST /api/devices/scan-qr`: extract and validate IMEI from QR payload text.
- `POST /api/service-requests/{id}/invoice`: create GST-compliant invoice with line items.
- `POST /api/service-requests/{id}/payments`: capture payment against invoice.
- `POST /api/service-requests/{id}/refunds`: process full or partial refund.
- `GET /api/files/access`: consume secure signed file URL for private attachments.

## Response Contract Enhancements

- request detail responses now include tenant info, IMEI/QR metadata, SLA/TAT state, invoice summary, payments, notifications, audit trail, and signed attachment URLs.
