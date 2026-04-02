'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types/gathering';
import { User, LogOut, Bell, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  gatheringId: string | null;
  createdAt: string;
  gathering?: { id: string; title: string } | null;
}

const roleEmailMap: Record<Role, string> = {
  manager: 'sarah.chen@airbnb.com',
  employee: 'alex.r@airbnb.com',
  admin: 'jordan.lee@airbnb.com',
};

export function Navbar() {
  const { user, logout } = useAuth();
  const role = (user?.defaultRole ?? 'employee') as Role;
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setShowHelp(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (newRole: Role) => {
    const email = roleEmailMap[newRole];
    await signIn('credentials', { email, redirect: false });
    router.refresh();
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // Silently fail
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-light-gray bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-rausch tracking-tight">Gatherings</span>
        </Link>

        <div className="flex items-center gap-4">
          <Tooltip content="Switch roles for demo purposes" position="bottom">
            <div className="flex items-center gap-2 text-sm text-foggy">
              <span>View as:</span>
              <select
                value={role}
                onChange={(e) => handleRoleSwitch(e.target.value as Role)}
                className="bg-bg-gray border border-light-gray rounded-md px-2 py-1 text-kazan focus:outline-none focus:ring-2 focus:ring-kazan"
                aria-label="Role selector"
              >
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </Tooltip>

          {/* Help */}
          <div className="relative" ref={helpRef}>
            <Tooltip content="Help & tips" position="bottom">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="relative p-2 text-foggy hover:text-kazan rounded-full hover:bg-bg-gray transition-colors"
                aria-label="Help"
              >
                <HelpCircle size={20} />
              </button>
            </Tooltip>
            {showHelp && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-card shadow-modal border border-light-gray p-5 z-50">
                <h4 className="font-bold text-kazan mb-3">Quick Tips</h4>
                <ul className="space-y-3 text-sm text-hof">
                  <li className="flex gap-2">
                    <span className="text-rausch font-bold">1.</span>
                    Create a gathering from the Dashboard to start planning.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-rausch font-bold">2.</span>
                    Use the Gathering Hub to manage agenda, accommodation, swag, and invitations.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-rausch font-bold">3.</span>
                    AI will suggest agenda templates, restaurants, and activities based on your inputs.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-rausch font-bold">4.</span>
                    Switch roles above to preview how employees and admins see the app.
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-foggy hover:text-kazan rounded-full hover:bg-bg-gray transition-colors"
              aria-label={`Notifications${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ''}`}
            >
              <Bell size={20} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rausch text-white text-[10px] font-bold">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-card shadow-modal border border-light-gray z-50 overflow-hidden">
                <div className="p-4 border-b border-light-gray flex justify-between items-center">
                  <h4 className="font-bold text-kazan">Notifications</h4>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-xs font-medium text-rausch hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-foggy text-sm">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => {
                          handleMarkNotificationRead(n.id);
                          if (n.gatheringId) router.push(`/gathering/${n.gatheringId}`);
                          setShowNotifications(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-light-gray last:border-0 hover:bg-bg-gray transition-colors",
                          !n.read && "bg-rausch/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {!n.read && <div className="w-2 h-2 rounded-full bg-rausch mt-1.5 shrink-0" />}
                          <div className={cn(!n.read ? "" : "ml-5")}>
                            <p className="text-sm text-kazan font-medium leading-tight">{n.message}</p>
                            <p className="text-xs text-foggy mt-1">
                              {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-light-gray">
            <Tooltip content={user?.name ?? 'User'} position="bottom">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-light-gray bg-white text-foggy hover:shadow-elevated transition-shadow cursor-pointer">
                <User size={20} />
              </div>
            </Tooltip>
            <button onClick={handleLogout} className="text-foggy hover:text-kazan transition-colors" aria-label="Sign out">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
