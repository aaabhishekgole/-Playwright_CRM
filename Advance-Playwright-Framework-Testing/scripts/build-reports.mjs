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

printReportLocation('Dashboard report', path.join(reportPaths.dashboard, 'index.html'));
printReportLocation('Playwright report', path.join(reportPaths.playwright, 'index.html'));
printReportLocation('Allure report', path.join(reportPaths.allure, 'index.html'));

process.exit(allureExitCode || dashboardExitCode);
