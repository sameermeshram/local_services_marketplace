export const BOOKING_STATUS_LABELS = {
  pending: "Request Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const BOOKING_LIFECYCLE = [
  { status: "pending", label: "Request Submitted", icon: "send" },
  { status: "accepted", label: "Accepted", icon: "check_circle" },
  { status: "in_progress", label: "In Progress", icon: "build" },
  { status: "completed", label: "Completed", icon: "task_alt" },
];

export function normalizeBookingStatus(status) {
  return String(status || "pending").toLowerCase();
}

export function getBookingStatusLabel(status) {
  const normalized = normalizeBookingStatus(status);
  return BOOKING_STATUS_LABELS[normalized] || normalized.replaceAll("_", " ");
}

export function isActiveBookingStatus(status) {
  return ["accepted", "in_progress"].includes(normalizeBookingStatus(status));
}

export function isTerminalBookingStatus(status) {
  return ["completed", "rejected", "cancelled"].includes(
    normalizeBookingStatus(status),
  );
}
