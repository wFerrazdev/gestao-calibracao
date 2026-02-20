'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[]) => Promise<void>;
    context?: 'equipamentos' | 'estoque';
}

export function ImportModal({ isOpen, onClose, onImport, context = 'equipamentos' }: ImportModalProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        let headers: string[] = [];
        let exampleRow: string[] = [];
        let fileName = 'modelo_importacao.xlsx';

        if (context === 'estoque') {
            headers = [
                'CÓDIGO', 'NOME', 'TIPO', 'LOCALIZAÇÃO', 'MODELO', 'RESOLUÇÃO',
                'CAPACIDADE', 'RESPONSÁVEL', 'FAIXA DE TRABALHO', 'UNIDADE DE MEDIDA'
            ];
            exampleRow = [
                'EQ-001', 'PAQUÍMETRO DIGITAL', 'PAQUÍMETRO', 'ARMÁRIO A, PRATELEIRA 2', 'MITUTOYO 500-196-30', '0.01 MM',
                '150 MM', 'JOÃO SILVA', '0-150MM', 'MM'
            ];
            fileName = 'modelo_importacao_estoque.xlsx';
        } else {
            headers = [
                'CÓDIGO', 'NOME', 'TIPO', 'SETOR', 'MODELO', 'RESOLUÇÃO',
                'CAPACIDADE', 'RESPONSÁVEL', 'DATA ÚLTIMA CALIBRAÇÃO', 'DATA VENCIMENTO',
                'FAIXA DE TRABALHO', 'INCERTEZA ADMISSÍVEL', 'ERRO MÁXIMO', 'FORNECEDOR', 'UNIDADE DE MEDIDA'
            ];
            exampleRow = [
                'EQ-001', 'PAQUÍMETRO DIGITAL', 'PAQUÍMETRO', 'PRODUÇÃO', 'MITUTOYO 500-196-30', '0.01 MM',
                '150 MM', 'JOÃO SILVA', '2023-01-15', '2024-01-15',
                '0-150MM', '0.02MM', '0.02MM', 'LAB CALIBRAÇÃO XYZ', 'MM'
            ];
            fileName = 'modelo_importacao_equipamentos.xlsx';
        }

        const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo Importação');
        XLSX.writeFile(workbook, fileName);
    };

    const handleFile = async (selectedFile: File) => {
        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                setPreviewData(data);
                if (data.length === 0) {
                    toast.warning('O arquivo parece estar vazio.');
                } else {
                    toast.success(`${data.length} registros encontrados.`);
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao ler o arquivo. Verifique se é um Excel válido.');
                setFile(null);
                setPreviewData([]);
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        handleFile(selectedFile);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    };

    const handleImport = async () => {
        if (!previewData.length) return;
        setIsImporting(true);
        try {
            await onImport(previewData);
            onClose();
            setFile(null);
            setPreviewData([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error(error);
        } finally {
            setIsImporting(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreviewData([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isImporting && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        Importar {context === 'estoque' ? 'Estoque' : 'Equipamentos'}
                    </DialogTitle>
                    <DialogDescription>
                        Faça upload de uma planilha Excel para importar {context === 'estoque' ? 'itens de estoque' : 'equipamentos'} em massa.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="rounded-lg border p-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium">1. Baixe o modelo</h4>
                                <p className="text-xs text-muted-foreground">
                                    Use nossa planilha padrão para garantir que os dados sejam importados corretamente.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                Baixar Modelo
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">2. Selecione o arquivo preenchido</h4>
                        {!file ? (
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                                    isDragging
                                        ? "border-primary bg-primary/10"
                                        : "border-muted-foreground/25 hover:bg-muted/50"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <FileSpreadsheet className={cn(
                                    "mx-auto h-10 w-10 mb-3 transition-colors",
                                    isDragging ? "text-primary" : "text-muted-foreground"
                                )} />
                                <p className="text-sm text-muted-foreground font-medium">
                                    {isDragging ? "Solte o arquivo aqui" : "Clique para selecionar ou arraste o arquivo aqui"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Suporta arquivos .xlsx ou .xls
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full dark:bg-green-900/20">
                                        <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium truncate max-w-[250px]">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {previewData.length} registros identificados
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={clearFile}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                        />
                    </div>

                    {previewData.length > 0 && (
                        <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 flex gap-2 items-start">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">Informações Importantes:</p>
                                {context === 'estoque' ? (
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>O campo <strong>Código</strong> deve existir no cadastro mestre.</li>
                                        <li>A <strong>Localização</strong> será atualizada para o valor da planilha.</li>
                                        <li>O <strong>Tipo</strong> deve já estar cadastrado no sistema.</li>
                                        <li>Os itens serão movidos automaticamente para o status <strong>Estoque</strong>.</li>
                                    </ul>
                                ) : (
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li><strong>Setores</strong> e <strong>Tipos</strong> devem já estar cadastrados no sistema.</li>
                                        <li>Equipamentos com <strong>Código</strong> já existente serão ignorados.</li>
                                        <li>Datas devem estar no formato <code>AAAA-MM-DD</code> ou no formato de data do Excel.</li>
                                        <li>Todos os dados serão salvos em <strong>MAIÚSCULO</strong> automaticamente.</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isImporting}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={!file || isImporting || previewData.length === 0}>
                        {isImporting ? 'Importando...' : 'Confirmar Importação'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
