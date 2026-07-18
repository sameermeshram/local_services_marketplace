import { NavLink, useNavigate } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import { NAV_ITEMS } from "../../constants/navigation";

export default function SideNavBar({ activeItem, role = "customer", notificationDot = false }) {
  const navigate = useNavigate();
  const switchLabel = role === "provider" ? "Switch to Customer" : "Switch to Provider";
  const switchPath = role === "provider" ? "/" : "/provider/dashboard";

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant shadow-sm flex flex-col py-8 z-50">
      <div className="px-6 mb-10">
        <h1 className="text-headline-md font-headline-md font-bold text-primary">FixIt Local</h1>
        <p className="font-label-md text-label-md text-on-surface-variant">
          Local Service Marketplace
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={`relative flex items-center gap-3 px-6 py-4 transition-colors duration-200 ${
                isActive
                  ? "bg-primary-container/10 text-primary border-l-4 border-primary font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              }`}
            >
              <MaterialIcon name={item.icon} filled={isActive} />
              <span className="font-label-md text-label-md">{item.label}</span>
              {item.id === "notifications" && notificationDot && (
                <span className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-6 mt-auto pt-8 border-t border-outline-variant space-y-4">
        {role === "provider" ? (
          <button
            type="button"
            onClick={() => navigate(switchPath)}
            className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <MaterialIcon name="swap_horiz" style={{ fontSize: "20px" }} />
            {switchLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(switchPath)}
            className="w-full bg-primary/5 text-primary border border-primary/20 py-3 rounded-lg font-bold hover:bg-primary/10 transition-colors"
          >
            {switchLabel}
          </button>
        )}
        <button
          type="button"
          className="flex items-center gap-3 text-on-surface-variant px-0 py-2 hover:text-error transition-colors duration-200 w-full"
        >
          <MaterialIcon name="logout" />
          <span className="font-label-md text-label-md">Logout</span>
        </button>
      </div>
    </aside>
  );
}
