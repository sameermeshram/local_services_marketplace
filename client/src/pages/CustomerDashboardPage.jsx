import { useEffect, useState } from "react";
import AppLayout, { TopAppBar } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import FilterPills from "../components/ui/FilterPills";
import ProviderCard from "../components/provider/ProviderCard";
import ConfirmBookingModal from "../components/booking/ConfirmBookingModal";
import { mapBackgroundImage } from "../data/mockData";
import { categoryService, providerService } from "../services/api";

const FILTER_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "top-rated", label: "Top Rated" },
  { id: "nearby", label: "Nearby" },
];

export default function CustomerDashboardPage() {
  const [activeFilter, setActiveFilter] = useState("recommended");
  const [viewMode, setViewMode] = useState("grid");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);
  const [pincode, setPincode] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProviders = async (
    filterId = activeFilter,
    selectedCategory = category,
    selectedPincode = pincode,
  ) => {
    setLoading(true);
    setError("");
    try {
      const queryParams = {
        pincode: selectedPincode.trim() || undefined,
        category: selectedCategory || undefined,
        available: filterId === "nearby" ? true : undefined,
        sort: filterId === "top-rated" ? "rating" : undefined,
      };
      const response = await providerService.getAll(queryParams);
      setProviders(response.data?.providers ?? []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to load providers.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders(activeFilter);
  }, []);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const response = await categoryService.getAll();
        if (active) setCategories(response.data?.categories ?? []);
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setCategoriesLoading(false);
      }
    };

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const handleFilterPillChange = (filterId) => {
    setActiveFilter(filterId);
    loadProviders(filterId);
  };

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    loadProviders(activeFilter, nextCategory);
  };

  const handleBook = (provider) => {
    setSelectedProvider(provider);
    setBookingOpen(true);
  };

  const handleSearch = () => {
    loadProviders(activeFilter);
  };

  return (
    <AppLayout
      activeItem="home"
      topBar={
        <TopAppBar
          showSearch
          searchPlaceholder="Search for help..."
        />
      }
    >
      <section className="relative mb-10 flex min-h-[320px] flex-col justify-center overflow-hidden rounded-2xl bg-surface-container-low px-6 py-10 sm:px-10 lg:mb-12 lg:px-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <p className="mb-3 font-label-md font-bold uppercase tracking-[0.16em] text-primary">
            Local help, made simple
          </p>
          <h2 className="mb-3 font-headline-lg text-headline-lg text-on-surface">
            Find reliable experts near you
          </h2>
          <p className="mb-8 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
            Verified professionals for your home maintenance and repair needs.
          </p>
          <div className="flex flex-col gap-2 rounded-2xl border border-white bg-white/90 p-2 shadow-lg backdrop-blur-md md:flex-row md:items-center">
            <label className="relative flex min-h-12 flex-1 items-center">
              <MaterialIcon
                name="location_on"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
              />
              <input
                type="text"
                value={pincode}
                onChange={(event) => setPincode(event.target.value)}
                placeholder="Enter Pincode"
                aria-label="Search by pincode"
                className="w-full border-none bg-transparent py-3 pl-12 pr-4 font-bold text-on-surface outline-none focus:ring-0"
              />
            </label>
            <div className="hidden h-8 w-px bg-outline-variant md:block" />
            <label className="relative flex min-h-12 flex-1 items-center">
              <MaterialIcon
                name="category"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
              />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filter by service category"
                className="w-full cursor-pointer appearance-none border-none bg-transparent py-3 pl-12 pr-10 font-bold text-on-surface outline-none focus:ring-0"
              >
                <option value="">All Categories</option>
                {categories.map((item) => (
                  <option key={item._id || item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleSearch}
              className="min-h-12 rounded-xl bg-secondary px-8 py-3 font-bold text-white shadow-md transition-all hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 active:scale-95"
            >
              Find Experts
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="service-categories-title" className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-label-md font-bold uppercase tracking-[0.14em] text-primary">
              Browse services
            </p>
            <h2 id="service-categories-title" className="mt-1 text-headline-md font-bold text-on-surface">
              What can we help with?
            </h2>
          </div>
          {categoriesLoading && (
            <span className="text-label-md text-on-surface-variant">Loading categories...</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((item) => (
            <button
              key={item._id || item.slug}
              type="button"
              onClick={() => handleCategoryChange(item.slug)}
              className={`flex min-h-24 flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                category === item.slug
                  ? "border-primary bg-primary text-on-primary shadow-md"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <MaterialIcon
                name={item.icon || "handyman"}
                className="text-[24px]"
              />
              <span className="font-label-lg font-bold">{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <FilterPills
          options={FILTER_OPTIONS}
          active={activeFilter}
          onChange={handleFilterPillChange}
        />
        <div className="flex w-fit items-center gap-1 rounded-full bg-surface-container-high p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
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
            aria-pressed={viewMode === "map"}
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
        <>
          {loading && (
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-6 py-14 text-center" role="status">
              <MaterialIcon name="progress_activity" className="mb-3 animate-spin text-[32px] text-primary" />
              <p className="font-label-lg font-bold text-on-surface">Finding local experts...</p>
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-error/30 bg-error/5 px-6 py-10 text-center" role="alert">
              <MaterialIcon name="error_outline" className="mb-3 text-[32px] text-error" />
              <p className="font-label-lg font-bold text-error">{error}</p>
              <button
                type="button"
                onClick={() => loadProviders(activeFilter)}
                className="mt-4 min-h-11 rounded-lg border border-error px-5 py-2 font-bold text-error transition-colors hover:bg-error hover:text-on-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !error && providers.length === 0 && (
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
              <MaterialIcon name="search_off" className="mb-3 text-[32px] text-primary" />
              <h3 className="font-headline-sm font-bold text-on-surface">No experts found yet</h3>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Try a different category or pincode to find approved local providers.
              </p>
            </div>
          )}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 ${loading || error ? "hidden" : ""}`}
          >
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onBook={handleBook}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="h-[600px] w-full rounded-2xl border border-outline-variant relative overflow-hidden">
          <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
            <div className="absolute inset-0 opacity-40">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url('${mapBackgroundImage}')` }}
                role="img"
                aria-label="Static map preview for service providers in a suburban neighborhood"
              />
            </div>
            <div className="relative z-10 text-center p-8 glass-card rounded-2xl shadow-xl max-w-sm">
              <MaterialIcon
                name="map"
                className="text-primary text-[48px] mb-4"
              />
              <h3 className="text-headline-sm font-bold mb-2">
                Map Preview
              </h3>
              <p className="text-on-surface-variant mb-6">
                {providers.length
                  ? `${providers.length} approved expert${providers.length === 1 ? "" : "s"} found for this search.`
                  : "Switch back to the grid to refine your search."}
              </p>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className="min-h-11 rounded-lg bg-primary px-6 py-2 font-bold text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Back to Grid
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmBookingModal
        key={`${selectedProvider?.id || ""}-${bookingOpen}`}
        open={bookingOpen}
        provider={selectedProvider || undefined}
        onClose={() => setBookingOpen(false)}
      />
    </AppLayout>
  );
}
