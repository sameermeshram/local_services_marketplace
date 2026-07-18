import { Link } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import StatusPill from "../ui/StatusPill";
import StarRating from "../ui/StarRating";

export default function ProviderCard({ provider, onBook }) {
  return (
    <div className="group bg-white rounded-2xl border border-outline-variant p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-surface-container">
            <img src={provider.image} alt={provider.imageAlt} className="w-full h-full object-cover" />
          </div>
          <div
            className={`absolute bottom-0 right-0 w-6 h-6 border-4 border-white rounded-full ${
              provider.available ? "bg-green-500" : "bg-slate-400"
            }`}
          />
        </div>
        <div className="flex flex-col items-end">
          <StatusPill status={provider.available ? "available" : "busy"} />
          <div className="mt-2">
            <StarRating rating={provider.rating} reviewCount={provider.reviewCount} />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Link to={`/providers/${provider.id}`}>
          <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors">
            {provider.name}
          </h3>
        </Link>
        <span className="inline-block bg-primary/10 text-primary font-bold text-[11px] px-2 py-0.5 rounded mt-1 uppercase tracking-widest">
          {provider.trade}
        </span>
      </div>

      <p className="text-on-surface-variant text-body-sm mb-6 line-clamp-2">{provider.bio}</p>

      <div className="mt-auto pt-6 border-t border-outline-variant flex items-center justify-between">
        <div>
          <p className="text-on-surface-variant text-label-md">Starts from</p>
          <p className="text-headline-sm font-bold text-on-surface">
            ${provider.price}
            <span className="text-body-sm font-normal text-on-surface-variant">/visit</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onBook?.(provider)}
          className="bg-secondary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-on-secondary-container transition-all active:scale-95 shadow-md"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
