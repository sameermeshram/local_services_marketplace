import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout, { MobileBottomNav, TopAppBar } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import StarRating from "../components/ui/StarRating";
import ReviewCard from "../components/provider/ReviewCard";
import BookingWidget from "../components/provider/BookingWidget";
import ConfirmBookingModal from "../components/booking/ConfirmBookingModal";
import { useAuthUser } from "../components/navigation/AuthUserContext";
import { providerService, reviewService } from "../services/api";

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" aria-hidden="true">
      <div className="h-52 rounded-3xl bg-surface-container-high" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6"><div className="h-40 rounded-2xl bg-surface-container-high" /><div className="h-64 rounded-2xl bg-surface-container-high" /></div>
        <div className="h-56 rounded-2xl bg-surface-container-high" />
      </div>
    </div>
  );
}

function initialsFor(name) {
  return (name || "Provider").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatReviewDate(createdAt) {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export default function ProviderProfilePage() {
  const { id } = useParams();
  const authUser = useAuthUser();
  const canBook = authUser?.role === "customer";
  const [bookingOpen, setBookingOpen] = useState(false);
  const [provider, setProvider] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileRetry, setProfileRetry] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewsRetry, setReviewsRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    setProfileError("");
    setProvider(null);
    providerService.getById(id)
      .then((response) => {
        if (active) setProvider(response.data?.provider ?? null);
      })
      .catch((requestError) => {
        if (active) {
          setProfileError(requestError.response?.status === 404
            ? "This provider profile isn’t available."
            : "We couldn’t load this provider profile. Check your connection and try again.");
        }
      })
      .finally(() => { if (active) setProfileLoading(false); });

    return () => { active = false; };
  }, [id, profileRetry]);

  useEffect(() => {
    let active = true;
    setReviewsLoading(true);
    setReviewsError("");
    reviewService.getForProvider(id)
      .then((response) => {
        if (!active) return;
        setReviews((response.data?.reviews ?? []).map((review) => {
          const author = review.customer?.name || "Customer";
          return {
            ...review,
            author,
            initials: initialsFor(author),
            date: formatReviewDate(review.createdAt),
            quote: review.comment || "",
            color: "primary",
          };
        }));
      })
      .catch(() => {
        if (active) {
          setReviews([]);
          setReviewsError("Reviews couldn’t be loaded.");
        }
      })
      .finally(() => { if (active) setReviewsLoading(false); });

    return () => { active = false; };
  }, [id, reviewsRetry]);

  const content = profileLoading ? (
    <ProfileSkeleton />
  ) : profileError || !provider ? (
    <div className="mx-auto flex min-h-[45vh] max-w-2xl items-center justify-center">
      <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center" role="alert">
        <MaterialIcon name="person_search" className="mb-3 text-[40px] text-primary" />
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">{profileError || "Provider profile not found."}</h1>
        {profileError && <button type="button" onClick={() => setProfileRetry((attempt) => attempt + 1)} className="mt-5 min-h-11 rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Try again</button>}
      </div>
    </div>
  ) : (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      <header className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-card">
        <div className="h-2 bg-primary" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-8">
          {provider.image ? (
            <img src={provider.image} alt={provider.imageAlt || `${provider.name} provider profile`} className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-4 ring-primary/10 sm:h-28 sm:w-28" />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-28 sm:w-28" aria-hidden="true"><MaterialIcon name="person" className="text-[48px]" /></div>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {(provider.categories || []).map((item) => <span key={item.id || item._id || item.slug} className="rounded-full bg-primary/10 px-3 py-1 text-label-sm font-semibold text-primary">{item.name}</span>)}
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed/50 px-3 py-1 text-label-sm font-semibold text-primary"><MaterialIcon name="verified" className="text-[14px]" /> Approved provider</span>
            </div>
            <h1 className="break-words font-headline-lg text-headline-lg font-bold text-on-surface">{provider.name}</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">{provider.trade || "Local service provider"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              {provider.rating != null && Number(provider.reviewCount) > 0 ? <StarRating rating={provider.rating} reviewCount={provider.reviewCount} size="18px" /> : <span className="text-body-sm text-on-surface-variant">No reviews yet</span>}
              <span className={`inline-flex items-center gap-2 text-body-sm font-semibold ${provider.available ? "text-primary" : "text-on-surface-variant"}`}><span className={`h-2.5 w-2.5 rounded-full ${provider.available ? "bg-primary" : "bg-outline"}`} />{provider.available ? "Accepting booking requests" : "Not accepting requests right now"}</span>
            </div>
          </div>
        </div>
        {(provider.serviceAreas || []).length > 0 && (
          <div className="border-t border-outline-variant bg-surface-container-low px-5 py-4 sm:px-8">
            <div className="flex items-start gap-3"><MaterialIcon name="location_on" className="mt-0.5 shrink-0 text-[20px] text-primary" /><div><h2 className="text-label-md font-bold text-on-surface">Service areas</h2><ul className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-body-sm text-on-surface-variant">{provider.serviceAreas.map((area, index) => <li key={`${area.city}-${area.pincode}-${index}`}>{[area.city, area.pincode].filter(Boolean).join(" ")}{index < provider.serviceAreas.length - 1 ? "," : ""}</li>)}</ul></div></div>
          </div>
        )}
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
        <div className="min-w-0 space-y-6 sm:space-y-8">
          {Number(provider.completedJobs) > 0 && (
            <section className="flex items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-fixed/50 text-primary"><MaterialIcon name="task_alt" className="text-[26px]" /></span>
              <div><p className="font-headline-sm text-headline-sm font-bold text-on-surface">{provider.completedJobs}</p><p className="text-body-sm text-on-surface-variant">Completed bookings</p></div>
            </section>
          )}

          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-7">
            <h2 className="mb-3 border-l-4 border-primary pl-4 font-headline-sm text-headline-sm font-bold text-on-surface">About {provider.name?.split(" ")[0] || "this provider"}</h2>
            {provider.bio ? provider.bio.split(/\n\s*\n/).map((paragraph, index) => <p key={index} className="mt-3 whitespace-pre-line text-body-md leading-relaxed text-on-surface-variant">{paragraph}</p>) : <p className="text-body-sm text-on-surface-variant">This provider hasn’t added an introduction yet.</p>}
          </section>

          <section aria-labelledby="profile-services-title" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-7">
            <div className="mb-5 flex items-end justify-between gap-4"><div><p className="mb-1 text-label-sm font-bold uppercase tracking-wider text-primary">Services</p><h2 id="profile-services-title" className="font-headline-sm text-headline-sm font-bold text-on-surface">Services offered</h2></div><span className="text-body-sm text-on-surface-variant">{provider.services?.length || 0}</span></div>
            {provider.services?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {provider.services.map((service, index) => {
                  const serviceName = typeof service === "string" ? service : service.name;
                  if (!serviceName) return null;
                  const servicePrice = typeof service === "string" ? null : Number(service.price);
                  return <article key={service._id || `${serviceName}-${index}`} className="rounded-xl border border-outline-variant bg-surface-container-low p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-title-md text-title-md font-semibold text-on-surface">{serviceName}</h3>{Number.isFinite(servicePrice) && servicePrice > 0 && <span className="shrink-0 text-label-lg font-bold text-primary">₹{servicePrice.toLocaleString("en-IN")}</span>}</div>{typeof service !== "string" && service.description && <p className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">{service.description}</p>}</article>;
                })}
              </div>
            ) : <p className="rounded-xl bg-surface-container-low p-4 text-body-sm text-on-surface-variant">No individual services have been listed. You can still request the provider’s main service.</p>}
          </section>

          <section aria-labelledby="profile-reviews-title" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-label-sm font-bold uppercase tracking-wider text-primary">Customer feedback</p><h2 id="profile-reviews-title" className="font-headline-sm text-headline-sm font-bold text-on-surface">Reviews <span className="text-body-sm font-normal text-on-surface-variant">({provider.reviewCount ?? reviews.length})</span></h2></div></div>
            {reviewsLoading ? <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-body-sm text-on-surface-variant" role="status">Loading reviews…</div> : reviewsError ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5" role="alert"><p className="text-body-sm text-on-surface-variant">{reviewsError}</p><button type="button" onClick={() => setReviewsRetry((attempt) => attempt + 1)} className="min-h-11 rounded-lg px-4 font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Try again</button></div> : reviews.length ? <div className="space-y-4">{reviews.map((review) => <ReviewCard key={review._id} review={review} />)}</div> : <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-7 text-center"><MaterialIcon name="rate_review" className="mb-2 text-[30px] text-primary" /><h3 className="font-title-md text-title-md font-semibold text-on-surface">No reviews yet</h3><p className="mt-1 text-body-sm text-on-surface-variant">Reviews from completed bookings will appear here.</p></div>}
          </section>
        </div>

        <aside className="hidden lg:block">
          <BookingWidget provider={provider} canBook={canBook} onBook={() => setBookingOpen(true)} />
        </aside>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 lg:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-on-surface">{provider.available ? "Request this service" : "Currently unavailable"}</p><p className="mt-1 text-body-sm text-on-surface-variant">The provider must accept the request before it is confirmed.</p></div>{canBook && <button type="button" onClick={() => setBookingOpen(true)} disabled={!provider.available} className="min-h-12 w-full shrink-0 rounded-xl bg-secondary px-5 py-3 font-semibold text-white hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">Request service</button>}</div>
      </div>
    </div>
  );

  return (
    <AppLayout activeItem="home" mainClassName="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:ml-[250px] lg:px-8 lg:pb-8 lg:pt-8" mobileNav={<MobileBottomNav activeItem="home" />} topBar={<TopAppBar />}>
      {content}
      {provider && <ConfirmBookingModal key={`${provider.id || provider._id}-${bookingOpen}`} open={bookingOpen} onClose={() => setBookingOpen(false)} provider={provider} />}
    </AppLayout>
  );
}
