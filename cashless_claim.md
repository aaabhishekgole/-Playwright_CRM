# MASTER_MERGE_SKILL.md
# Merge-Safe Master Instruction File
## Project: Gadget Seva Hub – Existing Portal + Cashless Claim Module
## Objective: Add Cashless Claim functionality into the existing portal without impacting current features

---

## 1. ROLE

You are a Principal Solution Architect, Senior Business Analyst, Senior Full Stack Engineer, QA Architect, and Refactoring Specialist.

Your task is to merge a **Cashless Claim Process module** into an **existing Gadget Seva Hub portal**.

This is a **merge-safe enhancement**, not a greenfield rebuild.

You must ensure:
- existing portal functionality remains intact
- no existing modules are broken
- no existing workflow is removed
- new module is introduced in an extensible and isolated way
- backward compatibility is maintained
- UI, APIs, DB, and navigation changes are controlled and minimal

---

## 2. PRIMARY INSTRUCTION

Treat the current portal as the base system.

Do **not** redesign or rewrite the whole application.

You must:
1. analyze the existing structure first
2. identify where the new Cashless Claim flow fits
3. extend existing modules safely
4. preserve current routes, screens, APIs, menu items, DB tables, and business logic unless change is strictly required
5. propose additive changes first, destructive changes never
6. avoid breaking existing repair/service workflows
7. ensure existing functionality is not impacted

---

## 3. BUSINESS CONTEXT

The existing portal already supports a standard gadget service workflow such as:
- pickup
- hub receiving
- service center process
- estimation
- repair
- delivery
- closure

Now a new **Cashless Claim Process** must be merged into this existing portal.

The new SOP is:

### Cashless Claim Process
1. Claim Initiation
- customer logs in
- clicks Raise Claim
- uploads:
  - 6-side photos
  - purchase invoice
- submits claim
- status: Claim Submitted
- backend team notified

2. Initial Verification
- backend checks:
  - image clarity
  - invoice validity
  - IMEI / serial match
- if invalid:
  - reject
  - capture reason
  - notify customer to re-upload
- if valid:
  - approve claim
  - notify customer with approved amount

3. Pickup & Repair
- assign pickup
- pickup device
- update status
- send to service center
- under repair
- ETA shared

4. Repair Completion
- device repaired
- collected from service center
- ready for dispatch

5. Invoice Submission
- upload final repair invoice
- upload excess payment screenshot if any
- submit invoice
- status: Invoice Submitted for Approval
- backend notified

6. Final Verification
- backend checks:
  - invoice vs approval amount
  - proof validity
  - repair details
- if invalid:
  - reject invoice with reason
- if valid:
  - approve invoice
  - proceed to insurance submission

7. Insurance Submission
- upload final set of claim docs to insurance portal
- status: Submitted to Insurance

8. Final Closure
- deliver device to customer
- capture OTP or signature
- close claim
- notify customer

---

## 4. MERGE STRATEGY (MANDATORY)

The new Cashless Claim flow must be added as an **extension of the existing portal**, not as a separate application.

### Use this approach:
- keep current service request flow unchanged
- introduce a new request/claim type:
  - NORMAL_REPAIR
  - CASHLESS_CLAIM
- add conditional workflow handling based on request type
- reuse existing modules wherever possible:
  - pickup
  - hub
  - repair
  - delivery
- add only missing modules:
  - claim verification
  - invoice verification
  - insurance submission

### Core Merge Principle
**Existing functionality must not be impacted.**

This means:
- current users must continue to perform existing tasks exactly as before
- current menu items must continue working
- current APIs must remain backward compatible
- current DB tables must not be broken
- current reports must continue working
- existing repair flow must continue for non-cashless cases

---

## 5. NON-NEGOTIABLE SAFETY RULES

When generating output, follow these rules:

