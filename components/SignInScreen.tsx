import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme } from '../constants/theme';

interface Props {
    request: any;
    onSignIn: () => void;
    onSendCode: (email: string) => Promise<boolean>;
    onVerifyCode: (email: string, code: string) => Promise<boolean>;
    C: Theme;
}

export function SignInScreen({ request, onSignIn, onSendCode, onVerifyCode, C }: Props) {
    const [mode, setMode] = useState<'choose' | 'email' | 'code'>('choose');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const s = makeStyles(C);

    const handleSendCode = async () => {
        if (!email.includes('@')) { setError('Enter a valid email'); return; }
        setLoading(true);
        setError('');
        const ok = await onSendCode(email);
        setLoading(false);
        if (ok) setMode('code');
        else setError('Failed to send code. Try again.');
    };

    const handleVerify = async () => {
        if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
        setLoading(true);
        setError('');
        const ok = await onVerifyCode(email, code);
        setLoading(false);
        if (!ok) setError('Invalid or expired code. Try again.');
    };

    return (
        <View style={s.bg}>
            <View style={s.card}>
                <View style={s.iconCircle}>
                    <Text style={s.iconText}>✓</Text>
                </View>
                <Text style={s.title}>My Todo App</Text>
                <Text style={s.subtitle}>Stay organized, get things done.</Text>

                {mode === 'choose' && (
                    <>
                        <TouchableOpacity style={s.googleButton} onPress={onSignIn}>
                            <Image
                                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                                style={s.googleLogo}
                            />
                            <Text style={s.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <View style={s.divider}>
                            <View style={s.dividerLine} />
                            <Text style={s.dividerText}>or</Text>
                            <View style={s.dividerLine} />
                        </View>

                        <TouchableOpacity style={s.emailButton} onPress={() => setMode('email')}>
                            <Text style={s.emailButtonText}>Continue with Email</Text>
                        </TouchableOpacity>
                    </>
                )}

                {mode === 'email' && (
                    <>
                        <Text style={s.stepLabel}>Enter your email</Text>
                        <TextInput
                            style={s.input}
                            placeholder="you@example.com"
                            placeholderTextColor={C.subtext}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoFocus
                        />
                        {error ? <Text style={s.error}>{error}</Text> : null}
                        <TouchableOpacity style={s.primaryButton} onPress={handleSendCode} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>Send Code</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setMode('choose'); setError(''); }}>
                            <Text style={s.back}>← Back</Text>
                        </TouchableOpacity>
                    </>
                )}

                {mode === 'code' && (
                    <>
                        <Text style={s.stepLabel}>Check your email</Text>
                        <Text style={s.stepSub}>We sent a 6-digit code to {email}</Text>
                        <TextInput
                            style={[s.input, s.codeInput]}
                            placeholder="000000"
                            placeholderTextColor={C.subtext}
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus
                        />
                        {error ? <Text style={s.error}>{error}</Text> : null}
                        <TouchableOpacity style={s.primaryButton} onPress={handleVerify} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>Verify Code</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setMode('email'); setCode(''); setError(''); }}>
                            <Text style={s.back}>← Resend code</Text>
                        </TouchableOpacity>
                    </>
                )}
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
    googleLogo: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { fontSize: 16, color: C.text, fontWeight: '600' },
    divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { marginHorizontal: 12, color: C.subtext, fontSize: 13 },
    emailButton: { backgroundColor: C.bg, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: C.border, width: '100%', alignItems: 'center' },
    emailButtonText: { fontSize: 16, color: C.text, fontWeight: '600' },
    stepLabel: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6, alignSelf: 'flex-start' },
    stepSub: { fontSize: 13, color: C.subtext, marginBottom: 16, alignSelf: 'flex-start' },
    input: { width: '100%', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: C.text, backgroundColor: C.bg, marginBottom: 12 },
    codeInput: { textAlign: 'center', fontSize: 28, fontWeight: '700', letterSpacing: 8 },
    primaryButton: { backgroundColor: C.primary, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    error: { color: '#ef4444', fontSize: 13, marginBottom: 8, alignSelf: 'flex-start' },
    back: { color: C.subtext, fontSize: 14, marginTop: 4 },
});
