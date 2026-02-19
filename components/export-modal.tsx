'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Input } from '@/components/ui/input';
import { FileDown, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { toast } from 'sonner';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (filters: ExportFilters, format: string) => void;
    sectors: { id: string; name: string }[];
    types: { id: string; name: string }[];
}

export interface ExportFilters {
    sectorId: string | 'ALL';
    typeId: string | 'ALL';
    status: string | 'ALL';
    startDate: string;
    endDate: string;
}

const EXPORT_FORMATS = [
    { value: 'csv', label: 'CSV (Planilha)', icon: FileSpreadsheet },
    { value: 'xlsx', label: 'Excel (XLSX)', icon: FileSpreadsheet },
    { value: 'pdf', label: 'PDF (Documento)', icon: FileType },
    { value: 'docx', label: 'Word (DOCX)', icon: FileText },
    { value: 'txt', label: 'Texto (TXT)', icon: FileText },
];

export function ExportModal({ isOpen, onClose, onExport, sectors, types }: ExportModalProps) {
    const [format, setFormat] = useState('csv');
    const [filters, setFilters] = useState<ExportFilters>({
        sectorId: 'ALL',
        typeId: 'ALL',
        status: 'ALL',
        startDate: '',
        endDate: '',
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await onExport(filters, format);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Erro na exportação');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Exportar Dados</DialogTitle>
                    <DialogDescription>
                        Selecione os filtros e o formato desejado para a exportação.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Setor</Label>
                            <Select
                                value={filters.sectorId}
                                onValueChange={(v) => setFilters(prev => ({ ...prev, sectorId: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    {sectors.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Equipamento</Label>
                            <Select
                                value={filters.typeId}
                                onValueChange={(v) => setFilters(prev => ({ ...prev, typeId: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    {types.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={filters.status}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos</SelectItem>
                                <SelectItem value="CALIBRADO">Calibrado</SelectItem>
                                <SelectItem value="IRA_VENCER">Irá Vencer</SelectItem>
                                <SelectItem value="VENCIDO">Vencido</SelectItem>
                                <SelectItem value="DESATIVADO">Desativado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>De</Label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Até</Label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Formato do Arquivo</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {EXPORT_FORMATS.map((fmt) => {
                                const Icon = fmt.icon;
                                const isSelected = format === fmt.value;
                                return (
                                    <div
                                        key={fmt.value}
                                        onClick={() => setFormat(fmt.value)}
                                        className={`
                                            cursor-pointer rounded-md border p-3 flex flex-col items-center justify-center gap-2 text-center transition-all
                                            ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-muted hover:bg-muted/50'}
                                        `}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-xs font-medium">{fmt.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isExporting}>Cancelar</Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        <FileDown className="mr-2 h-4 w-4" />
                        {isExporting ? 'Exportando...' : 'Exportar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