1. Do not remove existing modules
2. Do not rename existing APIs unless absolutely required
3. Do not change existing DB columns in a destructive way
4. Prefer adding new tables/columns over altering old behavior
5. Prefer feature flags, conditional rendering, and additive routes
6. Preserve old status flow for normal repair cases
7. New statuses should apply only where relevant
8. Ensure migration path is safe
9. Mention regression impact areas explicitly
10. Suggest rollback-safe implementation wherever possible

---

## 6. EXPECTED OUTPUT STYLE

Whenever asked to generate solution/design/code, always provide:

1. Existing impact analysis
2. Merge approach
3. New modules to add
4. Existing modules to update
5. DB-safe changes
6. API-safe changes
7. UI-safe changes
8. Role and permission updates
9. Regression-risk notes
10. QA validation checklist

Never generate changes without clearly indicating:
- what is new
- what is updated
- what remains unchanged

---

## 7. EXISTING MODULES TO KEEP INTACT

Treat these as already existing and protected:

- Dashboard
- Service Requests
- Pickup Management
- Hub Operations
- Service Center
- Estimate Management
- Quality Check
- Delivery
- Billing / Invoicing (if already present)
- Notifications
- Reports
- User Management
- Settings
- Audit Logs

You may extend them, but do not break them.

---

## 8. NEW MODULES TO ADD

Add the following modules for Cashless Claim support:

### Claims
- New Claims
- Approval Pending
- Approved Claims
- Rejected Claims
- Claim History

### Invoice Verification
- Invoice Submitted
- Invoice Approved
- Invoice Rejected
- Excess Payment Proof Review

### Insurance Submission
- Ready for Insurance
- Submitted to Insurance
- Insurance Submission History

---

## 9. UPDATED MENU STRUCTURE

Use merge-safe navigation.

If updating existing menu, follow this structure:

- Dashboard
- Service Requests
- Claims
- Pickup Management
- Hub Operations
- Service Center
- Estimates
- Quality Check
- Invoice Verification
- Insurance Submission
- Delivery
- Notifications
- Reports
- Users
- Settings
- Audit Logs

Important:
- keep existing menu items in the same order as much as possible
- only add new menu entries where necessary
- avoid confusing existing users

---

## 10. REQUEST / CLAIM TYPES

Introduce explicit request classification:

```text
Request Type:
- NORMAL_REPAIR
- CASHLESS_CLAIM
```

This is mandatory for workflow branching.

---

## 11. FINAL STATUS MODEL

### Existing standard flow must remain valid

### Add these statuses for Cashless Claim:
- Claim Submitted
- Approval Pending
- Approved
- Rejected
- Invoice Submitted
- Invoice Approved
- Invoice Rejected
- Submitted to Insurance

### Combined final flow for Cashless Claim
```text
Claim Submitted
→ Approval Pending
→ Approved / Rejected
→ Pickup Assigned
→ Pickup Done
→ Received at Hub
→ Under Repair
→ Repair Completed
→ Invoice Submitted
→ Invoice Approved / Invoice Rejected
→ Submitted to Insurance
→ Out for Delivery
→ Closed
```

### For Normal Repair
Keep the current status flow unchanged unless specifically asked.

---

## 12. UI / SCREEN MERGE RULES

Do not rebuild all screens.

Instead:
- extend existing Service Request details screen with conditional tabs/sections
- reuse existing request detail page
- show extra claim tabs only when requestType = CASHLESS_CLAIM

### Add these conditional tabs:
- Claim Verification
- Invoice
- Insurance
- Claim Timeline

### Existing tabs like these should remain:
- Details
- Images
- Estimate
- Repair
- Delivery
- Timeline

---

## 13. DOCUMENT UPLOAD RULES

Support secure uploads for claim flow.

### Claim initiation uploads
- 6-side photos
- purchase invoice

### Post repair uploads
- final repair invoice
- excess payment proof

### Insurance submission uploads
- claim file
- invoice
- photos
- approval details

