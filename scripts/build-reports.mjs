import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const workingDirectory = process.cwd();
const isWindows = process.platform === 'win32';
const allureBin = path.join(workingDirectory, 'node_modules', '.bin', isWindows ? 'allure.cmd' : 'allure');
const viteBin = path.join(workingDirectory, 'node_modules', '.bin', isWindows ? 'vite.cmd' : 'vite');
const reportRoot = 'Report';
const reportPaths = {
  allure: path.join(reportRoot, 'allure'),
  allureResults: path.join(reportRoot, 'allure-results'),
  dashboard: path.join(reportRoot, 'dashboard'),
  playwright: path.join(reportRoot, 'playwright'),
  testResultsJson: path.join(reportRoot, 'test-results', 'results.json'),
};

function runCommand(command, args, label) {
  return new Promise((resolve) => {
    const child = isWindows
      ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', command, ...args], {
          cwd: workingDirectory,
          shell: false,
          stdio: 'inherit',
        })
      : spawn(command, args, {
          cwd: workingDirectory,
          shell: false,
          stdio: 'inherit',
        });

    child.once('error', (error) => {
      console.error(`[${label}] ${error.message}`);
      resolve(1);
    });

    child.once('close', (code) => {
      resolve(code ?? 1);
    });
  });
}

function directoryHasFiles(directoryPath) {
  return fs.existsSync(directoryPath) && fs.readdirSync(directoryPath).length > 0;
}

function printReportLocation(label, reportPath) {
  const resolvedPath = path.join(workingDirectory, reportPath);
  if (fs.existsSync(resolvedPath)) {
    console.log(`${label}: ${resolvedPath}`);
  }
}

