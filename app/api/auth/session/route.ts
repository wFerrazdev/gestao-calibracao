import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Token não fornecido' },
                { status: 400 }
            );
        }

        const response = NextResponse.json({ success: true });

        // Armazenar token em cookie httpOnly
        response.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 dias
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Error setting session:', error);
        return NextResponse.json(
            { error: 'Erro ao criar sessão' },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session');
    return response;
}
