import { ReviewStars } from "../ui/StarRating";

const AVATAR_COLORS = {
  primary: "bg-primary-container/20 text-primary",
  secondary: "bg-secondary-container/20 text-secondary",
  tertiary: "bg-tertiary-container/20 text-tertiary",
};

export default function ReviewCard({ review }) {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-body-lg ${
              AVATAR_COLORS[review.color] || AVATAR_COLORS.primary
            }`}
          >
            {review.initials}
          </div>
          <div>
            <h5 className="font-bold text-on-surface">{review.author}</h5>
            <p className="text-label-md text-on-surface-variant">{review.date}</p>
          </div>
        </div>
        <ReviewStars rating={review.rating} />
      </div>
      <p className="text-body-md text-on-surface-variant italic">&ldquo;{review.quote}&rdquo;</p>
    </div>
  );
}
