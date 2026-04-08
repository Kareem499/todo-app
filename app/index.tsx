import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    ActivityIndicator,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useColorScheme } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '500399867620-hqsbphh8utgcmjapuscurt91emed1sjn.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URL = 'https://auth.expo.io/@Kareem499/todo-app';
const AUTH_TOKEN_KEY = 'google_auth_token';
const USER_INFO_KEY = 'google_user_info';
const API_URL = 'http://localhost:3000';

const LIGHT = {
    bg: '#F7F8FC',
    card: '#FFFFFF',
    primary: '#6C63FF',
    primaryLight: '#EEF0FF',
    danger: '#FF5C5C',
    dangerLight: '#FFF0F0',
    text: '#1A1A2E',
    subtext: '#8A8FA8',
    border: '#E8EAF0',
    completed: '#B0B5C8',
    success: '#4CAF50',
};

const DARK = {
    bg: '#12121A',
    card: '#1E1E2E',
    primary: '#7C74FF',
    primaryLight: '#2A2850',
    danger: '#FF6B6B',
    dangerLight: '#3A1F1F',
    text: '#EAEAF5',
    subtext: '#8A8FA8',
    border: '#2E2E42',
    completed: '#55556A',
    success: '#4CAF50',
};

interface Todo {
    id: number;
    text: string;
    completed: boolean;
    deadline: string | null;
}

function normalizeDate(deadline: string): string {
    // Handles both "2026-04-09" and "2026-04-09T00:00:00.000Z"
    return deadline.split('T')[0];
}

