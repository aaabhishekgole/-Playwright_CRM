import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const workingDirectory = process.cwd();
const isWindows = process.platform === 'win32';
const playwrightBin = path.join(workingDirectory, 'node_modules', '.bin', isWindows ? 'playwright.cmd' : 'playwright');
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

cleanReports();

const playwrightExitCode = await runCommand(playwrightBin, ['test', ...process.argv.slice(2)], 'playwright');
const reportsExitCode = await runCommand(process.execPath, [path.join('scripts', 'build-reports.mjs')], 'reports');

if (playwrightExitCode === 0 && reportsExitCode !== 0) {
  process.exit(reportsExitCode);
}

process.exit(playwrightExitCode);
