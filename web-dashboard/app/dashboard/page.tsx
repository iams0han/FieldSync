"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { getDashboard, getEvidence } from "@/lib/api";

/* =========================================================
   TYPES
========================================================= */

type EvidenceItem = {
  evidence_id: number;
  activity_id: number;
  wbs_id?: number;
  wbs_code?: string;
  activity_name?: string;

  uri?: string | null;

  plan_qty?: number;
  actual_qty?: number;
  unit?: string;

  ai_result?: string | null;
  ai_confidence?: number;

  review_status?: string;
  review_reason?: string | null;

  reviewed_by?: string | null;
  reviewed_at?: string | null;

  created_at?: string | null;
};

type DashboardData = {
  project_id?: number;

  project?: {
    id?: number;
    code?: string;
    name?: string;
    title?: string;
  };

  project_name?: string;
  project_code?: string;

  overall_progress_pct?: number;
  total_planned_qty?: number;
  total_actual_qty?: number;

  total_activities?: number;
  completed_activities?: number;
  pending_activities?: number;

  alerts?: any[];

  activities?: any[];
  recent_evidence?: any[];
  evidence?: any[];
};

/* =========================================================
   HELPERS
========================================================= */

function formatTime(dateString?: string | null) {
  if (!dateString) return "Recently";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";

  return `${days}d ago`;
}

function getProgress(
  planned: number,
  actual: number
) {
  if (!planned || planned <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, (actual / planned) * 100)
  );
}

function getAlertTitle(alert: any) {
  return (
    alert?.title ||
    alert?.activity_name ||
    alert?.name ||
    alert?.activity ||
    "Delayed Activity"
  );
}

function getAlertId(alert: any) {
  return (
    alert?.activity_code ||
    alert?.code ||
    alert?.id ||
    `ACT-${Math.random().toString(36).slice(2, 6)}`
  );
}

function getAlertReason(alert: any) {
  return (
    alert?.reason ||
    alert?.message ||
    alert?.description ||
    alert?.alert ||
    "Schedule requires attention"
  );
}

function getAlertDelay(alert: any) {
  if (alert?.delay !== undefined) {
    return String(alert.delay).includes("day")
      ? String(alert.delay)
      : `+${alert.delay} days`;
  }

  if (alert?.delay_days !== undefined) {
    return `+${alert.delay_days} days`;
  }

  if (alert?.days !== undefined) {
    return `+${alert.days} days`;
  }

  return "Attention";
}

/* =========================================================
   PAGE
========================================================= */