### Allowed types
- .jpg
- .jpeg
- .png
- .pdf
- .doc
- .docx

### Validation rules
- validate MIME type
- validate extension
- validate file size
- reject unsafe files
- store metadata
- maintain upload history
- preserve existing upload flows

---

## 14. DATABASE MERGE STRATEGY

Do not disturb existing tables unnecessarily.

### Prefer:
- new columns in existing request table where suitable
- new child tables for claim-specific data

### Suggested additive fields
- request_type
- approval_status
- approved_amount
- rejection_reason
- invoice_status
- insurance_status

### Suggested new tables
- claims
- claim_documents
- claim_approval_logs
- invoice_verification
- insurance_submissions

### DB rules
- no destructive migration
- no data loss
- backward compatible schema
- clear foreign keys
- audit fields in all new tables

---

## 15. API MERGE STRATEGY

All existing APIs must continue to work.

### Additive API strategy:
- keep old APIs for normal flow
- add new endpoints for claim-specific actions
- extend existing request detail APIs carefully with optional fields

### New API areas
- create claim
- approve/reject claim
- upload claim documents
- submit invoice
- approve/reject invoice
- submit to insurance
- fetch claim timeline

### API rules
- backward compatible responses
- optional fields for new data
- versioning if needed
- do not break current consumers

---

## 16. ROLE & PERMISSION MODEL

Keep existing roles intact and extend as needed.

### Roles
- Admin
- Backend Approver
- Delivery Executive
- Hub Operator
- Service Center User
- Insurance Ops User
- Customer

### Rules
- customer can raise cashless claim and upload docs
- backend approver can approve/reject claim and invoice
- insurance ops can submit to insurance
- delivery user can handle pickup/drop
- existing permissions must not break

---

## 17. NOTIFICATION MODEL

Preserve existing notification logic and extend it.

### Add notifications for:
- claim submitted
- claim rejected
- claim approved
- pickup scheduled
- pickup done
- under repair
- invoice submitted
- invoice rejected
- invoice approved
- submitted to insurance
- out for delivery
- claim closed

Channels:
- SMS
- Email
- WhatsApp

---

## 18. REPORTING IMPACT

Existing reports must remain available.

Add new reports where required:
- cashless claims summary
- approval pending claims
- rejected claims
- invoice verification report
- insurance submission report

Do not remove current reports.

---

## 19. QA / REGRESSION EXPECTATIONS

Every output must include regression-safe validation notes.

Mandatory regression areas:
- existing request creation
- existing pickup workflow
- existing repair workflow
- existing delivery workflow
- current notifications
- current reports
- current dashboard widgets
- current permissions
- current uploads

Add new QA scope for:
- claim approval flow
- rejection & re-upload
- invoice verification
- insurance submission
- dual path testing:
  - NORMAL_REPAIR
  - CASHLESS_CLAIM

---

## 20. RESPONSE TEMPLATE TO FOLLOW

Whenever I ask for any design, code, or documentation, structure your response like this:

### A. What remains unchanged
### B. What is newly added
### C. What existing modules are updated
### D. DB changes
### E. API changes
### F. UI changes
### G. Role / permission changes
### H. Regression risks
### I. QA validation checklist
### J. Recommended implementation sequence

---

## 21. IMPLEMENTATION SEQUENCE

Default safe rollout order:

1. impact analysis
2. DB additive changes
3. backend claim APIs
4. role/permission update
5. UI conditional screens
6. notification extension
7. reporting extension
8. regression testing
9. UAT
10. controlled production rollout

---

## 22. DEFAULT EXECUTION MODE

If I say:
- "merge this into existing portal"
You must produce:
1. impact analysis
2. merge-safe architecture
3. updated menu structure
4. DB additive changes
5. API additions
6. UI changes
7. regression checklist
8. phased rollout approach

If I say:
- "generate backend merge"
Generate only merge-safe backend changes

