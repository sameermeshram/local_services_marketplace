import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout, { TopAppBar } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import FilterPills from "../components/ui/FilterPills";
import ProviderCard from "../components/provider/ProviderCard";
import ConfirmBookingModal from "../components/booking/ConfirmBookingModal";
import { providers, customerAvatar, mapBackgroundImage } from "../data/mockData";

const FILTER_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "top-rated", label: "Top Rated" },
  { id: "nearby", label: "Nearby" },
];

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("recommended");
  const [viewMode, setViewMode] = useState("grid");
  const [bookingOpen, setBookingOpen] = useState(false);

  const handleBook = (provider) => {
    if (provider.id === "david-miller" || provider) {
      navigate(`/providers/marcus-chen`);
    }
  };

  return (
    <AppLayout
      activeItem="home"
      topBar={
        <TopAppBar showSearch searchPlaceholder="Search for help..." avatarSrc={customerAvatar} />
      }
    >
      <section className="relative mb-12 rounded-2xl overflow-hidden min-h-[320px] flex flex-col justify-center px-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Find reliable experts near you
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            Verified professionals for your home maintenance and repair needs.
          </p>
          <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white">
            <div className="flex-1 relative">
              <MaterialIcon
                name="location_on"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
              />
              <input
                type="text"
                defaultValue="110001"
                placeholder="Enter Pincode"
                className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 font-bold text-on-surface"
              />
            </div>
            <div className="w-px bg-outline-variant hidden md:block my-2" />
            <div className="flex-1 relative">
              <MaterialIcon
                name="category"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
              />
              <select className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 appearance-none font-bold text-on-surface cursor-pointer">
                <option>All Categories</option>
                <option>Plumber</option>
                <option>Electrician</option>
                <option>Carpenter</option>
                <option>Painter</option>
                <option>Cleaner</option>
              </select>
            </div>
            <button
              type="button"
              className="bg-secondary text-white px-10 py-4 rounded-lg font-bold hover:bg-on-secondary-container transition-all shadow-md active:scale-95"
            >
              Find Experts
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center mb-8">
        <FilterPills
          options={FILTER_OPTIONS}
          active={activeFilter}
          onChange={setActiveFilter}
        />
        <div className="flex items-center gap-3 bg-surface-container-high p-1 rounded-full">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition-all ${
              viewMode === "grid"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <MaterialIcon name="grid_view" className="text-[18px]" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold transition-all ${
              viewMode === "map"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <MaterialIcon name="map" className="text-[18px]" />
            Map
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onBook={() => {
                setBookingOpen(true);
                handleBook(provider);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="h-[600px] w-full rounded-2xl border border-outline-variant relative overflow-hidden">
          <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
            <div className="absolute inset-0 opacity-40">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url('${mapBackgroundImage}')` }}
                role="img"
                aria-label="Interactive map showing service providers in a suburban neighborhood"
              />
            </div>
            <div className="relative z-10 text-center p-8 glass-card rounded-2xl shadow-xl max-w-sm">
              <MaterialIcon name="map" className="text-primary text-[48px] mb-4" />
              <h3 className="text-headline-sm font-bold mb-2">Interactive Map Active</h3>
              <p className="text-on-surface-variant mb-6">
                Find providers literally next door. 14 experts found in your immediate area.
              </p>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className="bg-primary text-white px-6 py-2 rounded-lg font-bold"
              >
                Back to Grid
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </AppLayout>
  );
}
