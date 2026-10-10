import { useEffect, useState } from "react";
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
      const rating = window.prompt("Rate this service from 1 to 5", "5");
      if (!rating || ![1, 2, 3, 4, 5].includes(Number(rating))) return;
      const comment = window.prompt("Add a comment", "");
      try {
        await reviewService.createForBooking(booking._id, {
          rating: Number(rating),
          comment: comment || "",
        });
        setReviewedBookingIds((current) => new Set(current).add(booking._id));
        setMessage("Review submitted.");
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Unable to submit review.",
        );
      }
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
    </AppLayout>
  );
}
