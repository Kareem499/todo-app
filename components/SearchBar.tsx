import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

interface Props {
    value: string;
    onChange: (v: string) => void;
    C: Theme;
}

export function SearchBar({ value, onChange, C }: Props) {
    const s = makeStyles(C);
    return (
        <View style={s.container}>
            <Text style={s.icon}>🔍</Text>
            <TextInput
                style={s.input}
                placeholder="Search tasks..."
                placeholderTextColor={C.subtext}
                value={value}
                onChangeText={onChange}
                returnKeyType="search"
            />
            {value ? (
                <TouchableOpacity onPress={() => onChange('')}>
                    <Text style={s.clear}>✕</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border, gap: 8 },
    icon: { fontSize: 14 },
    input: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
    clear: { fontSize: 13, color: C.subtext, paddingHorizontal: 4 },
});
