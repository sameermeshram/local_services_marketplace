import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import StatusPill from "../components/ui/StatusPill";
import { adminService } from "../services/api";

export default function AdminDashboardPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

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

  const reject = async (id) => {
    const reason = window.prompt(
      "Reason for rejection",
      "Please provide more verification details.",
    );
    if (reason === null) return;

    setUpdatingId(id);
    setError("");
    try {
      await adminService.rejectProvider(id, reason);
      setProviders((current) =>
        current.filter((provider) => provider._id !== id),
      );
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
          <p className="py-4 text-error" role="alert">
            {error}
          </p>
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
                  onClick={() => reject(provider._id)}
                  className="border border-error text-error px-5 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-error/5 transition-colors"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
