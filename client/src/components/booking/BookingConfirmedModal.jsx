import MaterialIcon from "../ui/MaterialIcon";

export default function BookingConfirmedModal({ open, onClose, providerName = "Marcus Chen" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-surface w-full max-w-md rounded-3xl p-10 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center">
            <MaterialIcon name="check_circle" filled className="text-[64px] text-primary" />
          </div>
          <div>
            <h3 className="text-headline-md font-black text-on-surface">Booking Confirmed!</h3>
            <p className="text-body-md text-on-surface-variant mt-2 px-4">
              {providerName} has been notified. You&apos;ll receive a confirmation text shortly.
            </p>
          </div>
          <div className="w-full bg-surface-container-low p-6 rounded-2xl border border-outline-variant space-y-3">
            <div className="flex justify-between">
              <span className="text-label-md font-bold text-on-surface-variant uppercase">Date</span>
              <span className="text-body-sm font-bold">Oct 25, 2023</span>
            </div>
            <div className="flex justify-between">
              <span className="text-label-md font-bold text-on-surface-variant uppercase">Time</span>
              <span className="text-body-sm font-bold">01:30 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-label-md font-bold text-on-surface-variant uppercase">Provider</span>
              <span className="text-body-sm font-bold">{providerName}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold transition-all active:scale-95 shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
