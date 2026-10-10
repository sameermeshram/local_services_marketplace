import MaterialIcon from "../ui/MaterialIcon";

export default function TopAppBar({
  title,
  searchPlaceholder,
  showSearch = false,
  avatarSrc,
  avatarAlt,
  userName,
  userSubtitle,
  children,
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface/90 px-margin-mobile backdrop-blur-md md:ml-[280px] md:max-w-[calc(100%-280px)] md:px-margin-desktop">
      <div className="flex items-center gap-4 flex-1">
        {title && (
          <h2 className="font-headline-sm text-headline-sm text-primary font-bold">{title}</h2>
        )}
        {showSearch && (
          <div className={`relative ${title ? "hidden lg:block" : "w-full max-w-xl"}`}>
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            />
            <input
              type="text"
              placeholder={searchPlaceholder || "Search..."}
              className={
                title
                  ? "w-64 rounded-full border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  : "w-full rounded-full border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              }
            />
          </div>
        )}
        {children}
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <button
          type="button"
          aria-label="Notifications"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:opacity-70"
        >
          <MaterialIcon name="notifications" className="text-[22px]" />
        </button>
        <button
          type="button"
          aria-label="Help"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:opacity-70"
        >
          <MaterialIcon name="help" className="text-[22px]" />
        </button>
        {userName ? (
          <>
            <div className="h-8 w-[1px] bg-outline-variant hidden sm:block" />
            <div className="flex items-center gap-3 cursor-pointer group">
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
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary-container"
                />
              )}
            </div>
          </>
        ) : (
          avatarSrc && (
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-primary-container">
              <img src={avatarSrc} alt={avatarAlt || "User avatar"} className="w-full h-full object-cover" />
            </div>
          )
        )}
      </div>
    </header>
  );
}
