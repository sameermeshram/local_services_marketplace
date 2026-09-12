import { useEffect, useState } from "react";
import AppLayout, { TopAppBar, MobileBottomNav } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import { notificationService } from "../services/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await notificationService.getAll();
      setNotifications(response.data?.notifications ?? []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (notification) => {
    if (notification.readAt) return;
    try {
      await notificationService.markRead(notification._id);
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
      mobileNav={<MobileBottomNav activeItem="bookings" />}
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
          <p className="py-4 text-error" role="alert">
            {error}
          </p>
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
