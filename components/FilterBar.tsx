import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

interface Props {
    categories: string[];
    activeCategory: string | null;
    onSelectCategory: (cat: string | null) => void;
    showArchived: boolean;
    onToggleArchived: () => void;
    C: Theme;
}

export function FilterBar({ categories, activeCategory, onSelectCategory, showArchived, onToggleArchived, C }: Props) {
    const s = makeStyles(C);

    if (categories.length === 0 && !showArchived) return null;

    return (
        <View style={s.wrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.container}>
                <TouchableOpacity
                    style={[s.chip, !activeCategory && !showArchived && s.chipActive]}
                    onPress={() => { onSelectCategory(null); if (showArchived) onToggleArchived(); }}
                >
                    <Text style={[s.chipText, !activeCategory && !showArchived && s.chipTextActive]}>All</Text>
                </TouchableOpacity>

                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[s.chip, activeCategory === cat && s.chipActive]}
                        onPress={() => onSelectCategory(activeCategory === cat ? null : cat)}
                    >
                        <Text style={[s.chipText, activeCategory === cat && s.chipTextActive]}>📁 {cat}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={[s.chip, showArchived && s.chipActive]}
                    onPress={onToggleArchived}
                >
                    <Text style={[s.chipText, showArchived && s.chipTextActive]}>📦 Archived</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    wrapper: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
    container: { flexDirection: 'row', gap: 8, paddingHorizontal: 15, paddingVertical: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
    chipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
    chipText: { fontSize: 13, color: C.subtext, fontWeight: '500' },
    chipTextActive: { color: C.primary, fontWeight: '700' },
});
