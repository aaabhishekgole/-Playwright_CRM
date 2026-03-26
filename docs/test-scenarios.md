# Workflow Test Scenarios

1. Create request from CRM and verify `REQUEST_CREATED` timeline entry.
2. Assign pickup and ensure pickup agent appears in request details.
3. Upload pickup images and verify attachments are visible in CRM.
4. Move request to diagnosis and prepare estimate.
5. Approve estimate and ensure request transitions to `ESTIMATE_APPROVED`.
6. Progress repair to `REPAIR_COMPLETED`.
7. Assign delivery and verify delivery agent workload screen.
8. Mark request `OUT_FOR_DELIVERY` then `DELIVERED`.
9. Generate invoice, move to `INVOICED`, then close request.
