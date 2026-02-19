import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { requireRole } from '@/lib/auth/require-role';
import { generateImageUploadUrl } from '@/lib/r2/generate-image-upload-url';
import { r2PresignSchema } from '@/lib/validations/schemas';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();

        // Apenas QUALIDADE, ADMIN e CRIADOR podem fazer upload de fotos
        requireRole(user.role, ['QUALIDADE', 'ADMIN', 'CRIADOR']);

        const body = await request.json();
        const validation = r2PresignSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { equipmentId, fileName, fileType, fileSize } = validation.data;

        const { uploadUrl, objectKey } = await generateImageUploadUrl(
            equipmentId,
            fileName,
            fileType,
            fileSize
        );

        return NextResponse.json({ uploadUrl, objectKey });
    } catch (error: any) {
        console.error('Error generating presigned URL for image:', error);

        if (error.message.includes('Permissão insuficiente')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json(
            { error: error.message || 'Erro ao gerar URL de upload' },
            { status: 500 }
        );
    }
}
