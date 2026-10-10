export default function FilterPills({ options, active, onChange, variant = "default" }) {
  if (variant === "tabs") {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active === option.id}
            className={
              active === option.id
                ? "min-h-11 rounded-full bg-primary px-5 py-2 font-bold text-on-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                : "min-h-11 rounded-full bg-surface-container-high px-5 py-2 font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={active === option.id}
          className={
            active === option.id
              ? "min-h-11 rounded-full border border-primary bg-primary/5 px-4 py-2 font-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              : "min-h-11 rounded-full border border-outline-variant px-4 py-2 text-on-surface-variant transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
