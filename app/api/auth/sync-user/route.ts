import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth/verify-token';
import { isCriador } from '@/lib/auth/is-criador';

export async function POST(request: Request) {
    try {
        const authorization = request.headers.get('authorization');

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Token não fornecido' },
                { status: 401 }
            );
        }

        const token = authorization.split('Bearer ')[1];
        const decodedToken = await verifyToken(token);

        // Tentar ler nome do body (opcional)
        let bodyName: string | undefined;
        try {
            const body = await request.json();
            bodyName = body?.name;
        } catch {
            // Body vazio é ok (login normal sem body)
        }

        // Buscar ou criar usuário
        let user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
            include: { Sector: true },
        });

        if (!user) {
            // Criar novo usuário
            const isUserCriador = isCriador(decodedToken.uid);
            const displayName = bodyName || decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuário';

            user = await prisma.user.create({
                data: {
                    firebaseUid: decodedToken.uid,
                    email: decodedToken.email || '',
                    name: displayName,
                    photoUrl: decodedToken.picture,
                    role: isUserCriador ? 'CRIADOR' : 'VIEWER',
                    status: isUserCriador ? 'ACTIVE' : 'PENDING',
                } as any,
                include: { Sector: true },
            });
        } else if (isCriador(decodedToken.uid) && user.role !== 'CRIADOR') {
            // Garantir que o CRIADOR sempre tenha role e status corretos
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: 'CRIADOR',
                    status: 'ACTIVE',
                },
                include: { Sector: true },
            });
        }

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Error syncing user:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao sincronizar usuário' },
            { status: 500 }
        );
    }
}
