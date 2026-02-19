import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { generateDownloadUrl } from '@/lib/r2/generate-download-url';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();

        const { searchParams } = new URL(request.url);
        const objectKey = searchParams.get('key');

        if (!objectKey) {
            return NextResponse.json(
                { error: 'Parâmetro "key" é obrigatório' },
                { status: 400 }
            );
        }

        // TODO: Validar se o usuário tem permissão para baixar este arquivo
        // (verificar se o equipamento pertence ao setor do usuário se role=PRODUCAO)

        const downloadUrl = await generateDownloadUrl(objectKey);

        return NextResponse.json({ downloadUrl });
    } catch (error: any) {
        console.error('Error generating download URL:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao gerar URL de download' },
            { status: 500 }
        );
    }
}
