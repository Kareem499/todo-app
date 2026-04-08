import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { UserInfo } from '../types';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '500399867620-hqsbphh8utgcmjapuscurt91emed1sjn.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URL = 'https://auth.expo.io/@Kareem499/todo-app';
const AUTH_TOKEN_KEY = 'google_auth_token';
const USER_INFO_KEY = 'google_user_info';
const API_URL = 'http://localhost:3000';

export function useAuth() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUrl: GOOGLE_REDIRECT_URL,
    });

    const loadStoredAuth = useCallback(async (onLoggedIn: (userId: string) => void) => {
        try {
            const storedUserInfo = await AsyncStorage.getItem(USER_INFO_KEY);
            if (storedUserInfo) {
                const parsed: UserInfo = JSON.parse(storedUserInfo);
                setUserInfo(parsed);
                onLoggedIn(parsed.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAuthToken = useCallback(async (token: string, onLoggedIn: (userId: string) => void) => {
        try {
            setLoading(true);
            const backendRes = await fetch(`${API_URL}/api/auth/google/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: token }),
            });
            const info: UserInfo = await backendRes.json();
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
            setUserInfo(info);
            onLoggedIn(info.id);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_INFO_KEY);
        setUserInfo(null);
    }, []);

    return { userInfo, loading, request, response, promptAsync, loadStoredAuth, handleAuthToken, signOut };
}
