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
        setLoading(true); setError('');
        const ok = await onSendCode(email);
        setLoading(false);
        if (ok) setMode('code');
        else setError('Failed to send code. Try again.');
    };

    const handleVerify = async () => {
        if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
        setLoading(true); setError('');
        const ok = await onVerifyCode(email, code);
        setLoading(false);
        if (!ok) setError('Invalid or expired code. Try again.');
    };

    return (
        <View style={s.bg}>
            {/* Decorative circles */}
            <View style={[s.circle, s.circleTop]} />
            <View style={[s.circle, s.circleBottom]} />

            <View style={s.card}>
                {/* Logo */}
                <View style={s.logoWrap}>
                    <View style={s.logoOuter}>
                        <View style={s.logoInner}>
                            <Text style={s.logoText}>✓</Text>
                        </View>
                    </View>
                </View>

                <Text style={s.title}>My Todo App</Text>
                <Text style={s.subtitle}>Stay organized, get things done.</Text>

                {mode === 'choose' && (
                    <>
                        <TouchableOpacity style={s.googleBtn} onPress={onSignIn} activeOpacity={0.85}>
                            <Image
                                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                                style={s.googleLogo}
                            />
                            <Text style={s.googleBtnText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <View style={s.divider}>
                            <View style={s.dividerLine} />
                            <Text style={s.dividerText}>or</Text>
                            <View style={s.dividerLine} />
                        </View>

                        <TouchableOpacity style={s.emailBtn} onPress={() => setMode('email')} activeOpacity={0.85}>
                            <Text style={s.emailBtnText}>✉️  Continue with Email</Text>
                        </TouchableOpacity>
                    </>
                )}

                {mode === 'email' && (
                    <>
                        <View style={s.stepHeader}>
                            <Text style={s.stepLabel}>Enter your email</Text>
                        </View>
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
                        <TouchableOpacity style={s.primaryBtn} onPress={handleSendCode} disabled={loading} activeOpacity={0.85}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Send Code →</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setMode('choose'); setError(''); }} style={s.backBtn}>
                            <Text style={s.backText}>← Back</Text>
                        </TouchableOpacity>
                    </>
                )}

                {mode === 'code' && (
                    <>
                        <View style={s.stepHeader}>
                            <Text style={s.stepLabel}>Check your inbox</Text>
                            <Text style={s.stepSub}>6-digit code sent to {email}</Text>
                        </View>
                        <TextInput
                            style={[s.input, s.codeInput]}
                            placeholder="——————"
                            placeholderTextColor={C.border}
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus
                        />
                        {error ? <Text style={s.error}>{error}</Text> : null}
                        <TouchableOpacity style={s.primaryBtn} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Verify & Sign In →</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setMode('email'); setCode(''); setError(''); }} style={s.backBtn}>
                            <Text style={s.backText}>↩ Resend code</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const makeStyles = (C: Theme) => StyleSheet.create({
    bg: {
        flex: 1,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    circleTop: { width: 400, height: 400, top: -160, right: -100 },
    circleBottom: { width: 300, height: 300, bottom: -120, left: -80 },

    card: {
        backgroundColor: C.card,
        borderRadius: 28,
        padding: 36,
        alignItems: 'center',
        width: '100%',
        maxWidth: 420,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        elevation: 16,
    },

    logoWrap: { marginBottom: 24 },
    logoOuter: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: C.primaryLight,
        justifyContent: 'center', alignItems: 'center',
    },
    logoInner: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: C.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    logoText: { fontSize: 30, color: '#fff', fontWeight: '800' },

    title: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 6, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: C.subtext, marginBottom: 32, textAlign: 'center' },

    googleBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.bg,
        paddingVertical: 14, paddingHorizontal: 20,
        borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
        width: '100%', justifyContent: 'center', gap: 10,
    },
    googleLogo: { width: 20, height: 20 },
    googleBtnText: { fontSize: 15, color: C.text, fontWeight: '600' },

    divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 14 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { marginHorizontal: 12, color: C.subtext, fontSize: 12, fontWeight: '500' },

    emailBtn: {
        backgroundColor: C.primary,
        paddingVertical: 14, paddingHorizontal: 20,
        borderRadius: 14, width: '100%', alignItems: 'center',
    },
    emailBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },

    stepHeader: { width: '100%', marginBottom: 16 },
    stepLabel: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 4 },
    stepSub: { fontSize: 13, color: C.subtext },

    input: {
        width: '100%', borderWidth: 1.5, borderColor: C.border,
        borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16,
        fontSize: 15, color: C.text, backgroundColor: C.bg, marginBottom: 14,
    },
    codeInput: {
        textAlign: 'center', fontSize: 32, fontWeight: '700',
        letterSpacing: 12, paddingVertical: 16,
    },

    primaryBtn: {
        backgroundColor: C.primary,
        paddingVertical: 14, borderRadius: 14,
        width: '100%', alignItems: 'center', marginBottom: 12,
    },
    primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    error: { color: '#ef4444', fontSize: 13, marginBottom: 10, alignSelf: 'flex-start', fontWeight: '500' },

    backBtn: { paddingVertical: 8 },
    backText: { color: C.subtext, fontSize: 14 },
});
