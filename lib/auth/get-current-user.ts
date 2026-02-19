import { headers } from 'next/headers';
import { verifyToken } from './verify-token';
import { prisma } from '@/lib/db';
import type { User } from '@prisma/client';

export async function getCurrentUser(): Promise<User> {
    const headersList = await headers();
    const authorization = headersList.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new Error('Token de autenticação não fornecido');
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await verifyToken(token);

    const user = await prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
        include: {
            Sector: true,
        },
    });

    if (!user) {
        throw new Error('Usuário não encontrado no banco de dados');
    }

    if (user.status !== 'ACTIVE') {
        throw new Error('Usuário não está ativo');
    }

    return user;
}
