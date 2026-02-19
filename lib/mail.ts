
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    cc?: string;
}

export const sendEmail = async ({ to, subject, html, cc }: SendEmailParams) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Gestão de Calibração" <no-reply@example.com>',
            to,
            cc,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
};
