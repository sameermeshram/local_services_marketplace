import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout, { MobileBottomNav, TopAppBar } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import FilterPills from "../components/ui/FilterPills";
import BookingCard from "../components/booking/BookingCard";
import BookingPagination from "../components/booking/BookingPagination";
import {
  normalizeBookingStatus,
} from "../components/booking/bookingStatus";
import { bookingService, reviewService } from "../services/api";

const TAB_OPTIONS = [
  { id: "all", label: "All Bookings" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
];

function matchesTab(booking, tab) {
  const status = normalizeBookingStatus(booking.status);
  if (tab === "all") return true;
  if (tab === "active") return ["pending", "accepted", "in_progress"].includes(status);
  if (tab === "past") return ["completed", "rejected", "cancelled"].includes(status);
  return true;
}

function statusGroupForTab(tab) {
  if (tab === "active") return "active";
  return undefined;
}

function getEmptyState(tab) {
  const copy = {
    all: ["No bookings yet", "Your service requests will appear here."],
    active: ["No active bookings", "Bookings awaiting a response or currently in progress will appear here."],
    past: ["No past bookings", "Completed, rejected, and cancelled bookings will appear here."],
  };
  return copy[tab];
}

export default function MyBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedBookingId = searchParams.get("booking");
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewLoadError, setReviewLoadError] = useState("");
  const [reviewLoadKey, setReviewLoadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bookingActionId, setBookingActionId] = useState(null);
  const bookingActionRef = useRef(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const reviewSubmittingRef = useRef(false);
  const [reviewError, setReviewError] = useState("");
  const reviewDialogRef = useRef(null);
  const reviewReturnFocusRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const statusGroup = statusGroupForTab(activeTab);
    const params = focusedBookingId || activeTab === "past"
      ? {}
      : { page, limit: 10, ...(statusGroup ? { statusGroup } : {}) };
    bookingService
      .getMine(params)
      .then((response) => {
        if (!active) return;
        setBookings(response.data?.bookings ?? []);
        const nextPagination = response.data?.pagination ?? null;
        setPagination(focusedBookingId || activeTab === "past" ? null : nextPagination);
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
  }, [activeTab, page, refreshKey, focusedBookingId]);

  useEffect(() => {
    let active = true;
    setReviewsLoaded(false);
    setReviewLoadError("");
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
        setReviewsLoaded(true);
      })
      .catch(() => {
        if (active) setReviewLoadError("Review eligibility could not be confirmed.");
      });
    return () => {
      active = false;
    };
  }, [reviewLoadKey]);

  const visibleBookings = bookings.filter((booking) =>
    matchesTab(booking, activeTab),
  );
  const focusedBookingMissing = focusedBookingId && !loading && !error &&
    !bookings.some((booking) => booking._id === focusedBookingId);

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.querySelector("button[aria-checked='false']")?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeReviewDialog();
      if (event.key === "Tab" && dialog) {
        const focusable = [...dialog.querySelectorAll("button:not([disabled]), textarea:not([disabled]), [href]")];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };

    dialog?.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog?.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      reviewReturnFocusRef.current?.focus();
    };
  }, [reviewBooking]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewBooking || reviewRating == null || reviewSubmittingRef.current) return;

    reviewSubmittingRef.current = true;
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
      reviewSubmittingRef.current = false;
      setReviewSubmitting(false);
    }
  };

  const handleBookingAction = async (booking, action) => {
    setError("");
    setMessage("");

    if (action === "details" || action === "track") return;

    if (action === "cancel") {
      if (bookingActionRef.current) return;
      if (!window.confirm("Cancel this booking request?")) return;
      bookingActionRef.current = booking._id;
      setBookingActionId(booking._id);
      try {
        const response = await bookingService.cancel(booking._id);
        updateBooking(response.data.booking);
        setMessage("Booking cancelled.");
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Unable to cancel booking.",
        );
      } finally {
        bookingActionRef.current = null;
        setBookingActionId(null);
      }
      return;
    }

    if (action === "review") {
      reviewReturnFocusRef.current = document.activeElement;
      setReviewBooking(booking);
      setReviewRating(null);
      setReviewComment("");
      setReviewError("");
      return;
    }

  };

  const [emptyTitle, emptyDescription] = getEmptyState(activeTab);

  return (
    <AppLayout
      activeItem="bookings"
      mainClassName="min-w-0 lg:ml-[250px]"
      mobileNav={<MobileBottomNav activeItem="bookings" />}
      topBar={
        <TopAppBar
          title="My Bookings"
        />
      }
    >
      <div className="mx-auto max-w-6xl space-y-6 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-0">
        <FilterPills
          variant="tabs"
          options={TAB_OPTIONS}
          active={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
          }}
        />

        {focusedBookingId && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-on-surface">Showing the booking linked from your notification.</p>
            <button type="button" onClick={() => setSearchParams({})} className="min-h-11 shrink-0 rounded-lg border border-outline-variant px-3 text-sm font-semibold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Show all bookings</button>
          </div>
        )}

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
        {focusedBookingMissing && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-center" role="status">
            <h2 className="font-semibold text-on-surface">Booking not found</h2>
            <p className="mt-2 text-sm text-on-surface-variant">This booking is not available in your account.</p>
            <button type="button" onClick={() => setSearchParams({})} className="mt-4 min-h-11 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Return to all bookings</button>
          </div>
        )}
        {message && (
          <p className="py-4 text-center text-primary" role="status">
            {message}
          </p>
        )}
        {reviewLoadError && <p className="text-center text-sm text-error" role="status">{reviewLoadError} <button type="button" onClick={() => setReviewLoadKey((key) => key + 1)} className="font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Try again</button></p>}

        {!loading && !error && visibleBookings.length > 0 && (
          <div className="space-y-4">
            {(focusedBookingId ? visibleBookings.filter((booking) => booking._id === focusedBookingId) : visibleBookings).map((booking) => {
              const status = normalizeBookingStatus(booking.status);
              const actions =
                status === "pending"
                  ? ["cancel", "details"]
                  : status === "accepted"
                    ? ["details"]
                    : status === "in_progress"
                      ? ["details"]
                    : status === "completed"
                      ? [
                          ...(reviewsLoaded && !reviewedBookingIds.has(booking._id) ? ["review"] : []),
                          "details",
                        ]
                      : ["details"];

              return (
                <BookingCard
                  key={booking._id}
                  onAction={(action) => handleBookingAction(booking, action)}
                  actionDisabled={bookingActionId !== null}
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

        {!focusedBookingId && !loading && !error && visibleBookings.length > 0 && (
          <BookingPagination pagination={pagination} onPageChange={setPage} />
        )}

        {!focusedBookingId && !loading && !error && visibleBookings.length === 0 && (
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
                    tabIndex={reviewRating === value || (reviewRating == null && value === 1) ? 0 : -1}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    onClick={() => setReviewRating(value)}
                    onKeyDown={(event) => {
                      if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) return;
                      event.preventDefault();
                      const next = Math.min(5, Math.max(1, value + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1)));
                      setReviewRating(next);
                      reviewDialogRef.current?.querySelector(`[aria-label="${next} star${next === 1 ? "" : "s"}"]`)?.focus();
                    }}
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
