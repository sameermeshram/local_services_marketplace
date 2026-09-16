import { useState } from "react";
import { featuredProvider } from "../../data/mockData";

export default function BookingWidget({ provider = featuredProvider, onBook, bookingLoading = false, bookingError = "" }) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [timeSlot, setTimeSlot] = useState("morning");
  const [service, setService] = useState(() => provider.skills?.[0] || "Standard Repair");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");

  const total = (provider.hourlyRate || 0) + (provider.serviceFee || 15);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim() || !details.trim()) return;
    if (onBook) {
      onBook({
        providerId: provider.id,
        service: service || provider.skills?.[0] || "Standard Repair",
        date,
        timeSlot,
        address: address.trim(),
        details: details.trim(),
      });
    }
  };

  return (
    <div className="sticky top-24">
      <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant rounded-3xl shadow-xl p-8 space-y-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-headline-lg font-black text-on-surface">${provider.hourlyRate}</span>
            <span className="text-on-surface-variant font-medium">/ hour</span>
          </div>
          <p className="text-body-sm text-primary font-bold mt-1">
            {provider.availableToday ? "Available for new jobs today" : "Currently offline"}
          </p>
        </div>

        {bookingError && (
          <p className="text-error text-body-sm bg-error/10 p-3 rounded-lg" role="alert">
            {bookingError}
          </p>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
              Select Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            />
          </label>
          <label className="block">
            <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
              Select Window
            </span>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            >
              <option value="morning">Morning (8 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
              <option value="evening">Evening (4 PM - 8 PM)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
              Service
            </span>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            >
              {(provider.skills || ["Standard Repair"]).map((sk) => (
                <option key={sk} value={sk}>
                  {sk}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
              Service Address
            </span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your street address..."
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            />
          </label>
          <label className="block">
            <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
              Job Description
            </span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what needs to be fixed..."
              required
              rows={2}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-outline-variant space-y-4">
          <div className="flex justify-between text-body-md">
            <span className="text-on-surface-variant">Service fee</span>
            <span className="font-bold">${(provider.serviceFee || 15).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-headline-sm">
            <span className="text-on-surface">Total Est.</span>
            <span className="font-black text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={bookingLoading || !provider.availableToday}
          className="w-full bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary py-4 rounded-2xl font-black text-headline-sm transition-all transform hover:-translate-y-1 shadow-lg shadow-secondary/20 active:scale-95 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bookingLoading ? "Booking..." : `Book ${provider.name?.split(" ")[0] || "Now"}`}
        </button>
        <p className="text-center text-label-md text-on-surface-variant">
          No charge until job is completed
        </p>
      </form>
    </div>
  );
}

