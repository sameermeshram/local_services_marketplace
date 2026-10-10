import { useEffect, useRef, useState } from "react";
import AppLayout, { MobileBottomNav } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import StatusPill from "../components/ui/StatusPill";
import { adminService } from "../services/api";

export default function AdminDashboardPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [rejectionProvider, setRejectionProvider] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const rejectionDialogRef = useRef(null);

  const loadProviders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminService.getPendingProviders();
      setProviders(response.data?.providers ?? []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load pending providers.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (!rejectionProvider) return;
    const dialog = rejectionDialogRef.current;
    dialog?.querySelector("textarea")?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !updatingId) {
        setRejectionProvider(null);
        setRejectionReason("");
      }
    };
    dialog?.addEventListener("keydown", handleKeyDown);
    return () => dialog?.removeEventListener("keydown", handleKeyDown);
  }, [rejectionProvider, updatingId]);

  const approve = async (id) => {
    setUpdatingId(id);
    setError("");
    try {
      await adminService.approveProvider(id);
      setProviders((current) =>
        current.filter((provider) => provider._id !== id),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to approve provider.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const reject = async () => {
    if (!rejectionProvider || updatingId) return;
    const reason = rejectionReason.trim();
    setUpdatingId(rejectionProvider._id);
    setError("");
    try {
      await adminService.rejectProvider(rejectionProvider._id, reason);
      setProviders((current) =>
        current.filter((provider) => provider._id !== rejectionProvider._id),
      );
      setRejectionProvider(null);
      setRejectionReason("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to reject provider.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppLayout
      activeItem="admin"
      role="admin"
      mainClassName="md:ml-[280px] min-h-screen"
      mobileNav={<MobileBottomNav activeItem="admin" role="admin" />}
      topBar={
        <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-margin-desktop h-16 md:ml-[280px] md:max-w-[calc(100%-280px)]">
          <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
            Admin Dashboard
          </h2>
          <MaterialIcon name="admin_panel_settings" className="text-primary" />
        </header>
      }
    >
      <section className="p-margin-desktop max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Provider Approval
          </h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Review provider profiles before they become visible to customers.
          </p>
        </div>

        {loading && (
          <p className="py-12 text-center text-on-surface-variant">
            Loading providers...
          </p>
        )}
        {error && (
          <div className="flex flex-col gap-3 py-4 text-error sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadProviders}
              disabled={loading}
              className="min-h-11 rounded-lg border border-error px-4 py-2 font-bold transition-colors hover:bg-error/5 disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && providers.length === 0 && (
          <div className="py-16 text-center border border-dashed border-outline-variant rounded-xl">
            <MaterialIcon
              name="task_alt"
              className="text-primary text-5xl mb-3"
            />
            <h2 className="font-headline-sm text-headline-sm">
              No pending providers
            </h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              New provider applications will appear here.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {providers.map((provider) => (
            <article
              key={provider._id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="font-headline-sm text-headline-sm">
                    {provider.user?.name || "Unnamed provider"}
                  </h2>
                  <p className="text-body-md text-on-surface-variant mt-1">
                    {provider.user?.email}
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Pincode: {provider.user?.pincode || "Not provided"}
                  </p>
                </div>
                <StatusPill status={provider.approvalStatus || "pending"} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-body-sm">
                <div>
                  <span className="block text-label-md text-on-surface-variant uppercase">
                    Bio
                  </span>
                  {provider.bio || "Not provided"}
                </div>
                <div>
                  <span className="block text-label-md text-on-surface-variant uppercase">
                    Categories
                  </span>
                  {provider.categories
                    ?.map((category) => category.name)
                    .join(", ") || "Not selected"}
                </div>
                <div>
                  <span className="block text-label-md text-on-surface-variant uppercase">
                    Services
                  </span>
                  {provider.services
                    ?.map((service) => service.name)
                    .join(", ") || "Not provided"}
                </div>
              </div>
              <div className="border-t border-outline-variant pt-4 space-y-2">
                <span className="block text-label-md text-on-surface-variant uppercase font-bold">
                  Verification Documents (
                  {provider.verificationDocuments?.length || 0})
                </span>
                {provider.verificationDocuments &&
                provider.verificationDocuments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {provider.verificationDocuments.map((document, idx) => (
                      <a
                        key={document.id || idx}
                        href={adminService.getVerificationDocumentUrl(
                          provider._id,
                          idx,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-primary text-xs font-bold hover:bg-primary-container/10 transition-colors"
                      >
                        <MaterialIcon name="description" className="text-sm" />
                        Document #{idx + 1}
                        <MaterialIcon
                          name="open_in_new"
                          className="text-[12px]"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-error italic">
                    No verification documents uploaded by provider.
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={updatingId === provider._id}
                  onClick={() => approve(provider._id)}
                  className="bg-primary text-on-primary px-5 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={updatingId === provider._id}
                  onClick={() => {
                    setRejectionProvider(provider);
                    setRejectionReason("");
                    setError("");
                  }}
                  className="border border-error text-error px-5 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-error/5 transition-colors"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {rejectionProvider && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !updatingId) {
              setRejectionProvider(null);
              setRejectionReason("");
            }
          }}
        >
          <div
            ref={rejectionDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rejection-dialog-title"
            className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl"
          >
            <h2 id="rejection-dialog-title" className="font-headline-sm text-headline-sm text-on-surface">
              Reject provider
            </h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              Record an optional reason for rejecting{" "}
              {rejectionProvider.user?.name || "this provider"}.
            </p>
            <label htmlFor="rejection-reason" className="mt-5 block text-label-md font-bold text-on-surface">
              Reason <span className="font-normal text-on-surface-variant">(optional)</span>
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              maxLength={500}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={5}
              aria-describedby="rejection-reason-help rejection-reason-count"
              className="mt-2 w-full rounded-xl border border-outline-variant bg-surface p-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <div className="mt-1 flex justify-between gap-4 text-label-md text-on-surface-variant">
              <span id="rejection-reason-help">Leave blank to use the default rejection message.</span>
              <span id="rejection-reason-count">{rejectionReason.length}/500</span>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() => {
                  setRejectionProvider(null);
                  setRejectionReason("");
                }}
                className="min-h-11 rounded-lg border border-outline px-4 py-2 font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={reject}
                className="min-h-11 rounded-lg bg-error px-4 py-2 font-bold text-on-error transition-colors hover:bg-error/90 disabled:opacity-50"
              >
                {updatingId ? "Rejecting..." : "Reject provider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
