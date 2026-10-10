import { useState } from "react";
import { Link } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import StarRating from "../ui/StarRating";
import BookingRequestForm from "./BookingRequestForm";
import { bookingService } from "../../services/api";

const TIME_LABELS = {
  morning: "Morning (8 AM - 12 PM)",
  afternoon: "Afternoon (12 PM - 4 PM)",
  evening: "Evening (4 PM - 8 PM)",
};

function formatBookingDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function ConfirmBookingModal({ open, onClose, provider }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingRequest, setBookingRequest] = useState(null);

  if (!open || !provider) return null;

  const isAvailable = provider.available ?? provider.availableToday ?? true;
  const price = provider.price ?? provider.hourlyRate ?? provider.pricePerVisit;
  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError("");
    try {
      const response = await bookingService.create(payload);
      setBookingRequest(response.data?.booking ?? payload);
    } catch (requestError) {
      setError(
        requestError.response?.data?.errors?.[0]?.message ||
          requestError.response?.data?.message ||
          "We couldn’t send your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-title"
        className="flex max-h-[min(90vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-outline-variant px-5 py-4 sm:px-7">
          <div>
            <h2 id="booking-dialog-title" className="text-xl font-bold text-on-surface">
              {bookingRequest ? "Request sent" : "Request a service"}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {bookingRequest
                ? "Your request is pending the provider’s response."
                : "Choose a service and tell the provider what you need."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close booking dialog"
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <MaterialIcon name="close" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            {provider.image && (
              <img
                src={provider.image}
                alt={provider.imageAlt || `${provider.name} provider profile`}
                className="h-14 w-14 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-on-surface">{provider.name}</h3>
              <p className="text-sm text-on-surface-variant">{provider.trade}</p>
            </div>
            <div className="text-right">
              {provider.rating != null && (
                <StarRating
                  rating={provider.rating}
                  reviewCount={provider.reviewCount}
                  size="14px"
                  className="justify-end"
                />
              )}
              {price != null && (
                <p className="mt-1 text-xs text-on-surface-variant">
                  Starting price: ₹{Number(price).toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>

          {bookingRequest ? (
            <div className="space-y-5" role="status">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-on-surface">
                  Booking status: {bookingRequest.status || "Pending"}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  The provider needs to accept your request before it is confirmed.
                </p>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-on-surface-variant">Service</dt>
                  <dd className="font-medium text-on-surface">{bookingRequest.service}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Preferred date</dt>
                  <dd className="font-medium text-on-surface">{formatBookingDate(bookingRequest.date)}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Preferred time</dt>
                  <dd className="font-medium text-on-surface">{TIME_LABELS[bookingRequest.timeSlot] || bookingRequest.timeSlot}</dd>
                </div>
              </dl>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 rounded-xl border border-outline-variant px-5 py-3 font-semibold text-on-surface hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Close
                </button>
                <Link
                  to="/bookings"
                  onClick={onClose}
                  className="min-h-11 rounded-xl bg-primary px-5 py-3 text-center font-semibold text-on-primary hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  View my bookings
                </Link>
              </div>
            </div>
          ) : !isAvailable ? (
            <div className="space-y-4">
              <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant" role="status">
                This provider is currently unavailable for new requests.
              </p>
              <button type="button" onClick={onClose} className="w-full rounded-xl border border-outline-variant px-5 py-3 font-semibold text-on-surface">
                Close
              </button>
            </div>
          ) : (
            <BookingRequestForm
              key={provider.id || provider._id}
              provider={provider}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
            />
          )}
        </div>
      </section>
    </div>
  );
}
