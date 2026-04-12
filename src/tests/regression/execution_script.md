# Regression Test Execution Guide

> This guide walks you through running regression tests step by step.
> Every command is copy-paste ready. Follow top to bottom for your first run.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [One-Time Browser Setup](#2-one-time-browser-setup)
3. [Start Local Application](#3-start-local-application-skip-if-running-on-uat)
4. [Open Git Bash Terminal](#4-open-git-bash-terminal)
5. [Navigate to the Framework Folder](#5-navigate-to-the-framework-folder)
6. [Choose What to Run](#6-choose-what-to-run)
   - [Option A — All Specs Together](#option-a--run-all-specs-together)
   - [Option B — Single Spec](#option-b--run-a-single-spec)
   - [Option C — By Tag Shortcut](#option-c--run-by-tag-shortcut)
   - [Option D — Specific Browser](#option-d--run-on-a-specific-browser)
7. [View Reports](#7-view-reports)
8. [Spec File Reference](#8-spec-file-reference)
9. [Browser Reference](#9-browser-reference)
10. [Environment Reference](#10-environment-reference)
11. [Application URLs](#11-application-urls)
12. [Credentials](#12-credentials)
13. [Tips & Notes](#13-tips--notes)

---

## 1. Prerequisites

Before running tests, make sure the following are ready:

| Requirement | How to Verify |
|---|---|
| Node.js installed | Run `node -v` in terminal — should show v18 or higher |
| Java installed (for backend) | Run `java -version` — should show Java 17 or higher |
| Dependencies installed | Run `npm install` inside the framework folder once |
| Browsers installed | See [Section 2](#2-one-time-browser-setup) below |
| Git Bash available | Available in VSCode terminal dropdown |
| App is running | **Local:** start backend + frontend first (see Section 3). **UAT:** always available, skip Section 3 |

---

## 2. One-Time Browser Setup

Run these commands **once** to install all required browsers.
Open any terminal and run from the framework folder:

```bash
cd "d:/Test Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/Advance-Playwright-Framework-Testing"
```

Then install browsers:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
npx playwright install msedge
```

> `mobile-chrome` uses Chromium and `mobile-safari` uses WebKit — no separate install needed for those.

---

## 3. Start Local Application *(Skip if running on UAT)*

> If you are running tests against **UAT**, skip this section entirely — UAT is always live.
> If you are running tests against **Local**, you must start both the backend and frontend before running any test.

---

### Step 3.1 — Create the Local .env File (First Time Only)

The framework needs a `.env` file to connect to the local app.
This is a one-time step — skip if `.env` already exists in the framework folder.

1. Open Git Bash and navigate to the framework folder:
```bash
cd "d:/Test Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/Advance-Playwright-Framework-Testing"
```

2. Copy the example file to create your local `.env`:
```bash
cp .env.example .env
```

3. Verify the `.env` file looks like this (default values are correct for local):
```
BASE_URL=http://127.0.0.1:5173
API_BASE_URL=http://127.0.0.1:8081/api
HEADLESS=true
DEFAULT_TIMEOUT_MS=30000
EXPECT_TIMEOUT_MS=10000
API_TIMEOUT_MS=15000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123
PICKUP_USERNAME=pickup
PICKUP_PASSWORD=Admin@123
```

> No changes needed — the default values match the local backend and frontend ports.

---

### Step 3.2 — Start the Backend

Open a **new Git Bash terminal** (keep it open while testing).

Navigate to the backend folder:
```bash
cd "d:/Test Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/backend"
```

Start the backend using the pre-built JAR:
```bash
java -jar target/gadget-seva-hub-0.0.1-SNAPSHOT.jar
```

**Verify the backend is running** — wait for this line in the terminal output:
```
Started GadgetSevaHubApplication in X.XXX seconds
```

The backend runs on: `http://127.0.0.1:8081`

> If the JAR is missing or outdated, rebuild it first:
> ```bash
> ./mvnw clean package -DskipTests
> ```

---

### Step 3.3 — Start the Frontend

Open **another new Git Bash terminal** (keep it open while testing).

Navigate to the frontend folder:
```bash
cd "d:/Test Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/frontend"
```

Start the frontend dev server:
```bash
npm run dev
```

**Verify the frontend is running** — wait for this output:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://127.0.0.1:5173/
```

Open your browser and go to `http://127.0.0.1:5173/login` — the login page should appear.

---

### Step 3.4 — Verify Both Are Up Before Running Tests

| Service | URL to Check | Expected |
|---|---|---|
| Backend | `http://127.0.0.1:8081/api/health` or any API call | Returns JSON (not connection error) |
| Frontend | `http://127.0.0.1:5173/login` | Login page loads |

> Once both are running, proceed to Section 4 to open a Git Bash terminal for running tests.
> Keep the backend and frontend terminals open throughout your test session.

---

## 4. Open Git Bash Terminal

> **Always use Git Bash** — PowerShell does NOT support the `ENV_FILE=` syntax used in UAT commands.
> Open a **separate** Git Bash terminal for running tests — do not use the backend or frontend terminals.

**Steps:**

1. Open **VSCode**
2. Go to **Terminal** menu at the top → click **New Terminal**
   *(or press `Ctrl + backtick`)*
3. In the terminal panel, click the **`+` dropdown arrow** (top-right corner of the terminal)
4. Select **Git Bash** from the list

You should see a terminal prompt ending with `$`.

---

## 5. Navigate to the Framework Folder

Copy and paste this into Git Bash:

```bash
cd "d:/Test Abhishek/AI_Frameworl/local/gadget-seva-hub/gadget-seva-hub/Advance-Playwright-Framework-Testing"
```

**Verify** — the terminal prompt should show:
```
.../Advance-Playwright-Framework-Testing (main)
```

> All test commands must be run from this folder. If you see errors like "Missing script", you are in the wrong folder.

---

## 6. Choose What to Run

Pick one of the four options below based on what you want to execute.

---

### Option A — Run All Specs Together

Runs all 19 regression spec files in one go.

**On UAT:**
```bash
ENV_FILE=.env.uat node scripts/run-with-reports.mjs \
  src/tests/regression/00-dashboard.regression.spec.ts \
  src/tests/regression/01-service-requests.regression.spec.ts \
  src/tests/regression/02-pickup-management.regression.spec.ts \
  src/tests/regression/03-hub-operations.regression.spec.ts \
  src/tests/regression/04-service-center.regression.spec.ts \
  src/tests/regression/05-estimates-and-cashless.regression.spec.ts \
  src/tests/regression/06-quality-check.regression.spec.ts \
  src/tests/regression/07-delivery.regression.spec.ts \
  src/tests/regression/08-billing.regression.spec.ts \
  src/tests/regression/09a-notifications.regression.spec.ts \
  src/tests/regression/09b-users.regression.spec.ts \
  src/tests/regression/09c-reports.regression.spec.ts \
  src/tests/regression/09d-settings.regression.spec.ts \
  src/tests/regression/09e-audit.regression.spec.ts \
  src/tests/regression/10-full-workflow.regression.spec.ts \
  src/tests/regression/11-runner-inbox.regression.spec.ts \
  src/tests/regression/12-pickup-agent-workspace.regression.spec.ts \
  src/tests/regression/09f-documents.regression.spec.ts \
  src/tests/regression/13-cashless-claim-module.regression.spec.ts
```

**On Local:**
```bash
node scripts/run-with-reports.mjs \
  src/tests/regression/00-dashboard.regression.spec.ts \
  src/tests/regression/01-service-requests.regression.spec.ts \
  src/tests/regression/02-pickup-management.regression.spec.ts \
  src/tests/regression/03-hub-operations.regression.spec.ts \
  src/tests/regression/04-service-center.regression.spec.ts \
  src/tests/regression/05-estimates-and-cashless.regression.spec.ts \
  src/tests/regression/06-quality-check.regression.spec.ts \
  src/tests/regression/07-delivery.regression.spec.ts \
  src/tests/regression/08-billing.regression.spec.ts \
  src/tests/regression/09a-notifications.regression.spec.ts \
  src/tests/regression/09b-users.regression.spec.ts \
  src/tests/regression/09c-reports.regression.spec.ts \
  src/tests/regression/09d-settings.regression.spec.ts \
  src/tests/regression/09e-audit.regression.spec.ts \
  src/tests/regression/10-full-workflow.regression.spec.ts \
  src/tests/regression/11-runner-inbox.regression.spec.ts \
  src/tests/regression/12-pickup-agent-workspace.regression.spec.ts \
  src/tests/regression/09f-documents.regression.spec.ts \
  src/tests/regression/13-cashless-claim-module.regression.spec.ts
```

---

### Option B — Run a Single Spec

Use this when you want to test one module at a time.

**On UAT** — pick the spec you want:
```bash
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/00-dashboard.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/01-service-requests.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/02-pickup-management.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/03-hub-operations.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/04-service-center.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/05-estimates-and-cashless.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/06-quality-check.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/07-delivery.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/08-billing.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/09a-notifications.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/09b-users.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/09c-reports.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/09d-settings.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/09e-audit.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/10-full-workflow.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/11-runner-inbox.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/12-pickup-agent-workspace.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/09f-documents.regression.spec.ts
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/13-cashless-claim-module.regression.spec.ts
```

**On Local** — pick the spec you want:
```bash
node scripts/run-with-reports.mjs src/tests/regression/00-dashboard.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/01-service-requests.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/02-pickup-management.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/03-hub-operations.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/04-service-center.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/05-estimates-and-cashless.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/06-quality-check.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/07-delivery.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/08-billing.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/09a-notifications.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/09b-users.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/09c-reports.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/09d-settings.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/09e-audit.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/10-full-workflow.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/11-runner-inbox.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/12-pickup-agent-workspace.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/09f-documents.regression.spec.ts
node scripts/run-with-reports.mjs src/tests/regression/13-cashless-claim-module.regression.spec.ts
```

---

### Option C — Run by Tag Shortcut

Use npm scripts to run by test tag. Quickest option for full runs.

**On UAT:**
```bash
npm run test:uat:regression   # All @Regression tagged tests
npm run test:uat:smoke        # All @Smoke tagged tests
npm run test:uat              # All tests (every tag)
```

**On Local:**
```bash
npm run test:regression       # All @Regression tagged tests
npm run test:smoke            # All @Smoke tagged tests
npm test                      # All tests (every tag)
```

---

### Option D — Run on a Specific Browser

Add `--project=<name>` to the end of any command from Option A, B, or E to target a single browser.

**Available browsers:**

| `--project` value | Browser | Type |
|---|---|---|
| `chromium` | Google Chrome | Desktop |
| `firefox` | Mozilla Firefox | Desktop |
| `webkit` | Apple Safari | Desktop |
| `mobile-chrome` | Chrome on Pixel 5 | Mobile |
| `edge` | Microsoft Edge | Desktop |
| `mobile-safari` | Safari on iPhone 12 | Mobile |

> By default (no `--project`), tests run across **all 6 browsers**.

---

**Examples — Single Spec on a Specific Browser:**

On UAT — Dashboard on Edge:
```bash
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/00-dashboard.regression.spec.ts --project=edge
```

On UAT — Dashboard on Mobile Safari:
```bash
ENV_FILE=.env.uat node scripts/run-with-reports.mjs src/tests/regression/00-dashboard.regression.spec.ts --project=mobile-safari
```

On Local — Dashboard on Edge:
```bash
node scripts/run-with-reports.mjs src/tests/regression/00-dashboard.regression.spec.ts --project=edge
```

On Local — Dashboard on Mobile Safari:
```bash
node scripts/run-with-reports.mjs src/tests/regression/00-dashboard.regression.spec.ts --project=mobile-safari
```

---

**Examples — All Specs on a Specific Browser:**

On UAT — All specs on Edge only:
```bash
ENV_FILE=.env.uat node scripts/run-with-reports.mjs \
  src/tests/regression/00-dashboard.regression.spec.ts \
  src/tests/regression/01-service-requests.regression.spec.ts \
  src/tests/regression/02-pickup-management.regression.spec.ts \
  src/tests/regression/03-hub-operations.regression.spec.ts \
  src/tests/regression/04-service-center.regression.spec.ts \
  src/tests/regression/05-estimates-and-cashless.regression.spec.ts \
  src/tests/regression/06-quality-check.regression.spec.ts \
  src/tests/regression/07-delivery.regression.spec.ts \
  src/tests/regression/08-billing.regression.spec.ts \
  src/tests/regression/09a-notifications.regression.spec.ts \
  src/tests/regression/09b-users.regression.spec.ts \
  src/tests/regression/09c-reports.regression.spec.ts \
  src/tests/regression/09d-settings.regression.spec.ts \
  src/tests/regression/09e-audit.regression.spec.ts \
  src/tests/regression/10-full-workflow.regression.spec.ts \
  src/tests/regression/11-runner-inbox.regression.spec.ts \
  src/tests/regression/12-pickup-agent-workspace.regression.spec.ts \
  src/tests/regression/09f-documents.regression.spec.ts \
  --project=edge
```

On UAT — All specs on Mobile Safari only:
```bash
ENV_FILE=.env.uat node scripts/run-with-reports.mjs \
  src/tests/regression/00-dashboard.regression.spec.ts \
  src/tests/regression/01-service-requests.regression.spec.ts \
  src/tests/regression/02-pickup-management.regression.spec.ts \
  src/tests/regression/03-hub-operations.regression.spec.ts \
  src/tests/regression/04-service-center.regression.spec.ts \
  src/tests/regression/05-estimates-and-cashless.regression.spec.ts \
  src/tests/regression/06-quality-check.regression.spec.ts \
  src/tests/regression/07-delivery.regression.spec.ts \
  src/tests/regression/08-billing.regression.spec.ts \
  src/tests/regression/09a-notifications.regression.spec.ts \
  src/tests/regression/09b-users.regression.spec.ts \
  src/tests/regression/09c-reports.regression.spec.ts \
  src/tests/regression/09d-settings.regression.spec.ts \
  src/tests/regression/09e-audit.regression.spec.ts \
  src/tests/regression/10-full-workflow.regression.spec.ts \
  src/tests/regression/11-runner-inbox.regression.spec.ts \
  src/tests/regression/12-pickup-agent-workspace.regression.spec.ts \
  src/tests/regression/09f-documents.regression.spec.ts \
  --project=mobile-safari
```

---

### Option E — Run a Single Describe Block (Class-Level)

Use `--grep` to run one specific describe block within a spec file — useful when you only want to re-run one section after a failure.

**Syntax:**
```bash
npx playwright test <spec-file> --grep "<describe-block-title>" --project=chromium
```

> Use `node scripts/run-with-reports.mjs` if you also want the HTML/Allure reports to open. Use `npx playwright test` directly for a quick targeted run without reports.

---

**Cashless Claim Module — Individual Describe Blocks:**

```bash
# Navigation only
npx playwright test src/tests/regression/13-cashless-claim-module.regression.spec.ts \
  --grep "Navigation" --project=chromium

# Full Lifecycle (API)
npx playwright test src/tests/regression/13-cashless-claim-module.regression.spec.ts \
  --grep "Full Lifecycle" --project=chromium

# Rejection flow
npx playwright test src/tests/regression/13-cashless-claim-module.regression.spec.ts \
  --grep "Rejection" --project=chromium

# Invoice threshold checks
npx playwright test src/tests/regression/13-cashless-claim-module.regression.spec.ts \
  --grep "Invoice Threshold" --project=chromium

# UI queue visibility
npx playwright test src/tests/regression/13-cashless-claim-module.regression.spec.ts \
  --grep "UI Queues" --project=chromium

# Backward compatibility
npx playwright test src/tests/regression/13-cashless-claim-module.regression.spec.ts \
  --grep "Backward Compatibility" --project=chromium

# All 16 tests in the cashless claim module (Chromium only)
npx playwright test src/tests/regression/13-cashless-claim-module.regression.spec.ts \
  --project=chromium
```

---

**Other Spec Files — Describe Block Examples:**

```bash
# Dashboard spec — all describe blocks
npx playwright test src/tests/regression/00-dashboard.regression.spec.ts --project=chromium

# Service Requests — run only "Navigation" tests
npx playwright test src/tests/regression/01-service-requests.regression.spec.ts \
  --grep "Navigation" --project=chromium

# Documents — API tests only
npx playwright test src/tests/regression/09f-documents.regression.spec.ts \
  --grep "API" --project=chromium
```

> `--grep` matches against the full test title which includes the describe block name. Partial strings work — `"Navigation"` matches any test whose title contains "Navigation".

---

## 7. View Reports

Reports open **automatically** in your browser after every run.

| Report | Opens At |
|---|---|
| Playwright HTML Report | `http://localhost:9323` |
| Allure Report | Opens in browser automatically |
| Dashboard Report | Opens in browser automatically |

**Report folder locations** (for manual access or Netlify deploy):

| Report | Folder |
|---|---|
| Playwright HTML | `Report\playwright` |
| Allure | `Report\allure` |
| Dashboard | `Report\dashboard` |
| Test Results + Videos | `Report\test-results` |

> Old reports and videos are **deleted automatically** before each new run.

---

## 8. Spec File Reference

| # | Spec File | Module | What Is Tested |
|---|---|---|---|
| 00 | `00-dashboard.regression.spec.ts` | Dashboard | Overview, SLA/TAT, Recent Activities, Alerts & Escalations |
| 01 | `01-service-requests.regression.spec.ts` | Service Requests | Create, All, Open, In Progress, Closed, Cancelled, Search |
| 02 | `02-pickup-management.regression.spec.ts` | Pickup Management | Pickup Dashboard, Runner Onboarding, Assign, Pending, Picked Up, Failed, History |
| 03 | `03-hub-operations.regression.spec.ts` | Hub Operations | Device Received, Pending Verification, Send to SC, Inward Register, Hub Inventory |
| 04 | `04-service-center.regression.spec.ts` | Service Center | Inspection, Estimate Pending, Estimate Submitted, Under Repair, Repair Completed, Total Loss |
| 05 | `05-estimates-and-cashless.regression.spec.ts` | Estimates & Cashless | New, Awaiting Approval, Approved, Rejected, History, Approval Queue, Pending Photos |
| 06 | `06-quality-check.regression.spec.ts` | Quality Check | Pending QC, QC Passed, QC Failed, Rework Required |
| 07 | `07-delivery.regression.spec.ts` | Delivery | Assign, Ready for Dispatch, Out for Delivery, Delivered, Failed, History |
| 08 | `08-billing.regression.spec.ts` | Billing | Generate Invoice, Pending, Reconciliation, Paid, Refunds, Reports |
| 09a | `09a-notifications.regression.spec.ts` | Notifications | SMS Logs, Email Logs, Failed Notifications, Templates |
| 09b | `09b-users.regression.spec.ts` | Users | Admin Users, Delivery Executives, Hub Operators, SC Users, Customers, Roles & Permissions |
| 09c | `09c-reports.regression.spec.ts` | Reports | Request, Pickup, Repair, Delivery, SLA/TAT, Revenue, Audit Logs |
| 09d | `09d-settings.regression.spec.ts` | Settings | Status Config, Notification Settings, SLA Config, File Storage, System Preferences |
| 09e | `09e-audit.regression.spec.ts` | Audit | Activity Logs, Status History, User Actions, Change Logs |
| 09f | `09f-documents.regression.spec.ts` | Documents | Navigation, upload form, API upload/list/filter/delete, signed URL access, UI upload + category filter |
| 10 | `10-full-workflow.regression.spec.ts` | Full Workflow | End-to-end claim lifecycle (API + UI) |
| 11 | `11-runner-inbox.regression.spec.ts` | Runner Inbox | Runner app, pickup portal, reassignment flow |
| 12 | `12-pickup-agent-workspace.regression.spec.ts` | Pickup Agent Workspace | All tabs visible to PICKUP_AGENT role (Dashboard, Service Requests, Pickup Management) |
| 13 | `13-cashless-claim-module.regression.spec.ts` | Cashless Claim Module | Navigation (Claims/Invoice Verification/Insurance Submission tabs), Full Lifecycle API, Rejection flow, Invoice threshold, UI queue visibility, Backward compatibility |

---

## 9. Browser Reference

| Project Name | Browser | Device | Install Command |
|---|---|---|---|
| `chromium` | Google Chrome | Desktop | `npx playwright install chromium` |
| `firefox` | Mozilla Firefox | Desktop | `npx playwright install firefox` |
| `webkit` | Apple Safari | Desktop | `npx playwright install webkit` |
| `mobile-chrome` | Chrome | Pixel 5 (mobile) | Uses Chromium — no extra install |
| `edge` | Microsoft Edge | Desktop | `npx playwright install msedge` |
| `mobile-safari` | Apple Safari | iPhone 12 (mobile) | Uses WebKit — no extra install |

---

## 10. Environment Reference

| Setting | UAT | Local |
|---|---|---|
| Frontend URL | `https://front-end-uat.up.bneded)* |

---

## 11. Application URLs

### UAT

| Page | URL |
|---|---|
| Login | `https://front-end-uat.up.railway.app/login` |
| Dashboard | `https://front-end-uat.up.railway.app/` |
| Open Claims Queue | `https://front-end-uat.up.railway.app/workspace/service-requests/open-requests` |
| Create Request | `https://front-end-uat.up.railway.app/workspace/service-requests/create-request` |
| Pickup Dashboard | `https://front-end-uat.up.railway.app/workspace/pickup-management/pickup-dashboard` |
| Runner Onboarding | `https://front-end-uat.up.railway.app/workspace/pickup-management/runner-onboarding` |
| Assign Pickup | `https://front-end-uat.up.railway.app/workspace/pickup-management/assign-pickup` |
| Runner Inbox | `https://front-end-uat.up.railway.app/runner-app` |
| Runner Access Portal | `https://front-end-uat.up.railway.app/runner-access/:token` |

### Local

| Page | URL |
|---|---|
| Login | `http://127.0.0.1:5173/login` |
| Dashboard | `http://127.0.0.1:5173/` |
| Runner Inbox | `http://127.0.0.1:5173/runner-app` |
| Runner Access Portal | `http://127.0.0.1:5173/runner-access/:token` |

---

## 12. Credentials

### Admin User

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `Admin@123` |
| Role | `ADMIN` |
| Full Name | System Administrator |

### Pickup Runner User

| Field | Value |
|---|---|
| Username | `pickup` |
| Password | `Admin@123` |
| Role | `PICKUP_AGENT` |
| Full Name | Vishal Babar |
| Phone | `9999999994` |

---

## 13. Tips & Notes

| Topic | Details |
|---|---|
| Terminal | Always use **Git Bash** — PowerShell does not support `ENV_FILE=` syntax |
| Wrong folder error | If you see `Missing script`, `cd` into `Advance-Playwright-Framework-Testing` first |
| Reports | Open automatically after every run — no manual step needed |
| Old data cleanup | Old reports and videos are deleted automatically before each new run |
| Video recording | Every test records a video at **1280×720** resolution |
| Browsers default | Without `--project`, tests run on all **6 browsers** simultaneously |
| Edge not found | Run `npx playwright install msedge` once if Edge fails to launch |
| Local app | For local runs, start the frontend (`npm run dev`) and backend before executing |
| UAT app | UAT is always live — no local app startup needed |
| Parallel execution | Tests run in parallel by default — do not manually limit workers unless needed |