export default function DashboardPage() {
  const PROJECT_ID = 1;

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [evidence, setEvidence] =
    useState<EvidenceItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadDashboard() {
    try {
      setError("");

      const [dashboardData, evidenceData] =
        await Promise.all([
          getDashboard(PROJECT_ID),
          getEvidence(PROJECT_ID),
        ]);

      setDashboard(dashboardData);

      setEvidence(
        Array.isArray(evidenceData?.evidence)
          ? evidenceData.evidence
          : []
      );
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =======================================================
     REAL BACKEND VALUES
  ======================================================= */

  const progress = Number(
    dashboard?.overall_progress_pct ?? 0
  );

  const plannedTotal = Number(
    dashboard?.total_planned_qty ?? 0
  );

  const actualTotal = Number(
    dashboard?.total_actual_qty ?? 0
  );

  const backendAlerts = Array.isArray(
    dashboard?.alerts
  )
    ? dashboard!.alerts!
    : [];

  const delayedCount = backendAlerts.length;

  /* =======================================================
     ACTIVITY COUNTS
  ======================================================= */

  const totalActivities = Number(
    dashboard?.total_activities ??
      dashboard?.activities?.length ??
      0
  );

  const completedActivities = Number(
    dashboard?.completed_activities ??
      0
  );

  const pendingActivities = Number(
    dashboard?.pending_activities ??
      Math.max(
        0,
        totalActivities - completedActivities
      )
  );

  /* =======================================================
     PROJECT INFORMATION
  ======================================================= */

  const projectName =
    dashboard?.project?.name ||
    dashboard?.project?.title ||
    dashboard?.project_name ||
    "Metro Line 3 Build";

  const projectCode =
    dashboard?.project?.code ||
    dashboard?.project_code ||
    `P-${String(PROJECT_ID).padStart(3, "0")}`;

  /* =======================================================
     EVIDENCE COUNTS
  ======================================================= */

  const approvedEvidence = evidence.filter(
    (item) =>
      item.review_status === "Approved"
  ).length;

  const rejectedEvidence = evidence.filter(
    (item) =>
      item.review_status === "Rejected"
  ).length;

  const pendingEvidence = evidence.filter(
    (item) =>
      !item.review_status ||
      item.review_status === "Pending Review"
  ).length;

  /* =======================================================
     REAL RECENT FIELD UPDATES
  ======================================================= */

  const recentEvidence = useMemo(() => {
    return [...evidence]
      .sort((a, b) => {
        const aTime = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

        const bTime = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        return bTime - aTime;
      })
      .slice(0, 4);
  }, [evidence]);

  /* =======================================================
     CURRENT PLAN VS ACTUAL
  ======================================================= */

  const actualPercent = getProgress(
    plannedTotal,
    actualTotal
  );

  const variance =
    actualPercent - progress;

  /*
    Progress KPI should represent backend overall progress.
    Quantity completion is separately calculated from
    total planned vs total actual.
  */

  const quantityVariance =
    actualPercent - 100;

  /* =======================================================
     EVIDENCE STATUS
  ======================================================= */

  const evidenceTotal = evidence.length;

  /* =======================================================
     REFRESH
  ======================================================= */

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f3]">
        <div className="rounded-xl border border-[#e3ddda] bg-white px-6 py-5 text-sm font-semibold text-[#68364b] shadow-sm">
          Loading dashboard...
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f3] px-4">
        <div className="rounded-xl border border-[#ead5d5] bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#a34c4c]">
            {error}
          </p>

          <button
            onClick={handleRefresh}
            className="mt-4 rounded-lg bg-[#68364b] px-4 py-2 text-xs font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f5f3] text-[#26312f]">

      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-5 sm:py-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div className="min-w-0">

            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#927983] sm:text-[10px]">
              Project Control Center
            </p>

            <h1 className="mt-1 text-[25px] font-bold tracking-[-0.04em] sm:text-[28px]">
              Dashboard
            </h1>

            <p className="mt-1 text-[11px] text-[#78827f] sm:text-xs">
              Real-time overview of project execution.
            </p>

          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">

            <button className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#ddd7d4] bg-white px-2.5 text-[9px] font-semibold text-[#596461] sm:flex-none sm:px-3 sm:text-[10px]">

              <CalendarDays size={13} />

              Sep 2026

              <ChevronDown size={12} />

            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#68364b] px-3 text-[9px] font-semibold text-white shadow-sm transition hover:bg-[#582d40] disabled:opacity-60 sm:flex-none sm:px-4 sm:text-[10px]"
            >

              <Camera size={13} />

              {refreshing
                ? "Refreshing..."
                : "Refresh Data"}

            </button>

          </div>

        </header>

        {/* =================================================
            PROJECT HEADER
        ================================================= */}

        <section className="mt-6 overflow-hidden rounded-2xl bg-[#102a2a] sm:mt-7">

          <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:px-7">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-md bg-[#c47a44] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-white">
                  Active Project
                </span>

                <span className="text-[9px] font-medium text-[#a9b7b3]">
                  {projectCode}
                </span>

              </div>

              <h2 className="mt-3 text-lg font-bold leading-6 tracking-[-0.02em] text-white sm:text-xl">
                {projectName}
              </h2>

              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#aab8b5]">

                <MapPin size={11} />

                Infrastructure Project

              </p>

            </div>

            <div className="flex w-full items-center justify-between gap-4 sm:justify-start sm:gap-7 lg:w-auto">

              <div>

                <p className="text-[9px] uppercase tracking-wide text-[#8fa19d]">
                  Progress
                </p>

                <p className="mt-1 text-3xl font-bold text-white">
                  {progress.toFixed(0)}%
                </p>

              </div>

              <div className="h-12 w-px bg-white/10" />

              <div className="min-w-0">

                <span className="inline-block rounded-full bg-[#7b4c35] px-2.5 py-1.5 text-[8px] font-bold text-[#ffe5d1] sm:px-3 sm:text-[9px]">

                  {progress < 50
                    ? "AT RISK"
                    : delayedCount > 0
                    ? "ATTENTION"
                    : "ON TRACK"}

                </span>

                <p className="mt-2 text-[8px] text-[#8fa19d] sm:text-[9px]">

                  {progress < 50
                    ? "Schedule requires attention"
                    : delayedCount > 0
                    ? `${delayedCount} delayed activities`
                    : "Project progressing normally"}

                </p>

              </div>

            </div>

          </div>

          {/* PROJECT PROGRESS */}

          <div className="border-t border-white/10 px-5 py-4 sm:px-6 lg:px-7">

            <div className="flex items-center justify-between">

              <span className="text-[9px] text-[#8fa19d]">
                Project completion
              </span>

              <span className="text-[9px] font-bold text-white">
                {progress.toFixed(0)} / 100
              </span>

            </div>

            <div className="mt-2 h-1 rounded-full bg-white/10">

              <div
                className="h-full rounded-full bg-[#c47a44] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, progress)
                  )}%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* =================================================
            KPI ROW
        ================================================= */}

        <section className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 lg:grid-cols-4">

          <KpiCard
            label="Overall Progress"
            icon={
              <TrendingUp
                size={15}
                className="text-[#68364b]"
              />
            }
            value={`${progress.toFixed(0)}%`}
            note={
              delayedCount > 0
                ? `${delayedCount} delayed`
                : "No active delays"
            }
            noteClass={
              delayedCount > 0
                ? "text-[#a34c4c]"
                : "text-[#4c7565]"
            }
          />

          <KpiCard
            label="Planned Quantity"
            icon={
              <Activity
                size={15}
                className="text-[#4c7565]"
              />
            }
            value={plannedTotal.toLocaleString()}
            note="Total planned"
          />

          <KpiCard
            label="Actual Quantity"
            icon={
              actualTotal >= plannedTotal
                ? (
                  <TrendingUp
                    size={15}
                    className="text-[#4c7565]"
                  />
                )
                : (
                  <TrendingDown
                    size={15}
                    className="text-[#a85f2e]"
                  />
                )
            }
            value={actualTotal.toLocaleString()}
            valueClass="text-[#a85f2e]"
            note={`${actualPercent.toFixed(0)}% of plan`}
          />

          <KpiCard
            label="Delayed Activities"
            icon={
              <AlertTriangle
                size={15}
                className="text-[#a34c4c]"
              />
            }
            value={delayedCount.toString()}
            valueClass="text-[#a34c4c]"
            note={
              delayedCount === 0
                ? "No delays"
                : "Need attention"
            }
            noteClass={
              delayedCount === 0
                ? "text-[#4c7565]"
                : "text-[#a34c4c]"
            }
          />

        </section>

        {/* =================================================
            ANALYTICS
        ================================================= */}

        <section className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[1.65fr_0.8fr]">

          {/* =================================================
              PLAN VS ACTUAL
          ================================================= */}

          <div className="min-w-0 overflow-hidden rounded-xl border border-[#e3ddda] bg-white p-4 sm:p-5">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <h3 className="text-sm font-bold">
                  Progress Overview
                </h3>

                <p className="mt-1 text-[9px] text-[#89938f]">
                  Real-time planned quantity vs actual quantity
                </p>

              </div>

              <div className="flex gap-4">

                <span className="flex items-center gap-1.5 text-[9px] text-[#89938f]">

                  <span className="h-1.5 w-5 rounded-full bg-[#c47a44]" />

                  Planned

                </span>

                <span className="flex items-center gap-1.5 text-[9px] text-[#89938f]">

                  <span className="h-1.5 w-5 rounded-full bg-[#68364b]" />

                  Actual

                </span>

              </div>

            </div>

            <div className="mt-7">

              <div className="flex items-center justify-between">

                <span className="text-[10px] font-semibold text-[#687572]">
                  Quantity completion
                </span>

                <span className="text-sm font-bold text-[#68364b]">
                  {actualPercent.toFixed(0)}%
                </span>

              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#eee9e6]">

                <div
                  className="h-full rounded-full bg-[#68364b] transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, actualPercent)
                    )}%`,
                  }}
                />

              </div>

              <div className="mt-2 flex justify-between text-[8px] text-[#929b98]">

                <span>
                  Actual: {actualTotal.toLocaleString()}
                </span>

                <span>
                  Planned: {plannedTotal.toLocaleString()}
                </span>

              </div>

            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">

              <MiniStat
                label="Activities"
                value={totalActivities.toString()}
              />

              <MiniStat
                label="Completed"
                value={completedActivities.toString()}
              />

              <MiniStat
                label="Pending"
                value={pendingActivities.toString()}
              />

            </div>

          </div>

          {/* =================================================
              HEALTH
          ================================================= */}

          <div className="rounded-xl border border-[#e3ddda] bg-white p-4 sm:p-5">

            <h3 className="text-sm font-bold">
              Project Health
            </h3>

            <p className="mt-1 text-[9px] text-[#89938f]">
              Overall execution condition
            </p>

            <div className="mt-6 flex justify-center sm:mt-7">

              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-[#eee9e6] sm:h-40 sm:w-40">

                <div
                  className="absolute inset-[-12px] rounded-full border-[12px] border-transparent"
                  style={{
                    borderTopColor:
                      progress < 50
                        ? "#a34c4c"
                        : "#68364b",
                    borderRightColor:
                      progress < 50
                        ? "#a34c4c"
                        : "#68364b",
                    borderBottomColor:
                      "#c47a44",
                  }}
                />

                <div className="text-center">

                  <p className="text-3xl font-bold">
                    {progress.toFixed(0)}%
                  </p>

                  <p
                    className={`mt-1 text-[9px] font-bold uppercase tracking-wider ${
                      progress < 50 ||
                      delayedCount > 0
                        ? "text-[#a85f2e]"
                        : "text-[#4c7565]"
                    }`}
                  >
                    {progress < 50
                      ? "At Risk"
                      : delayedCount > 0
                      ? "Attention"
                      : "On Track"}
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-6 space-y-2 sm:mt-7">

              <HealthRow
                label="Schedule"
                value={
                  progress < 50
                    ? "At Risk"
                    : delayedCount > 0
                    ? "Attention"
                    : "On Track"
                }
                danger={
                  progress < 50 ||
                  delayedCount > 0
                }
              />

              <HealthRow
                label="Evidence"
                value={
                  pendingEvidence > 0
                    ? `${pendingEvidence} Pending`
                    : "Up to Date"
                }
                danger={pendingEvidence > 0}
              />

              <HealthRow
                label="Review"
                value={
                  evidenceTotal === 0
                    ? "No Data"
                    : `${approvedEvidence}/${evidenceTotal} Approved`
                }
                danger={rejectedEvidence > 0}
              />

            </div>

          </div>

        </section>

        {/* =================================================
            LOWER
        ================================================= */}

        <section className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-2">

          {/* =================================================
              RECENT FIELD UPDATES
          ================================================= */}

          <div className="min-w-0 overflow-hidden rounded-xl border border-[#e3ddda] bg-white">

            <div className="flex items-center justify-between gap-3 border-b border-[#eee9e6] px-4 py-4 sm:px-5">

              <div className="min-w-0">

                <h3 className="text-sm font-bold">
                  Recent Field Updates
                </h3>

                <p className="mt-1 text-[9px] text-[#89938f]">
                  Latest evidence submitted from the field
                </p>

              </div>

              <span className="shrink-0 rounded-full bg-[#f2e8ec] px-2.5 py-1 text-[7px] font-bold text-[#68364b] sm:text-[8px]">
                {evidenceTotal} TOTAL
              </span>

            </div>

            <div>

              {recentEvidence.length === 0 ? (

                <div className="px-5 py-10 text-center">

                  <Camera
                    size={22}
                    className="mx-auto text-[#b6bfbc]"
                  />

                  <p className="mt-3 text-[10px] font-semibold text-[#687572]">
                    No field evidence yet
                  </p>

                  <p className="mt-1 text-[9px] text-[#929b98]">
                    Uploaded field evidence will appear here.
                  </p>

                </div>

              ) : (

                recentEvidence.map((item) => {

                  const itemProgress =
                    getProgress(
                      Number(item.plan_qty ?? 0),
                      Number(item.actual_qty ?? 0)
                    );

                  const status =
                    item.review_status ||
                    "Pending Review";

                  return (

                    <div
                      key={item.evidence_id}
                      className="flex items-center gap-3 border-b border-[#eee9e6] px-4 py-4 last:border-0 sm:px-5"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2e8ec] text-[#68364b]">

                        <Camera size={14} />

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex min-w-0 items-center gap-2">

                          <span className="shrink-0 text-[9px] font-bold text-[#68364b]">

                            EVD-
                            {String(
                              item.evidence_id
                            ).padStart(3, "0")}

                          </span>

                          <p className="truncate text-[11px] font-semibold">

                            {item.activity_name ||
                              `Activity ${item.activity_id}`}

                          </p>

                        </div>

                        <p className="mt-1 flex items-center gap-1 text-[9px] text-[#929b98]">

                          <MapPin size={9} />

                          <span className="truncate">
                            {item.wbs_code ||
                              "Field Evidence"}
                          </span>

                          <span>·</span>

                          {formatTime(
                            item.created_at
                          )}

                        </p>

                      </div>

                      <div className="hidden w-24 shrink-0 min-[400px]:block">

                        <div className="flex justify-between">

                          <span className="text-[8px] text-[#929b98]">
                            Progress
                          </span>

                          <span className="text-[9px] font-bold">
                            {itemProgress.toFixed(0)}%
                          </span>

                        </div>

                        <div className="mt-1.5 h-1 rounded-full bg-[#eee9e6]">

                          <div
                            className="h-full rounded-full bg-[#68364b]"
                            style={{
                              width: `${itemProgress}%`,
                            }}
                          />

                        </div>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-bold ${
                          status === "Approved"
                            ? "bg-[#e9f3ee] text-[#4c7565]"
                            : status === "Rejected"
                            ? "bg-[#f9eaea] text-[#a34c4c]"
                            : "bg-[#fff1e5] text-[#a85f2e]"
                        }`}
                      >
                        {status ===
                        "Pending Review"
                          ? "PENDING"
                          : status.toUpperCase()}
                      </span>

                    </div>

                  );
                })

              )}

            </div>

          </div>

          {/* =================================================
              DELAYS
          ================================================= */}

          <div className="min-w-0 overflow-hidden rounded-xl border border-[#e3ddda] bg-white">

            <div className="flex items-center justify-between gap-3 border-b border-[#eee9e6] px-4 py-4 sm:px-5">

              <div className="min-w-0">

                <h3 className="text-sm font-bold">
                  Critical Delays
                </h3>

                <p className="mt-1 text-[9px] text-[#89938f]">
                  Activities affecting schedule
                </p>

              </div>

              <span className="shrink-0 rounded-full bg-[#f9eaea] px-2 py-1 text-[7px] font-bold text-[#a34c4c] sm:px-2.5 sm:text-[8px]">

                {delayedCount} ACTIVE

              </span>

            </div>

            <div>

              {backendAlerts.length === 0 ? (

                <div className="px-5 py-10 text-center">

                  <CheckCircle2
                    size={23}
                    className="mx-auto text-[#4c7565]"
                  />

                  <p className="mt-3 text-[10px] font-semibold text-[#687572]">
                    No critical delays
                  </p>

                  <p className="mt-1 text-[9px] text-[#929b98]">
                    Backend has not reported any active delay.
                  </p>

                </div>

              ) : (

                backendAlerts
                  .slice(0, 4)
                  .map((alert, index) => (

                    <div
                      key={
                        alert?.id ??
                        `${getAlertId(alert)}-${index}`
                      }
                      className="flex items-center gap-3 border-b border-[#eee9e6] px-4 py-4 last:border-0 sm:px-5"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff1e5] text-[#a85f2e]">

                        <Clock3 size={14} />

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex min-w-0 items-center gap-2">

                          <span className="shrink-0 text-[9px] font-bold text-[#68364b]">

                            {getAlertId(alert)}

                          </span>

                          <p className="truncate text-[11px] font-semibold">

                            {getAlertTitle(alert)}

                          </p>

                        </div>

                        <p className="mt-1 truncate text-[9px] text-[#929b98]">

                          {getAlertReason(alert)}

                        </p>

                      </div>

                      <span className="shrink-0 text-[9px] font-bold text-[#a34c4c]">

                        {getAlertDelay(alert)}

                      </span>

                    </div>

                  ))

              )}

            </div>

            {backendAlerts.length > 0 && (

              <div className="border-t border-[#eee9e6] px-4 py-3 sm:px-5">

                <button className="flex items-center gap-1 text-[9px] font-bold text-[#68364b]">

                  View all delays

                  <ArrowRight size={11} />

                </button>

              </div>

            )}

          </div>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="mt-6 flex flex-col gap-2 border-t border-[#e2dcda] pt-4 text-[8px] text-[#929b98] sm:flex-row sm:items-center sm:justify-between sm:text-[9px]">

          <span>
            FieldSync · Infrastructure Progress Tracking
          </span>

          <span className="flex items-center gap-1.5">

            <CheckCircle2 size={10} />

            Connected to PostgreSQL backend

          </span>

        </footer>

      </div>

    </div>
  );
}

