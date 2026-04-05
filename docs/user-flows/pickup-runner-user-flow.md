# Pickup Runner User Flow — Gadget Seva Hub

> **Role:** PICKUP_AGENT  
> **Access:** Runner Inbox (public portal) + Pickup Management workspace tabs  
> **Runner Inbox URL (UAT):** https://front-end-uat.up.railway.app/runner-app  
> **Runner Inbox URL (Local):** http://127.0.0.1:5173/runner-app  
> **Credentials:** Username: `pickup` | Password: `Admin@123`  
> **Phone:** `9999999994`

---

## Table of Contents

1. [Who is a Pickup Runner?](#1-who-is-a-pickup-runner)
2. [How to Get Started](#2-how-to-get-started)
3. [Runner Inbox — Daily Workflow](#3-runner-inbox--daily-workflow)
4. [Executing a Pickup (Step by Step)](#4-executing-a-pickup-step-by-step)
5. [Handling Special Situations](#5-handling-special-situations)
6. [Admin Workspace Access](#6-admin-workspace-access)
7. [Pickup Status Reference](#7-pickup-status-reference)
8. [Full Pickup Flow Diagram](#8-full-pickup-flow-diagram)
9. [Common Questions](#9-common-questions)

---

## 1. Who is a Pickup Runner?

A **Pickup Runner** is a field agent responsible for:
- Collecting devices from customers at their doorstep
- Taking required photos of the device as evidence
- Delivering the collected device to the hub
- Updating pickup status in real time via the Runner Portal

The runner does **not** handle:
- Repair or diagnosis
- Billing or invoices
- Reassigning pickups to other runners
- Managing other users

---

## 2. How to Get Started

### Step 1 — You are Onboarded by Admin
The admin creates your account via **Pickup Management → Runner Onboarding**.  
You receive your **username** and **password** from the admin.

### Step 2 — You Receive a Pickup Assignment
When the admin assigns a pickup request to you:
- You get a **notification** (SMS or in-app)
- The notification contains a **Runner Portal Link** specific to that pickup
- The link looks like: `https://front-end-uat.up.railway.app/runner-access/abc123token`

### Step 3 — Two Ways to Access Your Work

| Access Method | URL | Use Case |
|---|---|---|
| **Runner Inbox** | `/runner-app` | See all your assigned pickups in one place |
| **Runner Portal Link** | `/runner-access/:token` | Direct link to one specific pickup |

---

## 3. Runner Inbox — Daily Workflow

The **Runner Inbox** is your personal dashboard. Use it every day to see all pickups assigned to you.

### How to Open Runner Inbox
1. Open your browser
2. Go to: `https://front-end-uat.up.railway.app/runner-app`
3. Enter your **phone number** (or username) and **password**
4. Click **Sign In**

### What You See in the Inbox

| Section | What It Shows |
|---|---|
| **Assigned to You** | All pickups currently assigned to you |
| **Request Number** | Unique ID of the customer's claim (e.g., `GSH-20240001`) |
| **Customer Name & Address** | Where you need to go |
| **Scheduled Time** | When the pickup is scheduled |
| **Status** | Current state of the pickup |

### Inbox Notifications
- Each new assignment appears as a new card in your inbox
- Click any card to open the full pickup detail and take action

---

## 4. Executing a Pickup (Step by Step)

This is the complete process for collecting a device from a customer.

---

### Step 1 — Accept the Pickup

**When:** Before you travel to the customer's location

1. Open the pickup from your Runner Inbox or the portal link
2. Review the details:
   - Customer name and address
   - Scheduled time
   - Device details (make, model)
   - Admin notes (if any)
3. Click **Accept Pickup**
4. Status changes from `PICKUP_ASSIGNED` → `PICKUP_ACCEPTED`
5. The customer is notified that you are on your way

> **Important:** Always accept the pickup before leaving for the customer's location.

---

### Step 2 — Travel to Customer Location

- Use the address shown in the pickup details
- Arrive at the scheduled time
- If you are going to be late, update the customer via phone (contact number visible in the portal)

---

### Step 3 — Verify the Customer & Device

At the customer's doorstep:
1. Confirm the customer's name matches the request
2. Ask the customer to show the device
3. Verify the device make and model match what was registered
4. Check for any obvious pre-existing damage and note it

---

### Step 4 — Upload Device Photos (Required)

You must upload **10 mandatory photos** before completing the pickup:

| Photo | What to Capture |
|---|---|
| **Front View** | Full front face of the device |
| **Back View** | Full back of the device |
| **Left Side** | Left edge of the device |
| **Right Side** | Right edge of the device |
| **Top View** | Top edge of the device |
| **Bottom View** | Bottom edge of the device |
| **Display ON** | Screen powered on (if possible) |
| **Serial / IMEI Label** | Label showing IMEI or serial number |
| **Damage Close-Up** | Close-up of the reported damage area |
| **Accessories** | All accessories included (charger, case, etc.) |

#### How to Upload Photos
1. Open the pickup in the Runner Portal
2. Scroll to the **Photo Evidence** section
3. Click each photo type
4. Take a photo or upload from gallery
5. Confirm the photo looks clear before saving
6. Repeat for all 10 photo types

> **Important:** All 10 photos must be uploaded before you can complete the pickup.  
> Blurry or incomplete photos may cause delays.

---

### Step 5 — Complete the Pickup

After uploading all photos:
1. Click **Complete Pickup**
2. Confirm the action in the popup
3. Status changes to `PICKUP_COMPLETED`
4. The customer receives a confirmation notification
5. The request moves into the Hub Operations queue

> You are now done with this pickup. Deliver the device to the hub.

---

## 5. Handling Special Situations

### Situation A — Customer Not Available (Reschedule)

If you arrive at the customer's location and they are not available:

1. Open the pickup in the Runner Portal
2. Click **Update Status**
3. Select **Customer Rescheduled**
4. Enter a remark (e.g., "Customer not at home, requested 2pm tomorrow")
5. Click **Save**
6. Status changes to `CUSTOMER_RESCHEDULED`
7. The admin will reassign you with a new scheduled time

---

### Situation B — Pickup Failed (Cannot Collect)

If you are unable to collect the device for another reason:

1. Open the pickup in the Runner Portal
2. Click **Update Status**
3. Select **Pickup Failed**
4. Enter reason (e.g., "Customer refused to hand over device")
5. Click **Save**
6. Status changes to `PICKUP_FAILED`
7. Admin reviews and decides next step

---

### Situation C — Device has Extra Damage

If the device has damage not mentioned in the claim:
1. Take a close-up photo of the additional damage
2. Upload it under **Damage Close-Up**
3. Add a note in the remarks field describing what you observed
4. Continue with the normal pickup flow
5. The service center will be informed via the photos and notes

---

### Situation D — Customer Refuses to Give Accessories

1. Note it in remarks: "Customer retained original charger"
2. Take the **Accessories** photo showing what was received (even if empty)
3. Proceed with pickup normally
4. Hub staff will record what was actually received

---

## 6. Admin Workspace Access

As a Pickup Agent, you also have **read-only access** to certain workspace tabs to monitor pickup activity.

### Login to Admin Workspace
1. Open: `https://front-end-uat.up.railway.app/login`
2. Enter your **username** and **password**
3. You land on the Dashboard

### What You Can Access

#### Dashboard (Read-Only)
| Tab | What You See |
|---|---|
| **Overview** | Platform-wide KPIs (read only) |
| **SLA / TAT Summary** | Turnaround and breach monitoring |
| **Recent Activities** | Latest platform actions |
| **Alerts & Escalations** | Pending issues |

#### Service Requests (Read-Only)
| Tab | What You See |
|---|---|
| **All Requests** | Full request list |
| **Open Requests** | Active requests |
| **In Progress** | Requests under work |
| **Closed Requests** | Completed requests |
| **Search Request** | Find any request by number |

#### Pickup Management (Your Primary Workspace)
| Tab | What You Can Do |
|---|---|
| **Pickup Dashboard** | See stage-wise pickup counts |
| **Pending Pickup** | See all pickups awaiting collection |
| **Picked Up Devices** | Devices you have collected |
| **Pickup Failed Cases** | Failed or rescheduled pickups |
| **Pickup History** | Completed pickup archive |

> **Note:** You cannot assign pickups, onboard runners, or change settings. Those are admin-only functions.

---

## 7. Pickup Status Reference

| Status | Meaning | Who Sets It |
|---|---|---|
| `CLAIM_REGISTERED` | Customer request created | Admin |
| `PICKUP_ASSIGNED` | Pickup assigned to you | Admin |
| `PICKUP_ACCEPTED` | You accepted the pickup | You (Runner Portal) |
| `CUSTOMER_RESCHEDULED` | Customer asked for new time | You (Runner Portal) |
| `PICKUP_FAILED` | Pickup could not be done | You (Runner Portal) |
| `PICKUP_COMPLETED` | Device collected successfully | You (Runner Portal) |
| `RECEIVED_AT_HUB` | Hub confirmed receipt | Hub Staff |

---

## 8. Full Pickup Flow Diagram

```
Admin assigns pickup to you
          │
          ▼
   [PICKUP_ASSIGNED]
   You receive notification + portal link
          │
          ▼
   You accept the pickup
   [PICKUP_ACCEPTED] ◄──────────────────────┐
          │                                  │
          ▼                                  │
   Travel to customer location               │
          │                                  │
          ├──── Customer not available? ─────┤
          │     [CUSTOMER_RESCHEDULED]        │
          │     Admin reassigns with new time ┘
          │
          ├──── Cannot collect device? ──────────►  [PICKUP_FAILED]
          │     Admin reviews, decides next step
          │
          ▼
   Customer present ✓ Device verified ✓
          │
          ▼
   Upload 10 mandatory photos
   (Front, Back, Left, Right, Top, Bottom,
    Display ON, IMEI Label, Damage, Accessories)
          │
          ▼
   Click Complete Pickup
   [PICKUP_COMPLETED] ✓
          │
          ▼
   Deliver device to Hub
          │
          ▼
   Hub staff receives and scans device
   [RECEIVED_AT_HUB]
          │
          ▼
   Your job is done ✓
```

---

## 9. Common Questions

**Q: I lost the portal link. How do I find my pickup?**  
A: Log into the Runner Inbox at `/runner-app` using your phone number and password. All your assigned pickups will be listed there.

---

**Q: Can I accept multiple pickups at once?**  
A: Yes. The admin may assign multiple pickups to you. Each appears as a separate card in your inbox. Accept and complete them one at a time.

---

**Q: What if the customer's device is different from what was registered?**  
A: Do not complete the pickup. Contact the admin immediately. Document the discrepancy in the remarks and take photos of the actual device for evidence.

---

**Q: I uploaded a blurry photo. Can I re-upload?**  
A: Yes. Click the same photo type in the portal and upload a new one. The previous photo will be replaced.

---

**Q: The customer asked me to reschedule for a specific time. What do I enter?**  
A: Select **Customer Rescheduled**, enter the preferred time in the remarks field (e.g., "Customer requests 4pm Saturday"), and save. The admin will see this when reassigning.

---

**Q: The portal link says "Invalid or Expired". What do I do?**  
A: The link may have expired. Log into the Runner Inbox and open the pickup from there. If it still doesn't work, contact the admin to resend a fresh portal link.

---

**Q: I finished the pickup but forgot to upload one photo. Can I still go back?**  
A: Once **Complete Pickup** is confirmed, the pickup is locked. Always verify all 10 photos are uploaded before clicking complete.

---

**Q: How do I know if a pickup was reassigned to me after a failure?**  
A: You will receive a notification. You can also check the Runner Inbox — new assignments appear at the top.
