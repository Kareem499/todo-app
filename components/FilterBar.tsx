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
    const hasFilters = categories.length > 0;

    if (!hasFilters) return null;

    return (
        <View style={s.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.container}
            >
                <TouchableOpacity
                    style={[s.chip, !activeCategory && !showArchived && s.chipActive]}
                    onPress={() => { onSelectCategory(null); if (showArchived) onToggleArchived(); }}
                    activeOpacity={0.7}
                >
                    <Text style={[s.chipText, !activeCategory && !showArchived && s.chipTextActive]}>All</Text>
                </TouchableOpacity>

                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[s.chip, activeCategory === cat && s.chipActive]}
                        onPress={() => onSelectCategory(activeCategory === cat ? null : cat)}
                        activeOpacity={0.7}
                    >
                        <Text style={[s.chipText, activeCategory === cat && s.chipTextActive]}>📁 {cat}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={[s.chip, showArchived && s.chipActive]}
                    onPress={onToggleArchived}
                    activeOpacity={0.7}
                >
                    <Text style={[s.chipText, showArchived && s.chipTextActive]}>📦 Archive</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    wrapper: {
        borderBottomWidth: 1, borderBottomColor: C.border,
        backgroundColor: C.card,
    },
    container: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingVertical: 9 },
    chip: {
        paddingHorizontal: 13, paddingVertical: 6,
        borderRadius: 20, backgroundColor: C.bg,
        borderWidth: 1, borderColor: C.border,
    },
    chipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
    chipText: { fontSize: 12, color: C.subtext, fontWeight: '600' },
    chipTextActive: { color: C.primary },
});
