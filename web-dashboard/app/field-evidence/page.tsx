"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  FileImage,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import AppShell from "@/components/AppShell";

import {
  getDashboard,
  getEvidence,
  uploadEvidence,
} from "@/lib/api";

const PROJECT_ID = 1;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

type EvidenceStatus =
  | "Approved"
  | "Rejected"
  | "Pending Review";

type EvidenceItem = {
  evidence_id: number;
  activity_id: number;
  wbs_code?: string | null;
  activity_name?: string | null;
  uri?: string | null;
  ai_result?: string | null;
  ai_confidence?: number | null;
  review_status?: string | null;
  review_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  lat?: number | null;
  lng?: number | null;
};

type Activity = {
  activity_id: number;
  wbs_id?: number;
  wbs_code?: string | null;
  activity_name: string;
  planned_qty: number;
  actual_qty: number;
  progress: number;
  status: string;
  unit?: string;
};

function getStatus(status?: string | null): EvidenceStatus {
  if (status === "Approved") return "Approved";
  if (status === "Rejected") return "Rejected";

  return "Pending Review";
}

function getImageUrl(uri?: string | null) {
  if (!uri) return "";

  if (
    uri.startsWith("http://") ||
    uri.startsWith("https://")
  ) {
    return uri;
  }

  if (uri.startsWith("/")) {
    return `${BACKEND_ORIGIN}${uri}`;
  }

  return `${BACKEND_ORIGIN}/${uri}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCoordinates(item: EvidenceItem) {
  const latitude = item.latitude ?? item.lat;
  const longitude = item.longitude ?? item.lng;

  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lng,
  };
}

function getLocation(item: EvidenceItem) {
  const coordinates = getCoordinates(item);

  if (!coordinates) {
    return "GPS not stored";
  }

  return `${coordinates.latitude.toFixed(
    5
  )}, ${coordinates.longitude.toFixed(5)}`;
}

function getMapsUrl(item: EvidenceItem) {
  const coordinates = getCoordinates(item);

  if (!coordinates) {
    return null;
  }

  return `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
}

