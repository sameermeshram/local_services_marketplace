import MaterialIcon from "../ui/MaterialIcon";
import { BOOKING_LIFECYCLE, normalizeBookingStatus } from "./bookingStatus";

export default function BookingStatusTimeline({ status }) {
  const normalizedStatus = normalizeBookingStatus(status);
  const terminal = ["rejected", "cancelled"].includes(normalizedStatus);
  const currentIndex = BOOKING_LIFECYCLE.findIndex(
    (step) => step.status === normalizedStatus,
  );

  return (
    <section className="mt-6" aria-label="Booking status timeline">
      <h4 className="font-semibold text-on-surface">Status timeline</h4>
      {terminal ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-error/20 bg-error/5 p-4 text-error">
          <MaterialIcon name={normalizedStatus === "rejected" ? "block" : "cancel"} />
          <span className="font-semibold">
            {normalizedStatus === "rejected" ? "Request rejected" : "Booking cancelled"}
          </span>
        </div>
      ) : (
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BOOKING_LIFECYCLE.map((step, index) => {
            const completed = currentIndex > index || normalizedStatus === "completed";
            const current = currentIndex === index;
            return (
              <li
                key={step.status}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  completed
                    ? "border-primary/20 bg-primary/5 text-primary"
                    : current
                      ? "border-secondary/30 bg-secondary/10 text-on-secondary-container"
                      : "border-outline-variant bg-surface text-on-surface-variant"
                }`}
                aria-current={current ? "step" : undefined}
              >
                <MaterialIcon name={completed ? "check_circle" : step.icon} className="text-[20px]" />
                <span className="text-sm font-semibold">{step.label}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
