const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function getDashboard(projectId: number) {
  const res = await fetch(`${API_BASE_URL}/dashboard/${projectId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
}

export async function getProjectWBS(projectId: number) {
  const res = await fetch(`${API_BASE_URL}/prj/${projectId}/wbs`);

  if (!res.ok) {
    throw new Error("Failed to fetch WBS data");
  }

  return res.json();
}

export async function getProjects() {
  const res = await fetch(`${API_BASE_URL}/projects`);

  if (!res.ok) {
    throw new Error("Failed to fetch projects");
  }

  return res.json();
}

export async function getActivity(activityId: number) {
  const res = await fetch(`${API_BASE_URL}/activity/${activityId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch activity details");
  }

  return res.json();
}

export async function approveProgress(
  activityId: number,
  evidenceId: number,
  actualQuantity: number
) {
  const res = await fetch(`${API_BASE_URL}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      activity_id: activityId,
      evidence_id: evidenceId,
      actual_qty: actualQuantity,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);

    throw new Error(
      errorData?.message ||
      errorData?.err ||
      "Failed to approve evidence"
    );
  }

  return res.json();
}

export async function rejectEvidence(
  activityId: number,
  evidenceId: number,
  reason?: string
) {
  const res = await fetch(`${API_BASE_URL}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      activity_id: activityId,
      evidence_id: evidenceId,
      reason: reason || "Evidence rejected",
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);

    throw new Error(
      errorData?.message ||
      errorData?.err ||
      "Failed to reject evidence"
    );
  }

  return res.json();
}

export async function getDelayAlerts(projectId: number) {
  const res = await fetch(
    `${API_BASE_URL}/delay-alerts/${projectId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch delay alerts");
  }

  return res.json();
}

export async function uploadEvidence({
  activityId,
  type,
  latitude,
  longitude,
  file,
}: {
  activityId: number;
  type: string;
  latitude?: number;
  longitude?: number;
  file?: File;
}) {
  const formData = new FormData();

  formData.append("id", String(activityId));
  const normalizedType = type.startsWith("image/") ? "img" : "aud";
  formData.append("t", normalizedType);

  if (latitude !== undefined) {
    formData.append("lat", String(latitude));
  }

  if (longitude !== undefined) {
    formData.append("lng", String(longitude));
  }

  if (file) {
    formData.append("file", file);
  }

  const res = await fetch(`${API_BASE_URL}/evd`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload field evidence");
  }

  return res.json();
}

export async function getEvidence(projectId: number) {
  const res = await fetch(
    `${API_BASE_URL}/evidence/${projectId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch evidence");
  }

  return res.json();
}