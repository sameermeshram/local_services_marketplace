import MaterialIcon from "../ui/MaterialIcon";
import StatusPill from "../ui/StatusPill";

function BookingActions({ actions }) {
  return (
    <div className="flex gap-2">
      {actions.includes("reschedule") && (
        <button
          type="button"
          className="px-4 py-1.5 rounded-lg border border-outline text-on-surface-variant font-semibold hover:bg-surface-container transition-colors text-sm"
        >
          Reschedule
        </button>
      )}
      {actions.includes("cancel") && (
        <button
          type="button"
          className="px-4 py-1.5 rounded-lg bg-error text-on-error font-semibold hover:opacity-90 transition-opacity text-sm"
        >
          Cancel
        </button>
      )}
      {actions.includes("message") && (
        <button
          type="button"
          className="w-full md:w-auto px-6 py-1.5 rounded-lg bg-primary text-on-primary font-semibold hover:opacity-90 transition-opacity text-sm"
        >
          Message Provider
        </button>
      )}
      {actions.includes("review") && (
        <button
          type="button"
          className="w-full md:w-auto px-6 py-1.5 rounded-lg border-2 border-secondary text-secondary font-bold hover:bg-secondary hover:text-white transition-all text-sm"
        >
          Leave Review
        </button>
      )}
      {actions.includes("details") && (
        <button
          type="button"
          className="w-full md:w-auto px-6 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant font-semibold hover:bg-surface-container-highest transition-colors text-sm"
        >
          View Details
        </button>
      )}
    </div>
  );
}

export default function BookingCard({ booking }) {
  const cardOpacity = booking.opacity === 60 ? "opacity-60" : "";
  const contentOpacity = booking.dimmed && !booking.opacity ? "opacity-75 group-hover:opacity-100 transition-opacity" : "";

  return (
    <div
      className={`bg-surface-container-lowest p-6 rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.08)] transition-all duration-300 border border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-6 group ${cardOpacity}`}
    >
      <div className={`flex items-center gap-6 ${contentOpacity}`}>
        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
          <img
            src={booking.image}
            alt={booking.imageAlt}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
              booking.grayscale ? "grayscale group-hover:grayscale-0" : ""
            }`}
          />
        </div>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
            {booking.providerName}
          </h3>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MaterialIcon name={booking.serviceIcon} className="text-[18px]" />
            <span className="font-body-md text-body-md">{booking.service}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:items-end gap-3">
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              {booking.dateLabel}
            </p>
            <p className="font-body-md text-body-md font-semibold">{booking.date}</p>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant hidden md:block" />
          <StatusPill status={booking.status} />
        </div>
        <BookingActions actions={booking.actions} />
      </div>
    </div>
  );
}
