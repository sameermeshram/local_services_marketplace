import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import StarRating from "../ui/StarRating";
import BookingRequestForm from "./BookingRequestForm";
import { bookingService } from "../../services/api";

const TIME_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

function formatBookingDate(date) {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(parsed);
}

function getBookingError(error) {
  const status = error.response?.status;
  if (status === 409) return "This provider already has a request for that date and time. Choose another preferred time.";
  if (status === 400) return "The provider may no longer be available or this service may no longer be offered. Refresh the profile and try again.";
  if (status === 401 || status === 403) return "Your account can’t submit this request. Sign in with a customer account and try again.";
  if (status === 429) return "Too many booking requests were sent. Please wait a moment before trying again.";
  return "We couldn’t send your request. Check your connection and try again.";
}

export default function ConfirmBookingModal({ open, onClose, provider }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingRequest, setBookingRequest] = useState(null);
  const submittingRef = useRef(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open || !provider) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocusRef.current instanceof HTMLElement) previousFocusRef.current.focus();
    };
  }, [open, provider]);

  if (!open || !provider) return null;

  const isAvailable = provider.available === true;
  const handleSubmit = async (payload) => {
    if (submittingRef.current || !isAvailable) return;
    submittingRef.current = true;
    dialogRef.current?.focus();
    setSubmitting(true);
    setError("");
    try {
      const response = await bookingService.create(payload);
      setBookingRequest(response.data?.booking ?? payload);
    } catch (requestError) {
      setError(getBookingError(requestError));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleDialogKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!submitting) onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable?.length) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-inverse-surface/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title" aria-describedby="booking-dialog-description" onKeyDown={handleDialogKeyDown} className="flex max-h-[min(94dvh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant bg-surface shadow-overlay focus:outline-none sm:rounded-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant bg-surface-container-lowest px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0"><p className="mb-1 text-label-sm font-bold uppercase tracking-wider text-primary">Booking request</p><h2 id="booking-dialog-title" className="font-headline-sm text-headline-sm font-bold text-on-surface">{bookingRequest ? "Request sent" : "Request this service"}</h2><p id="booking-dialog-description" className="mt-1 text-body-sm text-on-surface-variant">{bookingRequest ? "Your request is pending the provider’s response." : "Share the service and time you prefer."}</p></div>
          <button ref={closeButtonRef} type="button" onClick={onClose} disabled={submitting} aria-label="Close booking dialog" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"><MaterialIcon name="close" /></button>
        </header>

        <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-5 flex min-w-0 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 sm:gap-4 sm:p-4">
            {provider.image ? <img src={provider.image} alt={provider.imageAlt || `${provider.name} profile`} className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MaterialIcon name="person" className="text-[28px]" /></span>}
            <div className="min-w-0 flex-1"><h3 className="truncate font-title-md text-title-md font-bold text-on-surface">{provider.name}</h3><p className="truncate text-body-sm text-on-surface-variant">{provider.trade}</p></div>
            {provider.rating != null && Number(provider.reviewCount) > 0 && <div className="shrink-0"><StarRating rating={provider.rating} reviewCount={provider.reviewCount} size="14px" className="justify-end" /></div>}
          </div>

          {bookingRequest ? (
            <div className="space-y-5" role="status" aria-live="polite">
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><MaterialIcon name="check_circle" className="mt-0.5 text-[22px] text-primary" /><div><p className="font-semibold text-on-surface">Booking request submitted</p><p className="mt-1 text-body-sm text-on-surface-variant">Status: <span className="font-semibold capitalize text-on-surface">{String(bookingRequest.status || "pending").replaceAll("_", " ")}</span>. The provider must accept before it is confirmed.</p></div></div>
              <dl className="grid gap-3 rounded-xl bg-surface-container-low p-4 text-body-sm sm:grid-cols-2"><div><dt className="text-on-surface-variant">Service</dt><dd className="mt-0.5 font-medium text-on-surface">{bookingRequest.service}</dd></div><div><dt className="text-on-surface-variant">Preferred date</dt><dd className="mt-0.5 font-medium text-on-surface">{formatBookingDate(bookingRequest.date)}</dd></div><div><dt className="text-on-surface-variant">Preferred time</dt><dd className="mt-0.5 font-medium text-on-surface">{TIME_LABELS[bookingRequest.timeSlot] || bookingRequest.timeSlot}</dd></div></dl>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-outline-variant px-5 py-3 font-semibold text-on-surface hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Close</button><Link to="/bookings" onClick={onClose} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-center font-semibold text-on-primary hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">View my bookings</Link></div>
            </div>
          ) : !isAvailable ? (
            <div className="space-y-4"><p className="flex items-start gap-2 rounded-xl bg-surface-container-low p-4 text-body-sm text-on-surface-variant" role="status"><MaterialIcon name="info" className="text-[19px] text-primary" />This provider is currently unavailable for new requests.</p><button type="button" onClick={onClose} className="min-h-11 w-full rounded-xl border border-outline-variant px-5 py-3 font-semibold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Close</button></div>
          ) : (
            <>
              {error && <p className="mb-4 rounded-xl border border-error/30 bg-error/5 p-4 text-body-sm font-medium text-error" role="alert">{error}</p>}
              <BookingRequestForm provider={provider} onSubmit={handleSubmit} submitting={submitting} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
