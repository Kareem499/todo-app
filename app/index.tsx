import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '500399867620-hqsbphh8utgcmjapuscurt91emed1sjn.apps.googleusercontent.com';
const REDIRECT_URI = 'http://localhost:19006/auth/callback';
const API_URL = 'http://localhost:3000';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUserLogin();
  }, []);

  const checkUserLogin = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchTodos(parsedUser.id);
    }
  };

  const fetchTodos = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/todos/${userId}`);
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load todos');
    }
  };

  const handleGoogleLogin = async () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('profile email')}`;
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      if (result.type === 'success') {
        const code = new URLSearchParams(new URL(result.url).search).get('code');
        if (code) {
          const response = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
          const userData = await response.json();
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          fetchTodos(userData.id);
        }
      }
    } catch (error) {
      Alert.alert('Login Error', String(error));
    }
  };

  const handleLogout = async () => {
    setUser(null);
    setTodos([]);
    await AsyncStorage.removeItem('user');
  };

  const addTodo = async () => {
    if (!input.trim()) return;
    try {
      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, text: input }),
      });
      const newTodo = await response.json();
      setTodos([...todos, newTodo]);
      setInput('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add todo');
    }
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      const updated = await response.json();
      setTodos(todos.map(t => (t.id === id ? updated : t)));
    } catch (error) {
      Alert.alert('Error', 'Failed to update todo');
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE' });
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete todo');
    }
  };

  if (!user) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.title}>Todo App</Text>
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Todos</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a todo..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.button} onPress={addTodo}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <TouchableOpacity onPress={() => toggleTodo(item.id, item.completed)} style={{ flex: 1 }}>
              <Text style={[styles.todoText, item.completed && styles.completed]}>
                {item.text}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold' },
  googleButton: { backgroundColor: '#4285F4', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 8, alignItems: 'center', width: '80%' },
  googleButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  logoutButton: { backgroundColor: '#FF5252', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  logoutText: { color: 'white', fontWeight: '600', fontSize: 12 },
  inputContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: 'white' },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 15, borderRadius: 8, justifyContent: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  todoItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', padding: 15, marginBottom: 10, borderRadius: 8 },
  todoText: { fontSize: 16 },
  completed: { textDecorationLine: 'line-through', color: '#999' },
  delete: { color: 'red', fontWeight: '600' },
});
