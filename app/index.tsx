import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '500399867620-hqsbphh8utgcmjapuscurt91emed1sjn.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URL = 'https://auth.expo.io/@Kareem499/todo-app';
const AUTH_TOKEN_KEY = 'google_auth_token';
const USER_INFO_KEY = 'google_user_info';
const API_URL = 'http://localhost:3000';

interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

interface UserInfo {
    id: string;
    name: string;
    email: string;
    picture?: string;
}

const TodoApp = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [text, setText] = useState('');
    const [editTodoId, setEditTodoId] = useState<number | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUrl: GOOGLE_REDIRECT_URL,
    });

    const fetchTodos = useCallback(async (userId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/todos/${userId}`);
            const data = await res.json();
            setTodos(data);
        } catch (e) {
            Alert.alert('Error', 'Failed to load todos');
        }
    }, []);

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
            // Register/login user in our backend using the access token
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

    useEffect(() => {
        loadStoredAuth();
    }, [loadStoredAuth]);

    useEffect(() => {
        if (response?.type === 'success') {
            const token = response.authentication?.accessToken;
            if (token) {
                handleAuthToken(token);
            }
        }
    }, [response, handleAuthToken]);

    const handleSignOut = async () => {
        try {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
            await AsyncStorage.removeItem(USER_INFO_KEY);
            setUserInfo(null);
            setTodos([]);
        } catch (e) {
            console.error(e);
        }
    };

    const addOrEditTodo = async () => {
        if (text.trim() === '') {
            Alert.alert('Please enter a todo item.');
            return;
        }
        try {
            if (editTodoId !== null) {
                const todo = todos.find(t => t.id === editTodoId);
                const res = await fetch(`${API_URL}/api/todos/${editTodoId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, completed: todo?.completed ?? false }),
                });
                const updated: Todo = await res.json();
                setTodos(todos.map(t => (t.id === editTodoId ? updated : t)));
                setEditTodoId(null);
            } else {
                const res = await fetch(`${API_URL}/api/todos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: userInfo!.id, text }),
                });
                const newTodo: Todo = await res.json();
                setTodos([...todos, newTodo]);
            }
            setText('');
        } catch (e) {
            Alert.alert('Error', 'Failed to save todo');
        }
    };

    const deleteTodo = async (id: number) => {
        try {
            await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE' });
            setTodos(todos.filter(t => t.id !== id));
        } catch (e) {
            Alert.alert('Error', 'Failed to delete todo');
        }
    };

    const toggleComplete = async (id: number, completed: boolean) => {
        try {
            const res = await fetch(`${API_URL}/api/todos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !completed }),
            });
            const updated: Todo = await res.json();
            setTodos(todos.map(t => (t.id === id ? updated : t)));
        } catch (e) {
            Alert.alert('Error', 'Failed to update todo');
        }
    };

    const startEdit = (todo: Todo) => {
        setText(todo.text);
        setEditTodoId(todo.id);
    };

    if (authLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4285F4" />
            </View>
        );
    }

    if (!userInfo) {
        return (
            <View style={styles.signInContainer}>
                <Text style={styles.appTitle}>My Todo App</Text>
                <Text style={styles.signInSubtitle}>Sign in to manage your todos</Text>
                <TouchableOpacity
                    style={[styles.googleButton, !request && styles.googleButtonDisabled]}
                    onPress={() => promptAsync()}
                    disabled={!request}
                >
                    <Image
                        source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                        style={styles.googleLogo}
                    />
                    <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    {userInfo.picture && (
                        <Image source={{ uri: userInfo.picture }} style={styles.avatar} />
                    )}
                    <View>
                        <Text style={styles.userName}>{userInfo.name}</Text>
                        <Text style={styles.userEmail}>{userInfo.email}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.input}
                placeholder='Add a new todo'
                value={text}
                onChangeText={setText}
            />
            <Button title={editTodoId !== null ? 'Save Edit' : 'Add Todo'} onPress={addOrEditTodo} />
            <FlatList
                data={todos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.todoItem}>
                        <TouchableOpacity onPress={() => toggleComplete(item.id, item.completed)}>
                            <Text style={[styles.todoText, item.completed && styles.completed]}>{item.text}</Text>
                        </TouchableOpacity>
                        <View style={styles.buttonsContainer}>
                            <Button title='Edit' onPress={() => startEdit(item)} />
                            <Button title='Delete' onPress={() => deleteTodo(item.id)} />
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signInContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    appTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    signInSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#dadce0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    googleButtonDisabled: {
        opacity: 0.6,
    },
    googleLogo: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 16,
        color: '#3c4043',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    userEmail: {
        fontSize: 12,
        color: '#666',
    },
    signOutButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#dadce0',
    },
    signOutText: {
        fontSize: 13,
        color: '#3c4043',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
    },
    todoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
    },
    buttonsContainer: {
        flexDirection: 'row',
    },
    todoText: {
        fontSize: 18,
    },
    completed: {
        textDecorationLine: 'line-through',
        color: 'gray',
    },
});

export default TodoApp;
