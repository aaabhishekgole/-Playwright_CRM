import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import reportDashboardData from "virtual:report-dashboard-data";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileJson,
  Filter,
  LayoutDashboard,
  Monitor,
  Moon,
  PlayCircle,
  RefreshCcw,
  Search,
  ShieldAlert,
  SkipForward,
  Sun,
  Timer,
  TrendingUp,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const demoRuns = [
  {
    id: "run-2025-06-01-1728",
    name: "Latest Run",
    runDate: "2025-06-01 05:28 PM",
    totalDurationSeconds: 151.6,
    avgTestTimeSeconds: 1.3,
    totalTests: 116,
    passed: 108,
    failed: 8,
    skipped: 0,
    browserBreakdown: [
      { name: "Chrome", project: "chromium", total: 29, passed: 27, failed: 2, skipped: 0 },
      { name: "Edge", project: "chromium", total: 29, passed: 27, failed: 2, skipped: 0 },
      { name: "Firefox", project: "firefox", total: 29, passed: 27, failed: 2, skipped: 0 },
      { name: "WebKit", project: "webkit", total: 29, passed: 27, failed: 2, skipped: 0 },
    ],
    failedTests: [
      { title: "Checkout > should validate saved card payment", browser: "Chrome", file: "tests/checkout.spec.ts", duration: "2.8s", status: "Failed", flaky: true, error: "Timeout waiting for payment success banner." },
      { title: "Login > should block invalid OTP reuse", browser: "Edge", file: "tests/auth.spec.ts", duration: "1.9s", status: "Failed", flaky: false, error: "Expected 401 but received 200." },
      { title: "Refund > should show completed refund status", browser: "Firefox", file: "tests/refund.spec.ts", duration: "2.1s", status: "Failed", flaky: true, error: "Locator matched hidden status badge." },
      { title: "Merchant > should save fee configuration", browser: "WebKit", file: "tests/merchant-config.spec.ts", duration: "3.2s", status: "Failed", flaky: false, error: "Element detached during click action." },
      { title: "Payout > should validate beneficiary account", browser: "Chrome", file: "tests/payout.spec.ts", duration: "2.4s", status: "Failed", flaky: false, error: "Bank validation API returned 500." },
      { title: "Settlement > should generate summary report", browser: "Edge", file: "tests/settlement.spec.ts", duration: "4.0s", status: "Failed", flaky: true, error: "Report download event not triggered." },
      { title: "Dashboard > should load transaction widgets", browser: "Firefox", file: "tests/dashboard.spec.ts", duration: "1.5s", status: "Failed", flaky: false, error: "Widget API exceeded response SLA." },
      { title: "Reconciliation > should mark matched records", browser: "WebKit", file: "tests/recon.spec.ts", duration: "2.7s", status: "Failed", flaky: true, error: "Expected matched count 12 but found 11." },
    ],
  },
  {
    id: "run-2025-05-31-1030",
    name: "Previous Run",
    runDate: "2025-05-31 10:30 AM",
    totalDurationSeconds: 164.2,
    avgTestTimeSeconds: 1.4,
    totalTests: 116,
    passed: 104,
    failed: 10,
    skipped: 2,
    browserBreakdown: [
      { name: "Chrome", project: "chromium", total: 29, passed: 26, failed: 3, skipped: 0 },
      { name: "Edge", project: "chromium", total: 29, passed: 26, failed: 2, skipped: 1 },
      { name: "Firefox", project: "firefox", total: 29, passed: 26, failed: 2, skipped: 1 },
      { name: "WebKit", project: "webkit", total: 29, passed: 26, failed: 3, skipped: 0 },
    ],
    failedTests: [
      { title: "Checkout > should validate saved card payment", browser: "Chrome", file: "tests/checkout.spec.ts", duration: "2.9s", status: "Failed", flaky: true, error: "Timeout waiting for payment success banner." },
      { title: "Refund > should show completed refund status", browser: "Firefox", file: "tests/refund.spec.ts", duration: "2.0s", status: "Failed", flaky: true, error: "Locator matched hidden status badge." },
      { title: "Merchant > should save fee configuration", browser: "WebKit", file: "tests/merchant-config.spec.ts", duration: "3.1s", status: "Failed", flaky: false, error: "Element detached during click action." },
      { title: "Login > should block invalid OTP reuse", browser: "Edge", file: "tests/auth.spec.ts", duration: "1.8s", status: "Failed", flaky: false, error: "Expected 401 but received 200." },
      { title: "Reconciliation > should mark matched records", browser: "WebKit", file: "tests/recon.spec.ts", duration: "2.5s", status: "Failed", flaky: true, error: "Expected matched count 12 but found 11." },
      { title: "Payout > should validate beneficiary account", browser: "Chrome", file: "tests/payout.spec.ts", duration: "2.3s", status: "Failed", flaky: false, error: "Bank validation API returned 500." },
      { title: "Settlement > should generate summary report", browser: "Edge", file: "tests/settlement.spec.ts", duration: "4.1s", status: "Failed", flaky: true, error: "Report download event not triggered." },
      { title: "Dashboard > should load transaction widgets", browser: "Firefox", file: "tests/dashboard.spec.ts", duration: "1.6s", status: "Failed", flaky: false, error: "Widget API exceeded response SLA." },
      { title: "Profile > should update merchant email", browser: "Chrome", file: "tests/profile.spec.ts", duration: "2.4s", status: "Failed", flaky: false, error: "Success toast did not appear." },
      { title: "Onboarding > should submit KYC docs", browser: "WebKit", file: "tests/onboarding.spec.ts", duration: "3.8s", status: "Failed", flaky: true, error: "Upload progress remained stuck at 90%." },
    ],
  },
  {
    id: "run-2025-05-30-1830",
    name: "Baseline Run",
    runDate: "2025-05-30 06:30 PM",
    totalDurationSeconds: 176.8,
    avgTestTimeSeconds: 1.6,
    totalTests: 116,
    passed: 101,
    failed: 12,
    skipped: 3,
    browserBreakdown: [
      { name: "Chrome", project: "chromium", total: 29, passed: 25, failed: 3, skipped: 1 },
      { name: "Edge", project: "chromium", total: 29, passed: 25, failed: 3, skipped: 1 },
      { name: "Firefox", project: "firefox", total: 29, passed: 26, failed: 2, skipped: 1 },
      { name: "WebKit", project: "webkit", total: 29, passed: 25, failed: 4, skipped: 0 },
    ],
    failedTests: [
      { title: "Checkout > should validate saved card payment", browser: "Chrome", file: "tests/checkout.spec.ts", duration: "3.1s", status: "Failed", flaky: true, error: "Timeout waiting for payment success banner." },
      { title: "Refund > should show completed refund status", browser: "Firefox", file: "tests/refund.spec.ts", duration: "2.2s", status: "Failed", flaky: true, error: "Locator matched hidden status badge." },
      { title: "Merchant > should save fee configuration", browser: "WebKit", file: "tests/merchant-config.spec.ts", duration: "3.3s", status: "Failed", flaky: false, error: "Element detached during click action." },
      { title: "Login > should block invalid OTP reuse", browser: "Edge", file: "tests/auth.spec.ts", duration: "2.0s", status: "Failed", flaky: false, error: "Expected 401 but received 200." },
      { title: "Reconciliation > should mark matched records", browser: "WebKit", file: "tests/recon.spec.ts", duration: "2.9s", status: "Failed", flaky: true, error: "Expected matched count 12 but found 11." },
      { title: "Payout > should validate beneficiary account", browser: "Chrome", file: "tests/payout.spec.ts", duration: "2.7s", status: "Failed", flaky: false, error: "Bank validation API returned 500." },
      { title: "Settlement > should generate summary report", browser: "Edge", file: "tests/settlement.spec.ts", duration: "4.5s", status: "Failed", flaky: true, error: "Report download event not triggered." },
      { title: "Dashboard > should load transaction widgets", browser: "Firefox", file: "tests/dashboard.spec.ts", duration: "1.7s", status: "Failed", flaky: false, error: "Widget API exceeded response SLA." },
      { title: "Onboarding > should submit KYC docs", browser: "WebKit", file: "tests/onboarding.spec.ts", duration: "4.0s", status: "Failed", flaky: true, error: "Upload progress remained stuck at 90%." },
      { title: "Profile > should update merchant email", browser: "Chrome", file: "tests/profile.spec.ts", duration: "2.5s", status: "Failed", flaky: false, error: "Success toast did not appear." },
      { title: "Transactions > should filter by date range", browser: "Edge", file: "tests/transactions.spec.ts", duration: "2.8s", status: "Failed", flaky: false, error: "Date filter request payload mismatch." },
      { title: "Reports > should export CSV", browser: "WebKit", file: "tests/reports.spec.ts", duration: "3.7s", status: "Failed", flaky: true, error: "CSV blob download interrupted." },
    ],
  },
];

