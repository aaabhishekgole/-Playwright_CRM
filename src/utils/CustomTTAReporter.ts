import fs from 'fs';
import path from 'path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestError, TestResult, TestStep } from '@playwright/test/reporter';

type AttachmentKind = 'image' | 'video' | 'trace' | 'text' | 'file';

type ReportAttachment = {
  contentType: string;
  kind: AttachmentKind;
  name: string;
  relativePath: string;
};

type TestSummary = {
  attachments: ReportAttachment[];
  durationMs: number;
  errors: string[];
  expectedStatus: string;
  file: string;
  line: number;
  outcome: string;
  projectName: string;
  retry: number;
  startedAt: string;
  status: string;
  steps: string[];
  tags: string[];
  title: string;
};

type ReporterOptions = {
  outputFolder?: string;
  reportTitle?: string;
  playwrightReportPath?: string;
  allureReportPath?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toPosixPath(value: string) {
  return value.split(path.sep).join('/');
}

function formatDuration(durationMs: number) {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  const seconds = durationMs / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    second: '2-digit',
    year: 'numeric',
  });
}

function summarizeError(error: TestError) {
  const rawMessage = error.stack || error.message || error.value || 'Unknown test failure';
  const firstLine = rawMessage.split(/\r?\n/).find((line) => line.trim());
  return firstLine ?? rawMessage;
}

function collectStepTitles(steps: TestStep[], collected: string[] = []) {
  for (const step of steps) {
    if (step.category === 'test.step' && step.title) {
      collected.push(step.title);
    }

    collectStepTitles(step.steps, collected);
  }

  return collected;
}

function toStatusKey(status: string) {
  return status.replace(/timedOut/i, 'timedout').toLowerCase();
}

function summarizeOutcome(outcome: string) {
  return outcome === 'unexpected' ? 'failed' : outcome;
}

function getAttachmentKind(name: string, contentType: string): AttachmentKind {
  const loweredName = name.toLowerCase();
  const loweredContentType = contentType.toLowerCase();

  if (loweredContentType.startsWith('image/')) {
    return 'image';
  }

  if (loweredContentType.startsWith('video/')) {
    return 'video';
  }

  if (loweredName.includes('trace') || loweredContentType.includes('zip')) {
    return 'trace';
  }

  if (loweredContentType.startsWith('text/') || loweredContentType.includes('json')) {
    return 'text';
  }

  return 'file';
}

function relativeReportPath(absoluteOrRelativePath: string, outputFolderPath: string) {
  const resolvedPath = path.isAbsolute(absoluteOrRelativePath) ? absoluteOrRelativePath : path.resolve(absoluteOrRelativePath);
  return toPosixPath(path.relative(outputFolderPath, resolvedPath));
}

function renderTagList(tags: string[]) {
  if (!tags.length) {
    return '<span class="meta-muted">No tags</span>';
  }

  return tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('');
}

function renderStepList(steps: string[]) {
  if (!steps.length) {
    return '';
  }

  return `<div class="card-section">
      <h3>Executed Steps</h3>
      <ul class="step-list">
        ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
      </ul>
    </div>`;
}

function renderAttachmentList(attachments: ReportAttachment[]) {
  if (!attachments.length) {
    return '<span class="meta-muted">No media captured</span>';
  }

  return attachments
    .map(
      (attachment) => `<a class="artifact-chip artifact-chip--${escapeHtml(attachment.kind)}" href="${escapeHtml(attachment.relativePath)}" target="_blank" rel="noreferrer">${escapeHtml(attachment.name)}</a>`,
    )
    .join('');
}

function renderPreviewPanel(attachments: ReportAttachment[]) {
  const screenshots = attachments.filter((attachment) => attachment.kind === 'image').slice(0, 2);
  const video = attachments.find((attachment) => attachment.kind === 'video');

  if (!screenshots.length && !video) {
    return '';
  }

  return `<div class="preview-grid">
      ${screenshots
        .map(
          (attachment) => `<a class="image-preview" href="${escapeHtml(attachment.relativePath)}" target="_blank" rel="noreferrer">
            <img src="${escapeHtml(attachment.relativePath)}" alt="${escapeHtml(attachment.name)}" loading="lazy" />
          </a>`,
        )
        .join('')}
      ${
        video
          ? `<video class="video-preview" controls preload="metadata">
              <source src="${escapeHtml(video.relativePath)}" type="${escapeHtml(video.contentType)}" />
            </video>`
          : ''
      }
    </div>`;
}

