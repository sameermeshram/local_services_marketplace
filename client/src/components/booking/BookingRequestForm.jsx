import { useState } from "react";

const TIME_SLOTS = [
  { value: "morning", label: "Morning (8 AM - 12 PM)" },
  { value: "afternoon", label: "Afternoon (12 PM - 4 PM)" },
  { value: "evening", label: "Evening (4 PM - 8 PM)" },
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getServices(provider) {
  const services = provider.services?.map((service) =>
    typeof service === "string" ? service : service.name,
  ).filter(Boolean);

  return services?.length ? services : [provider.trade || "Service request"];
}

export default function BookingRequestForm({
  provider,
  onSubmit,
  submitting = false,
  error = "",
}) {
  const services = getServices(provider);
  const [date, setDate] = useState(() => getLocalDateString());
  const [timeSlot, setTimeSlot] = useState("morning");
  const [service, setService] = useState(services[0]);
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const providerId = provider.id || provider._id;
    if (!providerId) return;
    if (!address.trim() || !details.trim()) {
      setValidationError("Enter a service address and describe the work needed.");
      return;
    }

    setValidationError("");
    onSubmit({
      providerId,
      service,
      date,
      timeSlot,
      address: address.trim(),
      details: details.trim(),
    });
  };

  const fieldClassName =
    "w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60";
  const labelClassName =
    "mb-2 block text-sm font-semibold text-on-surface";

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className={labelClassName}>Service <span className="text-error" aria-hidden="true">*</span></span>
        <select
          value={service}
          onChange={(event) => setService(event.target.value)}
          className={fieldClassName}
          disabled={submitting}
        >
          {services.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClassName}>Preferred date <span className="text-error" aria-hidden="true">*</span></span>
          <input
            type="date"
            value={date}
            min={getLocalDateString()}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClassName}
            required
            disabled={submitting}
          />
        </label>
        <label className="block">
          <span className={labelClassName}>Preferred time <span className="text-error" aria-hidden="true">*</span></span>
          <select
            value={timeSlot}
            onChange={(event) => setTimeSlot(event.target.value)}
            className={fieldClassName}
            required
            disabled={submitting}
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelClassName}>Service address <span className="text-error" aria-hidden="true">*</span></span>
        <input
          type="text"
          value={address}
          onChange={(event) => {
            setAddress(event.target.value);
            setValidationError("");
          }}
          autoComplete="street-address"
          maxLength={500}
          className={fieldClassName}
          required
          disabled={submitting}
        />
      </label>

      <label className="block">
        <span className={labelClassName}>What needs to be done? <span className="text-error" aria-hidden="true">*</span></span>
        <textarea
          value={details}
          onChange={(event) => {
            setDetails(event.target.value);
            setValidationError("");
          }}
          rows={4}
          maxLength={2000}
          className={fieldClassName}
          required
          disabled={submitting}
        />
      </label>

      {(validationError || error) && (
        <p className="text-sm text-error" role="alert">{validationError || error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !provider.id && !provider._id}
        className="min-h-12 w-full rounded-xl bg-secondary px-6 py-3 font-bold text-on-secondary transition-colors hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending request…" : "Send booking request"}
      </button>
    </form>
  );
}
