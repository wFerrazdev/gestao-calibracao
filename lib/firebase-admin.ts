import admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

if (!admin.apps.length) {
    try {
        // Tentar carregar o JSON direto do arquivo (mais confiável que .env local)
        const serviceAccountPath = path.join(process.cwd(), 'gestao-calibracao-firebase-adminsdk-fbsvc-e4059f2211.json');

        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase Admin inicializado com Service Account JSON');
        } else {
            // Normatizar a chave privada (remover aspas e corrigir quebras de linha)
            const privateKey = process.env.FIREBASE_PRIVATE_KEY
                ?.replace(/\\n/g, '\n')
                ?.replace(/^"|"$/g, ''); // Remove aspas no início e fim

            if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: privateKey,
                    }),
                });
                console.log('✅ Firebase Admin inicializado com variáveis de ambiente');
            } else {
                console.warn('⚠️ Firebase Admin não inicializado: Variáveis de ambiente ausentes ou incompletas.');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error);
        // Não lançar erro aqui para não quebrar o build do Next.js se as envs não forem necessárias no momento
    }
}

export const auth = admin.auth();
export default admin;
