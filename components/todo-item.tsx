import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  function handleSave() {
    const trimmed = editText.trim();
    if (trimmed.length > 0) {
      onEdit(todo.id, trimmed);
    } else {
      setEditText(todo.text);
    }
    setIsEditing(false);
  }

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggle(todo.id)}
        accessibilityLabel={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.completed }}>
        <View
          style={[
            styles.checkboxInner,
            todo.completed && styles.checkboxChecked,
          ]}>
          {todo.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {isEditing ? (
        <TextInput
          style={[
            styles.editInput,
            isDark ? styles.editInputDark : styles.editInputLight,
          ]}
          value={editText}
          onChangeText={setEditText}
          onBlur={handleSave}
          onSubmitEditing={handleSave}
          autoFocus
          returnKeyType="done"
          accessibilityLabel="Edit todo text"
        />
      ) : (
        <Text
          style={[
            styles.todoText,
            todo.completed && styles.todoTextCompleted,
            isDark ? styles.todoTextDark : styles.todoTextLight,
          ]}>
          {todo.text}
        </Text>
      )}

      <View style={styles.actions}>
        {!isEditing && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditText(todo.text);
              setIsEditing(true);
            }}
            accessibilityLabel="Edit todo"
            accessibilityRole="button">
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(todo.id)}
          accessibilityLabel="Delete todo"
          accessibilityRole="button">
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  containerLight: {
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#1e2022',
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0a7ea4',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  todoTextLight: {
    color: '#11181C',
  },
  todoTextDark: {
    color: '#ECEDEE',
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0a7ea4',
    paddingVertical: 2,
  },
  editInputLight: {
    color: '#11181C',
  },
  editInputDark: {
    color: '#ECEDEE',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButton: {
    padding: 6,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 6,
  },
  deleteButtonText: {
    fontSize: 16,
  },
});
