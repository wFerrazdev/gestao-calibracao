'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { User } from '@prisma/client';

interface UserPermissions {
    canManageUsers: boolean;
    canEditEquipment: boolean;
    canAddCalibration: boolean;
    canViewAllSectors: boolean;
    canAccessSectors: boolean;
    canManageRules: boolean;
}

interface UserContextType {
    user: User | null;
    permissions: UserPermissions | null;
    isCriador: boolean;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const { firebaseUser, loading: authLoading } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);
    const [isCriador, setIsCriador] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        if (!firebaseUser && !authLoading) {
            setUser(null);
            setPermissions(null);
            setIsCriador(false);
            setLoading(false);
            return;
        }

        if (!firebaseUser) return;

        try {
            // setLoading(true); // Don't set loading true on refetch to avoid flicker
            const token = await firebaseUser.getIdToken();
            const res = await fetch('/api/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error('Erro ao buscar dados do usuário');
            }

            const data = await res.json();
            setUser(data.user);
            setPermissions(data.permissions);
            setIsCriador(data.isCriador);
            setError(null);
        } catch (err: any) {
            console.error('Erro em UserProvider:', err);
            setError(err.message);
            // Only clear user on critical error? Maybe keep stale data? 
            // Better to match old behavior for now.
            setUser(null);
            setPermissions(null);
            setIsCriador(false);
        } finally {
            setLoading(false);
        }
    }, [firebaseUser, authLoading]);

    useEffect(() => {
        if (!authLoading) {
            fetchUser();
        }
    }, [firebaseUser, authLoading, fetchUser]);

    return (
        <UserContext.Provider value={{
            user,
            permissions,
            isCriador,
            loading: authLoading || loading,
            error,
            refetch: fetchUser,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}
