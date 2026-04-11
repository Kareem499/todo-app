import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Theme } from '../constants/theme';
import { Priority, Recurrence } from '../types';
import { formatDeadline } from '../utils/deadline';

interface Props {
    text: string;
    onChangeText: (v: string) => void;
    deadline: string;
    onChangeDeadline: (v: string) => void;
    onClearDeadline: () => void;
    dueTime: string;
    onChangeDueTime: (v: string) => void;
    onClearDueTime: () => void;
    priority: Priority;
    onChangePriority: (v: Priority) => void;
    category: string;
    onChangeCategory: (v: string) => void;
    recurrence: Recurrence;
    onChangeRecurrence: (v: Recurrence) => void;
    onSubmit: () => void;
    isEditing: boolean;
    onCancelEdit: () => void;
    categories: string[];
    C: Theme;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
    { value: 'none', label: 'None', color: '#8A8FA8' },
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FF9500' },
    { value: 'high', label: 'High', color: '#FF5C5C' },
];

const RECURRENCES: { value: Recurrence; label: string }[] = [
    { value: null, label: 'None' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
];

export function InputBar({
    text, onChangeText,
    deadline, onChangeDeadline, onClearDeadline,
    dueTime, onChangeDueTime, onClearDueTime,
    priority, onChangePriority,
    category, onChangeCategory,
    recurrence, onChangeRecurrence,
    onSubmit, isEditing, onCancelEdit,
    categories, C,
}: Props) {
    const dateInputRef = useRef<any>(null);
    const timeInputRef = useRef<any>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [showCategoryInput, setShowCategoryInput] = useState(false);
    const s = makeStyles(C);

    const hasOptions = priority !== 'none' || !!category || !!recurrence || !!dueTime;

    return (
        <View style={s.container}>
            {isEditing && (
                <View style={s.editingBanner}>
                    <Text style={s.editingText}>✎ Editing task</Text>
                    <TouchableOpacity onPress={onCancelEdit}>
                        <Text style={s.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Main input row */}
            <View style={s.row}>
                <TextInput
                    style={s.input}
                    placeholder="Add a new task..."
                    placeholderTextColor={C.subtext}
                    value={text}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSubmit}
                    returnKeyType="done"
                />

                {/* Hidden date input (web) */}
                {/* @ts-ignore */}
                <input
                    ref={dateInputRef}
                    type="date"
                    value={deadline}
                    onChange={(e: any) => onChangeDeadline(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden' }}
                />
                {/* Hidden time input (web) */}
                {/* @ts-ignore */}
                <input
                    ref={timeInputRef}
                    type="time"
                    value={dueTime}
                    onChange={(e: any) => onChangeDueTime(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden' }}
                />

                <TouchableOpacity
                    style={[s.iconBtn, !!deadline && s.iconBtnActive]}
                    onPress={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                >
                    <Text style={s.iconBtnText}>📅</Text>
                    {deadline ? <View style={[s.dot, { backgroundColor: C.primary }]} /> : null}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[s.iconBtn, (showOptions || hasOptions) && s.iconBtnActive]}
                    onPress={() => setShowOptions(v => !v)}
                >
                    <Text style={s.iconBtnText}>⚙️</Text>
                    {hasOptions ? <View style={[s.dot, { backgroundColor: C.primary }]} /> : null}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[s.addButton, !text.trim() && s.addButtonDisabled]}
                    onPress={onSubmit}
                    disabled={!text.trim()}
                >
                    <Text style={s.addButtonText}>{isEditing ? '✓' : '+'}</Text>
                </TouchableOpacity>
            </View>

            {/* Expanded options */}
            {showOptions && (
                <View style={s.options}>
                    {/* Priority */}
                    <View style={s.optionRow}>
                        <Text style={s.optionLabel}>Priority</Text>
                        <View style={s.pillRow}>
                            {PRIORITIES.map(p => (
                                <TouchableOpacity
                                    key={p.value}
                                    style={[s.pill, priority === p.value && { backgroundColor: p.color + '33', borderColor: p.color }]}
                                    onPress={() => onChangePriority(p.value)}
                                >
                                    <View style={[s.priorityDot, { backgroundColor: p.color }]} />
                                    <Text style={[s.pillText, priority === p.value && { color: p.color, fontWeight: '700' }]}>
                                        {p.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Recurrence */}
                    <View style={s.optionRow}>
                        <Text style={s.optionLabel}>Repeat</Text>
                        <View style={s.pillRow}>
                            {RECURRENCES.map(r => (
                                <TouchableOpacity
                                    key={String(r.value)}
                                    style={[s.pill, recurrence === r.value && s.pillActive]}
                                    onPress={() => onChangeRecurrence(r.value)}
                                >
                                    <Text style={[s.pillText, recurrence === r.value && s.pillTextActive]}>
                                        {r.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Time */}
                    <View style={s.optionRow}>
                        <Text style={s.optionLabel}>Time</Text>
                        <TouchableOpacity
                            style={[s.pill, !!dueTime && s.pillActive]}
                            onPress={() => timeInputRef.current?.showPicker?.() ?? timeInputRef.current?.click()}
                        >
                            <Text style={[s.pillText, !!dueTime && s.pillTextActive]}>
                                {dueTime ? `⏰ ${dueTime}` : '⏰ Set time'}
                            </Text>
                        </TouchableOpacity>
                        {dueTime ? (
                            <TouchableOpacity onPress={onClearDueTime} style={s.clearBtn}>
                                <Text style={s.clearBtnText}>✕</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Category */}
                    <View style={s.optionRow}>
                        <Text style={s.optionLabel}>Category</Text>
                        <View style={s.pillRow}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[s.pill, category === cat && s.pillActive]}
                                    onPress={() => { onChangeCategory(category === cat ? '' : cat); setShowCategoryInput(false); }}
                                >
                                    <Text style={[s.pillText, category === cat && s.pillTextActive]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={s.pill}
                                onPress={() => setShowCategoryInput(v => !v)}
                            >
                                <Text style={s.pillText}>+ New</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {showCategoryInput && (
                        <TextInput
                            style={s.categoryInput}
                            placeholder="Category name..."
                            placeholderTextColor={C.subtext}
                            value={category}
                            onChangeText={onChangeCategory}
                            onSubmitEditing={() => setShowCategoryInput(false)}
                            returnKeyType="done"
                            autoFocus
                        />
                    )}
                </View>
            )}

            {/* Active chips row */}
            {(deadline || dueTime || (priority !== 'none') || category || recurrence) ? (
                <View style={s.chipsRow}>
                    {deadline ? (
                        <View style={s.chip}>
                            <Text style={s.chipText}>📅 {formatDeadline(deadline)}</Text>
                            <TouchableOpacity onPress={onClearDeadline}><Text style={s.chipClear}>✕</Text></TouchableOpacity>
                        </View>
                    ) : null}
                    {dueTime && !showOptions ? (
                        <View style={s.chip}>
                            <Text style={s.chipText}>⏰ {dueTime}</Text>
                            <TouchableOpacity onPress={onClearDueTime}><Text style={s.chipClear}>✕</Text></TouchableOpacity>
                        </View>
                    ) : null}
                    {priority !== 'none' ? (
                        <View style={[s.chip, { backgroundColor: PRIORITIES.find(p => p.value === priority)!.color + '22' }]}>
                            <Text style={[s.chipText, { color: PRIORITIES.find(p => p.value === priority)!.color }]}>
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </Text>
                        </View>
                    ) : null}
                    {category ? (
                        <View style={s.chip}>
                            <Text style={s.chipText}>📁 {category}</Text>
                            <TouchableOpacity onPress={() => onChangeCategory('')}><Text style={s.chipClear}>✕</Text></TouchableOpacity>
                        </View>
                    ) : null}
                    {recurrence ? (
                        <View style={s.chip}>
                            <Text style={s.chipText}>🔄 {recurrence}</Text>
                            <TouchableOpacity onPress={() => onChangeRecurrence(null)}><Text style={s.chipClear}>✕</Text></TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    container: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 12, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
    editingBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
    editingText: { fontSize: 12, color: C.primary, fontWeight: '600' },
    cancelText: { fontSize: 12, color: C.danger, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 8, alignItems: 'center', maxWidth: 900, width: '100%', alignSelf: 'center' },
    input: { flex: 1, backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
    iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    iconBtnActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
    iconBtnText: { fontSize: 18 },
    dot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 6, right: 6 },
    addButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
    addButtonDisabled: { backgroundColor: C.border },
    addButtonText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },

    options: { marginTop: 10, maxWidth: 900, width: '100%', alignSelf: 'center', gap: 10 },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    optionLabel: { fontSize: 12, color: C.subtext, fontWeight: '600', width: 58 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, gap: 4 },
    pillActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
    pillText: { fontSize: 12, color: C.subtext, fontWeight: '500' },
    pillTextActive: { color: C.primary, fontWeight: '700' },
    priorityDot: { width: 8, height: 8, borderRadius: 4 },
    clearBtn: { padding: 4 },
    clearBtnText: { fontSize: 12, color: C.subtext },
    categoryInput: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: C.text, backgroundColor: C.bg, marginTop: 4 },

    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, maxWidth: 900, width: '100%', alignSelf: 'center' },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryLight, borderRadius: 20, paddingVertical: 4, paddingLeft: 10, paddingRight: 6, gap: 5 },
    chipText: { fontSize: 12, color: C.primary, fontWeight: '600' },
    chipClear: { fontSize: 11, color: C.primary, fontWeight: '700', paddingHorizontal: 2 },
});
