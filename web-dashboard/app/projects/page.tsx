"use client";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  TriangleAlert,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getDashboard, getProjects } from "@/lib/api";

type BackendProject = {
  id: number;
  tnt: string;
  nm: string;
  st: string;
};

type Project = {
  id: string;
  backendId: number;
  name: string;
  location: string;
  manager: string;
  type: string;
  progress: number;
  status: string;
  start: string;
  end: string;
  activities: number;
  delayed: number;
};

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Projects");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const backendProjects: BackendProject[] = await getProjects();

        const formattedProjects: Project[] = await Promise.all(
          backendProjects.map(async (project) => {
            let progress = 0;
            let activities = 0;

            try {
              const dashboard = await getDashboard(project.id);

              progress = Number(
                dashboard?.overall_progress_pct ?? 0
              );

              activities = Array.isArray(dashboard?.wbs_tree)
                ? dashboard.wbs_tree.length
                : 0;
            } catch (dashboardError) {
              console.error(
                `Dashboard fetch failed for project ${project.id}:`,
                dashboardError
              );
            }

            let status = "On Track";

            if (project.st) {
              status = project.st;
            } else if (progress < 40) {
              status = "Delayed";
            } else if (progress < 70) {
              status = "At Risk";
            }

            return {
              id: `P-${String(project.id).padStart(3, "0")}`,
              backendId: project.id,
              name: project.nm || "Untitled Project",
              location: "Infrastructure Project Site",
              manager: "Project Manager",
              type: project.tnt || "Infrastructure Project",
              progress,
              status,
              start: "—",
              end: "—",
              activities,
              delayed: 0,
            };
          })
        );

        setProjects(formattedProjects);
      } catch (err) {
        console.error("Projects fetch error:", err);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const totalProjects = projects.length;

  const activeProjects = projects.filter(
    (project) =>
      project.status !== "Completed" && project.progress < 100
  ).length;

  const atRiskProjects = projects.filter(
    (project) =>
      project.status === "At Risk" ||
      project.status === "Delayed"
  ).length;

  const completedProjects = projects.filter(
    (project) => project.progress >= 100
  ).length;

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.id.toLowerCase().includes(search.toLowerCase()) ||
        project.type.toLowerCase().includes(search.toLowerCase());

      let matchesFilter = true;

      if (filter === "Active") {
        matchesFilter =
          project.status !== "Completed" &&
          project.progress < 100;
      }

      if (filter === "At Risk") {
        matchesFilter =
          project.status === "At Risk" ||
          project.status === "Delayed";
      }

      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f4f2] px-4 py-5 sm:px-5 sm:py-6 md:px-8 lg:px-10 lg:py-7">
      {/* HEADER */}
      <header className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#c47a44]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a777d] sm:text-[11px] sm:tracking-[0.18em]">
              Project Management
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#24302f] sm:text-3xl">
            Projects
          </h1>

          <p className="mt-1 max-w-xl text-xs leading-5 text-[#71807d] sm:text-sm">
            Manage and monitor all infrastructure projects.
          </p>
        </div>

        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#68364b] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#582c3e] sm:w-fit"
        >
          <Plus size={16} />
          New Project
        </button>
      </header>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* TOTAL PROJECTS */}
        <div className="rounded-2xl border border-[#e7dedb] bg-white p-4 shadow-[0_5px_25px_rgba(45,30,35,0.035)] sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-[#71807d] sm:text-xs">
                Total Projects
              </p>

              <h2 className="mt-1.5 text-2xl font-bold text-[#24302f] sm:mt-2 sm:text-3xl">
                {loading ? "—" : totalProjects}
              </h2>
            </div>

            <div className="shrink-0 rounded-xl bg-[#f2e8ec] p-2 text-[#68364b] sm:p-2.5">
              <FolderKanban
                size={17}
                className="sm:h-[19px] sm:w-[19px]"
              />
            </div>
          </div>

          <p className="mt-3 hidden text-[11px] text-[#71807d] sm:mt-4 sm:block">
            Across all project locations
          </p>
        </div>

        {/* ACTIVE PROJECTS */}
        <div className="rounded-2xl border border-[#e7dedb] bg-white p-4 shadow-[0_5px_25px_rgba(45,30,35,0.035)] sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-[#71807d] sm:text-xs">
                Active Projects
              </p>

              <h2 className="mt-1.5 text-2xl font-bold text-[#24302f] sm:mt-2 sm:text-3xl">
                {loading ? "—" : activeProjects}
              </h2>
            </div>

            <div className="shrink-0 rounded-xl bg-[#eef5f1] p-2 text-[#4c7565] sm:p-2.5">
              <Activity
                size={17}
                className="sm:h-[19px] sm:w-[19px]"
              />
            </div>
          </div>

          <p className="mt-3 hidden text-[11px] text-[#71807d] sm:mt-4 sm:block">
            Currently under execution
          </p>
        </div>

        {/* AT RISK */}
        <div className="rounded-2xl border border-[#e7dedb] bg-white p-4 shadow-[0_5px_25px_rgba(45,30,35,0.035)] sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-[#71807d] sm:text-xs">
                At Risk
              </p>

              <h2 className="mt-1.5 text-2xl font-bold text-[#a34c4c] sm:mt-2 sm:text-3xl">
                {loading ? "—" : atRiskProjects}
              </h2>
            </div>

            <div className="shrink-0 rounded-xl bg-[#f9eaea] p-2 text-[#a34c4c] sm:p-2.5">
              <TriangleAlert
                size={17}
                className="sm:h-[19px] sm:w-[19px]"
              />
            </div>
          </div>

          <p className="mt-3 hidden text-[11px] text-[#71807d] sm:mt-4 sm:block">
            Projects requiring attention
          </p>
        </div>

        {/* COMPLETED */}
        <div className="rounded-2xl border border-[#e7dedb] bg-white p-4 shadow-[0_5px_25px_rgba(45,30,35,0.035)] sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-[#71807d] sm:text-xs">
                Completed
              </p>

              <h2 className="mt-1.5 text-2xl font-bold text-[#24302f] sm:mt-2 sm:text-3xl">
                {loading ? "—" : completedProjects}
              </h2>
            </div>

            <div className="shrink-0 rounded-xl bg-[#eef5f1] p-2 text-[#4c7565] sm:p-2.5">
              <CheckCircle2
                size={17}
                className="sm:h-[19px] sm:w-[19px]"
              />
            </div>
          </div>

          <p className="mt-3 hidden text-[11px] text-[#71807d] sm:mt-4 sm:block">
            Successfully completed projects
          </p>
        </div>
      </section>

      {/* SEARCH / FILTER */}
      <section className="mt-5 rounded-2xl border border-[#e7dedb] bg-white p-3.5 shadow-[0_5px_25px_rgba(45,30,35,0.035)] sm:mt-6 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* SEARCH */}
          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa3a0]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="h-10 w-full rounded-xl border border-[#e5dedb] bg-[#fcfaf9] pl-9 pr-4 text-xs text-[#24302f] outline-none transition placeholder:text-[#9aa3a0] focus:border-[#b99da8]"
            />
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap">
            <button
              type="button"
              onClick={() => setFilter("All Projects")}
              className={`rounded-lg px-2 py-2 text-[10px] font-semibold sm:px-3.5 sm:text-[11px] ${
                filter === "All Projects"
                  ? "bg-[#68364b] text-white"
                  : "border border-[#e5dedb] bg-white text-[#71807d] hover:bg-[#faf7f6]"
              }`}
            >
              All Projects
            </button>

            <button
              type="button"
              onClick={() => setFilter("Active")}
              className={`rounded-lg px-2 py-2 text-[10px] font-semibold sm:px-3.5 sm:text-[11px] ${
                filter === "Active"
                  ? "bg-[#68364b] text-white"
                  : "border border-[#e5dedb] bg-white text-[#71807d] hover:bg-[#faf7f6]"
              }`}
            >
              Active
            </button>

            <button
              type="button"
              onClick={() => setFilter("At Risk")}
              className={`rounded-lg px-2 py-2 text-[10px] font-semibold sm:px-3.5 sm:text-[11px] ${
                filter === "At Risk"
                  ? "bg-[#68364b] text-white"
                  : "border border-[#e5dedb] bg-white text-[#71807d] hover:bg-[#faf7f6]"
              }`}
            >
              At Risk
            </button>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="mt-5 rounded-xl border border-[#f0caca] bg-[#fff5f5] px-4 py-3 text-xs font-medium text-[#a34c4c]">
          {error}
        </div>
      )}

      {/* PROJECT LIST */}
      <section className="mt-5 sm:mt-6">
        {/* SECTION HEADER */}
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a898f] sm:text-[11px]">
              Project Portfolio
            </p>

            <h2 className="mt-1 text-base font-bold text-[#24302f] sm:text-lg">
              All Projects
            </h2>
          </div>

          <span className="shrink-0 text-[10px] font-medium text-[#8a9491] sm:text-[11px]">
            {filteredProjects.length} projects
          </span>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-[#e7dedb] bg-white p-8 text-center text-xs text-[#71807d]">
            Loading projects...
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div className="rounded-2xl border border-[#e7dedb] bg-white p-8 text-center">
            <FolderKanban
              size={30}
              className="mx-auto text-[#b99da8]"
            />

            <p className="mt-3 text-sm font-semibold text-[#24302f]">
              No projects found
            </p>

            <p className="mt-1 text-xs text-[#71807d]">
              Try changing your search or filter.
            </p>
          </div>
        )}

        {/* CARDS */}
        {!loading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredProjects.map((project) => (
              <div
                key={project.backendId}
                className="group min-w-0 rounded-2xl border border-[#e7dedb] bg-white p-4 shadow-[0_5px_25px_rgba(45,30,35,0.035)] transition hover:-translate-y-0.5 hover:border-[#d7c2ca] hover:shadow-[0_10px_30px_rgba(45,30,35,0.07)] sm:p-5"
              >
                {/* CARD TOP */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2e8ec] text-[#68364b] sm:h-11 sm:w-11">
                      <FolderKanban
                        size={18}
                        className="sm:h-[19px] sm:w-[19px]"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[9px] font-bold text-[#68364b] sm:text-[10px]">
                          {project.id}
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[7px] font-bold sm:text-[8px] ${
                            project.status === "At Risk"
                              ? "bg-[#fff1e4] text-[#a85f2e]"
                              : project.status === "Delayed"
                              ? "bg-[#f9eaea] text-[#a34c4c]"
                              : project.status === "Completed"
                              ? "bg-[#eef5f1] text-[#4c7565]"
                              : "bg-[#eef5f1] text-[#4c7565]"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      <h3 className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#24302f] sm:text-sm">
                        {project.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 rounded-lg p-1.5 text-[#9aa3a0] transition hover:bg-[#f7f2f0] sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <MoreHorizontal size={17} />
                  </button>
                </div>

                {/* LOCATION */}
                <div className="mt-3 flex min-w-0 items-center gap-1.5 text-[9px] text-[#71807d] sm:mt-4 sm:text-[10px]">
                  <MapPin size={11} className="shrink-0" />

                  <span className="truncate">
                    {project.location}
                  </span>
                </div>

                {/* TYPE */}
                <div className="mt-2 text-[9px] text-[#8a9491] sm:text-[10px]">
                  {project.type}
                </div>

                {/* PROGRESS */}
                <div className="mt-4 sm:mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[9px] font-medium text-[#71807d] sm:text-[10px]">
                      Project Progress
                    </span>

                    <span className="text-xs font-bold text-[#24302f]">
                      {project.progress.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-[#eee8e5]">
                    <div
                      className="h-full rounded-full bg-[#68364b]"
                      style={{
                        width: `${Math.min(
                          Math.max(project.progress, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* DETAILS */}
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-[#eee7e4] pt-4 sm:mt-5 sm:gap-3">
                  {/* START */}
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-wide text-[#9aa3a0] sm:text-[9px]">
                      Start Date
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-[#35413f] sm:text-[10px]">
                      <CalendarDays size={11} className="shrink-0" />

                      <span className="truncate">
                        {project.start}
                      </span>
                    </p>
                  </div>

                  {/* END */}
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-wide text-[#9aa3a0] sm:text-[9px]">
                      End Date
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-[#35413f] sm:text-[10px]">
                      <CalendarDays size={11} className="shrink-0" />

                      <span className="truncate">
                        {project.end}
                      </span>
                    </p>
                  </div>

                  {/* ACTIVITIES */}
                  <div>
                    <p className="text-[8px] uppercase tracking-wide text-[#9aa3a0] sm:text-[9px]">
                      Activities
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-[#35413f] sm:text-[11px]">
                      {project.activities}
                    </p>
                  </div>

                  {/* DELAYED */}
                  <div>
                    <p className="text-[8px] uppercase tracking-wide text-[#9aa3a0] sm:text-[9px]">
                      Delayed
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-[#a34c4c] sm:text-[11px]">
                      {project.delayed}
                    </p>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="mt-4 flex flex-col gap-3 border-t border-[#eee7e4] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 text-[9px] text-[#8a9491] sm:text-[10px]">
                    Manager:{" "}
                    <span className="font-semibold text-[#5d6866]">
                      {project.manager}
                    </span>
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/wbs")}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#f5edef] px-3 py-2.5 text-[10px] font-bold text-[#68364b] transition hover:bg-[#eadce1] sm:w-fit sm:py-2"
                  >
                    View Project
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-[#e4dbd7] py-5 text-[9px] text-[#8a9491] sm:mt-7 sm:flex-row sm:text-[10px]">
        <p>FieldSync Project Management</p>

        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={11} />
          All project data synchronized
        </div>
      </footer>
    </div>
  );
}