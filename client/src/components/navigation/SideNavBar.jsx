import { NavLink, useNavigate } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import { ADMIN_NAV_ITEMS, NAV_ITEMS } from "../../constants/navigation";
import { authService } from "../../services/authService";

export default function SideNavBar({
  activeItem,
  role = "customer",
  notificationDot = false,
}) {
  const navigate = useNavigate();
  const switchLabel =
    role === "provider" || role === "admin"
      ? "Switch to Customer"
      : "Switch to Provider";
  const switchPath =
    role === "provider" || role === "admin" ? "/" : "/provider/dashboard";
  const navigationItems = role === "admin" ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant shadow-sm flex-col py-8 z-50">
      <div className="px-6 mb-10">
        <h1 className="text-headline-md font-headline-md font-bold tracking-tight text-primary">
          FixIt Local
        </h1>
        <p className="font-label-md text-label-md text-on-surface-variant">
          Local Service Marketplace
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {navigationItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              aria-label={item.label}
              className={`relative flex min-h-12 items-center gap-3 px-6 py-3 transition-colors duration-200 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                isActive
                  ? "bg-primary-container/10 text-primary border-l-4 border-primary font-bold"
                  : "border-l-4 border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              }`}
            >
              <MaterialIcon
                name={item.icon}
                filled={isActive}
                className="text-[22px]"
              />
              <span className="font-label-md text-label-md">{item.label}</span>
              {item.id === "notifications" && notificationDot && (
                <span
                  className="absolute right-6 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-secondary"
                  aria-label="Unread notifications"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-6 mt-auto pt-8 border-t border-outline-variant space-y-4">
        {role === "provider" || role === "admin" ? (
          <button
            type="button"
            onClick={() => navigate(switchPath)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <MaterialIcon name="swap_horiz" style={{ fontSize: "20px" }} />
            {switchLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(switchPath)}
            className="min-h-11 w-full rounded-lg border border-primary/20 bg-primary/5 py-3 font-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {switchLabel}
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 px-0 py-2 text-on-surface-variant transition-colors duration-200 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
        <MaterialIcon name="logout" className="text-[22px]" />
          <span className="font-label-md text-label-md">Logout</span>
        </button>
      </div>
    </aside>
  );
}
