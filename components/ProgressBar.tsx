import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

interface Props {
    completed: number;
    total: number;
    C: Theme;
}

export function ProgressBar({ completed, total, C }: Props) {
    if (total === 0) return null;
    const s = makeStyles(C);
    const pct = `${Math.round((completed / total) * 100)}%`;
    return (
        <View style={s.container}>
            <View style={s.bg}>
                <View style={[s.fill, { width: pct as any }]} />
            </View>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    container: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: C.card },
    bg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    fill: { height: 6, backgroundColor: C.primary, borderRadius: 3 },
});
