import { NavLink } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import {
  ADMIN_MOBILE_NAV_ITEMS,
  CUSTOMER_MOBILE_NAV_ITEMS,
  PROVIDER_MOBILE_NAV_ITEMS,
} from "../../constants/navigation";
import { useAuthUser } from "./AuthUserContext";

export default function MobileBottomNav({ activeItem, role, notificationDot = false }) {
  const authUser = useAuthUser();
  const activeRole = role || authUser?.role || "customer";
  const navigationItems =
    activeRole === "admin"
      ? ADMIN_MOBILE_NAV_ITEMS
      : activeRole === "provider"
        ? PROVIDER_MOBILE_NAV_ITEMS
        : CUSTOMER_MOBILE_NAV_ITEMS;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-between border-t border-border-subtle bg-surface-container-lowest px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_12px_rgba(21,29,28,0.06)] lg:hidden"
    >
      {navigationItems.map((item) => {
        const isActive = activeItem === item.id;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            aria-label={notificationDot && item.id === "notifications" ? `${item.label}, unread notifications` : item.label}
            className={`relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <MaterialIcon name={item.icon} filled={isActive} className="text-[22px]" />
            <span className="max-w-full truncate text-[10px] font-semibold leading-4">{item.label}</span>
            {notificationDot && item.id === "notifications" && (
              <span aria-hidden="true" className="absolute right-1/4 top-1 h-2 w-2 rounded-full bg-secondary" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
