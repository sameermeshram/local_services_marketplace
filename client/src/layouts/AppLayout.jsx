import { cloneElement, useEffect, useState } from "react";
import SideNavBar from "../components/navigation/SideNavBar";
import TopAppBar from "../components/navigation/TopAppBar";
import MobileBottomNav from "../components/navigation/MobileBottomNav";
import { useAuthUser } from "../components/navigation/AuthUserContext";
import { notificationService } from "../services/api";

export default function AppLayout({
  activeItem,
  role,
  notificationDot = false,
  topBar,
  mobileNav,
  children,
  className = "",
  mainClassName = "min-w-0 bg-surface px-4 py-6 sm:px-6 lg:ml-[250px] lg:px-8",
}) {
  const authUser = useAuthUser();
  const activeRole = role || authUser?.role || "customer";
  const mobileContentSpacing = mobileNav ? "pb-24 lg:pb-8" : "";
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    let active = true;

    if (activeRole === "admin" || activeItem === "notifications") {
      setHasUnreadNotifications(false);
      return () => {
        active = false;
      };
    }

    notificationService
      .getAll({ unread: true })
      .then((response) => {
        if (active) setHasUnreadNotifications((response.data?.unreadCount ?? 0) > 0);
      })
      .catch(() => {
        if (active) setHasUnreadNotifications(false);
      });

    return () => {
      active = false;
    };
  }, [activeItem, activeRole]);

  const mobileNavigation = mobileNav
    ? cloneElement(mobileNav, { notificationDot: hasUnreadNotifications })
    : null;

  return (
    <div className={`bg-surface font-body-md text-on-surface min-h-screen ${className}`}>
      <SideNavBar
        activeItem={activeItem}
        role={activeRole}
        accountRole={authUser?.role}
        notificationDot={notificationDot || hasUnreadNotifications}
      />
      {topBar}
      <main className={`${mainClassName} ${mobileContentSpacing}`.trim()}>
        {children}
      </main>
      {mobileNavigation}
    </div>
  );
}

export { TopAppBar, MobileBottomNav };
