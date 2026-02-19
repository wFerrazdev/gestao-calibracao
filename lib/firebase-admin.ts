import admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

if (!admin.apps.length) {
    try {
        const serviceAccountPath = path.join(process.cwd(), 'gestao-calibracao-firebase-adminsdk-fbsvc-e4059f2211.json');

        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase Admin inicializado com Service Account JSON');
        } else {
            // Robust private key parsing for Vercel/CI environments
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;

            if (privateKey) {
                // Correct double escaping (\\n -> \n) and ensure proper PEM format
                privateKey = privateKey
                    .replace(/\\n/g, '\n') // Fix double escaped \n
                    .replace(/\n/g, '\n')   // Ensure real newlines
                    .replace(/^"|"$/g, ''); // Remove surrounding quotes

                // Debug log (safe parts only)
                console.log('--- Firebase Key Debug ---');
                console.log('Key length:', privateKey.length);
                console.log('Starts with BEGIN:', privateKey.includes('BEGIN PRIVATE KEY'));
                console.log('Ends with END:', privateKey.includes('END PRIVATE KEY'));

                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: privateKey,
                    }),
                });
                console.log('✅ Firebase Admin inicializado com variáveis de ambiente');
            } else {
                console.warn('⚠️ Firebase Admin não inicializado: FIREBASE_PRIVATE_KEY ausente.');
            }
        }
    } catch (error: any) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
        // Do not throw at build time to allow static analysis/pre-rendering to succeed
        // even if keys are missing from the environment.
    }
}

export const auth = admin.auth();
export default admin;
