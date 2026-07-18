import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";

export default function ProviderDashboardPage() {
  const [available, setAvailable] = useState(true);

  return (
    <AppLayout
      activeItem="home"
      role="provider"
      notificationDot
      mainClassName="ml-[280px] min-h-screen"
      topBar={
        <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-margin-desktop h-16 ml-[280px] max-w-[calc(100%-280px)]">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
              Provider Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-surface-container rounded-full p-1 border border-outline-variant">
              <button
                type="button"
                onClick={() => setAvailable(true)}
                className={`px-4 py-1.5 rounded-full text-label-md font-bold transition-all duration-300 ${
                  available
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => setAvailable(false)}
                className={`px-4 py-1.5 rounded-full text-label-md font-bold transition-all duration-300 ${
                  !available
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                Offline
              </button>
            </div>
            <MaterialIcon
              name="notifications"
              className="text-on-surface-variant cursor-pointer hover:text-primary transition-colors"
            />
          </div>
        </header>
      }
    >
      {/* Stitch export contained sidebar + header only for provider dashboard */}
    </AppLayout>
  );
}
