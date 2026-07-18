import MaterialIcon from "./MaterialIcon";

export default function StarRating({ rating, reviewCount, size = "18px", className = "" }) {
  return (
    <div className={`flex items-center gap-1 text-secondary ${className}`}>
      <MaterialIcon name="star" filled className={`text-[${size}]`} style={{ fontSize: size }} />
      <span className="font-bold">{rating}</span>
      {reviewCount != null && (
        <span className="text-on-surface-variant font-normal text-[12px]">({reviewCount})</span>
      )}
    </div>
  );
}

export function ReviewStars({ rating, size = "18px" }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div className="flex text-secondary-container">
      {Array.from({ length: fullStars }, (_, i) => (
        <MaterialIcon key={i} name="star" filled style={{ fontSize: size }} />
      ))}
      {hasHalf && <MaterialIcon name="star_half" filled style={{ fontSize: size }} />}
    </div>
  );
}
