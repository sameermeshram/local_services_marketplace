import MaterialIcon from "./MaterialIcon";

export default function FloatingInput({
  id,
  label,
  type = "text",
  className = "",
  children,
  ...props
}) {
  return (
    <div className={`relative floating-input ${className}`}>
      <input
        id={id}
        type={type}
        placeholder=" "
        className="w-full h-14 px-4 pt-2 border-2 border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors bg-transparent peer"
        {...props}
      />
      <label
        className="absolute left-4 top-4 text-on-surface-variant origin-[0] transform"
        htmlFor={id}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function PasswordInput({ id, label, ...props }) {
  return (
    <FloatingInput id={id} label={label} type="password" {...props}>
      <button className="absolute right-4 top-4 text-on-surface-variant" type="button">
        <MaterialIcon name="visibility" />
      </button>
    </FloatingInput>
  );
}
