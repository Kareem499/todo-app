import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { useColorScheme } from 'react-native';

import { LIGHT, DARK } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useTodos } from '../hooks/useTodos';
import { useNotifications } from '../hooks/useNotifications';

import { SignInScreen } from '../components/SignInScreen';
import { Header } from '../components/Header';
import { ProgressBar } from '../components/ProgressBar';
import { NotificationBanner } from '../components/NotificationBanner';
import { TodoItem } from '../components/TodoItem';
import { InputBar } from '../components/InputBar';

export default function TodoApp() {
    const scheme = useColorScheme();
    const C = scheme === 'dark' ? DARK : LIGHT;

    const { userInfo, jwtToken, loading, request, response, promptAsync, loadStoredAuth, handleAuthCode, handleAuthToken, signOut } = useAuth();
    const { todos, fetchTodos, addTodo, editTodo, toggleTodo, deleteTodo, clearTodos } = useTodos();
    const { permission, banner, setBanner, runNotifications } = useNotifications(userInfo, todos);

    const [text, setText] = useState('');
    const [deadline, setDeadline] = useState('');
    const [editTodoId, setEditTodoId] = useState<number | null>(null);

    // Restore session on mount
    useEffect(() => {
        loadStoredAuth();
    }, []);

    // When jwtToken becomes available (login or restore), load todos
    useEffect(() => {
        if (jwtToken) {
            fetchTodos(jwtToken).then(data => runNotifications(data));
        }
    }, [jwtToken]);

    // Handle Google OAuth response — code flow on web, token flow on native
    useEffect(() => {
        if (response?.type === 'success') {
            if (response.params?.code) {
                // Web: authorization code flow
                handleAuthCode(response.params.code, request?.codeVerifier ?? undefined);
            } else if (response.authentication?.accessToken) {
                // Native: implicit token flow
                handleAuthToken(response.authentication.accessToken);
            }
        }
    }, [response]);

    const handleSignOut = async () => {
        await signOut();
        clearTodos();
    };

    const handleSubmit = async () => {
        if (!text.trim() || !userInfo || !jwtToken) return;
        if (editTodoId !== null) {
            const todo = todos.find(t => t.id === editTodoId);
            await editTodo(jwtToken, editTodoId, text, todo?.completed ?? false, deadline || null);
            setEditTodoId(null);
        } else {
            await addTodo(jwtToken, text, deadline || null);
        }
        setText('');
        setDeadline('');
    };

    const handleToggle = async (id: number, completed: boolean) => {
        if (!jwtToken) return;
        const updated = await toggleTodo(jwtToken, id, completed);
        runNotifications(todos.map(t => t.id === id ? updated : t));
    };

    const handleEdit = (todo: typeof todos[0]) => {
        setText(todo.text);
        setDeadline(todo.deadline ?? '');
        setEditTodoId(todo.id);
    };

    const handleCancelEdit = () => {
        setText('');
        setDeadline('');
        setEditTodoId(null);
    };

    const completedCount = todos.filter(t => t.completed).length;

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    if (!userInfo) {
        return <SignInScreen request={request} onSignIn={() => promptAsync()} C={C} />;
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: C.bg }]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Header
                    userInfo={userInfo}
                    completedCount={completedCount}
                    totalCount={todos.length}
                    onSignOut={handleSignOut}
                    C={C}
                />
                <NotificationBanner
                    permission={permission}
                    banner={banner}
                    onDismiss={() => setBanner(null)}
                    C={C}
                    scheme={scheme ?? 'light'}
                />
                <ProgressBar completed={completedCount} total={todos.length} C={C} />
                <FlatList
                    data={todos}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📝</Text>
                            <Text style={[styles.emptyTitle, { color: C.text }]}>No todos yet</Text>
                            <Text style={[styles.emptySubtitle, { color: C.subtext }]}>Add your first task below</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TodoItem
                            item={item}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                            onDelete={(id) => jwtToken && deleteTodo(jwtToken, id)}
                            C={C}
                            scheme={scheme ?? 'light'}
                        />
                    )}
                />
                <InputBar
                    text={text}
                    onChangeText={setText}
                    deadline={deadline}
                    onChangeDeadline={setDeadline}
                    onClearDeadline={() => setDeadline('')}
                    onSubmit={handleSubmit}
                    isEditing={editTodoId !== null}
                    onCancelEdit={handleCancelEdit}
                    C={C}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15, paddingBottom: 8, flexGrow: 1, maxWidth: 900, width: '100%', alignSelf: 'center' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    emptySubtitle: { fontSize: 14 },
});
