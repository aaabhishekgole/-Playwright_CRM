function inferBrowserFromProject(projectName = '') {
  const normalized = String(projectName).toLowerCase();

  if (normalized.includes('webkit')) {
    return 'WebKit';
  }

  if (normalized.includes('firefox')) {
    return 'Firefox';
  }

  if (normalized.includes('edge')) {
    return 'Edge';
  }

  return 'Chrome';
}

function toReadableStatus(status = 'unknown') {
  const normalized = String(status).toLowerCase();

  if (normalized === 'expected' || normalized === 'passed') {
    return 'Passed';
  }

  if (normalized === 'skipped') {
    return 'Skipped';
  }

  if (normalized === 'timedout') {
    return 'Timed Out';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function buildRunFromPlaywrightJson(payload, fallbackName = 'Latest Run') {
  const suites = Array.isArray(payload?.suites) ? payload.suites : [];
  const stats = payload?.stats ?? {};
  const metadata = payload?.config?.metadata ?? payload?.metadata ?? {};
  const startedAt = metadata.actualStartTime || metadata.startTime || new Date().toISOString();
  const durationMs = Number(stats.duration ?? payload?.duration ?? 0);
  const tests = [];
  const browserMap = new Map();

  function walkSuite(nodes, fileLabel = '') {
    for (const suite of nodes || []) {
      const nextFile = suite?.file || fileLabel;

      if (Array.isArray(suite?.specs) && suite.specs.length) {
        for (const spec of suite.specs) {
          for (const test of spec?.tests || []) {
            const projectName = test?.projectName || test?.project?.name || 'chromium';
            const browser = inferBrowserFromProject(projectName);
            const results = Array.isArray(test?.results) ? test.results : [];
            const lastResult = results[results.length - 1] || {};
            const outcome = String(test?.outcome || lastResult?.status || 'unknown').toLowerCase();
            const durationSeconds = Number(lastResult?.duration ?? 0) / 1000;
            const errors = Array.isArray(lastResult?.errors) ? lastResult.errors : [];
            const firstError = errors[0]?.message || lastResult?.error?.message || 'Execution failed';
            const retryCount = results.filter((entry) => Number(entry?.retry ?? 0) > 0).length;
            const flaky = outcome === 'flaky' || retryCount > 0;
            const testStatus = toReadableStatus(outcome);

            tests.push({
              title: spec?.title || test?.title || 'Unnamed Test',
              browser,
              file: nextFile || 'tests/unknown.spec.ts',
              duration: `${durationSeconds.toFixed(1)}s`,
              status: testStatus,
              flaky,
              error: testStatus === 'Passed' || testStatus === 'Skipped' ? '' : firstError,
            });

            const browserTotals = browserMap.get(browser) || {
              name: browser,
              project: projectName,
              total: 0,
              passed: 0,
              failed: 0,
              skipped: 0,
            };

            browserTotals.total += 1;

            if (testStatus === 'Passed') {
              browserTotals.passed += 1;
            } else if (testStatus === 'Skipped') {
              browserTotals.skipped += 1;
            } else {
              browserTotals.failed += 1;
            }

            browserMap.set(browser, browserTotals);
          }
        }
      }

      if (Array.isArray(suite?.suites) && suite.suites.length) {
        walkSuite(suite.suites, nextFile);
      }
    }
  }

  walkSuite(suites);

  const totalTests =
    Number(stats.expected ?? 0) +
      Number(stats.unexpected ?? 0) +
      Number(stats.skipped ?? 0) +
      Number(stats.flaky ?? 0) || tests.length;
  const passed = Number(stats.expected ?? 0) || tests.filter((test) => test.status === 'Passed').length;
  const failed =
    Number(stats.unexpected ?? 0) + Number(stats.flaky ?? 0) ||
    tests.filter((test) => !['Passed', 'Skipped'].includes(test.status)).length;
  const skipped = Number(stats.skipped ?? 0) || tests.filter((test) => test.status === 'Skipped').length;
  const runName = metadata.runName || payload?.name || fallbackName;

  return {
    id: `generated-${Date.now()}`,
    name: runName,
    runDate: new Date(startedAt).toLocaleString('en-IN', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      second: '2-digit',
      year: 'numeric',
    }),
    totalDurationSeconds: durationMs ? durationMs / 1000 : 0,
    avgTestTimeSeconds: totalTests ? (durationMs ? durationMs / 1000 : 0) / totalTests : 0,
    totalTests,
    passed,
    failed,
    skipped,
    browserBreakdown: Array.from(browserMap.values()),
    failedTests: tests.filter((test) => !['Passed', 'Skipped'].includes(test.status)),
  };
}
