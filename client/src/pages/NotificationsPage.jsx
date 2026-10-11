import { useEffect, useState } from "react";
import AppLayout, { TopAppBar, MobileBottomNav } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import { notificationService } from "../services/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async (force = false) => {
    if (loading && !force) return;
    setLoading(true);
    setError("");
    try {
      const response = await notificationService.getAll();
      setNotifications(response.data?.notifications ?? []);
      setUnreadCount(response.data?.unreadCount ?? 0);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(true);
  }, []);

  const markRead = async (notification) => {
    if (notification.readAt) return;
    try {
      await notificationService.markRead(notification._id);
      setUnreadCount((current) => Math.max(0, current - 1));
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to mark notification as read.",
      );
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: new Date().toISOString(),
        })),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to mark notifications as read.",
      );
    }
  };

  return (
    <AppLayout
      activeItem="notifications"
      mainClassName="md:ml-[280px] min-h-screen"
      mobileNav={<MobileBottomNav />}
      topBar={<TopAppBar title="Notifications" />}
    >
      <section className="p-margin-desktop max-w-4xl mx-auto space-y-6 pb-24 md:pb-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              Notifications
            </h1>
            <p className="text-body-md text-on-surface-variant mt-2">
              Updates about your marketplace activity.
            </p>
            {unreadCount > 0 && (
              <p className="mt-2 text-label-md font-semibold text-primary" role="status">
                {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={markAllRead}
            className="text-primary font-bold text-body-sm"
          >
            Mark all read
          </button>
        </div>

        {loading && (
          <p className="py-12 text-center text-on-surface-variant">
            Loading notifications...
          </p>
        )}
        {error && (
          <div className="py-4" role="alert">
            <p className="text-error">{error}</p>
            <button
              type="button"
              onClick={() => loadNotifications()}
              disabled={loading}
              className="mt-3 min-h-11 rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Retrying..." : "Try again"}
            </button>
          </div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div className="py-16 text-center border border-dashed border-outline-variant rounded-xl">
            <MaterialIcon
              name="notifications_none"
              className="text-primary text-5xl mb-3"
            />
            <h2 className="font-headline-sm text-headline-sm">
              No notifications
            </h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              New booking updates will appear here.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification._id}
              type="button"
              onClick={() => markRead(notification)}
              className={`w-full text-left p-5 rounded-xl border transition-colors ${notification.readAt ? "bg-surface-container-lowest border-outline-variant" : "bg-primary/5 border-primary/30"}`}
            >
              <div className="flex items-start gap-4">
                <MaterialIcon
                  name={
                    notification.readAt
                      ? "notifications_none"
                      : "notifications_active"
                  }
                  className="text-primary"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-bold text-on-surface">
                      {notification.title}
                    </h2>
                    <span className="text-label-md text-on-surface-variant">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface-variant mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
