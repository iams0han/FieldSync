"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Download,
  ListChecks,
  TriangleAlert,
  Clock3,
  CircleDot,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { getProjectWBS } from "@/lib/api";

type Status = "On Track" | "At Risk" | "Delayed" | "Completed";

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

type Activity = {
  id: number;
  name: string;
  phase: string;
  progress: number;
  status: Status;
  startDay: number;
  duration: number;
};

const PROJECT_ID = 1;

const days = Array.from({ length: 70 }, (_, i) => i + 1);

const months = [
  { label: "September 2026", start: 1, width: 30 },
  { label: "October 2026", start: 31, width: 31 },
  { label: "November 2026", start: 62, width: 8 },
];

function calculateProgress(
  planned: number | null,
  actual: number | null
) {
  const p = Number(planned || 0);
  const a = Number(actual || 0);

  if (p <= 0) return 0;

  return Math.min(
    100,
    Math.round((a / p) * 100)
  );
}

function calculateStatus(progress: number): Status {
  if (progress >= 100) return "Completed";
  if (progress > 0 && progress < 40) return "Delayed";
  return "On Track";
}

function statusStyles(status: Status) {
  switch (status) {
    case "Completed":
      return {
        bar: "bg-[#527fa8]",
        badge: "bg-[#edf3f8] text-[#527fa8]",
        dot: "bg-[#527fa8]",
      };

    case "At Risk":
      return {
        bar: "bg-[#c47a44]",
        badge: "bg-[#fff5eb] text-[#c47a44]",
        dot: "bg-[#c47a44]",
      };

    case "Delayed":
      return {
        bar: "bg-[#b84c4c]",
        badge: "bg-[#fff0f0] text-[#b84c4c]",
        dot: "bg-[#b84c4c]",
      };

    default:
      return {
        bar: "bg-[#3d8b68]",
        badge: "bg-[#edf7f1] text-[#3d8b68]",
        dot: "bg-[#3d8b68]",
      };
  }
}

