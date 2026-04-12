/**
 * generate-user-docs.mjs
 * Captures screenshots and workflow videos for every module, then writes
 * a self-contained HTML user manual to UserDocs/user-manual.html
 *
 * Usage:
 *   node scripts/generate-user-docs.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'UserDocs');
const SS_DIR = path.join(OUT_DIR, 'screenshots');
const VID_DIR = path.join(OUT_DIR, 'videos');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8081/api';
const VIEWPORT = { width: 1440, height: 900 };
const NAV_TIMEOUT = 30_000;

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const USERS = [
  { key: 'admin',   username: 'admin',   password: 'Admin@123', role: 'ADMIN',            label: 'Admin (Full Access)' },
  { key: 'backend', username: 'backend', password: 'Admin@123', role: 'BACKEND_TEAM',     label: 'Backend Team' },
  { key: 'support', username: 'support', password: 'Admin@123', role: 'CUSTOMER_SUPPORT', label: 'Customer Support' },
  { key: 'finance', username: 'finance', password: 'Admin@123', role: 'FINANCE',          label: 'Finance' },
  { key: 'mse',     username: 'mse',     password: 'Admin@123', role: 'MSE_TEAM',         label: 'MSE Team' },
];

// ---------------------------------------------------------------------------
// Page map: screenshots to capture (as admin)
// ---------------------------------------------------------------------------
const PAGES = [
  { id: 'login',                   label: 'Login',                       path: '/login',                                      module: 'Login' },
  { id: 'dashboard-overview',      label: 'Dashboard – Overview',        path: '/',                                           module: 'Dashboard' },
  { id: 'dashboard-sla',           label: 'Dashboard – SLA/TAT',         path: '/workspace/dashboard/sla-tat-summary',        module: 'Dashboard' },
  { id: 'dashboard-activities',    label: 'Dashboard – Recent Activities',path: '/workspace/dashboard/recent-activities',     module: 'Dashboard' },
  { id: 'dashboard-alerts',        label: 'Dashboard – Alerts & Escalations', path: '/workspace/dashboard/alerts-escalations', module: 'Dashboard' },
  { id: 'sr-create',               label: 'Service Requests – Create',   path: '/workspace/service-requests/create-request', module: 'Service Requests' },
  { id: 'sr-all',                  label: 'Service Requests – All',      path: '/requests',                                   module: 'Service Requests' },
  { id: 'sr-open',                 label: 'Service Requests – Open',     path: '/workspace/service-requests/open-requests',  module: 'Service Requests' },
  { id: 'sr-inprogress',           label: 'Service Requests – In Progress', path: '/workspace/service-requests/in-progress', module: 'Service Requests' },
  { id: 'sr-closed',               label: 'Service Requests – Closed',   path: '/workspace/service-requests/closed-requests', module: 'Service Requests' },
  { id: 'pickup-dashboard',        label: 'Pickup Management – Dashboard', path: '/workspace/pickup-management/pickup-dashboard', module: 'Pickup Management' },
  { id: 'pickup-runner-onboarding',label: 'Pickup – Runner Onboarding',  path: '/workspace/pickup-management/runner-onboarding', module: 'Pickup Management' },
  { id: 'pickup-assign',           label: 'Pickup – Assign Pickup',      path: '/workspace/pickup-management/assign-pickup', module: 'Pickup Management' },
  { id: 'pickup-pending',          label: 'Pickup – Pending Pickup',     path: '/workspace/pickup-management/pending-pickup', module: 'Pickup Management' },
  { id: 'pickup-pickedup',         label: 'Pickup – Picked Up Devices',  path: '/workspace/pickup-management/picked-up-devices', module: 'Pickup Management' },
  { id: 'pickup-failed',           label: 'Pickup – Failed Cases',       path: '/workspace/pickup-management/pickup-failed-cases', module: 'Pickup Management' },
  { id: 'pickup-history',          label: 'Pickup – History',            path: '/workspace/pickup-management/pickup-history', module: 'Pickup Management' },
  { id: 'hub-received',            label: 'Hub – Device Received',       path: '/workspace/hub-operations/device-received-at-hub', module: 'Hub Operations' },
  { id: 'hub-verification',        label: 'Hub – Pending Verification',  path: '/workspace/hub-operations/pending-verification', module: 'Hub Operations' },
  { id: 'hub-send-sc',             label: 'Hub – Send to Service Center',path: '/workspace/hub-operations/send-to-service-center', module: 'Hub Operations' },
  { id: 'hub-inward',              label: 'Hub – Inward Register',       path: '/workspace/hub-operations/inward-register',   module: 'Hub Operations' },
  { id: 'hub-inventory',           label: 'Hub – Hub Inventory',         path: '/workspace/hub-operations/hub-inventory',     module: 'Hub Operations' },
  { id: 'sc-inspection',           label: 'Service Center – Inspection', path: '/workspace/service-center/devices-under-inspection', module: 'Service Center' },
  { id: 'sc-estimate-pending',     label: 'Service Center – Estimate Pending', path: '/workspace/service-center/estimate-pending', module: 'Service Center' },
  { id: 'sc-estimate-submitted',   label: 'Service Center – Estimate Submitted', path: '/workspace/service-center/estimate-submitted', module: 'Service Center' },
  { id: 'sc-under-repair',         label: 'Service Center – Under Repair', path: '/workspace/service-center/under-repair',    module: 'Service Center' },
  { id: 'sc-repair-completed',     label: 'Service Center – Repair Completed', path: '/workspace/service-center/repair-completed', module: 'Service Center' },
  { id: 'sc-total-loss',           label: 'Service Center – Total Loss', path: '/workspace/service-center/total-loss-cases', module: 'Service Center' },
  { id: 'est-new',                 label: 'Estimates – New Estimates',   path: '/workspace/estimates/new-estimates',          module: 'Estimates' },
  { id: 'est-awaiting',            label: 'Estimates – Awaiting Approval',path: '/estimate-approval',                         module: 'Estimates' },
  { id: 'est-approved',            label: 'Estimates – Approved',        path: '/workspace/estimates/approved-estimates',     module: 'Estimates' },
  { id: 'est-rejected',            label: 'Estimates – Rejected',        path: '/workspace/estimates/rejected-estimates',     module: 'Estimates' },
  { id: 'est-history',             label: 'Estimates – History',         path: '/workspace/estimates/estimate-history',       module: 'Estimates' },
  { id: 'cashless-approval',       label: 'Cashless – Approval Queue',   path: '/cashless-approval',                          module: 'Cashless' },
  { id: 'cashless-pending-photos', label: 'Cashless – Pending Photos',   path: '/workspace/cashless/pending-photos',          module: 'Cashless' },
  { id: 'cashless-approved',       label: 'Cashless – Approved Cases',   path: '/workspace/cashless/approved-cases',          module: 'Cashless' },
  { id: 'claims-all',              label: 'Claims – All Claims',         path: '/claims',                                     module: 'Claims (Cashless)' },
  { id: 'claims-approval-pending', label: 'Claims – Approval Pending',   path: '/claims?status=APPROVAL_PENDING',             module: 'Claims (Cashless)' },
  { id: 'claims-approved',         label: 'Claims – Approved',           path: '/claims?status=APPROVED',                    module: 'Claims (Cashless)' },
  { id: 'claims-rejected',         label: 'Claims – Rejected',           path: '/claims?status=REJECTED',                    module: 'Claims (Cashless)' },
  { id: 'claims-reupload',         label: 'Claims – Re-upload Pending',  path: '/claims?status=REUPLOAD_PENDING',             module: 'Claims (Cashless)' },
  { id: 'claims-history',          label: 'Claims – History',            path: '/claims?status=CLOSED',                      module: 'Claims (Cashless)' },
  { id: 'invoice-queue',           label: 'Invoice Verification – Queue',path: '/invoice-verification',                       module: 'Invoice Verification' },
  { id: 'invoice-approved',        label: 'Invoice – Approved',          path: '/claims?status=INVOICE_APPROVED',            module: 'Invoice Verification' },
  { id: 'invoice-rejected',        label: 'Invoice – Rejected',          path: '/claims?status=INVOICE_REJECTED',            module: 'Invoice Verification' },
  { id: 'insurance-ready',         label: 'Insurance – Ready for Submission', path: '/insurance-submission',                  module: 'Insurance Submission' },
  { id: 'insurance-submitted',     label: 'Insurance – Submitted',       path: '/claims?status=SUBMITTED_TO_INSURANCE',      module: 'Insurance Submission' },
  { id: 'qc-pending',              label: 'Quality Check – Pending',     path: '/workspace/quality-check/pending-qc',         module: 'Quality Check' },
  { id: 'qc-passed',               label: 'Quality Check – Passed',      path: '/workspace/quality-check/qc-passed',          module: 'Quality Check' },
  { id: 'qc-failed',               label: 'Quality Check – Failed',      path: '/workspace/quality-check/qc-failed',          module: 'Quality Check' },
  { id: 'qc-rework',               label: 'Quality Check – Rework',      path: '/workspace/quality-check/rework-required',    module: 'Quality Check' },
  { id: 'delivery-assign',         label: 'Delivery – Assign',           path: '/workspace/delivery/assign-delivery',         module: 'Delivery' },
  { id: 'delivery-dispatch',       label: 'Delivery – Ready for Dispatch',path: '/workspace/delivery/ready-for-dispatch',     module: 'Delivery' },
  { id: 'delivery-out',            label: 'Delivery – Out for Delivery', path: '/delivery-tracking',                          module: 'Delivery' },
  { id: 'delivery-delivered',      label: 'Delivery – Delivered',        path: '/workspace/delivery/delivered',               module: 'Delivery' },
  { id: 'delivery-failed',         label: 'Delivery – Failed',           path: '/workspace/delivery/delivery-failed',         module: 'Delivery' },
  { id: 'delivery-history',        label: 'Delivery – History',          path: '/workspace/delivery/delivery-history',        module: 'Delivery' },
  { id: 'billing-invoice',         label: 'Billing – Generate Invoice',  path: '/workspace/billing/generate-invoice',         module: 'Billing' },
  { id: 'billing-pending',         label: 'Billing – Pending Invoices',  path: '/workspace/billing/pending-invoices',         module: 'Billing' },
  { id: 'billing-reconcile',       label: 'Billing – Payment Reconciliation', path: '/payment-reconciliation',               module: 'Billing' },
  { id: 'billing-paid',            label: 'Billing – Paid Invoices',     path: '/workspace/billing/paid-invoices',           module: 'Billing' },
  { id: 'billing-refund',          label: 'Billing – Refund Cases',      path: '/workspace/billing/refund-cases',            module: 'Billing' },
  { id: 'notif-sms',               label: 'Notifications – SMS Logs',    path: '/workspace/notifications/sms-logs',          module: 'Notifications' },
  { id: 'notif-email',             label: 'Notifications – Email Logs',  path: '/workspace/notifications/email-logs',        module: 'Notifications' },
  { id: 'notif-failed',            label: 'Notifications – Failed',      path: '/workspace/notifications/failed-notifications', module: 'Notifications' },
  { id: 'users-admin',             label: 'Users – Admin Users',         path: '/workspace/users/admin-users',               module: 'Users' },
  { id: 'users-customers',         label: 'Users – Customers',           path: '/workspace/users/customers',                 module: 'Users' },
  { id: 'users-roles',             label: 'Users – Roles & Permissions', path: '/workspace/users/roles-permissions',         module: 'Users' },
  { id: 'reports-request',         label: 'Reports – Request Report',    path: '/workspace/reports/request-report',          module: 'Reports' },
  { id: 'reports-pickup',          label: 'Reports – Pickup Report',     path: '/workspace/reports/pickup-report',           module: 'Reports' },
  { id: 'reports-revenue',         label: 'Reports – Revenue Report',    path: '/workspace/reports/revenue-report',          module: 'Reports' },
  { id: 'settings-status',         label: 'Settings – Status Config',    path: '/workspace/settings/status-configuration',  module: 'Settings' },
  { id: 'settings-sla',            label: 'Settings – SLA Config',       path: '/workspace/settings/sla-configuration',     module: 'Settings' },
  { id: 'documents',               label: 'Documents – Library',         path: '/documents',                                  module: 'Documents' },
  { id: 'audit-activity',          label: 'Audit – Activity Logs',       path: '/workspace/audit/activity-logs',             module: 'Audit' },
  { id: 'audit-timeline',          label: 'Audit – Status History',      path: '/timeline',                                   module: 'Audit' },
];

// ---------------------------------------------------------------------------
// Workflow videos to record (as admin)
// ---------------------------------------------------------------------------
const WORKFLOWS = [
  {
    id: 'wf-login',
    label: 'How to Log In',
    steps: [
      { action: 'goto', url: '/login', wait: 1500 },
      { action: 'screenshot', label: 'Login page loaded' },
    ],
  },
  {
    id: 'wf-dashboard',
    label: 'Dashboard Overview',
    steps: [
      { action: 'goto', url: '/', wait: 2000 },
      { action: 'screenshot', label: 'Dashboard overview' },
      { action: 'goto', url: '/workspace/dashboard/sla-tat-summary', wait: 2000 },
      { action: 'goto', url: '/workspace/dashboard/recent-activities', wait: 2000 },
      { action: 'goto', url: '/workspace/dashboard/alerts-escalations', wait: 2000 },
    ],
  },
  {
    id: 'wf-service-request',
    label: 'Create a Service Request',
    steps: [
      { action: 'goto', url: '/workspace/service-requests/create-request', wait: 2000 },
      { action: 'screenshot', label: 'Create request form' },
      { action: 'goto', url: '/requests', wait: 2000 },
      { action: 'screenshot', label: 'All service requests list' },
    ],
  },
  {
    id: 'wf-pickup',
    label: 'Pickup Management Workflow',
    steps: [
      { action: 'goto', url: '/workspace/pickup-management/pickup-dashboard', wait: 2000 },
      { action: 'screenshot', label: 'Pickup dashboard' },
      { action: 'goto', url: '/workspace/pickup-management/assign-pickup', wait: 2000 },
      { action: 'screenshot', label: 'Assign pickup page' },
      { action: 'goto', url: '/workspace/pickup-management/pending-pickup', wait: 2000 },
      { action: 'goto', url: '/workspace/pickup-management/picked-up-devices', wait: 2000 },
    ],
  },
  {
    id: 'wf-hub-operations',
    label: 'Hub Operations Workflow',
    steps: [
      { action: 'goto', url: '/workspace/hub-operations/device-received-at-hub', wait: 2000 },
      { action: 'screenshot', label: 'Device received queue' },
      { action: 'goto', url: '/workspace/hub-operations/pending-verification', wait: 2000 },
      { action: 'goto', url: '/workspace/hub-operations/inward-register', wait: 2000 },
      { action: 'goto', url: '/workspace/hub-operations/hub-inventory', wait: 2000 },
    ],
  },
  {
    id: 'wf-service-center',
    label: 'Service Center & Repair Flow',
    steps: [
      { action: 'goto', url: '/workspace/service-center/devices-under-inspection', wait: 2000 },
      { action: 'screenshot', label: 'Devices under inspection' },
      { action: 'goto', url: '/workspace/service-center/estimate-pending', wait: 2000 },
      { action: 'goto', url: '/workspace/service-center/under-repair', wait: 2000 },
      { action: 'goto', url: '/workspace/service-center/repair-completed', wait: 2000 },
    ],
  },
  {
    id: 'wf-cashless-claim',
    label: 'Cashless Claim Lifecycle',
    steps: [
      { action: 'goto', url: '/claims', wait: 2000 },
      { action: 'screenshot', label: 'All claims list' },
      { action: 'goto', url: '/claims?status=APPROVAL_PENDING', wait: 2000 },
      { action: 'screenshot', label: 'Claims awaiting approval' },
      { action: 'goto', url: '/invoice-verification', wait: 2000 },
      { action: 'screenshot', label: 'Invoice verification queue' },
      { action: 'goto', url: '/insurance-submission', wait: 2000 },
      { action: 'screenshot', label: 'Insurance submission queue' },
    ],
  },
  {
    id: 'wf-billing',
    label: 'Billing & Payment Flow',
    steps: [
      { action: 'goto', url: '/workspace/billing/generate-invoice', wait: 2000 },
      { action: 'screenshot', label: 'Generate invoice page' },
      { action: 'goto', url: '/workspace/billing/pending-invoices', wait: 2000 },
      { action: 'goto', url: '/payment-reconciliation', wait: 2000 },
      { action: 'screenshot', label: 'Payment reconciliation' },
      { action: 'goto', url: '/workspace/billing/refund-cases', wait: 2000 },
    ],
  },
  {
    id: 'wf-quality-delivery',
    label: 'Quality Check & Delivery',
    steps: [
      { action: 'goto', url: '/workspace/quality-check/pending-qc', wait: 2000 },
      { action: 'screenshot', label: 'Pending QC queue' },
      { action: 'goto', url: '/workspace/quality-check/qc-passed', wait: 2000 },
      { action: 'goto', url: '/workspace/delivery/assign-delivery', wait: 2000 },
      { action: 'screenshot', label: 'Assign delivery page' },
      { action: 'goto', url: '/delivery-tracking', wait: 2000 },
      { action: 'goto', url: '/workspace/delivery/delivered', wait: 2000 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function relPath(absolutePath) {
  return path.relative(OUT_DIR, absolutePath).replace(/\\/g, '/');
}

async function loginViaLocalStorage(context, user) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user.username, password: user.password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${user.username}: ${res.status}`);
  const session = await res.json();

  await context.addInitScript((s) => {
    localStorage.setItem('gsh_token', s.accessToken);
    localStorage.setItem('gsh_user', JSON.stringify(s));
  }, session);
  return session;
}

async function takeScreenshot(page, filePath) {
  ensureDir(path.dirname(filePath));
  await page.screenshot({ fullPage: true, path: filePath });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  ensureDir(SS_DIR);
  ensureDir(VID_DIR);

  const browser = await chromium.launch({ headless: true });
  const screenshotMeta = {}; // id → rel path
  const videoMeta = {};       // id → { label, relPath }

  // ─── 1. Screenshot pass (admin for all pages) ───────────────────────────
  console.log('\n[docs] === Screenshot pass (admin) ===');
  {
    const adminUser = USERS[0];
    const context = await browser.newContext({ viewport: VIEWPORT });
    await loginViaLocalStorage(context, adminUser);
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT);
    page.setDefaultTimeout(NAV_TIMEOUT);

    // Login page screenshot (no auth needed)
    const loginPath = path.join(SS_DIR, 'login.png');
    const loginCtx = await browser.newContext({ viewport: VIEWPORT });
    const loginPage = await loginCtx.newPage();
    await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await takeScreenshot(loginPage, loginPath);
    screenshotMeta['login'] = relPath(loginPath);
    await loginCtx.close();
    console.log('  ✓ login');

    for (const pg of PAGES.filter((p) => p.id !== 'login')) {
      try {
        await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        const ssPath = path.join(SS_DIR, `${pg.id}.png`);
        await takeScreenshot(page, ssPath);
        screenshotMeta[pg.id] = relPath(ssPath);
        console.log(`  ✓ ${pg.id}`);
      } catch (e) {
        console.warn(`  ✗ ${pg.id}: ${e.message}`);
      }
    }

    await context.close();
  }

  // ─── 2. Role-specific key screenshots ────────────────────────────────────
  console.log('\n[docs] === Role screenshots ===');
  const roleScreenshots = {}; // userKey → { dashPath, description }
  for (const user of USERS) {
    try {
      const context = await browser.newContext({ viewport: VIEWPORT });
      await loginViaLocalStorage(context, user);
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(NAV_TIMEOUT);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const ssPath = path.join(SS_DIR, `role-${user.key}-dashboard.png`);
      await takeScreenshot(page, ssPath);
      roleScreenshots[user.key] = relPath(ssPath);
      console.log(`  ✓ ${user.key} dashboard`);
      await context.close();
    } catch (e) {
      console.warn(`  ✗ ${user.key}: ${e.message}`);
    }
  }

  // ─── 3. Workflow video recordings (admin) ─────────────────────────────────
  console.log('\n[docs] === Video recording pass (admin) ===');
  const adminUser = USERS[0];

  for (const wf of WORKFLOWS) {
    const vidOutDir = path.join(VID_DIR, wf.id);
    ensureDir(vidOutDir);

    const context = await browser.newContext({
      viewport: VIEWPORT,
      recordVideo: { dir: vidOutDir, size: VIEWPORT },
    });
    await loginViaLocalStorage(context, adminUser);
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT);

    try {
      for (const step of wf.steps) {
        if (step.action === 'goto') {
          await page.goto(`${BASE_URL}${step.url}`, { waitUntil: 'networkidle' });
          if (step.wait) await page.waitForTimeout(step.wait);
        } else if (step.action === 'screenshot') {
          // inline screenshot during video (just a pause for visibility)
          await page.waitForTimeout(1200);
        }
      }
      await page.waitForTimeout(800);
    } catch (e) {
      console.warn(`  ✗ ${wf.id}: ${e.message}`);
    }

    const video = page.video();
    await page.close();
    await context.close();

    if (video) {
      const rawPath = await video.path();
      if (rawPath && fs.existsSync(rawPath)) {
        const destPath = path.join(VID_DIR, `${wf.id}.webm`);
        fs.copyFileSync(rawPath, destPath);
        videoMeta[wf.id] = { label: wf.label, relPath: relPath(destPath) };
        console.log(`  ✓ ${wf.id}`);
      }
    }
  }

  await browser.close();

  // ─── 4. Generate HTML user manual ────────────────────────────────────────
  console.log('\n[docs] === Generating HTML user manual ===');
  const html = buildManual({ screenshotMeta, videoMeta, roleScreenshots });
  const manualPath = path.join(OUT_DIR, 'user-manual.html');
  fs.writeFileSync(manualPath, html, 'utf8');
  console.log(`\n✅  User manual written to: ${manualPath}`);
  console.log(`    Screenshots : ${Object.keys(screenshotMeta).length} files`);
  console.log(`    Videos      : ${Object.keys(videoMeta).length} files`);
}

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------
function img(relP, caption = '', width = '100%') {
  if (!relP) return `<div class="no-ss">Screenshot not available</div>`;
  return `<figure class="ss-fig">
    <img src="${relP}" alt="${caption}" loading="lazy" style="width:${width};border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.18);">
    ${caption ? `<figcaption>${caption}</figcaption>` : ''}
  </figure>`;
}

function vid(videoObj) {
  if (!videoObj?.relPath) return '';
  return `<div class="vid-wrap">
    <video controls width="100%" style="border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.18);">
      <source src="${videoObj.relPath}" type="video/webm">
      Your browser does not support video playback.
    </video>
    <p class="vid-caption">🎬 ${videoObj.label}</p>
  </div>`;
}

function step(num, title, body) {
  return `<div class="step"><div class="step-num">${num}</div><div class="step-body"><strong>${title}</strong>${body ? `<p>${body}</p>` : ''}</div></div>`;
}

function section(id, title, accent, content) {
  return `<section id="${id}" class="module-section">
    <div class="module-header accent-${accent}">
      <h2>${title}</h2>
    </div>
    <div class="module-body">
      ${content}
    </div>
  </section>`;
}

function buildManual({ screenshotMeta, videoMeta, roleScreenshots }) {
  const ss = screenshotMeta;
  const wv = videoMeta;

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f1f5f9; color: #1e293b; line-height: 1.6; }
    a { color: #2563eb; }
    .hero { background: linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%); color: #f8fafc; padding: 56px 48px 48px; }
    .hero h1 { font-size: 2.4rem; font-weight: 800; margin-bottom: 10px; }
    .hero p  { font-size: 1.1rem; color: #94a3b8; max-width: 700px; }
    .hero .badge-row { display:flex; gap:12px; flex-wrap:wrap; margin-top:20px; }
    .badge { background:#1e293b; border-radius:999px; padding:6px 16px; font-size:.85rem; font-weight:600; color:#93c5fd; }
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 260px; background: #0f172a; color: #f8fafc; padding: 24px 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; }
    .sidebar h3 { font-size: .7rem; letter-spacing: 1.5px; text-transform: uppercase; color: #475569; padding: 16px 20px 6px; margin-top: 12px; }
    .sidebar a { display: block; padding: 8px 20px; color: #cbd5e1; text-decoration: none; font-size: .9rem; border-left: 3px solid transparent; transition: all .15s; }
    .sidebar a:hover, .sidebar a.active { color: #f8fafc; background: #1e293b; border-left-color: #3b82f6; }
    .content { flex: 1; padding: 0; overflow: hidden; }
    .module-section { background: #fff; margin: 24px 32px; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden; }
    .module-header { padding: 24px 32px; }
    .module-header h2 { font-size: 1.5rem; font-weight: 700; color: #fff; }
    .module-body { padding: 28px 32px; }
    .accent-blue   { background: #2563eb; }
    .accent-cyan   { background: #0891b2; }
    .accent-teal   { background: #0d9488; }
    .accent-gold   { background: #d97706; }
    .accent-orange { background: #ea580c; }
    .accent-purple { background: #7c3aed; }
    .accent-rose   { background: #e11d48; }
    .accent-red    { background: #dc2626; }
    .accent-green  { background: #16a34a; }
    .accent-slate  { background: #475569; }
    h3 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 24px 0 12px; }
    h4 { font-size: .95rem; font-weight: 600; color: #334155; margin: 18px 0 8px; }
    p  { color: #475569; margin-bottom: 12px; font-size: .95rem; }
    ul, ol { padding-left: 20px; color: #475569; font-size: .95rem; margin-bottom: 14px; }
    li { margin-bottom: 6px; }
    .step { display:flex; gap:14px; margin-bottom:16px; align-items:flex-start; }
    .step-num { width:28px; height:28px; background:#2563eb; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:800; flex-shrink:0; margin-top:2px; }
    .step-body strong { display:block; font-size:.95rem; color:#0f172a; }
    .step-body p { margin:4px 0 0; font-size:.88rem; }
    .ss-fig { margin: 16px 0 24px; }
    figcaption { font-size: .8rem; color: #64748b; text-align: center; margin-top: 6px; }
    .no-ss { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 32px; text-align: center; color: #94a3b8; margin: 16px 0; }
    .vid-wrap { margin: 16px 0 28px; }
    .vid-caption { font-size: .85rem; color: #64748b; text-align: center; margin-top: 8px; }
    .role-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; margin: 16px 0 24px; }
    .role-card { border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; }
    .role-card-header { padding:12px 16px; font-weight:700; font-size:.9rem; }
    .role-card-body { padding:12px; }
    .role-card img { width:100%; border-radius:4px; }
    .cred-table { width:100%; border-collapse:collapse; margin:16px 0; font-size:.9rem; }
    .cred-table th { background:#0f172a; color:#f8fafc; padding:10px 14px; text-align:left; }
    .cred-table td { padding:10px 14px; border-bottom:1px solid #e2e8f0; }
    .cred-table tr:last-child td { border-bottom:none; }
    .cred-table tr:nth-child(even) td { background:#f8fafc; }
    .info-box { background:#eff6ff; border-left:4px solid #2563eb; border-radius:6px; padding:14px 18px; margin:16px 0; font-size:.9rem; }
    .warn-box { background:#fffbeb; border-left:4px solid #d97706; border-radius:6px; padding:14px 18px; margin:16px 0; font-size:.9rem; }
    .ss-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:16px 0; }
    @media(max-width:900px){ .layout{flex-direction:column} .sidebar{width:100%;height:auto;position:relative} .ss-grid{grid-template-columns:1fr} }
    .tab-row { display:flex; gap:8px; flex-wrap:wrap; margin:12px 0; }
    .tab-chip { background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; padding:5px 14px; font-size:.82rem; font-weight:600; color:#334155; }
    .flow-diagram { background:#f8fafc; border-radius:10px; padding:20px 24px; margin:16px 0; }
    .flow-steps { display:flex; flex-wrap:wrap; gap:0; align-items:center; }
    .flow-step { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 14px; font-size:.82rem; font-weight:600; color:#334155; }
    .flow-arrow { color:#94a3b8; font-size:1.2rem; padding:0 6px; }
  `;

  const sidebar = `
    <nav class="sidebar">
      <h3>Getting Started</h3>
      <a href="#getting-started">Overview & Login</a>
      <a href="#roles">User Roles</a>
      <h3>Core Modules</h3>
      <a href="#dashboard">Dashboard</a>
      <a href="#service-requests">Service Requests</a>
      <a href="#pickup">Pickup Management</a>
      <a href="#hub">Hub Operations</a>
      <a href="#service-center">Service Center</a>
      <a href="#estimates">Estimates</a>
      <a href="#cashless">Cashless Approval</a>
      <a href="#quality-check">Quality Check</a>
      <a href="#delivery">Delivery</a>
      <a href="#billing">Billing</a>
      <h3>Claims Module</h3>
      <a href="#claims">Claims Management</a>
      <a href="#invoice-verification">Invoice Verification</a>
      <a href="#insurance-submission">Insurance Submission</a>
      <h3>Admin Modules</h3>
      <a href="#notifications">Notifications</a>
      <a href="#users">Users & Roles</a>
      <a href="#reports">Reports</a>
      <a href="#settings">Settings</a>
      <a href="#documents">Documents</a>
      <a href="#audit">Audit & Logs</a>
      <h3>Videos</h3>
      <a href="#videos">All Workflow Videos</a>
    </nav>
  `;

  // ── Individual module sections ──────────────────────────────────────────
  const sections = [

    // GETTING STARTED
    section('getting-started', '🚀 Getting Started — Login', 'blue', `
      <p>Gadget Seva Hub (GSH) is a full-lifecycle device repair management platform. Before you can use any module, you must log in with your credentials.</p>
      <h3>How to Log In</h3>
      ${step(1, 'Open your browser', 'Navigate to the GSH web application URL provided by your administrator (e.g. <code>http://localhost:5173</code>).')}
      ${step(2, 'Enter your credentials', 'Type your assigned Username and Password in the fields shown below.')}
      ${step(3, 'Click "Sign In"', 'You will be redirected to the Dashboard. The top-right corner shows your username and role.')}
      ${img(ss['login'], 'GSH Login page — enter Username and Password then click Sign In')}
      ${vid(wv['wf-login'])}
      <div class="info-box">💡 <strong>Tip:</strong> If you see a "Session expired" message, your login token has timed out. Simply log in again.</div>
    `),

    // ROLES
    section('roles', '👥 User Roles & Credentials', 'slate', `
      <p>GSH uses role-based access control. Each role sees only the modules relevant to their work. The table below lists all roles and their default credentials.</p>
      <table class="cred-table">
        <thead><tr><th>Username</th><th>Password</th><th>Role</th><th>What They Can Do</th></tr></thead>
        <tbody>
          <tr><td><strong>admin</strong></td><td>Admin@123</td><td>Admin</td><td>Full access to all modules — configuration, users, reports, and all operational queues.</td></tr>
          <tr><td><strong>backend</strong></td><td>Admin@123</td><td>Backend Team</td><td>Claim approvals, invoice verification, hub operations, pickup management, and service requests.</td></tr>
          <tr><td><strong>support</strong></td><td>Admin@123</td><td>Customer Support</td><td>Service requests, pickup tracking, notifications, reports, and audit logs.</td></tr>
          <tr><td><strong>finance</strong></td><td>Admin@123</td><td>Finance</td><td>Billing, payment reconciliation, refunds, invoice reports, and revenue reports.</td></tr>
          <tr><td><strong>mse</strong></td><td>Admin@123</td><td>MSE Team</td><td>Cashless approval queues, claims, invoice verification, insurance submission.</td></tr>
        </tbody>
      </table>
      <h3>Dashboard View by Role</h3>
      <p>Each role sees a customised menu on the left-hand navigation. Below are the dashboards for each role after login.</p>
      <div class="role-grid">
        ${USERS.map((u) => `
          <div class="role-card">
            <div class="role-card-header" style="background:#0f172a;color:#f8fafc;">${u.label}</div>
            <div class="role-card-body">
              ${img(roleScreenshots[u.key], `${u.label} dashboard`)}
            </div>
          </div>`).join('')}
      </div>
    `),

    // DASHBOARD
    section('dashboard', '📊 Dashboard', 'blue', `
      <p>The Dashboard gives a real-time snapshot of operations — KPIs, SLA breaches, recent activity, and active escalations.</p>
      <h3>Dashboard Tabs</h3>
      <div class="tab-row">
        <span class="tab-chip">Overview</span>
        <span class="tab-chip">SLA / TAT Summary</span>
        <span class="tab-chip">Recent Activities</span>
        <span class="tab-chip">Alerts & Escalations</span>
      </div>
      <h4>Overview</h4>
      <p>Shows total open requests, pickup stats, repair counts, and billing summaries as live KPI cards.</p>
      ${img(ss['dashboard-overview'], 'Dashboard – Overview KPIs')}
      <h4>SLA / TAT Summary</h4>
      <p>Displays turnaround time and breach monitoring for each stage of the repair workflow.</p>
      ${img(ss['dashboard-sla'], 'Dashboard – SLA/TAT Summary')}
      <h4>Recent Activities</h4>
      <p>A live feed of the latest actions across the platform — new requests, pickups, status changes.</p>
      ${img(ss['dashboard-activities'], 'Dashboard – Recent Activities')}
      <h4>Alerts & Escalations</h4>
      <p>Lists critical issues that need immediate attention — SLA breaches, failed pickups, overdue repairs.</p>
      ${img(ss['dashboard-alerts'], 'Dashboard – Alerts & Escalations')}
      ${vid(wv['wf-dashboard'])}
    `),

    // SERVICE REQUESTS
    section('service-requests', '📋 Service Requests', 'cyan', `
      <p>All device repair jobs start as a Service Request. Every request tracks the device, customer, status, and full history from intake to closure.</p>
      <div class="flow-diagram">
        <strong>Service Request Flow:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Create Request</span><span class="flow-arrow">→</span>
          <span class="flow-step">Pickup Assigned</span><span class="flow-arrow">→</span>
          <span class="flow-step">Hub Received</span><span class="flow-arrow">→</span>
          <span class="flow-step">Service Center</span><span class="flow-arrow">→</span>
          <span class="flow-step">QC</span><span class="flow-arrow">→</span>
          <span class="flow-step">Delivery</span><span class="flow-arrow">→</span>
          <span class="flow-step">Closed</span>
        </div>
      </div>
      <h3>How to Create a Service Request</h3>
      ${step(1, 'Go to Service Requests → Create Request', 'Click the "Service Requests" tab in the top navigation, then select "Create Request" from the sub-navigation.')}
      ${step(2, 'Fill in Customer Details', 'Enter the customer name, mobile number, and address. All fields marked * are mandatory.')}
      ${step(3, 'Fill in Device Details', 'Select device category, brand, and model. Enter the IMEI number if available.')}
      ${step(4, 'Select Request Type', 'Choose between Normal Repair or Cashless Claim.')}
      ${step(5, 'Submit', 'Click "Create Service Request". A unique request number (e.g. GSH-20260412-0001) is generated.')}
      ${img(ss['sr-create'], 'Create Service Request form')}
      <h3>All Requests Queue</h3>
      <p>Shows every request in the system regardless of status. Use the search and filter options to find specific requests.</p>
      ${img(ss['sr-all'], 'All Service Requests list')}
      <h3>Other Tabs</h3>
      <div class="ss-grid">
        ${img(ss['sr-open'], 'Open Requests — active, not yet completed')}
        ${img(ss['sr-inprogress'], 'In Progress — currently being worked on')}
      </div>
      ${img(ss['sr-closed'], 'Closed Requests — completed and resolved')}
      ${vid(wv['wf-service-request'])}
    `),

    // PICKUP MANAGEMENT
    section('pickup', '🚗 Pickup Management', 'teal', `
      <p>Manages the doorstep pickup of devices from customers. A runner (field agent) is assigned to each pickup.</p>
      <div class="flow-diagram">
        <strong>Pickup Flow:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Assign Pickup</span><span class="flow-arrow">→</span>
          <span class="flow-step">Runner Accepts</span><span class="flow-arrow">→</span>
          <span class="flow-step">Device Picked Up</span><span class="flow-arrow">→</span>
          <span class="flow-step">Delivered to Hub</span>
        </div>
      </div>
      <h3>Pickup Dashboard</h3>
      <p>Summary cards showing how many pickups are in each stage.</p>
      ${img(ss['pickup-dashboard'], 'Pickup Management Dashboard')}
      <h3>Runner Onboarding</h3>
      <p>Admin / Backend staff can register a new pickup runner with their name, mobile number, and assigned zone. Once onboarded, the runner receives an app link via SMS to accept pickups from their mobile.</p>
      ${img(ss['pickup-runner-onboarding'], 'Runner Onboarding form')}
      <h3>Assign Pickup</h3>
      <p>Shows all requests ready for doorstep pickup. Click a request card and select an available runner to assign the job.</p>
      ${step(1, 'Open Pickup Management → Assign Pickup', '')}
      ${step(2, 'Find the request card', 'Use the search or scroll to locate the request number.')}
      ${step(3, 'Click "Assign Runner"', 'A modal appears. Select the runner from the dropdown and confirm.')}
      ${img(ss['pickup-assign'], 'Assign Pickup — select runner for the request')}
      <h3>Pickup Queues</h3>
      <div class="ss-grid">
        ${img(ss['pickup-pending'], 'Pending Pickup — awaiting runner collection')}
        ${img(ss['pickup-pickedup'], 'Picked Up Devices — collected, en route to hub')}
      </div>
      <div class="ss-grid">
        ${img(ss['pickup-failed'], 'Pickup Failed Cases — attempt failed or customer absent')}
        ${img(ss['pickup-history'], 'Pickup History — all completed pickup records')}
      </div>
      ${vid(wv['wf-pickup'])}
    `),

    // HUB OPERATIONS
    section('hub', '🏭 Hub Operations', 'gold', `
      <p>The Hub is the central warehouse that receives devices from runners, verifies them, and dispatches them to the service center.</p>
      <div class="flow-diagram">
        <strong>Hub Flow:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Device Received</span><span class="flow-arrow">→</span>
          <span class="flow-step">IMEI Verification</span><span class="flow-arrow">→</span>
          <span class="flow-step">Inward Register</span><span class="flow-arrow">→</span>
          <span class="flow-step">Send to Service Center</span>
        </div>
      </div>
      <h3>Device Received at Hub</h3>
      <p>When a runner drops off a device, the hub operator scans its QR/IMEI to mark it as received.</p>
      ${step(1, 'Open Hub Operations → Device Received at Hub', '')}
      ${step(2, 'Scan or enter the device IMEI or request number', '')}
      ${step(3, 'Confirm receipt', 'The device moves to Pending Verification.')}
      ${img(ss['hub-received'], 'Device Received at Hub queue')}
      <h3>Pending Verification</h3>
      <p>Each received device must be verified — IMEI checked, package condition assessed, photos uploaded.</p>
      ${img(ss['hub-verification'], 'Hub – Pending Verification queue')}
      <h3>Send to Service Center</h3>
      <p>After verification, devices are batched and dispatched to the repair service center.</p>
      ${img(ss['hub-send-sc'], 'Hub – Send to Service Center')}
      <h3>Inward Register & Inventory</h3>
      <div class="ss-grid">
        ${img(ss['hub-inward'], 'Hub Inward Register — full log of received devices')}
        ${img(ss['hub-inventory'], 'Hub Inventory — devices currently at the hub')}
      </div>
      ${vid(wv['wf-hub-operations'])}
    `),

    // SERVICE CENTER
    section('service-center', '🔧 Service Center', 'orange', `
      <p>The Service Center handles physical inspection, repair, and total-loss decisions for all devices.</p>
      <div class="flow-diagram">
        <strong>Repair Flow:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Inspection</span><span class="flow-arrow">→</span>
          <span class="flow-step">Estimate</span><span class="flow-arrow">→</span>
          <span class="flow-step">Customer Approval</span><span class="flow-arrow">→</span>
          <span class="flow-step">Repair</span><span class="flow-arrow">→</span>
          <span class="flow-step">QC</span>
        </div>
      </div>
      <h3>Devices Under Inspection</h3>
      <p>Newly arrived devices waiting for technician diagnosis.</p>
      ${img(ss['sc-inspection'], 'Devices Under Inspection queue')}
      <h3>Estimate Pending & Submitted</h3>
      <p>After diagnosis the technician creates a cost estimate. "Estimate Pending" = estimate not yet created. "Estimate Submitted" = submitted, awaiting customer decision.</p>
      <div class="ss-grid">
        ${img(ss['sc-estimate-pending'], 'Estimate Pending — no estimate yet')}
        ${img(ss['sc-estimate-submitted'], 'Estimate Submitted — waiting for customer')}
      </div>
      <h3>Under Repair & Completed</h3>
      <div class="ss-grid">
        ${img(ss['sc-under-repair'], 'Under Repair — active repair in progress')}
        ${img(ss['sc-repair-completed'], 'Repair Completed — ready for QC')}
      </div>
      <h3>Total Loss Cases</h3>
      <p>Devices where repair cost exceeds device value are marked as Total Loss and written off.</p>
      ${img(ss['sc-total-loss'], 'Total Loss Cases')}
      ${vid(wv['wf-service-center'])}
    `),

    // ESTIMATES
    section('estimates', '💰 Estimates', 'purple', `
      <p>Estimates are cost quotations sent to customers for approval. A customer must approve an estimate before repair begins.</p>
      <h3>Estimate Tabs</h3>
      <div class="tab-row">
        <span class="tab-chip">New Estimates</span>
        <span class="tab-chip">Awaiting Customer Approval</span>
        <span class="tab-chip">Approved Estimates</span>
        <span class="tab-chip">Rejected Estimates</span>
        <span class="tab-chip">Estimate History</span>
      </div>
      <h3>New Estimates</h3>
      <p>Fresh estimates submitted by the service center, ready for internal review before sending to the customer.</p>
      ${img(ss['est-new'], 'New Estimates queue')}
      <h3>Awaiting Customer Approval</h3>
      <p>Estimates that have been shared with the customer. The customer approves or rejects via a self-service portal or customer support call.</p>
      ${img(ss['est-awaiting'], 'Awaiting Customer Approval')}
      <h3>Approved & Rejected</h3>
      <div class="ss-grid">
        ${img(ss['est-approved'], 'Approved Estimates — repair authorised')}
        ${img(ss['est-rejected'], 'Rejected Estimates — customer declined')}
      </div>
      ${img(ss['est-history'], 'Estimate History — all past estimates')}
    `),

    // CASHLESS
    section('cashless', '🛡️ Cashless Approval', 'purple', `
      <p>Cashless cases are insurance-backed repairs where the customer pays nothing upfront. This module handles the photo evidence and approval workflow before the repair begins.</p>
      <h3>Approval Queue</h3>
      <p>Cases with all required photos uploaded, awaiting backend team review and approval.</p>
      ${step(1, 'Open Cashless → Approval Queue', '')}
      ${step(2, 'Review the case details and uploaded photos', 'Each case requires 6 device photos + 4 damage photos.')}
      ${step(3, 'Click Approve or Reject', 'Approved cases move to repair. Rejected cases are sent back to the customer for photo re-upload.')}
      ${img(ss['cashless-approval'], 'Cashless Approval Queue')}
      <h3>Pending Photos</h3>
      <p>Cases where the customer has not yet uploaded all required evidence photos.</p>
      ${img(ss['cashless-pending-photos'], 'Cashless – Pending Photos')}
      <h3>Approved Cases</h3>
      <p>Cases fully approved and in the repair workflow.</p>
      ${img(ss['cashless-approved'], 'Cashless – Approved Cases')}
    `),

    // QUALITY CHECK
    section('quality-check', '✅ Quality Check', 'rose', `
      <p>After repair is complete, every device goes through Quality Check (QC) before it is dispatched back to the customer.</p>
      <div class="flow-diagram">
        <strong>QC Flow:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Repair Completed</span><span class="flow-arrow">→</span>
          <span class="flow-step">QC Inspection</span><span class="flow-arrow">→</span>
          <span class="flow-step">Pass → Dispatch</span>
          <span class="flow-arrow"> | </span>
          <span class="flow-step">Fail → Rework</span>
        </div>
      </div>
      <h3>Pending QC</h3>
      <p>Devices whose repair is complete and are waiting for a QC technician to inspect them.</p>
      ${img(ss['qc-pending'], 'Pending QC queue')}
      <h3>QC Results</h3>
      <div class="ss-grid">
        ${img(ss['qc-passed'], 'QC Passed — cleared for delivery')}
        ${img(ss['qc-failed'], 'QC Failed — sent back for rework')}
      </div>
      ${img(ss['qc-rework'], 'Rework Required — second repair attempt in progress')}
    `),

    // DELIVERY
    section('delivery', '🚚 Delivery', 'gold', `
      <p>After QC passes, devices are dispatched back to the customer through the Delivery module.</p>
      <div class="flow-diagram">
        <strong>Delivery Flow:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Ready for Dispatch</span><span class="flow-arrow">→</span>
          <span class="flow-step">Assign Agent</span><span class="flow-arrow">→</span>
          <span class="flow-step">Out for Delivery</span><span class="flow-arrow">→</span>
          <span class="flow-step">Delivered (OTP)</span>
        </div>
      </div>
      <h3>Assign Delivery</h3>
      <p>Select a delivery agent for devices that are ready to be dispatched.</p>
      ${img(ss['delivery-assign'], 'Assign Delivery page')}
      <h3>Delivery Queues</h3>
      <div class="ss-grid">
        ${img(ss['delivery-dispatch'], 'Ready for Dispatch')}
        ${img(ss['delivery-out'], 'Out for Delivery — in transit')}
      </div>
      <div class="ss-grid">
        ${img(ss['delivery-delivered'], 'Delivered — OTP confirmed')}
        ${img(ss['delivery-failed'], 'Delivery Failed — attempt unsuccessful')}
      </div>
      ${img(ss['delivery-history'], 'Delivery History — all completed deliveries')}
      ${vid(wv['wf-quality-delivery'])}
    `),

    // BILLING
    section('billing', '🧾 Billing', 'red', `
      <p>The Billing module manages invoice generation, payment collection, reconciliation, and refunds.</p>
      <div class="flow-diagram">
        <strong>Billing Flow:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Generate Invoice</span><span class="flow-arrow">→</span>
          <span class="flow-step">Send to Customer</span><span class="flow-arrow">→</span>
          <span class="flow-step">Payment Received</span><span class="flow-arrow">→</span>
          <span class="flow-step">Reconcile</span><span class="flow-arrow">→</span>
          <span class="flow-step">Close</span>
        </div>
      </div>
      <h3>Generate Invoice</h3>
      <p>Once a repaired device is delivered, a GST-compliant invoice is created for the customer.</p>
      ${step(1, 'Open Billing → Generate Invoice', '')}
      ${step(2, 'Search for the service request', '')}
      ${step(3, 'Review line items and totals', 'Parts, labour, GST are auto-calculated.')}
      ${step(4, 'Click Generate', 'Invoice PDF is created and can be sent to the customer.')}
      ${img(ss['billing-invoice'], 'Generate Invoice page')}
      <h3>Payment Reconciliation</h3>
      <p>Records UTR (payment reference) numbers against invoices to confirm payments received from customers.</p>
      ${img(ss['billing-reconcile'], 'Payment Reconciliation — match UTR to invoice')}
      <h3>Refund Cases</h3>
      <p>Manages partial or full refunds for cases where repair was unsuccessful or customer is due a credit.</p>
      <div class="ss-grid">
        ${img(ss['billing-pending'], 'Pending Invoices')}
        ${img(ss['billing-refund'], 'Refund Cases')}
      </div>
      ${vid(wv['wf-billing'])}
    `),

    // CLAIMS
    section('claims', '📑 Claims Management (Cashless Claims)', 'teal', `
      <p>The Claims module manages end-to-end cashless insurance claims — from initial registration through approval, invoice submission, and insurance payout.</p>
      <div class="flow-diagram">
        <strong>Full Claim Lifecycle:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Claim Registered</span><span class="flow-arrow">→</span>
          <span class="flow-step">Docs Verified</span><span class="flow-arrow">→</span>
          <span class="flow-step">Approved</span><span class="flow-arrow">→</span>
          <span class="flow-step">Repair + Invoice</span><span class="flow-arrow">→</span>
          <span class="flow-step">Insurance</span><span class="flow-arrow">→</span>
          <span class="flow-step">Closed</span>
        </div>
      </div>
      <div class="warn-box">⚠️ <strong>Role required:</strong> Claims are accessible to Admin, Backend Team, Customer Support, and MSE Team.</div>
      <h3>All Claims</h3>
      <p>Master list of every cashless claim in the system. Use the tabs or filter dropdown to narrow by status.</p>
      ${img(ss['claims-all'], 'Claims Management — All Claims list')}
      <h3>Claims Sub-Tabs</h3>
      <div class="tab-row">
        <span class="tab-chip">All Claims</span>
        <span class="tab-chip">Approval Pending</span>
        <span class="tab-chip">Approved Claims</span>
        <span class="tab-chip">Rejected Claims</span>
        <span class="tab-chip">Re-upload Pending</span>
        <span class="tab-chip">Claim History</span>
      </div>
      <h3>Approval Pending</h3>
      <p>Claims submitted by customers awaiting backend team document verification and approval.</p>
      ${step(1, 'Click the "Approval Pending" tab', 'Lists all claims in APPROVAL_PENDING status.')}
      ${step(2, 'Open a claim by clicking "View Details"', 'Review the submitted documents, IMEI, and claim details.')}
      ${step(3, 'Approve or Reject', 'Click Approve (claim moves to APPROVED) or Reject (enter reason, claim moves to REJECTED).')}
      ${img(ss['claims-approval-pending'], 'Claims — Approval Pending tab')}
      <h3>Approved & Rejected</h3>
      <div class="ss-grid">
        ${img(ss['claims-approved'], 'Approved Claims — cleared for repair')}
        ${img(ss['claims-rejected'], 'Rejected Claims — invalid or insufficient docs')}
      </div>
      <h3>Re-upload Pending</h3>
      <p>Claims where the customer needs to re-submit photos or documents. The system tracks the number of re-upload attempts.</p>
      ${img(ss['claims-reupload'], 'Re-upload Pending')}
      ${img(ss['claims-history'], 'Claim History — all closed/completed claims')}
      ${vid(wv['wf-cashless-claim'])}
    `),

    // INVOICE VERIFICATION
    section('invoice-verification', '🧮 Invoice Verification', 'gold', `
      <p>After a cashless repair is complete, the service center submits an invoice. This module is used to verify and approve or reject that invoice before it is sent to the insurance company.</p>
      <div class="flow-diagram">
        <strong>Invoice Verification Flow:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Invoice Submitted</span><span class="flow-arrow">→</span>
          <span class="flow-step">Backend Reviews</span><span class="flow-arrow">→</span>
          <span class="flow-step">Approve / Reject</span><span class="flow-arrow">→</span>
          <span class="flow-step">Ready for Insurance</span>
        </div>
      </div>
      <h3>Invoice Queue</h3>
      <p>All invoices submitted by the service center and waiting for backend verification.</p>
      ${step(1, 'Open Invoice Verification → Invoice Queue', '')}
      ${step(2, 'Click on a claim to view the invoice', 'Review the invoice amount, line items, and uploaded invoice document.')}
      ${step(3, 'Approve the invoice', 'Enter the approved amount. If the amount exceeds the threshold, admin approval is required.')}
      ${step(4, 'Or reject with reason', 'The service center will need to re-upload a corrected invoice.')}
      ${img(ss['invoice-queue'], 'Invoice Verification Queue')}
      <div class="ss-grid">
        ${img(ss['invoice-approved'], 'Invoice Approved — ready for insurance submission')}
        ${img(ss['invoice-rejected'], 'Invoice Rejected — awaiting corrected invoice')}
      </div>
    `),

    // INSURANCE SUBMISSION
    section('insurance-submission', '🏦 Insurance Submission', 'rose', `
      <p>The final step in the cashless claim lifecycle. Once an invoice is verified and approved, the claim package is submitted to the insurance company for reimbursement.</p>
      <div class="flow-diagram">
        <strong>Insurance Submission Flow:</strong>
        <div class="flow-steps" style="margin-top:10px;">
          <span class="flow-step">Invoice Approved</span><span class="flow-arrow">→</span>
          <span class="flow-step">Package Ready</span><span class="flow-arrow">→</span>
          <span class="flow-step">Submit to Insurer</span><span class="flow-arrow">→</span>
          <span class="flow-step">Claim Closed</span>
        </div>
      </div>
      <div class="warn-box">⚠️ <strong>Role required:</strong> Insurance Submission is accessible to Admin, Backend Team, and MSE Team only.</div>
      <h3>Ready for Insurance</h3>
      <p>Claims whose invoices have been approved and are ready to be packaged and submitted to the insurance company.</p>
      ${step(1, 'Open Insurance Submission → Ready for Insurance', '')}
      ${step(2, 'Review the claim summary', 'Check the approved amount, documents, and claim number.')}
      ${step(3, 'Click "Submit to Insurance"', 'Add submission notes and confirm. The claim status changes to SUBMITTED_TO_INSURANCE.')}
      ${img(ss['insurance-ready'], 'Insurance Submission — Ready for Insurance queue')}
      ${img(ss['insurance-submitted'], 'Submitted to Insurance — claims sent to insurer')}
    `),

    // NOTIFICATIONS
    section('notifications', '🔔 Notifications', 'teal', `
      <p>Tracks all SMS and email messages sent to customers and staff. Use this module to diagnose delivery failures and monitor communication logs.</p>
      <div class="ss-grid">
        ${img(ss['notif-sms'], 'SMS Logs — all SMS messages sent')}
        ${img(ss['notif-email'], 'Email Logs — all email messages sent')}
      </div>
      ${img(ss['notif-failed'], 'Failed Notifications — messages that failed to deliver')}
      <h3>When to Use</h3>
      <ul>
        <li>Customer says they didn't receive an OTP or notification — check SMS Logs for their number.</li>
        <li>Investigate delivery failures in the Failed Notifications tab.</li>
        <li>Audit all communications for a specific service request.</li>
      </ul>
    `),

    // USERS
    section('users', '👤 Users & Roles', 'blue', `
      <p>Manage all platform users — admin staff, field agents, delivery executives, and customers. Only Admins have access to this module.</p>
      <div class="ss-grid">
        ${img(ss['users-admin'], 'Admin Users — platform staff accounts')}
        ${img(ss['users-customers'], 'Customers — registered customer directory')}
      </div>
      ${img(ss['users-roles'], 'Roles & Permissions — access control matrix')}
      <h3>How to Create a New User</h3>
      ${step(1, 'Go to Users → select the appropriate user type', 'e.g. Admin Users for staff, Customers for customer records.')}
      ${step(2, 'Click "Add User" or "Invite"', 'Fill in name, email/phone, and role.')}
      ${step(3, 'Set a temporary password', 'The user must change it on first login.')}
    `),

    // REPORTS
    section('reports', '📈 Reports', 'gold', `
      <p>Generate operational and financial reports for management review and client communication.</p>
      <div class="ss-grid">
        ${img(ss['reports-request'], 'Request Report — intake and funnel analytics')}
        ${img(ss['reports-pickup'], 'Pickup Report — field productivity')}
      </div>
      ${img(ss['reports-revenue'], 'Revenue Report — billing and collections (Finance role)')}
      <h3>Available Reports</h3>
      <ul>
        <li><strong>Request Report</strong> — new requests, open vs closed, by date range</li>
        <li><strong>Pickup Report</strong> — runner productivity, on-time rates</li>
        <li><strong>Repair Report</strong> — repair throughput and outcomes</li>
        <li><strong>Delivery Report</strong> — dispatch and completion analytics</li>
        <li><strong>SLA / TAT Report</strong> — breach analysis and turnaround trends</li>
        <li><strong>Revenue Report</strong> — billing totals, reconciled vs outstanding</li>
      </ul>
    `),

    // SETTINGS
    section('settings', '⚙️ Settings', 'orange', `
      <p>System-wide configuration. Only Admins can access Settings.</p>
      <div class="ss-grid">
        ${img(ss['settings-status'], 'Status Configuration — workflow state management')}
        ${img(ss['settings-sla'], 'SLA Configuration — turnaround time rules')}
      </div>
      <h3>What You Can Configure</h3>
      <ul>
        <li><strong>Status Configuration</strong> — define and manage workflow states</li>
        <li><strong>SLA Configuration</strong> — set turnaround time targets per request type</li>
        <li><strong>Notification Settings</strong> — manage SMS/email retry policies and channels</li>
        <li><strong>File Storage Config</strong> — configure storage bucket and signed URL settings</li>
        <li><strong>System Preferences</strong> — global platform switches</li>
      </ul>
    `),

    // DOCUMENTS
    section('documents', '📁 Documents', 'teal', `
      <p>Central repository for operational documents, SOPs, and shared reference files. Uploaded documents can be accessed by all authorised staff.</p>
      <h3>How to Upload a Document</h3>
      ${step(1, 'Go to Documents → Document Library', '')}
      ${step(2, 'Click "Upload Document"', 'A form appears on the right side of the page.')}
      ${step(3, 'Enter a document name and description', '')}
      ${step(4, 'Select a file from your computer', 'Supported formats: PDF, DOCX, XLSX, PNG, JPG.')}
      ${step(5, 'Click Upload', 'The file is uploaded and appears in the library list.')}
      ${img(ss['documents'], 'Documents — Document Library')}
      <div class="info-box">💡 Uploaded documents are stored securely and accessible via signed URLs. Files do not expire by default.</div>
    `),

    // AUDIT
    section('audit', '🔍 Audit & Logs', 'purple', `
      <p>Enterprise-grade audit trail. Every significant action in the platform is recorded with a timestamp, user, and before/after snapshot.</p>
      <div class="ss-grid">
        ${img(ss['audit-activity'], 'Activity Logs — cross-system event stream')}
        ${img(ss['audit-timeline'], 'Status History — request status transitions')}
      </div>
      <h3>Use Cases</h3>
      <ul>
        <li>Investigate who approved a claim or changed a device status</li>
        <li>Track the full status history of a service request from creation to closure</li>
        <li>Compliance review — every user action is logged with IP and timestamp</li>
      </ul>
    `),

    // VIDEOS
    section('videos', '🎬 Workflow Videos', 'slate', `
      <p>Recorded walkthroughs of each major workflow. Watch these to understand the end-to-end flow before using the system.</p>
      ${WORKFLOWS.map((wf) => wv[wf.id] ? `
        <h3>${wv[wf.id].label}</h3>
        ${vid(wv[wf.id])}
      ` : '').join('')}
    `),

  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gadget Seva Hub — User Manual</title>
  <style>${css}</style>
</head>
<body>
  <div class="hero">
    <h1>Gadget Seva Hub — User Manual</h1>
    <p>Complete guide for all modules, workflows, and user roles. Use the sidebar to jump to any section.</p>
    <div class="badge-row">
      <span class="badge">v1.0 — April 2026</span>
      <span class="badge">All Roles Covered</span>
      <span class="badge">With Screenshots & Videos</span>
    </div>
  </div>
  <div class="layout">
    ${sidebar}
    <div class="content">
      ${sections.join('\n')}
    </div>
  </div>
  <script>
    // Highlight active sidebar link on scroll
    const links = document.querySelectorAll('.sidebar a');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const id = e.target.id;
          const link = document.querySelector(\`.sidebar a[href="#\${id}"]\`);
          if (link) link.classList.add('active');
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
  </script>
</body>
</html>`;
}

main().catch((e) => { console.error(e); process.exit(1); });
