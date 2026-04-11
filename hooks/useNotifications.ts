import { useState, useCallback, useEffect } from 'react';
import { Todo, NotificationSummary, UserInfo } from '../types';
import { getDeadlineSummary } from '../utils/deadline';
import { requestNotificationPermission, fireDeadlineNotifications, scheduleTimeReminders } from '../utils/notifications';

export function useNotifications(userInfo: UserInfo | null, todos: Todo[]) {
    const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
    const [banner, setBanner] = useState<NotificationSummary | null>(null);

    const runNotifications = useCallback((todoList: Todo[]) => {
        const summary = getDeadlineSummary(todoList);
        const hasAlerts = summary.overdue.length > 0 || summary.today.length > 0 || summary.tomorrow.length > 0;
        setBanner(hasAlerts ? summary : null);
        fireDeadlineNotifications(todoList);
        scheduleTimeReminders(todoList);
    }, []);

    // Request permission when user logs in
    useEffect(() => {
        if (!userInfo) return;
        if (typeof window === 'undefined' || !('Notification' in window)) {
            setPermission('unsupported');
            return;
        }
        setPermission(Notification.permission as any);
        if (Notification.permission === 'default') {
            requestNotificationPermission().then(granted => {
                setPermission(granted ? 'granted' : 'denied');
            });
        }
    }, [userInfo]);

    // Re-check every hour
    useEffect(() => {
        if (!userInfo || todos.length === 0) return;
        const interval = setInterval(() => runNotifications(todos), 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userInfo, todos, runNotifications]);

    return { permission, banner, setBanner, runNotifications };
}
