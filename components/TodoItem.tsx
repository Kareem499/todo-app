import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Todo, Priority } from '../types';
import { Theme } from '../constants/theme';
import { getDeadlineStatus, formatDeadline } from '../utils/deadline';

interface Props {
    item: Todo;
    onToggle: (id: number, completed: boolean) => void;
    onEdit: (todo: Todo) => void;
    onDelete: (id: number) => void;
    onArchive: (id: number) => void;
    onUnarchive?: (id: number) => void;
    onMoveUp?: (id: number) => void;
    onMoveDown?: (id: number) => void;
    isFirst?: boolean;
    isLast?: boolean;
    C: Theme;
    scheme: 'light' | 'dark';
}

const PRIORITY_COLORS: Record<Priority, string> = {
    high: '#FF5C5C',
    medium: '#FF9500',
    low: '#4CAF50',
    none: 'transparent',
};

export function TodoItem({ item, onToggle, onEdit, onDelete, onArchive, onUnarchive, onMoveUp, onMoveDown, isFirst, isLast, C, scheme }: Props) {
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

    const priorityColor = PRIORITY_COLORS[item.priority ?? 'none'];
    const showPriorityBar = item.priority && item.priority !== 'none';

    return (
        <View style={[s.card, item.completed && s.cardDone]}>
            {/* Priority left bar */}
            {showPriorityBar && <View style={[s.priorityBar, { backgroundColor: priorityColor }]} />}

            <TouchableOpacity
                style={[s.checkbox, item.completed && s.checkboxDone]}
                onPress={() => onToggle(item.id, item.completed)}
            >
                {item.completed && <Text style={s.checkmark}>✓</Text>}
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
                <View style={s.textRow}>
                    <Text style={[s.text, item.completed && s.textDone]} numberOfLines={2}>
                        {item.text}
                    </Text>
                    {item.recurrence && !item.completed && (
                        <Text style={s.recurBadge}>🔄</Text>
                    )}
                </View>

                {/* Metadata row */}
                <View style={s.metaRow}>
                    {item.category ? (
                        <View style={s.categoryBadge}>
                            <Text style={[s.categoryText, { color: C.primary }]}>📁 {item.category}</Text>
                        </View>
                    ) : null}

                    {item.deadline && status && !item.completed && (
                        <View style={[s.badge, { backgroundColor: deadlineBgColors[status] }]}>
                            <Text style={[s.badgeText, { color: deadlineColors[status] }]}>
                                {status === 'overdue' ? '⚠️ ' : '📅 '}{formatDeadline(item.deadline)}
                                {item.due_time ? ` ${item.due_time}` : ''}
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
                {/* Move up/down */}
                {!item.archived && onMoveUp && !isFirst && (
                    <TouchableOpacity style={s.moveBtn} onPress={() => onMoveUp(item.id)}>
                        <Text style={s.moveBtnText}>↑</Text>
                    </TouchableOpacity>
                )}
                {!item.archived && onMoveDown && !isLast && (
                    <TouchableOpacity style={s.moveBtn} onPress={() => onMoveDown(item.id)}>
                        <Text style={s.moveBtnText}>↓</Text>
                    </TouchableOpacity>
                )}

                {/* Edit (not for archived) */}
                {!item.archived && (
                    <TouchableOpacity style={s.editBtn} onPress={() => onEdit(item)}>
                        <Text style={s.editBtnText}>✎</Text>
                    </TouchableOpacity>
                )}

                {/* Archive / Unarchive */}
                {item.archived ? (
                    <TouchableOpacity style={s.archiveBtn} onPress={() => onUnarchive?.(item.id)}>
                        <Text style={s.archiveBtnText}>↩</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={s.archiveBtn} onPress={() => onArchive(item.id)}>
                        <Text style={s.archiveBtnText}>📦</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item.id)}>
                    <Text style={s.deleteBtnText}>✕</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 10, overflow: 'hidden' },
    cardDone: { opacity: 0.65 },
    priorityBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    checkboxDone: { backgroundColor: C.success, borderColor: C.success },
    checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
    textRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    text: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
    textDone: { textDecorationLine: 'line-through', color: C.completed },
    recurBadge: { fontSize: 12 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    categoryBadge: { backgroundColor: C.primaryLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
    categoryText: { fontSize: 11, fontWeight: '600' },
    badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    badgeDone: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: C.border },
    badgeDoneText: { fontSize: 12, color: C.completed },
    actions: { flexDirection: 'row', gap: 6, flexShrink: 0 },
    moveBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    moveBtnText: { color: C.subtext, fontSize: 13, fontWeight: '700' },
    editBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
    editBtnText: { color: C.primary, fontSize: 15 },
    archiveBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    archiveBtnText: { fontSize: 14 },
    deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.dangerLight, justifyContent: 'center', alignItems: 'center' },
    deleteBtnText: { color: C.danger, fontSize: 13, fontWeight: '700' },
});
