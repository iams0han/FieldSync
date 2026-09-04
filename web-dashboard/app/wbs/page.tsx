"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Loader2,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";

import { getProjectWBS } from "@/lib/api";

type BackendWBSRow = {
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

type TreeNode = {
  row: BackendWBSRow;
  children: TreeNode[];
};

const PROJECT_ID = 1;

function getProgress(
  planned: number | null,
  actual: number | null
) {
  const p = Number(planned || 0);
  const a = Number(actual || 0);

  if (p <= 0) return 0;

  return Math.min(
    100,
    Number(((a / p) * 100).toFixed(0))
  );
}

function getStatus(progress: number) {
  if (progress >= 100) return "Completed";
  if (progress > 0 && progress < 40) return "Delayed";
  if (progress > 0) return "In Progress";
  return "On Track";
}

function buildTree(rows: BackendWBSRow[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const stack: TreeNode[] = [];

  for (const row of rows) {
    const node: TreeNode = {
      row,
      children: [],
    };

    while (
      stack.length > 0 &&
      stack[stack.length - 1].row.lvl >= row.lvl
    ) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

function collectActivities(node: TreeNode): BackendWBSRow[] {
  const result: BackendWBSRow[] = [];

  if (node.row.activity_id !== null) {
    result.push(node.row);
  }

  for (const child of node.children) {
    result.push(...collectActivities(child));
  }

  return result;
}

function getNodeProgress(node: TreeNode): number {
  const activities = collectActivities(node);

  if (!activities.length) {
    return 0;
  }

  const planned = activities.reduce(
    (sum, item) => sum + Number(item.plan_qty || 0),
    0
  );

  const actual = activities.reduce(
    (sum, item) => sum + Number(item.act_qty || 0),
    0
  );

  if (planned <= 0) return 0;

  return Math.min(
    100,
    Number(((actual / planned) * 100).toFixed(0))
  );
}

function statusStyle(status: string) {
  if (status === "Completed") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (status === "Delayed") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (status === "In Progress") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function WBSPage() {
  const router = useRouter();

  const [rows, setRows] = useState<BackendWBSRow[]>([]);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWBS() {
    try {
      setLoading(true);
      setError("");

      const data = await getProjectWBS(PROJECT_ID);

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load WBS data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWBS();
  }, []);

  const tree = useMemo(
    () => buildTree(rows),
    [rows]
  );

  // --------------------------------
  // Activities
  // --------------------------------

  const activities = useMemo(() => {
    return rows
      .filter((row) => row.activity_id !== null)
      .map((row) => {
        const progress = getProgress(
          row.plan_qty,
          row.act_qty
        );

        return {
          ...row,
          progress,
          status: getStatus(progress),
        };
      });
  }, [rows]);

  // --------------------------------
  // Search + status
  // --------------------------------

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        activity.wbs_name
          .toLowerCase()
          .includes(searchText) ||
        activity.wbs_code
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All Status" ||
        activity.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activities, search, statusFilter]);

  // --------------------------------
  // Summary
  // --------------------------------

  const overallProgress = useMemo(() => {
    const planned = activities.reduce(
      (sum, item) =>
        sum + Number(item.plan_qty || 0),
      0
    );

    const actual = activities.reduce(
      (sum, item) =>
        sum + Number(item.act_qty || 0),
      0
    );

    if (planned <= 0) return 0;

    return Math.min(
      100,
      Number(((actual / planned) * 100).toFixed(0))
    );
  }, [activities]);

  const delayedCount = activities.filter(
    (item) => item.status === "Delayed"
  ).length;

  const completedCount = activities.filter(
    (item) => item.status === "Completed"
  ).length;

  // --------------------------------
  // Expand / Collapse
  // --------------------------------

  function toggleNode(id: number) {
    setExpanded((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  }

  function expandAll() {
    const ids = rows
      .filter((row) => row.activity_id === null)
      .map((row) => row.wbs_id);

    setExpanded(ids);
  }

  function collapseAll() {
    setExpanded([]);
  }

  // --------------------------------
  // Search visibility
  // --------------------------------

  function nodeHasMatchingActivity(
    node: TreeNode
  ): boolean {
    if (node.row.activity_id !== null) {
      return filteredActivities.some(
        (activity) =>
          activity.activity_id === node.row.activity_id
      );
    }

    return node.children.some(
      (child) => nodeHasMatchingActivity(child)
    );
  }

  // --------------------------------
  // Render Tree
  // --------------------------------

  function renderNode(
    node: TreeNode,
    depth = 0
  ): React.ReactNode {
    const row = node.row;

    // IMPORTANT:
    // Level 6 + activity_id = actual activity.
    // Do NOT render it as WBS + child activity.
    if (row.activity_id !== null) {
      const activity = filteredActivities.find(
        (item) =>
          item.activity_id === row.activity_id
      );

      if (!activity) {
        return null;
      }

      return (
        <div
          key={`activity-${row.activity_id}`}
          className="grid grid-cols-[minmax(280px,1fr)_120px_120px_140px_140px] items-center border-t border-[#eee7e4] bg-white"
        >
          {/* ACTIVITY NAME */}
          <button
            type="button"
            onClick={() =>
              router.push(
                `/wbs/activity/${row.activity_id}`
              )
            }
            className="flex min-w-0 items-center gap-3 px-5 py-4 text-left hover:bg-[#faf7f5]"
            style={{
              paddingLeft: `${32 + depth * 24}px`,
            }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#c47a44]" />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#24302f]">
                {row.wbs_name}
              </p>

              <p className="mt-0.5 text-xs text-[#8a9491]">
                {row.wbs_code} • Activity ID:{" "}
                {row.activity_id}
              </p>
            </div>
          </button>

          {/* PLANNED */}
          <div className="px-3 text-sm font-medium text-[#35413f]">
            {Number(row.plan_qty || 0)}{" "}
            {row.unt || "pct"}
          </div>

          {/* ACTUAL */}
          <div className="px-3 text-sm font-medium text-[#35413f]">
            {Number(row.act_qty || 0)}{" "}
            {row.unt || "pct"}
          </div>

          {/* PROGRESS */}
          <div className="px-3">
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eee8e5]">
                <div
                  className="h-full rounded-full bg-[#c47a44]"
                  style={{
                    width: `${activity.progress}%`,
                  }}
                />
              </div>

              <span className="w-10 text-right text-xs font-bold text-[#35413f]">
                {activity.progress}%
              </span>
            </div>
          </div>

          {/* STATUS */}
          <div className="px-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(
                activity.status
              )}`}
            >
              {activity.status}
            </span>
          </div>
        </div>
      );
    }

    // If searching and this branch has no matching activity,
    // hide it.
    if (
      (search.trim() || statusFilter !== "All Status") &&
      !nodeHasMatchingActivity(node)
    ) {
      return null;
    }

    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.includes(row.wbs_id);

    const progress = getNodeProgress(node);

    return (
      <div key={`wbs-${row.wbs_id}`}>
        {/* WBS ROW */}
        <div
          className={`grid grid-cols-[minmax(280px,1fr)_120px_120px_140px_140px] items-center border-t border-[#eee7e4] ${
            depth === 0
              ? "bg-[#faf6f4]"
              : "bg-white"
          }`}
        >
          {/* NAME */}
          <div
            className="flex min-w-0 items-center gap-2 px-5 py-4"
            style={{
              paddingLeft: `${20 + depth * 28}px`,
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() =>
                  toggleNode(row.wbs_id)
                }
                className="shrink-0 rounded-md p-1 text-[#68364b] hover:bg-[#f0e6ea]"
              >
                {isExpanded ? (
                  <ChevronDown size={17} />
                ) : (
                  <ChevronRight size={17} />
                )}
              </button>
            ) : (
              <span className="w-7" />
            )}

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2e8ec] text-[#68364b]">
              <FolderTree size={16} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#24302f]">
                {row.wbs_name}
              </p>

              <p className="mt-0.5 text-xs text-[#8a9491]">
                {row.wbs_code} • Level {row.lvl}
              </p>
            </div>
          </div>

          {/* PLANNED */}
          <div className="px-3 text-sm font-medium text-[#35413f]">
            {depth === 0 || row.activity_id === null
              ? "-"
              : `${row.plan_qty || 0} ${row.unt || ""}`}
          </div>

          {/* ACTUAL */}
          <div className="px-3 text-sm font-medium text-[#35413f]">
            {depth === 0 || row.activity_id === null
              ? "-"
              : `${row.act_qty || 0} ${row.unt || ""}`}
          </div>

          {/* PROGRESS */}
          <div className="px-3">
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eee8e5]">
                <div
                  className="h-full rounded-full bg-[#68364b]"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <span className="w-10 text-right text-xs font-bold text-[#35413f]">
                {progress}%
              </span>
            </div>
          </div>

          {/* TYPE */}
          <div className="px-3">
            <span className="inline-flex rounded-full border border-[#e3d5db] bg-[#f8f2f4] px-3 py-1 text-xs font-semibold text-[#68364b]">
              WBS
            </span>
          </div>
        </div>

        {/* CHILDREN */}
        {hasChildren &&
          isExpanded &&
          node.children.map((child) =>
            renderNode(child, depth + 1)
          )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4f2] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}
        <header className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#c47a44]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a777d]">
                  Project Structure
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#24302f] sm:text-3xl">
                WBS Explorer
              </h1>

              <p className="mt-1 text-sm text-[#71807d]">
                Metro Line 3 • Live data from PostgreSQL
              </p>
            </div>
          </div>
        </header>

        {/* SUMMARY */}
        <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">

          {/* Overall */}
          <div className="rounded-2xl border border-[#e7dedb] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#71807d]">
                  Overall Progress
                </p>

                <p className="mt-2 text-3xl font-bold text-[#24302f]">
                  {overallProgress}%
                </p>
              </div>

              <div className="rounded-xl bg-[#f2e8ec] p-2.5 text-[#68364b]">
                <Activity size={19} />
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee8e5]">
              <div
                className="h-full rounded-full bg-[#68364b]"
                style={{
                  width: `${overallProgress}%`,
                }}
              />
            </div>
          </div>

          {/* WBS */}
          <div className="rounded-2xl border border-[#e7dedb] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-[#71807d]">
              WBS Phases
            </p>

            <p className="mt-2 text-3xl font-bold text-[#24302f]">
              {rows.filter(
                (row) => row.activity_id === null
              ).length}
            </p>

            <p className="mt-2 text-xs text-[#71807d]">
              Active project structure
            </p>
          </div>

          {/* Activities */}
          <div className="rounded-2xl border border-[#e7dedb] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-[#71807d]">
              Activities
            </p>

            <p className="mt-2 text-3xl font-bold text-[#24302f]">
              {activities.length}
            </p>

            <p className="mt-2 text-xs text-[#71807d]">
              {completedCount} completed
            </p>
          </div>

          {/* Delayed */}
          <div className="rounded-2xl border border-[#e7dedb] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#71807d]">
                  Delayed
                </p>

                <p className="mt-2 text-3xl font-bold text-[#a34c4c]">
                  {delayedCount}
                </p>
              </div>

              <div className="rounded-xl bg-[#f9eaea] p-2.5 text-[#a34c4c]">
                <TriangleAlert size={19} />
              </div>
            </div>

            <p className="mt-2 text-xs text-[#71807d]">
              Requires attention
            </p>
          </div>
        </section>

        {/* CONTROLS */}
        <section className="mb-5 rounded-2xl border border-[#e7dedb] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9491]"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search WBS or activity..."
                className="h-11 w-full rounded-xl border border-[#ddd5d2] bg-white pl-10 pr-4 text-sm text-[#24302f] outline-none focus:border-[#68364b]"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="h-11 rounded-xl border border-[#ddd5d2] bg-white px-4 text-sm text-[#35413f] outline-none focus:border-[#68364b]"
            >
              <option>All Status</option>
              <option>On Track</option>
              <option>In Progress</option>
              <option>Delayed</option>
              <option>Completed</option>
            </select>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="h-11 rounded-xl border border-[#ddd5d2] px-4 text-sm font-medium text-[#35413f] hover:bg-[#f7f4f2]"
              >
                Expand All
              </button>

              <button
                type="button"
                onClick={collapseAll}
                className="h-11 rounded-xl border border-[#ddd5d2] px-4 text-sm font-medium text-[#35413f] hover:bg-[#f7f4f2]"
              >
                Collapse All
              </button>

              <button
                type="button"
                onClick={loadWBS}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ddd5d2] text-[#68364b] hover:bg-[#f7f4f2]"
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-2xl border border-[#e7dedb] bg-white shadow-sm">

          {/* Desktop header */}
          <div className="hidden min-w-[900px] grid-cols-[minmax(280px,1fr)_120px_120px_140px_140px] border-b border-[#e7dedb] bg-[#fbf9f8] text-[11px] font-bold uppercase tracking-wide text-[#71807d] lg:grid">
            <div className="px-5 py-4">
              WBS / Activity
            </div>

            <div className="px-3 py-4">
              Planned
            </div>

            <div className="px-3 py-4">
              Actual
            </div>

            <div className="px-3 py-4">
              Progress
            </div>

            <div className="px-3 py-4">
              Status
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-[#71807d]">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading WBS data...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>

              <button
                onClick={loadWBS}
                className="mt-4 rounded-xl bg-[#68364b] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            rows.length === 0 && (
              <div className="p-12 text-center text-sm text-[#71807d]">
                No WBS data found.
              </div>
            )}

          {/* Tree */}
          {!loading &&
            !error &&
            rows.length > 0 && (
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {tree.map((node) =>
                    renderNode(node)
                  )}
                </div>
              </div>
            )}
        </section>

        {/* FOOTER */}
        <footer className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-[#e4dbd7] py-5 text-xs text-[#8a9491] sm:flex-row">
          <p>
            FieldSync Project Management
          </p>

          <p>
            Live project data • PostgreSQL
          </p>
        </footer>
      </div>
    </main>
  );
}