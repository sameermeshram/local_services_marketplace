import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout, { TopAppBar, MobileBottomNav } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import FilterPills from "../components/ui/FilterPills";
import BookingCard from "../components/booking/BookingCard";
import { bookingsAvatar } from "../data/mockData";
import { bookingService } from "../services/api";

const TAB_OPTIONS = [
  { id: "all", label: "All Bookings" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
];

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    bookingService
      .getMine()
      .then((response) => {
        if (!active) return;
        setBookings(response.data?.bookings ?? []);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError.response?.data?.message ||
            "Unable to load your bookings.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleBookings = bookings.filter((booking) => {
    if (activeTab === "active")
      return ["pending", "accepted"].includes(booking.status);
    if (activeTab === "past")
      return ["completed", "cancelled"].includes(booking.status);
    return true;
  });

  const updateBooking = (updatedBooking) => {
    setBookings((current) =>
      current.map((booking) =>
        booking._id === updatedBooking._id ? updatedBooking : booking,
      ),
    );
  };

  const handleBookingAction = async (booking, action) => {
    setError("");

    if (action === "cancel") {
      if (!window.confirm("Cancel this booking request?")) return;

      try {
        const response = await bookingService.cancel(booking._id);
        updateBooking(response.data.booking);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Unable to cancel booking.",
        );
      }
      return;
    }

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
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to reschedule booking.",
      );
    }
  };

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
          avatarSrc={bookingsAvatar}
        />
      }
    >
      <div className="p-margin-desktop max-w-6xl mx-auto pb-24 md:pb-0">
        <FilterPills
          variant="tabs"
          options={TAB_OPTIONS}
          active={activeTab}
          onChange={setActiveTab}
        />

        {loading && (
          <p className="py-12 text-center text-on-surface-variant">
            Loading bookings...
          </p>
        )}
        {error && (
          <p className="py-12 text-center text-error" role="alert">
            {error}
          </p>
        )}

        <div
          className={`space-y-4 ${loading || error || visibleBookings.length === 0 ? "hidden" : ""}`}
        >
          {visibleBookings.map((booking) => {
            const actions =
              booking.status === "pending"
                ? ["reschedule", "cancel"]
                : booking.status === "accepted"
                  ? ["message"]
                  : booking.status === "completed"
                    ? ["review"]
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

        <div
          className={`${loading || error || visibleBookings.length > 0 ? "hidden" : "flex"} flex-col items-center justify-center py-20 text-center`}
        >
          <div className="w-48 h-48 mb-6 opacity-20">
            <MaterialIcon
              name="calendar_today"
              className="text-[120px] text-on-surface-variant"
            />
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
            No bookings found
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8">
            You haven&apos;t scheduled any services yet. Ready to fix something?
          </p>
          <Link
            to="/"
            className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            Browse Services
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
