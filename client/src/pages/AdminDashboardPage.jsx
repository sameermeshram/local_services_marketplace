import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout, { MobileBottomNav } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import StatusPill from "../components/ui/StatusPill";
import { adminService } from "../services/api";

function formatDate(value) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not provided"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export default function AdminDashboardPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [rejectionProvider, setRejectionProvider] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [query, setQuery] = useState("");
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const rejectionDialogRef = useRef(null);
  const documentDialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const updatingRef = useRef(false);

  const loadProviders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminService.getPendingProviders();
      setProviders(response.data?.providers ?? []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load pending providers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (!rejectionProvider && !documentPreview) return;
    const dialog = rejectionProvider ? rejectionDialogRef.current : documentDialogRef.current;
    const focusTarget = rejectionProvider
      ? dialog?.querySelector("textarea")
      : dialog?.querySelector("button, a, iframe, img");
    focusTarget?.focus?.();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !updatingRef.current) {
        if (rejectionProvider) {
          setRejectionProvider(null);
          setRejectionReason("");
          setRejectionError("");
        } else {
          setDocumentPreview(null);
        }
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], iframe, img[tabindex="0"], textarea:not([disabled])')];
      if (!focusable.length) return;
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
    dialog?.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog?.removeEventListener("keydown", handleKeyDown);
      returnFocusRef.current?.focus?.();
      returnFocusRef.current = null;
    };
  }, [rejectionProvider, documentPreview]);

  useEffect(() => {
    if (!documentPreview) {
      if (documentUrl) URL.revokeObjectURL(documentUrl);
      setDocumentUrl("");
      setDocumentLoading(false);
      setDocumentError("");
      return;
    }
    let active = true;
    setDocumentLoading(true);
    setDocumentError("");
    adminService.getVerificationDocument(documentPreview.providerId, documentPreview.index)
      .then((response) => {
        if (!active) return;
        const blob = response.data;
        if (!blob || blob.size === 0) throw new Error("This verification document is empty.");
        setDocumentUrl(URL.createObjectURL(blob));
      })
      .catch((requestError) => {
        if (!active) return;
        setDocumentError(requestError.response?.data?.message || requestError.message || "Unable to load this verification document.");
      })
      .finally(() => active && setDocumentLoading(false));
    return () => { active = false; };
  }, [documentPreview]);

  const filteredProviders = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return providers;
    return providers.filter((provider) => {
      const searchable = [
        provider.user?.name, provider.user?.email, provider.user?.phone,
        provider.user?.pincode, provider.bio,
        ...(provider.categories || []).map((category) => category.name),
        ...(provider.services || []).map((service) => service.name || service),
        ...(provider.serviceAreas || []),
      ].filter(Boolean).join(" ").toLocaleLowerCase();
      return searchable.includes(needle);
    });
  }, [providers, query]);

  const approve = async (provider) => {
    if (updatingRef.current) return;
    updatingRef.current = true;
    setUpdatingId(provider._id);
    setError("");
    setSuccess("");
    try {
      await adminService.approveProvider(provider._id);
      setProviders((current) => current.filter((item) => item._id !== provider._id));
      setSuccess(`${provider.user?.name || "Provider"} approved successfully.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to approve provider.");
    } finally {
      updatingRef.current = false;
      setUpdatingId(null);
    }
  };

  const reject = async () => {
    if (!rejectionProvider || updatingRef.current) return;
    const provider = rejectionProvider;
    updatingRef.current = true;
    setUpdatingId(provider._id);
    setRejectionError("");
    setSuccess("");
    try {
      await adminService.rejectProvider(provider._id, rejectionReason.trim());
      setProviders((current) => current.filter((item) => item._id !== provider._id));
      setSuccess(`${provider.user?.name || "Provider"} rejected.`);
      setRejectionProvider(null);
      setRejectionReason("");
    } catch (requestError) {
      setRejectionError(requestError.response?.data?.message || "Unable to reject provider.");
    } finally {
      updatingRef.current = false;
      setUpdatingId(null);
    }
  };

  const openDocument = (event, provider, document, index) => {
    returnFocusRef.current = event.currentTarget;
    setDocumentPreview({
      providerId: provider._id,
      providerName: provider.user?.name || "Provider",
      document,
      index,
    });
  };

  return (
    <AppLayout
      activeItem="admin"
      role="admin"
      mainClassName="min-w-0 lg:ml-[250px]"
      mobileNav={<MobileBottomNav activeItem="admin" role="admin" />}
      topBar={
        <header className="sticky top-0 z-40 flex h-[68px] w-full items-center justify-between border-b border-border-subtle bg-surface-container-lowest/95 px-4 backdrop-blur-md sm:px-6 lg:ml-[250px] lg:w-[calc(100%_-_250px)] lg:px-8">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Admin Dashboard</h2>
          <MaterialIcon name="admin_panel_settings" className="text-primary" />
        </header>
      }
    >
      <section className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Provider Approval</h1>
            <p className="mt-2 text-body-md text-on-surface-variant">Review provider profiles and verification documents before they become visible to customers.</p>
          </div>
          {!loading && !error && providers.length > 0 && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">{providers.length}</span> {providers.length === 1 ? "application" : "applications"} awaiting review
            </div>
          )}
        </div>

        {success && <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-body-sm text-primary" role="status">{success}</p>}
        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-error sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadProviders} disabled={loading || Boolean(updatingId)} className="min-h-11 rounded-lg border border-error px-4 py-2 font-bold transition-colors hover:bg-error/5 disabled:opacity-50">Retry</button>
          </div>
        )}

        {loading && (
          <div className="space-y-4" aria-label="Loading provider applications" aria-busy="true">
            {[1, 2].map((item) => <div key={item} className="animate-pulse space-y-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-6"><div className="h-6 w-1/3 rounded bg-surface-container-high" /><div className="h-4 w-1/2 rounded bg-surface-container-high" /><div className="h-20 rounded bg-surface-container-high" /></div>)}
          </div>
        )}
        {!loading && !error && providers.length === 0 && (
          <div className="rounded-xl border border-dashed border-outline-variant py-16 text-center">
            <MaterialIcon name="task_alt" className="mb-3 text-5xl text-primary" />
            <h2 className="font-headline-sm text-headline-sm">No pending providers</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">New provider applications will appear here.</p>
          </div>
        )}

        {!loading && !error && providers.length > 0 && (
          <div className="space-y-5">
            <label className="relative block max-w-xl">
              <MaterialIcon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <span className="sr-only">Search applications loaded for review</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, phone, pincode or service" className="min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
            {filteredProviders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant py-12 text-center" role="status">
                <h2 className="font-headline-sm text-headline-sm">No matching applications</h2>
                <button type="button" onClick={() => setQuery("")} className="mt-3 min-h-11 rounded-lg px-4 font-bold text-primary hover:bg-primary/5">Clear search</button>
              </div>
            ) : filteredProviders.map((provider) => (
              <article key={provider._id} className="space-y-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    {provider.profileImage ? <img src={provider.profileImage} alt={`${provider.user?.name || "Provider"} profile`} className="h-14 w-14 shrink-0 rounded-full object-cover" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-container text-primary"><MaterialIcon name="person" /></span>}
                    <div className="min-w-0">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">{provider.user?.name || "Unnamed provider"}</h2>
                      <p className="mt-1 break-all text-body-md text-on-surface-variant">{provider.user?.email || "Email not provided"}</p>
                      <p className="mt-1 text-body-sm text-on-surface-variant">{provider.user?.phone || "Phone not provided"} · Pincode: {provider.user?.pincode || "Not provided"}</p>
                      <p className="mt-1 text-label-md text-on-surface-variant">Applied {formatDate(provider.createdAt)}</p>
                    </div>
                  </div>
                  <StatusPill status={provider.approvalStatus || "pending"} label="Awaiting review" />
                </div>
                <div className="grid gap-4 border-t border-outline-variant pt-4 text-body-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div><span className="mb-1 block text-label-md font-bold uppercase text-on-surface-variant">Bio</span><p className="whitespace-pre-wrap text-on-surface">{provider.bio || "Not provided"}</p></div>
                  <div><span className="mb-1 block text-label-md font-bold uppercase text-on-surface-variant">Categories</span><p className="text-on-surface">{provider.categories?.map((category) => category.name).filter(Boolean).join(", ") || "Not selected"}</p></div>
                  <div><span className="mb-1 block text-label-md font-bold uppercase text-on-surface-variant">Services</span><p className="text-on-surface">{provider.services?.map((service) => service.name || service).filter(Boolean).join(", ") || "Not provided"}</p></div>
                  <div><span className="mb-1 block text-label-md font-bold uppercase text-on-surface-variant">Service areas</span><p className="text-on-surface">{provider.serviceAreas?.join(", ") || "Not provided"}</p></div>
                </div>
                <div className="space-y-3 border-t border-outline-variant pt-4">
                  <div><span className="block text-label-md font-bold uppercase text-on-surface-variant">Verification documents ({provider.verificationDocuments?.length || 0})</span><p className="mt-1 text-body-sm text-on-surface-variant">Private files are available to authorized administrators for review.</p></div>
                  {provider.verificationDocuments?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {provider.verificationDocuments.map((doc, index) => {
                        const title = doc.originalFilename || `Document ${index + 1}`;
                        return <button key={doc.id || index} type="button" onClick={(event) => openDocument(event, provider, doc, index)} disabled={Boolean(updatingId)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-left text-xs font-bold text-primary transition-colors hover:bg-primary-container/10 disabled:opacity-50" aria-label={`Preview ${title}`}><MaterialIcon name="description" className="text-base" /><span className="max-w-[16rem] truncate">{title}</span><MaterialIcon name="visibility" className="text-sm" /></button>;
                      })}
                    </div>
                  ) : <p className="text-body-sm italic text-error">No verification documents uploaded by provider.</p>}
                  {provider.verificationDocuments?.length > 0 && <div className="flex flex-wrap gap-x-4 gap-y-1 text-label-md text-on-surface-variant">{provider.verificationDocuments.map((doc, index) => <span key={doc.id || index}>Document {index + 1}: {formatDate(doc.uploadedAt)}{doc.format ? ` · ${doc.format.toUpperCase()}` : ""}</span>)}</div>}
                </div>
                <div className="flex flex-wrap gap-3 border-t border-outline-variant pt-4">
                  <button type="button" disabled={Boolean(updatingId)} onClick={() => approve(provider)} className="min-h-11 rounded-lg bg-primary px-5 py-2 font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50">{updatingId === provider._id ? "Saving..." : "Approve"}</button>
                  <button type="button" disabled={Boolean(updatingId)} onClick={(event) => { returnFocusRef.current = event.currentTarget; setRejectionProvider(provider); setRejectionReason(""); setRejectionError(""); }} className="min-h-11 rounded-lg border border-error px-5 py-2 font-bold text-error transition-colors hover:bg-error/5 disabled:opacity-50">Reject</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {rejectionProvider && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !updatingRef.current) { setRejectionProvider(null); setRejectionReason(""); setRejectionError(""); } }}>
          <div ref={rejectionDialogRef} role="dialog" aria-modal="true" aria-labelledby="rejection-dialog-title" className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <h2 id="rejection-dialog-title" className="font-headline-sm text-headline-sm text-on-surface">Reject provider</h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">Record an optional reason for rejecting {rejectionProvider.user?.name || "this provider"}.</p>
            <label htmlFor="rejection-reason" className="mt-5 block text-label-md font-bold text-on-surface">Reason <span className="font-normal text-on-surface-variant">(optional)</span></label>
            <textarea id="rejection-reason" value={rejectionReason} maxLength={500} onChange={(event) => setRejectionReason(event.target.value)} rows={5} aria-describedby="rejection-reason-help rejection-reason-count" className="mt-2 w-full rounded-xl border border-outline-variant bg-surface p-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" />
            <div className="mt-1 flex justify-between gap-4 text-label-md text-on-surface-variant"><span id="rejection-reason-help">Leave blank to use the default rejection message.</span><span id="rejection-reason-count">{rejectionReason.length}/500</span></div>
            {rejectionError && <p className="mt-4 text-body-sm text-error" role="alert">{rejectionError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={Boolean(updatingId)} onClick={() => { setRejectionProvider(null); setRejectionReason(""); setRejectionError(""); }} className="min-h-11 rounded-lg border border-outline px-4 py-2 font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50">Cancel</button>
              <button type="button" disabled={Boolean(updatingId)} onClick={reject} className="min-h-11 rounded-lg bg-error px-4 py-2 font-bold text-on-error transition-colors hover:bg-error/90 disabled:opacity-50">{updatingId ? "Rejecting..." : "Reject provider"}</button>
            </div>
          </div>
        </div>
      )}

      {documentPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/50 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDocumentPreview(null); }}>
          <div ref={documentDialogRef} role="dialog" aria-modal="true" aria-labelledby="document-dialog-title" className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-4 sm:p-5">
              <div className="min-w-0"><h2 id="document-dialog-title" className="truncate font-headline-sm text-headline-sm text-on-surface">{documentPreview.document.originalFilename || `Document ${documentPreview.index + 1}`}</h2><p className="mt-1 text-body-sm text-on-surface-variant">{documentPreview.providerName} · uploaded {formatDate(documentPreview.document.uploadedAt)}</p></div>
              <button type="button" onClick={() => setDocumentPreview(null)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container-high" aria-label="Close document preview"><MaterialIcon name="close" /></button>
            </div>
            <div className="min-h-[45vh] flex-1 overflow-auto bg-surface-container p-3 sm:p-6" aria-busy={documentLoading}>
              {documentLoading && <div className="grid min-h-[45vh] place-items-center text-body-md text-on-surface-variant"><span><MaterialIcon name="progress_activity" className="mr-2 animate-spin" />Loading private document…</span></div>}
              {documentError && <div className="grid min-h-[45vh] place-items-center"><div className="max-w-md text-center"><MaterialIcon name="broken_image" className="text-4xl text-error" /><p className="mt-3 text-body-md text-error" role="alert">{documentError}</p></div></div>}
              {documentUrl && !documentLoading && (documentPreview.document.resourceType === "image" || /^\.(png|jpe?g|gif|webp|avif)$/i.test(documentPreview.document.format || ""))
                ? <img src={documentUrl} alt={`Verification document submitted by ${documentPreview.providerName}`} className="mx-auto max-h-[70vh] max-w-full object-contain" onError={() => setDocumentError("This image could not be previewed. It may be damaged or unavailable.")} />
                : documentUrl && !documentLoading && <iframe src={documentUrl} title={`Verification document submitted by ${documentPreview.providerName}`} className="h-[70vh] w-full rounded-lg bg-white" />}
            </div>
            <div className="flex justify-end border-t border-outline-variant p-3 sm:p-4"><button type="button" onClick={() => setDocumentPreview(null)} className="min-h-11 rounded-lg border border-outline px-4 py-2 font-bold text-on-surface hover:bg-surface-container-high">Close preview</button></div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
