import fs from 'fs';
import path from 'path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

type TestSummary = {
  title: string;
  status: string;
  durationMs: number;
  file: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class CustomTTAReporter implements Reporter {
  private readonly summaries: TestSummary[] = [];
  private startTime = 0;

  onBegin(_config: FullConfig, _suite: Suite) {
    this.startTime = Date.now();
    fs.mkdirSync(path.resolve('tta-report'), { recursive: true });
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.summaries.push({
      title: test.titlePath().join(' > '),
      status: result.status,
      durationMs: result.duration,
      file: test.location.file,
    });
  }

  onEnd(result: FullResult) {
    const durationMs = Date.now() - this.startTime;
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>TTA Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; background: #f7f9fc; color: #1c294d; }
      h1 { margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; }
      th, td { padding: 12px 14px; border-bottom: 1px solid #e4eaf5; text-align: left; vertical-align: top; }
      th { background: #eef3ff; }
      .passed { color: #0a7f47; font-weight: bold; }
      .failed { color: #bf2436; font-weight: bold; }
      .timedOut, .interrupted, .skipped { color: #765300; font-weight: bold; }
      .meta { color: #5b6b8c; margin-bottom: 16px; }
      code { background: #eef3ff; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <h1>Custom TTA Reporter</h1>
    <p class="meta">Status: <strong>${escapeHtml(result.status)}</strong> | Duration: <strong>${durationMs} ms</strong> | Total tests: <strong>${this.summaries.length}</strong></p>
    <table>
      <thead>
        <tr>
          <th>Test</th>
          <th>Status</th>
          <th>Duration</th>
          <th>File</th>
        </tr>
      </thead>
      <tbody>
        ${this.summaries
          .map(
            (summary) => `<tr>
          <td>${escapeHtml(summary.title)}</td>
          <td class="${escapeHtml(summary.status)}">${escapeHtml(summary.status)}</td>
          <td>${summary.durationMs} ms</td>
          <td><code>${escapeHtml(summary.file)}</code></td>
        </tr>`,
          )
          .join('\n')}
      </tbody>
    </table>
  </body>
</html>`;

    fs.writeFileSync(path.resolve('tta-report', 'index.html'), html, 'utf8');
  }
}

export default CustomTTAReporter;
