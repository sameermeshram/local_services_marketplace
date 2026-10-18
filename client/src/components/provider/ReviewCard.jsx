import { ReviewStars } from "../ui/StarRating";

const AVATAR_COLORS = {
  primary: "bg-primary-container/20 text-primary",
  secondary: "bg-secondary-container/20 text-secondary",
  tertiary: "bg-tertiary-container/20 text-tertiary",
};

export default function ReviewCard({ review }) {
  return (
    <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-card sm:p-6">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold ${AVATAR_COLORS[review.color] || AVATAR_COLORS.primary}`}>{review.initials || "C"}</div>
          <div className="min-w-0"><h3 className="truncate font-title-md text-title-md font-semibold text-on-surface">{review.author || "Customer"}</h3>{review.date && <p className="mt-0.5 text-label-md text-on-surface-variant">{review.date}</p>}</div>
        </div>
        <div role="img" aria-label={`${review.rating} out of 5 stars`} className="shrink-0"><ReviewStars rating={review.rating} /></div>
      </header>
      {review.quote && <p className="whitespace-pre-line text-body-sm leading-relaxed text-on-surface-variant">{review.quote}</p>}
    </article>
  );
}
