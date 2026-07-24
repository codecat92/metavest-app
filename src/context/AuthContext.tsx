import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/api';
import { hasStoredToken, api, clearToken } from '@/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '@/api/client';

const USER_TYPE_KEY = 'metavest_user_type';

interface User {
  id_user: string;
  name: string;
  email: string;
  profile_image_src: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  userType: 'user' | 'trader' | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUserType: (type: 'user' | 'trader') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<'user' | 'trader' | null>(null);

  // Restore user type on startup
  useEffect(() => {
    AsyncStorage.getItem(USER_TYPE_KEY).then(t => {
      if (t === 'trader' || t === 'user') setUserType(t);
    });
  }, []);

  const saveUserType = async (type: 'user' | 'trader') => {
    setUserType(type);
    await AsyncStorage.setItem(USER_TYPE_KEY, type);
  };

  // Auto-login on startup
  useEffect(() => {
    (async () => {
      try {
        const hasToken = await hasStoredToken();
        if (hasToken) {
          const profile = await api.get<User>('/auth-user');
          setUser(profile as unknown as User);
        }
      } catch (e) {
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const step1 = await authApi.loginStep1(email, password);
    saveUserType(step1.type);
    const response = await authApi.completeLogin(step1.userId);
    setUser(response.user);
  };



  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.get<User>('/auth-user');
      setUser(profile as unknown as User);
    } catch (e) {
      // ignore
    }
  }, []);

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isLoading,
      userType,
      login,
      logout,
      refreshUser,
      setUserType: saveUserType,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