export default function GanttPage() {
  const router = useRouter();

  const [rows, setRows] = useState<BackendRow[]>([]);
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGantt() {
    try {
      setLoading(true);
      setError("");

      const data = await getProjectWBS(PROJECT_ID);

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load Gantt data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGantt();
  }, []);

  // --------------------------------
  // LIVE ACTIVITIES FROM BACKEND
  // --------------------------------

  const activities = useMemo<Activity[]>(() => {
    const backendActivities = rows.filter(
      (row) => row.activity_id !== null
    );

    return backendActivities.map((row, index) => {
      const progress = calculateProgress(
        row.plan_qty,
        row.act_qty
      );

      return {
        id: row.activity_id!,
        name: row.wbs_name,
        phase: row.wbs_code,
        progress,
        status: calculateStatus(progress),

        // Backend currently has no start/end dates.
        // Temporary visual positioning.
        startDay: 5 + index * 12,
        duration: 10,
      };
    });
  }, [rows]);

  const filteredActivities =
    filter === "All"
      ? activities
      : activities.filter(
          (item) => item.status === filter
        );

  const completed = activities.filter(
    (item) => item.status === "Completed"
  ).length;

  const delayed = activities.filter(
    (item) => item.status === "Delayed"
  ).length;

  const atRisk = activities.filter(
    (item) => item.status === "At Risk"
  ).length;

  const overallProgress = useMemo(() => {
    const activityRows = rows.filter(
      (row) => row.activity_id !== null
    );

    const planned = activityRows.reduce(
      (sum, row) =>
        sum + Number(row.plan_qty || 0),
      0
    );

    const actual = activityRows.reduce(
      (sum, row) =>
        sum + Number(row.act_qty || 0),
      0
    );

    if (planned <= 0) return 0;

    return Math.min(
      100,
      Math.round((actual / planned) * 100)
    );
  }, [rows]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f4f2]">

      {/* HEADER */}
      <header className="border-b border-[#e8e0dc] bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-5 sm:py-6 md:px-8 lg:px-10 lg:py-7">

          <button
            onClick={() => router.push("/dashboard")}
            className="mb-5 flex items-center gap-2 text-xs font-medium text-[#71807d] hover:text-[#68364b] sm:mb-6 sm:text-sm"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="text-[10px] font-bold tracking-[1.7px] text-[#c47a44] sm:text-xs">
                PROJECT SCHEDULING
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#24302f] sm:text-3xl">
                Gantt Chart
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-5 text-[#71807d] sm:text-sm">
                Visualize project activities, timelines and progress.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-fit sm:gap-3">

              <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ddd3ce] bg-white px-3 text-[11px] font-semibold text-[#52605e] sm:px-5 sm:py-3 sm:text-sm"
              >
                <Download size={16} />
                Export
              </button>

              <button
                onClick={() => router.push("/wbs")}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#68364b] px-3 text-[11px] font-semibold text-white sm:px-5 sm:py-3 sm:text-sm"
              >
                WBS Explorer
                <ArrowRight size={16} />
              </button>

            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-5 sm:space-y-5 sm:px-5 sm:py-6 md:px-8 lg:px-10 lg:py-7">

        {/* PROJECT BAR */}
        <section className="rounded-2xl border border-[#e8e0dc] bg-white p-4 shadow-sm sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-[9px] font-bold tracking-[1.4px] text-[#71807d] sm:text-[10px]">
                ACTIVE PROJECT
              </p>

              <h2 className="mt-1 text-sm font-bold text-[#24302f] sm:text-base">
                Metro Line 3
              </h2>

              <p className="mt-1 text-[10px] text-[#71807d] sm:text-xs">
                Project ID: {PROJECT_ID} · Live PostgreSQL Data
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:w-fit sm:gap-3">

              <div className="rounded-xl bg-[#f8f3f5] px-3 py-3 sm:px-5">
                <p className="text-[9px] font-semibold text-[#71807d] sm:text-[10px]">
                  PROJECT PROGRESS
                </p>

                <p className="mt-1 text-lg font-bold text-[#68364b] sm:text-xl">
                  {overallProgress}%
                </p>
              </div>

              <div className="rounded-xl bg-[#fff5eb] px-3 py-3 sm:px-5">
                <p className="text-[9px] font-semibold text-[#71807d] sm:text-[10px]">
                  ACTIVITIES
                </p>

                <p className="mt-1 text-lg font-bold text-[#c47a44] sm:text-xl">
                  {activities.length}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

          <SummaryCard
            icon={<ListChecks size={19} />}
            label="Total Activities"
            value={activities.length}
            iconClass="bg-[#f3e9ed] text-[#68364b]"
          />

          <SummaryCard
            icon={<CheckCircle2 size={19} />}
            label="Completed"
            value={completed}
            iconClass="bg-[#edf7f1] text-[#3d8b68]"
          />

          <SummaryCard
            icon={<TriangleAlert size={19} />}
            label="At Risk"
            value={atRisk}
            iconClass="bg-[#fff5eb] text-[#c47a44]"
          />

          <SummaryCard
            icon={<CircleDot size={19} />}
            label="Delayed"
            value={delayed}
            iconClass="bg-[#fff0f0] text-[#b84c4c]"
          />

        </section>

        {/* CONTROLS */}
        <section className="rounded-2xl border border-[#e8e0dc] bg-white p-3.5 shadow-sm sm:p-4">

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">

              {(
                [
                  "All",
                  "On Track",
                  "At Risk",
                  "Delayed",
                  "Completed",
                ] as const
              ).map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-2.5 py-2 text-[10px] font-semibold sm:px-4 sm:text-xs ${
                    filter === item
                      ? "bg-[#68364b] text-white"
                      : "bg-[#f7f4f2] text-[#71807d]"
                  }`}
                >
                  {item}
                </button>
              ))}

            </div>

            <div className="flex items-center justify-between gap-3">

              <div className="flex items-center gap-2 text-[10px] text-[#71807d] sm:text-xs">
                <CalendarRange size={15} />
                <span>
                  01 Sep 2026 — 08 Nov 2026
                </span>
              </div>

              <button
                onClick={loadGantt}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ddd3ce] text-[#68364b]"
              >
                <RefreshCw size={15} />
              </button>

            </div>

          </div>
        </section>

        {/* GANTT CARD */}
        <section className="overflow-hidden rounded-2xl border border-[#e8e0dc] bg-white shadow-sm">

          <div className="border-b border-[#e8e0dc] px-4 py-4 sm:px-5">

            <h2 className="text-sm font-bold text-[#24302f] sm:text-base">
              Project Timeline
            </h2>

            <p className="mt-1 text-[10px] text-[#71807d] sm:text-xs">
              Click an activity to view live activity information.
            </p>

          </div>

          {loading && (
            <div className="flex min-h-[300px] items-center justify-center gap-3 text-sm text-[#71807d]">
              <Loader2 size={20} className="animate-spin" />
              Loading project timeline...
            </div>
          )}

          {error && !loading && (
            <div className="flex min-h-[250px] flex-col items-center justify-center gap-4">
              <p className="text-sm text-red-600">
                {error}
              </p>

              <button
                onClick={loadGantt}
                className="rounded-xl bg-[#68364b] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">

              <div className="min-w-[1050px] sm:min-w-[1150px] lg:min-w-[1250px]">

                {/* MONTH HEADER */}
                <div className="flex border-b border-[#e8e0dc] bg-[#faf8f7]">

                  <div className="w-[260px] shrink-0 border-r border-[#e8e0dc] px-4 py-4 sm:w-[290px] lg:w-[310px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#71807d]">
                      Activities
                    </span>
                  </div>

                  <div className="relative h-12 flex-1">

                    {months.map((month) => (
                      <div
                        key={month.label}
                        className="absolute top-0 flex h-12 items-center justify-center border-r border-[#e8e0dc] text-[10px] font-bold text-[#52605e] sm:text-xs"
                        style={{
                          left: `${((month.start - 1) / 70) * 100}%`,
                          width: `${(month.width / 70) * 100}%`,
                        }}
                      >
                        {month.label}
                      </div>
                    ))}

                  </div>
                </div>

                {/* DAY HEADER */}
                <div className="flex border-b border-[#e8e0dc]">

                  <div className="w-[260px] shrink-0 border-r border-[#e8e0dc] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#9aaaa6] sm:w-[290px] lg:w-[310px]">
                    Activity Details
                  </div>

                  <div className="relative h-10 flex-1">

                    {days.map((day) => (
                      <div
                        key={day}
                        className="absolute top-0 flex h-10 items-center justify-center border-r border-[#f0ece9] text-[8px] text-[#8d9996]"
                        style={{
                          left: `${((day - 1) / 70) * 100}%`,
                          width: `${(1 / 70) * 100}%`,
                        }}
                      >
                        {day}
                      </div>
                    ))}

                  </div>
                </div>

                {/* ROWS */}
                {filteredActivities.map((activity) => {

                  const styles =
                    statusStyles(activity.status);

                  return (
                    <div
                      key={activity.id}
                      className="flex min-h-[76px] border-b border-[#eee9e6]"
                    >

                      {/* DETAILS */}
                      <div className="flex w-[260px] shrink-0 items-center gap-3 border-r border-[#e8e0dc] px-4 sm:w-[290px] sm:px-5 lg:w-[310px]">

                        <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f3e9ed] text-[10px] font-bold text-[#68364b]">
                          A-{activity.id}
                        </div>

                        <div className="min-w-0">

                          <button
                            onClick={() =>
                              router.push(
                                `/wbs/activity/${activity.id}`
                              )
                            }
                            className="block max-w-full truncate text-left text-xs font-bold text-[#24302f] hover:text-[#68364b] sm:text-sm"
                          >
                            {activity.name}
                          </button>

                          <p className="mt-1 truncate text-[9px] text-[#8a9693] sm:text-[10px]">
                            {activity.phase}
                          </p>

                        </div>
                      </div>

                      {/* TIMELINE */}
                      <div className="relative flex-1">

                        {days.map((day) => (
                          <span
                            key={day}
                            className="absolute bottom-0 top-0 border-r border-[#f4f1ef]"
                            style={{
                              left: `${(day / 70) * 100}%`,
                            }}
                          />
                        ))}

                        <button
                          onClick={() =>
                            router.push(
                              `/wbs/activity/${activity.id}`
                            )
                          }
                          className={`absolute top-1/2 h-9 -translate-y-1/2 overflow-hidden rounded-lg shadow-sm ${styles.bar}`}
                          style={{
                            left: `${((activity.startDay - 1) / 70) * 100}%`,
                            width: `${(activity.duration / 70) * 100}%`,
                            minWidth: "65px",
                          }}
                        >

                          <div
                            className="absolute inset-y-0 left-0 bg-white/20"
                            style={{
                              width: `${activity.progress}%`,
                            }}
                          />

                          <span className="relative z-10 flex h-full items-center justify-center px-2 text-[9px] font-bold text-white sm:text-[10px]">
                            {activity.progress}%
                          </span>

                        </button>

                      </div>
                    </div>
                  );
                })}

                {filteredActivities.length === 0 && (
                  <div className="flex min-h-[200px] items-center justify-center text-sm text-[#8a9693]">
                    No activities found.
                  </div>
                )}

              </div>
            </div>
          )}
        </section>

        {/* MOBILE HINT */}
        <div className="flex items-center gap-2 rounded-xl border border-[#e8e0dc] bg-white px-4 py-3 text-[10px] text-[#8a9693] sm:hidden">
          <ArrowRight size={14} className="text-[#68364b]" />
          Swipe horizontally to view the complete timeline.
        </div>

        {/* LEGEND */}
        <section className="rounded-2xl border border-[#e8e0dc] bg-white px-4 py-4 shadow-sm sm:px-5">

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">

            <span className="text-xs font-bold text-[#24302f]">
              Activity Status
            </span>

            <Legend dot="bg-[#3d8b68]" label="On Track" />
            <Legend dot="bg-[#c47a44]" label="At Risk" />
            <Legend dot="bg-[#b84c4c]" label="Delayed" />
            <Legend dot="bg-[#527fa8]" label="Completed" />

          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-[#e8e0dc] pt-5 text-[10px] text-[#8a9693] sm:flex-row sm:justify-between">
          <span>
            FieldSync Infrastructure Progress Tracking
          </span>

          <span>
            Timeline data synced with PostgreSQL
          </span>
        </footer>

      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconClass: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#e8e0dc] bg-white p-3.5 shadow-sm sm:gap-4 sm:p-5">

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[10px] text-[#71807d] sm:text-xs">
          {label}
        </p>

        <p className="mt-1 text-xl font-bold text-[#24302f] sm:text-2xl">
          {value}
        </p>
      </div>

    </div>
  );
}

function Legend({
  dot,
  label,
}: {
  dot: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-[#71807d] sm:text-xs">
      <span
        className={`h-2.5 w-2.5 rounded-full ${dot}`}
      />
      {label}
    </div>
  );
}