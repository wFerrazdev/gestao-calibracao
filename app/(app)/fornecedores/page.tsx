'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Mail, Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
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
import { SupplierModal } from './components/supplier-modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/confirm-modal';

interface Supplier {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    createdAt: string;
}

export default function SuppliersPage() {
    const { firebaseUser } = useAuth();
    const { user, permissions } = useUser(); // Using permissions if needed, generally role check
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Supplier Create/Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Delete Modal
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

    const fetchSuppliers = async () => {
        if (!firebaseUser) return;
        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch('/api/suppliers', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error('Erro ao carregar fornecedores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firebaseUser) fetchSuppliers();
    }, [firebaseUser]);

    const handleDeleteClick = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
    };

    const confirmDelete = async () => {
        if (!supplierToDelete) return;

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch(`/api/suppliers/${supplierToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Fornecedor excluído com sucesso');
                fetchSuppliers();
            } else {
                const errorData = await res.text(); // or json depending on api
                toast.error(errorData || 'Erro ao excluir fornecedor');
            }
        } catch (error) {
            toast.error('Erro ao excluir fornecedor');
        } finally {
            setSupplierToDelete(null);
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedSupplier(null);
        setIsModalOpen(true);
    };

    const filteredSuppliers = suppliers.filter((supplier) =>
        supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        (supplier.email && supplier.email.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading && suppliers.length === 0) {
        return <div className="p-8 text-center">Carregando...</div>;
    }

    // Access control: only active users (roles other than VIEWER can edit? Or maybe only ADMIN/QUALITY?)
    // Assuming PRODUCATION/VIEWER cannot edit suppliers.
    const canEdit = user?.role === 'ADMIN' || user?.role === 'QUALIDADE' || user?.role === 'CRIADOR';

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Fornecedores</h2>
                    <p className="text-muted-foreground">
                        Gerencie seus fornecedores de calibração e manutenção.
                    </p>
                </div>
                <div className="flex gap-2">
                    {canEdit && (
                        <Button variant="secondary" asChild>
                            <Link href="/fornecedores/nova-solicitacao">
                                <Mail className="mr-2 h-4 w-4" />
                                Solicitar Orçamento
                            </Link>
                        </Button>
                    )}
                    {canEdit && (
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Fornecedor
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Input
                    placeholder="Buscar fornecedores..."
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
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSuppliers.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell className="font-medium">{supplier.name}</TableCell>
                                <TableCell>{supplier.email || '-'}</TableCell>
                                <TableCell>{supplier.phone || '-'}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={supplier.address || ''}>
                                    {supplier.address || '-'}
                                </TableCell>
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
                                                <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteClick(supplier)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredSuppliers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum fornecedor encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <SupplierModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchSuppliers}
                supplier={selectedSupplier}
            />

            <ConfirmModal
                isOpen={!!supplierToDelete}
                onClose={() => setSupplierToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Fornecedor"
                description={`Tem certeza que deseja excluir o fornecedor "${supplierToDelete?.name}"? Esta ação não pode ser desfeita e pode falhar se houver ordens de serviço associadas.`}
            />
        </div>
    );
}
