import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout, { MobileBottomNav, TopAppBar } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import FilterPills from "../components/ui/FilterPills";
import BookingCard from "../components/booking/BookingCard";
import BookingPagination from "../components/booking/BookingPagination";
import {
  isActiveBookingStatus,
  normalizeBookingStatus,
} from "../components/booking/bookingStatus";
import { bookingService, reviewService } from "../services/api";

const TAB_OPTIONS = [
  { id: "all", label: "All Bookings" },
  { id: "pending", label: "Pending" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function matchesTab(booking, tab) {
  const status = normalizeBookingStatus(booking.status);
  if (tab === "all") return true;
  if (tab === "pending") return status === "pending";
  if (tab === "upcoming") return isActiveBookingStatus(status);
  if (tab === "completed") return status === "completed";
  return ["rejected", "cancelled"].includes(status);
}

function statusGroupForTab(tab) {
  if (["pending", "upcoming"].includes(tab)) return "active";
  if (["completed", "cancelled"].includes(tab)) return "past";
  return undefined;
}

function getEmptyState(tab) {
  const copy = {
    all: ["No bookings yet", "Your service requests will appear here."],
    pending: ["No pending bookings", "New service requests awaiting a provider response will appear here."],
    upcoming: ["No upcoming bookings", "Accepted service appointments will appear here."],
    completed: ["No completed bookings", "Completed services will appear here."],
    cancelled: ["No cancelled bookings", "Rejected or cancelled requests will appear here."],
  };
  return copy[tab];
}

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const reviewDialogRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const statusGroup = statusGroupForTab(activeTab);
    bookingService
      .getMine({
        page,
        limit: 10,
        ...(statusGroup ? { statusGroup } : {}),
      })
      .then((response) => {
        if (!active) return;
        setBookings(response.data?.bookings ?? []);
        const nextPagination = response.data?.pagination ?? null;
        setPagination(nextPagination);
        if (nextPagination && nextPagination.page !== page) {
          setPage(nextPagination.page);
        }
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError.response?.data?.message || "Unable to load your bookings.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, page, refreshKey]);

  useEffect(() => {
    let active = true;
    reviewService
      .getMine()
      .then((response) => {
        if (!active) return;
        setReviewedBookingIds(
          new Set(
            (response.data?.reviews ?? [])
              .map((review) => review.booking)
              .filter(Boolean)
              .map((booking) => booking._id || booking),
          ),
        );
      })
      .catch(() => {
        // Reviews are optional to the booking history experience.
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleBookings = bookings.filter((booking) =>
    matchesTab(booking, activeTab),
  );

  const updateBooking = (updatedBooking) => {
    setBookings((current) =>
      current.map((booking) =>
        booking._id === updatedBooking._id ? updatedBooking : booking,
      ),
    );
  };

  const closeReviewDialog = (force = false) => {
    if (reviewSubmitting && !force) return;
    setReviewBooking(null);
    setReviewRating(null);
    setReviewComment("");
    setReviewError("");
  };

  useEffect(() => {
    if (!reviewBooking) return undefined;

    const dialog = reviewDialogRef.current;
    dialog?.querySelector("button[aria-checked='false']")?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeReviewDialog();
    };

    dialog?.addEventListener("keydown", handleKeyDown);
    return () => dialog?.removeEventListener("keydown", handleKeyDown);
  }, [reviewBooking]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewBooking || reviewRating == null || reviewSubmitting) return;

    setReviewSubmitting(true);
    setReviewError("");
    try {
      await reviewService.createForBooking(reviewBooking._id, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewedBookingIds((current) => new Set(current).add(reviewBooking._id));
      closeReviewDialog(true);
      setMessage("Review submitted.");
    } catch (requestError) {
      setReviewError(
        requestError.response?.data?.message || "Unable to submit review.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBookingAction = async (booking, action) => {
    setError("");
    setMessage("");

    if (action === "details" || action === "track") return;

    if (action === "cancel") {
      if (!window.confirm("Cancel this booking request?")) return;
      try {
        const response = await bookingService.cancel(booking._id);
        updateBooking(response.data.booking);
        setMessage("Booking cancelled.");
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Unable to cancel booking.",
        );
      }
      return;
    }

    if (action === "review") {
      setReviewBooking(booking);
      setReviewRating(null);
      setReviewComment("");
      setReviewError("");
      return;
    }

    if (action !== "reschedule") return;
    const date = window.prompt("Enter the new service date", booking.date);
    if (!date) return;
    const timeSlot = window.prompt(
      "Enter time window: morning, afternoon, or evening",
      booking.timeSlot,
    );
    if (!timeSlot) return;

    try {
      const response = await bookingService.reschedule(booking._id, {
        date,
        timeSlot,
      });
      updateBooking(response.data.booking);
      setMessage("Booking rescheduled.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to reschedule booking.",
      );
    }
  };

  const [emptyTitle, emptyDescription] = getEmptyState(activeTab);

  return (
    <AppLayout
      activeItem="bookings"
      mainClassName="md:ml-[280px] min-h-screen"
      mobileNav={<MobileBottomNav activeItem="bookings" />}
      topBar={
        <TopAppBar
          title="My Bookings"
          showSearch
          searchPlaceholder="Search bookings..."
        />
      }
    >
      <div className="mx-auto max-w-6xl p-margin-desktop pb-24 md:pb-0">
        <FilterPills
          variant="tabs"
          options={TAB_OPTIONS}
          active={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
          }}
        />

        {loading && (
          <p className="py-12 text-center text-on-surface-variant" role="status">
            Loading bookings...
          </p>
        )}
        {error && (
          <div className="py-12 text-center" role="alert">
            <p className="text-error">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="mt-4 min-h-11 rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        )}
        {message && (
          <p className="py-4 text-center text-primary" role="status">
            {message}
          </p>
        )}

        {!loading && !error && visibleBookings.length > 0 && (
          <div className="space-y-4">
            {visibleBookings.map((booking) => {
              const status = normalizeBookingStatus(booking.status);
              const actions =
                status === "pending"
                  ? ["reschedule", "cancel", "details"]
                  : isActiveBookingStatus(status)
                    ? ["track", "details"]
                    : status === "completed"
                      ? [
                          ...(reviewedBookingIds.has(booking._id) ? [] : ["review"]),
                          "details",
                        ]
                      : ["details"];

              return (
                <BookingCard
                  key={booking._id}
                  onAction={(action) => handleBookingAction(booking, action)}
                  booking={{
                    ...booking,
                    serviceIcon: "build",
                    dateLabel: "Requested For",
                    date: `${booking.date} • ${booking.timeSlot}`,
                    actions,
                  }}
                />
              );
            })}
          </div>
        )}

        {!loading && !error && visibleBookings.length > 0 && (
          <BookingPagination pagination={pagination} onPageChange={setPage} />
        )}

        {!loading && !error && visibleBookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MaterialIcon
              name="calendar_today"
              className="mb-6 text-[120px] text-on-surface-variant opacity-20"
            />
            <h3 className="font-headline-md text-headline-md text-on-surface">
              {emptyTitle}
            </h3>
            <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
              {emptyDescription}
            </p>
            <Link
              to="/"
              className="mt-8 min-h-11 rounded-xl bg-primary px-8 py-3 font-bold text-on-primary shadow-lg transition-all hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Browse Services
            </Link>
          </div>
        )}
      </div>
      {reviewBooking && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReviewDialog();
          }}
        >
          <form
            ref={reviewDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            onSubmit={submitReview}
            className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="review-dialog-title"
                  className="font-headline-sm text-headline-sm text-on-surface"
                >
                  Leave a review
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Share your experience with {reviewBooking.provider?.name || "this provider"}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeReviewDialog}
                disabled={reviewSubmitting}
                aria-label="Close review dialog"
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                <MaterialIcon name="close" />
              </button>
            </div>

            <fieldset className="mt-6">
              <legend className="text-label-md font-bold text-on-surface">
                Rating
              </legend>
              <div
                className="mt-2 flex gap-1"
                role="radiogroup"
                aria-label="Rate this service from 1 to 5 stars"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={reviewRating === value}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    onClick={() => setReviewRating(value)}
                    disabled={reviewSubmitting}
                    className={`rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                      reviewRating >= value
                        ? "text-secondary"
                        : "text-on-surface-variant"
                    }`}
                  >
                    <MaterialIcon name="star" className="text-2xl" />
                  </button>
                ))}
              </div>
              <p className="mt-1 text-label-md text-on-surface-variant" aria-live="polite">
                {reviewRating ? `${reviewRating} of 5 stars selected` : "Select a rating to continue."}
              </p>
            </fieldset>

            <div className="mt-5">
              <label
                htmlFor="review-comment"
                className="text-label-md font-bold text-on-surface"
              >
                Comment <span className="font-normal text-on-surface-variant">(optional)</span>
              </label>
              <textarea
                id="review-comment"
                value={reviewComment}
                maxLength={2000}
                onChange={(event) => setReviewComment(event.target.value)}
                rows={5}
                aria-describedby="review-comment-count"
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface p-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <p
                id="review-comment-count"
                className="mt-1 text-right text-label-md text-on-surface-variant"
              >
                {reviewComment.length}/2000
              </p>
            </div>

            {reviewError && (
              <p className="mt-4 text-body-sm text-error" role="alert">
                {reviewError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeReviewDialog}
                disabled={reviewSubmitting}
                className="min-h-11 rounded-xl border border-outline-variant px-5 py-3 font-semibold text-on-surface hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewRating == null || reviewSubmitting}
                className="min-h-11 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reviewSubmitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
