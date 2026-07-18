import MaterialIcon from "../ui/MaterialIcon";

const COLOR_MAP = {
  primary: { icon: "text-primary bg-primary/10", badge: "text-primary" },
  secondary: { icon: "text-secondary bg-secondary/10", badge: "text-secondary" },
  tertiary: { icon: "text-tertiary bg-tertiary/10", badge: "text-tertiary" },
};

export default function StatsCard({ icon, badge, value, label, color = "primary" }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.primary;

  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/50">
      <div className="flex justify-between items-start mb-4">
        <MaterialIcon name={icon} className={`${colors.icon} p-2 rounded-lg`} />
        <span className={`text-label-md font-bold ${colors.badge}`}>{badge}</span>
      </div>
      <h4 className={`font-headline-lg text-headline-lg ${colors.badge}`}>{value}</h4>
      <p className="text-label-md text-on-surface-variant font-bold uppercase tracking-tight">
        {label}
      </p>
    </div>
  );
}
