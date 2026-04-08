export interface Todo {
    id: number;
    text: string;
    completed: boolean;
    deadline: string | null;
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
