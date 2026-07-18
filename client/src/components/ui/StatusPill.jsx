const STATUS_STYLES = {
  pending: {
    wrapper: "bg-[#fef9c3] text-[#854d0e] border-[#fde047]",
    dot: "status-pulse w-2 h-2 rounded-full bg-[#854d0e]",
    icon: null,
  },
  accepted: {
    wrapper: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
    dot: "w-2 h-2 rounded-full bg-[#1e40af]",
    icon: null,
  },
  completed: {
    wrapper: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
    dot: null,
    icon: "check_circle",
  },
  cancelled: {
    wrapper: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
    dot: null,
    icon: "cancel",
  },
  available: {
    wrapper: "bg-green-100 text-green-700 border-transparent",
    dot: "w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse",
    icon: null,
    label: "Available Now",
  },
  busy: {
    wrapper: "bg-surface-container-high text-on-surface-variant border-transparent",
    dot: null,
    icon: null,
    label: "Busy",
  },
};

export default function StatusPill({ status, label, className = "" }) {
  const config = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const text = label || config.label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.wrapper} ${className}`}
    >
      {config.dot && <span className={config.dot} />}
      {config.icon && (
        <span className="material-symbols-outlined text-[16px]">{config.icon}</span>
      )}
      <span className="font-label-md text-label-md">{text}</span>
    </span>
  );
}
