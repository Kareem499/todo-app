import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';
import { formatDeadline } from '../utils/deadline';

interface Props {
    text: string;
    onChangeText: (v: string) => void;
    deadline: string;
    onChangeDeadline: (v: string) => void;
    onClearDeadline: () => void;
    onSubmit: () => void;
    isEditing: boolean;
    onCancelEdit: () => void;
    C: Theme;
}

export function InputBar({ text, onChangeText, deadline, onChangeDeadline, onClearDeadline, onSubmit, isEditing, onCancelEdit, C }: Props) {
    const dateInputRef = useRef<any>(null);
    const s = makeStyles(C);

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
                {/* @ts-ignore */}
                <input
                    ref={dateInputRef}
                    type="date"
                    value={deadline}
                    onChange={(e: any) => onChangeDeadline(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden' }}
                />
                <TouchableOpacity
                    style={[s.dateBtn, !!deadline && s.dateBtnActive]}
                    onPress={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                >
                    <Text style={s.dateBtnText}>📅</Text>
                    {deadline ? <Text style={s.dateBtnDot}>·</Text> : null}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.addButton, !text.trim() && s.addButtonDisabled]}
                    onPress={onSubmit}
                    disabled={!text.trim()}
                >
                    <Text style={s.addButtonText}>{isEditing ? '✓' : '+'}</Text>
                </TouchableOpacity>
            </View>
            {deadline ? (
                <View style={s.chip}>
                    <Text style={s.chipText}>📅 {formatDeadline(deadline)}</Text>
                    <TouchableOpacity onPress={onClearDeadline}>
                        <Text style={s.chipClear}>✕</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    container: { padding: 12, paddingHorizontal: 15, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
    editingBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
    editingText: { fontSize: 12, color: C.primary, fontWeight: '600' },
    cancelText: { fontSize: 12, color: C.danger, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 10, alignItems: 'center', maxWidth: 900, width: '100%', alignSelf: 'center' },
    input: { flex: 1, backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
    dateBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    dateBtnActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
    dateBtnText: { fontSize: 20 },
    dateBtnDot: { fontSize: 8, color: C.primary, position: 'absolute', bottom: 6, fontWeight: '900' },
    addButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
    addButtonDisabled: { backgroundColor: C.border },
    addButtonText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },
    chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 8, backgroundColor: C.primaryLight, borderRadius: 20, paddingVertical: 4, paddingLeft: 10, paddingRight: 6, gap: 6, maxWidth: 900, width: '100%' },
    chipText: { fontSize: 13, color: C.primary, fontWeight: '600' },
    chipClear: { fontSize: 13, color: C.primary, fontWeight: '700', paddingHorizontal: 4 },
});
