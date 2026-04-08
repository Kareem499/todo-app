import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

interface Props {
    request: any;
    onSignIn: () => void;
    C: Theme;
}

export function SignInScreen({ request, onSignIn, C }: Props) {
    const s = makeStyles(C);
    return (
        <View style={s.bg}>
            <View style={s.card}>
                <View style={s.iconCircle}>
                    <Text style={s.iconText}>✓</Text>
                </View>
                <Text style={s.title}>My Todo App</Text>
                <Text style={s.subtitle}>Stay organized, get things done.</Text>
                <TouchableOpacity
                    style={[s.googleButton, !request && s.googleButtonDisabled]}
                    onPress={onSignIn}
                    disabled={!request}
                >
                    <Image
                        source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                        style={s.googleLogo}
                    />
                    <Text style={s.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    bg: { flex: 1, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', padding: 24 },
    card: { backgroundColor: C.card, borderRadius: 24, padding: 36, alignItems: 'center', width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
    iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    iconText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
    title: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 8 },
    subtitle: { fontSize: 15, color: C.subtext, marginBottom: 32, textAlign: 'center' },
    googleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: C.border, width: '100%', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    googleButtonDisabled: { opacity: 0.5 },
    googleLogo: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { fontSize: 16, color: C.text, fontWeight: '600' },
});