function injectPlaywrightReportStyles() {
  const reportIndexPath = path.join(workingDirectory, reportPaths.playwright, 'index.html');
  if (!fs.existsSync(reportIndexPath)) return;

  const fontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@600;700;800&display=swap" rel="stylesheet">`;

  const cyberStyle = `<style id="cyber-theme">
  /* ── Cyber/Tech skin for Playwright HTML Report ───────────────────── */
  :root, [data-color-mode="dark"], [data-color-mode="dark"] [data-dark-theme="dark"] {
    /* Canvas / backgrounds */
    --color-canvas-default:            #020810 !important;
    --color-canvas-subtle:             #070d1a !important;
    --color-canvas-inset:              #040b16 !important;
    --color-canvas-overlay:            #0a1628 !important;
    --color-primer-canvas-backdrop:    rgba(2,8,16,0.85) !important;
    --color-primer-canvas-sticky:      #020810 !important;

    /* Foreground / text */
    --color-fg-default:                #e2e8f0 !important;
    --color-fg-muted:                  #7ba4c7 !important;
    --color-fg-subtle:                 #4a7a9b !important;
    --color-fg-on-emphasis:            #020810 !important;

    /* Borders */
    --color-border-default:            rgba(0,212,255,0.18) !important;
    --color-border-muted:              rgba(0,212,255,0.10) !important;
    --color-border-subtle:             rgba(0,212,255,0.06) !important;

    /* Accent (links, highlights) → cyber cyan */
    --color-accent-fg:                 #00d4ff !important;
    --color-accent-emphasis:           #00d4ff !important;
    --color-accent-muted:              rgba(0,212,255,0.15) !important;
    --color-accent-subtle:             rgba(0,212,255,0.08) !important;

    /* Success (passed) → neon green */
    --color-success-fg:                #00ff88 !important;
    --color-success-emphasis:          #00ff88 !important;
    --color-success-muted:             rgba(0,255,136,0.15) !important;
    --color-success-subtle:            rgba(0,255,136,0.08) !important;

    /* Danger (failed) → neon red */
    --color-danger-fg:                 #ff4444 !important;
    --color-danger-emphasis:           #ff4444 !important;
    --color-danger-muted:              rgba(255,68,68,0.15) !important;
    --color-danger-subtle:             rgba(255,68,68,0.08) !important;

    /* Attention (flaky/warning) → amber */
    --color-attention-fg:              #fbbf24 !important;
    --color-attention-emphasis:        #fbbf24 !important;
    --color-attention-muted:           rgba(251,191,36,0.15) !important;
    --color-attention-subtle:          rgba(251,191,36,0.08) !important;

    /* Header */
    --color-header-bg:                 #040c1c !important;
    --color-header-text:               #00d4ff !important;
    --color-header-logo:               #00d4ff !important;
    --color-header-search-bg:          #020810 !important;
    --color-header-search-border:      rgba(0,212,255,0.3) !important;

    /* Buttons */
    --color-btn-bg:                    #0a1628 !important;
    --color-btn-border:                rgba(0,212,255,0.25) !important;
    --color-btn-hover-bg:              rgba(0,212,255,0.1) !important;
    --color-btn-active-bg:             rgba(0,212,255,0.18) !important;
    --color-btn-selected-bg:           rgba(0,212,255,0.15) !important;
    --color-btn-primary-bg:            #00d4ff !important;
    --color-btn-primary-hover-bg:      #00b8e6 !important;
    --color-neutral-emphasis-plus:     #7ba4c7 !important;
    --color-neutral-emphasis:          #4a7a9b !important;
    --color-neutral-muted:             rgba(0,212,255,0.12) !important;
    --color-neutral-subtle:            rgba(0,212,255,0.06) !important;

    /* Scale overrides for green/red */
    --color-scale-green-1:             #00ff88 !important;
    --color-scale-green-2:             #00e67a !important;
    --color-scale-green-3:             #00cc6c !important;
    --color-scale-red-1:               #ff4444 !important;
    --color-scale-red-2:               #e63c3c !important;
  }

  /* ── Body: cyber grid background ─────────────────────────────────── */
  body {
    background: #020810 !important;
    background-image:
      linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px) !important;
    background-size: 40px 40px !important;
    font-family: 'Inter', -apple-system, sans-serif !important;
    color: #e2e8f0 !important;
  }

  /* ── Radial glow at top ─────────────────────────────────────────── */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Scrollbar ───────────────────────────────────────────────────── */
  ::-webkit-scrollbar       { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #020810; }
  ::-webkit-scrollbar-thumb { background: #00d4ff; border-radius: 2px; }

  /* ── Test list rows ──────────────────────────────────────────────── */
  .test-file-test:hover,
  .test-case-summary:hover {
    background: rgba(0,212,255,0.05) !important;
    border-left: 2px solid #00d4ff !important;
  }

  /* ── Duration / time numbers → monospace ─────────────────────────── */
  .test-file-test .duration,
  .test-duration,
  [class*="duration"] {
    font-family: 'JetBrains Mono', monospace !important;
    color: #00d4ff !important;
    font-size: 0.8rem !important;
  }

  /* ── Status icons coloring ───────────────────────────────────────── */
  .test-file-test.failure svg,
  [class*="error"] svg,
  [class*="fail"] svg { color: #ff4444 !important; fill: #ff4444 !important; }

  .test-file-test.success svg,
  [class*="pass"] svg,
  [class*="success"] svg { color: #00ff88 !important; fill: #00ff88 !important; }

  /* ── Filter bar buttons ──────────────────────────────────────────── */
  .counters-summary button,
  .suites-summary button,
  [class*="filter"] button {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.75rem !important;
    transition: box-shadow 0.2s ease !important;
  }

  .counters-summary button:hover,
  [class*="filter"] button:hover {
    box-shadow: 0 0 10px rgba(0,212,255,0.3) !important;
  }

  /* ── Header / toolbar ────────────────────────────────────────────── */
  .header {
    background: rgba(4,12,28,0.95) !important;
    border-bottom: 1px solid rgba(0,212,255,0.2) !important;
    backdrop-filter: blur(12px) !important;
  }

  /* ── Title text ──────────────────────────────────────────────────── */
  .title {
    font-family: 'Orbitron', sans-serif !important;
    letter-spacing: 0.06em !important;
    color: #00d4ff !important;
    text-transform: uppercase !important;
  }

  /* ── Labels / badges (browser, tags) ────────────────────────────── */
  .label {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.7rem !important;
    border-radius: 4px !important;
    padding: 1px 6px !important;
    border: 1px solid rgba(0,212,255,0.3) !important;
    background: rgba(0,212,255,0.08) !important;
    color: #00d4ff !important;
  }

  .label[title*="chromium"], .label[data-testid*="chromium"] {
    border-color: #4d9de0 !important;
    background: rgba(77,157,224,0.1) !important;
    color: #4d9de0 !important;
  }
  .label[title*="firefox"] {
    border-color: #ff7139 !important;
    background: rgba(255,113,57,0.1) !important;
    color: #ff7139 !important;
  }
  .label[title*="webkit"] {
    border-color: #a8b1c5 !important;
    background: rgba(168,177,197,0.1) !important;
    color: #a8b1c5 !important;
  }
  .label[title*="edge"] {
    border-color: #0078d4 !important;
    background: rgba(0,120,212,0.1) !important;
    color: #0078d4 !important;
  }
  .label[title*="mobile"] {
    border-color: #a855f7 !important;
    background: rgba(168,85,247,0.1) !important;
    color: #a855f7 !important;
  }

  /* ── Search input ────────────────────────────────────────────────── */
  input[type="search"],
  input[type="text"],
  .search input {
    background: rgba(0,212,255,0.04) !important;
    border: 1px solid rgba(0,212,255,0.25) !important;
    color: #e2e8f0 !important;
    font-family: 'JetBrains Mono', monospace !important;
    border-radius: 6px !important;
    padding: 4px 10px !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
  }
  input[type="search"]:focus,
  input[type="text"]:focus {
    border-color: #00d4ff !important;
    box-shadow: 0 0 0 2px rgba(0,212,255,0.2) !important;
    outline: none !important;
  }

  /* ── Error / stack trace blocks ──────────────────────────────────── */
  .error-message, .error-location, pre {
    background: rgba(255,68,68,0.05) !important;
    border: 1px solid rgba(255,68,68,0.2) !important;
    border-radius: 6px !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.8rem !important;
    color: #ff9999 !important;
  }

  /* ── View Trace link ─────────────────────────────────────────────── */
  a[href*="trace"], .test-file-test a {
    color: #00d4ff !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.75rem !important;
    text-decoration: none !important;
    border-bottom: 1px solid rgba(0,212,255,0.3) !important;
    transition: color 0.2s, border-color 0.2s !important;
  }
  a[href*="trace"]:hover, .test-file-test a:hover {
    color: #00ff88 !important;
    border-color: #00ff88 !important;
  }

  /* ── File/spec group header ──────────────────────────────────────── */
  .test-file-header,
  .file-name {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.85rem !important;
    color: #00d4ff !important;
    border-bottom: 1px solid rgba(0,212,255,0.15) !important;
    padding: 8px 0 !important;
  }

  /* ── Stat summary numbers ────────────────────────────────────────── */
  .counts, .test-count,
  [class*="count"], [class*="stat"] {
    font-family: 'JetBrains Mono', monospace !important;
  }

  /* ── Scanline animation ──────────────────────────────────────────── */
  @keyframes scanline {
    0%   { transform: translateY(-2px); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  body::after {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.5) 50%, transparent 100%);
    animation: scanline 10s linear infinite;
    pointer-events: none;
    z-index: 9999;
  }
  </style>`;

  let html = fs.readFileSync(reportIndexPath, 'utf8');
  if (html.includes('id="cyber-theme"')) return; // already injected
  html = html.replace('</head>', `${fontsLink}\n${cyberStyle}\n</head>`);
  fs.writeFileSync(reportIndexPath, html, 'utf8');
  console.log('[cyber] Playwright report styled with tech theme.');
}

