import { Link } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import StatusPill from "../ui/StatusPill";
import StarRating from "../ui/StarRating";

export default function ProviderCard({ provider, onBook }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-xl sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="relative">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-surface-container">
            <img src={provider.image} alt={provider.imageAlt || `${provider.name} profile`} className="h-full w-full object-cover" />
          </div>
          <div
            className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-white ${
              provider.available ? "bg-primary" : "bg-outline"
            }`}
            aria-label={provider.available ? "Available" : "Currently busy"}
          />
        </div>
        <div className="flex min-w-0 flex-col items-end">
          <StatusPill status={provider.available ? "available" : "busy"} />
          <div className="mt-2">
            <StarRating rating={provider.rating} reviewCount={provider.reviewCount} />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Link to={`/providers/${provider.id}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <h3 className="text-headline-sm font-headline-sm text-on-surface transition-colors group-hover:text-primary">
            {provider.name}
          </h3>
        </Link>
        <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-primary">
          {provider.trade}
        </span>
      </div>

      {provider.bio && <p className="mb-6 line-clamp-2 text-body-sm text-on-surface-variant">{provider.bio}</p>}

      {(provider.completedJobs != null || provider.experience) && (
        <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-label-md text-on-surface-variant">
          {provider.experience && <span>{provider.experience} experience</span>}
          {provider.completedJobs != null && <span>{provider.completedJobs} jobs completed</span>}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-outline-variant pt-6">
        <div>
          {provider.price != null && (
            <>
              <p className="text-label-md text-on-surface-variant">Starts from</p>
              <p className="text-headline-sm font-bold text-on-surface">
                ${provider.price}
                <span className="text-body-sm font-normal text-on-surface-variant">/visit</span>
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => onBook?.(provider)}
          className="min-h-11 shrink-0 rounded-lg bg-secondary px-5 py-2.5 font-bold text-white shadow-md transition-all hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 active:scale-95"
        >
          Book Now
        </button>
      </div>
    </article>
  );
}
