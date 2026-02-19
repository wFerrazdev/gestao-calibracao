import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2 } from '@/lib/r2';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        const url = await getSignedUrl(r2, command, { expiresIn: 3600 });

        return NextResponse.json({ url });

    } catch (error: any) {
        console.error('Error generating download URL:', error);
        return NextResponse.json(
            { error: error.message || 'Error generating download URL' },
            { status: 500 }
        );
    }
}
