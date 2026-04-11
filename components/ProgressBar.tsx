import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

interface Props {
    completed: number;
    total: number;
    C: Theme;
}

export function ProgressBar({ completed, total, C }: Props) {
    if (total === 0) return null;
    const s = makeStyles(C);
    const pct = Math.round((completed / total) * 100);
    const allDone = completed === total;

    return (
        <View style={s.container}>
            <View style={s.track}>
                <View style={[s.fill, { width: `${pct}%` as any, backgroundColor: allDone ? C.success : C.primary }]} />
            </View>
            <Text style={[s.label, { color: allDone ? C.success : C.subtext }]}>
                {allDone ? '✓ All done!' : `${pct}%`}
            </Text>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 18, paddingVertical: 10,
        backgroundColor: C.card,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    track: { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    fill: { height: 6, borderRadius: 3 },
    label: { fontSize: 11, fontWeight: '700', width: 52, textAlign: 'right' },
});
