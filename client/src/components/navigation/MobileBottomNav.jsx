import { NavLink } from "react-router-dom";
import MaterialIcon from "../ui/MaterialIcon";
import { MOBILE_NAV_ITEMS } from "../../constants/navigation";

export default function MobileBottomNav({ activeItem }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant px-6 py-3 flex justify-between items-center z-50">
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive = activeItem === item.id;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={`flex flex-col items-center gap-1 ${
              isActive ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            <MaterialIcon name={item.icon} filled={isActive} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
