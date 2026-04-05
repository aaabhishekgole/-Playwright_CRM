# Admin User Flow — Gadget Seva Hub

> **Role:** ADMIN  
> **Access:** Full platform access — all modules, all tabs  
> **Login URL (UAT):** https://front-end-uat.up.railway.app/login  
> **Login URL (Local):** http://127.0.0.1:5173/login  
> **Credentials:** Username: `admin` | Password: `Admin@123`

---

## Table of Contents

1. [Login & Dashboard](#1-login--dashboard)
2. [Create a Service Request](#2-create-a-service-request)
3. [Manage Service Requests](#3-manage-service-requests)
4. [Pickup Management](#4-pickup-management)
5. [Hub Operations](#5-hub-operations)
6. [Service Center](#6-service-center)
7. [Estimates & Cashless](#7-estimates--cashless)
8. [Quality Check](#8-quality-check)
9. [Delivery](#9-delivery)
10. [Billing](#10-billing)
11. [Notifications](#11-notifications)
12. [User Management](#12-user-management)
13. [Reports](#13-reports)
14. [Settings](#14-settings)
15. [Audit](#15-audit)
16. [End-to-End Workflow Summary](#16-end-to-end-workflow-summary)

---

## 1. Login & Dashboard

### How to Login
1. Open the application URL in your browser
2. Enter **Username:** `admin`
3. Enter **Password:** `Admin@123`
4. Click **Login**
5. You are redirected to the **Dashboard Overview**

### Dashboard Overview
After login, the dashboard shows a real-time operational snapshot:

| Tab | What You See |
|---|---|
| **Overview** | KPI summary — total requests, pending pickups, repairs in progress, deliveries |
| **SLA / TAT Summary** | Breach monitoring — requests exceeding turnaround time |
| **Recent Activities** | Latest actions taken across the platform by all users |
| **Alerts & Escalations** | Critical issues, aging requests, SLA breach alerts |

> **Tip:** Use Alerts & Escalations daily to catch stuck or overdue requests early.

---

## 2. Create a Service Request

A service request is raised when a customer submits a device repair claim.

### Steps
1. Go to **Service Requests → Create Request** from the left menu
2. Fill in the claim registration form:
   - Customer name, phone, email
   - Device make, model, IMEI
   - Issue summary (what the customer reported)
   - Pickup address
   - Insurance or cashless claim details (if applicable)
3. Click **Submit**
4. The request is created with status **`CLAIM_REGISTERED`**
5. Note the **Request Number** (e.g., `GSH-20240001`) — this tracks the case end to end

### After Creation
- The request appears in **All Requests** and **Open Requests**
- It is now ready for pickup assignment

---

## 3. Manage Service Requests

### Tabs Available

| Tab | Purpose |
|---|---|
| **All Requests** | Complete list of every request regardless of status |
| **Open Requests** | Active requests not yet closed |
| **In Progress** | Requests currently under repair or pickup |
| **Closed Requests** | Completed and resolved requests |
| **Cancelled Requests** | Voided or cancelled claims |
| **Search Request** | Search by request number or partner reference |

### How to Search a Request
1. Go to **Service Requests → Search Request**
2. Enter the request number or customer phone
3. Click the request to open its full detail view
4. From the detail view you can:
   - See full timeline (status history)
   - View attached photos
   - Check payment and invoice status
   - Manually transition status (if needed)

---

## 4. Pickup Management

Pickup management covers scheduling and tracking device collection from the customer.

### 4.1 Onboard a Pickup Runner

Before you can assign pickups, at least one pickup runner must be onboarded.

1. Go to **Pickup Management → Runner Onboarding**
2. Click **Add Runner**
3. Fill in runner details:
   - Full name
   - Username and password
   - Phone number
   - Vehicle details (optional)
4. Click **Save**
5. The runner is now active and available for assignment

### 4.2 Assign a Pickup

1. Go to **Pickup Management → Assign Pickup**
2. Find the request with status **`CLAIM_REGISTERED`**
3. Click **Assign** against the request
4. Select:
   - **Pickup Runner** (from the active runner list)
   - **Scheduled Date & Time**
   - **Notes** (optional instructions for the runner)
   - **Pickup OTP** (pre-filled or enter a 4-digit code)
5. Click **Confirm Assignment**
6. Request status changes to **`PICKUP_ASSIGNED`**
7. The runner receives a **notification** and a **portal link** to execute the pickup

### 4.3 Monitor Pickup Status

| Tab | Status Shown |
|---|---|
| **Pickup Dashboard** | Stage-wise count of all pickups |
| **Pending Pickup** | Assigned, awaiting runner action |
| **Picked Up Devices** | Devices collected and in transit to hub |
| **Pickup Failed Cases** | Rescheduled or failed pickup attempts |
| **Pickup History** | All completed pickups (archived) |

### 4.4 Reassign a Failed Pickup
1. Go to **Pickup Failed Cases**
2. Find the request
3. Click **Reassign**
4. Choose a new runner or new scheduled time
5. Confirm — request goes back to **`PICKUP_ASSIGNED`**

---

## 5. Hub Operations

After the device is picked up, the runner delivers it to the hub. Admin or hub operator processes it here.

### Steps

| Step | Tab | Action |
|---|---|---|
| 1 | **Device Received at Hub** | Mark the device as physically received. Enter IMEI scan / QR code |
| 2 | **Pending Verification** | Verify IMEI, packaging condition, accessories |
| 3 | **Send to Service Center** | Select the service center and dispatch the device |
| 4 | **Inward Register** | View log of all inwarded devices |
| 5 | **Hub Inventory** | Devices currently waiting in the hub |

### How to Inward a Device
1. Go to **Hub Operations → Device Received at Hub**
2. Find the request by number or scan barcode
3. Click **Mark Received**
4. Confirm the device details
5. Status changes to **`RECEIVED_AT_HUB`**

### How to Send to Service Center
1. Go to **Hub Operations → Send to Service Center**
2. Select the request
3. Choose the service center from the dropdown
4. Click **Dispatch**
5. Status changes to **`SENT_TO_SERVICE_CENTER`**

---

## 6. Service Center

The service center handles diagnosis, estimation, and repair.

### Tabs

| Tab | Status | Action |
|---|---|---|
| **Devices Under Inspection** | `DIAGNOSIS_IN_PROGRESS` | Device being diagnosed by technician |
| **Estimate Pending** | Awaiting cost estimate | Technician needs to submit repair estimate |
| **Estimate Submitted** | Estimate ready | Waiting for customer/admin approval |
| **Under Repair** | `REPAIR_IN_PROGRESS` | Repair work in progress |
| **Repair Completed** | `REPAIR_COMPLETED` | Repair done, ready for QC |
| **Total Loss Cases** | `TOTAL_LOSS` | Device beyond repair — write-off decision |

### How to Start Diagnosis
1. Go to **Service Center → Devices Under Inspection**
2. Select the request
3. Click **Start Diagnosis**
4. Status changes to **`DIAGNOSIS_IN_PROGRESS`**

### How to Mark as Total Loss
1. Open the request from **Devices Under Inspection**
2. Click **Mark as Total Loss**
3. Enter reason / remarks
4. Status changes to **`TOTAL_LOSS`**
5. Customer is notified automatically

---

## 7. Estimates & Cashless

### 7.1 Estimates Flow

| Tab | Purpose |
|---|---|
| **New Estimates** | Fresh estimates submitted by repair partners |
| **Awaiting Customer Approval** | Estimate sent to customer, waiting for their decision |
| **Approved Estimates** | Customer approved — repair can begin |
| **Rejected Estimates** | Customer rejected — case needs follow-up |
| **Estimate History** | All past estimates |

### How to Approve an Estimate (Admin override)
1. Go to **Estimates → New Estimates**
2. Open the estimate
3. Review diagnosis summary, parts cost, labour cost, tax
4. Click **Approve** or **Reject**
5. If approved → status changes to **`ESTIMATE_APPROVED`** → repair begins

### 7.2 Cashless Flow

For insurance/cashless claims:

| Tab | Purpose |
|---|---|
| **Approval Queue** | Cases waiting for cashless evidence review |
| **Pending Photos** | Cases missing required device photos (6 device + 4 damage) |
| **Approved Cases** | Cashless approved — ready for repair execution |

### How to Approve a Cashless Case
1. Go to **Cashless → Approval Queue**
2. Open the case
3. Review all uploaded photos (must have full evidence set)
4. Click **Approve Cashless**
5. Case proceeds to repair

---

## 8. Quality Check

After repair is complete, QC validates the work before dispatch.

| Tab | Purpose |
|---|---|
| **Pending QC** | Repairs waiting for quality validation |
| **QC Passed** | Validated — ready for dispatch |
| **QC Failed** | Failed validation — sent back for rework |
| **Rework Required** | Device returned to technician for fix |

### How to Pass QC
1. Go to **Quality Check → Pending QC**
2. Open the request
3. Inspect repair completion details
4. Click **Pass QC**
5. Status changes to **`READY_FOR_DISPATCH`**

### How to Fail QC (Send for Rework)
1. Open the request in **Pending QC**
2. Click **Fail QC**
3. Enter rework reason
4. Status changes to **`REWORK_REQUIRED`**
5. Device goes back to the service center

---

## 9. Delivery

After QC is passed, the device is dispatched back to the customer.

### Steps

| Step | Tab | Action |
|---|---|---|
| 1 | **Assign Delivery** | Select delivery agent and schedule delivery |
| 2 | **Ready for Dispatch** | Device packed and ready to ship |
| 3 | **Out for Delivery** | Delivery agent is en route to customer |
| 4 | **Delivered** | Handover complete |
| 5 | **Delivery Failed** | Customer unavailable — needs reattempt |
| 6 | **Delivery History** | All completed deliveries |

### How to Assign Delivery
1. Go to **Delivery → Assign Delivery**
2. Find the request with status **`READY_FOR_DISPATCH`**
3. Click **Assign**
4. Select **Delivery Agent**, **Scheduled Date/Time**, **OTP Code**
5. Click **Confirm**
6. Status changes to **`OUT_FOR_DELIVERY`**

### How to Mark Delivered
1. Go to **Delivery → Out for Delivery**
2. Open the request
3. Click **Mark Delivered**
4. Confirm customer received the device
5. Status changes to **`DELIVERED`**

---

## 10. Billing

After delivery, billing handles invoice generation and payment.

| Tab | Purpose |
|---|---|
| **Generate Invoice** | Create GST-compliant invoice for completed repairs |
| **Pending Invoices** | Invoices awaiting payment |
| **Payment Reconciliation** | Match UTR entries and reconcile captured payments |
| **Paid Invoices** | Fully settled invoices |
| **Refund Cases** | Partial or full refund requests |
| **Invoice Reports** | Billing analytics and exports |

### How to Generate an Invoice
1. Go to **Billing → Generate Invoice**
2. Find the delivered request
3. Click **Generate Invoice**
4. Fill in:
   - GST billing state
   - Place of supply
   - GST rate (typically 18%)
   - Labour and parts description
5. Click **Generate**
6. Invoice is created and can be downloaded as PDF

### How to Record a Payment
1. Open the request invoice
2. Click **Record Payment**
3. Enter:
   - Payment reference number
   - Amount
   - Payment method (UPI / Bank Transfer / Cash)
   - UTR number (for reconciliation)
4. Click **Save**

### How to Process a Refund
1. Go to **Billing → Refund Cases**
2. Select the payment to refund
3. Enter refund amount and reason
4. Click **Process Refund**

---

## 11. Notifications

| Tab | Purpose |
|---|---|
| **SMS Logs** | History of all SMS sent to customers and runners |
| **Email Logs** | History of all emails sent |
| **Failed Notifications** | Messages that failed delivery — retry from here |
| **Templates** | View and manage notification message templates |

### How to Retry a Failed Notification
1. Go to **Notifications → Failed Notifications**
2. Find the failed message
3. Click **Retry**
4. Status updates to sent

---

## 12. User Management

Manage all platform users from one place.

| Tab | Who You Manage |
|---|---|
| **Admin Users** | Other admin accounts |
| **Delivery Executives** | Delivery agents for device return |
| **Hub Operators** | Staff handling hub inward and dispatch |
| **Service Center Users** | Technicians and SC staff |
| **Customers** | Customer directory and profiles |
| **Roles & Permissions** | Access control matrix for each role |

### How to Add a New User
1. Go to the relevant tab (e.g., **Delivery Executives**)
2. Click **Add User**
3. Enter name, username, password, phone
4. Assign role
5. Click **Save**
6. User can now log in with their credentials

---

## 13. Reports

Generate and export operational reports.

| Report | What It Shows |
|---|---|
| **Request Report** | Intake volumes and request funnel |
| **Pickup Report** | Pickup productivity and aging |
| **Repair Report** | Repair throughput and completion rates |
| **Delivery Report** | Dispatch and delivery completion |
| **SLA / TAT Report** | Breach analysis and turnaround times |
| **Revenue Report** | Collections and billing analytics |
| **Audit Logs** | Enterprise-level change history |

### How to Export a Report
1. Go to **Reports → [Report Name]**
2. Set date range filters
3. Click **Export** or **Download CSV**
4. Report downloads to your browser

---

## 14. Settings

System-wide configuration (Admin only).

| Setting | Purpose |
|---|---|
| **Status Configuration** | Manage workflow states and transitions |
| **Notification Settings** | Configure retry intervals and channels |
| **SLA Configuration** | Define SLA rules and TAT thresholds per request type |
| **File Storage Config** | Configure storage backend and signed URL settings |
| **System Preferences** | Global platform preferences |

---

## 15. Audit

Full audit trail for compliance and investigation.

| Tab | Purpose |
|---|---|
| **Activity Logs** | All user actions across the platform |
| **Status History** | Every status transition for every request |
| **User Actions** | User-level activity drill-down |
| **Change Logs** | Before/after values for every data change |

---

## 16. End-to-End Workflow Summary

This is the complete lifecycle of a single service request from start to finish:

```
Customer submits claim
        │
        ▼
[CLAIM_REGISTERED] ── Admin creates request
        │
        ▼
[PICKUP_ASSIGNED] ── Admin assigns pickup runner + schedules time
        │
        ▼
[PICKUP_ACCEPTED] ── Runner accepts the job
        │
        ▼
[PICKUP_COMPLETED] ── Runner collects device + uploads photos
        │
        ▼
[RECEIVED_AT_HUB] ── Hub staff scans and receives device
        │
        ▼
[SENT_TO_SERVICE_CENTER] ── Hub dispatches to repair partner
        │
        ▼
[DIAGNOSIS_IN_PROGRESS] ── Technician inspects device
        │
        ▼
[ESTIMATE_PREPARED] ── Technician submits repair estimate
        │
        ▼
[ESTIMATE_APPROVED] ── Customer/Admin approves estimate
        │
        ▼
[REPAIR_IN_PROGRESS] ── Repair work begins
        │
        ▼
[REPAIR_COMPLETED] ── Repair done
        │
        ▼
[READY_FOR_DISPATCH] ── QC passed
        │
        ▼
[OUT_FOR_DELIVERY] ── Delivery agent picks up device
        │
        ▼
[DELIVERED] ── Customer receives repaired device
        │
        ▼
[INVOICE_GENERATED] ── Admin generates invoice
        │
        ▼
[PAYMENT_RECEIVED] ── Payment recorded and reconciled
        │
        ▼
        CLOSED ✓
```

### Exception Paths

| Situation | Status | Action |
|---|---|---|
| Customer not available for pickup | `CUSTOMER_RESCHEDULED` | Reassign runner with new slot |
| Runner failed to collect device | `PICKUP_FAILED` | Reassign with new runner |
| Device beyond repair | `TOTAL_LOSS` | Notify customer, close case |
| Estimate rejected by customer | `ESTIMATE_REJECTED` | Follow up or close |
| QC failed | `REWORK_REQUIRED` | Return to service center |
| Delivery failed | `DELIVERY_FAILED` | Reattempt delivery |
