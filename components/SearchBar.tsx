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
                <TouchableOpacity onPress={() => onChange('')} style={s.clearBtn}>
                    <Text style={s.clearText}>✕</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.bg,
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
        borderWidth: 1, borderColor: C.border, gap: 8,
    },
    icon: { fontSize: 13 },
    input: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
    clearBtn: { padding: 2 },
    clearText: { fontSize: 12, color: C.subtext, fontWeight: '600' },
});
