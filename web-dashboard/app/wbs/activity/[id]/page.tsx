"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  TrendingUp,
} from "lucide-react";

import { getActivity } from "@/lib/api";

type Activity = {
  activity_id: number;
  wbs_id: number;
  wbs_code: string;
  activity_name: string;
  level: number;
  project_id: number;
  planned_qty: number;
  actual_qty: number;
  unit: string;
  progress: number;
  status: string;
};

export default function ActivityDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const activityId = Number(params.id);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadActivity() {
      try {
        setLoading(true);
        setError("");

        const data = await getActivity(activityId);
        setActivity(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load activity details.");
      } finally {
        setLoading(false);
      }
    }

    if (activityId) {
      loadActivity();
    }
  }, [activityId]);

  // -----------------------------
  // Loading
  // -----------------------------
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F4F2] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#71807D]">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading activity...
        </div>
      </main>
    );
  }

  // -----------------------------
  // Error
  // -----------------------------
  if (error || !activity) {
    return (
      <main className="min-h-screen bg-[#F7F4F2] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E5E0DD] rounded-2xl p-8 text-center max-w-md shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <FileText className="w-7 h-7 text-red-500" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-[#24302F]">
            Activity Not Found
          </h2>

          <p className="mt-2 text-sm text-[#71807D]">
            {error || "This activity could not be loaded."}
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 px-5 py-2.5 rounded-xl bg-[#68364B] text-white text-sm font-medium"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  // -----------------------------
  // Status
  // -----------------------------
  const status = activity.status || "On Track";

  const statusClass =
    status === "Completed"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "Delayed"
      ? "bg-red-50 text-red-700 border-red-200"
      : status === "In Progress"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <main className="min-h-screen bg-[#F7F4F2]">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">

          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-[#71807D] hover:text-[#68364B] mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to WBS
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-[#F0E6EA] text-[#68364B] text-xs font-bold">
                {activity.wbs_code}
              </span>

              <span
                className={`px-3 py-1 rounded-lg border text-xs font-semibold ${statusClass}`}
              >
                {status}
              </span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-[#24302F]">
              {activity.activity_name}
            </h1>

            <p className="mt-1 text-sm text-[#71807D]">
              Activity ID: {activity.activity_id}
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                `/wbs/activity/${activity.activity_id}/update`
              )
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#68364B] text-white font-semibold hover:opacity-90"
          >
            <Pencil className="w-4 h-4" />
            Update Progress
          </button>
        </div>

        {/* Progress Overview */}
        <section className="bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm mb-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div>
              <div className="flex items-center gap-2 text-sm text-[#71807D]">
                <TrendingUp className="w-4 h-4" />
                Current Progress
              </div>

              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-bold text-[#68364B]">
                  {activity.progress}%
                </span>

                <span className="text-sm text-[#71807D] mb-1">
                  completed
                </span>
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <div className="flex justify-between text-xs text-[#71807D] mb-2">
                <span>Actual</span>
                <span>
                  {activity.actual_qty} / {activity.planned_qty}{" "}
                  {activity.unit}
                </span>
              </div>

              <div className="h-4 rounded-full bg-[#ECE7E4] overflow-hidden">
                <div
                  className="h-full bg-[#68364B] rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, activity.progress)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Activity Information */}
          <section className="lg:col-span-2 bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F0E6EA] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#68364B]" />
              </div>

              <div>
                <h2 className="font-semibold text-[#24302F]">
                  Activity Information
                </h2>

                <p className="text-sm text-[#71807D]">
                  Live data from the project database
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <InfoItem
                label="Activity ID"
                value={String(activity.activity_id)}
              />

              <InfoItem
                label="WBS Code"
                value={activity.wbs_code}
              />

              <InfoItem
                label="WBS ID"
                value={String(activity.wbs_id)}
              />

              <InfoItem
                label="Project ID"
                value={String(activity.project_id)}
              />

              <InfoItem
                label="Planned Quantity"
                value={`${activity.planned_qty} ${activity.unit}`}
              />

              <InfoItem
                label="Actual Quantity"
                value={`${activity.actual_qty} ${activity.unit}`}
              />

              <InfoItem
                label="Level"
                value={String(activity.level)}
              />

              <InfoItem
                label="Status"
                value={activity.status}
              />

            </div>
          </section>

          {/* Status Card */}
          <section className="bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>

              <div>
                <h2 className="font-semibold text-[#24302F]">
                  Activity Status
                </h2>

                <p className="text-sm text-[#71807D]">
                  Current state
                </p>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 ${statusClass}`}
            >
              <p className="text-sm font-semibold">
                {status}
              </p>

              <p className="mt-1 text-xs opacity-80">
                Progress: {activity.progress}%
              </p>
            </div>

            <div className="mt-5 space-y-4">

              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-[#71807D]" />

                <div>
                  <p className="text-xs text-[#71807D]">
                    Planned Quantity
                  </p>

                  <p className="text-sm font-medium text-[#24302F]">
                    {activity.planned_qty} {activity.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock3 className="w-4 h-4 text-[#71807D]" />

                <div>
                  <p className="text-xs text-[#71807D]">
                    Actual Quantity
                  </p>

                  <p className="text-sm font-medium text-[#24302F]">
                    {activity.actual_qty} {activity.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#71807D]" />

                <div>
                  <p className="text-xs text-[#71807D]">
                    Project
                  </p>

                  <p className="text-sm font-medium text-[#24302F]">
                    Project #{activity.project_id}
                  </p>
                </div>
              </div>

            </div>
          </section>
        </div>

        {/* Field Evidence */}
        <section className="mt-6 bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0E6EA] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#68364B]" />
            </div>

            <div>
              <h2 className="font-semibold text-[#24302F]">
                Field Evidence
              </h2>

              <p className="text-sm text-[#71807D]">
                Evidence uploaded for this activity will appear here.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border-2 border-dashed border-[#D8D1CE] p-8 text-center">
            <MapPin className="w-8 h-8 mx-auto text-[#71807D]" />

            <p className="mt-3 text-sm font-medium text-[#24302F]">
              Field evidence integration
            </p>

            <p className="mt-1 text-xs text-[#71807D]">
              Photo and GPS evidence can be submitted from Update Progress.
            </p>

            <button
              onClick={() =>
                router.push(
                  `/wbs/activity/${activity.activity_id}/update`
                )
              }
              className="mt-4 px-4 py-2 rounded-lg bg-[#F0E6EA] text-[#68364B] text-sm font-medium"
            >
              Add Evidence
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#71807D]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Activity data synchronized from PostgreSQL
        </div>
      </div>
    </main>
  );
}

// --------------------------------
// Small Info Component
// --------------------------------
function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#F7F4F2] p-4">
      <p className="text-xs text-[#71807D]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#24302F] break-words">
        {value}
      </p>
    </div>
  );
}