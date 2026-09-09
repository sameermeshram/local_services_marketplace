import { useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout, { TopAppBar } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import StatsCard from "../components/provider/StatsCard";
import ReviewCard from "../components/provider/ReviewCard";
import BookingWidget from "../components/provider/BookingWidget";
import BookingConfirmedModal from "../components/booking/BookingConfirmedModal";
import {
  featuredProvider,
  providers,
  reviews,
  profileClientAvatar,
} from "../data/mockData";

export default function ProviderProfilePage() {
  const { id } = useParams();
  const [confirmedOpen, setConfirmedOpen] = useState(false);
  const provider = (() => {
    if (id === featuredProvider.id) return featuredProvider;

    const cardProvider = providers.find((item) => item.id === id);
    if (!cardProvider) return featuredProvider;

    return {
      ...cardProvider,
      trade: cardProvider.trade.toUpperCase(),
      location: "Local service area",
      hourlyRate: cardProvider.price,
      serviceFee: 15,
      availableToday: cardProvider.available,
      yearsExperience: "5+",
      jobsCompleted: "100+",
      responseMinutes: "~60",
      skills: [cardProvider.trade, "Verified Service", "Local Expertise"],
      coverImage: cardProvider.image,
      avatar: cardProvider.image,
      avatarAlt: cardProvider.imageAlt,
    };
  })();

  return (
    <AppLayout
      activeItem="search"
      mainClassName="md:ml-[280px] pt-8 px-margin-desktop pb-32"
      topBar={
        <TopAppBar
          showSearch
          searchPlaceholder="Search services..."
          avatarSrc={profileClientAvatar}
          userName="Alex Johnson"
          userSubtitle="Verified Client"
        />
      }
    >
      <section className="relative rounded-3xl overflow-hidden mb-10 shadow-lg group">
        <div className="h-64 md:h-80 w-full relative">
          <img
            src={provider.coverImage}
            alt="Professional residential contractor working in a modern kitchen"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex gap-6 items-center">
            <div className="relative">
              <img
                src={provider.avatar}
                alt={provider.avatarAlt}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-surface shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-secondary-container text-on-secondary-container p-1 rounded-lg shadow-md flex items-center">
                <MaterialIcon name="verified" filled className="text-[18px]" />
              </div>
            </div>
            <div className="text-white">
              <span className="bg-primary text-on-primary-container px-3 py-1 rounded-full text-label-md font-bold tracking-wider mb-2 inline-block">
                {provider.trade}
              </span>
              <h2 className="font-display text-headline-lg leading-tight">
                {provider.name}
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-secondary-fixed">
                  <MaterialIcon name="star" filled className="text-[20px]" />
                  <span className="font-bold text-body-lg">
                    {provider.rating}
                  </span>
                  <span className="text-white/70 text-body-sm">
                    ({provider.reviewCount} reviews)
                  </span>
                </div>
                <span className="w-1 h-1 bg-white/50 rounded-full" />
                <div className="flex items-center gap-1 text-white/90">
                  <MaterialIcon name="location_on" className="text-[18px]" />
                  <span className="text-body-sm">{provider.location}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="bg-surface/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-surface/30 transition-all active:scale-95"
            >
              <MaterialIcon name="share" />
              Share
            </button>
            <button
              type="button"
              className="bg-secondary text-on-secondary px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary-fixed-dim transition-all shadow-lg shadow-secondary/20 active:scale-95"
            >
              <MaterialIcon name="favorite" />
              Save
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              icon="history"
              badge="TOP RATED"
              value={`${provider.yearsExperience}`}
              label="Years Experience"
              color="primary"
            />
            <StatsCard
              icon="check_circle"
              badge="CERTIFIED"
              value={provider.jobsCompleted}
              label="Jobs Completed"
              color="secondary"
            />
            <StatsCard
              icon="timer"
              badge="FAST"
              value={provider.responseMinutes}
              label="Min Response Time"
              color="tertiary"
            />
          </div>

          <article className="space-y-4">
            <h3 className="font-headline-sm text-on-surface border-l-4 border-primary pl-4">
              About {provider.name.split(" ")[0]}
            </h3>
            {provider.bio.split("\n\n").map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="text-body-lg text-on-surface-variant leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
            <div className="flex flex-wrap gap-2 pt-4">
              {provider.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-4 py-2 bg-surface-container-high rounded-full text-body-sm font-medium text-on-surface"
                >
                  {skill}
                </span>
              ))}
            </div>
          </article>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-on-surface">
                Verified Reviews
              </h3>
              <button
                type="button"
                className="text-primary font-bold text-label-md flex items-center gap-1 hover:underline"
              >
                See all reviews
                <MaterialIcon name="chevron_right" />
              </button>
            </div>
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 hidden lg:block">
          <BookingWidget
            provider={provider}
            onBook={() => setConfirmedOpen(true)}
          />
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant px-6 py-4 flex items-center justify-between z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-headline-sm font-black">
            ${provider.hourlyRate}/hr
          </span>
          <span className="text-label-md text-primary font-bold">
            Top Rated Provider
          </span>
        </div>
        <button
          type="button"
          onClick={() => setConfirmedOpen(true)}
          className="bg-secondary text-on-secondary px-8 py-3 rounded-xl font-bold shadow-lg"
        >
          Book Now
        </button>
      </div>

      <BookingConfirmedModal
        open={confirmedOpen}
        onClose={() => setConfirmedOpen(false)}
        providerName={provider.name}
      />
    </AppLayout>
  );
}
