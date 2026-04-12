import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const workingDirectory = process.cwd();
const isWindows = process.platform === 'win32';
const playwrightBin = path.join(workingDirectory, 'node_modules', '.bin', isWindows ? 'playwright.cmd' : 'playwright');
const allureBin = path.join(workingDirectory, 'node_modules', '.bin', isWindows ? 'allure.cmd' : 'allure');
const reportRoot = 'Report';
const legacyReportDirectories = ['test-results', 'playwright-report', 'dashboard-report', 'allure-results', 'allure-report', 'tta-report'];

function cleanReports() {
  for (const directory of [reportRoot, ...legacyReportDirectories]) {
    fs.rmSync(path.join(workingDirectory, directory), { force: true, recursive: true });
  }
}

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

function openInBrowser(filePath) {
  const absPath = path.resolve(workingDirectory, filePath);
  if (!fs.existsSync(absPath)) return;
  const opener = isWindows ? 'cmd.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = isWindows ? ['/d', '/c', 'start', '', absPath] : [absPath];
  spawn(opener, args, { detached: true, stdio: 'ignore' }).unref();
}

function openAllureReport() {
  const allureReportPath = path.join(reportRoot, 'allure');
  if (!fs.existsSync(path.join(workingDirectory, allureReportPath))) {
    console.warn('[reports] Allure report folder not found — skipping.');
    return;
  }
  // allure open starts a local HTTP server and opens the browser automatically
  const child = isWindows
    ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', allureBin, 'open', allureReportPath, '--port', '9324'], {
        cwd: workingDirectory,
        shell: false,
        stdio: 'ignore',
        detached: true,
      })
    : spawn(allureBin, ['open', allureReportPath, '--port', '9324'], {
        cwd: workingDirectory,
        shell: false,
        stdio: 'ignore',
        detached: true,
      });
  child.unref();
  console.log('\n[reports] Allure report → http://localhost:9324');
}

function openPlaywrightReport() {
  const reportPath = path.join(reportRoot, 'playwright');
  if (!fs.existsSync(path.join(workingDirectory, reportPath))) return;
  const child = isWindows
    ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', playwrightBin, 'show-report', reportPath], {
        cwd: workingDirectory,
        shell: false,
        stdio: 'ignore',
        detached: true,
      })
    : spawn(playwrightBin, ['show-report', reportPath], {
        cwd: workingDirectory,
        shell: false,
        stdio: 'ignore',
        detached: true,
      });
  child.unref();
  console.log('\n[reports] Playwright HTML report → http://localhost:9323');
}

cleanReports();

const playwrightExitCode = await runCommand(playwrightBin, ['test', ...process.argv.slice(2)], 'playwright');
const reportsExitCode = await runCommand(process.execPath, [path.join('scripts', 'build-reports.mjs')], 'reports');

// Auto-open both reports after every run
openPlaywrightReport();
openAllureReport();
openInBrowser(path.join(reportRoot, 'dashboard', 'index.html'));
console.log('[reports] Dashboard report → opening in browser');

if (playwrightExitCode === 0 && reportsExitCode !== 0) {
  process.exit(reportsExitCode);
}

process.exit(playwrightExitCode);
