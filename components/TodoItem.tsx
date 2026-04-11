import React, { useState } from 'react';
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

const PRIORITY_META: Record<Priority, { color: string; label: string }> = {
    high:   { color: '#F43F5E', label: 'High' },
    medium: { color: '#F59E0B', label: 'Med' },
    low:    { color: '#10B981', label: 'Low' },
    none:   { color: 'transparent', label: '' },
};

export function TodoItem({ item, onToggle, onEdit, onDelete, onArchive, onUnarchive, onMoveUp, onMoveDown, isFirst, isLast, C, scheme }: Props) {
    const [expanded, setExpanded] = useState(false);
    const s = makeStyles(C);
    const status = getDeadlineStatus(item.deadline);

    const deadlineColor: Record<string, string> = {
        overdue: '#F43F5E',
        today: '#F59E0B',
        soon: '#F59E0B',
        future: C.primary,
    };
    const deadlineBg: Record<string, string> = {
        overdue: scheme === 'dark' ? '#2D1520' : '#FFF1F3',
        today:   scheme === 'dark' ? '#292208' : '#FFFBEB',
        soon:    scheme === 'dark' ? '#292208' : '#FFFBEB',
        future:  C.primaryLight,
    };

    const pMeta = PRIORITY_META[item.priority ?? 'none'];
    const showPriBar = item.priority && item.priority !== 'none';

    return (
        <View style={[s.card, item.completed && s.cardDone]}>
            {/* Priority accent bar */}
            {showPriBar && <View style={[s.priBar, { backgroundColor: pMeta.color }]} />}

            {/* Checkbox */}
            <TouchableOpacity
                style={[s.checkbox, item.completed && { backgroundColor: C.success, borderColor: C.success }]}
                onPress={() => onToggle(item.id, item.completed)}
                activeOpacity={0.7}
            >
                {item.completed && <Text style={s.checkmark}>✓</Text>}
            </TouchableOpacity>

            {/* Content */}
            <TouchableOpacity style={{ flex: 1 }} onPress={() => !item.archived && onEdit(item)} activeOpacity={0.7}>
                <View style={s.textRow}>
                    <Text style={[s.text, item.completed && s.textDone]} numberOfLines={2}>
                        {item.text}
                    </Text>
                </View>

                {/* Meta badges */}
                <View style={s.metaRow}>
                    {item.priority && item.priority !== 'none' && (
                        <View style={[s.badge, { backgroundColor: pMeta.color + '22' }]}>
                            <View style={[s.priDot, { backgroundColor: pMeta.color }]} />
                            <Text style={[s.badgeText, { color: pMeta.color }]}>{pMeta.label}</Text>
                        </View>
                    )}
                    {item.category && (
                        <View style={[s.badge, { backgroundColor: C.primaryLight }]}>
                            <Text style={[s.badgeText, { color: C.primary }]}>📁 {item.category}</Text>
                        </View>
                    )}
                    {item.recurrence && !item.completed && (
                        <View style={[s.badge, { backgroundColor: C.primaryLight }]}>
                            <Text style={[s.badgeText, { color: C.primary }]}>🔄 {item.recurrence}</Text>
                        </View>
                    )}
                    {item.deadline && status && !item.completed && (
                        <View style={[s.badge, { backgroundColor: deadlineBg[status] }]}>
                            <Text style={[s.badgeText, { color: deadlineColor[status] }]}>
                                {status === 'overdue' ? '⚠️' : '📅'} {formatDeadline(item.deadline)}{item.due_time ? ` · ${item.due_time}` : ''}
                            </Text>
                        </View>
                    )}
                    {item.deadline && item.completed && (
                        <View style={[s.badge, { backgroundColor: C.border }]}>
                            <Text style={[s.badgeText, { color: C.completed }]}>📅 {formatDeadline(item.deadline)}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {/* Actions */}
            <View style={s.actions}>
                {/* Primary: delete */}
                {!item.archived && (
                    <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.7}>
                        <Text style={s.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                )}
                {item.archived && (
                    <>
                        <TouchableOpacity style={s.secondaryBtn} onPress={() => onUnarchive?.(item.id)} activeOpacity={0.7}>
                            <Text style={s.secondaryBtnText}>↩</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.7}>
                            <Text style={s.deleteBtnText}>✕</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* Overflow menu toggle */}
                {!item.archived && (
                    <TouchableOpacity
                        style={[s.moreBtn, expanded && s.moreBtnActive]}
                        onPress={() => setExpanded(v => !v)}
                        activeOpacity={0.7}
                    >
                        <Text style={[s.moreBtnText, expanded && { color: C.primary }]}>⋯</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Overflow panel */}
            {expanded && !item.archived && (
                <View style={s.overflow}>
                    <TouchableOpacity style={s.overflowBtn} onPress={() => { onEdit(item); setExpanded(false); }}>
                        <Text style={s.overflowIcon}>✎</Text>
                        <Text style={s.overflowLabel}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.overflowBtn} onPress={() => { onArchive(item.id); setExpanded(false); }}>
                        <Text style={s.overflowIcon}>📦</Text>
                        <Text style={s.overflowLabel}>Archive</Text>
                    </TouchableOpacity>
                    {onMoveUp && !isFirst && (
                        <TouchableOpacity style={s.overflowBtn} onPress={() => { onMoveUp(item.id); setExpanded(false); }}>
                            <Text style={s.overflowIcon}>↑</Text>
                            <Text style={s.overflowLabel}>Move up</Text>
                        </TouchableOpacity>
                    )}
                    {onMoveDown && !isLast && (
                        <TouchableOpacity style={s.overflowBtn} onPress={() => { onMoveDown(item.id); setExpanded(false); }}>
                            <Text style={s.overflowIcon}>↓</Text>
                            <Text style={s.overflowLabel}>Move down</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    card: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: C.card, borderRadius: 16,
        padding: 14, marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
        gap: 12,
        overflow: 'hidden',
        flexWrap: 'wrap',
    },
    cardDone: { opacity: 0.6 },

    priBar: {
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 4,
        borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
    },

    checkbox: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: C.border,
        justifyContent: 'center', alignItems: 'center',
        flexShrink: 0, marginTop: 1,
    },
    checkmark: { color: '#fff', fontSize: 11, fontWeight: '800' },

    textRow: { flexDirection: 'row', alignItems: 'center' },
    text: { fontSize: 15, color: C.text, fontWeight: '500', lineHeight: 21 },
    textDone: { textDecorationLine: 'line-through', color: C.completed },

    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
    badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
    badgeText: { fontSize: 11, fontWeight: '600' },
    priDot: { width: 6, height: 6, borderRadius: 3 },

    actions: { flexDirection: 'row', gap: 6, flexShrink: 0, alignItems: 'center', marginLeft: 'auto' },

    deleteBtn: {
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: C.dangerLight,
        justifyContent: 'center', alignItems: 'center',
    },
    deleteBtnText: { color: C.danger, fontSize: 12, fontWeight: '700' },

    secondaryBtn: {
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
        justifyContent: 'center', alignItems: 'center',
    },
    secondaryBtnText: { fontSize: 14, color: C.subtext },

    moreBtn: {
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
        justifyContent: 'center', alignItems: 'center',
    },
    moreBtnActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
    moreBtnText: { color: C.subtext, fontSize: 16, fontWeight: '700', lineHeight: 18 },

    overflow: {
        flexDirection: 'row', gap: 6,
        width: '100%',
        paddingTop: 10,
        borderTopWidth: 1, borderTopColor: C.border,
        flexWrap: 'wrap',
    },
    overflowBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 10, backgroundColor: C.bg,
        borderWidth: 1, borderColor: C.border,
    },
    overflowIcon: { fontSize: 13 },
    overflowLabel: { fontSize: 12, color: C.text, fontWeight: '600' },
});
