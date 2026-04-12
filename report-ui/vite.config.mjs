import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { buildRunFromPlaywrightJson } from './report-data.mjs';

const virtualModuleId = 'virtual:report-dashboard-data';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

function loadDashboardData() {
  const jsonReportPath = path.resolve(__dirname, '../Report/test-results/results.json');
  const reportLinks = {
    allure: '../allure/index.html',
    playwright: '../playwright/index.html',
    rawJson: '../test-results/results.json',
  };

  if (!fs.existsSync(jsonReportPath)) {
    return {
      generatedAt: new Date().toISOString(),
      initialRuns: [],
      reportLinks,
      sourceLabel: 'Demo or imported Playwright JSON',
    };
  }

  try {
    const payload = JSON.parse(fs.readFileSync(jsonReportPath, 'utf8'));
    return {
      generatedAt: new Date().toISOString(),
      initialRuns: [buildRunFromPlaywrightJson(payload, 'Latest Run')],
      reportLinks,
      sourceLabel: 'Current Playwright execution JSON',
    };
  } catch (error) {
    console.warn(`[dashboard] Failed to read Playwright JSON: ${error.message}`);
    return {
      generatedAt: new Date().toISOString(),
      initialRuns: [],
      reportLinks,
      sourceLabel: 'Demo or imported Playwright JSON',
    };
  }
}

function reportDashboardDataPlugin() {
  return {
    name: 'report-dashboard-data',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }

      return null;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) {
        return null;
      }

      return `export default ${JSON.stringify(loadDashboardData())};`;
    },
  };
}

export default defineConfig({
  root: __dirname,
  base: './',
  plugins: [react(), reportDashboardDataPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../Report/dashboard'),
    emptyOutDir: true,
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1200,
  },
});
