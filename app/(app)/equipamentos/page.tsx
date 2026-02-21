'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Plus,
    Search,
    Eye,
    FileText,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Download,
    Calendar,
    Upload,
    Filter,
    Tag,
    Layers,
    Type,
    MoreHorizontal,
    Printer
} from 'lucide-react';
import Link from 'next/link';
import { generateLabelPDF } from '@/lib/label-pdf';
import { EquipmentModal } from './components/equipment-modal';
import { EquipmentDetailsModal } from '@/components/equipment-details-modal';
import { ServiceModal } from '@/components/service-modal';
import { ConfirmModal } from '@/components/confirm-modal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { ExportModal, ExportFilters } from '@/components/export-modal';
import { ImportModal } from '@/components/import-modal';

interface Equipment {
    id: string;
    name: string;
    code: string;
    manufacturerModel: string | null;
    resolution: string | null;
    capacity: string | null;
    responsible: string | null;
    status: string;
    lastCalibrationDate: string | null;
    lastCertificateNumber: string | null;
    dueDate: string | null;
    imageUrl?: string;
    location?: string; // Add location
    Sector: { id: string; name: string } | null;
    EquipmentType: { id: string; name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'reference' }> = {
    CALIBRADO: { label: 'Calibrado', variant: 'success' },
    IRA_VENCER: { label: 'Irá Vencer', variant: 'warning' },
    VENCIDO: { label: 'Vencido', variant: 'destructive' },
    REFERENCIA: { label: 'Referência', variant: 'reference' },
};

export default function EquipamentosPage() {
    const { firebaseUser } = useAuth();
    const { permissions } = useUser();
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>([]);
    const [types, setTypes] = useState<Array<{ id: string; name: string }>>([]);

    // Modais
    const [showEquipmentModal, setShowEquipmentModal] = useState(false); // Renamed from showCreateModal
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);

    const [showExportModal, setShowExportModal] = useState(false); // Novo state
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [serviceEquipment, setServiceEquipment] = useState<any>(null);

    const pageSize = 20;

    const fetchEquipment = useCallback(async () => {
        if (!firebaseUser) return;
        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('pageSize', pageSize.toString());
            params.set('usageStatus', 'IN_USE'); // Hardcoded filter for Equipment Page
            if (search) params.set('q', search);
            if (statusFilter && statusFilter !== 'none') params.set('status', statusFilter);
            if (sectorFilter && sectorFilter !== 'none') params.set('sectorId', sectorFilter);
            if (typeFilter && typeFilter !== 'none') params.set('equipmentTypeId', typeFilter);

            const res = await fetch(`/api/equipment?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setEquipment(data.items || data);
                setTotal(data.total || (data.items ? data.total : data.length));

                // Atualiza os filtros disponíveis dinamicamente
                if (data.availableSectors) setSectors(data.availableSectors);
                if (data.availableTypes) setTypes(data.availableTypes);
            }
        } catch (e) {
            console.error('Erro ao buscar equipamentos:', e);
            toast.error('Erro ao carregar equipamentos');
        } finally {
            setLoading(false);
        }
    }, [firebaseUser, page, search, statusFilter, sectorFilter, typeFilter]);

    useEffect(() => {
        async function fetchInitialFilters() {
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();

            // Busca inicial para preencher os dropdowns antes de qualquer filtro ser aplicado
            const [sectorsRes, typesRes] = await Promise.all([
                fetch('/api/sectors', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/equipment-types', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (sectorsRes.ok) setSectors(await sectorsRes.json());
            if (typesRes.ok) setTypes(await typesRes.json());
        }
        if (firebaseUser) fetchInitialFilters();
    }, [firebaseUser]);

    useEffect(() => {
        fetchEquipment();
    }, [fetchEquipment]);

    // Reset page quando filtros mudam
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, sectorFilter, typeFilter]);

    const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [showBulkMoveToStockModal, setShowBulkMoveToStockModal] = useState(false);

    const toggleSelectAll = () => {
        if (selectedItems.size === equipment.length && equipment.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(equipment.map(e => e.id)));
        }
    };

    const toggleSelectItem = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const handlePrintSelected = async () => {
        if (selectedItems.size === 0) return;

        const selectedData = equipment.filter(e => selectedItems.has(e.id));
        const origin = window.location.origin;

        toast.promise(generateLabelPDF(selectedData, origin), {
            loading: 'Gerando PDF...',
            success: 'PDF gerado com sucesso!',
            error: 'Erro ao gerar PDF'
        });
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEquipmentToDelete(id);
    };

    const confirmDelete = async () => {
        if (!equipmentToDelete) return;
        if (!firebaseUser) return;

        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/equipment/${equipmentToDelete}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Equipamento excluído');
                fetchEquipment();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao excluir');
            }
        } catch {
            toast.error('Erro ao excluir equipamento');
        } finally {
            setEquipmentToDelete(null);
        }
    };

    const handleRowClick = (eq: Equipment) => {
        setSelectedEquipment(eq);
        setShowDetailsModal(true);
    };

    const handleSchedule = (eq: any) => {
        setServiceEquipment({ equipmentId: eq.id, scheduledDate: new Date() }); // Mock simples p/ create
        setShowServiceModal(true);
    };

    const handleCreate = () => {
        setEquipmentToEdit(null);
        setModalMode('create');
        setShowEquipmentModal(true);
    };

    const handleEdit = (eq: Equipment) => {
        setEquipmentToEdit(eq);
        setModalMode('edit');
        setShowEquipmentModal(true);
    };

    const handleDuplicate = (eq: Equipment) => {
        setEquipmentToEdit(eq);
        setModalMode('duplicate');
        setShowEquipmentModal(true);
    };

    const totalPages = Math.ceil(total / pageSize);

    // Estado para Mover para Estoque
    const [showMoveToStockModal, setShowMoveToStockModal] = useState(false);
    const [equipmentToMove, setEquipmentToMove] = useState<Equipment | null>(null);
    const [targetLocation, setTargetLocation] = useState('');

    const handleMoveToStockClick = (eq: Equipment, e: React.MouseEvent) => {
        e.stopPropagation();
        setEquipmentToMove(eq);
        setTargetLocation(eq.location || ''); // Pre-fill current if exists
        setShowMoveToStockModal(true);
    };

    const confirmMoveToStock = async () => {
        if (!equipmentToMove || !firebaseUser || !targetLocation) {
            toast.error('Defina a localização no estoque.');
            return;
        }

        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/equipment/${equipmentToMove.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    usageStatus: 'IN_STOCK',
                    location: targetLocation,
                    sectorId: null // Remove sector association when in stock? Or keep previous? 
                    // User said "where not necessary sector column... but yes location". 
                    // Usually stock items don't belong to a productive sector in the same way.
                    // Let's keep it simple: just update usageStatus and location.
                })
            });

            if (res.ok) {
                toast.success('Equipamento enviado para estoque!');
                setShowMoveToStockModal(false);
                fetchEquipment();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao mover para estoque');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao processar movimentação');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0 || !firebaseUser) return;

        try {
            const token = await firebaseUser.getIdToken();
            const promises = Array.from(selectedItems).map(id =>
                fetch(`/api/equipment/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                })
            );