function getStatusClasses(status: EvidenceStatus) {
  if (status === "Approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getStatusIcon(status: EvidenceStatus) {
  if (status === "Approved") {
    return <CheckCircle2 size={15} />;
  }

  if (status === "Rejected") {
    return <XCircle size={15} />;
  }

  return <Clock3 size={15} />;
}

export default function FieldEvidencePage() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [evidenceData, setEvidenceData] =
    useState<EvidenceItem[]>([]);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [projectName, setProjectName] = useState(
    "Infrastructure Project"
  );

  const [overallProgress, setOverallProgress] =
    useState(0);

  const [selectedActivityId, setSelectedActivityId] =
    useState<number | "">("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | EvidenceStatus>("All");

  const [selectedEvidence, setSelectedEvidence] =
    useState<EvidenceItem | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUploading, setIsUploading] =
    useState(false);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [uploadMessage, setUploadMessage] =
    useState("");

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // =========================================================
  // LOAD REAL BACKEND DATA
  // =========================================================

  async function loadData(
    showRefreshLoader = false
  ) {
    try {
      setError("");

      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [dashboard, evidence] =
        await Promise.all([
          getDashboard(PROJECT_ID),
          getEvidence(PROJECT_ID),
        ]);

      // Project information
      if (dashboard?.project?.name) {
        setProjectName(
          dashboard.project.name
        );
      }

      // Real project progress
      if (
        dashboard?.overall_progress_pct !==
          undefined &&
        dashboard?.overall_progress_pct !== null
      ) {
        setOverallProgress(
          Number(
            dashboard.overall_progress_pct
          )
        );
      }

      // Activities
      if (
        Array.isArray(
          dashboard?.activities
        )
      ) {
        setActivities(
          dashboard.activities
        );

        if (
          selectedActivityId === "" &&
          dashboard.activities.length > 0
        ) {
          setSelectedActivityId(
            dashboard.activities[0]
              .activity_id
          );
        }
      }

      // Evidence
      if (Array.isArray(evidence)) {
        setEvidenceData(evidence);
      } else {
        setEvidenceData([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Failed to load field evidence data from backend."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // FILE SELECT
  // =========================================================

  function handleFileSelect(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select an image file."
      );

      return;
    }

    setError("");
    setUploadMessage("");
    setSelectedFile(file);

    const objectUrl =
      URL.createObjectURL(file);

    setPreviewUrl(objectUrl);
  }

  function handleFileInput(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    handleFileSelect(file);
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    const file =
      event.dataTransfer.files?.[0];

    handleFileSelect(file);
  }

  function clearSelectedFile() {
    setSelectedFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // =========================================================
  // GPS
  // =========================================================

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setError(
          "Unable to access GPS location. Evidence can still be uploaded without GPS."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // =========================================================
  // UPLOAD
  // =========================================================

  async function handleUpload() {
    if (selectedActivityId === "") {
      setError(
        "Please select an activity."
      );

      return;
    }

    if (!selectedFile) {
      setError(
        "Please select an image first."
      );

      return;
    }

    try {
      setError("");
      setUploadMessage("");
      setIsUploading(true);

      await uploadEvidence({
        activityId:
          Number(selectedActivityId),

        type: selectedFile.type,

        latitude: location?.lat,

        longitude: location?.lng,

        file: selectedFile,
      });

      setUploadMessage(
        "Evidence uploaded successfully. Refreshing data..."
      );

      clearSelectedFile();

      await loadData(true);

      setUploadMessage(
        "Evidence uploaded successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload field evidence."
      );
    } finally {
      setIsUploading(false);
    }
  }

  // =========================================================
  // FILTER
  // =========================================================

  const filteredEvidence = useMemo(() => {
    return evidenceData.filter((item) => {
      const status = getStatus(
        item.review_status
      );

      const query =
        searchText.trim().toLowerCase();

      const matchesSearch =
        !query ||
        String(item.evidence_id)
          .toLowerCase()
          .includes(query) ||
        String(item.wbs_code || "")
          .toLowerCase()
          .includes(query) ||
        String(item.activity_name || "")
          .toLowerCase()
          .includes(query) ||
        String(item.ai_result || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    evidenceData,
    searchText,
    statusFilter,
  ]);

  // =========================================================
  // COUNTS
  // =========================================================

  const approvedCount =
    evidenceData.filter(
      (item) =>
        getStatus(
          item.review_status
        ) === "Approved"
    ).length;

  const rejectedCount =
    evidenceData.filter(
      (item) =>
        getStatus(
          item.review_status
        ) === "Rejected"
    ).length;

  const pendingCount =
    evidenceData.filter(
      (item) =>
        getStatus(
          item.review_status
        ) === "Pending Review"
    ).length;

  const latestEvidence =
    evidenceData.length > 0
      ? evidenceData[0]
      : null;

  // =========================================================
  // UI
  // =========================================================

  return (
    <AppShell>
      <main className="min-h-screen w-full bg-[#F7F4F2] px-8 py-8 xl:px-10">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#24302F]">
              Field Evidence
            </h1>

            <p className="mt-2 text-base text-[#71807D]">
              Capture and review real-time field evidence.
            </p>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#68364B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#592d40] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                isRefreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {isRefreshing
              ? "Refreshing..."
              : "Refresh Data"}
          </button>
        </div>

        {/* =====================================================
            PROJECT SUMMARY
        ====================================================== */}

        <section className="mb-8 rounded-2xl bg-[#102A2A] p-8 text-white shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#C47A44] px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
                Active Project
              </div>

              <h2 className="text-3xl font-bold">
                {projectName}
              </h2>

              <p className="mt-2 text-base text-white/60">
                Field evidence collection and verification
              </p>
            </div>

            <div className="w-full max-w-[300px]">
              <div className="mb-3 flex items-center justify-between text-base">
                <span className="text-white/60">
                  Project Progress
                </span>

                <span className="font-bold">
                  {Math.round(
                    overallProgress
                  )}
                  %
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#C47A44] transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        overallProgress
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
              className="ml-auto"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {uploadMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
            <CheckCircle2 size={19} />

            <span>
              {uploadMessage}
            </span>
          </div>
        )}

        {/* =====================================================
            STATS
        ====================================================== */}

        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base text-[#71807D]">
                Total Evidence
              </span>

              <FileImage
                size={21}
                className="text-[#68364B]"
              />
            </div>

            <div className="text-4xl font-bold text-[#24302F]">
              {evidenceData.length}
            </div>

            <p className="mt-2 text-sm text-[#71807D]">
              Records from PostgreSQL
            </p>
          </div>

          {/* APPROVED */}

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base text-[#71807D]">
                Approved
              </span>

              <CheckCircle2
                size={21}
                className="text-emerald-600"
              />
            </div>

            <div className="text-4xl font-bold text-emerald-700">
              {approvedCount}
            </div>

            <p className="mt-2 text-sm text-[#71807D]">
              Verified evidence
            </p>
          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base text-[#71807D]">
                Pending Review
              </span>

              <Clock3
                size={21}
                className="text-amber-600"
              />
            </div>

            <div className="text-4xl font-bold text-amber-700">
              {pendingCount}
            </div>

            <p className="mt-2 text-sm text-[#71807D]">
              Waiting for verification
            </p>
          </div>

          {/* FLAGGED */}

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base text-[#71807D]">
                Flagged
              </span>

              <XCircle
                size={21}
                className="text-red-600"
              />
            </div>

            <div className="text-4xl font-bold text-red-700">
              {rejectedCount}
            </div>

            <p className="mt-2 text-sm text-[#71807D]">
              Rejected evidence
            </p>
          </div>
        </section>

        {/* =====================================================
            UPLOAD + LATEST
        ====================================================== */}

        <section className="mb-8 grid grid-cols-1 gap-7 xl:grid-cols-[1.2fr_0.8fr]">

          {/* ===================================================
              UPLOAD FIELD EVIDENCE
          ==================================================== */}

          <div className="rounded-2xl border border-black/5 bg-white p-7 shadow-sm">

            <div className="mb-7">
              <h2 className="text-xl font-bold text-[#24302F]">
                Upload Field Evidence
              </h2>

              <p className="mt-2 text-base text-[#71807D]">
                Upload a field image for AI analysis and review.
              </p>
            </div>

            {/* ACTIVITY */}

            <div className="mb-6">
              <label className="mb-2.5 block text-sm font-semibold text-[#24302F]">
                Activity
              </label>

              <select
                value={selectedActivityId}
                onChange={(e) =>
                  setSelectedActivityId(
                    e.target.value
                      ? Number(
                          e.target.value
                        )
                      : ""
                  )
                }
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-base text-[#24302F] outline-none transition focus:border-[#68364B] focus:ring-2 focus:ring-[#68364B]/10"
              >
                <option value="">
                  Select activity
                </option>

                {activities.map(
                  (activity) => (
                    <option
                      key={
                        activity.activity_id
                      }
                      value={
                        activity.activity_id
                      }
                    >
                      {activity.wbs_code
                        ? `${activity.wbs_code} — `
                        : ""}
                      {
                        activity.activity_name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {/* DROPZONE */}

            {!selectedFile ? (
              <div
                onDragOver={(e) =>
                  e.preventDefault()
                }
                onDrop={handleDrop}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="cursor-pointer rounded-2xl border-2 border-dashed border-[#68364B]/25 bg-[#F7F4F2] px-6 py-14 text-center transition hover:border-[#68364B]/50 hover:bg-[#f3eeeb]"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#68364B]/10">
                  <Upload
                    size={28}
                    className="text-[#68364B]"
                  />
                </div>

                <h3 className="text-base font-semibold text-[#24302F]">
                  Drop your image here
                </h3>

                <p className="mt-2 text-sm text-[#71807D]">
                  or click to browse from your device
                </p>

                <p className="mt-4 text-xs text-[#71807D]">
                  JPG, JPEG, PNG supported
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/10">

                <div className="relative aspect-video min-h-[280px] bg-[#102A2A]">
                  <img
                    src={previewUrl}
                    alt="Selected evidence"
                    className="h-full w-full object-contain"
                  />

                  <button
                    onClick={clearSelectedFile}
                    className="absolute right-4 top-4 rounded-full bg-black/60 p-2.5 text-white transition hover:bg-black/80"
                  >
                    <XCircle size={19} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 p-5">

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#24302F]">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-[#71807D]">
                      {(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="shrink-0 rounded-lg border border-[#68364B]/20 px-4 py-2.5 text-xs font-semibold text-[#68364B] transition hover:bg-[#68364B]/5"
                  >
                    Change
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              </div>
            )}

            {/* GPS */}

            <div className="mt-6 rounded-2xl border border-black/5 bg-[#F7F4F2] p-5">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#68364B]/10">
                    <MapPin
                      size={19}
                      className="text-[#68364B]"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#24302F]">
                      GPS Location
                    </p>

                    {location ? (
                      <>
                        <p className="mt-1 text-xs text-emerald-700">
                          Location captured:{" "}
                          {location.lat.toFixed(
                            5
                          )}
                          ,{" "}
                          {location.lng.toFixed(
                            5
                          )}
                        </p>

                        <a
                          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#68364B] hover:underline"
                        >
                          <MapPin size={13} />
                          Open in Google Maps
                          <ExternalLink
                            size={12}
                          />
                        </a>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-[#71807D]">
                        Location has not been captured
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={getCurrentLocation}
                  className="rounded-lg border border-[#68364B]/20 bg-white px-4 py-2.5 text-xs font-semibold text-[#68364B] transition hover:bg-[#68364B]/5"
                >
                  {location
                    ? "Update Location"
                    : "Capture GPS"}
                </button>
              </div>
            </div>

            {/* UPLOAD BUTTON */}

            <button
              onClick={handleUpload}
              disabled={
                isUploading ||
                !selectedFile ||
                selectedActivityId === ""
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#68364B] px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#592d40] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw
                    size={19}
                    className="animate-spin"
                  />

                  Uploading & Analyzing...
                </>
              ) : (
                <>
                  <Camera size={19} />

                  Upload Evidence
                </>
              )}
            </button>
          </div>

          {/* ===================================================
              LATEST EVIDENCE
          ==================================================== */}

          <div className="rounded-2xl border border-black/5 bg-white p-7 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-[#24302F]">
                  Latest Evidence
                </h2>

                <p className="mt-2 text-base text-[#71807D]">
                  Most recent field submission
                </p>
              </div>

              <ShieldCheck
                size={24}
                className="text-[#68364B]"
              />
            </div>

            {latestEvidence ? (
              <>
                {/* IMAGE */}

                <div className="overflow-hidden rounded-2xl bg-[#102A2A]">
                  {latestEvidence.uri ? (
                    <img
                      src={getImageUrl(
                        latestEvidence.uri
                      )}
                      alt="Latest field evidence"
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-white/50">
                      <FileImage size={45} />
                    </div>
                  )}
                </div>

                {/* DETAILS */}

                <div className="mt-5">

                  <div className="mb-4 flex items-start justify-between gap-4">

                    <div>
                      <p className="text-base font-bold text-[#24302F]">
                        Evidence #
                        {
                          latestEvidence.evidence_id
                        }
                      </p>

                      <p className="mt-1 text-sm text-[#71807D]">
                        {
                          latestEvidence.wbs_code ||
                          "—"
                        }
                        {" • "}
                        {
                          latestEvidence.activity_name ||
                          "Unknown activity"
                        }
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                        getStatus(
                          latestEvidence.review_status
                        )
                      )}`}
                    >
                      {getStatusIcon(
                        getStatus(
                          latestEvidence.review_status
                        )
                      )}

                      {getStatus(
                        latestEvidence.review_status
                      )}
                    </span>
                  </div>

                  <div className="space-y-3 border-t border-black/5 pt-4 text-sm">

                    <div className="flex justify-between gap-4">
                      <span className="text-[#71807D]">
                        AI Result
                      </span>

                      <span className="text-right font-medium text-[#24302F]">
                        {
                          latestEvidence.ai_result ||
                          "Not available"
                        }
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-[#71807D]">
                        Confidence
                      </span>

                      <span className="font-medium text-[#24302F]">
                        {latestEvidence.ai_confidence !==
                          null &&
                        latestEvidence.ai_confidence !==
                          undefined
                          ? `${latestEvidence.ai_confidence}%`
                          : "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-[#71807D]">
                        Submitted
                      </span>

                      <span className="text-right font-medium text-[#24302F]">
                        {formatDate(
                          latestEvidence.created_at
                        )}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[#71807D]">
                        Location
                      </span>

                      <div className="text-right">
                        <span className="block font-medium text-[#24302F]">
                          {getLocation(
                            latestEvidence
                          )}
                        </span>

                        {getMapsUrl(
                          latestEvidence
                        ) && (
                          <a
                            href={getMapsUrl(
                              latestEvidence
                            )!}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#68364B] hover:underline"
                          >
                            <MapPin
                              size={12}
                            />
                            View on Map
                            <ExternalLink
                              size={11}
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedEvidence(
                        latestEvidence
                      )
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#68364B]/20 px-4 py-3 text-sm font-semibold text-[#68364B] transition hover:bg-[#68364B]/5"
                  >
                    <Eye size={17} />
                    View Details
                  </button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl bg-[#F7F4F2] text-center">

                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#68364B]/10">
                  <FileImage
                    size={28}
                    className="text-[#68364B]"
                  />
                </div>

                <h3 className="text-base font-semibold text-[#24302F]">
                  No evidence yet
                </h3>

                <p className="mt-2 max-w-xs text-sm text-[#71807D]">
                  Uploaded field evidence will appear here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            EVIDENCE RECORDS
        ====================================================== */}

        <section className="rounded-2xl border border-black/5 bg-white shadow-sm">

          <div className="border-b border-black/5 p-7">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-xl font-bold text-[#24302F]">
                  Evidence Records
                </h2>

                <p className="mt-2 text-base text-[#71807D]">
                  All field evidence stored in the backend.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                {/* SEARCH */}

                <div className="relative">

                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71807D]"
                  />

                  <input
                    value={searchText}
                    onChange={(e) =>
                      setSearchText(
                        e.target.value
                      )
                    }
                    placeholder="Search evidence..."
                    className="w-full rounded-xl border border-black/10 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#68364B] focus:ring-2 focus:ring-[#68364B]/10 sm:w-[240px]"
                  />
                </div>

                {/* FILTER */}

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "All"
                        | EvidenceStatus
                    )
                  }
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#68364B]"
                >
                  <option value="All">
                    All Status
                  </option>

                  <option value="Approved">
                    Approved
                  </option>

                  <option value="Pending Review">
                    Pending Review
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* LOADING */}

          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="flex items-center gap-3 text-sm text-[#71807D]">

                <RefreshCw
                  size={20}
                  className="animate-spin text-[#68364B]"
                />

                Loading evidence...
              </div>
            </div>
          ) : filteredEvidence.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

              <FileImage
                size={42}
                className="mb-4 text-[#71807D]"
              />

              <p className="text-base font-semibold text-[#24302F]">
                No evidence found
              </p>

              <p className="mt-2 text-sm text-[#71807D]">
                No records match the current filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px]">

                <thead>
                  <tr className="border-b border-black/5 bg-[#F7F4F2] text-left text-xs uppercase tracking-wide text-[#71807D]">

                    <th className="px-7 py-5">
                      Evidence
                    </th>

                    <th className="px-7 py-5">
                      Activity
                    </th>

                    <th className="px-7 py-5">
                      AI Analysis
                    </th>

                    <th className="px-7 py-5">
                      GPS
                    </th>

                    <th className="px-7 py-5">
                      Submitted
                    </th>

                    <th className="px-7 py-5">
                      Status
                    </th>

                    <th className="px-7 py-5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvidence.map(
                    (item) => {
                      const status =
                        getStatus(
                          item.review_status
                        );

                      const mapsUrl =
                        getMapsUrl(item);

                      return (
                        <tr
                          key={
                            item.evidence_id
                          }
                          className="border-b border-black/5 last:border-0 hover:bg-[#F7F4F2]/60"
                        >
                          {/* EVIDENCE */}

                          <td className="px-7 py-5">

                            <div className="flex items-center gap-4">

                              <div className="h-14 w-[72px] overflow-hidden rounded-xl bg-[#102A2A]">

                                {item.uri ? (
                                  <img
                                    src={getImageUrl(
                                      item.uri
                                    )}
                                    alt={`Evidence ${item.evidence_id}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-white/50">
                                    <FileImage
                                      size={20}
                                    />
                                  </div>
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-[#24302F]">
                                  EVD-
                                  {String(
                                    item.evidence_id
                                  ).padStart(
                                    3,
                                    "0"
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-[#71807D]">
                                  ID #
                                  {
                                    item.evidence_id
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* ACTIVITY */}

                          <td className="px-7 py-5">

                            <p className="text-sm font-semibold text-[#24302F]">
                              {
                                item.wbs_code ||
                                "—"
                              }
                            </p>

                            <p className="mt-1 text-xs text-[#71807D]">
                              {
                                item.activity_name ||
                                "Unknown activity"
                              }
                            </p>
                          </td>

                          {/* AI */}

                          <td className="px-7 py-5">

                            <p className="max-w-[220px] truncate text-sm font-medium text-[#24302F]">
                              {
                                item.ai_result ||
                                "No AI result"
                              }
                            </p>

                            <p className="mt-1 text-xs text-[#71807D]">
                              Confidence:{" "}
                              {item.ai_confidence !==
                                null &&
                              item.ai_confidence !==
                                undefined
                                ? `${item.ai_confidence}%`
                                : "—"}
                            </p>
                          </td>

                          {/* GPS */}

                          <td className="px-7 py-5">

                            {mapsUrl ? (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex flex-col gap-1"
                              >
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#24302F]">
                                  <MapPin
                                    size={15}
                                    className="text-[#68364B]"
                                  />

                                  GPS Available
                                </span>

                                <span className="text-xs text-[#71807D]">
                                  {getLocation(
                                    item
                                  )}
                                </span>

                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#68364B] hover:underline">
                                  Open Map
                                  <ExternalLink
                                    size={11}
                                  />
                                </span>
                              </a>
                            ) : (
                              <span className="text-xs text-[#71807D]">
                                GPS not stored
                              </span>
                            )}
                          </td>

                          {/* DATE */}

                          <td className="px-7 py-5 text-sm text-[#24302F]">
                            {formatDate(
                              item.created_at
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-7 py-5">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                                status
                              )}`}
                            >
                              {getStatusIcon(
                                status
                              )}

                              {status}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-7 py-5 text-right">

                            <button
                              onClick={() =>
                                setSelectedEvidence(
                                  item
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#68364B]/20 px-4 py-2.5 text-xs font-semibold text-[#68364B] transition hover:bg-[#68364B]/5"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =====================================================
            DETAILS MODAL
        ====================================================== */}

        {selectedEvidence && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
            onClick={() =>
              setSelectedEvidence(null)
            }
          >
            <div
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-black/5 p-6">

                <div>
                  <h3 className="text-xl font-bold text-[#24302F]">
                    Evidence #
                    {
                      selectedEvidence.evidence_id
                    }
                  </h3>

                  <p className="mt-1.5 text-sm text-[#71807D]">
                    {
                      selectedEvidence.activity_name ||
                      "Unknown activity"
                    }
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelectedEvidence(
                      null
                    )
                  }
                  className="rounded-full p-2 text-[#71807D] transition hover:bg-[#F7F4F2]"
                >
                  <XCircle size={22} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-7 p-6 lg:grid-cols-2">

                {/* IMAGE */}

                <div className="overflow-hidden rounded-2xl bg-[#102A2A]">

                  {selectedEvidence.uri ? (
                    <img
                      src={getImageUrl(
                        selectedEvidence.uri
                      )}
                      alt="Field evidence"
                      className="max-h-[500px] min-h-[350px] w-full object-contain"
                    />
                  ) : (
                    <div className="flex min-h-[350px] items-center justify-center text-white/50">
                      <FileImage size={48} />
                    </div>
                  )}
                </div>

                {/* DETAILS */}

                <div className="space-y-5">

                  {/* REVIEW STATUS */}

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#71807D]">
                      Review Status
                    </p>

                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClasses(
                        getStatus(
                          selectedEvidence.review_status
                        )
                      )}`}
                    >
                      {getStatusIcon(
                        getStatus(
                          selectedEvidence.review_status
                        )
                      )}

                      {getStatus(
                        selectedEvidence.review_status
                      )}
                    </span>
                  </div>

                  {/* ACTIVITY */}

                  <div className="rounded-2xl bg-[#F7F4F2] p-5">

                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#71807D]">
                      Activity
                    </p>

                    <p className="font-semibold text-[#24302F]">
                      {
                        selectedEvidence.wbs_code ||
                        "—"
                      }
                    </p>

                    <p className="mt-1 text-sm text-[#71807D]">
                      {
                        selectedEvidence.activity_name ||
                        "Unknown activity"
                      }
                    </p>
                  </div>

                  {/* AI */}

                  <div className="grid grid-cols-2 gap-4">

                    <div className="rounded-2xl border border-black/5 p-5">

                      <p className="text-xs text-[#71807D]">
                        AI Result
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#24302F]">
                        {
                          selectedEvidence.ai_result ||
                          "Not available"
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl border border-black/5 p-5">

                      <p className="text-xs text-[#71807D]">
                        Confidence
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#24302F]">
                        {selectedEvidence.ai_confidence !==
                          null &&
                        selectedEvidence.ai_confidence !==
                          undefined
                          ? `${selectedEvidence.ai_confidence}%`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* META */}

                  <div className="space-y-4 rounded-2xl border border-black/5 p-5">

                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-[#71807D]">
                        Submitted
                      </span>

                      <span className="text-right text-sm font-medium text-[#24302F]">
                        {formatDate(
                          selectedEvidence.created_at
                        )}
                      </span>
                    </div>

                    {/* GPS */}

                    <div className="flex items-start justify-between gap-4">

                      <span className="text-sm text-[#71807D]">
                        GPS
                      </span>

                      <div className="text-right">

                        <span className="block text-sm font-medium text-[#24302F]">
                          {getLocation(
                            selectedEvidence
                          )}
                        </span>

                        {getMapsUrl(
                          selectedEvidence
                        ) && (
                          <a
                            href={getMapsUrl(
                              selectedEvidence
                            )!}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#68364B]/20 px-3 py-2 text-xs font-semibold text-[#68364B] transition hover:bg-[#68364B]/5"
                          >
                            <MapPin size={13} />
                            Open in Google Maps
                            <ExternalLink
                              size={12}
                            />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between gap-4">

                      <span className="text-sm text-[#71807D]">
                        Reviewed By
                      </span>

                      <span className="text-right text-sm font-medium text-[#24302F]">
                        {
                          selectedEvidence.reviewed_by ||
                          "—"
                        }
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">

                      <span className="text-sm text-[#71807D]">
                        Reviewed At
                      </span>

                      <span className="text-right text-sm font-medium text-[#24302F]">
                        {formatDate(
                          selectedEvidence.reviewed_at
                        )}
                      </span>
                    </div>
                  </div>

                  {/* REVIEW REASON */}

                  {selectedEvidence.review_reason && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                      <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                        Review Reason
                      </p>

                      <p className="mt-2 text-sm text-red-700">
                        {
                          selectedEvidence.review_reason
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}