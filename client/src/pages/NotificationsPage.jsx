import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout, { TopAppBar, MobileBottomNav } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import { notificationService } from "../services/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await notificationService.getAll();
      setNotifications(response.data?.notifications ?? []);
      setUnreadCount(response.data?.unreadCount ?? 0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markRead = async (notification) => {
    if (notification.readAt || busyIds.has(notification._id)) return;
    setBusyIds((current) => new Set(current).add(notification._id));
    try {
      const response = await notificationService.markRead(notification._id);
      const readAt = response.data?.notification?.readAt || new Date().toISOString();
      setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, readAt } : item));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to mark notification as read.");
      throw requestError;
    } finally {
      setBusyIds((current) => { const next = new Set(current); next.delete(notification._id); return next; });
    }
  };

  const markAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    setError("");
    try {
      await notificationService.markAllRead();
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || readAt })));
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <AppLayout activeItem="notifications" mainClassName="min-w-0 lg:ml-[250px]" mobileNav={<MobileBottomNav activeItem="notifications" />} topBar={<TopAppBar title="Notifications" />}>
      <section className="mx-auto max-w-4xl space-y-6 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Notifications</h1>
            <p className="mt-2 text-body-md text-on-surface-variant">Updates about your marketplace activity.</p>
            <p className="mt-2 text-label-md font-semibold text-primary" role="status" aria-live="polite">
              {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
            </p>
          </div>
          <button type="button" onClick={markAllRead} disabled={unreadCount === 0 || markingAll} className="min-h-11 rounded-lg px-3 font-bold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50">
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        </div>

        {loading && <div className="space-y-3" role="status" aria-label="Loading notifications">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low" />)}</div>}
        {error && <div className="rounded-xl border border-error/20 bg-error/5 p-4" role="alert"><p className="text-error">{error}</p><button type="button" onClick={loadNotifications} disabled={loading} className="mt-3 min-h-11 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">Try again</button></div>}
        {!loading && !error && notifications.length === 0 && <div className="rounded-xl border border-dashed border-outline-variant py-16 text-center"><MaterialIcon name="notifications_none" className="mb-3 text-5xl text-primary" /><h2 className="font-headline-sm text-headline-sm">No notifications</h2><p className="mt-2 text-body-md text-on-surface-variant">New booking updates will appear here.</p></div>}

        {!loading && !error && <ol className="space-y-3" aria-label="Your notifications">
          {notifications.map((notification) => {
            const bookingId = notification.booking?._id;
            const linked = Boolean(bookingId);
            const content = <>
              <MaterialIcon name={notification.readAt ? "notifications_none" : "notifications_active"} className="mt-1 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <h2 className="font-bold text-on-surface">{notification.title}</h2>
                  <time className="text-label-md text-on-surface-variant" dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time>
                </div>
                <p className="mt-1 break-words text-body-md text-on-surface-variant">{notification.message}</p>
                {linked && <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">View booking <MaterialIcon name="arrow_forward" className="text-base" /></span>}
                {!linked && !notification.readAt && <button type="button" disabled={busyIds.has(notification._id)} onClick={() => markRead(notification).catch(() => {})} className="mt-3 min-h-11 rounded-lg px-2 text-sm font-semibold text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">{busyIds.has(notification._id) ? "Marking read…" : "Mark as read"}</button>}
              </div>
              {!notification.readAt && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
            </>;
            return <li key={notification._id} className={`rounded-xl border p-4 transition-colors sm:p-5 ${notification.readAt ? "border-outline-variant bg-surface-container-lowest" : "border-primary/30 bg-primary/5"}`}>
              {linked ? <Link to={`/bookings?booking=${encodeURIComponent(bookingId)}`} onClick={() => markRead(notification).catch(() => {})} aria-label={`${notification.readAt ? "" : "Unread: "}${notification.title}. View booking`} className="flex min-w-0 items-start gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{content}</Link> : <div className="flex min-w-0 items-start gap-4">{content}</div>}
            </li>;
          })}
        </ol>}
      </section>
    </AppLayout>
  );
}
