import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch contact messages for notifications (admin only)
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "sales")) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("printhub_token");
        const res = await fetch("/api/contact-messages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const unread = data.filter((m: any) => m.status === "new");
          setNotifications(unread.slice(0, 5));
          setUnreadCount(unread.length);
        }
      } catch {
        // silently fail
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className="glass-chrome border-b border-[var(--glass-border)] sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        {/* Mobile title */}
        <div className="lg:hidden flex items-center gap-3">
          <img src="/wxy-logo.svg" alt="WXY" className="h-8 w-auto" />
        </div>

        {/* Desktop search */}
        <div className="hidden lg:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search products, quotes, jobs..."
              className="glass-input pl-10 py-2 text-sm h-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Bell / Notifications */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[var(--accent-primary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-card-strong rounded-[var(--radius-lg)] shadow-[var(--glass-shadow-lg)] border border-[var(--glass-border)] z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
                  <h3 className="text-headline font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Link
                      to="/messages"
                      onClick={() => setShowNotifications(false)}
                      className="text-caption text-[var(--accent-primary)] hover:underline"
                    >
                      View all
                    </Link>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                      <p className="text-caption text-[var(--text-tertiary)]">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((msg) => (
                      <Link
                        key={msg.id}
                        to="/messages"
                        onClick={() => setShowNotifications(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(255,90,60,0.04)] transition-colors border-b border-[rgba(60,60,67,0.08)] last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-[rgba(255,90,60,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bell className="w-4 h-4 text-[var(--accent-primary)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-subhead font-medium truncate">{msg.subject || "New message"}</p>
                          <p className="text-caption text-[var(--text-tertiary)] truncate">{msg.name} — {msg.email}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-[rgba(255,90,60,0.06)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center">
                <span className="text-xs font-bold text-white">{userInitials}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)] hidden lg:block" />
            </button>

            {/* Profile dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-card-strong rounded-[var(--radius-lg)] shadow-[var(--glass-shadow-lg)] border border-[var(--glass-border)] z-50 py-1">
                <div className="px-4 py-3 border-b border-[var(--glass-border)]">
                  <p className="text-subhead font-semibold text-[var(--text-primary)]">{user?.fullName || "User"}</p>
                  <p className="text-caption text-[var(--text-tertiary)] capitalize">{user?.role || "staff"}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-subhead text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.04)] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-subhead text-[var(--accent-danger)] hover:bg-[rgba(255,59,48,0.04)] transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
