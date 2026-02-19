import admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

if (!admin.apps.length) {
    // Tentar carregar o JSON direto do arquivo (mais confiável que .env)
    const serviceAccountPath = path.join(process.cwd(), 'gestao-calibracao-firebase-adminsdk-fbsvc-e4059f2211.json');

    if (fs.existsSync(serviceAccountPath)) {
        // Usar arquivo JSON diretamente
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log('✅ Firebase Admin inicializado com Service Account JSON');
    } else {
        // Fallback para variáveis de ambiente
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });

        console.log('✅ Firebase Admin inicializado com variáveis de ambiente');
    }
}

export const auth = admin.auth();
export default admin;
