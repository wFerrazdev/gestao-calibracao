'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SectorModal } from './components/sector-modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/confirm-modal';

interface Sector {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    _count: {
        Equipment: number;
        User: number;
    };
}

export default function SectorsPage() {
    const { firebaseUser } = useAuth();
    const { permissions, isCriador, loading: userLoading } = useUser();
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
    const [sectorToDelete, setSectorToDelete] = useState<Sector | null>(null);

    const fetchSectors = async () => {
        if (!firebaseUser) return;
        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch('/api/sectors', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSectors(data);
            }
        } catch (error) {
            console.error('Error fetching sectors:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firebaseUser) fetchSectors();
    }, [firebaseUser]);

    const handleDeleteClick = (sector: Sector) => {
        setSectorToDelete(sector);
    };

    const confirmDelete = async () => {
        if (!sectorToDelete) return;

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch(`/api/sectors/${sectorToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Setor excluído com sucesso');
                fetchSectors();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || errorData.message || 'Erro ao excluir setor');
            }
        } catch (error) {
            toast.error('Erro ao excluir setor');
        } finally {
            setSectorToDelete(null);
        }
    };

    const filteredSectors = sectors.filter(sector =>
        sector.name.toLowerCase().includes(search.toLowerCase()) ||
        sector.code?.toLowerCase().includes(search.toLowerCase())
    );

    const canEdit = isCriador || permissions?.canManageRules;

    if (userLoading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Setores</h2>
                    <p className="text-muted-foreground">
                        Gerencie os departamentos e áreas da empresa.
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => { setSelectedSector(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Setor
                    </Button>
                )}
            </div>

            <div className="flex items-center py-4">
                <Input
                    placeholder="Filtrar setores..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Equipamentos</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredSectors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Nenhum setor encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            filteredSectors.map((sector) => (
                                <TableRow key={sector.id}>
                                    <TableCell className="font-medium">{sector.name}</TableCell>
                                    <TableCell>{sector.code || '-'}</TableCell>
                                    <TableCell>{sector.description || '-'}</TableCell>
                                    <TableCell>{sector._count?.Equipment || 0}</TableCell>
                                    <TableCell>
                                        {canEdit && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => { setSelectedSector(sector); setIsModalOpen(true); }}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(sector)} className="text-red-600">
                                                        <Trash className="mr-2 h-4 w-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <SectorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                sector={selectedSector}
                onSuccess={fetchSectors}
            />

            <ConfirmModal
                isOpen={!!sectorToDelete}
                onClose={() => setSectorToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Setor"
                description={`Tem certeza que deseja excluir o setor "${sectorToDelete?.name}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                variant="destructive"
            />
        </div>
    );
}
