import { Todo } from '../types';
import { getDeadlineSummary, normalizeDate } from './deadline';

const NOTIFIED_KEY = 'notified_todos';
const scheduledTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();

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

// Schedule exact-time reminders for todos that have both a deadline and a due_time.
// Clears any previously scheduled timers before re-scheduling.
export function scheduleTimeReminders(todos: Todo[]) {
    if (typeof window === 'undefined') return;

    // Clear all existing scheduled timers
    scheduledTimers.forEach(timer => clearTimeout(timer));
    scheduledTimers.clear();

    const now = new Date();

    todos.forEach(todo => {
        if (!todo.deadline || !todo.due_time || todo.completed || todo.archived) return;

        const [hours, minutes] = todo.due_time.split(':').map(Number);
        const dueDate = new Date(normalizeDate(todo.deadline) + 'T00:00:00');
        dueDate.setHours(hours, minutes, 0, 0);

        const msUntilDue = dueDate.getTime() - now.getTime();

        // Only schedule if it's in the future and within the next 48 hours
        if (msUntilDue > 0 && msUntilDue < 48 * 60 * 60 * 1000) {
            const timer = setTimeout(() => {
                sendBrowserNotification(
                    `⏰ Reminder: ${todo.text}`,
                    todo.deadline ? `Due today at ${todo.due_time}` : `Due now`
                );
                scheduledTimers.delete(todo.id);
            }, msUntilDue);
            scheduledTimers.set(todo.id, timer);
        }
    });
}
