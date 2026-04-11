import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Todo, Priority, Recurrence } from '../types';

const API_URL = 'https://todo-app-production-e4e4.up.railway.app';

export function useTodos() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [archivedTodos, setArchivedTodos] = useState<Todo[]>([]);

    const authHeaders = (token: string) => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    });

    const fetchTodos = useCallback(async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/todos`, {
                headers: authHeaders(token),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setTodos(data);
            return data as Todo[];
        } catch (e) {
            console.error('fetchTodos error:', e);
            Alert.alert('Error', 'Failed to load todos');
            return [];
        }
    }, []);

    const fetchArchived = useCallback(async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/todos?archived=true`, {
                headers: authHeaders(token),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setArchivedTodos(data);
            return data as Todo[];
        } catch (e) {
            console.error('fetchArchived error:', e);
            return [];
        }
    }, []);

    const addTodo = useCallback(async (
        token: string,
        text: string,
        deadline: string | null,
        priority: Priority = 'none',
        category: string | null = null,
        recurrence: Recurrence = null,
        due_time: string | null = null,
    ) => {
        const res = await fetch(`${API_URL}/api/todos`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ text, deadline, priority, category, recurrence, due_time }),
        });
        const newTodo: Todo = await res.json();
        setTodos(prev => [...prev, newTodo]);
        return newTodo;
    }, []);

    const editTodo = useCallback(async (
        token: string,
        id: number,
        text: string,
        completed: boolean,
        deadline: string | null,
        priority?: Priority,
        category?: string | null,
        recurrence?: Recurrence,
        due_time?: string | null,
    ) => {
        const res = await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ text, completed, deadline, priority, category, recurrence, due_time }),
        });
        const updated: Todo = await res.json();
        setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
        return updated;
    }, []);

    const toggleTodo = useCallback(async (token: string, id: number, completed: boolean) => {
        const res = await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ completed: !completed }),
        });
        const updated: Todo = await res.json();
        // If completed and recurrence, backend created a new todo — refetch
        if (!completed && updated.recurrence) {
            const refetch = await fetch(`${API_URL}/api/todos`, { headers: authHeaders(token) });
            const all = await refetch.json();
            setTodos(all);
            return updated;
        }
        setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
        return updated;
    }, []);

    const deleteTodo = useCallback(async (token: string, id: number) => {
        await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        setTodos(prev => prev.filter(t => t.id !== id));
        setArchivedTodos(prev => prev.filter(t => t.id !== id));
    }, []);

    const archiveTodo = useCallback(async (token: string, id: number) => {
        const res = await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ archived: true }),
        });
        const updated: Todo = await res.json();
        setTodos(prev => prev.filter(t => t.id !== id));
        setArchivedTodos(prev => [...prev, updated]);
        return updated;
    }, []);

    const unarchiveTodo = useCallback(async (token: string, id: number) => {
        const res = await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ archived: false }),
        });
        const updated: Todo = await res.json();
        setArchivedTodos(prev => prev.filter(t => t.id !== id));
        setTodos(prev => [...prev, updated]);
        return updated;
    }, []);

    const reorderTodos = useCallback(async (token: string, reorderedTodos: Todo[]) => {
        const order = reorderedTodos.map((t, i) => ({ id: t.id, sort_order: i }));
        setTodos(reorderedTodos); // optimistic update
        await fetch(`${API_URL}/api/todos/reorder`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ order }),
        });
    }, []);

    const clearTodos = useCallback(() => {
        setTodos([]);
        setArchivedTodos([]);
    }, []);

    return {
        todos, setTodos,
        archivedTodos,
        fetchTodos, fetchArchived,
        addTodo, editTodo, toggleTodo, deleteTodo,
        archiveTodo, unarchiveTodo,
        reorderTodos,
        clearTodos,
    };
}
