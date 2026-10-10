export default function BookingWidget({
  provider,
  onBook,
  bookingLoading = false,
}) {
  if (!provider) return null;

  const isAvailable = provider.availableToday ?? provider.available ?? false;
  const price = provider.hourlyRate ?? provider.price ?? provider.pricePerVisit;

  return (
    <aside className="sticky top-24 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <div>
        {price != null && (
          <p className="text-2xl font-bold text-on-surface">
            ₹{Number(price).toLocaleString("en-IN")}
            <span className="ml-2 text-sm font-normal text-on-surface-variant">
              starting price
            </span>
          </p>
        )}
        <p className="mt-2 text-sm text-on-surface-variant">
          {isAvailable ? "Accepting booking requests" : "Not accepting requests right now"}
        </p>
      </div>

      <button
        type="button"
        onClick={onBook}
        disabled={!isAvailable || bookingLoading}
        className="mt-6 min-h-12 w-full rounded-xl bg-secondary px-5 py-3 font-bold text-on-secondary transition-colors hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {bookingLoading ? "Sending request…" : "Request this service"}
      </button>
      <p className="mt-3 text-center text-xs text-on-surface-variant">
        The provider must accept your request before it is confirmed.
      </p>
    </aside>
  );
}
