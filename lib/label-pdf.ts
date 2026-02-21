
import { jsPDF } from "jspdf";

interface LabelData {
    id: string;
    code: string;
    name: string;
    status: string;
}

export async function generateLabelPDF(items: LabelData[], origin: string) {
    // Cria o documento com unidade em mm e tamanho de página 50x25
    const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [50, 25],
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Se não for a primeira página, adiciona uma nova
        if (i > 0) {
            doc.addPage([50, 25], 'l');
        }

        const qrValue = `${origin}/p/${item.id}`;

        // Configurações básicas de fonte
        doc.setFont("helvetica", "bold");

        // Desenha QR Code
        // Para o jsPDF, precisamos converter o QR para uma imagem ou usar um canvas temporário
        // Como estamos no ambiente client-side, podemos usar uma abordagem de canvas
        try {
            const qrDataUrl = await generateQRCodeDataURL(qrValue);
            doc.addImage(qrDataUrl, 'PNG', 2, 2, 18, 18);
        } catch (e) {
            console.error("Erro ao gerar QR Code para o PDF", e);
        }

        // Desenha Informações do Equipamento
        const xOffset = 22; // Inicia após o QR Code

        // Código
        doc.setFontSize(10);
        doc.text(item.code, xOffset, 6);

        // Nome (Truncado se necessário)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        const nameLines = doc.splitTextToSize(item.name, 26);
        doc.text(nameLines.slice(0, 2), xOffset, 10);

        // Status
        doc.setDrawColor(200, 200, 200);
        doc.line(xOffset, 18, 48, 18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        const statusText = item.status === 'CALIBRADO' ? 'CALIBRADO' :
            item.status === 'IRA_VENCER' ? 'IRÁ VENCER' :
                item.status === 'VENCIDO' ? 'VENCIDO' : item.status;

        doc.text(statusText, xOffset, 22);

        // Logo Gatron (Se disponível localmente em base64 para o PDF)
        try {
            // Tentaremos carregar a logo azul
            // Nota: Em produção, o ideal é ter o base64 da logo pré-carregado
            doc.addImage('/logoazul.png', 'PNG', 36, 18, 12, 5);
        } catch (e) {
            // Silencioso se a logo falhar no PDF
        }
    }

    // Salva o documento
    const date = new Date().toISOString().split('T')[0];
    doc.save(`etiquetas_zebra_${date}.pdf`);
}

/**
 * Gera um DataURL de QR Code usando canvas invisível
 */
async function generateQRCodeDataURL(value: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Importação dinâmica para garantir que rode apenas no cliente
        import('qrcode').then((QRCode: any) => {
            const canvas = document.createElement('canvas');
            QRCode.toCanvas(canvas, value, {
                margin: 0,
                width: 256,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            }, (error: any) => {
                if (error) reject(error);
                resolve(canvas.toDataURL('image/png'));
            });
        }).catch(reject);
    });
}
