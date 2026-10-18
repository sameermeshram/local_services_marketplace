import { NavLink, useNavigate } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import {
  ADMIN_NAV_ITEMS,
  CUSTOMER_NAV_ITEMS,
  PROVIDER_NAV_ITEMS,
} from "../../constants/navigation";
import { authService } from "../../services/authService";

export default function SideNavBar({
  activeItem,
  role = "customer",
  accountRole = role,
  notificationDot = false,
}) {
  const navigate = useNavigate();
  const navigationItems =
    role === "admin"
      ? ADMIN_NAV_ITEMS
      : role === "provider"
        ? PROVIDER_NAV_ITEMS
        : CUSTOMER_NAV_ITEMS;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[250px] flex-col border-r border-border-subtle bg-surface-container-lowest lg:flex">
      <div className="flex h-[68px] items-center border-b border-border-subtle px-6">
        <div className="flex flex-col">
          <span className="font-title-md text-title-md font-bold leading-tight text-on-surface">
            FixIt Local
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Local Services
          </span>
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigationItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              aria-label={notificationDot && item.id === "notifications" ? `${item.label}, unread notifications` : item.label}
              className={`relative flex min-h-11 items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                isActive
                  ? "border-primary bg-surface-container-low text-primary font-semibold"
                  : "border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <MaterialIcon
                name={item.icon}
                filled={isActive}
                className="text-[20px]"
              />
              <span className="font-label-lg text-label-lg">{item.label}</span>
              {item.id === "notifications" && notificationDot && (
                <span
                  className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-secondary"
                  aria-hidden="true"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-border-subtle p-3">
        {(role === "provider" || role === "admin") && (
          <button
            type="button"
            onClick={() => navigate("/")}
            className="app-button-outline w-full justify-between text-label-md"
          >
            <span className="inline-flex items-center gap-2">
              <MaterialIcon name="swap_horiz" className="text-[18px]" />
              Switch to Customer
            </span>
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </button>
        )}
        {role === "customer" && accountRole === "provider" && (
          <button
            type="button"
            onClick={() => navigate("/provider/dashboard")}
            className="app-button-outline w-full justify-between text-label-md"
          >
            <span className="inline-flex items-center gap-2">
              <MaterialIcon name="swap_horiz" className="text-[18px]" />
              Switch to Provider
            </span>
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-on-surface-variant transition-colors hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <MaterialIcon name="logout" className="text-[20px]" />
          <span className="font-label-lg text-label-lg">Log out</span>
        </button>
      </div>
    </aside>
  );
}
