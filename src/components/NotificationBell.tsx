import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { apiFetch } from '@/services/apiClient';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface AppNotification {
  id: number;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// Exported so pushNotifications.ts can open the bell programmatically
export let openNotificationBell: (() => void) | null = null;

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Register the imperative open handle
  useEffect(() => {
    openNotificationBell = () => setOpen(true);
    return () => { openNotificationBell = null; };
  }, []);

  async function fetchInbox() {
    try {
      // quiet401: background poll — don't force-redirect to login on session expiry.
      // The auth store handles redirecting via its own session validation.
      const res = await apiFetch('/notifications/inbox', undefined, 0, { quiet401: true });
      if (!res.ok) return;
      const data: AppNotification[] = await res.json();
      setNotifications(data);
    } catch {
      // silent — no network shouldn't crash the UI
    }
  }

  // Initial fetch + poll every 60 s for new notifications
  useEffect(() => {
    fetchInbox();
    pollRef.current = setInterval(fetchInbox, 60_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Re-fetch when panel opens (catches failures from the initial mount fetch)
  useEffect(() => {
    if (!open) return;
    fetchInbox();
  }, [open]);

  // Mark all unread as read when panel opens
  useEffect(() => {
    if (!open || unreadCount === 0) return;
    apiFetch('/notifications/inbox/read-all', { method: 'PATCH' })
      .then(() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))))
      .catch(() => {});
  }, [open]);

  function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    apiFetch(`/notifications/inbox/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  function handleClearAll() {
    setNotifications([]);
    apiFetch('/notifications/inbox', { method: 'DELETE' }).catch(() => {});
  }

  function handleNotificationClick(n: AppNotification) {
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-neutral-300/40 dark:hover:bg-neutral-300/20 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 overflow-hidden"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground px-2"
                onClick={() => {
                  apiFetch('/notifications/inbox/read-all', { method: 'PATCH' }).catch(() => {});
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                }}
              >
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground px-2"
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notifications yet
            </p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`relative flex items-start border-b last:border-0 ${
                  !n.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
              >
                <button
                  onClick={() => handleNotificationClick(n)}
                  className="flex-1 text-left px-4 py-3 hover:bg-muted/50 transition-colors pr-8"
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className={!n.isRead ? '' : 'ml-4'}>
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="absolute right-2 top-2 p-1 rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Delete notification"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
