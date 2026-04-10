import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import { UserInfo } from '../types';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '500399867620-hqsbphh8utgcmjapuscurt91emed1sjn.apps.googleusercontent.com';
const JWT_TOKEN_KEY = 'jwt_token';
const USER_INFO_KEY = 'google_user_info';
const API_URL = 'https://todo-app-production-e4e4.up.railway.app';

export function useAuth() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Only used on native — web uses backend-driven redirect flow
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUri: 'https://auth.expo.io/@Kareem499/todo-app',
    });

    const saveSession = async (token: string, user: UserInfo) => {
        await AsyncStorage.setItem(JWT_TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
        setJwtToken(token);
        setUserInfo(user);
    };

    const loadStoredAuth = useCallback(async () => {
        try {
            // Web: check if Google redirected back with JWT in URL params
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const jwt = params.get('jwt');
                const userStr = params.get('user');
                if (jwt && userStr) {
                    const user: UserInfo = JSON.parse(userStr);
                    await saveSession(jwt, user);
                    // Clean JWT from URL without triggering a reload
                    window.history.replaceState({}, '', window.location.pathname);
                    return;
                }
                if (params.get('error')) {
                    console.error('Auth error from backend:', params.get('error'));
                    window.history.replaceState({}, '', window.location.pathname);
                }
            }

            // Restore persisted session
            const [storedToken, storedUserInfo] = await Promise.all([
                AsyncStorage.getItem(JWT_TOKEN_KEY),
                AsyncStorage.getItem(USER_INFO_KEY),
            ]);
            if (storedToken && storedUserInfo) {
                const parsed: UserInfo = JSON.parse(storedUserInfo);
                setJwtToken(storedToken);
                setUserInfo(parsed);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Web: navigate to backend which handles the full OAuth flow
    const signInWeb = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.location.href = `${API_URL}/auth/google/start`;
        }
    }, []);

    // Native: exchange Google access token for our JWT
    const handleAuthToken = useCallback(async (googleToken: string): Promise<string | null> => {
        try {
            setLoading(true);
            const backendRes = await fetch(`${API_URL}/api/auth/google/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: googleToken }),
            });
            const data = await backendRes.json();
            if (!data.token || !data.user) { console.error('Unexpected auth response:', data); return null; }
            await saveSession(data.token, data.user);
            return data.token;
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Email OTP auth
    const sendEmailCode = useCallback(async (email: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/api/auth/email/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            return res.ok;
        } catch { return false; }
    }, []);

    const verifyEmailCode = useCallback(async (email: string, code: string): Promise<boolean> => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/auth/email/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const data = await res.json();
            if (!data.token || !data.user) return false;
            await saveSession(data.token, data.user);
            return true;
        } catch { return false; }
        finally { setLoading(false); }
    }, []);

    const signOut = useCallback(async () => {
        await AsyncStorage.removeItem(JWT_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_INFO_KEY);
        setJwtToken(null);
        setUserInfo(null);
    }, []);

    // Sign in handler — web uses redirect, native uses expo-auth-session popup
    const onSignIn = Platform.OS === 'web' ? signInWeb : () => promptAsync();

    return { userInfo, jwtToken, loading, request, response, promptAsync, onSignIn, loadStoredAuth, handleAuthToken, sendEmailCode, verifyEmailCode, signOut };
}
