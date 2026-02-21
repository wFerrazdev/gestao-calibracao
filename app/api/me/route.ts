import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isCriador } from '@/lib/auth/is-criador';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';
import { verifyToken } from '@/lib/auth/verify-token';
import { deleteFile, extractKeyFromUrl } from '@/lib/r2';
import { generateDownloadUrl } from '@/lib/r2/generate-download-url';

export async function GET() {
    try {
        // NÃO usar getCurrentUser aqui — ele rejeita PENDING/DISABLED
        // Precisamos retornar dados mesmo para PENDING para que o frontend redirecione
        const headersList = await headers();
        const authorization = headersList.get('authorization');

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Token de autenticação não fornecido' },
                { status: 401 }
            );
        }

        const token = authorization.split('Bearer ')[1];
        const decodedToken = await verifyToken(token);
        // Busca o usuário no banco de dados local
        const user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
            include: {
                Sector: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado no banco' }, { status: 404 });
        }

        // Calcular permissões (retorna permissões zeradas se não ativo)
        const isUserCriador = isCriador(user.firebaseUid);
        const isActive = user.status === 'ACTIVE';

        const permissions = {
            canManageUsers: isActive && isUserCriador,
            canEditEquipment: isActive && ['CRIADOR', 'ADMIN'].includes(user.role),
            canAddCalibration: isActive && ['CRIADOR', 'ADMIN', 'QUALIDADE'].includes(user.role),
            canViewAllSectors: isActive && ['CRIADOR', 'ADMIN', 'QUALIDADE'].includes(user.role),
            canAccessSectors: isActive && ['CRIADOR', 'ADMIN', 'QUALIDADE', 'PRODUCAO'].includes(user.role),
            canManageRules: isActive && ['CRIADOR', 'ADMIN'].includes(user.role),
        };

        let userWithSignedPhoto = { ...user };

        if (user.photoUrl && !user.photoUrl.startsWith('http')) {
            try {
                const signedUrl = await generateDownloadUrl(user.photoUrl);
                userWithSignedPhoto.photoUrl = signedUrl;
            } catch (err) {
                console.error('Error generating signed URL:', err);
            }
        }

        return NextResponse.json({
            user: userWithSignedPhoto,
            permissions,
            isCriador: isUserCriador,
        });
    } catch (error: any) {
        console.error('Error getting current user:', error);

        if (error.message?.includes('Token')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json(
            { error: 'Erro ao buscar dados do usuário' },
            { status: 500 }
        );
    }
}

// PATCH - Atualizar dados do próprio usuário
export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        const body = await request.json();

        const { name, photoUrl, age } = body as { name?: string; photoUrl?: string; age?: number };

        // Se houver atualização de foto, tentar deletar a antiga
        if (photoUrl && user.photoUrl && photoUrl !== user.photoUrl) {
            const oldKey = extractKeyFromUrl(user.photoUrl);
            if (oldKey) {
                // Executar em background para não bloquear a resposta
                deleteFile(oldKey).catch(err => console.error('Erro ao deletar foto antiga:', err));
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                ...(name && { name }),
                ...(photoUrl !== undefined && { photoUrl }),
                ...(age !== undefined && { age }),
            },
            include: { Sector: true },
        });

        let userWithSignedPhoto = { ...updatedUser };

        if (updatedUser.photoUrl && !updatedUser.photoUrl.startsWith('http')) {
            try {
                const signedUrl = await generateDownloadUrl(updatedUser.photoUrl);
                userWithSignedPhoto.photoUrl = signedUrl;
            } catch (err) {
                console.error('Error generating signed URL for updated user:', err);
            }
        }

        return NextResponse.json({ user: userWithSignedPhoto });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar usuário' },
            { status: 500 }
        );
    }
}
