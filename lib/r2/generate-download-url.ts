import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import r2Client from './client';

export async function generateDownloadUrl(objectKey: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: objectKey,
    });

    // URL válida por 1 hora
    const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    return downloadUrl;
}
