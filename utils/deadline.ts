import { Todo, NotificationSummary } from '../types';

export function normalizeDate(deadline: string): string {
    return deadline.split('T')[0];
}

export function getDeadlineStatus(deadline: string | null): 'overdue' | 'today' | 'soon' | 'future' | null {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(normalizeDate(deadline) + 'T00:00:00');
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 3) return 'soon';
    return 'future';
}

export function formatDeadline(deadline: string): string {
    const due = new Date(normalizeDate(deadline) + 'T00:00:00');
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getDeadlineSummary(todos: Todo[]): NotificationSummary {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const active = todos.filter(t => !t.completed && t.deadline);
    return {
        overdue: active.filter(t => new Date(normalizeDate(t.deadline!) + 'T00:00:00') < now),
        today: active.filter(t => new Date(normalizeDate(t.deadline!) + 'T00:00:00').getTime() === now.getTime()),
        tomorrow: active.filter(t => new Date(normalizeDate(t.deadline!) + 'T00:00:00').getTime() === tomorrow.getTime()),
    };
}
