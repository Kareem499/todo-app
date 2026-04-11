export type Priority = 'high' | 'medium' | 'low' | 'none';
export type Recurrence = 'daily' | 'weekly' | 'monthly' | null;

export interface Todo {
    id: number;
    user_id: string;
    text: string;
    completed: boolean;
    deadline: string | null;
    calendar_event_id: string | null;
    priority: Priority;
    category: string | null;
    sort_order: number;
    recurrence: Recurrence;
    due_time: string | null;
    archived: boolean;
    created_at: string;
}

export interface UserInfo {
    id: string;
    name: string;
    email: string;
    picture?: string;
}

export interface NotificationSummary {
    overdue: Todo[];
    today: Todo[];
    tomorrow: Todo[];
}
