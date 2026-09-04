"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Search,
  TriangleAlert,
  Clock3,
  ShieldAlert,
  AlertCircle,
  Eye,
} from "lucide-react";
import { getDelayAlerts } from "@/lib/api";

type AlertStatus = "Delayed" | "At Risk";

type BackendAlert = {
  activity_id: number;
  wbs_id: number;
  wbs_code: string;
  activity_name: string;
  planned_qty: number;
  actual_qty: number;
  progress: number;
  status: AlertStatus;
  unit: string;
};

type Activity = BackendAlert & {
  phase: string;
  owner: string;
  location: string;
  plannedEnd: string;
  currentDate: string;
  variance: number;
  reason: string;
};

export default function DelayAlertsPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<"All" | AlertStatus>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAlerts() {
    try {
      setLoading(true);
      setError("");

      const data = await getDelayAlerts(1);

      const mappedActivities: Activity[] = data.alerts.map(
        (item: BackendAlert) => ({
          ...item,

          phase:
            item.wbs_code === "EXC-01"
              ? "Site Preparation & Earthwork"
              : "Foundation & Structural Works",

          owner: "Project Team",
          location: "Project Site",

          plannedEnd: "Not available",
          currentDate: "Current",

          variance:
            item.status === "Delayed"
              ? -Math.max(1, Math.round(100 - item.progress))
              : -Math.max(1, Math.round(70 - item.progress)),

          reason:
            item.status === "Delayed"
              ? "Progress is below the expected schedule"
              : "Progress requires close monitoring",
        })
      );

      setActivities(mappedActivities);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to load delay alerts. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const delayedCount = activities.filter(
    (item) => item.status === "Delayed"
  ).length;

  const riskCount = activities.filter(
    (item) => item.status === "At Risk"
  ).length;

  const totalAlerts = activities.length;

  const filteredActivities = useMemo(() => {
    const query = search.toLowerCase().trim();

    return activities.filter((activity) => {
      const matchesFilter =
        filter === "All" || activity.status === filter;

      const matchesSearch =
        !query ||
        activity.wbs_code.toLowerCase().includes(query) ||
        activity.activity_name.toLowerCase().includes(query) ||
        activity.owner.toLowerCase().includes(query) ||
        activity.location.toLowerCase().includes(query) ||
        activity.phase.toLowerCase().includes(query) ||
        activity.reason.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activities, filter, search]);

  const averageProgress =
    activities.length > 0
      ? Math.round(
          activities.reduce(
            (sum, item) => sum + item.progress,
            0
          ) / activities.length
        )
      : 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f4f2]">
      {/* HEADER */}
      <header className="border-b border-[#e8e0dc] bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-5 flex items-center gap-2 text-sm font-medium text-[#71807d] transition hover:text-[#68364b] sm:mb-6"
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[1.7px] text-[#c47a44] sm:text-xs">
                PROJECT MONITORING
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#24302f] sm:text-3xl">
                Delay Alerts
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-[#71807d] sm:text-sm sm:leading-6">
                Identify delayed and at-risk activities before
                they impact the project schedule.
              </p>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ddd3ce] bg-white px-5 py-3 text-sm font-semibold text-[#52605e] transition hover:bg-[#faf7f5] sm:w-auto">
              <Download size={17} />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-7">
        {/* PROJECT BAR */}
        <section className="rounded-2xl border border-[#e8e0dc] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[1.5px] text-[#71807d]">
                ACTIVE PROJECT
              </p>

              <h2 className="mt-1 text-sm font-bold text-[#24302f] sm:text-base">
                Metro Line 3
              </h2>

              <p className="mt-1 text-[11px] text-[#71807d] sm:text-xs">
                Project ID · P-001
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:w-auto">
              <ProjectMetric
                label="OVERALL PROGRESS"
                value={`${averageProgress}%`}
                className="bg-[#f8f3f5] text-[#68364b]"
              />

              <ProjectMetric
                label="ACTIVE ALERTS"
                value={String(totalAlerts)}
                className="bg-[#fff0f0] text-[#b84c4c]"
              />

              <ProjectMetric
                label="PROJECT STATUS"
                value={
                  delayedCount > 0
                    ? "At Risk"
                    : "On Track"
                }
                className="col-span-2 bg-[#fff5eb] text-[#c47a44] sm:col-span-1"
              />
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <SummaryCard
            icon={<TriangleAlert size={21} />}
            label="Delayed Activities"
            value={delayedCount}
            description="Immediate attention required"
            iconClass="bg-[#fff0f0] text-[#b84c4c]"
            valueClass="text-[#b84c4c]"
          />

          <SummaryCard
            icon={<ShieldAlert size={21} />}
            label="At Risk Activities"
            value={riskCount}
            description="Requires close monitoring"
            iconClass="bg-[#fff5eb] text-[#c47a44]"
            valueClass="text-[#c47a44]"
          />

          <SummaryCard
            icon={<Clock3 size={21} />}
            label="Average Progress"
            value={`${averageProgress}%`}
            description="Across alerted activities"
            iconClass="bg-[#f3e9ed] text-[#68364b]"
            valueClass="text-[#68364b]"
          />

          <SummaryCard
            icon={<AlertCircle size={21} />}
            label="Total Alerts"
            value={totalAlerts}
            description="Open project alerts"
            iconClass="bg-[#f3e9ed] text-[#68364b]"
          />
        </section>

        {/* ALERT BANNER */}
        <section className="flex flex-col gap-3 rounded-2xl border border-[#eadfd7] bg-[#fffaf5] p-4 sm:flex-row sm:gap-4 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c47a44] text-white">
            <TriangleAlert size={20} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#24302f]">
              Schedule Attention Required
            </h3>

            <p className="mt-1.5 text-xs leading-6 text-[#71807d]">
              <strong className="text-[#b84c4c]">
                {delayedCount}
              </strong>{" "}
              activities are currently delayed and{" "}
              <strong className="text-[#c47a44]">
                {riskCount}
              </strong>{" "}
              activities are at risk of delay. Review the
              activities below and take corrective action.
            </p>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <section className="rounded-xl border border-[#f0caca] bg-[#fff0f0] px-4 py-3 text-sm text-[#b84c4c]">
            {error}
          </section>
        )}

        {/* FILTER CARD */}
        <section className="rounded-2xl border border-[#e8e0dc] bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa5a2]"
              />

              <input
                type="text"
                placeholder="Search activity, owner or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#ddd5d0] bg-[#faf8f7] pl-10 pr-4 text-xs text-[#24302f] outline-none transition placeholder:text-[#9aa5a2] focus:border-[#68364b] focus:bg-white"
              />
            </div>

            <div className="grid w-full grid-cols-3 gap-2 lg:flex lg:w-auto">
              {(["All", "Delayed", "At Risk"] as const).map(
                (item) => {
                  const count =
                    item === "All"
                      ? totalAlerts
                      : activities.filter(
                          (activity) =>
                            activity.status === item
                        ).length;

                  return (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] font-semibold transition sm:gap-2 sm:px-4 sm:text-xs ${
                        filter === item
                          ? "bg-[#68364b] text-white"
                          : "bg-[#f7f4f2] text-[#71807d] hover:bg-[#eee8e4]"
                      }`}
                    >
                      {item}

                      <span
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] ${
                          filter === item
                            ? "bg-white/15 text-white"
                            : "bg-white text-[#71807d]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-2xl border border-[#e8e0dc] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#e8e0dc] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
            <div>
              <h2 className="text-base font-bold text-[#24302f]">
                Activity Alerts
              </h2>

              <p className="mt-1 text-[11px] text-[#71807d] sm:text-xs">
                Showing{" "}
                <strong className="text-[#24302f]">
                  {filteredActivities.length}
                </strong>{" "}
                of {totalAlerts} active alerts
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#71807d]">
              <span className="h-2 w-2 rounded-full bg-[#b84c4c]" />
              Live monitoring
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16">
              <div className="text-sm font-medium text-[#71807d]">
                Loading alerts...
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e0dc] bg-[#faf8f7]">
                    <Th>Activity</Th>
                    <Th>Progress</Th>
                    <Th>Phase</Th>
                    <Th>Owner</Th>
                    <Th>Variance</Th>
                    <Th>Status</Th>
                    <Th>Reason</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>

                <tbody>
                  {filteredActivities.map((activity) => {
                    const isDelayed =
                      activity.status === "Delayed";

                    return (
                      <tr
                        key={activity.activity_id}
                        className="border-b border-[#eee9e6] transition hover:bg-[#fcfaf9]"
                      >
                        {/* ACTIVITY */}
                        <td className="px-5 py-4 align-top">
                          <div className="max-w-[220px]">
                            <span className="text-[10px] font-bold text-[#68364b]">
                              {activity.wbs_code}
                            </span>

                            <p className="mt-1 text-xs font-bold text-[#24302f]">
                              {activity.activity_name}
                            </p>

                            <p className="mt-1 text-[10px] text-[#8a9693]">
                              Activity ID: {activity.activity_id}
                            </p>
                          </div>
                        </td>

                        {/* PROGRESS */}
                        <td className="px-5 py-4 align-top">
                          <div className="w-[110px]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#24302f]">
                                {activity.progress}%
                              </span>

                              <span className="text-[9px] text-[#8a9693]">
                                {activity.actual_qty}/
                                {activity.planned_qty}
                              </span>
                            </div>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eee8e4]">
                              <div
                                className={`h-full rounded-full ${
                                  isDelayed
                                    ? "bg-[#b84c4c]"
                                    : "bg-[#c47a44]"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    activity.progress
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* PHASE */}
                        <td className="px-5 py-4 align-top">
                          <span className="block max-w-[180px] text-xs leading-5 text-[#52605e]">
                            {activity.phase}
                          </span>
                        </td>

                        {/* OWNER */}
                        <td className="px-5 py-4 align-top">
                          <span className="whitespace-nowrap text-xs font-medium text-[#52605e]">
                            {activity.owner}
                          </span>
                        </td>

                        {/* VARIANCE */}
                        <td className="px-5 py-4 align-top">
                          <span className="inline-flex whitespace-nowrap rounded-lg bg-[#fff0f0] px-2.5 py-1.5 text-xs font-bold text-[#b84c4c]">
                            {Math.abs(activity.variance)} days
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-bold ${
                              isDelayed
                                ? "bg-[#fff0f0] text-[#b84c4c]"
                                : "bg-[#fff5eb] text-[#c47a44]"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isDelayed
                                  ? "bg-[#b84c4c]"
                                  : "bg-[#c47a44]"
                              }`}
                            />

                            {activity.status}
                          </span>
                        </td>

                        {/* REASON */}
                        <td className="px-5 py-4 align-top">
                          <span className="block max-w-[220px] text-xs leading-5 text-[#52605e]">
                            {activity.reason}
                          </span>
                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4 align-top">
                          <button
                            onClick={() =>
                              router.push(
                                `/wbs/activity/${activity.activity_id}`
                              )
                            }
                            className="flex items-center gap-1.5 rounded-lg border border-[#ddd5d0] bg-white px-3 py-2 text-[10px] font-bold text-[#68364b] transition hover:border-[#68364b] hover:bg-[#f8f3f5]"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredActivities.length === 0 && (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3e9ed] text-[#68364b]">
                    <Search size={23} />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-[#24302f]">
                    No alerts found
                  </h3>

                  <p className="mt-1 text-xs text-[#71807d]">
                    Try changing the search text or status filter.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col gap-2 border-t border-[#e8e0dc] pt-5 text-[10px] text-[#8a9693] sm:flex-row sm:items-center sm:justify-between sm:text-[11px]">
          <span>Live data from PostgreSQL</span>

          <span>
            Monitoring {totalAlerts} active alerts
          </span>
        </footer>
      </div>
    </main>
  );
}

/* =========================
   PROJECT METRIC
========================= */

function ProjectMetric({
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
      className={`min-w-0 rounded-xl px-3 py-3 sm:px-5 ${className}`}
    >
      <p className="truncate text-[8px] font-semibold text-[#71807d] sm:text-[10px]">
        {label}
      </p>

      <p className="mt-1 truncate text-lg font-bold sm:text-xl">
        {value}
      </p>
    </div>
  );
}

/* =========================
   SUMMARY CARD
========================= */

function SummaryCard({
  icon,
  label,
  value,
  description,
  iconClass,
  valueClass = "text-[#24302f]",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  description: string;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[#e8e0dc] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[10px] text-[#71807d] sm:text-xs">
          {label}
        </p>

        <p
          className={`mt-1 text-xl font-bold sm:text-2xl ${valueClass}`}
        >
          {value}
        </p>

        <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#8a9693] sm:text-[10px]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================
   TABLE HEADER
========================= */

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#8a9693]">
      {children}
    </th>
  );
}