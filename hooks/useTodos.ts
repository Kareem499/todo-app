import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Todo } from '../types';

const API_URL = 'http://localhost:3000';

export function useTodos() {
    const [todos, setTodos] = useState<Todo[]>([]);

    const fetchTodos = useCallback(async (userId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/todos/${userId}`);
            const data = await res.json();
            setTodos(data);
            return data as Todo[];
        } catch {
            Alert.alert('Error', 'Failed to load todos');
            return [];
        }
    }, []);

    const addTodo = useCallback(async (userId: string, text: string, deadline: string | null) => {
        const res = await fetch(`${API_URL}/api/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, text, deadline }),
        });
        const newTodo: Todo = await res.json();
        setTodos(prev => [...prev, newTodo]);
        return newTodo;
    }, []);

    const editTodo = useCallback(async (id: number, text: string, completed: boolean, deadline: string | null) => {
        const res = await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, completed, deadline }),
        });
        const updated: Todo = await res.json();
        setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
        return updated;
    }, []);

    const toggleTodo = useCallback(async (id: number, completed: boolean) => {
        const res = await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !completed }),
        });
        const updated: Todo = await res.json();
        setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
        return updated;
    }, []);

    const deleteTodo = useCallback(async (id: number) => {
        await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE' });
        setTodos(prev => prev.filter(t => t.id !== id));
    }, []);

    const clearTodos = useCallback(() => setTodos([]), []);

    return { todos, setTodos, fetchTodos, addTodo, editTodo, toggleTodo, deleteTodo, clearTodos };
}
