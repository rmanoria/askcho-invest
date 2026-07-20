"use client";
import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/format";

export default function NotificationBell() {
  const { state, markNotificationsRead, clearNotifications } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = state.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="iv-notif-wrap" ref={ref}>
      <button
        className="iv-icon-btn"
        onClick={() => { setOpen((o) => !o); if (!open) markNotificationsRead(); }}
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && <span className="iv-notif-dot" />}
      </button>
      {open && (
        <div className="iv-notif-panel">
          <div className="iv-notif-head">
            <span>Notifications</span>
            {state.notifications.length > 0 && (
              <button className="iv-link-btn" onClick={clearNotifications}>Clear</button>
            )}
          </div>
          {state.notifications.length === 0 ? (
            <p className="iv-empty-sm">No notifications yet.</p>
          ) : (
            <div className="iv-notif-list">
              {state.notifications.slice(0, 20).map((n) => (
                <div key={n.id} className="iv-notif-item">
                  <div>{n.text}</div>
                  <div className="iv-sub">{formatDateTime(n.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
