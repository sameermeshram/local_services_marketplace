export default function MaterialIcon({ name, filled = false, className = "", style = {} }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${filled ? "fill-icon" : ""} ${className}`}
      style={style}
    >
      {name}
    </span>
  );
}
