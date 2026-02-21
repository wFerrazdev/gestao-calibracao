
import { jsPDF } from "jspdf";

interface LabelData {
    id: string;
    code: string;
    name: string;
    status: string;
}

/**
 * Desenha uma etiqueta individual no PDF
 * @param doc Instância do jsPDF
 * @param item Dados do equipamento
 * @param xOffset Deslocamento horizontal (0 para esquerda, ~55 para direita)
 * @param origin URL de origem para o QR Code
 */
async function drawLabel(doc: jsPDF, item: LabelData, xOffset: number, origin: string) {
    const qrValue = `${origin}/p/${item.id}`;

    // Configurações básicas de fonte
    doc.setFont("helvetica", "bold");

    // Desenha QR Code
    try {
        const qrDataUrl = await generateQRCodeDataURL(qrValue);
        // QR Code posicionado dentro da etiqueta (xOffset + 2mm)
        doc.addImage(qrDataUrl, 'PNG', xOffset + 2, 2, 18, 18);
    } catch (e) {
        console.error("Erro ao gerar QR Code para o PDF", e);
    }

    // Desenha Informações do Equipamento
    const contentXOffset = xOffset + 22; // Inicia após o QR Code

    // Código
    doc.setFontSize(10);
    doc.text(item.code, contentXOffset, 6);

    // Nome (Truncado se necessário)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    const nameLines = doc.splitTextToSize(item.name, 26);
    doc.text(nameLines.slice(0, 2), contentXOffset, 10);

    // Linha Separadora Sutil
    doc.setDrawColor(200, 200, 200);
    doc.line(contentXOffset, 18, xOffset + 48, 18);

    // Status
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    const statusText = item.status === 'CALIBRADO' ? 'CALIBRADO' :
        item.status === 'IRA_VENCER' ? 'IRÁ VENCER' :
            item.status === 'VENCIDO' ? 'VENCIDO' : item.status;

    doc.text(statusText, contentXOffset, 22);

    // Logo Gatron
    try {
        // Posicionada no canto inferior direito da etiqueta
        doc.addImage('/logoazul.png', 'PNG', xOffset + 36, 18, 12, 5);
    } catch (e) {
        // Silencioso se a logo falhar
    }
}

export async function generateLabelPDF(items: LabelData[], origin: string) {
    // BOBINA 2-UP: Duas etiquetas de 50x25mm lado a lado.
    // Largura total aproximada: 50mm + 50mm + 5mm (gap) = 105mm
    const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [105, 25],
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    // Processa os itens em pares
    for (let i = 0; i < items.length; i += 2) {
        // Se não for o primeiro par, adiciona uma nova página (linha da bobina)
        if (i > 0) {
            doc.addPage([105, 25], 'l');
        }

        // Desenha a primeira etiqueta (Esquerda)
        await drawLabel(doc, items[i], 0, origin);

        // Se houver um segundo item, desenha a segunda etiqueta (Direita)
        if (items[i + 1]) {
            // xOffset de 55mm (50mm da primeira etiqueta + 5mm de gap aproximado)
            await drawLabel(doc, items[i + 1], 55, origin);
        }
    }

    // Salva o documento
    const date = new Date().toISOString().split('T')[0];
    doc.save(`etiquetas_zebra_2up_${date}.pdf`);
}

/**
 * Gera um DataURL de QR Code usando canvas invisível
 */
async function generateQRCodeDataURL(value: string): Promise<string> {
    return new Promise((resolve, reject) => {
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