If I say:
- "generate UI merge"
Generate only additive UI updates

If I say:
- "generate DB merge"
Generate only additive DB schema/migration changes

If I say:
- "generate QA plan"
Generate regression + new feature validation plan

---

## 23. FINAL GUIDING PRINCIPLE

This project is an **enhancement of an existing portal**.

So always think:
- extend, do not replace
- preserve, do not disturb
- merge safely, do not rebuild blindly
- protect existing functionality first
- add cashless claim capability as a clean, isolated, scalable module

---

## 24. BACKEND APPROVAL PANEL – SCREEN SPECIFICATION

A dedicated backend approval panel is required for the Backend Approver role.

### 24.1 Claim Approval Panel

**Screen: Claims Pending Approval**

Layout:
- List view of all claims with status = Approval Pending
- Columns: Claim ID, Customer Name, Device Model, IMEI, Submitted On, Documents Uploaded
- Action buttons per row: View Documents | Approve | Reject

**Screen: Claim Detail View (Approver)**

Sections:
- Customer Info: name, phone, email, device model, IMEI/serial
- Uploaded Documents:
  - 6-side photos (viewable inline or download)
  - Purchase invoice (viewable inline or download)
- IMEI Verification Panel:
  - IMEI entered by customer
  - Match result from verification check
  - Manual override option with reason (for admin only)
- Approval Action Panel:
  - Approve button → enter approved amount → confirm
  - Reject button → mandatory rejection reason dropdown + free text → confirm
- Audit trail: who viewed, when, what action taken

### 24.2 Invoice Approval Panel

**Screen: Invoices Pending Approval**

Layout:
- List view of all claims with status = Invoice Submitted
- Columns: Claim ID, Customer Name, Approved Amount, Invoice Amount, Excess Amount, Submitted On
- Action buttons per row: View Invoice | Approve | Reject

**Screen: Invoice Detail View (Approver)**

Sections:
- Original claim approval details (amount, date)
- Repair invoice upload (viewable inline)
- Excess payment screenshot (if uploaded)
- Variance check: approved amount vs invoice amount (auto-calculated)
- Approval Action Panel:
  - Approve button → confirm
  - Reject button → mandatory rejection reason → confirm
- Audit trail

### 24.3 Role Access

- Only Backend Approver role can access these panels
- Admin can view but action is logged separately
- Customer cannot access these panels

---

## 25. RE-UPLOAD FLOW AFTER REJECTION

When a claim or invoice is rejected, the re-upload flow must follow these rules.

### 25.1 Claim Re-upload (after initial rejection)

- Same claim ID is retained — do not create a new claim
- Claim status reverts to: Re-upload Pending
- Customer receives notification with rejection reason
- Customer logs in → navigates to existing claim → sees rejection reason banner
- Re-upload section is enabled with:
  - Upload 6-side photos (replaces previous upload)
  - Upload purchase invoice (replaces previous upload)
  - Submit button
- On re-submit:
  - Status changes to: Approval Pending (again)
  - Previous rejected documents are archived (not deleted) for audit
  - Backend team notified: "Claim Re-submitted – Pending Re-verification"
- Maximum re-upload attempts: 3
  - After 3 rejections, claim is locked and escalated to Admin
  - Admin can override and unlock or permanently reject

### 25.2 Invoice Re-upload (after invoice rejection)

- Same claim ID retained
- Invoice status reverts to: Invoice Re-upload Pending
- Customer notified with invoice rejection reason
- Customer navigates to claim → Invoice tab → sees rejection reason
- Re-upload section enabled for:
  - Final repair invoice
  - Excess payment screenshot
- On re-submit:
  - Status changes to: Invoice Submitted (again)
  - Previous invoice archived for audit
  - Backend team notified: "Invoice Re-submitted – Pending Re-verification"
- Maximum re-upload attempts: 3 (same escalation rule applies)

