import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import r2Client from './client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB para imagens
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function generateImageUploadUrl(
    equipmentId: string,
    fileName: string,
    fileType: string,
    fileSize: number
): Promise<{ uploadUrl: string; objectKey: string }> {
    // Validações
    if (!ALLOWED_TYPES.includes(fileType)) {
        throw new Error('Apenas imagens (JPEG, PNG, WEBP) são permitidas');
    }

    if (fileSize > MAX_FILE_SIZE) {
        throw new Error('Tamanho máximo da imagem: 5MB');
    }

    // Sanitizar nome do arquivo
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Gerar chave do objeto no R2
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();

    const objectKey = `equipamentos/${equipmentId}/fotos/${year}/${month}/${timestamp}-${sanitizedFileName}`;

    // Gerar URL assinada para upload (válida por 10 minutos)
    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: objectKey,
        ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 });

    return { uploadUrl, objectKey };
}
