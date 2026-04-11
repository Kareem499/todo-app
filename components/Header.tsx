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
    const firstName = userInfo.name.split(' ')[0];
    const allDone = totalCount > 0 && completedCount === totalCount;

    return (
        <View style={s.header}>
            <View style={s.left}>
                {userInfo.picture
                    ? <Image source={{ uri: userInfo.picture }} style={s.avatar} />
                    : (
                        <View style={s.avatarFallback}>
                            <Text style={s.avatarInitial}>{userInfo.name[0].toUpperCase()}</Text>
                        </View>
                    )
                }
                <View>
                    <Text style={s.greeting}>
                        {allDone ? '🎉 All done' : `Hello, ${firstName}`}
                    </Text>
                    <Text style={s.taskCount}>
                        {totalCount === 0
                            ? 'No tasks yet'
                            : `${completedCount} of ${totalCount} completed`}
                    </Text>
                </View>
            </View>
            <TouchableOpacity style={s.signOutBtn} onPress={onSignOut} activeOpacity={0.7}>
                <Text style={s.signOutText}>Sign out</Text>
            </TouchableOpacity>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 18, paddingVertical: 14,
        backgroundColor: C.card,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 42, height: 42, borderRadius: 21 },
    avatarFallback: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: C.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarInitial: { color: '#fff', fontSize: 17, fontWeight: '700' },
    greeting: { fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
    taskCount: { fontSize: 12, color: C.subtext, marginTop: 1 },
    signOutBtn: {
        paddingVertical: 7, paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: C.bg,
        borderWidth: 1, borderColor: C.border,
    },
    signOutText: { fontSize: 12, color: C.subtext, fontWeight: '600' },
});
