import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import StatusPill from "../components/ui/StatusPill";
import BookingPagination from "../components/booking/BookingPagination";
import { normalizeBookingStatus } from "../components/booking/bookingStatus";
import { bookingService, providerService } from "../services/api";

export default function ProviderDashboardPage() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeGroup, setActiveGroup] = useState("all");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      bookingService.getProviderBookings({ page, limit: 10 }),
      providerService.getProfile(),
    ])
      .then(([bookingsResponse, profileResponse]) => {
        if (!active) return;
        setBookings(bookingsResponse.data?.bookings ?? []);
        const nextPagination = bookingsResponse.data?.pagination ?? null;
        setPagination(nextPagination);
        if (nextPagination && nextPagination.page !== page) {
          setPage(nextPagination.page);
        }
        const savedAvailability = profileResponse.data?.profile?.isAvailable;
        if (typeof savedAvailability === "boolean") setAvailable(savedAvailability);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message ||
              "Unable to load booking requests.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, refreshKey]);

  const updateStatus = async (id, status) => {
    if (status === "rejected" && !window.confirm("Reject this booking request?")) {
      return;
    }
    setUpdatingId(id);
    setError("");
    try {
      const response = await bookingService.updateStatus(id, status);
      const updatedBooking = response.data?.booking;
      if (!updatedBooking) {
        throw new Error("Booking status response was incomplete.");
      }
      setBookings((current) =>
        current.map((booking) =>
          booking._id === id ? updatedBooking : booking,
        ),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update booking status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateAvailability = async (nextAvailable) => {
    if (available === nextAvailable || availabilityUpdating) return;
    const previous = available;
    setAvailabilityUpdating(true);
    setAvailabilityError("");

    try {
      const response = await providerService.updateAvailability({
        isAvailable: nextAvailable,
      });
      const savedAvailability = response.data?.isAvailable;
      setAvailable(
        typeof savedAvailability === "boolean" ? savedAvailability : nextAvailable,
      );
    } catch (requestError) {
      setAvailable(previous);
      setAvailabilityError(
        requestError.response?.data?.message ||
          "Unable to update availability.",
      );
    } finally {
      setAvailabilityUpdating(false);
    }
  };

  const bookingGroups = useMemo(
    () => ({
      all: bookings,
      requests: bookings.filter(
        (booking) => normalizeBookingStatus(booking.status) === "pending",
      ),
      upcoming: bookings.filter(
        (booking) => normalizeBookingStatus(booking.status) === "accepted",
      ),
      active: bookings.filter(
        (booking) => normalizeBookingStatus(booking.status) === "in_progress",
      ),
      completed: bookings.filter(
        (booking) => normalizeBookingStatus(booking.status) === "completed",
      ),
    }),
    [bookings],
  );
  const visibleBookings = bookingGroups[activeGroup];
  const pendingCount = bookingGroups.requests.length;
  const activeCount = bookingGroups.active.length;
  const completedCount = bookingGroups.completed.length;
  const groupOptions = [
    { id: "all", label: "All Jobs", count: bookingGroups.all.length },
    { id: "requests", label: "Requests", count: pendingCount },
    { id: "upcoming", label: "Upcoming", count: bookingGroups.upcoming.length },
    { id: "active", label: "Active", count: activeCount },
    { id: "completed", label: "Completed", count: completedCount },
  ];

  return (
    <AppLayout
      activeItem="home"
      role="provider"
      notificationDot
      mainClassName="md:ml-[280px] min-h-screen"
      topBar={
        <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-margin-desktop h-16 md:ml-[280px] md:max-w-[calc(100%-280px)]">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
              Provider Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-surface-container rounded-full p-1 border border-outline-variant">
              <button
                type="button"
                disabled={availabilityUpdating || available === null}
                onClick={() => updateAvailability(true)}
                className={`min-h-11 rounded-full px-4 py-1.5 text-label-md font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  available === true
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                Available
              </button>
              <button
                type="button"
                disabled={availabilityUpdating || available === null}
                onClick={() => updateAvailability(false)}
                className={`min-h-11 rounded-full px-4 py-1.5 text-label-md font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  available === false
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                Offline
              </button>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <MaterialIcon name="notifications" />
            </button>
          </div>
          {availabilityError && (
            <p
              className="absolute right-6 top-20 text-error text-body-sm"
              role="alert"
            >
              {availabilityError}
            </p>
          )}
        </header>
      }
    >
      <section className="p-margin-desktop max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Provider Jobs
          </h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Review requests and manage the jobs assigned to you.
          </p>
        </div>

        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Pending requests", pendingCount, "inbox"],
              ["Active jobs", activeCount, "handyman"],
              ["Completed jobs", completedCount, "task_alt"],
            ].map(([label, value, icon]) => (
              <div
                key={label}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
              >
                <MaterialIcon name={icon} className="text-primary" />
                <p className="mt-3 text-sm text-on-surface-variant">{label}</p>
                <p className="mt-1 text-2xl font-bold text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Provider jobs">
            {groupOptions.map((group) => (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={activeGroup === group.id}
                onClick={() => setActiveGroup(group.id)}
                className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  activeGroup === group.id
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary"
                }`}
              >
                {group.label} ({group.count})
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="py-12 text-center text-on-surface-variant" role="status">
            Loading requests...
          </p>
        )}
        {error && (
          <div className="py-4 text-center" role="alert">
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

        {!loading && !error && visibleBookings.length === 0 && (
          <div className="py-16 text-center border border-dashed border-outline-variant rounded-xl">
            <MaterialIcon
              name="event_available"
              className="text-primary text-5xl mb-3"
            />
            <h2 className="font-headline-sm text-headline-sm">
              {activeGroup === "requests"
                ? "No pending requests"
                : activeGroup === "active"
                  ? "No active jobs"
                  : activeGroup === "completed"
                    ? "No completed jobs"
                    : "No provider jobs yet"}
            </h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              {activeGroup === "requests"
                ? "New customer requests will appear here."
                : "Jobs from your provider account will appear here."}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {visibleBookings.map((booking) => (
            <article
              key={booking._id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="font-headline-sm text-headline-sm">
                    {booking.service}
                  </h2>
                  <p className="text-body-md text-on-surface-variant mt-1">
                    {booking.customer?.name || "Customer"} ·{" "}
                    {booking.customer?.phone || "Contact unavailable"}
                  </p>
                </div>
                <StatusPill status={booking.status} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-body-sm">
                <div>
                  <span className="block text-label-md text-on-surface-variant uppercase">
                    Date
                  </span>
                  {booking.date}
                </div>
                <div>
                  <span className="block text-label-md text-on-surface-variant uppercase">
                    Window
                  </span>
                  {booking.timeSlot}
                </div>
                <div>
                  <span className="block text-label-md text-on-surface-variant uppercase">
                    Address
                  </span>
                  {booking.address}
                </div>
              </div>
              {booking.details && (
                <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">
                  {booking.details}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {normalizeBookingStatus(booking.status) === "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={updatingId === booking._id}
                      onClick={() => updateStatus(booking._id, "accepted")}
                      className="bg-primary text-on-primary px-5 py-2 rounded-lg font-bold disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === booking._id}
                      onClick={() => updateStatus(booking._id, "rejected")}
                      className="border border-error text-error px-5 py-2 rounded-lg font-bold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {normalizeBookingStatus(booking.status) === "accepted" && (
                  <button
                    type="button"
                    disabled={updatingId === booking._id}
                    onClick={() => updateStatus(booking._id, "in_progress")}
                    className="bg-secondary text-on-secondary px-5 py-2 rounded-lg font-bold disabled:opacity-50"
                  >
                    Start Service
                  </button>
                )}
                {normalizeBookingStatus(booking.status) === "in_progress" && (
                  <button
                    type="button"
                    disabled={updatingId === booking._id}
                    onClick={() => updateStatus(booking._id, "completed")}
                    className="bg-secondary text-on-secondary px-5 py-2 rounded-lg font-bold disabled:opacity-50"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        <BookingPagination pagination={pagination} onPageChange={setPage} />
      </section>
    </AppLayout>
  );
}
