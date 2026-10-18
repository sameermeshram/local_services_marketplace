import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout, { MobileBottomNav } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import StatusPill from "../components/ui/StatusPill";
import BookingPagination from "../components/booking/BookingPagination";
import { normalizeBookingStatus } from "../components/booking/bookingStatus";
import { bookingService, providerService } from "../services/api";

export default function ProviderDashboardPage() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const updatingRef = useRef(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
  const availabilityUpdatingRef = useRef(false);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeGroup, setActiveGroup] = useState("all");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      bookingService.getProviderBookings(),
      providerService.getProfile(),
    ])
      .then(([bookingsResponse, profileResponse]) => {
        if (!active) return;
        setBookings(bookingsResponse.data?.bookings ?? []);
        const nextProfile = profileResponse.data?.profile;
        setProfile(nextProfile || null);
        const savedAvailability = nextProfile?.isAvailable;
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
  }, [refreshKey]);

  const updateStatus = async (id, status) => {
    if (updatingRef.current) return;
    const confirmation = status === "rejected"
      ? "Reject this booking request?"
      : status === "completed"
        ? "Mark this service as completed? This is the final booking status."
        : null;
    if (confirmation && !window.confirm(confirmation)) {
      return;
    }
    updatingRef.current = true;
    setUpdatingId(id);
    setError("");
    setStatusMessage("");
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
      setPage(1);
      setStatusMessage(`Booking ${updatedBooking.status.replaceAll("_", " ")}.`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update booking status.",
      );
    } finally {
      updatingRef.current = false;
      setUpdatingId(null);
    }
  };

  const updateAvailability = async (nextAvailable) => {
    if (available === nextAvailable || availabilityUpdatingRef.current) return;
    const previous = available;
    availabilityUpdatingRef.current = true;
    setAvailabilityUpdating(true);
    setAvailabilityError("");
    setAvailabilityMessage("");

    try {
      const response = await providerService.updateAvailability({
        isAvailable: nextAvailable,
      });
      const savedAvailability = response.data?.isAvailable;
      setAvailable(
        typeof savedAvailability === "boolean" ? savedAvailability : nextAvailable,
      );
      setAvailabilityMessage(`Availability set to ${nextAvailable ? "available" : "unavailable"}.`);
    } catch (requestError) {
      setAvailable(previous);
      setAvailabilityError(
        requestError.response?.data?.message ||
          "Unable to update availability.",
      );
    } finally {
      availabilityUpdatingRef.current = false;
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
  const filteredBookings = bookingGroups[activeGroup] || bookingGroups.all;
  const visibleBookings = filteredBookings.slice((page - 1) * 10, page * 10);
  const localPagination = {
    page,
    limit: 10,
    total: filteredBookings.length,
    pages: Math.ceil(filteredBookings.length / 10),
  };
  const pendingCount = bookingGroups.requests.length;
  const activeCount = bookingGroups.active.length;
  const completedCount = bookingGroups.completed.length;
  const groupOptions = [
    { id: "all", label: "All Jobs", count: bookingGroups.all.length },
    { id: "requests", label: "Requests", count: pendingCount },
    { id: "upcoming", label: "Accepted", count: bookingGroups.upcoming.length },
    { id: "active", label: "Active", count: activeCount },
    { id: "completed", label: "Completed", count: completedCount },
  ];

  return (
    <AppLayout
      activeItem="home"
      role="provider"
      mobileNav={<MobileBottomNav activeItem="home" role="provider" />}
      mainClassName="min-w-0 lg:ml-[250px]"
      topBar={
        <header className="sticky top-0 z-40 flex min-h-[68px] w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-subtle bg-surface-container-lowest/95 px-4 py-2 backdrop-blur-md sm:px-6 lg:ml-[250px] lg:w-[calc(100%_-_250px)] lg:px-8">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Provider Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center rounded-full border border-outline-variant bg-surface-container p-1" role="group" aria-label="Provider availability">
              <button
                type="button"
                disabled={availabilityUpdating || available === null}
                aria-pressed={available === true}
                onClick={() => updateAvailability(true)}
                className={`min-h-11 rounded-full px-2 py-1.5 text-xs font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-label-md ${
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
                aria-pressed={available === false}
                onClick={() => updateAvailability(false)}
                className={`min-h-11 rounded-full px-2 py-1.5 text-xs font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-label-md ${
                  available === false
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                Unavailable
              </button>
            </div>
            <span className="sr-only" role="status" aria-live="polite">{availabilityUpdating ? "Updating availability" : availabilityMessage}</span>
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
              className="absolute right-4 top-[4.5rem] z-10 max-w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-error/20 bg-surface-container-lowest p-3 text-sm text-error shadow-card sm:right-6"
              role="alert"
            >
              {availabilityError}
            </p>
          )}
        </header>
      }
    >
      <section className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Provider Jobs
          </h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Review requests and manage the jobs assigned to you.
          </p>
        </div>

        {profile && (
          <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="Provider profile summary">
            <div className="flex min-w-0 items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-outline-variant bg-surface-container-high">
                {profile.profileImage ? <img src={profile.profileImage} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-primary"><MaterialIcon name="person" /></div>}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-on-surface">{profile.user?.name || "Provider"}</h2>
                <p className="truncate text-sm text-on-surface-variant">{profile.categories?.[0]?.name || profile.user?.serviceType || "Local service provider"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <p><span className="text-on-surface-variant">Rating</span> <strong className="text-on-surface">{Number(profile.ratingAverage || 0).toFixed(1)} / 5</strong> <span className="text-on-surface-variant">({profile.reviewCount || 0} reviews)</span></p>
              {profile.serviceAreas?.length > 0 && <p className="max-w-xs truncate text-on-surface-variant">Service areas: {profile.serviceAreas.map((area) => area.pincode).join(", ")}</p>}
            </div>
            <button type="button" onClick={() => navigate("/profile/edit")} className="min-h-11 shrink-0 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Edit profile</button>
          </section>
        )}

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
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter provider jobs">
            {groupOptions.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={activeGroup === group.id}
                onClick={() => { setActiveGroup(group.id); setPage(1); }}
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

        {statusMessage && <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium text-primary" role="status" aria-live="polite">{statusMessage}</p>}

        {!loading && !error && visibleBookings.length === 0 && (
          <div className="py-16 text-center border border-dashed border-outline-variant rounded-xl">
            <MaterialIcon
              name="event_available"
              className="text-primary text-5xl mb-3"
            />
            <h2 className="font-headline-sm text-headline-sm">
              {activeGroup === "requests" ? "No pending requests" : activeGroup === "active" ? "No active jobs" : activeGroup === "upcoming" ? "No accepted jobs" : activeGroup === "completed" ? "No completed jobs" : "No provider jobs yet"}
            </h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              {activeGroup === "requests"
                ? "New customer requests will appear here."
                : activeGroup === "upcoming"
                  ? "Bookings accepted by you will appear here."
                  : "Jobs from your provider account will appear here."}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {visibleBookings.map((booking) => (
            <article
              key={booking._id}
              className="space-y-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card sm:p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="font-headline-sm text-headline-sm">
                    {booking.service}
                  </h2>
                  <p className="mt-1 break-words text-body-md text-on-surface-variant">
                    {booking.customer?.name || "Customer"}{booking.customer?.phone ? ` · ${booking.customer.phone}` : " · Contact unavailable"}
                  </p>
                </div>
                <StatusPill status={booking.status} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-body-sm">
                <div>
                  <span className="block text-label-md text-on-surface-variant uppercase">
                    Date
                  </span>
                  <time dateTime={booking.date}>{booking.date}</time>
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
                      disabled={updatingId !== null}
                      onClick={() => updateStatus(booking._id, "accepted")}
                      className="min-h-11 rounded-lg bg-primary px-5 py-2 font-bold text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === booking._id ? "Updating…" : "Accept"}
                    </button>
                    <button
                      type="button"
                      disabled={updatingId !== null}
                      onClick={() => updateStatus(booking._id, "rejected")}
                      className="min-h-11 rounded-lg border border-error px-5 py-2 font-bold text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === booking._id ? "Updating…" : "Reject"}
                    </button>
                  </>
                )}
                {normalizeBookingStatus(booking.status) === "accepted" && (
                  <button
                    type="button"
                    disabled={updatingId !== null}
                    onClick={() => updateStatus(booking._id, "in_progress")}
                    className="min-h-11 rounded-lg bg-secondary px-5 py-2 font-bold text-on-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingId === booking._id ? "Updating…" : "Start Service"}
                  </button>
                )}
                {normalizeBookingStatus(booking.status) === "in_progress" && (
                  <button
                    type="button"
                    disabled={updatingId !== null}
                    onClick={() => updateStatus(booking._id, "completed")}
                    className="min-h-11 rounded-lg bg-secondary px-5 py-2 font-bold text-on-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingId === booking._id ? "Updating…" : "Mark Complete"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!loading && !error && <BookingPagination pagination={localPagination} onPageChange={setPage} />}
      </section>
    </AppLayout>
  );
}
