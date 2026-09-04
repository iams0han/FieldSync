"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertTriangle,
  X,
  Loader2,
  FileCheck2,
  RefreshCw,
} from "lucide-react";

import {
  getEvidence,
  approveProgress,
  rejectEvidence,
} from "@/lib/api";

type ReviewStatus =
  | "Pending Review"
  | "Approved"
  | "Rejected";

type ReviewItem = {
  id: string;

  // Backend IDs
  backendActivityId: number;
  backendEvidenceId: number;

  activityId: string;
  activity: string;
  phase: string;
  uploadedBy: string;
  date: string;
  time: string;
  location: string;

  status: ReviewStatus;

  description: string;

  aiAnalysis: string;
  aiConfidence: number;

  plannedQty: number;
  actualQty: number;
  unit: string;

  imageUrl?: string;

  reviewReason?: string | null;
};

const PROJECT_ID = 1;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000/api";

const BACKEND_URL = API_BASE_URL.replace(/\/api$/, "");

export default function AIReviewPage() {
  const router = useRouter();

  const [reviewData, setReviewData] =
    useState<ReviewItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | ReviewStatus>("All");

  const [selectedItem, setSelectedItem] =
    useState<ReviewItem | null>(null);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [rejectReason, setRejectReason] =
    useState("");

  const [showRejectBox, setShowRejectBox] =
    useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ==================================================
  // LOAD EVIDENCE FROM BACKEND
  // ==================================================

  async function loadEvidence(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await getEvidence(PROJECT_ID);

      const backendEvidence =
        Array.isArray(response?.evidence)
          ? response.evidence
          : [];

      const mappedData: ReviewItem[] =
        backendEvidence.map((item: any) => {
          const planned = Number(
            item.plan_qty || 0
          );

          const actual = Number(
            item.actual_qty || 0
          );

          // ------------------------------------------
          // BACKEND STATUS -> FRONTEND STATUS
          // ------------------------------------------

          const rawStatus =
            item.review_status ||
            "Pending Review";

          let status: ReviewStatus =
            "Pending Review";

          if (rawStatus === "Approved") {
            status = "Approved";
          } else if (rawStatus === "Rejected") {
            status = "Rejected";
          }

          // ------------------------------------------
          // CREATED DATE
          // ------------------------------------------

          const createdAt =
            item.created_at
              ? new Date(item.created_at)
              : null;

          const validDate =
            createdAt &&
            !Number.isNaN(
              createdAt.getTime()
            );

          const date = validDate
            ? createdAt!.toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )
            : "—";

          const time = validDate
            ? createdAt!.toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )
            : "—";

          // ------------------------------------------
          // AI
          // ------------------------------------------

          const confidence = Number(
            item.ai_confidence || 0
          );

          const aiResult =
            item.ai_result ||
            "No AI analysis result available.";

          // ------------------------------------------
          // IMAGE
          // ------------------------------------------

          let imageUrl:
            | string
            | undefined;

          if (item.uri) {
            if (
              String(item.uri).startsWith(
                "http://"
              ) ||
              String(item.uri).startsWith(
                "https://"
              )
            ) {
              imageUrl = item.uri;
            } else {
              imageUrl =
                `${BACKEND_URL}${item.uri}`;
            }
          }

          // ------------------------------------------
          // RETURN FRONTEND OBJECT
          // ------------------------------------------

          return {
            // Evidence ID
            id: `EVD-${String(
              item.evidence_id
            ).padStart(3, "0")}`,

            // Backend Activity ID
            backendActivityId:
              Number(item.activity_id),

            // IMPORTANT:
            // Backend Evidence ID
            backendEvidenceId:
              Number(item.evidence_id),

            activityId:
              `ACT-${item.activity_id}`,

            activity:
              item.activity_name ||
              "Unknown Activity",

            phase:
              "Infrastructure Project",

            uploadedBy:
              item.uploaded_by ||
              "Field User",

            date,
            time,

            // Backend currently does not
            // persist latitude/longitude.
            location:
              item.latitude !== undefined &&
              item.longitude !== undefined
                ? `${item.latitude}, ${item.longitude}`
                : "GPS not stored",

            status,

            description:
              aiResult,

            aiAnalysis:
              aiResult,

            aiConfidence:
              Number.isFinite(confidence)
                ? confidence
                : 0,

            plannedQty:
              planned,

            actualQty:
              actual,

            unit:
              item.unit || "%",

            imageUrl,

            reviewReason:
              item.review_reason || null,
          };
        });

      setReviewData(mappedData);
    } catch (err) {
      console.error(
        "Failed to load AI review data:",
        err
      );

      setError(
        "Failed to load field evidence from backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadEvidence();
  }, []);

  // ==================================================
  // FILTER
  // ==================================================

  const filteredData = useMemo(() => {
    return reviewData.filter((item) => {
      const searchText =
        search.toLowerCase().trim();

      const matchesSearch =
        item.activity
          .toLowerCase()
          .includes(searchText) ||
        item.activityId
          .toLowerCase()
          .includes(searchText) ||
        item.id
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    reviewData,
    search,
    statusFilter,
  ]);

  // ==================================================
  // SUMMARY
  // ==================================================

  const pendingCount =
    reviewData.filter(
      (item) =>
        item.status ===
        "Pending Review"
    ).length;

  const approvedCount =
    reviewData.filter(
      (item) =>
        item.status === "Approved"
    ).length;

  const rejectedCount =
    reviewData.filter(
      (item) =>
        item.status === "Rejected"
    ).length;

  // ==================================================
  // TOAST
  // ==================================================

  function showToast(
    type: "success" | "error",
    message: string
  ) {
    setToast({
      type,
      message,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  // ==================================================
  // APPROVE
  // ==================================================

  async function handleApprove(
    item: ReviewItem
  ) {
    try {
      setProcessingId(
        item.backendEvidenceId
      );

      console.log(
        "APPROVING EVIDENCE:",
        {
          activity_id:
            item.backendActivityId,

          evidence_id:
            item.backendEvidenceId,

          actual_qty:
            item.actualQty,
        }
      );

      await approveProgress(
        item.backendActivityId,
        item.backendEvidenceId,
        item.actualQty
      );

      showToast(
        "success",
        "Evidence approved and progress updated successfully."
      );

      setSelectedItem(null);

      // Reload directly from database
      await loadEvidence(true);
    } catch (err) {
      console.error(
        "Approve error:",
        err
      );

      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Failed to approve evidence."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==================================================
  // OPEN REJECT BOX
  // ==================================================

  function openRejectBox(
    item: ReviewItem
  ) {
    setSelectedItem(item);
    setRejectReason("");
    setShowRejectBox(true);
  }

  // ==================================================
  // REJECT
  // ==================================================

  async function handleReject(
    item: ReviewItem
  ) {
    const reason =
      rejectReason.trim();

    if (!reason) {
      showToast(
        "error",
        "Please enter a rejection reason."
      );
      return;
    }

    try {
      setProcessingId(
        item.backendEvidenceId
      );

      console.log(
        "REJECTING EVIDENCE:",
        {
          activity_id:
            item.backendActivityId,

          evidence_id:
            item.backendEvidenceId,

          reason,
        }
      );

      await rejectEvidence(
        item.backendActivityId,
        item.backendEvidenceId,
        reason
      );

      showToast(
        "success",
        "Evidence rejected successfully."
      );

      setShowRejectBox(false);
      setRejectReason("");
      setSelectedItem(null);

      // Reload directly from database
      await loadEvidence(true);
    } catch (err) {
      console.error(
        "Reject error:",
        err
      );

      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Failed to reject evidence."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==================================================
  // STATUS STYLE
  // ==================================================

  function getStatusStyle(
    status: ReviewStatus
  ) {
    if (status === "Approved") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "Rejected") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4F2] p-6">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              size={32}
              className="animate-spin text-[#68364B]"
            />

            <p className="text-sm text-[#71807D]">
              Loading AI review data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="min-h-screen bg-[#F7F4F2] p-4 sm:p-6 lg:p-8">

      {/* ==================================================
          TOAST
      ================================================== */}

      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-white"
              : "border-red-200 bg-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2
              size={20}
              className="text-emerald-600"
            />
          ) : (
            <AlertTriangle
              size={20}
              className="text-red-600"
            />
          )}

          <p className="text-sm font-medium text-[#24302F]">
            {toast.message}
          </p>
        </div>
      )}

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FileCheck2
              size={24}
              className="text-[#68364B]"
            />

            <h1 className="text-2xl font-bold text-[#24302F] sm:text-3xl">
              AI Review
            </h1>
          </div>

          <p className="text-sm text-[#71807D]">
            Review AI-processed field evidence
            before approving project progress.
          </p>
        </div>

        <button
          onClick={() =>
            loadEvidence(true)
          }
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#D8D0CC] bg-white px-4 py-2.5 text-sm font-semibold text-[#24302F] transition hover:bg-[#F3EFEC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* TOTAL */}

        <div className="rounded-2xl border border-[#E4DEDA] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-[#71807D]">
              Total Evidence
            </span>

            <FileCheck2
              size={20}
              className="text-[#68364B]"
            />
          </div>

          <p className="text-3xl font-bold text-[#24302F]">
            {reviewData.length}
          </p>
        </div>

        {/* PENDING */}

        <div className="rounded-2xl border border-[#E4DEDA] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-[#71807D]">
              Pending Review
            </span>

            <Clock3
              size={20}
              className="text-amber-600"
            />
          </div>

          <p className="text-3xl font-bold text-[#24302F]">
            {pendingCount}
          </p>
        </div>

        {/* APPROVED */}

        <div className="rounded-2xl border border-[#E4DEDA] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-[#71807D]">
              Approved
            </span>

            <CheckCircle2
              size={20}
              className="text-emerald-600"
            />
          </div>

          <p className="text-3xl font-bold text-[#24302F]">
            {approvedCount}
          </p>
        </div>

        {/* REJECTED */}

        <div className="rounded-2xl border border-[#E4DEDA] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-[#71807D]">
              Rejected
            </span>

            <XCircle
              size={20}
              className="text-red-600"
            />
          </div>

          <p className="text-3xl font-bold text-[#24302F]">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* ==================================================
          FILTER BAR
      ================================================== */}

      <div className="mb-6 rounded-2xl border border-[#E4DEDA] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">

          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9693]"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search activity or evidence..."
              className="w-full rounded-xl border border-[#DDD5D0] bg-[#FAF8F7] py-2.5 pl-10 pr-4 text-sm text-[#24302F] outline-none transition focus:border-[#68364B]"
            />
          </div>

          {/* STATUS */}

          <div className="flex items-center gap-2">
            <Filter
              size={17}
              className="text-[#71807D]"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "All"
                    | ReviewStatus
                )
              }
              className="rounded-xl border border-[#DDD5D0] bg-[#FAF8F7] px-4 py-2.5 text-sm text-[#24302F] outline-none focus:border-[#68364B]"
            >
              <option value="All">
                All Status
              </option>

              <option value="Pending Review">
                Pending Review
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="Rejected">
                Rejected
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================================================
          EMPTY
      ================================================== */}

      {filteredData.length === 0 ? (
        <div className="rounded-2xl border border-[#E4DEDA] bg-white p-12 text-center shadow-sm">
          <FileCheck2
            size={42}
            className="mx-auto mb-4 text-[#B6AAA4]"
          />

          <h3 className="mb-1 text-lg font-semibold text-[#24302F]">
            No evidence found
          </h3>

          <p className="text-sm text-[#71807D]">
            There is no field evidence matching
            your current filters.
          </p>
        </div>
      ) : (

        /* ==================================================
           TABLE
        ================================================== */

        <div className="overflow-hidden rounded-2xl border border-[#E4DEDA] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">

              {/* HEADER */}

              <thead>
                <tr className="border-b border-[#E8E1DD] bg-[#FAF8F7]">

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#71807D]">
                    Evidence
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#71807D]">
                    Activity
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#71807D]">
                    Progress
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#71807D]">
                    AI Analysis
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#71807D]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#71807D]">
                    Action
                  </th>

                </tr>
              </thead>

              {/* BODY */}

              <tbody>
                {filteredData.map(
                  (item) => {

                    const progress =
                      item.plannedQty > 0
                        ? Math.round(
                            (item.actualQty /
                              item.plannedQty) *
                              100
                          )
                        : 0;

                    const safeProgress =
                      Math.min(
                        100,
                        Math.max(
                          0,
                          progress
                        )
                      );

                    const isProcessing =
                      processingId ===
                      item.backendEvidenceId;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[#EEE8E4] last:border-b-0 hover:bg-[#FCFAF9]"
                      >

                        {/* EVIDENCE */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="h-12 w-16 overflow-hidden rounded-lg border border-[#E4DEDA] bg-[#F3EFEC]">

                              {item.imageUrl ? (
                                <img
                                  src={
                                    item.imageUrl
                                  }
                                  alt={
                                    item.activity
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <FileCheck2
                                    size={20}
                                    className="text-[#9A8E88]"
                                  />
                                </div>
                              )}

                            </div>

                            <div>
                              <p className="font-semibold text-[#24302F]">
                                {item.id}
                              </p>

                              <p className="text-xs text-[#71807D]">
                                {item.date}
                              </p>

                              <p className="text-[11px] text-[#9A8E88]">
                                {item.time}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* ACTIVITY */}

                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#24302F]">
                            {item.activity}
                          </p>

                          <p className="mt-1 text-xs text-[#71807D]">
                            {item.activityId}
                          </p>
                        </td>

                        {/* PROGRESS */}

                        <td className="px-5 py-4">
                          <div className="w-32">

                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-[#71807D]">
                                Actual
                              </span>

                              <span className="font-semibold text-[#24302F]">
                                {progress}%
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-[#EAE5E1]">

                              <div
                                className="h-full rounded-full bg-[#68364B]"
                                style={{
                                  width: `${safeProgress}%`,
                                }}
                              />

                            </div>

                            <p className="mt-1 text-[11px] text-[#8A9693]">
                              {item.actualQty}{" "}
                              /{" "}
                              {item.plannedQty}{" "}
                              {item.unit}
                            </p>

                          </div>
                        </td>

                        {/* AI */}

                        <td className="max-w-[280px] px-5 py-4">

                          <p className="line-clamp-2 text-sm text-[#4C5A57]">
                            {item.aiAnalysis}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-[#68364B]">
                            Confidence:{" "}
                            {item.aiConfidence}%
                          </p>

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>

                          {item.reviewReason && (
                            <p className="mt-2 max-w-[180px] text-[11px] text-red-600">
                              {item.reviewReason}
                            </p>
                          )}

                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            {/* VIEW */}

                            <button
                              onClick={() =>
                                setSelectedItem(
                                  item
                                )
                              }
                              className="rounded-lg border border-[#DDD5D0] p-2 text-[#596663] transition hover:bg-[#F3EFEC]"
                              title="View"
                            >
                              <Eye size={17} />
                            </button>

                            {/* ONLY PENDING CAN BE APPROVED/REJECTED */}

                            {item.status ===
                              "Pending Review" && (
                              <>
                                {/* REJECT */}

                                <button
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    openRejectBox(
                                      item
                                    )
                                  }
                                  className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Reject"
                                >
                                  <XCircle
                                    size={17}
                                  />
                                </button>

                                {/* APPROVE */}

                                <button
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    handleApprove(
                                      item
                                    )
                                  }
                                  className="rounded-lg bg-[#68364B] p-2 text-white transition hover:bg-[#542B3D] disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Approve"
                                >
                                  {isProcessing ? (
                                    <Loader2
                                      size={17}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCircle2
                                      size={17}
                                    />
                                  )}
                                </button>
                              </>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )}
              </tbody>

            </table>
          </div>
        </div>
      )}

      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setSelectedItem(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#E8E1DD] px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-[#24302F]">
                  Evidence Review
                </h2>

                <p className="text-xs text-[#71807D]">
                  {selectedItem.id}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedItem(null)
                }
                className="rounded-lg p-2 text-[#71807D] transition hover:bg-[#F3EFEC]"
              >
                <X size={20} />
              </button>

            </div>

            {/* CONTENT */}

            <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">

              {/* IMAGE */}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#24302F]">
                  Field Evidence
                </h3>

                <div className="overflow-hidden rounded-xl border border-[#E4DEDA] bg-[#F5F2F0]">

                  {selectedItem.imageUrl ? (
                    <img
                      src={
                        selectedItem.imageUrl
                      }
                      alt={
                        selectedItem.activity
                      }
                      className="max-h-[420px] w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-72 items-center justify-center">

                      <div className="text-center">
                        <FileCheck2
                          size={42}
                          className="mx-auto mb-2 text-[#A99D97]"
                        />

                        <p className="text-sm text-[#71807D]">
                          No image available
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              </div>

              {/* DETAILS */}

              <div>

                {/* ACTIVITY + STATUS */}

                <div className="mb-5 flex items-center justify-between">

                  <div>
                    <p className="text-xs text-[#71807D]">
                      Activity
                    </p>

                    <h3 className="font-bold text-[#24302F]">
                      {selectedItem.activity}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      selectedItem.status
                    )}`}
                  >
                    {selectedItem.status}
                  </span>

                </div>

                {/* AI ANALYSIS */}

                <div className="mb-5 rounded-xl border border-[#E4DEDA] bg-[#FAF8F7] p-4">

                  <div className="mb-2 flex items-center gap-2">

                    <AlertTriangle
                      size={18}
                      className="text-[#C47A44]"
                    />

                    <h3 className="font-semibold text-[#24302F]">
                      AI Analysis
                    </h3>

                  </div>

                  <p className="text-sm leading-6 text-[#4C5A57]">
                    {selectedItem.aiAnalysis}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs">

                    <span className="text-[#71807D]">
                      AI Confidence
                    </span>

                    <span className="font-bold text-[#68364B]">
                      {selectedItem.aiConfidence}%
                    </span>

                  </div>

                </div>

                {/* QUANTITY */}

                <div className="mb-5 grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-[#E4DEDA] p-4">

                    <p className="text-xs text-[#71807D]">
                      Planned Quantity
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#24302F]">
                      {selectedItem.plannedQty}
                    </p>

                  </div>

                  <div className="rounded-xl border border-[#E4DEDA] p-4">

                    <p className="text-xs text-[#71807D]">
                      Actual Quantity
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#68364B]">
                      {selectedItem.actualQty}
                    </p>

                  </div>

                </div>

                {/* META */}

                <div className="space-y-3 rounded-xl border border-[#E4DEDA] p-4">

                  <div className="flex justify-between gap-4">

                    <span className="text-sm text-[#71807D]">
                      Evidence ID
                    </span>

                    <span className="text-sm font-semibold text-[#24302F]">
                      {selectedItem.id}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-sm text-[#71807D]">
                      Activity ID
                    </span>

                    <span className="text-sm font-semibold text-[#24302F]">
                      {selectedItem.activityId}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-sm text-[#71807D]">
                      Uploaded By
                    </span>

                    <span className="text-sm font-semibold text-[#24302F]">
                      {selectedItem.uploadedBy}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-sm text-[#71807D]">
                      Location
                    </span>

                    <span className="text-sm font-semibold text-[#24302F]">
                      {selectedItem.location}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-sm text-[#71807D]">
                      Uploaded
                    </span>

                    <span className="text-sm font-semibold text-[#24302F]">
                      {selectedItem.date}{" "}
                      {selectedItem.time}
                    </span>

                  </div>

                  {/* REJECTION REASON */}

                  {selectedItem.reviewReason && (
                    <div className="border-t border-[#E8E1DD] pt-3">

                      <span className="text-sm text-[#71807D]">
                        Rejection Reason
                      </span>

                      <p className="mt-1 text-sm font-semibold text-red-600">
                        {selectedItem.reviewReason}
                      </p>

                    </div>
                  )}

                </div>

              </div>
            </div>

            {/* FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-[#E8E1DD] px-5 py-4 sm:flex-row sm:justify-end">

              {/* VIEW ACTIVITY */}

              <button
                onClick={() =>
                  router.push(
                    `/wbs/activity/${selectedItem.backendActivityId}`
                  )
                }
                className="rounded-xl border border-[#D8D0CC] px-4 py-2.5 text-sm font-semibold text-[#24302F] transition hover:bg-[#F3EFEC]"
              >
                View Activity
              </button>

              {/* REJECT + APPROVE */}

              {selectedItem.status ===
                "Pending Review" && (
                <>
                  <button
                    disabled={
                      processingId ===
                      selectedItem.backendEvidenceId
                    }
                    onClick={() =>
                      openRejectBox(
                        selectedItem
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle size={17} />
                    Reject
                  </button>

                  <button
                    disabled={
                      processingId ===
                      selectedItem.backendEvidenceId
                    }
                    onClick={() =>
                      handleApprove(
                        selectedItem
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#68364B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#542B3D] disabled:opacity-50"
                  >
                    {processingId ===
                    selectedItem.backendEvidenceId ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={17}
                      />
                    )}

                    {processingId ===
                    selectedItem.backendEvidenceId
                      ? "Approving..."
                      : "Approve Evidence"}
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          REJECT REASON MODAL
      ================================================== */}

      {showRejectBox &&
        selectedItem && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
            onClick={() =>
              setShowRejectBox(false)
            }
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="mb-4 flex items-start justify-between">

                <div>
                  <h3 className="text-lg font-bold text-[#24302F]">
                    Reject Evidence
                  </h3>

                  <p className="mt-1 text-xs text-[#71807D]">
                    {selectedItem.id} ·{" "}
                    {selectedItem.activity}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowRejectBox(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-[#71807D] hover:bg-[#F3EFEC]"
                >
                  <X size={18} />
                </button>

              </div>

              {/* REASON */}

              <label className="mb-2 block text-sm font-semibold text-[#24302F]">
                Rejection Reason
              </label>

              <textarea
                value={rejectReason}
                onChange={(e) =>
                  setRejectReason(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Explain why this evidence is being rejected..."
                className="w-full resize-none rounded-xl border border-[#DDD5D0] bg-[#FAF8F7] p-3 text-sm text-[#24302F] outline-none focus:border-[#68364B]"
              />

              {/* BUTTONS */}

              <div className="mt-4 flex justify-end gap-3">

                <button
                  onClick={() => {
                    setShowRejectBox(
                      false
                    );
                    setRejectReason("");
                  }}
                  className="rounded-xl border border-[#D8D0CC] px-4 py-2.5 text-sm font-semibold text-[#24302F] hover:bg-[#F3EFEC]"
                >
                  Cancel
                </button>

                <button
                  disabled={
                    !rejectReason.trim() ||
                    processingId !== null
                  }
                  onClick={() =>
                    handleReject(
                      selectedItem
                    )
                  }
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {processingId !== null ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <XCircle
                      size={17}
                    />
                  )}

                  {processingId !== null
                    ? "Rejecting..."
                    : "Reject Evidence"}

                </button>

              </div>
            </div>
          </div>
        )}
    </div>
  );
}