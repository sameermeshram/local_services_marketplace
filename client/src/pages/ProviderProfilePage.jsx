import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout, { TopAppBar } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import StatsCard from "../components/provider/StatsCard";
import ReviewCard from "../components/provider/ReviewCard";
import BookingWidget from "../components/provider/BookingWidget";
import ConfirmBookingModal from "../components/booking/ConfirmBookingModal";
import { providerService, reviewService } from "../services/api";

export default function ProviderProfilePage() {
  const { id } = useParams();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [provider, setProvider] = useState(null);
  const [profileReviews, setProfileReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;

    Promise.all([providerService.getById(id), reviewService.getForProvider(id)])
      .then(([providerResponse, reviewsResponse]) => {
        if (!active) return;
        const profile = providerResponse.data?.provider;
        const apiReviews = reviewsResponse.data?.reviews ?? [];
        setProfileReviews(
          apiReviews.map((review) => {
            const author = review.customer?.name || "Customer";
            return {
              ...review,
              author,
              initials: author
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
              date: new Date(review.createdAt).toLocaleDateString(),
              quote: review.comment,
              color: "primary",
            };
          }),
        );
        setProvider({
          ...profile,
          trade: profile.trade,
          location: profile.serviceAreas?.[0]
            ? `${profile.serviceAreas[0].city}, ${profile.serviceAreas[0].pincode}`
            : "",
          availableToday: profile.available,
        });
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message || "Provider not found.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface" role="status">
        <MaterialIcon name="progress_activity" className="animate-spin text-[32px] text-primary" />
        <span className="sr-only">Loading provider profile</span>
      </div>
    );
  }
  if (error || !provider) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6 text-center">
        <div role="alert">
          <MaterialIcon name="error_outline" className="mb-3 text-[36px] text-error" />
          <p className="font-semibold text-error">{error || "Provider not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      activeItem="search"
      mainClassName="md:ml-[280px] pt-8 px-margin-desktop pb-32"
      topBar={
        <TopAppBar
          showSearch
          searchPlaceholder="Search services..."
        />
      }
    >
      <section className="mb-10 rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {provider.image ? (
            <img
              src={provider.image}
              alt={provider.imageAlt || `${provider.name} provider profile`}
              className="h-28 w-28 rounded-2xl object-cover ring-4 ring-primary/10"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MaterialIcon name="person" className="text-[48px]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-label-md font-bold uppercase tracking-wider text-primary">
              {provider.trade}
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">{provider.name}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-on-surface-variant">
              {provider.rating != null && (
                <span className="flex items-center gap-1 font-bold text-on-surface">
                  <MaterialIcon name="star" filled className="text-[20px] text-secondary" />
                  {provider.rating}
                  {provider.reviewCount != null && (
                    <span className="font-normal text-on-surface-variant">({provider.reviewCount} reviews)</span>
                  )}
                </span>
              )}
              {provider.location && (
                <span className="flex items-center gap-1">
                  <MaterialIcon name="location_on" className="text-[18px] text-primary" />
                  {provider.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-10">
          {(provider.completedJobs != null || provider.yearsExperience != null) && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {provider.yearsExperience != null && (
                <StatsCard
                  icon="history"
                  badge="EXPERIENCE"
                  value={provider.yearsExperience}
                  label="Years Experience"
                  color="primary"
                />
              )}
              {provider.completedJobs != null && (
                <StatsCard
                  icon="check_circle"
                  badge="COMPLETED"
                  value={provider.completedJobs}
                  label="Jobs Completed"
                  color="secondary"
                />
              )}
            </div>
          )}

          <article className="space-y-4">
            <h3 className="border-l-4 border-primary pl-4 font-headline-sm text-on-surface">
              About {provider.name?.split(" ")[0] || "this provider"}
            </h3>
            {(provider.bio || "This provider has not added an introduction yet.")
              .split("\n\n")
              .map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="text-body-lg text-on-surface-variant leading-relaxed"
              >
                {paragraph}
              </p>
              ))}
            {provider.services?.length > 0 && (
              <div className="grid gap-3 pt-4 sm:grid-cols-2">
                {provider.services.map((service, index) => {
                  const serviceName = typeof service === "string" ? service : service.name;
                  if (!serviceName) return null;
                  return (
                    <div
                      key={service._id || `${serviceName}-${index}`}
                      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-on-surface">{serviceName}</h4>
                        {typeof service !== "string" && service.price != null && (
                          <span className="shrink-0 text-sm font-bold text-primary">
                            ₹{Number(service.price).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      {typeof service !== "string" && service.description && (
                        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                          {service.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <section className="space-y-6">
            <h3 className="font-headline-sm text-on-surface">Reviews</h3>
            <div className="space-y-4">
              {profileReviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
              {profileReviews.length === 0 && (
                <p className="text-body-md text-on-surface-variant">
                  No reviews yet.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 hidden lg:block">
          <BookingWidget provider={provider} onBook={() => setBookingOpen(true)} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-between gap-4 border-t border-outline-variant bg-surface px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex flex-col">
          {(provider.hourlyRate ?? provider.price) != null && (
            <span className="text-headline-sm font-black">
              ₹{Number(provider.hourlyRate ?? provider.price).toLocaleString("en-IN")}
            </span>
          )}
          <span className="text-label-md font-bold text-primary">
            {provider.availableToday ? "Accepting requests" : "Currently unavailable"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setBookingOpen(true)}
          disabled={!provider.availableToday}
          className="min-h-11 rounded-xl bg-secondary px-5 py-3 font-bold text-on-secondary shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Request service
        </button>
      </div>

      <ConfirmBookingModal
        key={`${provider.id || provider._id}-${bookingOpen}`}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        provider={provider}
      />
    </AppLayout>
  );
}
