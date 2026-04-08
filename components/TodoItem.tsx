import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Todo } from '../types';
import { Theme } from '../constants/theme';
import { getDeadlineStatus, formatDeadline } from '../utils/deadline';

interface Props {
    item: Todo;
    onToggle: (id: number, completed: boolean) => void;
    onEdit: (todo: Todo) => void;
    onDelete: (id: number) => void;
    C: Theme;
    scheme: 'light' | 'dark';
}

export function TodoItem({ item, onToggle, onEdit, onDelete, C, scheme }: Props) {
    const s = makeStyles(C);
    const status = getDeadlineStatus(item.deadline);

    const deadlineColors: Record<string, string> = {
        overdue: '#FF5C5C',
        today: '#FF9500',
        soon: '#FF9500',
        future: C.primary,
    };
    const deadlineBgColors: Record<string, string> = {
        overdue: C.dangerLight,
        today: scheme === 'dark' ? '#3A2A00' : '#FFF4E0',
        soon: scheme === 'dark' ? '#3A2A00' : '#FFF4E0',
        future: C.primaryLight,
    };

    return (
        <View style={[s.card, item.completed && s.cardDone]}>
            <TouchableOpacity
                style={[s.checkbox, item.completed && s.checkboxDone]}
                onPress={() => onToggle(item.id, item.completed)}
            >
                {item.completed && <Text style={s.checkmark}>✓</Text>}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
                <View style={s.row}>
                    <Text style={[s.text, item.completed && s.textDone]} numberOfLines={1}>
                        {item.text}
                    </Text>
                    {item.deadline && status && !item.completed && (
                        <View style={[s.badge, { backgroundColor: deadlineBgColors[status] }]}>
                            <Text style={[s.badgeText, { color: deadlineColors[status] }]}>
                                {status === 'overdue' ? '⚠️ ' : '📅 '}{formatDeadline(item.deadline)}
                            </Text>
                        </View>
                    )}
                    {item.deadline && item.completed && (
                        <View style={s.badgeDone}>
                            <Text style={s.badgeDoneText}>📅 {formatDeadline(item.deadline)}</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={s.actions}>
                <TouchableOpacity style={s.editBtn} onPress={() => onEdit(item)}>
                    <Text style={s.editBtnText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item.id)}>
                    <Text style={s.deleteBtnText}>✕</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 12 },
    cardDone: { opacity: 0.7 },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    checkboxDone: { backgroundColor: C.success, borderColor: C.success },
    checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
    row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    text: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
    textDone: { textDecorationLine: 'line-through', color: C.completed },
    actions: { flexDirection: 'row', gap: 8 },
    editBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
    editBtnText: { color: C.primary, fontSize: 15 },
    deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.dangerLight, justifyContent: 'center', alignItems: 'center' },
    deleteBtnText: { color: C.danger, fontSize: 13, fontWeight: '700' },
    badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    badgeDone: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.border },
    badgeDoneText: { fontSize: 12, color: C.completed },
});