/* =========================================================
   KPI CARD
========================================================= */

function KpiCard({
  label,
  icon,
  value,
  note,
  valueClass = "",
  noteClass = "text-[#89938f]",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  note: string;
  valueClass?: string;
  noteClass?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e3ddda] bg-white p-4 sm:p-5">

      <div className="flex items-center justify-between gap-2">

        <span className="truncate text-[9px] font-medium text-[#7c8784] sm:text-[10px]">
          {label}
        </span>

        {icon}

      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">

        <span
          className={`text-xl font-bold sm:text-2xl ${valueClass}`}
        >
          {value}
        </span>

        <span
          className={`mb-0.5 text-[8px] font-semibold ${noteClass}`}
        >
          {note}
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#faf9f8] px-3 py-3">

      <p className="text-[8px] text-[#929b98]">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-[#26312f]">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   HEALTH ROW
========================================================= */

function HealthRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#faf9f8] px-3 py-2.5">

      <div className="flex items-center gap-2">

        <span
          className={`h-1.5 w-1.5 rounded-full ${
            danger
              ? "bg-[#c47a44]"
              : "bg-[#4c7565]"
          }`}
        />

        <span className="text-[10px] text-[#687572]">
          {label}
        </span>

      </div>

      <span
        className={`text-[9px] font-bold ${
          danger
            ? "text-[#a85f2e]"
            : "text-[#4c7565]"
        }`}
      >
        {value}
      </span>

    </div>
  );
}