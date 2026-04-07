import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TodoApp = () => {
    const [todos, setTodos] = useState([]);
    const [text, setText] = useState('');
    const [editIndex, setEditIndex] = useState(null);

    useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        try {
            const storedTodos = await AsyncStorage.getItem('todos');
            if (storedTodos) {
                setTodos(JSON.parse(storedTodos));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveTodos = async (newTodos) => {
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

    const deleteTodo = (index) => {
        const newTodos = todos.filter((_, i) => i !== index);
        setTodos(newTodos);
        saveTodos(newTodos);
    };

    const toggleComplete = (index) => {
        const newTodos = [...todos];
        newTodos[index].completed = !newTodos[index].completed;
        setTodos(newTodos);
        saveTodos(newTodos);
    };

    const editTodo = (index) => {
        setText(todos[index].text);
        setEditIndex(index);
    };

    return (
        <View style={styles.container}>
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
    }
});

export default TodoApp;