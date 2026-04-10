import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import { Platform } from 'react-native';
import { UserInfo } from '../types';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '500399867620-hqsbphh8utgcmjapuscurt91emed1sjn.apps.googleusercontent.com';
const JWT_TOKEN_KEY = 'jwt_token';
const USER_INFO_KEY = 'google_user_info';
const API_URL = 'https://todo-app-production-e4e4.up.railway.app';

// Web uses authorization code flow (Google deprecated implicit/token flow for web)
// Native uses the Expo auth proxy with the token flow
const isWeb = Platform.OS === 'web';

function getRedirectUri(): string {
    if (!isWeb) return 'https://auth.expo.io/@Kareem499/todo-app';
    if (typeof window === 'undefined') return 'https://kareem499.github.io/todo-app';
    // Use the current page URL so Google redirects back to the app
    return window.location.origin + window.location.pathname.replace(/\/$/, '');
}

const redirectUri = getRedirectUri();

export function useAuth() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUri,
        // Use code flow on web to comply with Google's OAuth policy
        responseType: isWeb ? ResponseType.Code : ResponseType.Token,
        usePKCE: isWeb,
    });

    const loadStoredAuth = useCallback(async () => {
        try {
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

    const saveSession = async (data: { token: string; user: UserInfo }) => {
        await AsyncStorage.setItem(JWT_TOKEN_KEY, data.token);
        await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(data.user));
        setJwtToken(data.token);
        setUserInfo(data.user);
    };

    // Web: exchange auth code for JWT via backend
    const handleAuthCode = useCallback(async (code: string, codeVerifier?: string): Promise<string | null> => {
        try {
            setLoading(true);
            const backendRes = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirectUri, codeVerifier }),
            });
            const data = await backendRes.json();
            if (!data.token || !data.user) { console.error('Unexpected auth response:', data); return null; }
            await saveSession(data);
            return data.token;
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Native: exchange Google access token for JWT via backend
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
            await saveSession(data);
            return data.token;
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        await AsyncStorage.multiRemove([JWT_TOKEN_KEY, USER_INFO_KEY]);
        setJwtToken(null);
        setUserInfo(null);
    }, []);

    return { userInfo, jwtToken, loading, request, response, promptAsync, loadStoredAuth, handleAuthCode, handleAuthToken, signOut };
}
