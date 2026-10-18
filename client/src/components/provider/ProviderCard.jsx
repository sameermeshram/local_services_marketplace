import { Link } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import StatusPill from "../ui/StatusPill";
import StarRating from "../ui/StarRating";

export default function ProviderCard({ provider, onBook }) {
  const price = Number(provider.price);
  const cities = [...new Set((provider.serviceAreas || []).map((area) => area.city).filter(Boolean))];

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover sm:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-container">
          {provider.image ? <img src={provider.image} alt={provider.imageAlt || `${provider.name} profile`} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-primary" aria-hidden="true"><MaterialIcon name="person" className="text-[30px]" /></span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/providers/${provider.id}`} className="min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <h3 className="truncate font-title-md text-title-md font-bold text-on-surface transition-colors group-hover:text-primary">{provider.name}</h3>
            </Link>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary"><MaterialIcon name="verified" className="text-[13px]" /> Approved</span>
          </div>
          <p className="mt-1 truncate text-body-sm text-on-surface-variant">{provider.trade || "Local service provider"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {provider.rating != null ? <StarRating rating={Number(provider.rating).toFixed(1)} reviewCount={provider.reviewCount} size="15px" /> : <span className="text-label-md text-on-surface-variant">No ratings yet</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill status={provider.available ? "available" : "busy"} />
        {cities.length > 0 && <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-surface-container-low px-2 py-1 text-label-sm text-on-surface-variant"><MaterialIcon name="location_city" className="shrink-0 text-[14px]" /><span className="truncate">{cities.join(", ")}</span></span>}
      </div>

      {provider.bio && <p className="mt-4 line-clamp-2 min-h-10 text-body-sm text-on-surface-variant">{provider.bio}</p>}
      {provider.services?.length > 0 && <div className="mt-4 rounded-xl bg-surface-container-low p-3"><p className="text-label-sm font-semibold text-on-surface-variant">Services</p><p className="mt-1 line-clamp-1 text-body-sm text-on-surface">{provider.services.slice(0, 3).map((service) => service.name).filter(Boolean).join(" · ")}</p></div>}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-outline-variant pt-5">
        <div className="min-h-10">
          {Number.isFinite(price) && price > 0 && <><p className="text-label-sm text-on-surface-variant">Price per visit</p><p className="font-headline-sm text-headline-sm font-bold text-on-surface">₹{price.toLocaleString("en-IN")}</p></>}
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <Link to={`/providers/${provider.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-outline-variant px-4 py-2 font-semibold text-on-surface transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Profile</Link>
          <button type="button" onClick={() => onBook?.(provider)} disabled={!provider.available} className="min-h-11 rounded-lg bg-secondary px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none">
            {provider.available ? "Book service" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}
