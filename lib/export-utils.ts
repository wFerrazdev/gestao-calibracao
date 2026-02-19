
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun } from 'docx';

// Definição de tipos para os dados de exportação
type ExportData = Record<string, any>[];

interface ExportOptions {
    fileName: string;
}

/**
 * Exporta dados para CSV
 */
export const exportToCSV = (data: ExportData, options: ExportOptions) => {
    const { fileName } = options;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Exporta dados para Excel (.xlsx)
 */
export const exportToExcel = (data: ExportData, options: ExportOptions) => {
    const { fileName } = options;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Exporta dados para PDF
 */
export const exportToPDF = (data: ExportData, columns: string[], options: ExportOptions) => {
    const { fileName } = options;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Relatório de Exportação', 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

    // Preparar dados para a tabela
    // Assumindo que 'data' é um array de objetos onde as chaves correspondem às colunas
    // Mas para o autoTable, precisamos de headers e body.
    // Vamos usar as chaves do primeiro objeto como headers se não fornecidas explicitamente,
    // mas o ideal é que 'columns' seja passada para garantir a ordem.

    // Mapear dados para array de arrays com base nas colunas
    const tableBody = data.map(item => columns.map(col => item[col] || ''));

    autoTable(doc, {
        head: [columns],
        body: tableBody,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }, // Azul padrão
    });

    doc.save(`${fileName}.pdf`);
};

/**
 * Exporta dados para DOCX (Word)
 */
export const exportToDOCX = async (data: ExportData, columns: string[], options: ExportOptions) => {
    const { fileName } = options;

    const tableRows = [
        new TableRow({
            children: columns.map(col => new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: col, bold: true })]
                })],
                width: { size: 100 / columns.length, type: WidthType.PERCENTAGE },
            })),
        }),
        ...data.map(item => new TableRow({
            children: columns.map(col => new TableCell({
                children: [new Paragraph({ text: String(item[col] || '') })],
            })),
        }))
    ];

    const table = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: "Relatório de Equipamentos", heading: "Heading1" }),
                new Paragraph({ text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}` }),
                new Paragraph({ text: "" }), // Espaço
                table,
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.docx`;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Exporta dados para TXT
 */
export const exportToTXT = (data: ExportData, columns: string[], options: ExportOptions) => {
    const { fileName } = options;

    const content = data.map(item => {
        return columns.map(col => `${col}: ${item[col] || ''}`).join('\n');
    }).join('\n\n----------------------------------------\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
};