const seededRuns =
  Array.isArray(reportDashboardData?.initialRuns) && reportDashboardData.initialRuns.length
    ? reportDashboardData.initialRuns
    : demoRuns;
const reportLinks = reportDashboardData?.reportLinks || {};
const reportSourceLabel = reportDashboardData?.sourceLabel || "Demo or imported Playwright JSON";
const liveDataAvailable = Boolean(reportDashboardData?.initialRuns?.length);
const dashboardGeneratedAt = reportDashboardData?.generatedAt
  ? new Date(reportDashboardData.generatedAt).toLocaleString("en-IN", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      second: "2-digit",
      year: "numeric",
    })
  : "";

const themeStyles = {
  light: {
    page: "bg-[#f0f4ff] text-slate-900",
    panel: "bg-white border-slate-200",
    softPanel: "bg-slate-50 border-slate-200",
    textMuted: "text-slate-500",
    textSoft: "text-slate-600",
    chartGrid: "#e2e8f0",
  },
  dark: {
    page: "cyber-bg text-slate-100",
    panel: "cyber-panel",
    softPanel: "bg-[#070d1a] border-[rgba(0,212,255,0.12)]",
    textMuted: "text-slate-400",
    textSoft: "text-slate-300",
    chartGrid: "#0f1f35",
  },
};

