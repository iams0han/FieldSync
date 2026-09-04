"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Download,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  CheckCircle2,
  Activity,
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { getProjectWBS } from "@/lib/api";

type BackendRow = {
  wbs_id: number;
  pid: number;
  wbs_code: string;
  wbs_name: string;
  lvl: number;
  activity_id: number | null;
  plan_qty: number | null;
  act_qty: number | null;
  unt: string | null;
};

type ActivityPerformance = {
  id: number;
  name: string;
  planned: number;
  actual: number;
  variance: number;
};

const PROJECT_ID = 1;

export default function SCurvePage() {
  const router = useRouter();

  const [rows, setRows] = useState<BackendRow[]>([]);
  const [project, setProject] = useState(
    "Metro Line 3"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const data = await getProjectWBS(PROJECT_ID);

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load project analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     ACTIVITY DATA
  ========================= */

  const activityData = useMemo<ActivityPerformance[]>(() => {
    return rows
      .filter((row) => row.activity_id !== null)
      .map((row) => {
        const planned = Number(row.plan_qty || 0);
        const actual = Number(row.act_qty || 0);

        const plannedPercent =
          planned > 0 ? 100 : 0;

        const actualPercent =
          planned > 0
            ? Math.min(
                100,
                Math.round(
                  (actual / planned) * 100
                )
              )
            : 0;

        return {
          id: row.activity_id!,
          name: row.wbs_name,
          planned: plannedPercent,
          actual: actualPercent,
          variance:
            actualPercent - plannedPercent,
        };
      });
  }, [rows]);

  /* =========================
     PROJECT TOTALS
  ========================= */

  const totals = useMemo(() => {
    const activities = rows.filter(
      (row) => row.activity_id !== null
    );

    const planned = activities.reduce(
      (sum, row) =>
        sum + Number(row.plan_qty || 0),
      0
    );

    const actual = activities.reduce(
      (sum, row) =>
        sum + Number(row.act_qty || 0),
      0
    );

    const progress =
      planned > 0
        ? Math.min(
            100,
            Math.round((actual / planned) * 100)
          )
        : 0;

    /*
      Backend currently doesn't have a separate
      schedule-baseline percentage.

      Therefore planned progress is treated as
      100% of the defined activity quantities,
      while actual is calculated from act_qty.
    */
    const plannedProgress =
      planned > 0 ? 100 : 0;

    const variance =
      progress - plannedProgress;

    return {
      planned,
      actual,
      progress,
      plannedProgress,
      variance,
    };
  }, [rows]);

  const status =
    totals.progress >= 100
      ? "Completed"
      : totals.progress >= 70
      ? "On Track"
      : totals.progress > 0
      ? "At Risk"
      : "Not Started";

  /*
    Since backend currently doesn't store weekly
    historical snapshots, create a simple current
    progress visualization.

    This is NOT historical schedule data.
  */
  const chartData = useMemo(() => {
    const current = totals.progress;

    return [
      {
        week: "Start",
        planned: 0,
        actual: 0,
      },
      {
        week: "Current",
        planned: 100,
        actual: current,
      },
    ];
  }, [totals.progress]);

  const latest = chartData[chartData.length - 1];

  const currentVariance =
    latest.actual - latest.planned;

  const chartWidth = 1000;
  const chartHeight = 400;

  const plannedPoints = chartData
    .map((item, index) => {
      const x =
        (index / (chartData.length - 1)) *
        chartWidth;

      const y =
        chartHeight -
        (item.planned / 100) *
          chartHeight;

      return `${x},${y}`;
    })
    .join(" ");

  const actualPoints = chartData
    .map((item, index) => {
      const x =
        (index / (chartData.length - 1)) *
        chartWidth;

      const y =
        chartHeight -
        (item.actual / 100) *
          chartHeight;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f4f2]">

      {/* HEADER */}
      <header className="border-b border-[#e8e0dc] bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-5 sm:py-6 md:px-8 lg:px-10 lg:py-7">

          <button
            onClick={() => router.push("/dashboard")}
            className="mb-5 flex items-center gap-2 text-xs font-medium text-[#71807d] transition hover:text-[#68364b] sm:mb-6 sm:text-sm"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">

              <p className="text-[10px] font-bold tracking-[1.7px] text-[#c47a44] sm:text-xs">
                PROJECT ANALYTICS
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#24302f] sm:text-3xl">
                S-Curve / Progress Analytics
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-5 text-[#71807d] sm:text-sm">
                Track planned vs actual project progress.
              </p>

            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-fit sm:gap-3">

              <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ddd3ce] bg-white px-3 text-[11px] font-semibold text-[#52605e] sm:px-5 sm:py-3 sm:text-sm"
              >
                <Download size={16} />
                Export Report
              </button>

              <select
                value={project}
                onChange={(e) =>
                  setProject(e.target.value)
                }
                className="h-10 min-w-0 rounded-xl border border-[#ddd3ce] bg-white px-2.5 text-[10px] font-medium text-[#52605e] outline-none focus:border-[#68364b] sm:h-auto sm:px-4 sm:py-3 sm:text-sm"
              >
                <option>Metro Line 3</option>
              </select>

            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-5 sm:space-y-5 sm:px-5 sm:py-6 md:px-8 lg:px-10 lg:py-7">

        {/* PROJECT BAR */}
        <section className="rounded-2xl border border-[#e8e0dc] bg-white p-4 shadow-sm sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">

              <p className="text-[9px] font-bold tracking-[1.4px] text-[#71807d] sm:text-[10px]">
                ACTIVE PROJECT
              </p>

              <h2 className="mt-1 truncate text-sm font-bold text-[#24302f] sm:text-base">
                {project}
              </h2>

              <p className="mt-1 truncate text-[10px] text-[#71807d] sm:text-xs">
                Project ID: {PROJECT_ID} · Live PostgreSQL Data
              </p>

            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:w-fit sm:grid-cols-3 sm:gap-3">

              <MetricBox
                label="OVERALL PROGRESS"
                value={`${totals.progress}%`}
                className="bg-[#f8f3f5] text-[#68364b]"
              />

              <MetricBox
                label="VARIANCE"
                value={`${totals.variance}%`}
                className={
                  totals.variance < 0
                    ? "bg-[#fff0f0] text-[#b84c4c]"
                    : "bg-[#edf7f1] text-[#3d8b68]"
                }
              />

              <MetricBox
                label="STATUS"
                value={status}
                className={
                  status === "At Risk"
                    ? "col-span-2 bg-[#fff5eb] text-[#c47a44] sm:col-span-1"
                    : "col-span-2 bg-[#edf7f1] text-[#3d8b68] sm:col-span-1"
                }
              />

            </div>
          </div>
        </section>

        {/* LOADING */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center gap-3 rounded-2xl border border-[#e8e0dc] bg-white text-sm text-[#71807d]">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Loading analytics...
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="flex min-h-[250px] flex-col items-center justify-center gap-4 rounded-2xl border border-[#e8e0dc] bg-white">

            <p className="text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={loadData}
              className="rounded-xl bg-[#68364b] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try Again
            </button>

          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI CARDS */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

              <KpiCard
                icon={<Activity size={19} />}
                label="Overall Progress"
                value={`${totals.progress}%`}
                description="Current actual progress"
                iconClass="bg-[#f3e9ed] text-[#68364b]"
              >
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee7e3] sm:mt-4">

                  <div
                    className="h-full rounded-full bg-[#68364b]"
                    style={{
                      width: `${totals.progress}%`,
                    }}
                  />

                </div>
              </KpiCard>

              <KpiCard
                icon={<BarChart3 size={19} />}
                label="Planned Progress"
                value={`${totals.plannedProgress}%`}
                description="Defined project baseline"
                iconClass="bg-[#edf3f8] text-[#527fa8]"
              />

              <KpiCard
                icon={<TrendingDown size={19} />}
                label="Schedule Variance"
                value={`${totals.variance}%`}
                description={
                  totals.variance < 0
                    ? "Behind planned baseline"
                    : "At or ahead of baseline"
                }
                valueClass={
                  totals.variance < 0
                    ? "text-[#b84c4c]"
                    : "text-[#3d8b68]"
                }
                iconClass={
                  totals.variance < 0
                    ? "bg-[#fff0f0] text-[#b84c4c]"
                    : "bg-[#edf7f1] text-[#3d8b68]"
                }
              />

              <KpiCard
                icon={<TriangleAlert size={19} />}
                label="Project Status"
                value={status}
                description="Based on current actual progress"
                valueClass={
                  status === "At Risk"
                    ? "text-[#c47a44]"
                    : "text-[#3d8b68]"
                }
                iconClass={
                  status === "At Risk"
                    ? "bg-[#fff5eb] text-[#c47a44]"
                    : "bg-[#edf7f1] text-[#3d8b68]"
                }
              />

            </section>

            {/* S-CURVE */}
            <section className="overflow-hidden rounded-2xl border border-[#e8e0dc] bg-white shadow-sm">

              <div className="flex flex-col gap-4 border-b border-[#e8e0dc] px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <h2 className="text-sm font-bold text-[#24302f] sm:text-base">
                    Project S-Curve
                  </h2>

                  <p className="mt-1 text-[10px] text-[#71807d] sm:text-xs">
                    Current planned vs actual progress.
                  </p>

                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium text-[#71807d] sm:text-xs">

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-6 rounded-full bg-[#c47a44] sm:w-7" />
                    Planned
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-6 rounded-full bg-[#68364b] sm:w-7" />
                    Actual
                  </div>

                </div>
              </div>

              <div className="overflow-x-auto p-4 sm:p-6 md:p-7">

                <div className="flex min-w-[700px]">

                  <div className="flex w-10 shrink-0 flex-col justify-between pb-8 pt-1 text-[9px] text-[#8a9693] sm:w-12 sm:text-[10px]">
                    <span>100%</span>
                    <span>80%</span>
                    <span>60%</span>
                    <span>40%</span>
                    <span>20%</span>
                    <span>0%</span>
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="relative h-[250px] w-full sm:h-[300px] md:h-[330px]">

                      <div className="absolute inset-0 flex flex-col justify-between">

                        {[0, 1, 2, 3, 4, 5].map(
                          (line) => (
                            <div
                              key={line}
                              className="border-t border-dashed border-[#e9e3df]"
                            />
                          )
                        )}

                      </div>

                      <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        preserveAspectRatio="none"
                        className="absolute inset-0 h-full w-full overflow-visible"
                      >

                        <polyline
                          points={plannedPoints}
                          fill="none"
                          stroke="#c47a44"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <polyline
                          points={actualPoints}
                          fill="none"
                          stroke="#68364b"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {chartData.map(
                          (item, index) => {

                            const x =
                              (index /
                                (chartData.length - 1)) *
                              chartWidth;

                            const plannedY =
                              chartHeight -
                              (item.planned / 100) *
                                chartHeight;

                            const actualY =
                              chartHeight -
                              (item.actual / 100) *
                                chartHeight;

                            return (
                              <g key={item.week}>

                                <circle
                                  cx={x}
                                  cy={plannedY}
                                  r="5"
                                  fill="#ffffff"
                                  stroke="#c47a44"
                                  strokeWidth="3"
                                />

                                <circle
                                  cx={x}
                                  cy={actualY}
                                  r="5"
                                  fill="#ffffff"
                                  stroke="#68364b"
                                  strokeWidth="3"
                                />

                              </g>
                            );
                          }
                        )}

                      </svg>

                    </div>

                    <div className="mt-3 flex justify-between text-[9px] text-[#8a9693] sm:text-[10px]">

                      {chartData.map(
                        (item) => (
                          <span key={item.week}>
                            {item.week}
                          </span>
                        )
                      )}

                    </div>

                  </div>
                </div>
              </div>
            </section>

            {/* TABLES */}
            <section className="grid gap-4 xl:grid-cols-2 xl:gap-5">

              {/* PROGRESS TREND */}
              <DataTableCard
                icon={<TrendingUp size={18} />}
                title="Progress Trend"
                subtitle="Current project progress"
              >
                <table className="w-full min-w-[540px] border-collapse">

                  <thead>
                    <tr className="border-b border-[#eee9e6] bg-[#faf8f7]">
                      <Th>Period</Th>
                      <Th>Planned</Th>
                      <Th>Actual</Th>
                      <Th>Variance</Th>
                    </tr>
                  </thead>

                  <tbody>

                    <tr className="border-b border-[#f0ece9]">

                      <Td>
                        <span className="font-semibold text-[#24302f]">
                          Current
                        </span>
                      </Td>

                      <Td>
                        {totals.plannedProgress}%
                      </Td>

                      <Td>
                        <span className="font-semibold text-[#68364b]">
                          {totals.progress}%
                        </span>
                      </Td>

                      <Td>
                        <span
                          className={
                            totals.variance < 0
                              ? "font-bold text-[#b84c4c]"
                              : "font-bold text-[#3d8b68]"
                          }
                        >
                          {totals.variance > 0
                            ? "+"
                            : ""}
                          {totals.variance}%
                        </span>
                      </Td>

                    </tr>

                  </tbody>
                </table>
              </DataTableCard>

              {/* ACTIVITY PERFORMANCE */}
              <DataTableCard
                icon={<CheckCircle2 size={18} />}
                title="Activity Performance"
                subtitle="Live activity-wise progress"
              >
                <table className="w-full min-w-[600px] border-collapse">

                  <thead>
                    <tr className="border-b border-[#eee9e6] bg-[#faf8f7]">

                      <Th>Activity</Th>
                      <Th>Planned</Th>
                      <Th>Actual</Th>
                      <Th>Variance</Th>

                    </tr>
                  </thead>

                  <tbody>

                    {activityData.map(
                      (activity) => (
                        <tr
                          key={activity.id}
                          className="border-b border-[#f0ece9] last:border-0 hover:bg-[#fcfaf9]"
                        >

                          <Td>

                            <button
                              onClick={() =>
                                router.push(
                                  `/wbs/activity/${activity.id}`
                                )
                              }
                              className="text-left"
                            >

                              <p className="text-[10px] font-bold text-[#68364b]">
                                A-{activity.id}
                              </p>

                              <p className="mt-0.5 text-xs font-semibold text-[#24302f] hover:text-[#68364b]">
                                {activity.name}
                              </p>

                            </button>

                          </Td>

                          <Td>
                            {activity.planned}%
                          </Td>

                          <Td>

                            <span className="font-semibold text-[#68364b]">
                              {activity.actual}%
                            </span>

                          </Td>

                          <Td>

                            <span
                              className={
                                activity.variance < 0
                                  ? "font-bold text-[#b84c4c]"
                                  : "font-bold text-[#3d8b68]"
                              }
                            >
                              {activity.variance > 0
                                ? "+"
                                : ""}
                              {activity.variance}%
                            </span>

                          </Td>

                        </tr>
                      )
                    )}

                    {activityData.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-10 text-center text-xs text-[#8a9693]"
                        >
                          No activities found.
                        </td>
                      </tr>
                    )}

                  </tbody>
                </table>
              </DataTableCard>

            </section>

            {/* INSIGHT */}
            <section className="flex flex-col gap-4 rounded-2xl border border-[#eadfd7] bg-[#fffaf5] p-4 sm:flex-row sm:p-5">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c47a44] text-white">
                <TriangleAlert size={19} />
              </div>

              <div className="min-w-0">

                <h3 className="text-sm font-bold text-[#24302f]">
                  Progress Insight
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-[#71807d] sm:leading-6">

                  Current actual progress is{" "}

                  <strong
                    className={
                      totals.variance < 0
                        ? "text-[#b84c4c]"
                        : "text-[#3d8b68]"
                    }
                  >
                    {totals.progress}%
                  </strong>

                  {" "}against a defined project baseline of{" "}

                  <strong className="text-[#24302f]">
                    {totals.plannedProgress}%
                  </strong>
                  .

                  {activityData.length > 0 && (
                    <>
                      {" "}
                      Activity-level performance is being
                      calculated directly from the live
                      PostgreSQL quantities.
                    </>
                  )}

                </p>

              </div>

            </section>

            {/* REFRESH */}
            <div className="flex justify-end">

              <button
                onClick={loadData}
                className="flex items-center gap-2 rounded-xl border border-[#ddd3ce] bg-white px-4 py-2.5 text-xs font-semibold text-[#52605e] hover:bg-[#faf7f5]"
              >
                <RefreshCw size={14} />
                Refresh Analytics
              </button>

            </div>

          </>
        )}

        {/* FOOTER */}
        <footer className="flex flex-col gap-2 border-t border-[#e8e0dc] pt-5 text-[10px] text-[#8a9693] sm:flex-row sm:items-center sm:justify-between sm:text-[11px]">

          <span>
            FieldSync Infrastructure Progress Tracking
          </span>

          <span>
            Analytics synced with PostgreSQL
          </span>

        </footer>

      </div>
    </main>
  );
}

/* =========================
   METRIC BOX
========================= */

function MetricBox({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-3 sm:px-5 ${className}`}
    >
      <p className="text-[9px] font-semibold text-[#71807d] sm:text-[10px]">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold sm:text-xl">
        {value}
      </p>
    </div>
  );
}

/* =========================
   KPI CARD
========================= */

function KpiCard({
  icon,
  label,
  value,
  description,
  iconClass,
  valueClass = "text-[#24302f]",
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  iconClass: string;
  valueClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#e8e0dc] bg-white p-3.5 shadow-sm sm:p-5">

      <div className="flex items-start justify-between gap-2">

        <span className="min-w-0 truncate text-[10px] font-semibold text-[#71807d] sm:text-xs">
          {label}
        </span>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${iconClass}`}
        >
          {icon}
        </span>

      </div>

      <p
        className={`mt-3 text-xl font-bold tracking-tight sm:mt-4 sm:text-2xl ${valueClass}`}
      >
        {value}
      </p>

      {children}

      <p className="mt-2 text-[9px] leading-4 text-[#8a9693] sm:mt-3 sm:text-[11px]">
        {description}
      </p>

    </div>
  );
}

/* =========================
   TABLE CARD
========================= */

function DataTableCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e0dc] bg-white shadow-sm">

      <div className="flex items-center gap-3 border-b border-[#e8e0dc] px-4 py-4 sm:px-5 sm:py-5">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3e9ed] text-[#68364b]">
          {icon}
        </div>

        <div className="min-w-0">

          <h2 className="text-sm font-bold text-[#24302f]">
            {title}
          </h2>

          <p className="mt-1 text-[9px] text-[#8a9693] sm:text-[10px]">
            {subtitle}
          </p>

        </div>

      </div>

      <div className="overflow-x-auto">
        {children}
      </div>

    </div>
  );
}

/* =========================
   TABLE HELPERS
========================= */

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-[#8a9693] sm:px-5 sm:text-[10px]">
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[#52605e] sm:px-5">
      {children}
    </td>
  );
}