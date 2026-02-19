'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, MoreHorizontal, Pencil, Trash } from 'lucide-react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/confirm-modal';
import { TypeModal } from '@/app/(app)/tipos-equipamento/components/type-modal';

interface EquipmentType {
    id: string;
    name: string;
    _count: {
        Equipment: number;
    };
}

export default function EquipmentTypesPage() {
    const { firebaseUser } = useAuth();
    const { permissions, isCriador, loading: userLoading } = useUser();
    const [types, setTypes] = useState<EquipmentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<EquipmentType | null>(null);

    const [typeToDelete, setTypeToDelete] = useState<EquipmentType | null>(null);

    const fetchTypes = async () => {
        if (!firebaseUser) return;
        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch('/api/equipment-types', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTypes(data);
            }
        } catch (error) {
            console.error('Error fetching types:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firebaseUser) fetchTypes();
    }, [firebaseUser]);

    const handleDeleteClick = (type: EquipmentType) => {
        setTypeToDelete(type);
    };

    const confirmDelete = async () => {
        if (!typeToDelete) return;

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch(`/api/equipment-types/${typeToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Tipo excluído com sucesso');
                fetchTypes();
            } else {
                const error = await res.json();
                toast.error(error.error || error.message || 'Erro ao excluir tipo');
            }
        } catch (error) {
            toast.error('Erro ao excluir tipo');
        } finally {
            setTypeToDelete(null);
        }
    };

    const filteredTypes = types.filter(type =>
        type.name.toLowerCase().includes(search.toLowerCase())
    );

    const canEdit = isCriador || permissions?.canManageRules;

    if (userLoading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tipos de Equipamento</h2>
                    <p className="text-muted-foreground">
                        Gerencie as categorias de equipamentos (ex: Paquímetro, Balança).
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => { setSelectedType(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Tipo
                    </Button>
                )}
            </div>

            <div className="flex items-center py-4">
                <Input
                    placeholder="Filtrar tipos..."
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
                            <TableHead>Equipamentos</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">Nenhum tipo encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            filteredTypes.map((type) => (
                                <TableRow key={type.id}>
                                    <TableCell className="font-medium">{type.name}</TableCell>
                                    <TableCell>{type._count?.Equipment || 0}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => { setSelectedType(type); setIsModalOpen(true); }}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(type)} className="text-red-600">
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

            <TypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                type={selectedType}
                onSuccess={fetchTypes}
            />

            <ConfirmModal
                isOpen={!!typeToDelete}
                onClose={() => setTypeToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Tipo de Equipamento"
                description={`Tem certeza que deseja excluir o tipo "${typeToDelete?.name}"? Equipamentos associados podem ficar sem classificação.`}
                confirmText="Excluir"
                variant="destructive"
            />
        </div>
    );
}