function formatSeconds(value) {
  return `${value.toFixed(1)}s`;
}

function safePercent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

function inferBrowserFromProject(projectName = "") {
  const normalized = String(projectName).toLowerCase();
  if (normalized.includes("webkit")) return "WebKit";
  if (normalized.includes("firefox")) return "Firefox";
  if (normalized.includes("edge")) return "Edge";
  return "Chrome";
}

function buildRunsFromPlaywrightJson(payload) {
  const suites = Array.isArray(payload?.suites) ? payload.suites : [];
  const stats = payload?.stats ?? {};
  const startedAt = payload?.metadata?.actualStartTime || payload?.metadata?.startTime || new Date().toISOString();
  const durationMs = Number(stats?.duration ?? payload?.duration ?? 0);
  const testAccumulator = [];
  const browserMap = new Map();

  function walkSuite(nodes, fileLabel = "") {
    (nodes || []).forEach((suite) => {
      const nextFile = suite?.file || fileLabel;
      if (Array.isArray(suite?.specs) && suite.specs.length) {
        suite.specs.forEach((spec) => {
          (spec?.tests || []).forEach((test) => {
            const projectName = test?.projectName || test?.project?.name || "chromium";
            const browser = inferBrowserFromProject(projectName);
            const results = Array.isArray(test?.results) ? test.results : [];
            const lastResult = results[results.length - 1] || {};
            const status = (test?.outcome || lastResult?.status || "unknown").toLowerCase();
            const duration = Number(lastResult?.duration ?? 0) / 1000;
            const errorMessage = Array.isArray(lastResult?.errors) && lastResult.errors.length
              ? (lastResult.errors[0]?.message || "Execution failed")
              : (lastResult?.error?.message || "Execution failed");
            const retryCount = results.filter((item) => item?.retry > 0).length;
            const flaky = status === "flaky" || retryCount > 0;

            testAccumulator.push({
              title: spec?.title || test?.title || "Unnamed Test",
              browser,
              file: nextFile || "tests/unknown.spec.ts",
              duration: `${duration.toFixed(1)}s`,
              status: status === "expected" ? "Passed" : status.charAt(0).toUpperCase() + status.slice(1),
              flaky,
              error: status === "passed" || status === "expected" ? "" : errorMessage,
            });

            const existing = browserMap.get(browser) || { name: browser, project: projectName, total: 0, passed: 0, failed: 0, skipped: 0 };
            existing.total += 1;
            if (["passed", "expected"].includes(status)) existing.passed += 1;
            else if (["skipped", "interrupted"].includes(status)) existing.skipped += 1;
            else existing.failed += 1;
            browserMap.set(browser, existing);
          });
        });
      }
      if (Array.isArray(suite?.suites) && suite.suites.length) {
        walkSuite(suite.suites, nextFile);
      }
    });
  }

  walkSuite(suites);

  const totalTests = Number(stats?.expected ?? 0) + Number(stats?.unexpected ?? 0) + Number(stats?.skipped ?? 0) || testAccumulator.length;
  const passed = Number(stats?.expected ?? 0) || testAccumulator.filter((t) => t.status === "Passed").length;
  const failed = Number(stats?.unexpected ?? 0) || testAccumulator.filter((t) => !["Passed", "Skipped"].includes(t.status)).length;
  const skipped = Number(stats?.skipped ?? 0) || testAccumulator.filter((t) => t.status === "Skipped").length;

  return {
    id: `imported-${Date.now()}`,
    name: payload?.config?.metadata?.runName || "Imported Run",
    runDate: new Date(startedAt).toLocaleString(),
    totalDurationSeconds: durationMs ? durationMs / 1000 : 0,
    avgTestTimeSeconds: totalTests ? ((durationMs ? durationMs / 1000 : 0) / totalTests) : 0,
    totalTests,
    passed,
    failed,
    skipped,
    browserBreakdown: Array.from(browserMap.values()),
    failedTests: testAccumulator.filter((t) => !["Passed", "Skipped"].includes(t.status)),
  };
}

