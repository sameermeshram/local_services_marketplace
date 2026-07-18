import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout, { TopAppBar, MobileBottomNav } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import FilterPills from "../components/ui/FilterPills";
import BookingCard from "../components/booking/BookingCard";
import { bookings, bookingsAvatar } from "../data/mockData";

const TAB_OPTIONS = [
  { id: "all", label: "All Bookings" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
];

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <AppLayout
      activeItem="bookings"
      mainClassName="ml-[280px] min-h-screen"
      mobileNav={<MobileBottomNav activeItem="bookings" />}
      topBar={
        <TopAppBar
          title="My Bookings"
          showSearch
          searchPlaceholder="Search bookings..."
          avatarSrc={bookingsAvatar}
        />
      }
    >
      <div className="p-margin-desktop max-w-6xl mx-auto pb-24 md:pb-0">
        <FilterPills
          variant="tabs"
          options={TAB_OPTIONS}
          active={activeTab}
          onChange={setActiveTab}
        />

        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>

        <div className="hidden flex-col items-center justify-center py-20 text-center">
          <div className="w-48 h-48 mb-6 opacity-20">
            <MaterialIcon name="calendar_today" className="text-[120px] text-on-surface-variant" />
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No bookings found</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8">
            You haven&apos;t scheduled any services yet. Ready to fix something?
          </p>
          <Link
            to="/"
            className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            Browse Services
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
