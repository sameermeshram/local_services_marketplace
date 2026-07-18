import { featuredProvider } from "../../data/mockData";

export default function BookingWidget({ provider = featuredProvider, onBook }) {
  const total = provider.hourlyRate + provider.serviceFee;

  return (
    <div className="sticky top-24">
      <div className="bg-surface border border-outline-variant rounded-3xl shadow-xl p-8 space-y-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-headline-lg font-black text-on-surface">${provider.hourlyRate}</span>
            <span className="text-on-surface-variant font-medium">/ hour</span>
          </div>
          <p className="text-body-sm text-primary font-bold mt-1">Available for new jobs today</p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
              Select Date
            </span>
            <input
              type="date"
              defaultValue="2023-10-25"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            />
          </label>
          <label className="block">
            <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
              Select Time
            </span>
            <select
              defaultValue="01:30 PM"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none appearance-none"
            >
              <option>09:00 AM</option>
              <option>11:00 AM</option>
              <option>01:30 PM</option>
              <option>04:00 PM</option>
            </select>
          </label>
          <label className="block">
            <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
              Service Type
            </span>
            <select className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none appearance-none">
              <option>Standard Repair</option>
              <option>Emergency Consultation</option>
              <option>Installation</option>
              <option>Maintenance Checkup</option>
            </select>
          </label>
        </div>

        <div className="pt-4 border-t border-outline-variant space-y-4">
          <div className="flex justify-between text-body-md">
            <span className="text-on-surface-variant">Service fee</span>
            <span className="font-bold">${provider.serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-headline-sm">
            <span className="text-on-surface">Total Est.</span>
            <span className="font-black text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBook}
          className="w-full bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary py-4 rounded-2xl font-black text-headline-sm transition-all transform hover:-translate-y-1 shadow-lg shadow-secondary/20 active:scale-95 uppercase tracking-wide"
        >
          Book {provider.name.split(" ")[0]} Now
        </button>
        <p className="text-center text-label-md text-on-surface-variant">
          No charge until job is completed
        </p>
      </div>
    </div>
  );
}
