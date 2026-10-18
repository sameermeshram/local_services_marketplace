import { useCallback, useEffect, useRef, useState } from "react";
import AppLayout, { MobileBottomNav, TopAppBar } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import FilterPills from "../components/ui/FilterPills";
import ProviderCard from "../components/provider/ProviderCard";
import ConfirmBookingModal from "../components/booking/ConfirmBookingModal";
import { mapBackgroundImage } from "../data/mockData";
import { categoryService, providerService } from "../services/api";

const FILTER_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "top-rated", label: "Top Rated" },
  { id: "nearby", label: "Available Now" },
];

const CATEGORY_ICONS = {
  electrician: "electrical_services",
  plumbing: "plumbing",
  plumber: "plumbing",
  cleaning: "cleaning_services",
  carpenter: "carpenter",
  carpentry: "carpenter",
  painting: "format_paint",
  painter: "format_paint",
  appliance: "kitchen",
  "appliance-repair": "kitchen",
  hvac: "ac_unit",
  handyman: "handyman",
};

function getCategoryIcon(category) {
  return category.icon || CATEGORY_ICONS[String(category.slug || "").toLowerCase()] || "handyman";
}

function ProviderSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading providers">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-outline-variant bg-surface-container-lowest p-5" aria-hidden="true">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-surface-container-high" />
            <div className="flex-1 space-y-2"><div className="h-4 w-2/3 rounded bg-surface-container-high" /><div className="h-3 w-1/2 rounded bg-surface-container-high" /><div className="h-3 w-1/3 rounded bg-surface-container-high" /></div>
          </div>
          <div className="mt-6 h-16 rounded-xl bg-surface-container-low" />
          <div className="mt-6 flex justify-between"><div className="h-10 w-24 rounded bg-surface-container-high" /><div className="h-11 w-28 rounded-lg bg-surface-container-high" /></div>
        </div>
      ))}
    </div>
  );
}

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
  const [categoriesError, setCategoriesError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const requestId = useRef(0);

  const loadProviders = useCallback(async (
    filterId = activeFilter,
    selectedCategory = category,
    selectedPincode = pincode,
  ) => {
    const normalizedPincode = selectedPincode.trim();
    if (normalizedPincode && !/^\d{5,6}$/.test(normalizedPincode)) {
      setSearchError("Enter a valid 5 or 6 digit pincode.");
      return;
    }
    setSearchError("");
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    setProviders([]);
    try {
      const response = await providerService.getAll({
        pincode: normalizedPincode || undefined,
        category: selectedCategory || undefined,
        available: filterId === "nearby" ? true : undefined,
        sort: filterId === "top-rated" ? "rating" : undefined,
      });
      if (currentRequest === requestId.current) {
        setProviders(response.data?.providers ?? []);
      }
    } catch {
      if (currentRequest === requestId.current) {
        setProviders([]);
        setError("We couldn’t load providers. Check your connection and try again.");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [activeFilter, category, pincode]);

  useEffect(() => {
    loadProviders("recommended", "", "");
  }, []); // Initial discovery request only; subsequent requests follow explicit customer actions.

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(false);
    try {
      const response = await categoryService.getAll();
      setCategories(response.data?.categories ?? []);
    } catch {
      setCategories([]);
      setCategoriesError(true);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    loadProviders(filterId);
  };

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    loadProviders(activeFilter, nextCategory);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    loadProviders(activeFilter);
  };

  const clearFilters = () => {
    setPincode("");
    setCategory("");
    setActiveFilter("recommended");
    loadProviders("recommended", "", "");
  };

  const invalidPincode = pincode.length > 0 && !/^\d{5,6}$/.test(pincode);

  const handleBook = (provider) => {
    setSelectedProvider(provider);
    setBookingOpen(true);
  };

  return (
    <AppLayout activeItem="home" role="customer" mobileNav={<MobileBottomNav activeItem="home" role="customer" />} topBar={<TopAppBar />}>
      <div className="mx-auto max-w-[1400px]">
        <section aria-labelledby="discovery-title" className="relative mb-10 overflow-hidden rounded-3xl bg-primary px-5 py-9 text-on-primary sm:px-9 sm:py-12 lg:mb-12 lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[48px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-40 right-1/4 h-72 w-72 rounded-full bg-white/5" />
          <div className="relative z-10 max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-label-md font-semibold text-primary-fixed">
              <MaterialIcon name="home_repair_service" className="text-[17px]" /> Local services, made simple
            </p>
            <h1 id="discovery-title" className="mb-3 max-w-2xl font-display text-display-mobile font-bold text-white sm:text-display">
              Find trusted professionals for your home
            </h1>
            <p className="mb-7 max-w-xl text-body-md text-white/80 sm:text-body-lg">
              Browse service providers, compare their profiles, and request the help you need.
            </p>

            <form onSubmit={handleSearch} className="grid gap-2 rounded-2xl bg-white p-2 shadow-overlay md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
              <label className="flex min-h-14 min-w-0 items-center gap-3 rounded-xl px-3 focus-within:ring-2 focus-within:ring-primary">
                <MaterialIcon name="location_on" className="shrink-0 text-[22px] text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-label-sm text-on-surface-variant">Pincode</span>
                  <input type="text" inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="[0-9]{5,6}" value={pincode} onChange={(event) => { setPincode(event.target.value.replace(/\D/g, "")); setSearchError(""); }} placeholder="Enter your pincode" aria-label="Search by pincode" aria-invalid={invalidPincode || Boolean(searchError)} aria-describedby={invalidPincode || searchError ? "pincode-error" : undefined} className="w-full min-w-0 border-0 bg-transparent p-0 text-body-sm font-semibold text-on-surface placeholder:text-outline focus:ring-0" />
                </span>
              </label>
              <label className="flex min-h-14 min-w-0 items-center gap-3 rounded-xl border-t border-outline-variant px-3 md:border-l md:border-t-0">
                <MaterialIcon name="category" className="shrink-0 text-[22px] text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-label-sm text-on-surface-variant">Service category</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Choose service category" className="w-full min-w-0 cursor-pointer border-0 bg-transparent p-0 text-body-sm font-semibold text-on-surface focus:ring-0">
                    <option value="">All categories</option>
                    {categories.map((item) => <option key={item.id || item._id || item.slug} value={item.slug}>{item.name}</option>)}
                  </select>
                </span>
              </label>
              <button type="submit" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 font-label-lg text-white shadow-sm transition-colors hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2">
                <MaterialIcon name="search" className="text-[19px]" /> Find Experts
              </button>
            </form>
            {(searchError || invalidPincode) && <p id="pincode-error" className="mt-2 text-sm font-semibold text-white" role="alert">{searchError || "Enter a valid 5 or 6 digit pincode."}</p>}
          </div>
        </section>

        <section aria-labelledby="service-categories-title" className="mb-10 lg:mb-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-label-sm font-bold uppercase tracking-[0.14em] text-primary">Browse services</p>
              <h2 id="service-categories-title" className="font-headline-md text-headline-md font-bold text-on-surface">What can we help with?</h2>
            </div>
            {categoriesLoading && <span className="text-body-sm text-on-surface-variant" role="status">Loading categories…</span>}
          </div>
          {categoriesError ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
              <p className="text-body-sm text-on-surface-variant">Service categories couldn’t be loaded.</p>
              <button type="button" onClick={loadCategories} className="min-h-11 rounded-lg px-4 font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Retry categories</button>
            </div>
          ) : categoriesLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface-container-high" />)}
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-5 py-7 text-body-sm text-on-surface-variant">No service categories are available right now. You can still browse all providers below.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {categories.map((item) => {
                const selected = category === item.slug;
                return (
                  <button key={item.id || item._id || item.slug} type="button" onClick={() => handleCategoryChange(selected ? "" : item.slug)} aria-pressed={selected} className={`group flex min-h-28 min-w-0 flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:min-h-32 sm:p-5 ${selected ? "border-primary bg-primary text-white shadow-card" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"}`}>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-white/15 text-white" : "bg-primary-fixed/50 text-primary"}`}><MaterialIcon name={getCategoryIcon(item)} className="text-[23px]" /></span>
                    <span className="mt-3 line-clamp-2 text-body-sm font-semibold sm:text-label-lg">{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="providers-title">
          <div className="mb-5 flex flex-col gap-4">
            <div>
              <p className="mb-1 text-label-sm font-bold uppercase tracking-[0.14em] text-primary">Explore local services</p>
              <h2 id="providers-title" className="font-headline-md text-headline-md font-bold text-on-surface">Service providers</h2>
              {!loading && !error && <p className="mt-1 text-body-sm text-on-surface-variant">{providers.length} {providers.length === 1 ? "provider" : "providers"} in these results</p>}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="overflow-x-auto pb-1"><FilterPills options={FILTER_OPTIONS} active={activeFilter} onChange={handleFilterChange} /></div>
              <div className="flex w-fit shrink-0 items-center gap-1 rounded-full bg-surface-container-high p-1" aria-label="Provider results view">
                <button type="button" onClick={() => setViewMode("grid")} aria-pressed={viewMode === "grid"} className={`flex min-h-10 items-center gap-2 rounded-full px-4 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"}`}><MaterialIcon name="grid_view" className="text-[18px]" /> Grid</button>
                <button type="button" onClick={() => setViewMode("map")} aria-pressed={viewMode === "map"} className={`flex min-h-10 items-center gap-2 rounded-full px-4 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${viewMode === "map" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"}`}><MaterialIcon name="map" className="text-[18px]" /> Map preview</button>
              </div>
            </div>
          </div>

          {viewMode === "map" ? (
            <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low sm:min-h-[400px]">
              <div className="absolute inset-0 opacity-40" aria-hidden="true" style={{ backgroundImage: `url('${mapBackgroundImage}')`, backgroundPosition: "center", backgroundSize: "cover" }} />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-surface-container-low/80" />
              <div className="relative flex min-h-[320px] items-center justify-center p-5 sm:min-h-[400px]">
                <div className="max-w-sm rounded-2xl border border-outline-variant bg-white/95 p-6 text-center shadow-overlay backdrop-blur-sm">
                  <MaterialIcon name="map" className="mb-3 text-[38px] text-primary" />
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Static map preview</h3>
                  <p className="mt-2 text-body-sm text-on-surface-variant">Provider locations aren’t shown on this map. Browse the provider list for service areas and availability.</p>
                  <button type="button" onClick={() => setViewMode("grid")} className="mt-5 min-h-11 rounded-lg bg-primary px-5 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">View providers</button>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div role="status" aria-live="polite"><span className="sr-only">Loading providers</span><ProviderSkeleton /></div>
          ) : error ? (
            <div className="rounded-2xl border border-error/30 bg-surface-container-lowest px-6 py-10 text-center" role="alert">
              <MaterialIcon name="error_outline" className="mb-3 text-[32px] text-error" />
              <p className="font-semibold text-on-surface">{error}</p>
              <button type="button" onClick={() => loadProviders(activeFilter)} className="mt-4 min-h-11 rounded-lg border border-error px-5 py-2 font-semibold text-error hover:bg-error hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2">Try again</button>
            </div>
          ) : providers.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-6 py-10 text-center sm:py-12">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed/50 text-primary"><MaterialIcon name="search_off" className="text-[28px]" /></span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">No providers match these filters</h3>
              <p className="mx-auto mt-2 max-w-lg text-body-sm text-on-surface-variant">Try another category or pincode, or clear filters to see all available provider profiles.</p>
              <button type="button" onClick={clearFilters} className="mt-5 min-h-11 rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {providers.map((provider) => <ProviderCard key={provider.id} provider={provider} onBook={handleBook} />)}
            </div>
          )}
        </section>
      </div>

      <ConfirmBookingModal key={`${selectedProvider?.id || ""}-${bookingOpen}`} open={bookingOpen} provider={selectedProvider || undefined} onClose={() => setBookingOpen(false)} />
    </AppLayout>
  );
}