function renderErrors(errors: string[]) {
  if (!errors.length) {
    return '';
  }

  return `<div class="card-section">
      <h3>Failure Summary</h3>
      <div class="error-box">
        ${errors.map((error) => `<p>${escapeHtml(error)}</p>`).join('')}
      </div>
    </div>`;
}

class CustomTTAReporter implements Reporter {
  private readonly summaries = new Map<string, TestSummary>();
  private readonly outputFolder: string;
  private readonly reportTitle: string;
  private readonly playwrightReportPath: string;
  private readonly allureReportPath: string;
  private startTime = 0;

  constructor(options: ReporterOptions = {}) {
    this.outputFolder = options.outputFolder ?? 'Report/dashboard';
    this.reportTitle = options.reportTitle ?? 'QA Execution Dashboard';
    this.playwrightReportPath = options.playwrightReportPath ?? '../playwright/index.html';
    this.allureReportPath = options.allureReportPath ?? '../allure/index.html';
  }

  onBegin(_config: FullConfig, _suite: Suite) {
    this.startTime = Date.now();
    fs.mkdirSync(path.resolve(this.outputFolder), { recursive: true });
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const outputFolderPath = path.resolve(this.outputFolder);
    const projectName = test.parent.project()?.name ?? 'default';
    const attachments = result.attachments
      .filter((attachment) => Boolean(attachment.path))
      .map((attachment) => ({
        contentType: attachment.contentType,
        kind: getAttachmentKind(attachment.name, attachment.contentType),
        name: attachment.name,
        relativePath: relativeReportPath(attachment.path as string, outputFolderPath),
      }));

    this.summaries.set(test.id, {
      attachments,
      durationMs: result.duration,
      errors: result.errors.map(summarizeError),
      expectedStatus: test.expectedStatus,
      file: test.location.file,
      line: test.location.line,
      outcome: summarizeOutcome(test.outcome()),
      projectName,
      retry: result.retry,
      startedAt: result.startTime.toISOString(),
      status: result.status,
      steps: collectStepTitles(result.steps).slice(0, 8),
      tags: [...test.tags],
      title: test.titlePath().join(' > '),
    });
  }

