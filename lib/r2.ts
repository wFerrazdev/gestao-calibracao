import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('R2 environment variables are missing. File uploads will not work.');
}

export const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
});

export async function deleteFile(key: string) {
    if (!key) return;

    try {
        await r2.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        }));
        console.log(`Successfully deleted file from R2: ${key}`);
    } catch (error) {
        console.error(`Error deleting file from R2 (${key}):`, error);
        // Não lançar erro para não impedir a exclusão do registro no banco
    }
}

export function extractKeyFromUrl(url: string): string | null {
    if (!url) return null;

    // Se já for apenas a key (não tem http/https)
    if (!url.startsWith('http')) return url;

    try {
        const urlObj = new URL(url);
        // Remove a primeira barra do pathname para pegar a key
        // Ex: /bucket/folder/file.jpg -> bucket/folder/file.jpg
        // Ou se for subdominio: /folder/file.jpg -> folder/file.jpg

        let path = urlObj.pathname.substring(1);

        // Se usar path-style access (http://endpoint/bucket/key), precisamos remover o bucket
        // Mas o R2 geralmente usa domain/key se configurado public domain, ou endpoint/bucket/key

        // Vamos tentar identificar pastas conhecidas para garantir
        if (path.includes('equipment-photos/')) {
            return path.substring(path.indexOf('equipment-photos/'));
        }
        if (path.includes('calibration-certificates/')) {
            return path.substring(path.indexOf('calibration-certificates/'));
        }
        if (path.includes('equipamentos/')) {
            return path.substring(path.indexOf('equipamentos/'));
        }
        if (path.includes('profile-photos/')) {
            return path.substring(path.indexOf('profile-photos/'));
        }

        return path;
    } catch (e) {
        console.error('Error parsing URL:', url);
        return null; // Return null instead of the original string if parsing fails
    }
}
