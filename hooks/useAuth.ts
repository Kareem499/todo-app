import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { UserInfo } from '../types';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '500399867620-hqsbphh8utgcmjapuscurt91emed1sjn.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URL = 'https://auth.expo.io/@Kareem499/todo-app';
const JWT_TOKEN_KEY = 'jwt_token';
const USER_INFO_KEY = 'google_user_info';
const API_URL = 'http://localhost:3000';

export function useAuth() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUrl: GOOGLE_REDIRECT_URL,
    });

    // Restores session from storage — no callback needed, jwtToken state drives the fetch
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

    // Exchanges Google access token for our JWT — returns the JWT so caller can use it immediately
    const handleAuthToken = useCallback(async (googleToken: string): Promise<string | null> => {
        try {
            setLoading(true);
            const backendRes = await fetch(`${API_URL}/api/auth/google/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: googleToken }),
            });
            const data = await backendRes.json();
            if (!data.token || !data.user) {
                console.error('Unexpected auth response:', data);
                return null;
            }
            const { token: jwtTok, user } = data;
            await AsyncStorage.setItem(JWT_TOKEN_KEY, jwtTok);
            await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
            setJwtToken(jwtTok);
            setUserInfo(user);
            return jwtTok;
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

    return { userInfo, jwtToken, loading, request, response, promptAsync, loadStoredAuth, handleAuthToken, signOut };
}
