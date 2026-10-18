import { useState } from "react";
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
        className="app-input h-12 min-h-12 bg-surface-container-lowest px-4 pt-2 peer"
        {...props}
      />
      <label
        className="absolute left-4 top-3 text-on-surface-variant origin-[0] transform"
        htmlFor={id}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function PasswordInput({ id, label, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <FloatingInput id={id} label={label} type={visible ? "text" : "password"} {...props}>
      <button
        className="absolute right-4 top-3 flex h-6 w-6 items-center justify-center rounded text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <MaterialIcon name={visible ? "visibility_off" : "visibility"} />
      </button>
    </FloatingInput>
  );
}
