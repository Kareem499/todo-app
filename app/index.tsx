import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { useColorScheme } from 'react-native';

import { LIGHT, DARK } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useTodos } from '../hooks/useTodos';
import { useNotifications } from '../hooks/useNotifications';
import { Priority, Recurrence } from '../types';

import { SignInScreen } from '../components/SignInScreen';
import { Header } from '../components/Header';
import { ProgressBar } from '../components/ProgressBar';
import { NotificationBanner } from '../components/NotificationBanner';
import { TodoItem } from '../components/TodoItem';
import { InputBar } from '../components/InputBar';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';

export default function TodoApp() {
    const scheme = useColorScheme();
    const C = scheme === 'dark' ? DARK : LIGHT;

    const { userInfo, jwtToken, loading, request, response, promptAsync, onSignIn, loadStoredAuth, handleAuthToken, sendEmailCode, verifyEmailCode, signOut } = useAuth();
    const { todos, archivedTodos, fetchTodos, fetchArchived, addTodo, editTodo, toggleTodo, deleteTodo, archiveTodo, unarchiveTodo, reorderTodos, clearTodos } = useTodos();
    const { permission, banner, setBanner, runNotifications } = useNotifications(userInfo, todos);

    // Input state
    const [text, setText] = useState('');
    const [deadline, setDeadline] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState<Priority>('none');
    const [category, setCategory] = useState('');
    const [recurrence, setRecurrence] = useState<Recurrence>(null);
    const [editTodoId, setEditTodoId] = useState<number | null>(null);

    // Filter / search state
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    // Restore session on mount
    useEffect(() => {
        loadStoredAuth();
    }, []);

    // When jwtToken becomes available, load todos
    useEffect(() => {
        if (jwtToken) {
            fetchTodos(jwtToken).then(data => runNotifications(data));
        }
    }, [jwtToken]);

    // Native only: handle Google OAuth token response
    useEffect(() => {
        if (response?.type === 'success' && response.authentication?.accessToken) {
            handleAuthToken(response.authentication.accessToken);
        }
    }, [response]);

    // Load archived when user switches to archived view
    useEffect(() => {
        if (showArchived && jwtToken) {
            fetchArchived(jwtToken);
        }
    }, [showArchived, jwtToken]);

    const handleSignOut = async () => {
        await signOut();
        clearTodos();
    };

    const handleSubmit = async () => {
        if (!text.trim() || !userInfo || !jwtToken) return;
        if (editTodoId !== null) {
            const todo = todos.find(t => t.id === editTodoId);
            await editTodo(
                jwtToken, editTodoId, text, todo?.completed ?? false,
                deadline || null, priority, category || null, recurrence, dueTime || null
            );
            setEditTodoId(null);
        } else {
            await addTodo(jwtToken, text, deadline || null, priority, category || null, recurrence, dueTime || null);
        }
        resetInput();
    };

    const resetInput = () => {
        setText('');
        setDeadline('');
        setDueTime('');
        setPriority('none');
        setCategory('');
        setRecurrence(null);
    };

    const handleToggle = async (id: number, completed: boolean) => {
        if (!jwtToken) return;
        const updated = await toggleTodo(jwtToken, id, completed);
        runNotifications(todos.map(t => t.id === id ? updated : t));
    };

    const handleEdit = (todo: typeof todos[0]) => {
        setText(todo.text);
        setDeadline(todo.deadline ?? '');
        setDueTime(todo.due_time ?? '');
        setPriority(todo.priority ?? 'none');
        setCategory(todo.category ?? '');
        setRecurrence(todo.recurrence ?? null);
        setEditTodoId(todo.id);
    };

    const handleCancelEdit = () => {
        resetInput();
        setEditTodoId(null);
    };

    const handleArchive = async (id: number) => {
        if (!jwtToken) return;
        await archiveTodo(jwtToken, id);
    };

    const handleUnarchive = async (id: number) => {
        if (!jwtToken) return;
        await unarchiveTodo(jwtToken, id);
    };

    const handleMoveUp = async (id: number) => {
        if (!jwtToken) return;
        const idx = todos.findIndex(t => t.id === id);
        if (idx <= 0) return;
        const reordered = [...todos];
        [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
        await reorderTodos(jwtToken, reordered);
    };

    const handleMoveDown = async (id: number) => {
        if (!jwtToken) return;
        const idx = todos.findIndex(t => t.id === id);
        if (idx < 0 || idx >= todos.length - 1) return;
        const reordered = [...todos];
        [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
        await reorderTodos(jwtToken, reordered);
    };

    // Derived: all unique categories
    const categories = useMemo(() =>
        [...new Set([...todos, ...archivedTodos].map(t => t.category).filter((c): c is string => !!c))],
        [todos, archivedTodos]
    );

    // Filtered list
    const displayList = useMemo(() => {
        const source = showArchived ? archivedTodos : todos;
        return source.filter(t => {
            if (search && !t.text.toLowerCase().includes(search.toLowerCase())) return false;
            if (activeCategory && t.category !== activeCategory) return false;
            return true;
        });
    }, [todos, archivedTodos, showArchived, search, activeCategory]);

    const completedCount = todos.filter(t => t.completed).length;

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    if (!userInfo) {
        return <SignInScreen request={request} onSignIn={onSignIn} onSendCode={sendEmailCode} onVerifyCode={verifyEmailCode} C={C} />;
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

                {/* Search + Filter */}
                <View style={[styles.searchWrapper, { backgroundColor: C.card, borderBottomColor: C.border }]}>
                    <SearchBar value={search} onChange={setSearch} C={C} />
                </View>
                <FilterBar
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                    showArchived={showArchived}
                    onToggleArchived={() => setShowArchived(v => !v)}
                    C={C}
                />

                <FlatList
                    data={displayList}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>{showArchived ? '📦' : '📝'}</Text>
                            <Text style={[styles.emptyTitle, { color: C.text }]}>
                                {showArchived ? 'No archived tasks' : search || activeCategory ? 'No matching tasks' : 'No todos yet'}
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: C.subtext }]}>
                                {showArchived ? 'Archived tasks will appear here' : 'Add your first task below'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item, index }) => (
                        <TodoItem
                            item={item}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                            onDelete={(id) => jwtToken && deleteTodo(jwtToken, id)}
                            onArchive={handleArchive}
                            onUnarchive={handleUnarchive}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            isFirst={index === 0}
                            isLast={index === displayList.length - 1}
                            C={C}
                            scheme={scheme ?? 'light'}
                        />
                    )}
                />

                {!showArchived && (
                    <InputBar
                        text={text}
                        onChangeText={setText}
                        deadline={deadline}
                        onChangeDeadline={setDeadline}
                        onClearDeadline={() => setDeadline('')}
                        dueTime={dueTime}
                        onChangeDueTime={setDueTime}
                        onClearDueTime={() => setDueTime('')}
                        priority={priority}
                        onChangePriority={setPriority}
                        category={category}
                        onChangeCategory={setCategory}
                        recurrence={recurrence}
                        onChangeRecurrence={setRecurrence}
                        onSubmit={handleSubmit}
                        isEditing={editTodoId !== null}
                        onCancelEdit={handleCancelEdit}
                        categories={categories}
                        C={C}
                    />
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchWrapper: { paddingHorizontal: 15, paddingVertical: 8, borderBottomWidth: 1 },
    listContent: { padding: 15, paddingBottom: 8, flexGrow: 1, maxWidth: 900, width: '100%', alignSelf: 'center' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    emptySubtitle: { fontSize: 14 },
});
