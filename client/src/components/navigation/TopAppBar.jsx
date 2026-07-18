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
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-margin-desktop h-16 ml-[280px] max-w-[calc(100%-280px)]">
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
                  ? "pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-body-md focus:outline-none focus:border-primary w-64"
                  : "w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              }
            />
          </div>
        )}
        {children}
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-70"
        >
          <MaterialIcon name="notifications" />
        </button>
        <button
          type="button"
          className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-70"
        >
          <MaterialIcon name="help" />
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
