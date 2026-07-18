import { useState } from "react";
import MaterialIcon from "../ui/MaterialIcon";
import StarRating from "../ui/StarRating";
import { bookingModalProvider } from "../../data/mockData";

const CALENDAR_DAYS = [
  { id: "day1", label: "01", disabled: false },
  { id: "day2", label: "02", disabled: false },
  { id: "day3", label: "03", disabled: false },
  { id: "day4", label: "04", disabled: false },
  { id: "day5", label: "05", disabled: false },
  { id: "day6", label: "06", disabled: false },
  { id: "day7", label: "07", disabled: false },
  { id: "day8", label: "08", disabled: true },
  { id: "day9", label: "09", disabled: true },
  { id: "day10", label: "10", disabled: true },
  { id: "day11", label: "11", disabled: true },
  { id: "day12", label: "12", disabled: true },
  { id: "day13", label: "13", disabled: true },
  { id: "day14", label: "14", disabled: true },
];

const TIME_SLOTS = [
  { id: "morning", label: "Morning", range: "8AM - 12PM", icon: "light_mode" },
  { id: "afternoon", label: "Afternoon", range: "12PM - 4PM", icon: "sunny" },
  { id: "evening", label: "Evening", range: "4PM - 8PM", icon: "dark_mode" },
];

export default function ConfirmBookingModal({ open, onClose, provider = bookingModalProvider }) {
  const [selectedDay, setSelectedDay] = useState("day1");
  const [selectedSlot, setSelectedSlot] = useState("morning");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setConfirmed(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 1200);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-2xl bg-surface rounded-xl shadow-2xl overflow-hidden max-h-[921px] flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant bg-surface-container-lowest">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Book Your Service</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Secure a local pro in just a few steps
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant cursor-pointer active:opacity-70"
            >
              <MaterialIcon name="close" />
            </button>
          </div>

          <div className="overflow-y-auto px-8 py-6 space-y-8 flex-1">
            <div className="bg-surface-bright border border-outline-variant p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="relative">
                <img
                  src={provider.image}
                  alt={provider.imageAlt}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-surface flex items-center justify-center">
                  <MaterialIcon name="verified" filled className="text-[14px]" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      {provider.name}
                    </h3>
                    <p className="font-label-md text-label-md text-primary uppercase tracking-wider">
                      {provider.trade}
                    </p>
                  </div>
                  <div className="text-right">
                    <StarRating
                      rating={provider.rating}
                      reviewCount={provider.reviewCount}
                      size="14px"
                      className="justify-end"
                    />
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      ${provider.hourlyRate}/hr base rate
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form className="space-y-6" id="bookingForm" onSubmit={handleSubmit}>
              <section>
                <label className="block font-headline-sm text-headline-sm mb-4 text-on-surface">
                  1. Select a Date
                </label>
                <div className="grid grid-cols-7 gap-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <div
                      key={d}
                      className="text-center font-label-md text-label-md text-on-surface-variant pb-2"
                    >
                      {d}
                    </div>
                  ))}
                  {[28, 29, 30, 31].map((d) => (
                    <div key={`prev-${d}`} className="opacity-30 p-2 text-center text-body-sm">
                      {d}
                    </div>
                  ))}
                  {CALENDAR_DAYS.map((day) =>
                    day.disabled ? (
                      <div
                        key={day.id}
                        className="p-2 text-center text-body-sm font-bold text-on-surface-variant hover:text-primary cursor-pointer"
                      >
                        {day.label}
                      </div>
                    ) : (
                      <span key={day.id}>
                        <input
                          type="radio"
                          name="booking_date"
                          id={day.id}
                          className="hidden day-chip"
                          checked={selectedDay === day.id}
                          onChange={() => setSelectedDay(day.id)}
                        />
                        <label
                          htmlFor={day.id}
                          className="p-2 text-center text-body-sm font-bold border border-transparent rounded-lg cursor-pointer hover:border-primary transition-all block"
                        >
                          {day.label}
                        </label>
                      </span>
                    )
                  )}
                </div>
              </section>

              <section>
                <label className="block font-headline-sm text-headline-sm mb-4 text-on-surface">
                  2. Preferred Window
                </label>
                <div className="flex flex-wrap gap-3">
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot.id} className="flex-1 min-w-[120px]">
                      <input
                        type="radio"
                        name="time_slot"
                        id={slot.id}
                        className="hidden slot-chip"
                        checked={selectedSlot === slot.id}
                        onChange={() => setSelectedSlot(slot.id)}
                      />
                      <label
                        htmlFor={slot.id}
                        className="flex flex-col items-center justify-center p-4 border border-outline-variant rounded-xl cursor-pointer hover:bg-surface-container transition-all group active:scale-[0.98]"
                      >
                        <MaterialIcon
                          name={slot.icon}
                          className="mb-1 group-hover:scale-110 transition-transform"
                        />
                        <span className="font-label-md text-label-md">{slot.label}</span>
                        <span className="text-[10px] opacity-70">{slot.range}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <label className="block font-headline-sm text-headline-sm text-on-surface">
                  3. Service Location
                </label>
                <div className="relative group">
                  <MaterialIcon
                    name="location_on"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                  />
                  <input
                    type="text"
                    placeholder="Enter street address"
                    className="w-full pl-12 pr-4 py-4 bg-surface border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline-variant"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <label className="block font-headline-sm text-headline-sm text-on-surface">
                  4. Job Details
                </label>
                <div className="relative group">
                  <textarea
                    rows={4}
                    placeholder="Briefly describe the issue (e.g. 'Faulty kitchen outlet causing short circuit...')"
                    className="w-full p-4 bg-surface border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline-variant resize-none"
                  />
                  <div className="absolute right-4 bottom-4 flex items-center gap-2 text-outline-variant hover:text-primary cursor-pointer transition-colors">
                    <MaterialIcon name="attach_file" className="text-sm" />
                    <span className="font-label-md text-label-md">Add photos</span>
                  </div>
                </div>
              </section>
            </form>
          </div>

          <div className="px-8 py-6 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase">
                Estimated Total
              </p>
              <p className="font-headline-sm text-headline-sm text-on-surface">$65.00 - $90.00</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:block px-6 py-3 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="bookingForm"
                disabled={submitting}
                className={`flex-1 sm:flex-none px-10 py-3 text-white font-headline-sm text-headline-sm rounded-lg shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  confirmed ? "bg-primary" : "bg-secondary-container"
                }`}
              >
                {submitting ? (
                  <>
                    <MaterialIcon name="progress_activity" className="animate-spin" />
                    Processing...
                  </>
                ) : confirmed ? (
                  "Booking Confirmed!"
                ) : (
                  <>
                    Confirm Booking
                    <MaterialIcon name="arrow_forward" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-primary text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-500 ${
          showToast ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0"
        }`}
      >
        <div className="bg-primary-container/20 p-1 rounded-full">
          <MaterialIcon name="check_circle" filled />
        </div>
        <div>
          <p className="font-label-md text-label-md font-bold">Booking Request Sent!</p>
          <p className="text-[10px] opacity-90">{provider.name.split(" ")[0]} will respond shortly.</p>
        </div>
      </div>
    </>
  );
}
