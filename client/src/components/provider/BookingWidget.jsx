import MaterialIcon from "../ui/MaterialIcon";

export default function BookingWidget({ provider, onBook, canBook = false, bookingLoading = false }) {
  if (!provider) return null;
  const isAvailable = provider.available === true;
  const price = Number(provider.price);

  return (
    <aside className="sticky top-24 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-card xl:p-6" aria-labelledby="booking-panel-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed/50 text-primary"><MaterialIcon name="event_available" className="text-[22px]" /></span>
        <div>
          <h2 id="booking-panel-title" className="font-title-md text-title-md font-bold text-on-surface">Request a service</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">Choose a service and preferred time in the request form.</p>
        </div>
      </div>

      {Number.isFinite(price) && price > 0 && <div className="mt-5 rounded-xl bg-surface-container-low p-4"><p className="text-label-sm text-on-surface-variant">Listed price per visit</p><p className="mt-1 font-headline-sm text-headline-sm font-bold text-on-surface">₹{price.toLocaleString("en-IN")}</p><p className="mt-1 text-label-sm text-on-surface-variant">Service prices, where listed, appear below.</p></div>}

      <p className={`mt-5 flex items-center gap-2 text-body-sm font-semibold ${isAvailable ? "text-primary" : "text-on-surface-variant"}`}><span className={`h-2.5 w-2.5 rounded-full ${isAvailable ? "bg-primary" : "bg-outline"}`} />{isAvailable ? "Accepting booking requests" : "Not accepting requests right now"}</p>
      {canBook ? (
        <button type="button" onClick={onBook} disabled={!isAvailable || bookingLoading} className="mt-5 min-h-12 w-full rounded-xl bg-secondary px-5 py-3 font-semibold text-white transition-colors hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{bookingLoading ? "Sending request…" : "Request this service"}</button>
      ) : null}
      <p className="mt-3 text-center text-label-sm text-on-surface-variant">A request is pending until the provider accepts it.</p>
    </aside>
  );
}
