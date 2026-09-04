"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import {
  approveProgress,
  getActivity,
  uploadEvidence,
} from "@/lib/api";

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

export default function UpdateProgressPage() {
  const params = useParams();
  const router = useRouter();

  const activityId = Number(params.id);

  const [activity, setActivity] = useState<Activity | null>(null);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("On Track");
  const [remarks, setRemarks] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------
  // Load Activity
  // --------------------------------
  useEffect(() => {
    async function loadActivity() {
      try {
        setLoading(true);
        setError("");

        const data = await getActivity(activityId);

        setActivity(data);
        setProgress(Number(data.progress || 0));
        setStatus(data.status || "On Track");
      } catch (err) {
        console.error(err);
        setError("Failed to load activity data.");
      } finally {
        setLoading(false);
      }
    }

    if (activityId) {
      loadActivity();
    }
  }, [activityId]);

  // --------------------------------
  // Photo Select
  // --------------------------------
  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhoto(file);

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoPreview("");
  }

  // --------------------------------
  // Get Location
  // --------------------------------
  function captureLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setLocationLoading(false);
      },
      (err) => {
        console.error(err);
        setLocationLoading(false);
        alert("Unable to get your location.");
      }
    );
  }

  // --------------------------------
  // Submit Progress
  // --------------------------------
  async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  if (!activity) return;

  try {
    setSubmitting(true);
    setError("");

    // 1. Upload field evidence first
    if (!photo) {
      setError("Please upload a site photo before saving progress.");
      return;
    }

    const evidenceResponse = await uploadEvidence({
      activityId: activity.activity_id,
      type: photo.type,
      latitude: location?.lat,
      longitude: location?.lng,
      file: photo,
    });

    // 2. Get the newly created evidence ID
    const evidenceId = Number(
      evidenceResponse?.db?.id
    );

    if (!evidenceId) {
      throw new Error("Evidence ID was not returned by backend.");
    }

    // 3. Approve progress using the new evidence
    await approveProgress(
      activity.activity_id,
      evidenceId,
      progress
    );

    // 4. Show success
    setSubmitted(true);

  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Progress was not saved completely. Please check the backend and try again."
    );
  } finally {
    setSubmitting(false);
  }
}

  // --------------------------------
  // Loading
  // --------------------------------
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F4F2] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#71807D]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading activity...
        </div>
      </main>
    );
  }

  // --------------------------------
  // Error / Activity Not Found
  // --------------------------------
  if (!activity) {
    return (
      <main className="min-h-screen bg-[#F7F4F2] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-[#E5E0DD] p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-[#24302F]">
            Activity not found
          </h2>

          <p className="mt-2 text-sm text-[#71807D]">
            We could not load this activity.
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

  // --------------------------------
  // Success Screen
  // --------------------------------
  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F7F4F2] px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-[#E5E0DD] rounded-2xl p-8 sm:p-10 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-[#24302F]">
              Progress Updated Successfully
            </h1>

            <p className="mt-2 text-[#71807D]">
              The activity progress has been saved to the project database.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="rounded-xl bg-[#F7F4F2] p-4">
                <p className="text-xs text-[#71807D]">
                  Activity
                </p>

                <p className="mt-1 font-semibold text-[#24302F]">
                  {activity.activity_name}
                </p>
              </div>

              <div className="rounded-xl bg-[#F7F4F2] p-4">
                <p className="text-xs text-[#71807D]">
                  Updated Progress
                </p>

                <p className="mt-1 text-xl font-bold text-[#68364B]">
                  {progress}%
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() =>
                  router.push(`/wbs/activity/${activityId}`)
                }
                className="px-5 py-3 rounded-xl bg-[#68364B] text-white font-medium hover:opacity-90"
              >
                View Activity
              </button>

              <button
                onClick={() => router.push("/wbs")}
                className="px-5 py-3 rounded-xl border border-[#D8D1CE] text-[#24302F] font-medium hover:bg-[#F7F4F2]"
              >
                Back to WBS
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------
  // Main UI
  // --------------------------------
  return (
    <main className="min-h-screen bg-[#F7F4F2]">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-[#71807D] hover:text-[#68364B] mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#24302F]">
              Update Progress
            </h1>

            <p className="mt-1 text-sm text-[#71807D]">
              Update actual progress for this activity.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#71807D]">
            <Clock3 className="w-4 h-4" />
            Live project data
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Activity Summary */}
        <section className="bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#71807D]">
                {activity.wbs_code}
              </p>

              <h2 className="mt-1 text-xl font-bold text-[#24302F]">
                {activity.activity_name}
              </h2>

              <p className="mt-1 text-sm text-[#71807D]">
                Activity ID: {activity.activity_id}
              </p>
            </div>

            <div className="rounded-xl bg-[#F7F4F2] px-5 py-3">
              <p className="text-xs text-[#71807D]">
                Current Progress
              </p>

              <p className="text-2xl font-bold text-[#68364B]">
                {activity.progress}%
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Progress */}
          <section className="bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-[#24302F]">
                  Actual Progress
                </h2>

                <p className="text-sm text-[#71807D] mt-1">
                  Enter the current completion percentage.
                </p>
              </div>

              <div className="text-3xl font-bold text-[#68364B]">
                {progress}%
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) =>
                setProgress(Number(e.target.value))
              }
              className="w-full accent-[#68364B]"
            />

            <div className="flex justify-between text-xs text-[#71807D] mt-2">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>

            <div className="mt-5 h-3 rounded-full bg-[#ECE7E4] overflow-hidden">
              <div
                className="h-full bg-[#68364B] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          {/* Status */}
          <section className="bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-semibold text-[#24302F]">
              Activity Status
            </h2>

            <p className="text-sm text-[#71807D] mt-1 mb-4">
              Select the current activity status.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                "On Track",
                "In Progress",
                "Delayed",
                "Completed",
              ].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition ${status === item
                      ? "border-[#68364B] bg-[#F5EDEF] text-[#68364B]"
                      : "border-[#E5E0DD] text-[#71807D] hover:bg-[#F7F4F2]"
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {/* Remarks */}
          <section className="bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-semibold text-[#24302F]">
              Remarks
            </h2>

            <p className="text-sm text-[#71807D] mt-1 mb-4">
              Add any useful field observations.
            </p>

            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={5}
              placeholder="Enter remarks..."
              className="w-full rounded-xl border border-[#D8D1CE] px-4 py-3 text-sm text-[#24302F] outline-none focus:border-[#68364B] resize-none"
            />
          </section>

          {/* Evidence */}
          <section className="bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <Camera className="w-5 h-5 text-[#68364B]" />

              <h2 className="font-semibold text-[#24302F]">
                Field Evidence
              </h2>
            </div>

            <p className="text-sm text-[#71807D] mb-5">
              Upload a site photo as supporting evidence.
            </p>

            {!photoPreview ? (
              <label className="border-2 border-dashed border-[#D8D1CE] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F7F4F2] transition">
                <Camera className="w-8 h-8 text-[#71807D]" />

                <span className="mt-3 text-sm font-medium text-[#24302F]">
                  Choose Site Photo
                </span>

                <span className="mt-1 text-xs text-[#71807D]">
                  JPG, PNG or WEBP
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Site evidence preview"
                  className="w-full max-h-80 object-cover rounded-xl"
                />

                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>

          {/* Location */}
          <section className="bg-white border border-[#E5E0DD] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#68364B]" />

              <div>
                <h2 className="font-semibold text-[#24302F]">
                  Field Location
                </h2>

                <p className="text-sm text-[#71807D] mt-1">
                  Capture your current GPS location.
                </p>
              </div>
            </div>

            <div className="mt-5">
              {location ? (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <Navigation className="w-4 h-4" />
                    Location captured
                  </div>

                  <p className="mt-2 text-xs text-green-700">
                    Latitude: {location.lat.toFixed(6)}
                  </p>

                  <p className="text-xs text-green-700">
                    Longitude: {location.lng.toFixed(6)}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={locationLoading}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#D8D1CE] text-[#24302F] font-medium flex items-center justify-center gap-2 hover:bg-[#F7F4F2] disabled:opacity-60"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Capture Location
                    </>
                  )}
                </button>
              )}
            </div>
          </section>

          {/* Submit */}
          <section className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-3 rounded-xl border border-[#D8D1CE] text-[#24302F] font-medium hover:bg-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-[#68364B] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Progress
                </>
              )}
            </button>
          </section>

        </form>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#71807D]">
          <RefreshCw className="w-3.5 h-3.5" />
          Changes will be synchronized with the project database
        </div>
      </div>
    </main>
  );
}