  onEnd(result: FullResult) {
    const summaries = [...this.summaries.values()].sort((left, right) => {
      if (left.status !== right.status) {
        return left.status.localeCompare(right.status);
      }

      return left.title.localeCompare(right.title);
    });

    const durationMs = Date.now() - this.startTime;
    const totalTests = summaries.length;
    const passedCount = summaries.filter((summary) => summary.status === 'passed').length;
    const skippedCount = summaries.filter((summary) => summary.status === 'skipped').length;
    const failingCount = summaries.filter((summary) => summary.status !== 'passed' && summary.status !== 'skipped').length;
    const flakyCount = summaries.filter((summary) => summary.outcome === 'flaky').length;
    const passRate = totalTests === 0 ? 0 : Math.round((passedCount / totalTests) * 100);
    const projects = [...new Set(summaries.map((summary) => summary.projectName))];

    const cardsMarkup = summaries.length
      ? summaries
          .map((summary) => {
            const statusKey = toStatusKey(summary.status);
            const searchTerms = `${summary.title} ${summary.projectName} ${summary.file} ${summary.tags.join(' ')}`.toLowerCase();

            return `<article class="test-card" data-project="${escapeHtml(summary.projectName)}" data-search="${escapeHtml(searchTerms)}" data-status="${escapeHtml(statusKey)}">
          <div class="test-card__header">
            <div>
              <p class="project-name">${escapeHtml(summary.projectName)}</p>
              <h2>${escapeHtml(summary.title)}</h2>
              <p class="file-path"><code>${escapeHtml(summary.file)}:${summary.line}</code></p>
            </div>
            <span class="status-pill status-pill--${escapeHtml(statusKey)}">${escapeHtml(summary.status)}</span>
          </div>
          <div class="metric-row">
            <span><strong>${formatDuration(summary.durationMs)}</strong></span>
            <span>Outcome: <strong>${escapeHtml(summary.outcome)}</strong></span>
            <span>Retry: <strong>${summary.retry}</strong></span>
            <span>Expected: <strong>${escapeHtml(summary.expectedStatus)}</strong></span>
            <span>Started: <strong>${escapeHtml(formatDate(summary.startedAt))}</strong></span>
          </div>
          <div class="tag-row">
            ${renderTagList(summary.tags)}
          </div>
          <div class="card-section">
            <h3>Artifacts</h3>
            <div class="artifact-row">
              ${renderAttachmentList(summary.attachments)}
            </div>
          </div>
          ${renderPreviewPanel(summary.attachments)}
          ${renderStepList(summary.steps)}
          ${renderErrors(summary.errors)}
        </article>`;
          })
          .join('\n')
      : `<div class="empty-state">
          <h2>No tests were recorded</h2>
          <p>The dashboard did not receive any test events for this execution.</p>
        </div>`;

    const dashboardData = {
      durationMs,
      generatedAt: new Date().toISOString(),
      passRate,
      resultStatus: result.status,
      summaries,
      totalTests,
    };

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(this.reportTitle)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f6fb;
        --card: rgba(255, 255, 255, 0.92);
        --border: rgba(122, 146, 187, 0.22);
        --text: #10233f;
        --muted: #5d708f;
        --navy: #133a72;
        --success: #197a52;
        --warning: #8a6500;
        --danger: #b0304b;
        --shadow: 0 24px 60px rgba(22, 42, 81, 0.12);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: "Segoe UI", "Helvetica Neue", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(31, 91, 184, 0.14), transparent 28%),
          radial-gradient(circle at top right, rgba(16, 35, 63, 0.1), transparent 24%),
          linear-gradient(180deg, #f7f9fd 0%, #edf2f9 100%);
      }

      a { color: inherit; text-decoration: none; }

      code {
        background: rgba(19, 58, 114, 0.08);
        border-radius: 999px;
        padding: 4px 10px;
      }

      .shell {
        max-width: 1520px;
        margin: 0 auto;
        padding: 36px 28px 48px;
      }

      .hero {
        display: grid;
        gap: 20px;
        grid-template-columns: minmax(0, 1.8fr) minmax(280px, 0.9fr);
        align-items: stretch;
        margin-bottom: 24px;
      }