function getDeadlineStatus(deadline: string | null): 'overdue' | 'today' | 'soon' | 'future' | null {
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

function formatDeadline(deadline: string): string {
    const due = new Date(normalizeDate(deadline) + 'T00:00:00');
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- Notifications ---
const NOTIFIED_KEY = 'notified_todos';

async function requestNotificationPermission(): Promise<boolean> {
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

interface NotificationSummary {
    overdue: Todo[];
    today: Todo[];
    tomorrow: Todo[];
}

function getDeadlineSummary(todos: Todo[]): NotificationSummary {
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

function fireDeadlineNotifications(todos: Todo[]) {
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

interface UserInfo {
    id: string;
    name: string;
    email: string;
    picture?: string;
}

const TodoApp = () => {
    const scheme = useColorScheme();
    const C = scheme === 'dark' ? DARK : LIGHT;

    const dateInputRef = useRef<any>(null);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [text, setText] = useState('');
    const [deadline, setDeadline] = useState<string>('');
    const [editTodoId, setEditTodoId] = useState<number | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
    const [banner, setBanner] = useState<NotificationSummary | null>(null);

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUrl: GOOGLE_REDIRECT_URL,
    });

    const runNotifications = useCallback((todoList: Todo[]) => {
        const summary = getDeadlineSummary(todoList);
        const hasAlerts = summary.overdue.length > 0 || summary.today.length > 0 || summary.tomorrow.length > 0;
        setBanner(hasAlerts ? summary : null);
        fireDeadlineNotifications(todoList);
    }, []);

    const fetchTodos = useCallback(async (userId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/todos/${userId}`);
            const data = await res.json();
            setTodos(data);
            runNotifications(data);
        } catch (e) {
            Alert.alert('Error', 'Failed to load todos');
        }
    }, [runNotifications]);

    const loadStoredAuth = useCallback(async () => {
        try {
            const storedUserInfo = await AsyncStorage.getItem(USER_INFO_KEY);
            if (storedUserInfo) {
                const parsed: UserInfo = JSON.parse(storedUserInfo);
                setUserInfo(parsed);
                fetchTodos(parsed.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAuthLoading(false);
        }
    }, [fetchTodos]);

    const handleAuthToken = useCallback(async (token: string) => {
        try {
            setAuthLoading(true);
            const backendRes = await fetch(`${API_URL}/api/auth/google/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: token }),
            });
            const info: UserInfo = await backendRes.json();
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
            setUserInfo(info);
            fetchTodos(info.id);
        } catch (e) {
            console.error(e);
            Alert.alert('Sign in failed', 'Could not retrieve user info.');
        } finally {
            setAuthLoading(false);
        }
    }, [fetchTodos]);

    useEffect(() => { loadStoredAuth(); }, [loadStoredAuth]);

    useEffect(() => {
        if (response?.type === 'success') {
            const token = response.authentication?.accessToken;
            if (token) handleAuthToken(token);
        }
    }, [response, handleAuthToken]);

    // Request notification permission once user is logged in
    useEffect(() => {
        if (!userInfo) return;
        if (typeof window === 'undefined' || !('Notification' in window)) {
            setNotifPermission('unsupported');
            return;
        }
        setNotifPermission(Notification.permission as any);
        if (Notification.permission === 'default') {
            requestNotificationPermission().then(granted => {
                setNotifPermission(granted ? 'granted' : 'denied');
            });
        }
    }, [userInfo]);

    // Re-check notifications every hour
    useEffect(() => {
        if (!userInfo || todos.length === 0) return;
        const interval = setInterval(() => runNotifications(todos), 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userInfo, todos, runNotifications]);

    const handleSignOut = async () => {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_INFO_KEY);
        setUserInfo(null);
        setTodos([]);
    };

    const addOrEditTodo = async () => {
        if (text.trim() === '') return;
        try {
            if (editTodoId !== null) {
                const todo = todos.find(t => t.id === editTodoId);
                const res = await fetch(`${API_URL}/api/todos/${editTodoId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, completed: todo?.completed ?? false, deadline: deadline || null }),
                });
                const updated: Todo = await res.json();
                setTodos(todos.map(t => (t.id === editTodoId ? updated : t)));
                setEditTodoId(null);
            } else {
                const res = await fetch(`${API_URL}/api/todos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: userInfo!.id, text, deadline: deadline || null }),
                });
                const newTodo: Todo = await res.json();
                setTodos([...todos, newTodo]);
            }
            setText('');
            setDeadline('');
        } catch (e) {
            Alert.alert('Error', 'Failed to save todo');
        }
    };

    const deleteTodo = async (id: number) => {
        await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE' });
        setTodos(todos.filter(t => t.id !== id));
    };

    const toggleComplete = async (id: number, completed: boolean) => {
        const res = await fetch(`${API_URL}/api/todos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !completed }),
        });
        const updated: Todo = await res.json();
        const newTodos = todos.map(t => (t.id === id ? updated : t));
        setTodos(newTodos);
        runNotifications(newTodos);
    };

    const startEdit = (todo: Todo) => {
        setText(todo.text);
        setDeadline(todo.deadline ?? '');
        setEditTodoId(todo.id);
    };

    const cancelEdit = () => {
        setText('');
        setDeadline('');
        setEditTodoId(null);
    };

    const completedCount = todos.filter(t => t.completed).length;

    const s = makeStyles(C, scheme ?? 'light');

    // --- Loading ---
    if (authLoading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    // --- Sign In Screen ---
    if (!userInfo) {
        return (
            <View style={s.signInBg}>
                <View style={s.signInCard}>
                    <View style={s.signInIcon}>
                        <Text style={s.signInIconText}>✓</Text>
                    </View>
                    <Text style={s.appTitle}>My Todo App</Text>
                    <Text style={s.signInSubtitle}>Stay organized, get things done.</Text>
                    <TouchableOpacity
                        style={[s.googleButton, !request && s.googleButtonDisabled]}
                        onPress={() => promptAsync()}
                        disabled={!request}
                    >
                        <Image
                            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                            style={s.googleLogo}
                        />
                        <Text style={s.googleButtonText}>Continue with Google</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // --- Main App ---
    return (
        <SafeAreaView style={s.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                {/* Header */}
                <View style={s.header}>
                    <View style={s.headerLeft}>
                        {userInfo.picture
                            ? <Image source={{ uri: userInfo.picture }} style={s.avatar} />
                            : <View style={s.avatarFallback}><Text style={s.avatarInitial}>{userInfo.name[0]}</Text></View>
                        }
                        <View>
                            <Text style={s.greeting}>Hello, {userInfo.name.split(' ')[0]} 👋</Text>
                            <Text style={s.taskCount}>{completedCount}/{todos.length} tasks done</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={s.signOutButton} onPress={handleSignOut}>
                        <Text style={s.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Notification permission prompt */}
                {notifPermission === 'denied' && userInfo && (
                    <View style={s.notifDeniedBanner}>
                        <Text style={s.notifDeniedText}>🔕 Browser notifications are blocked. Enable them in your browser settings to get deadline reminders.</Text>
                    </View>
                )}

                {/* Deadline alert banner */}
                {banner && (
                    <View style={s.alertBanner}>
                        <View style={{ flex: 1 }}>
                            {banner.overdue.length > 0 && (
                                <Text style={s.alertBannerText}>
                                    ⚠️ <Text style={{ fontWeight: '700' }}>{banner.overdue.length} overdue</Text>
                                    {' '}· {banner.overdue.map(t => t.text).join(', ')}
                                </Text>
                            )}
                            {banner.today.length > 0 && (
                                <Text style={[s.alertBannerText, { color: '#FF9500' }]}>
                                    📅 <Text style={{ fontWeight: '700' }}>{banner.today.length} due today</Text>
                                    {' '}· {banner.today.map(t => t.text).join(', ')}
                                </Text>
                            )}
                            {banner.tomorrow.length > 0 && (
                                <Text style={[s.alertBannerText, { color: C.primary }]}>
                                    🔔 <Text style={{ fontWeight: '700' }}>{banner.tomorrow.length} due tomorrow</Text>
                                    {' '}· {banner.tomorrow.map(t => t.text).join(', ')}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => setBanner(null)} style={s.alertDismiss}>
                            <Text style={s.alertDismissText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Progress bar */}
                {todos.length > 0 && (
                    <View style={s.progressContainer}>
                        <View style={s.progressBg}>
                            <View style={[s.progressFill, { width: `${(completedCount / todos.length) * 100}%` as any }]} />
                        </View>
                    </View>
                )}

                {/* Todo List */}
                <FlatList
                    data={todos}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={s.listContent}
                    ListEmptyComponent={
                        <View style={s.emptyState}>
                            <Text style={s.emptyIcon}>📝</Text>
                            <Text style={s.emptyTitle}>No todos yet</Text>
                            <Text style={s.emptySubtitle}>Add your first task below</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const status = getDeadlineStatus(item.deadline);
                        const deadlineColors: Record<string, string> = {
                            overdue: '#FF5C5C',
                            today: '#FF9500',
                            soon: '#FF9500',
                            future: C.primary,
                        };
                        const deadlineBgColors: Record<string, string> = {
                            overdue: C.dangerLight,
                            today: scheme === 'dark' ? '#3A2A00' : '#FFF4E0',
                            soon: scheme === 'dark' ? '#3A2A00' : '#FFF4E0',
                            future: C.primaryLight,
                        };
                        return (
                            <View style={[s.todoCard, item.completed && s.todoCardDone]}>
                                <TouchableOpacity
                                    style={[s.checkbox, item.completed && s.checkboxDone]}
                                    onPress={() => toggleComplete(item.id, item.completed)}
                                >
                                    {item.completed && <Text style={s.checkmark}>✓</Text>}
                                </TouchableOpacity>
                                <View style={{ flex: 1 }}>
                                    <View style={s.todoRow}>
                                        <Text style={[s.todoText, item.completed && s.todoTextDone]} numberOfLines={1}>
                                            {item.text}
                                        </Text>
                                        {item.deadline && status && !item.completed && (
                                            <View style={[s.deadlineInline, { backgroundColor: deadlineBgColors[status] }]}>
                                                <Text style={[s.deadlineInlineText, { color: deadlineColors[status] }]}>
                                                    {status === 'overdue' ? '⚠️ ' : '📅 '}{formatDeadline(item.deadline)}
                                                </Text>
                                            </View>
                                        )}
                                        {item.deadline && item.completed && (
                                            <View style={s.deadlineInlineDone}>
                                                <Text style={s.deadlineInlineDoneText}>📅 {formatDeadline(item.deadline)}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <View style={s.todoActions}>
                                    <TouchableOpacity style={s.editBtn} onPress={() => startEdit(item)}>
                                        <Text style={s.editBtnText}>✎</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.deleteBtn} onPress={() => deleteTodo(item.id)}>
                                        <Text style={s.deleteBtnText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                />

                {/* Input Area */}
                <View style={s.inputArea}>
                    {editTodoId !== null && (
                        <View style={s.editingBanner}>
                            <Text style={s.editingBannerText}>✎ Editing task</Text>
                            <TouchableOpacity onPress={cancelEdit}>
                                <Text style={s.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={s.inputRow}>
                        <TextInput
                            style={s.input}
                            placeholder="Add a new task..."
                            placeholderTextColor={C.subtext}
                            value={text}
                            onChangeText={setText}
                            onSubmitEditing={addOrEditTodo}
                            returnKeyType="done"
                        />
                        {/* Hidden native date input — triggered by the 📅 button */}
                        {/* @ts-ignore */}
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={deadline}
                            onChange={(e: any) => setDeadline(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden' }}
                        />
                        <TouchableOpacity
                            style={[s.deadlineToggle, !!deadline && s.deadlineToggleActive]}
                            onPress={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                        >
                            <Text style={s.deadlineToggleText}>📅</Text>
                            {deadline ? <Text style={s.deadlineToggleDot}>·</Text> : null}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.addButton, !text.trim() && s.addButtonDisabled]}
                            onPress={addOrEditTodo}
                            disabled={!text.trim()}
                        >
                            <Text style={s.addButtonText}>{editTodoId !== null ? '✓' : '+'}</Text>
                        </TouchableOpacity>
                    </View>
                    {deadline ? (
                        <View style={s.deadlineChip}>
                            <Text style={s.deadlineChipText}>📅 {formatDeadline(deadline)}</Text>
                            <TouchableOpacity onPress={() => setDeadline('')}>
                                <Text style={s.clearDeadline}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const makeStyles = (C: typeof LIGHT, scheme: 'light' | 'dark') => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: C.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

    // Sign In
    signInBg: { flex: 1, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', padding: 24 },
    signInCard: { backgroundColor: C.card, borderRadius: 24, padding: 36, alignItems: 'center', width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
    signInIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    signInIconText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
    appTitle: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 8 },
    signInSubtitle: { fontSize: 15, color: C.subtext, marginBottom: 32, textAlign: 'center' },
    googleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: C.border, width: '100%', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    googleButtonDisabled: { opacity: 0.5 },
    googleLogo: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { fontSize: 16, color: C.text, fontWeight: '600' },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    avatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
    greeting: { fontSize: 16, fontWeight: '700', color: C.text },
    taskCount: { fontSize: 12, color: C.subtext, marginTop: 2 },
    signOutButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
    signOutText: { fontSize: 13, color: C.subtext, fontWeight: '500' },

    // Progress
    progressContainer: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: C.card },
    progressBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 6, backgroundColor: C.primary, borderRadius: 3 },

    // List
    listContent: { padding: 15, paddingBottom: 8, flexGrow: 1, maxWidth: 900, width: '100%', alignSelf: 'center' },

    // Empty state
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: C.subtext },

    // Todo card
    todoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 12 },
    todoCardDone: { opacity: 0.7 },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    checkboxDone: { backgroundColor: C.success, borderColor: C.success },
    checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
    todoText: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
    todoTextDone: { textDecorationLine: 'line-through', color: C.completed },
    todoActions: { flexDirection: 'row', gap: 8 },
    editBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
    editBtnText: { color: C.primary, fontSize: 15 },
    deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.dangerLight, justifyContent: 'center', alignItems: 'center' },
    deleteBtnText: { color: C.danger, fontSize: 13, fontWeight: '700' },

    // Input
    inputArea: { padding: 12, paddingHorizontal: 15, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
    editingBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
    editingBannerText: { fontSize: 12, color: C.primary, fontWeight: '600' },
    cancelText: { fontSize: 12, color: C.danger, fontWeight: '600' },
    inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', maxWidth: 900, width: '100%', alignSelf: 'center' },
    input: { flex: 1, backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
    addButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
    addButtonDisabled: { backgroundColor: C.border },
    addButtonText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },
    deadlineToggle: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    deadlineToggleActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
    deadlineToggleText: { fontSize: 20 },
    deadlineToggleDot: { fontSize: 8, color: C.primary, position: 'absolute', bottom: 6, fontWeight: '900' },
    deadlineChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 8, marginLeft: 4, backgroundColor: C.primaryLight, borderRadius: 20, paddingVertical: 4, paddingLeft: 10, paddingRight: 6, gap: 6, maxWidth: 900, alignSelf: 'center' },
    deadlineChipText: { fontSize: 13, color: C.primary, fontWeight: '600' },
    clearDeadline: { fontSize: 13, color: C.primary, fontWeight: '700', paddingHorizontal: 4 },

    // Deadline inline on cards
    todoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    deadlineInline: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    deadlineInlineText: { fontSize: 12, fontWeight: '600' },
    deadlineInlineDone: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.border },
    deadlineInlineDoneText: { fontSize: 12, color: C.completed },

    // Notification banners
    notifDeniedBanner: { backgroundColor: scheme === 'dark' ? '#2A1F00' : '#FFF8E1', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#3A2E00' : '#FFE082' },
    notifDeniedText: { fontSize: 12, color: scheme === 'dark' ? '#FFD54F' : '#795548' },
    alertBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: scheme === 'dark' ? '#2A1A1A' : '#FFF5F5', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#3A2020' : '#FFCDD2', gap: 8 },
    alertBannerText: { fontSize: 13, color: C.danger, marginBottom: 2, flexShrink: 1 },
    alertDismiss: { padding: 4 },
    alertDismissText: { fontSize: 14, color: C.subtext, fontWeight: '700' },
});

export default TodoApp;