function StatCard({ title, value, subtext, icon: Icon, valueClassName = "", panelClass = "", mutedClass = "", accentClass = "", iconColor = "#00d4ff" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className={`rounded-2xl border shadow-sm ${panelClass} ${accentClass}`} style={{ position: "relative", overflow: "hidden" }}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-xs font-medium tracking-widest uppercase mono ${mutedClass}`}>{title}</p>
              <p className={`mt-2 text-3xl font-bold mono ${valueClassName}`}>{value}</p>
              <p className={`mt-1 text-xs ${mutedClass}`}>{subtext}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}40` }}>
              <Icon className="h-5 w-5" style={{ color: iconColor }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PlaywrightPulseDashboard() {
  const [theme, setTheme] = useState("dark");
  const [runs, setRuns] = useState(seededRuns);
  const [selectedRunId, setSelectedRunId] = useState(seededRuns[0].id);
  const [browserFilter, setBrowserFilter] = useState("all");
  const [failedSearch, setFailedSearch] = useState("");
  const fileInputRef = useRef(null);

  const styles = themeStyles[theme];

  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedRunId) || runs[0], [runs, selectedRunId]);

  const passRate = safePercent(selectedRun?.passed, selectedRun?.totalTests);
  const failRate = safePercent(selectedRun?.failed, selectedRun?.totalTests);
  const skipRate = safePercent(selectedRun?.skipped, selectedRun?.totalTests);

  const pieData = useMemo(
    () => [
      { name: "Passed", value: selectedRun?.passed || 0 },
      { name: "Failed", value: selectedRun?.failed || 0 },
      { name: "Skipped", value: selectedRun?.skipped || 0 },
    ].filter((item) => item.value > 0),
    [selectedRun]
  );

  const trendData = useMemo(
    () => runs.slice().reverse().map((run, index) => ({
      label: `Run ${index + 1}`,
      name: run.name,
      passRate: safePercent(run.passed, run.totalTests),
      failRate: safePercent(run.failed, run.totalTests),
      duration: Number(run.totalDurationSeconds.toFixed(1)),
    })),
    [runs]
  );

  const browserHistory = useMemo(() => {
    const order = runs.slice().reverse();
    return order.map((run, index) => {
      const row = { label: `Run ${index + 1}` };
      run.browserBreakdown.forEach((browser) => {
        row[browser.name] = safePercent(browser.passed, browser.total);
      });
      return row;
    });
  }, [runs]);

  const flakyTrendMap = useMemo(() => {
    const map = new Map();
    runs.forEach((run) => {
      run.failedTests.forEach((test) => {
        const entry = map.get(test.title) || { title: test.title, count: 0, browsers: new Set(), file: test.file };
        if (test.flaky) entry.count += 1;
        entry.browsers.add(test.browser);
        map.set(test.title, entry);
      });
    });
    return Array.from(map.values())
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((item) => ({ ...item, browsers: Array.from(item.browsers).join(", ") }));
  }, [runs]);

  const filteredFailedTests = useMemo(() => {
    return (selectedRun?.failedTests || []).filter((test) => {
      const browserMatch = browserFilter === "all" || test.browser === browserFilter;
      const searchMatch = !failedSearch || [test.title, test.file, test.error].join(" ").toLowerCase().includes(failedSearch.toLowerCase());
      return browserMatch && searchMatch;
    });
  }, [selectedRun, browserFilter, failedSearch]);

  const aiInsights = useMemo(() => {
    const flakyCount = selectedRun.failedTests.filter((test) => test.flaky).length;
    const worstBrowser = selectedRun.browserBreakdown.slice().sort((a, b) => b.failed - a.failed)[0];
    return [
      `${passRate}% pass rate indicates ${passRate >= 90 ? "strong" : "moderate"} suite stability for the selected run.`,
      `${flakyCount} failed tests look flaky based on repeated appearance or retry-driven behavior.`,
      `${worstBrowser?.name || "Current browser"} has the highest failure count in this run and should be prioritized.`,
      liveDataAvailable
        ? "Playwright HTML and Allure links stay aligned with this generated run for fast drill-down."
        : "Build the report after a suite run to replace demo data automatically, or import Playwright JSON manually.",
    ];
  }, [selectedRun, passRate]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const importedRun = buildRunsFromPlaywrightJson(payload);
      setRuns((prev) => [importedRun, ...prev]);
      setSelectedRunId(importedRun.id);
    } catch (error) {
      console.error("Invalid Playwright JSON", error);
      alert("Could not parse the uploaded JSON file. Please upload a valid Playwright JSON report.");
    } finally {
      event.target.value = "";
    }
  };

  const exportSummary = () => {
    const lines = [
      `Playwright Pulse Report - ${selectedRun.name}`,
      `Run Date: ${selectedRun.runDate}`,
      `Total Tests: ${selectedRun.totalTests}`,
      `Passed: ${selectedRun.passed}`,
      `Failed: ${selectedRun.failed}`,
      `Skipped: ${selectedRun.skipped}`,
      `Avg Test Time: ${formatSeconds(selectedRun.avgTestTimeSeconds)}`,
      `Run Duration: ${formatSeconds(selectedRun.totalDurationSeconds)}`,
      "",
      "Failed Tests:",
      ...selectedRun.failedTests.map((item) => `- ${item.title} | ${item.browser} | ${item.file} | ${item.error}`),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedRun.name.replace(/\s+/g, "-").toLowerCase()}-summary.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const COLORS = ["#00ff88", "#ff4444", "#fbbf24"];
  const reportLinkClass =
    theme === "dark"
      ? "inline-flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.06)] px-4 py-2 text-sm font-medium text-[#00d4ff] transition hover:bg-[rgba(0,212,255,0.12)] hover:border-[#00d4ff]"
      : "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors ${styles.page}`} style={{ position: "relative" }}>
      {theme === "dark" && <div className="scanline" />}
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className={`rounded-3xl border shadow-sm ${styles.panel}`}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-3" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.4)" }}>
                      <PlayCircle className="h-6 w-6" style={{ color: "#00d4ff" }} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight tech-heading" style={{ color: theme === "dark" ? "#00d4ff" : undefined }}>Playwright Pulse</h1>
                      <p className={`text-sm mono ${styles.textMuted}`}>Test execution dashboard · Playwright JSON · Cross-browser · Live analytics</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Select value={selectedRunId} onValueChange={setSelectedRunId}>
                    <SelectTrigger className="w-[220px] rounded-xl">
                      <SelectValue placeholder="Select run" />
                    </SelectTrigger>
                    <SelectContent>
                      {runs.map((run) => (
                        <SelectItem key={run.id} value={run.id}>{run.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="rounded-xl" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                    {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                    {theme === "light" ? "Dark Mode" : "Light Mode"}
                  </Button>

                  <Button variant="outline" className="rounded-xl" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Import JSON
                  </Button>
                  <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileUpload} />

                  <Button className="rounded-xl text-black font-semibold mono" style={{ background: "linear-gradient(135deg, #00d4ff, #00ff88)", boxShadow: "0 0 16px rgba(0,212,255,0.4)" }} onClick={exportSummary}>
                    <Download className="mr-2 h-4 w-4" /> Export Summary
                  </Button>
                </div>
              </div>

              {(reportLinks.playwright || reportLinks.allure || reportLinks.rawJson) && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {reportLinks.playwright && (
                    <a className={reportLinkClass} href={reportLinks.playwright} rel="noreferrer" target="_blank">
                      <LayoutDashboard className="h-4 w-4" style={{ color: "#00d4ff" }} /> Open Playwright HTML
                    </a>
                  )}
                  {reportLinks.allure && (
                    <a className={reportLinkClass} href={reportLinks.allure} rel="noreferrer" target="_blank">
                      <TrendingUp className="h-4 w-4" style={{ color: "#00ff88" }} /> Open Allure Report
                    </a>
                  )}
                  {reportLinks.rawJson && (
                    <a className={reportLinkClass} href={reportLinks.rawJson} rel="noreferrer" target="_blank">
                      <FileJson className="h-4 w-4" style={{ color: "#a855f7" }} /> Open Raw JSON
                    </a>
                  )}
                </div>
              )}

              <div className={`mt-5 grid grid-cols-1 gap-3 rounded-2xl border p-4 md:grid-cols-4 ${styles.softPanel}`}>
                <div>
                  <div className={`text-xs uppercase tracking-wide ${styles.textMuted}`}>Run date</div>
                  <div className="mt-1 font-semibold">{selectedRun.runDate}</div>
                </div>
                <div>
                  <div className={`text-xs uppercase tracking-wide ${styles.textMuted}`}>Duration</div>
                  <div className="mt-1 font-semibold">{formatSeconds(selectedRun.totalDurationSeconds)}</div>
                </div>
                <div>
                  <div className={`text-xs uppercase tracking-wide ${styles.textMuted}`}>Average test time</div>
                  <div className="mt-1 font-semibold">{formatSeconds(selectedRun.avgTestTimeSeconds)}</div>
                </div>
                <div>
                  <div className={`text-xs uppercase tracking-wide ${styles.textMuted}`}>Source</div>
                  <div className="mt-1 flex items-center gap-2 font-semibold mono"><FileJson className="h-4 w-4" style={{ color: "#00d4ff" }} /> {reportSourceLabel}</div>
                  {dashboardGeneratedAt && <div className={`mt-1 text-xs ${styles.textMuted}`}>Built {dashboardGeneratedAt}</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Total Tests" value={selectedRun.totalTests} subtext="Executed in current run" icon={BarChart3} iconColor="#00d4ff" accentClass="stat-card-time" panelClass={styles.panel} mutedClass={styles.textMuted} valueClassName="neon-text-cyan" />
          <StatCard title="Passed" value={selectedRun.passed} subtext={`${passRate}% success rate`} icon={CheckCircle2} iconColor="#00ff88" accentClass="stat-card-passed" panelClass={styles.panel} mutedClass={styles.textMuted} valueClassName="neon-text-green" />
          <StatCard title="Failed" value={selectedRun.failed} subtext={`${failRate}% failed`} icon={ShieldAlert} iconColor="#ff4444" accentClass="stat-card-failed" panelClass={styles.panel} mutedClass={styles.textMuted} valueClassName="neon-text-red" />
          <StatCard title="Skipped" value={selectedRun.skipped} subtext={`${skipRate}% skipped`} icon={SkipForward} iconColor="#fbbf24" accentClass="stat-card-skipped" panelClass={styles.panel} mutedClass={styles.textMuted} valueClassName="text-amber-400" />
          <StatCard title="Avg. Test Time" value={formatSeconds(selectedRun.avgTestTimeSeconds)} subtext="Average execution speed" icon={Clock3} iconColor="#a855f7" accentClass="stat-card-rate" panelClass={styles.panel} mutedClass={styles.textMuted} valueClassName="text-purple-400 mono" />
          <StatCard title="Run Duration" value={formatSeconds(selectedRun.totalDurationSeconds)} subtext="End-to-end suite time" icon={Timer} iconColor="#00d4ff" accentClass="stat-card-time" panelClass={styles.panel} mutedClass={styles.textMuted} valueClassName="neon-text-cyan" />
        </div>

        <Tabs defaultValue="dashboard" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl md:grid-cols-5">
            <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</TabsTrigger>
            <TabsTrigger value="summary"><ChevronRight className="mr-2 h-4 w-4" />Summary</TabsTrigger>
            <TabsTrigger value="history"><TrendingUp className="mr-2 h-4 w-4" />History</TabsTrigger>
            <TabsTrigger value="failures"><AlertTriangle className="mr-2 h-4 w-4" />Failures</TabsTrigger>
            <TabsTrigger value="ai"><RefreshCcw className="mr-2 h-4 w-4" />AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <Card className={`rounded-3xl border shadow-sm xl:col-span-2 ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>Test Distribution</CardTitle>
                  <CardDescription className={styles.textMuted}>Overall result split for the selected run</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mx-auto h-[320px] w-full max-w-md">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={78} outerRadius={110} dataKey="value" stroke="none" paddingAngle={3}>
                          {pieData.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="-mt-44 flex justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold mono neon-text-green">{passRate}%</div>
                      <div className={`text-xs tracking-widest uppercase mono ${styles.textMuted}`}>Pass Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`rounded-3xl border shadow-sm xl:col-span-3 ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>Browser Test Suites</CardTitle>
                  <CardDescription className={styles.textMuted}>Cross-browser execution breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {selectedRun.browserBreakdown.map((suite) => (
                      <div key={suite.name} className={`rounded-2xl border p-4 ${styles.softPanel}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{suite.name}</h3>
                            <p className={`mt-1 text-sm ${styles.textMuted}`}>{suite.total} tests</p>
                          </div>
                          <Badge variant="secondary" className="rounded-lg">{suite.project}</Badge>
                        </div>
                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className={styles.textMuted}>Pass ratio</span>
                              <span className="font-medium">{safePercent(suite.passed, suite.total)}%</span>
                            </div>
                            <Progress value={safePercent(suite.passed, suite.total)} className="h-2" />
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-green-500">Passed: {suite.passed}</span>
                            <span className="text-red-500">Failed: {suite.failed}</span>
                            <span className="text-amber-500">Skipped: {suite.skipped}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className={`rounded-3xl border shadow-sm xl:col-span-2 ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>Run Trend</CardTitle>
                  <CardDescription className={styles.textMuted}>Pass rate and failure rate across recent runs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} />
                        <XAxis dataKey="label" stroke={theme === "dark" ? "#cbd5e1" : "#475569"} />
                        <YAxis stroke={theme === "dark" ? "#cbd5e1" : "#475569"} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="passRate" stroke="#22c55e" strokeWidth={3} />
                        <Line type="monotone" dataKey="failRate" stroke="#ef4444" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className={`rounded-3xl border shadow-sm ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>Quick Insights</CardTitle>
                  <CardDescription className={styles.textMuted}>Operational summary for sharing screenshots or status updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className={`rounded-2xl border p-4 ${styles.softPanel}`}>
                    <div className="font-semibold">Stable coverage</div>
                    <div className={`mt-1 ${styles.textSoft}`}>{passRate}% pass rate with {selectedRun.totalTests} executed tests.</div>
                  </div>
                  <div className={`rounded-2xl border p-4 ${styles.softPanel}`}>
                    <div className="font-semibold">Failure hotspots</div>
                    <div className={`mt-1 ${styles.textSoft}`}>{selectedRun.failedTests.length} failed results are available with browser and file-level details.</div>
                  </div>
                  <div className={`rounded-2xl border p-4 ${styles.softPanel}`}>
                    <div className="font-semibold">Reusable dashboard</div>
                    <div className={`mt-1 ${styles.textSoft}`}>Upload a Playwright JSON report to replace demo metrics instantly.</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className={`rounded-3xl border shadow-sm lg:col-span-2 ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>Execution Summary</CardTitle>
                  <CardDescription className={styles.textMuted}>Selected run health at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className={styles.textMuted}>Pass Rate</span><span>{passRate}%</span></div>
                    <Progress value={passRate} className="h-3" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className={styles.textMuted}>Failure Rate</span><span>{failRate}%</span></div>
                    <Progress value={failRate} className="h-3" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className={styles.textMuted}>Skipped Rate</span><span>{skipRate}%</span></div>
                    <Progress value={skipRate} className="h-3" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {selectedRun.browserBreakdown.map((browser) => (
                      <div key={browser.name} className={`rounded-2xl border p-4 ${styles.softPanel}`}>
                        <div className="flex items-center gap-2 font-semibold"><Monitor className="h-4 w-4 text-indigo-500" /> {browser.name}</div>
                        <div className={`mt-2 text-sm ${styles.textSoft}`}>Passed {browser.passed} of {browser.total} tests</div>
                        <div className={`mt-1 text-sm ${styles.textSoft}`}>Failed {browser.failed}, Skipped {browser.skipped}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={`rounded-3xl border shadow-sm ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                  <CardDescription className={styles.textMuted}>Share-ready output for leadership updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Button className="w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-600/90" onClick={exportSummary}><Download className="mr-2 h-4 w-4" /> Download Summary</Button>
                  <div className={`rounded-2xl border p-4 ${styles.softPanel}`}>
                    <div className="font-semibold">Best for screenshots</div>
                    <div className={`mt-1 ${styles.textSoft}`}>Switch to dark mode before sharing on LinkedIn or internal updates.</div>
                  </div>
                  <div className={`rounded-2xl border p-4 ${styles.softPanel}`}>
                    <div className="font-semibold">Best for project reuse</div>
                    <div className={`mt-1 ${styles.textSoft}`}>Import new JSON files from any Playwright repo without changing code structure.</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className={`rounded-3xl border shadow-sm ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>Browser History</CardTitle>
                  <CardDescription className={styles.textMuted}>Pass rate by browser across runs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={browserHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} />
                        <XAxis dataKey="label" stroke={theme === "dark" ? "#cbd5e1" : "#475569"} />
                        <YAxis stroke={theme === "dark" ? "#cbd5e1" : "#475569"} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Chrome" fill="#3b82f6" />
                        <Bar dataKey="Edge" fill="#06b6d4" />
                        <Bar dataKey="Firefox" fill="#f97316" />
                        <Bar dataKey="WebKit" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className={`rounded-3xl border shadow-sm ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>Flaky Trends</CardTitle>
                  <CardDescription className={styles.textMuted}>Tests that repeatedly show instability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {flakyTrendMap.slice(0, 8).map((item) => (
                    <div key={item.title} className={`rounded-2xl border p-4 ${styles.softPanel}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className={`mt-1 text-sm ${styles.textSoft}`}>{item.file}</div>
                        </div>
                        <Badge className="rounded-lg bg-amber-500/15 text-amber-500 hover:bg-amber-500/15">{item.count} flaky hits</Badge>
                      </div>
                      <div className={`mt-2 text-sm ${styles.textSoft}`}>Browsers: {item.browsers}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="failures" className="mt-6 space-y-6">
            <Card className={`rounded-3xl border shadow-sm ${styles.panel}`}>
              <CardHeader>
                <CardTitle>Failed Test Details</CardTitle>
                <CardDescription className={styles.textMuted}>Filter failed results by browser or keyword</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="relative md:col-span-2">
                    <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${styles.textMuted}`} />
                    <Input className="pl-9" placeholder="Search by test name, file, or error" value={failedSearch} onChange={(e) => setFailedSearch(e.target.value)} />
                  </div>
                  <Select value={browserFilter} onValueChange={setBrowserFilter}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Filter browser" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Browsers</SelectItem>
                      <SelectItem value="Chrome">Chrome</SelectItem>
                      <SelectItem value="Edge">Edge</SelectItem>
                      <SelectItem value="Firefox">Firefox</SelectItem>
                      <SelectItem value="WebKit">WebKit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredFailedTests.length === 0 && (
                    <div className={`rounded-2xl border p-6 text-center ${styles.softPanel}`}>
                      <Filter className="mx-auto mb-2 h-5 w-5 text-indigo-500" />
                      <div className="font-semibold">No failed tests matched the selected filters</div>
                    </div>
                  )}
                  {filteredFailedTests.map((test, index) => (
                    <Dialog key={`${test.title}-${index}`}>
                      <DialogTrigger asChild>
                        <button className={`w-full rounded-2xl border p-4 text-left transition hover:scale-[1.01] ${styles.softPanel}`}>
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="font-semibold">{test.title}</div>
                              <div className={`mt-1 text-sm ${styles.textSoft}`}>{test.file}</div>
                              <div className={`mt-2 text-sm ${styles.textSoft}`}>{test.error}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="rounded-lg">{test.browser}</Badge>
                              <Badge className="rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/15">{test.status}</Badge>
                              {test.flaky && <Badge className="rounded-lg bg-amber-500/15 text-amber-500 hover:bg-amber-500/15">Flaky</Badge>}
                              <Badge variant="outline" className="rounded-lg">{test.duration}</Badge>
                            </div>
                          </div>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{test.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-sm">
                          <div><span className="font-semibold">Browser:</span> {test.browser}</div>
                          <div><span className="font-semibold">File:</span> {test.file}</div>
                          <div><span className="font-semibold">Duration:</span> {test.duration}</div>
                          <div><span className="font-semibold">Flaky:</span> {test.flaky ? "Yes" : "No"}</div>
                          <div className="rounded-xl border bg-slate-50 p-4 text-slate-700">{test.error}</div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className={`rounded-3xl border shadow-sm xl:col-span-2 ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>AI Analysis</CardTitle>
                  <CardDescription className={styles.textMuted}>Human-readable insights for execution health and likely action areas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className={`rounded-2xl border p-4 ${styles.softPanel}`}>
                      {insight}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className={`rounded-3xl border shadow-sm ${styles.panel}`}>
                <CardHeader>
                  <CardTitle>What this dashboard now supports</CardTitle>
                  <CardDescription className={styles.textMuted}>All requested enhancements are included</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className={`rounded-2xl border p-4 ${styles.softPanel}`}>Import real Playwright JSON reports from any project.</div>
                  <div className={`rounded-2xl border p-4 ${styles.softPanel}`}>Dark mode for screenshot-ready sharing.</div>
                  <div className={`rounded-2xl border p-4 ${styles.softPanel}`}>Export summary report for updates and review.</div>
                  <div className={`rounded-2xl border p-4 ${styles.softPanel}`}>Failed test details, flaky trends, and browser history views.</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
