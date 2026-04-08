import { Todo } from '../types';
import { getDeadlineSummary } from './deadline';

const NOTIFIED_KEY = 'notified_todos';

export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

function sendBrowserNotification(title: string, body: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    new Notification(title, { body, icon: '/favicon.png' });
}

function getNotifiedSet(): Set<string> {
    try {
        const stored = localStorage.getItem(NOTIFIED_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
}

function markNotified(key: string) {
    const set = getNotifiedSet();
    set.add(key);
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
}

export function fireDeadlineNotifications(todos: Todo[]) {
    const { overdue, today, tomorrow } = getDeadlineSummary(todos);
    const todayKey = new Date().toISOString().split('T')[0];
    const notified = getNotifiedSet();

    if (overdue.length > 0) {
        const key = `overdue-${todayKey}`;
        if (!notified.has(key)) {
            sendBrowserNotification(
                `⚠️ ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
                overdue.map(t => t.text).join(' · ')
            );
            markNotified(key);
        }
    }
    if (today.length > 0) {
        const key = `today-${todayKey}`;
        if (!notified.has(key)) {
            sendBrowserNotification(
                `📅 ${today.length} task${today.length > 1 ? 's' : ''} due today`,
                today.map(t => t.text).join(' · ')
            );
            markNotified(key);
        }
    }
    if (tomorrow.length > 0) {
        const key = `tomorrow-${todayKey}`;
        if (!notified.has(key)) {
            sendBrowserNotification(
                `🔔 ${tomorrow.length} task${tomorrow.length > 1 ? 's' : ''} due tomorrow`,
                tomorrow.map(t => t.text).join(' · ')
            );
            markNotified(key);
        }
    }
}
