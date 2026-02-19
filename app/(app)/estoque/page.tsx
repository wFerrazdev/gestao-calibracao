'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Search, Eye, FileText, Pencil, Trash2, ChevronLeft, ChevronRight, Upload, Download, ArrowRightLeft, Package, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { EquipmentModal } from '@/app/(app)/equipamentos/components/equipment-modal';
import { EquipmentDetailsModal } from '@/components/equipment-details-modal';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Equipment {
    id: string;
    name: string;
    code: string;
    manufacturerModel: string | null;
    status: string;
    lastCalibrationDate: string | null;
    dueDate: string | null;
    usageStatus: string;
    location: string | null;
    Sector: { id: string; name: string } | null;
    EquipmentType: { id: string; name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'reference' }> = {
    CALIBRADO: { label: 'Calibrado', variant: 'success' },
    IRA_VENCER: { label: 'Irá Vencer', variant: 'warning' },
    VENCIDO: { label: 'Vencido', variant: 'destructive' },
    DESATIVADO: { label: 'Desativado', variant: 'outline' },
    REFERENCIA: { label: 'Referência', variant: 'reference' },
};

export default function EstoquePage() {
    const { firebaseUser } = useAuth();
    const { permissions, user } = useUser();
    const router = useRouter(); // To redirect if needed
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [types, setTypes] = useState<Array<{ id: string; name: string }>>([]);
    const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>([]); // Needed for Move to Use

    // Modais
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Move to Use Modal State
    const [showMoveToUseModal, setShowMoveToUseModal] = useState(false);
    const [equipmentToMove, setEquipmentToMove] = useState<Equipment | null>(null);
    const [targetSectorId, setTargetSectorId] = useState('');
    const [targetResponsible, setTargetResponsible] = useState('');

    // Estado para Mover para Estoque
    const [showMoveToStockModal, setShowMoveToStockModal] = useState(false);
    // const [equipmentToMove, setEquipmentToMove] = useState<Equipment | null>(null); // Já declarado acima
    const [targetLocation, setTargetLocation] = useState('');

    const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // Bulk Move to Use State
    const [showBulkMoveToUseModal, setShowBulkMoveToUseModal] = useState(false);

    const pageSize = 20;

    const fetchEquipment = useCallback(async () => {
        if (!firebaseUser) return;
        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('pageSize', pageSize.toString());
            params.set('usageStatus', 'IN_STOCK'); // Hardcoded filter
            if (search) params.set('q', search);
            if (statusFilter) params.set('status', statusFilter);
            if (typeFilter) params.set('equipmentTypeId', typeFilter);

            const res = await fetch(`/api/equipment?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setEquipment(data.items || data);
                setTotal(data.total || (data.items ? data.total : data.length));
            }
        } catch (e) {
            console.error('Erro ao buscar estoque:', e);
            toast.error('Erro ao carregar estoque');
        } finally {
            setLoading(false);
        }
    }, [firebaseUser, page, search, statusFilter, typeFilter]);

    useEffect(() => {
        async function fetchFilters() {
            if (!firebaseUser) return;
            const token = await firebaseUser.getIdToken();

            const [typesRes, sectorsRes] = await Promise.all([
                fetch('/api/equipment-types', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/sectors', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (typesRes.ok) setTypes(await typesRes.json());
            if (sectorsRes.ok) setSectors(await sectorsRes.json());
        }
        if (firebaseUser) fetchFilters();
    }, [firebaseUser]);

    useEffect(() => {
        fetchEquipment();
    }, [fetchEquipment]);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, typeFilter]);

    const handleRowClick = (eq: Equipment) => {
        setSelectedEquipment(eq);
        setShowDetailsModal(true);
    };

    const totalPages = Math.ceil(total / pageSize);

    // Initial Move to Use Click
    const handleMoveToUseClick = (eq: Equipment, e: React.MouseEvent) => {
        e.stopPropagation();
        setEquipmentToMove(eq);
        setTargetSectorId(''); // Reset
        setTargetResponsible(''); // Reset
        setShowMoveToUseModal(true);
    };

    // Confirm Move to Use
    const confirmMoveToUse = async () => {
        if (!equipmentToMove || !firebaseUser || !targetSectorId) {
            toast.error('Selecione um setor.');
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
                    usageStatus: 'IN_USE',
                    sectorId: targetSectorId,
                    responsible: targetResponsible || null
                })
            });

            if (res.ok) {
                toast.success('Equipamento enviado para uso!');
                setShowMoveToUseModal(false);
                fetchEquipment(); // Refresh list (item should disappear)
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao mover equipamento');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao processar movimentação');
        }
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === equipment.length) {
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

    const handleCreate = () => {
        setEquipmentToEdit(null);
        setModalMode('create');
        setShowCreateModal(true);
    };

    const handleEdit = (eq: Equipment) => {
        setEquipmentToEdit(eq);
        setModalMode('edit');
        setShowCreateModal(true);
    };

    const handleDuplicate = (eq: Equipment) => {
        setEquipmentToEdit(eq);
        setModalMode('duplicate');
        setShowCreateModal(true);
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

    const handleBulkMoveToUse = async () => {
        if (selectedItems.size === 0 || !firebaseUser || !targetSectorId) {
            toast.error('Selecione um setor.');
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
                        usageStatus: 'IN_USE',
                        sectorId: targetSectorId,
                        responsible: targetResponsible || null
                    })
                })
            );

            await Promise.all(promises);
            toast.success(`${selectedItems.size} equipamentos movidos para uso.`);
            setSelectedItems(new Set());
            fetchEquipment();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao mover equipamentos.');
        } finally {
            setShowBulkMoveToUseModal(false);
            setTargetSectorId('');
            setTargetResponsible('');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="h-6 w-6" /> Estoque
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {total} itens em estoque
                    </p>
                </div>
                <div className="flex gap-2">
                    {permissions?.canEditEquipment && (
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Equipamento
                        </Button>
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
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    <option value="">Todos os status</option>
                    <option value="CALIBRADO">Calibrado</option>
                    <option value="IRA_VENCER">Irá Vencer</option>
                    <option value="IRA_VENCER">Irá Vencer</option>
                    <option value="VENCIDO">Vencido</option>
                    <option value="REFERENCIA">Referência</option>
                    <option value="DESATIVADO">Desativado</option>
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    <option value="">Todos os tipos</option>
                    {types.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {/* Bulk Actions Bar */}
            {selectedItems.size > 0 && (
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border mb-4">
                    <span className="text-sm font-medium">
                        {selectedItems.size} selecionado{selectedItems.size !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2">
                        {permissions?.canEditEquipment && (
                            <>
                                <Button variant="secondary" size="sm" onClick={() => setShowBulkMoveToUseModal(true)}>
                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    Mover para Uso
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
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Localização</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Última Calibração</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vencimento</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(9)].map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <Skeleton className="h-4 w-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : equipment.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                                        Nenhum item em estoque encontrado
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
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{eq.location || '-'}</td>
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
                                        <td className="px-4 py-3">
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
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDetailsModal(false); handleMoveToUseClick(eq, e); }}>
                                                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                        Usar
                                                    </DropdownMenuItem>

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

                                                    {(permissions?.canEditEquipment) && (
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

            <EquipmentDetailsModal
                equipment={selectedEquipment as any}
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                onSchedule={() => { }} // No-op for now in stock
                onEdit={(eq) => {
                    setShowDetailsModal(false);
                    handleEdit(eq);
                }}
                onDuplicate={(eq) => {
                    setShowDetailsModal(false);
                    handleDuplicate(eq);
                }}
            />

            {/* Modal de Criação/Edição/Duplicação */}
            {showCreateModal && (
                <EquipmentModal
                    sectors={sectors}
                    types={types}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchEquipment();
                    }}
                    mode={modalMode}
                    equipmentToEdit={equipmentToEdit as any}
                    context="stock"
                />
            )}

            {/* Move to Use Modal */}
            <Dialog open={showMoveToUseModal} onOpenChange={setShowMoveToUseModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar para Uso</DialogTitle>
                        <DialogDescription>
                            Defina o setor e responsável para mover o equipamento <strong>{equipmentToMove?.name}</strong> para uso.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Setor de Destino</Label>
                            <Select value={targetSectorId} onValueChange={setTargetSectorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um setor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sectors.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Responsável (Opcional)</Label>
                            <Input
                                value={targetResponsible}
                                onChange={(e) => setTargetResponsible(e.target.value)}
                                placeholder="Nome do responsável"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMoveToUseModal(false)}>Cancelar</Button>
                        <Button onClick={confirmMoveToUse}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Move to Use Modal */}
            <Dialog open={showBulkMoveToUseModal} onOpenChange={setShowBulkMoveToUseModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar Itens para Uso (Em Massa)</DialogTitle>
                        <DialogDescription>
                            Defina o setor e responsável para mover os {selectedItems.size} equipamentos selecionados para uso.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Setor de Destino</Label>
                            <Select value={targetSectorId} onValueChange={setTargetSectorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um setor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sectors.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Responsável (Opcional)</Label>
                            <Input
                                value={targetResponsible}
                                onChange={(e) => setTargetResponsible(e.target.value)}
                                placeholder="Nome do responsável (para todos)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkMoveToUseModal(false)}>Cancelar</Button>
                        <Button onClick={handleBulkMoveToUse}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={!!equipmentToDelete}
                onClose={() => setEquipmentToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Equipamento"
                description="Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="destructive"
            />

            <ConfirmModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                title="Excluir Equipamentos"
                description={`Tem certeza que deseja excluir ${selectedItems.size} equipamentos selecionados? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                variant="destructive"
            />

        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
}
