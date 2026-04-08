import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { UserInfo } from '../types';
import { Theme } from '../constants/theme';

interface Props {
    userInfo: UserInfo;
    completedCount: number;
    totalCount: number;
    onSignOut: () => void;
    C: Theme;
}

export function Header({ userInfo, completedCount, totalCount, onSignOut, C }: Props) {
    const s = makeStyles(C);
    return (
        <View style={s.header}>
            <View style={s.left}>
                {userInfo.picture
                    ? <Image source={{ uri: userInfo.picture }} style={s.avatar} />
                    : <View style={s.avatarFallback}><Text style={s.avatarInitial}>{userInfo.name[0]}</Text></View>
                }
                <View>
                    <Text style={s.greeting}>Hello, {userInfo.name.split(' ')[0]} 👋</Text>
                    <Text style={s.taskCount}>{completedCount}/{totalCount} tasks done</Text>
                </View>
            </View>
            <TouchableOpacity style={s.signOutButton} onPress={onSignOut}>
                <Text style={s.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
    left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    avatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
    greeting: { fontSize: 16, fontWeight: '700', color: C.text },
    taskCount: { fontSize: 12, color: C.subtext, marginTop: 2 },
    signOutButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
    signOutText: { fontSize: 13, color: C.subtext, fontWeight: '500' },
});
