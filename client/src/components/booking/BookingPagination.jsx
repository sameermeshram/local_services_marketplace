export default function BookingPagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages < 2) return null;

  return (
    <nav
      aria-label="Booking pages"
      className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-outline-variant pt-4 sm:flex-row"
    >
      <p className="text-body-sm text-on-surface-variant" aria-live="polite">
        Showing page {pagination.page} of {pagination.pages} ({pagination.total} bookings)
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
