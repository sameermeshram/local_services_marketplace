import SideNavBar from "../components/navigation/SideNavBar";
import TopAppBar from "../components/navigation/TopAppBar";
import MobileBottomNav from "../components/navigation/MobileBottomNav";

export default function AppLayout({
  activeItem,
  role = "customer",
  notificationDot = false,
  topBar,
  mobileNav,
  children,
  className = "",
  mainClassName = "md:ml-[280px] p-margin-desktop bg-surface min-h-[calc(100vh-64px)]",
}) {
  return (
    <div className={`bg-surface font-body-md text-on-surface min-h-screen ${className}`}>
      <SideNavBar activeItem={activeItem} role={role} notificationDot={notificationDot} />
      {topBar}
      <main className={mainClassName}>{children}</main>
      {mobileNav}
    </div>
  );
}

export { TopAppBar, MobileBottomNav };
