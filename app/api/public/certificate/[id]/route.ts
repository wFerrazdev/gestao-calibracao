
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
});

/**
 * Rota pública para download de certificados sem autenticação.
 * O acesso é controlado pelo ID único da calibração.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Buscar a calibração e a chave do arquivo
        const calibration = await prisma.calibrationRecord.findUnique({
            where: { id },
            select: {
                attachmentKey: true,
                attachmentName: true,
                attachmentMime: true,
            }
        });

        if (!calibration || !calibration.attachmentKey) {
            return new NextResponse('Certificado não encontrado', { status: 404 });
        }

        // Buscar arquivo no R2
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: calibration.attachmentKey,
        });

        const response = await r2Client.send(command);

        if (!response.Body) {
            return new NextResponse('Arquivo vazio ou não encontrado no storage', { status: 404 });
        }

        // Converter stream para Response
        // @ts-ignore - S3 response Body style varies
        const stream = response.Body.transformToWebStream();

        return new NextResponse(stream, {
            headers: {
                'Content-Type': calibration.attachmentMime || 'application/pdf',
                'Content-Disposition': `inline; filename="${calibration.attachmentName || 'certificado.pdf'}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error) {
        console.error('Erro ao servir certificado público:', error);
        return new NextResponse('Erro interno ao buscar arquivo', { status: 500 });
    }
}
