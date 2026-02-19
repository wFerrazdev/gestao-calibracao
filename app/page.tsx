'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg text-primary"></div>
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Carregando...</p>
    </div>
  </div>
}