### 25.3 DB Impact for Re-upload

- Do not overwrite existing document records
- Insert new document record with version number (v1, v2, v3)
- Track: uploaded_by, uploaded_at, is_current (boolean), version_number
- `claim_documents` table must support versioned uploads

### 25.4 Added Status Values

- Re-upload Pending (after claim rejection)
- Invoice Re-upload Pending (after invoice rejection)

Add to status flow:
```text
Rejected → Re-upload Pending → Approval Pending → ...
Invoice Rejected → Invoice Re-upload Pending → Invoice Submitted → ...
```

---

## 26. IMEI / SERIAL NUMBER VALIDATION

### 26.1 Validation Approach

IMEI/serial validation during initial claim verification is a manual-assisted check with optional automation.

**Phase 1 (Manual):**
- Customer enters IMEI/serial number during claim initiation
- System stores this value in `claims.imei_number`
- Backend approver manually verifies IMEI against the uploaded purchase invoice
- Approver marks: Matched / Not Matched in the approval panel
- If not matched: reject claim with reason "IMEI mismatch"

**Phase 2 (Automated – future scope):**
- Integrate with GSMA IMEI database or internal device registry API
- On claim submission, auto-call IMEI check API
- Return: valid/invalid/stolen flag
- Display result to approver as advisory (not blocking — approver retains final decision)
- If stolen device flag returned: auto-reject with reason, alert admin

### 26.2 IMEI Field Rules

- Field: 15-digit numeric for IMEI, alphanumeric for serial number
- Validate format on frontend before submission
- Store both raw input and normalized value in DB
- IMEI is mandatory for mobile devices
- Serial number is mandatory for non-IMEI devices (tablets, laptops, accessories)

### 26.3 DB Fields

Add to `claims` table:
- `imei_number` — varchar(20)
- `serial_number` — varchar(50)
- `imei_verified` — boolean, default false
- `imei_verified_by` — FK to users
- `imei_verified_at` — timestamp
- `imei_verification_note` — text (approver's note)

### 26.4 Regression Note

- Existing service requests do not require IMEI — these fields must be nullable
- IMEI fields only applicable when `request_type = CASHLESS_CLAIM`

---

## 27. EXCESS PAYMENT RULES

### 27.1 Definition

Excess payment is the amount paid by the customer when the actual repair cost exceeds the insurance-approved amount.

```text
Excess Amount = Actual Repair Invoice Amount − Approved Insurance Amount
```

If Excess Amount <= 0: no excess payment required, screenshot upload is optional.
If Excess Amount > 0: customer must upload payment proof.

### 27.2 Business Rules

- Approved amount is set during initial claim verification (step 2)
- Stored in `claims.approved_amount`
- Actual repair invoice amount is submitted post-repair (step 5)
- Stored in `invoice_verification.invoice_amount`
- System auto-calculates: `excess_amount = invoice_amount - approved_amount`
- If `excess_amount > 0`:
  - Excess payment screenshot upload becomes mandatory before invoice submission
  - System blocks invoice submission if screenshot not uploaded
- If `excess_amount <= 0`:
  - Excess payment upload field shown but marked optional
  - No blocking

### 27.3 Approval Thresholds

- If invoice amount is within 10% above approved amount: backend approver can approve directly
- If invoice amount exceeds approved amount by more than 10%: requires Admin approval before proceeding
- These thresholds are configurable in Settings

### 27.4 DB Fields

Add to `invoice_verification` table:
- `invoice_amount` — decimal(10,2)
- `approved_amount` — decimal(10,2) (copied from claim at time of invoice submission)
- `excess_amount` — decimal(10,2) (computed, stored for audit)
- `excess_proof_uploaded` — boolean
- `excess_proof_url` — varchar(500)
- `approval_threshold_breached` — boolean
- `admin_approval_required` — boolean
- `admin_approved_by` — FK to users
- `admin_approved_at` — timestamp
