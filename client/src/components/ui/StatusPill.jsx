import MaterialIcon from "./MaterialIcon";
import { getBookingStatusLabel, normalizeBookingStatus } from "../booking/bookingStatus";

const STATUS_STYLES = {
  pending: {
    wrapper: "border-secondary/30 bg-secondary/10 text-on-secondary-container",
    dot: "status-pulse h-2 w-2 rounded-full bg-secondary",
    icon: null,
  },
  accepted: {
    wrapper: "border-primary/30 bg-primary/10 text-primary",
    dot: "h-2 w-2 rounded-full bg-primary",
    icon: null,
  },
  in_progress: {
    wrapper: "border-secondary/30 bg-secondary/10 text-on-secondary-container",
    dot: "h-2 w-2 rounded-full bg-secondary",
    icon: null,
  },
  rejected: {
    wrapper: "border-error/30 bg-error/10 text-error",
    dot: "h-2 w-2 rounded-full bg-error",
    icon: null,
  },
  completed: {
    wrapper: "border-primary/30 bg-primary/10 text-primary",
    dot: null,
    icon: "check_circle",
  },
  cancelled: {
    wrapper: "border-error/30 bg-error/10 text-error",
    dot: null,
    icon: "cancel",
  },
  available: {
    wrapper: "border-primary/20 bg-primary/10 text-primary",
    dot: "h-1.5 w-1.5 animate-pulse rounded-full bg-primary",
    icon: null,
    label: "Available Now",
  },
  busy: {
    wrapper:
      "bg-surface-container-high text-on-surface-variant border-transparent",
    dot: null,
    icon: null,
    label: "Busy",
  },
};

export default function StatusPill({ status, label, className = "" }) {
  const normalizedStatus = normalizeBookingStatus(status);
  const config = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.pending;
  const text = label || config.label || getBookingStatusLabel(normalizedStatus);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${config.wrapper} ${className}`}
    >
      {config.dot && <span className={config.dot} />}
      {config.icon && (
        <MaterialIcon name={config.icon} className="text-[16px]" />
      )}
      <span className="font-label-md text-label-md">{text}</span>
    </span>
  );
}
