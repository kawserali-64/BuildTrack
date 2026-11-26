'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useSession } from '@/lib/auth-client';

interface ContractorNotificationResponse {
  unreadCount: number;
}

export function NotificationsMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as { role?: string } | undefined;
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const isContractor = user?.role === 'Contractor';

  const refreshUnreadCount = useCallback(async () => {
    if (!isContractor) return;
    try {
      const response = await apiClient.get<ContractorNotificationResponse>(
        '/contractor/notifications?limit=1',
      );
      setUnreadCount(response.data.unreadCount);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [isContractor]);

  useEffect(() => {
    if (!isContractor) return;
    const initialFetchId = window.setTimeout(() => void refreshUnreadCount(), 0);
    const intervalId = window.setInterval(() => void refreshUnreadCount(), 30000);
    const handleFocus = () => void refreshUnreadCount();
    const handleNotificationsUpdated = () => {
      setUnreadCount((current) => Math.max(0, current - 1));
      void refreshUnreadCount();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('contractor-notifications-updated', handleNotificationsUpdated);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(initialFetchId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('contractor-notifications-updated', handleNotificationsUpdated);
    };
  }, [isContractor, refreshUnreadCount]);

  if (!session) return null;

  const trigger = (
    <button
      type="button"
      aria-label={isContractor ? `Notifications${unreadCount ? `, ${unreadCount} unread` : ''}` : 'Notifications'}
      title={loadError ? 'Unable to load unread notification count' : 'Notifications'}
      onClick={isContractor ? () => router.push('/contractor/notifications') : undefined}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <Bell className="h-5 w-5" />
      {isContractor && unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[9px] font-bold leading-none text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );

  if (isContractor) return trigger;

  const items: DropdownMenuItem[] = [
    {
      id: 'empty',
      label: 'No notifications yet',
      icon: <Bell className="h-4 w-4" />,
      disabled: true,
    },
  ];

  return <DropdownMenu align="right" className="w-64" trigger={trigger} items={items} />;
}
