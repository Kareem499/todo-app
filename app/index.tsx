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

interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

interface UserInfo {
    name: string;
    email: string;
    picture?: string;
}

const TodoApp = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [text, setText] = useState('');
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUrl: GOOGLE_REDIRECT_URL,
    });

    const loadTodos = useCallback(async () => {
        try {
            const storedTodos = await AsyncStorage.getItem('todos');
            if (storedTodos) {
                setTodos(JSON.parse(storedTodos));
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const loadStoredAuth = useCallback(async () => {
        try {
            const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const storedUserInfo = await AsyncStorage.getItem(USER_INFO_KEY);
            if (storedToken && storedUserInfo) {
                setUserInfo(JSON.parse(storedUserInfo));
                loadTodos();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAuthLoading(false);
        }
    }, [loadTodos]);

    const handleAuthToken = useCallback(async (token: string) => {
        try {
            setAuthLoading(true);
            const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const info: UserInfo = await res.json();
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
            setUserInfo(info);
            loadTodos();
        } catch (e) {
            console.error(e);
            Alert.alert('Sign in failed', 'Could not retrieve user info.');
        } finally {
            setAuthLoading(false);
        }
    }, [loadTodos]);

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

    const saveTodos = async (newTodos: Todo[]) => {
        try {
            await AsyncStorage.setItem('todos', JSON.stringify(newTodos));
        } catch (e) {
            console.error(e);
        }
    };

    const addOrEditTodo = () => {
        if (text.trim() === '') {
            Alert.alert('Please enter a todo item.');
            return;
        }
        const newTodos = [...todos];
        if (editIndex !== null) {
            newTodos[editIndex].text = text;
            setEditIndex(null);
        } else {
            newTodos.push({ id: Date.now(), text, completed: false });
        }
        setTodos(newTodos);
        saveTodos(newTodos);
        setText('');
    };

    const deleteTodo = (index: number) => {
        const newTodos = todos.filter((_, i) => i !== index);
        setTodos(newTodos);
        saveTodos(newTodos);
    };

    const toggleComplete = (index: number) => {
        const newTodos = [...todos];
        newTodos[index].completed = !newTodos[index].completed;
        setTodos(newTodos);
        saveTodos(newTodos);
    };

    const editTodo = (index: number) => {
        setText(todos[index].text);
        setEditIndex(index);
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
            <Button title={editIndex !== null ? 'Edit Todo' : 'Add Todo'} onPress={addOrEditTodo} />
            <FlatList
                data={todos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.todoItem}>
                        <TouchableOpacity onPress={() => toggleComplete(index)}>
                            <Text style={[styles.todoText, item.completed && styles.completed]}>{item.text}</Text>
                        </TouchableOpacity>
                        <View style={styles.buttonsContainer}>
                            <Button title='Edit' onPress={() => editTodo(index)} />
                            <Button title='Delete' onPress={() => deleteTodo(index)} />
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