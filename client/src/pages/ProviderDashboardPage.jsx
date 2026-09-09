import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import StatusPill from "../components/ui/StatusPill";
import { bookingService, providerService } from "../services/api";

export default function ProviderDashboardPage() {
  const [available, setAvailable] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");

  useEffect(() => {
    let active = true;

    bookingService
      .getProviderBookings()
      .then((response) => {
        if (active) setBookings(response.data?.bookings ?? []);
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
  }, []);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    setError("");
    try {
      const response = await bookingService.updateStatus(id, status);
      const updatedBooking = response.data?.booking;
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
    const previous = available;
    setAvailable(nextAvailable);
    setAvailabilityError("");

    try {
      await providerService.updateAvailability({ isAvailable: nextAvailable });
    } catch (requestError) {
      setAvailable(previous);
      setAvailabilityError(
        requestError.response?.data?.message ||
          "Unable to update availability.",
      );
    }
  };

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
                onClick={() => updateAvailability(true)}
                className={`px-4 py-1.5 rounded-full text-label-md font-bold transition-all duration-300 ${
                  available
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => updateAvailability(false)}
                className={`px-4 py-1.5 rounded-full text-label-md font-bold transition-all duration-300 ${
                  !available
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                Offline
              </button>
            </div>
            <MaterialIcon
              name="notifications"
              className="text-on-surface-variant cursor-pointer hover:text-primary transition-colors"
            />
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
            Booking Requests
          </h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Review and manage service requests from your local customers.
          </p>
        </div>

        {loading && (
          <p className="py-12 text-center text-on-surface-variant">
            Loading requests...
          </p>
        )}
        {error && (
          <p className="py-4 text-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="py-16 text-center border border-dashed border-outline-variant rounded-xl">
            <MaterialIcon
              name="event_available"
              className="text-primary text-5xl mb-3"
            />
            <h2 className="font-headline-sm text-headline-sm">
              No booking requests yet
            </h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              New customer requests will appear here.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map((booking) => (
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
              <p className="text-body-md text-on-surface-variant">
                {booking.details}
              </p>
              <div className="flex flex-wrap gap-3">
                {booking.status === "pending" && (
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
                {booking.status === "accepted" && (
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
      </section>
    </AppLayout>
  );
}
