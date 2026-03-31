import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const workingDirectory = process.cwd();
const isWindows = process.platform === 'win32';
const playwrightBin = path.join(workingDirectory, 'node_modules', '.bin', isWindows ? 'playwright.cmd' : 'playwright');
const allureBin = path.join(workingDirectory, 'node_modules', '.bin', isWindows ? 'allure.cmd' : 'allure');
const reportRoot = 'Report';
const reportPaths = {
  allure: path.join(reportRoot, 'allure'),
  allureResults: path.join(reportRoot, 'allure-results'),
  dashboard: path.join(reportRoot, 'dashboard'),
  playwright: path.join(reportRoot, 'playwright'),
  testResults: path.join(reportRoot, 'test-results'),
};
const legacyReportDirectories = ['test-results', 'playwright-report', 'dashboard-report', 'allure-results', 'allure-report', 'tta-report'];

function cleanReports() {
  for (const directory of [reportRoot, ...legacyReportDirectories]) {
    fs.rmSync(path.join(workingDirectory, directory), { force: true, recursive: true });
  }
}

function directoryHasFiles(directoryPath) {
  return fs.existsSync(directoryPath) && fs.readdirSync(directoryPath).length > 0;
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

function printReportLocation(label, reportPath) {
  const resolvedPath = path.join(workingDirectory, reportPath);
  if (!fs.existsSync(resolvedPath)) {
    return;
  }

  console.log(`${label}: ${resolvedPath}`);
}

cleanReports();

const playwrightExitCode = await runCommand(playwrightBin, ['test', ...process.argv.slice(2)], 'playwright');

let allureExitCode = 0;
const allureResultsPath = path.join(workingDirectory, reportPaths.allureResults);

if (directoryHasFiles(allureResultsPath)) {
  allureExitCode = await runCommand(allureBin, ['generate', reportPaths.allureResults, '--clean', '-o', reportPaths.allure, '--single-file'], 'allure');
} else {
  console.warn('[allure] Skipping generation because allure-results is empty.');
}

printReportLocation('Dashboard report', path.join(reportPaths.dashboard, 'index.html'));
printReportLocation('Playwright report', path.join(reportPaths.playwright, 'index.html'));
printReportLocation('Allure report', path.join(reportPaths.allure, 'index.html'));

if (playwrightExitCode === 0 && allureExitCode !== 0) {
  process.exit(allureExitCode);
}

process.exit(playwrightExitCode);
