import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NotificationSummary } from '../types';
import { Theme } from '../constants/theme';

interface Props {
    permission: 'granted' | 'denied' | 'default' | 'unsupported';
    banner: NotificationSummary | null;
    onDismiss: () => void;
    C: Theme;
    scheme: 'light' | 'dark';
}

export function NotificationBanner({ permission, banner, onDismiss, C, scheme }: Props) {
    const s = makeStyles(C, scheme);
    return (
        <>
            {permission === 'denied' && (
                <View style={s.deniedBanner}>
                    <Text style={s.deniedText}>🔕 Browser notifications are blocked. Enable them in your browser settings to get deadline reminders.</Text>
                </View>
            )}
            {banner && (
                <View style={s.alertBanner}>
                    <View style={{ flex: 1 }}>
                        {banner.overdue.length > 0 && (
                            <Text style={s.alertText}>
                                ⚠️ <Text style={{ fontWeight: '700' }}>{banner.overdue.length} overdue</Text>
                                {' '}· {banner.overdue.map(t => t.text).join(', ')}
                            </Text>
                        )}
                        {banner.today.length > 0 && (
                            <Text style={[s.alertText, { color: '#FF9500' }]}>
                                📅 <Text style={{ fontWeight: '700' }}>{banner.today.length} due today</Text>
                                {' '}· {banner.today.map(t => t.text).join(', ')}
                            </Text>
                        )}
                        {banner.tomorrow.length > 0 && (
                            <Text style={[s.alertText, { color: C.primary }]}>
                                🔔 <Text style={{ fontWeight: '700' }}>{banner.tomorrow.length} due tomorrow</Text>
                                {' '}· {banner.tomorrow.map(t => t.text).join(', ')}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity onPress={onDismiss} style={s.dismiss}>
                        <Text style={s.dismissText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}
        </>
    );
}

const makeStyles = (C: Theme, scheme: 'light' | 'dark') => StyleSheet.create({
    deniedBanner: { backgroundColor: scheme === 'dark' ? '#2A1F00' : '#FFF8E1', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#3A2E00' : '#FFE082' },
    deniedText: { fontSize: 12, color: scheme === 'dark' ? '#FFD54F' : '#795548' },
    alertBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: scheme === 'dark' ? '#2A1A1A' : '#FFF5F5', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#3A2020' : '#FFCDD2', gap: 8 },
    alertText: { fontSize: 13, color: C.danger, marginBottom: 2, flexShrink: 1 },
    dismiss: { padding: 4 },
    dismissText: { fontSize: 14, color: C.subtext, fontWeight: '700' },
});
