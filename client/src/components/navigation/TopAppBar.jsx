import MaterialIcon from "../ui/MaterialIcon";
import { useNavigate } from "react-router-dom";

export default function TopAppBar({
  title,
  avatarSrc,
  avatarAlt,
  userName,
  userSubtitle,
  children,
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 flex h-[68px] w-full items-center justify-between gap-3 border-b border-border-subtle bg-surface-container-lowest/95 px-4 backdrop-blur-md lg:ml-[250px] lg:w-[calc(100%_-_250px)] lg:px-6 xl:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {title && (
          <h2 className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
        )}
        {!title && (
          <span className="font-title-md text-title-md font-bold text-on-surface lg:hidden">
            FixIt Local
          </span>
        )}
        {children}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:opacity-70"
        >
          <MaterialIcon name="notifications" className="text-[22px]" />
        </button>
        {userName ? (
          <>
            <div className="h-8 w-[1px] bg-outline-variant hidden sm:block" />
            <div className="group flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-body-sm leading-none group-hover:text-primary transition-colors">
                  {userName}
                </p>
                {userSubtitle && (
                  <p className="text-label-md text-on-surface-variant">{userSubtitle}</p>
                )}
              </div>
              {avatarSrc && (
                <img
                  src={avatarSrc}
                  alt={avatarAlt || userName}
                  className="h-9 w-9 rounded-full border border-border-subtle object-cover"
                />
              )}
            </div>
          </>
        ) : (
          avatarSrc && (
            <div className="h-8 w-8 overflow-hidden rounded-full border border-border-subtle">
              <img src={avatarSrc} alt={avatarAlt || "User avatar"} className="w-full h-full object-cover" />
            </div>
          )
        )}
      </div>
    </header>
  );
}