            await Promise.all(promises);
            toast.success(`${selectedItems.size} equipamentos excluídos.`);
            setSelectedItems(new Set());
            fetchEquipment();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir equipamentos.');
        } finally {
            setShowBulkDeleteModal(false);
        }
    };

    const handleBulkMoveToStock = async () => {
        if (selectedItems.size === 0 || !firebaseUser || !targetLocation) {
            toast.error('Defina a localização.');
            return;
        }

        try {
            const token = await firebaseUser.getIdToken();
            const promises = Array.from(selectedItems).map(id =>
                fetch(`/api/equipment/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        usageStatus: 'IN_STOCK',
                        location: targetLocation,
                        sectorId: null
                    })
                })
            );

            await Promise.all(promises);
            toast.success(`${selectedItems.size} equipamentos movidos para estoque.`);
            setSelectedItems(new Set());
            fetchEquipment();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao mover equipamentos.');
        } finally {
            setShowBulkMoveToStockModal(false);
            setTargetLocation('');
        }
    };

    const handleAdvancedExport = async (filters: ExportFilters, format: string) => {
        if (!firebaseUser) return;
        const toastId = toast.loading('Gerando arquivo de exportação...');

        try {
            const token = await firebaseUser.getIdToken();
            const params = new URLSearchParams();
            // Buscar TUDO que corresponde aos filtros (pageSize alto)
            params.set('pageSize', '2000');

            if (filters.sectorId !== 'ALL') params.set('sectorId', filters.sectorId);
            if (filters.typeId !== 'ALL') params.set('equipmentTypeId', filters.typeId);
            if (filters.status !== 'ALL') params.set('status', filters.status);

            const res = await fetch(`/api/equipment?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Falha ao buscar dados');

            const data = await res.json();
            const items: Equipment[] = data.items || data;

            if (items.length === 0) {
                toast.dismiss(toastId);
                toast.warning('Nenhum dado encontrado com os filtros selecionados.');
                return;
            }

            // Preparar dados planos para exportação
            const flattenedData = items.map(eq => ({
                'Código': eq.code,
                'Nome': eq.name,
                'Tipo': eq.EquipmentType?.name || '',
                'Setor': eq.Sector?.name || '',
                'Modelo': eq.manufacturerModel || '',
                'Status': STATUS_CONFIG[eq.status]?.label || eq.status,
                'Última Calibração': eq.lastCalibrationDate ? new Date(eq.lastCalibrationDate).toLocaleDateString('pt-BR') : '',
                'Vencimento': eq.dueDate ? new Date(eq.dueDate).toLocaleDateString('pt-BR') : '',
                'Responsável': eq.responsible || ''
            }));

            const fileName = `equipamentos_${new Date().toISOString().slice(0, 10)}`;

            // Dynamically import to avoid server-side issues
            const { exportToCSV, exportToExcel, exportToPDF, exportToDOCX, exportToTXT } = await import('@/lib/export-utils');

            const columns = ['Código', 'Nome', 'Tipo', 'Setor', 'Modelo', 'Status', 'Última Calibração', 'Vencimento', 'Responsável'];

            switch (format) {
                case 'csv':
                    exportToCSV(flattenedData, { fileName });
                    break;
                case 'xlsx':
                    exportToExcel(flattenedData, { fileName });
                    break;
                case 'pdf':
                    exportToPDF(flattenedData, columns, { fileName });
                    break;
                case 'docx':
                    await exportToDOCX(flattenedData, columns, { fileName });
                    break;
                case 'txt':
                    exportToTXT(flattenedData, columns, { fileName });
                    break;
                default:
                    toast.info(`Formato ${format.toUpperCase()} não suportado.`);
                    return;
            }

            toast.success('Exportação concluída!');

        } catch (error) {
            console.error(error);
            toast.error('Erro ao exportar dados');
        } finally {
            toast.dismiss(toastId);
        }
    };

    const handleImport = async (data: any[]) => {
        if (!firebaseUser) return;
        const toastId = toast.loading('Processando importação...');

        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch('/api/import/equipamentos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ items: data })
            });

            if (res.ok) {
                const result = await res.json();
                if (result.errors && result.errors.length > 0) {
                    const firstError = result.errors[0];
                    const remainingErrors = result.errors.length - 1;
                    const errorMsg = remainingErrors > 0
                        ? `${firstError} (e mais ${remainingErrors} erros)`
                        : firstError;

                    toast.error(`Erro na importação`, {
                        description: errorMsg,
                        duration: 6000,
                    });
                    console.warn('Erros de importação:', result.errors);
                }

                if (result.created > 0) {
                    toast.success(`${result.created} equipamentos importados.`);
                } else if (!result.errors || result.errors.length === 0) {
                    toast.info('Nenhum equipamento novo importado (podem ser duplicados).');
                }

                fetchEquipment();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Erro ao importar equipamentos');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao processar importação');
        } finally {
            toast.dismiss(toastId);
        }
    };

    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Equipamentos</h1>
                    <p className="text-muted-foreground">
                        Gestão de todos os equipamentos em uso na planta.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowExportModal(true)}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                    {permissions?.canEditEquipment && (
                        <>
                            <Button variant="outline" onClick={() => setShowImportModal(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Importar
                            </Button>
                            <Button onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Equipamento
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Todos os status</SelectItem>
                        <SelectItem value="CALIBRADO">Calibrado</SelectItem>
                        <SelectItem value="IRA_VENCER">Irá Vencer</SelectItem>
                        <SelectItem value="VENCIDO">Vencido</SelectItem>
                        <SelectItem value="REFERENCIA">Referência</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                    <SelectTrigger className="w-[200px]">
                        <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Todos os setores" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Todos os setores</SelectItem>
                        {sectors.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[200px]">
                        <Type className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Todos os tipos</SelectItem>
                        {types.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Bulk Actions Bar */}
            {selectedItems.size > 0 && (
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border mb-4">
                    <span className="text-sm font-medium">
                        {selectedItems.size} selecionado{selectedItems.size !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handlePrintSelected}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Etiquetas (PDF)
                        </Button>
                        {permissions?.canEditEquipment && (
                            <>
                                <Button variant="secondary" size="sm" onClick={() => setShowBulkMoveToStockModal(true)}>
                                    <Upload className="mr-2 h-4 w-4 rotate-180" />
                                    Mover para Estoque
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setShowBulkDeleteModal(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Tabela */}
            <div className="rounded-lg border bg-card overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b bg-muted/95 backdrop-blur-sm">
                                <th className="w-[40px] px-4 py-3">
                                    <Checkbox
                                        checked={equipment.length > 0 && selectedItems.size === equipment.length}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Código</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Setor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Última Calibração</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vencimento</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(8)].map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <Skeleton className="h-4 w-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : equipment.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                        Nenhum equipamento encontrado
                                    </td>
                                </tr>
                            ) : (
                                equipment.map((eq) => (
                                    <tr
                                        key={eq.id}
                                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => handleRowClick(eq)}
                                    >
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedItems.has(eq.id)}
                                                onCheckedChange={() => toggleSelectItem(eq.id)}
                                                aria-label={`Select ${eq.name}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">{eq.code}</td>
                                        <td className="px-4 py-3 text-sm">{eq.name}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{eq.EquipmentType?.name || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{eq.Sector?.name || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {eq.lastCalibrationDate
                                                ? new Date(eq.lastCalibrationDate).toLocaleDateString('pt-BR')
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {eq.dueDate
                                                ? new Date(eq.dueDate).toLocaleDateString('pt-BR')
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <StatusBadge status={eq.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>

                                                    {(permissions?.canManageRules || permissions?.canEditEquipment) && (
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDetailsModal(false); handleSchedule(eq); }}>
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            Agendar Calibração
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(eq); }}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ver Detalhes
                                                    </DropdownMenuItem>

                                                    <Link href={`/equipamentos/${eq.id}/calibracoes`} onClick={(e) => e.stopPropagation()} className="w-full">
                                                        <DropdownMenuItem>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Histórico
                                                        </DropdownMenuItem>
                                                    </Link>

                                                    <DropdownMenuSeparator />

                                                    {permissions?.canEditEquipment && (
                                                        <>
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(eq); }}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(eq); }}>
                                                                <div className="flex items-center">
                                                                    <span className="mr-2 h-4 w-4 flex items-center justify-center font-bold text-xs border rounded-sm">D</span>
                                                                    Duplicar
                                                                </div>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => handleMoveToStockClick(eq, e)}>
                                                                <Upload className="mr-2 h-4 w-4 rotate-180" />
                                                                Mover para Estoque
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => handleDeleteClick(eq.id, e)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            Página {page} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Criação/Edição/Duplicação */}
            {showEquipmentModal && (
                <EquipmentModal
                    sectors={sectors}
                    types={types}
                    onClose={() => setShowEquipmentModal(false)}
                    onSuccess={() => {
                        setShowEquipmentModal(false);
                        fetchEquipment();
                    }}
                    mode={modalMode}
                    equipmentToEdit={equipmentToEdit}
                    context="equipment"
                />
            )}

            {/* Modal de Detalhes Rico */}
            <EquipmentDetailsModal
                equipment={selectedEquipment}
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                onSchedule={(eq) => {
                    setShowDetailsModal(false);
                    handleSchedule(eq);
                }}
                onEdit={(eq) => {
                    setShowDetailsModal(false);
                    handleEdit(eq);
                }}
                onDuplicate={(eq) => {
                    setShowDetailsModal(false);
                    handleDuplicate(eq);
                }}
            />

            {/* Modal de Exportação Avançada */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleAdvancedExport}
                sectors={sectors}
                types={types}
            />

            <ImportModal
                context="equipamentos"
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImport}
            />

            {/* Modal de Agendamento */}
            <ServiceModal
                isOpen={showServiceModal}
                onClose={() => setShowServiceModal(false)}
                onSuccess={() => {
                    setShowServiceModal(false);
                }}
                serviceToEdit={serviceEquipment}
            />

            <ConfirmModal
                isOpen={!!equipmentToDelete}
                onClose={() => setEquipmentToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Equipamento"
                description="Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="destructive"
            />

            {/* Modal Mover para Estoque */}
            <Dialog open={showMoveToStockModal} onOpenChange={setShowMoveToStockModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar para Estoque</DialogTitle>
                        <DialogDescription>
                            Defina a localização de armazenamento para <strong>{equipmentToMove?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Localização / Armário</Label>
                            <Input
                                value={targetLocation}
                                onChange={(e) => setTargetLocation(e.target.value)}
                                placeholder="Ex: Armário B, Prateleira 3"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMoveToStockModal(false)}>Cancelar</Button>
                        <Button onClick={confirmMoveToStock}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                title="Excluir Equipamentos Selecionados"
                description={`Tem certeza que deseja excluir ${selectedItems.size} equipamentos? Esta ação não pode ser desfeita.`}
                confirmText="Excluir Tudo"
                variant="destructive"
            />

            {/* Bulk Move to Stock Modal */}
            <Dialog open={showBulkMoveToStockModal} onOpenChange={setShowBulkMoveToStockModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar Selecionados para Estoque</DialogTitle>
                        <DialogDescription>
                            Defina a localização para os <strong>{selectedItems.size}</strong> itens selecionados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Localização / Armário</Label>
                            <Input
                                value={targetLocation}
                                onChange={(e) => setTargetLocation(e.target.value)}
                                placeholder="Ex: Armário B, Prateleira 3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkMoveToStockModal(false)}>Cancelar</Button>
                        <Button onClick={handleBulkMoveToStock}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
}
