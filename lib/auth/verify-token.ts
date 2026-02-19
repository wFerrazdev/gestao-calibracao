import { auth } from '@/lib/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

export async function verifyToken(token: string): Promise<DecodedIdToken> {
    try {
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying token:', error);
        throw new Error('Token inválido ou expirado');
    }
}
