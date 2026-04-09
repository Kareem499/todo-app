import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Todo } from '../types';

const API_URL = 'https://todo-app-production-e4e4.up.railway.app';

export function useTodos() {
    const [todos, setTodos] = useState<Todo[]>([]);

    // token is passed explicitly so callers always use the freshest value
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

    const addTodo = useCallback(async (token: string, text: string, deadline: string | null) => {
        const res = await fetch(`${API_URL}/api/todos`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ text, deadline }),
        });
        const newTodo: Todo = await res.json();
        setTodos(prev => [...prev, newTodo]);
        return newTodo;
    }, []);

    const editTodo = useCallback(async (token: string, id: number, text: string, completed: boolean, deadline: string | null) => {
        const res = await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ text, completed, deadline }),
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
        setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
        return updated;
    }, []);

    const deleteTodo = useCallback(async (token: string, id: number) => {
        await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        setTodos(prev => prev.filter(t => t.id !== id));
    }, []);

    const clearTodos = useCallback(() => setTodos([]), []);

    return { todos, setTodos, fetchTodos, addTodo, editTodo, toggleTodo, deleteTodo, clearTodos };
}