      .hero-card, .panel, .test-card, .empty-state {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--shadow);
      }

      .hero-card {
        padding: 28px;
      }

      .eyebrow {
        margin: 0 0 10px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        font-size: 12px;
        color: var(--navy);
        font-weight: 700;
      }

      h1 {
        margin: 0 0 10px;
        font-size: 36px;
        line-height: 1.08;
      }

      .hero-copy {
        margin: 0;
        max-width: 62ch;
        color: var(--muted);
        line-height: 1.6;
      }

      .hero-meta {
        display: grid;
        gap: 14px;
        padding: 28px;
      }

      .run-badge {
        width: fit-content;
        padding: 10px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: rgba(19, 58, 114, 0.1);
        color: var(--navy);
      }

      .run-badge--failed, .run-badge--interrupted, .run-badge--timedout { background: rgba(176, 48, 75, 0.12); color: var(--danger); }
      .run-badge--passed { background: rgba(25, 122, 82, 0.12); color: var(--success); }

      .hero-meta dl {
        margin: 0;
        display: grid;
        gap: 12px;
      }

      .hero-meta div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-size: 14px;
      }

      .hero-meta dt {
        color: var(--muted);
      }

      .hero-meta dd {
        margin: 0;
        font-weight: 700;
        text-align: right;
      }

      .summary-grid, .links-grid {
        display: grid;
        gap: 18px;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        margin-bottom: 24px;
      }

      .panel {
        padding: 22px;
      }

      .panel-label {
        margin: 0 0 12px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .panel-value {
        margin: 0;
        font-size: 30px;
        font-weight: 800;
      }

      .panel-note {
        margin: 10px 0 0;
        color: var(--muted);
        line-height: 1.5;
      }

      .link-panel {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 18px;
        min-height: 164px;
      }

      .link-action {
        width: fit-content;
        padding: 12px 16px;
        border-radius: 14px;
        background: linear-gradient(135deg, #133a72 0%, #2759a7 100%);
        color: #fff;
        font-weight: 700;
        box-shadow: 0 14px 28px rgba(19, 58, 114, 0.2);
      }

      .toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        display: grid;
        gap: 16px;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        padding: 18px 22px;
        margin-bottom: 24px;
      }

      .toolbar input {
        width: 100%;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.9);
        font-size: 15px;
      }

      .filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .filter-button {
        border: none;
        cursor: pointer;
        padding: 12px 14px;
        border-radius: 999px;
        background: rgba(19, 58, 114, 0.08);
        color: var(--navy);
        font-weight: 700;
      }

      .filter-button.is-active {
        background: var(--navy);
        color: #fff;
      }

      .tests-grid {
        display: grid;
        gap: 18px;
      }

      .test-card {
        padding: 22px;
      }

      .test-card__header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .project-name {
        margin: 0 0 6px;
        color: var(--navy);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
      }

      h2 {
        margin: 0 0 8px;
        font-size: 22px;
        line-height: 1.3;
      }

      .file-path {
        margin: 0;
        color: var(--muted);
      }

      .status-pill {
        white-space: nowrap;
        padding: 10px 14px;
        border-radius: 999px;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.08em;
      }

      .status-pill--passed { background: rgba(25, 122, 82, 0.12); color: var(--success); }
      .status-pill--failed, .status-pill--interrupted, .status-pill--timedout { background: rgba(176, 48, 75, 0.12); color: var(--danger); }
      .status-pill--skipped { background: rgba(138, 101, 0, 0.12); color: var(--warning); }

      .metric-row, .tag-row, .artifact-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .metric-row {
        margin-bottom: 16px;
        color: var(--muted);
      }

      .metric-row span {
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(19, 58, 114, 0.06);
      }

      .tag-row {
        margin-bottom: 16px;
      }

      .tag-chip, .artifact-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
      }

      .tag-chip {
        background: rgba(39, 89, 167, 0.1);
        color: var(--navy);
      }

      .artifact-chip {
        background: rgba(16, 35, 63, 0.08);
        color: var(--text);
      }

      .artifact-chip--image { background: rgba(39, 89, 167, 0.12); color: var(--navy); }
      .artifact-chip--video { background: rgba(25, 122, 82, 0.12); color: var(--success); }
      .artifact-chip--trace { background: rgba(138, 101, 0, 0.14); color: var(--warning); }

      .card-section {
        margin-top: 18px;
      }

      .card-section h3 {
        margin: 0 0 10px;
        font-size: 15px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }

      .preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-top: 18px;
      }

      .image-preview, .video-preview {
        width: 100%;
        min-height: 160px;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid var(--border);
        background: #dce6f7;
      }

      .image-preview img, .video-preview {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .step-list {
        margin: 0;
        padding-left: 18px;
        color: var(--muted);
        display: grid;
        gap: 8px;
      }

      .error-box {
        border: 1px solid rgba(176, 48, 75, 0.16);
        background: rgba(176, 48, 75, 0.06);
        border-radius: 18px;
        padding: 14px 16px;
        color: var(--danger);
      }

      .error-box p {
        margin: 0;
        line-height: 1.6;
      }

      .meta-muted {
        color: var(--muted);
      }

      .hidden {
        display: none;
      }

      .empty-state {
        padding: 48px 28px;
        text-align: center;
      }

      @media (max-width: 900px) {
        .hero, .toolbar {
          grid-template-columns: 1fr;
        }

        .test-card__header {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <article class="hero-card">
          <p class="eyebrow">Gadget Seva Hub</p>
          <h1>${escapeHtml(this.reportTitle)}</h1>
          <p class="hero-copy">Execution media, Playwright HTML output, and Allure analytics are collected in one place after the full suite finishes. Use this dashboard for the quick readout, then drill into the linked reports for deeper debugging.</p>
        </article>
        <article class="hero-card hero-meta">
          <span class="run-badge run-badge--${escapeHtml(toStatusKey(result.status))}">${escapeHtml(result.status)}</span>
          <dl>
            <div><dt>Total tests</dt><dd>${totalTests}</dd></div>
            <div><dt>Pass rate</dt><dd>${passRate}%</dd></div>
            <div><dt>Duration</dt><dd>${escapeHtml(formatDuration(durationMs))}</dd></div>
            <div><dt>Projects</dt><dd>${escapeHtml(projects.join(', ') || 'none')}</dd></div>
          </dl>
        </article>
      </section>

      <section class="summary-grid">
        <article class="panel">
          <p class="panel-label">Passed</p>
          <p class="panel-value">${passedCount}</p>
          <p class="panel-note">Stable runs that matched the expected outcome.</p>
        </article>
        <article class="panel">
          <p class="panel-label">Needs Attention</p>
          <p class="panel-value">${failingCount}</p>
          <p class="panel-note">Failed, timed out, or interrupted executions needing review.</p>
        </article>
        <article class="panel">
          <p class="panel-label">Skipped</p>
          <p class="panel-value">${skippedCount}</p>
          <p class="panel-note">Tests intentionally not executed in this pass.</p>
        </article>
        <article class="panel">
          <p class="panel-label">Flaky</p>
          <p class="panel-value">${flakyCount}</p>
          <p class="panel-note">Flows that recovered on retry and still deserve attention.</p>
        </article>
      </section>

      <section class="links-grid">
        <article class="panel link-panel">
          <div>
            <p class="panel-label">Playwright HTML</p>
            <p class="panel-note">Open the native Playwright report with step logs, attachments, and trace integration.</p>
          </div>
          <a class="link-action" href="${escapeHtml(this.playwrightReportPath)}" target="_blank" rel="noreferrer">Open Playwright Report</a>
        </article>
        <article class="panel link-panel">
          <div>
            <p class="panel-label">Allure Analytics</p>
            <p class="panel-note">Use Allure for trend-style diagnostics, attachments, and execution drill-downs.</p>
          </div>
          <a class="link-action" href="${escapeHtml(this.allureReportPath)}" target="_blank" rel="noreferrer">Open Allure Report</a>
        </article>
        <article class="panel link-panel">
          <div>
            <p class="panel-label">Captured Media</p>
            <p class="panel-note">Screenshots and videos are attached at test level and surfaced below for quick access.</p>
          </div>
          <a class="link-action" href="../test-results/" target="_blank" rel="noreferrer">Open Test Artifacts</a>
        </article>
      </section>

      <section class="panel toolbar">
        <input id="searchInput" type="search" placeholder="Search by test title, tag, project, or file" />
        <div class="filter-row">
          <button class="filter-button is-active" data-filter="all" type="button">All</button>
          <button class="filter-button" data-filter="passed" type="button">Passed</button>
          <button class="filter-button" data-filter="failed" type="button">Failed</button>
          <button class="filter-button" data-filter="timedout" type="button">Timed Out</button>
          <button class="filter-button" data-filter="skipped" type="button">Skipped</button>
        </div>
      </section>

      <section class="tests-grid" id="testsGrid">
        ${cardsMarkup}
      </section>
    </div>
    <script>
      const searchInput = document.getElementById('searchInput');
      const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
      const cards = Array.from(document.querySelectorAll('.test-card'));
      let activeFilter = 'all';

      function applyFilters() {
        const searchTerm = (searchInput?.value ?? '').trim().toLowerCase();

        for (const card of cards) {
          const status = card.dataset.status ?? '';
          const searchableText = card.dataset.search ?? '';
          const matchesFilter = activeFilter === 'all' || status === activeFilter;
          const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
          card.classList.toggle('hidden', !(matchesFilter && matchesSearch));
        }
      }

      for (const button of filterButtons) {
        button.addEventListener('click', () => {
          activeFilter = button.dataset.filter ?? 'all';
          for (const candidate of filterButtons) {
            candidate.classList.toggle('is-active', candidate === button);
          }
          applyFilters();
        });
      }

      searchInput?.addEventListener('input', applyFilters);
      applyFilters();
    </script>
  </body>
</html>`;

    fs.writeFileSync(path.resolve(this.outputFolder, 'dashboard-data.json'), JSON.stringify(dashboardData, null, 2), 'utf8');
    fs.writeFileSync(path.resolve(this.outputFolder, 'index.html'), html, 'utf8');
  }
}

export default CustomTTAReporter;
