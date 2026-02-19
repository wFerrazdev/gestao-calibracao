'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function ForceTheme() {
    const { setTheme } = useTheme();

    useEffect(() => {
        // Força tema claro apenas na primeira inicialização
        const hasSetTheme = localStorage.getItem('theme-initialized-v3');
        if (!hasSetTheme) {
            setTheme('light');
            localStorage.setItem('theme-initialized-v3', 'true');
        }
    }, [setTheme]);

    return null;
}
