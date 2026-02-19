import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import r2 from '@/lib/r2/client';
import { z } from 'zod';

const uploadSchema = z.object({
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number().max(10 * 1024 * 1024), // Max 10MB
    folder: z.enum(['equipment-photos', 'calibration-certificates', 'profile-photos']),
});

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();

        // Apenas usuários logados podem fazer upload
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = uploadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid data', details: validation.error.format() },
                { status: 400 }
            );
        }

        const { fileName, fileType, folder } = validation.data;

        // Sanitize filename and create unique key
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${folder}/${Date.now()}-${sanitizedFileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

        const publicUrlBase = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

        if (!process.env.R2_BUCKET_NAME) {
            console.error('R2_BUCKET_NAME is not defined');
            throw new Error('Server configuration error');
        }

        const publicUrl = publicUrlBase
            ? `${publicUrlBase}/${key}`
            : key;

        return NextResponse.json({
            uploadUrl: presignedUrl,
            key: key,
            publicUrl: publicUrl
        });

    } catch (error: any) {
        console.error('Error generating presigned URL:', error);
        return NextResponse.json(
            { error: error.message || 'Error generating upload URL' },
            { status: 500 }
        );
    }
}
