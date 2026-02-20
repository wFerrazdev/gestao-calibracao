'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@prisma/client';

interface UserPermissions {
    canManageUsers: boolean;
    canEditEquipment: boolean;
    canAddCalibration: boolean;
    canViewAllSectors: boolean;
    canAccessSectors: boolean;
    canManageRules: boolean;
}

interface AuthContextType {
    firebaseUser: FirebaseUser | null;
    user: (User & { sector: any }) | null;
    permissions: UserPermissions | null;
    isCriador: boolean;
    loading: boolean;
    setSessionToken: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<(User & { sector: any }) | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);
    const [isCriador, setIsCriador] = useState(false);
    const [loading, setLoading] = useState(true);

    const setSessionToken = async (token: string) => {
        // Armazenar token no cookie (via API route)
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });

        // Sincronizar usuário
        await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });

        // Buscar dados do usuário (agora funciona para PENDING/DISABLED também)
        const meResponse = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (meResponse.ok) {
            const data = await meResponse.json();
            setUser(data.user);
            setPermissions(data.permissions);
            setIsCriador(data.isCriador);
        }
    };

    const logout = async () => {
        await auth.signOut();
        await fetch('/api/auth/session', { method: 'DELETE' });
        setUser(null);
        setPermissions(null);
        setIsCriador(false);
    };

    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (firebaseUserData) => {
            setFirebaseUser(firebaseUserData);

            if (firebaseUserData) {
                try {
                    const token = await firebaseUserData.getIdToken();
                    await setSessionToken(token);
                } catch (error) {
                    console.error('Error setting session:', error);
                }
            } else {
                setUser(null);
                setPermissions(null);
                setIsCriador(false);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                firebaseUser,
                user,
                permissions,
                isCriador,
                loading,
                setSessionToken,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
