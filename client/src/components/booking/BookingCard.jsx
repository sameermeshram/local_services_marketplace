import { useState } from "react";
import MaterialIcon from "../ui/MaterialIcon";
import StatusPill from "../ui/StatusPill";
import BookingStatusTimeline from "./BookingStatusTimeline";
import {
  getBookingStatusLabel,
  isActiveBookingStatus,
  normalizeBookingStatus,
} from "./bookingStatus";

function BookingActions({ actions, onAction, disabled }) {
  return (
    <div className="flex gap-2">
      {actions.includes("reschedule") && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAction("reschedule")}
          className="rounded-lg border border-outline px-4 py-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reschedule
        </button>
      )}
      {actions.includes("cancel") && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAction("cancel")}
          className="rounded-lg bg-error px-4 py-1.5 text-sm font-semibold text-on-error transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      )}
      {actions.includes("track") && (
        <button
          type="button"
          onClick={() => onAction("track")}
          className="w-full rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:w-auto"
        >
          Track job
        </button>
      )}
      {actions.includes("review") && (
        <button
          type="button"
          onClick={() => onAction("review")}
          disabled={disabled}
          className="w-full rounded-lg border-2 border-secondary px-6 py-1.5 text-sm font-bold text-secondary transition-all hover:bg-secondary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          Leave Review
        </button>
      )}
      {actions.includes("details") && (
        <button
          type="button"
          onClick={() => onAction("details")}
          className="w-full rounded-lg bg-surface-container-high px-6 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:w-auto"
        >
          View Details
        </button>
      )}
    </div>
  );
}

export default function BookingCard({
  booking,
  onAction = () => {},
  actionDisabled = false,
}) {
  const normalizedStatus = normalizeBookingStatus(booking.status);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const cardOpacity = booking.opacity === 60 ? "opacity-60" : "";
  const contentOpacity =
    booking.dimmed && !booking.opacity
      ? "opacity-75 group-hover:opacity-100 transition-opacity"
      : "";

  return (
    <div
      className={`bg-surface-container-lowest p-6 rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.08)] transition-all duration-300 border border-outline-variant flex flex-col md:flex-row md:flex-wrap md:items-center justify-between gap-6 group ${cardOpacity}`}
    >
      <div className={`flex min-w-0 items-center gap-4 md:gap-6 ${contentOpacity}`}>
        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
          {booking.image ? (
            <img
              src={booking.image}
              alt={booking.imageAlt}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                booking.grayscale ? "grayscale group-hover:grayscale-0" : ""
              }`}
            />
          ) : (
            <div className="w-full h-full bg-primary-container/20 text-primary flex items-center justify-center">
              <MaterialIcon name={booking.serviceIcon || "build"} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-headline-sm text-headline-sm text-on-surface mb-1">
            {booking.providerName}
          </h3>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MaterialIcon name={booking.serviceIcon} className="text-[18px]" />
            <span className="font-body-md text-body-md">{booking.service}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:items-end">
        <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end md:gap-4">
          <div className="text-right">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              {booking.dateLabel}
            </p>
            <p className="font-body-md text-body-md font-semibold">
              {booking.date}
            </p>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant hidden md:block" />
          <StatusPill status={booking.status} />
        </div>
        <BookingActions
          actions={booking.actions}
          onAction={(action) => {
            if (action === "details" || action === "track") {
              setDetailsOpen(true);
            }
            onAction(action);
          }}
          disabled={actionDisabled}
        />
      </div>
      {detailsOpen && (
        <div className="basis-full border-t border-outline-variant pt-5" id={`booking-details-${booking._id}`}>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-on-surface-variant">Current status</p>
              <p className="font-semibold text-on-surface">{getBookingStatusLabel(normalizedStatus)}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">Booking ID</p>
              <p className="break-all font-semibold text-on-surface">{booking._id}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">Service address</p>
              <p className="font-semibold text-on-surface">{booking.address || "Not provided"}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">Request created</p>
              <p className="font-semibold text-on-surface">
                {booking.createdAt
                  ? new Date(booking.createdAt).toLocaleDateString()
                  : "Not available"}
              </p>
            </div>
          </div>
          {booking.details && (
            <div className="mt-4">
              <p className="text-sm text-on-surface-variant">Job details</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface">{booking.details}</p>
            </div>
          )}
          <BookingStatusTimeline status={normalizedStatus} />
          {isActiveBookingStatus(normalizedStatus) && (
            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4" role="status">
              <div className="flex items-start gap-3">
                <MaterialIcon name="location_on" className="text-primary" />
                <div>
                  <h4 className="font-semibold text-on-surface">Job tracking</h4>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {normalizedStatus === "in_progress"
                      ? "Your provider has started work at the service location."
                      : "Your provider’s booking status is updated by the service provider."}
                  </p>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    Live GPS, ETA, distance, and map data are not available for this booking.
                  </p>
                </div>
              </div>
            </div>
          )}
          {(normalizedStatus === "rejected" || normalizedStatus === "cancelled") && (
            <p className="mt-5 rounded-2xl border border-error/20 bg-error/5 p-4 text-sm text-error" role="status">
              This booking has ended and no further job tracking is available.
            </p>
          )}
          <button
            type="button"
            onClick={() => setDetailsOpen(false)}
            className="mt-5 min-h-11 rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Hide details
          </button>
        </div>
      )}
    </div>
  );
}
