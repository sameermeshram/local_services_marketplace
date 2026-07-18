export default function FilterPills({ options, active, onChange, variant = "default" }) {
  if (variant === "tabs") {
    return (
      <div className="flex gap-4 mb-8">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={
              active === option.id
                ? "px-6 py-2 rounded-full bg-primary text-on-primary font-bold shadow-sm"
                : "px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors font-semibold"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={
            active === option.id
              ? "px-4 py-2 rounded-full border border-primary text-primary font-bold bg-primary/5 hover:bg-primary/10 transition-colors"
              : "px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
