import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { TodoItem, type Todo } from '@/components/todo-item';

const STORAGE_KEY = '@todo_app_todos';

export default function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) {
          setTodos(JSON.parse(data) as Todo[]);
        }
      })
      .catch((error) => {
        console.error('Failed to load todos from storage:', error);
      });
  }, []);

  const saveTodos = useCallback((updated: Todo[]) => {
    setTodos(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((error) => {
      console.error('Failed to save todos to storage:', error);
    });
  }, []);

  function addTodo() {
    const text = inputText.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      completed: false,
    };
    saveTodos([newTodo, ...todos]);
    setInputText('');
  }

  function toggleTodo(id: string) {
    saveTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function deleteTodo(id: string) {
    saveTodos(todos.filter((t) => t.id !== id));
  }

  function editTodo(id: string, text: string) {
    saveTodos(todos.map((t) => (t.id === id ? { ...t, text } : t)));
  }

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <SafeAreaView style={[styles.safeArea, isDark ? styles.safeAreaDark : styles.safeAreaLight]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}>
            My Todos
          </Text>
          {todos.length > 0 && (
            <Text style={styles.subtitle}>
              {completedCount}/{todos.length} completed
            </Text>
          )}
        </View>

        <View style={[styles.inputRow, isDark ? styles.inputRowDark : styles.inputRowLight]}>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="Add a new todo…"
            placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={addTodo}
            returnKeyType="done"
            accessibilityLabel="New todo input"
          />
          <TouchableOpacity
            style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]}
            onPress={addTodo}
            disabled={!inputText.trim()}
            accessibilityLabel="Add todo"
            accessibilityRole="button">
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {todos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
              No todos yet. Add one above!
            </Text>
          </View>
        ) : (
          <FlatList
            data={todos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TodoItem
                todo={item}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
              />
            )}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  safeAreaLight: {
    backgroundColor: '#f2f6fa',
  },
  safeAreaDark: {
    backgroundColor: '#0d0f10',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  titleLight: {
    color: '#11181C',
  },
  titleDark: {
    color: '#ECEDEE',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  inputRowLight: {
    backgroundColor: '#ffffff',
  },
  inputRowDark: {
    backgroundColor: '#1e2022',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  inputLight: {
    color: '#11181C',
  },
  inputDark: {
    color: '#ECEDEE',
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
  },
  emptyTextLight: {
    color: '#687076',
  },
  emptyTextDark: {
    color: '#9BA1A6',
  },
});