function escapeInlineScript(scriptContent) {
  return scriptContent.replace(/<\/script/gi, '<\\/script');
}

function inlineDashboardAssets() {
  const dashboardDirectory = path.join(workingDirectory, reportPaths.dashboard);
  const dashboardIndexPath = path.join(dashboardDirectory, 'index.html');

  if (!fs.existsSync(dashboardIndexPath)) {
    return;
  }

  let html = fs.readFileSync(dashboardIndexPath, 'utf8');
  const stylesheetMatch = html.match(/<link rel="stylesheet"[^>]*href="(.+?)"[^>]*>/i);
  const scriptMatch = html.match(/<script type="module"[^>]*src="(.+?)"[^>]*><\/script>/i);

  if (stylesheetMatch) {
    const stylesheetPath = path.resolve(dashboardDirectory, stylesheetMatch[1]);
    const stylesheetContent = fs.readFileSync(stylesheetPath, 'utf8');
    html = html.replace(stylesheetMatch[0], () => `<style>\n${stylesheetContent}\n</style>`);
  }

  if (scriptMatch) {
    const scriptPath = path.resolve(dashboardDirectory, scriptMatch[1]);
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    html = html.replace(scriptMatch[0], () => `<script type="module">\n${escapeInlineScript(scriptContent)}\n</script>`);
  }

  fs.writeFileSync(dashboardIndexPath, html, 'utf8');

  const assetsDirectory = path.join(dashboardDirectory, 'assets');
  if (fs.existsSync(assetsDirectory)) {
    fs.rmSync(assetsDirectory, { force: true, recursive: true });
  }
}

let allureExitCode = 0;
const allureResultsPath = path.join(workingDirectory, reportPaths.allureResults);

if (directoryHasFiles(allureResultsPath)) {
  allureExitCode = await runCommand(allureBin, ['generate', reportPaths.allureResults, '--clean', '-o', reportPaths.allure, '--single-file'], 'allure');
} else {
  console.warn('[allure] Skipping generation because allure-results is empty.');
}

let dashboardExitCode = 0;
const jsonReportPath = path.join(workingDirectory, reportPaths.testResultsJson);

if (fs.existsSync(jsonReportPath)) {
  dashboardExitCode = await runCommand(viteBin, ['build', '--config', 'report-ui/vite.config.mjs'], 'dashboard');
  if (dashboardExitCode === 0) {
    inlineDashboardAssets();
  }
} else {
  console.warn('[dashboard] Skipping generation because Report/test-results/results.json is missing.');
}

injectPlaywrightReportStyles();

printReportLocation('Dashboard report', path.join(reportPaths.dashboard, 'index.html'));
printReportLocation('Playwright report', path.join(reportPaths.playwright, 'index.html'));
printReportLocation('Allure report', path.join(reportPaths.allure, 'index.html'));

process.exit(allureExitCode || dashboardExitCode);
