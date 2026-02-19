'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import {
    Plus, MoreHorizontal, Pencil, Trash,
    ArrowLeft, Search, Filter
} from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { EquipmentModal } from '../components/equipment-modal';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sector {
    id: string;
    name: string;
    code: string | null;
}

interface Equipment {
    id: string;
    name: string;
    code: string;
    manufacturerModel: string | null;
    resolution: string | null;
    capacity: string | null;
    status: 'CALIBRADO' | 'IRA_VENCER' | 'VENCIDO' | 'DESATIVADO' | 'REFERENCIA';
    dueDate: string | null;
    lastCalibrationDate: string | null;
    lastCertificateNumber: string | null;
    equipmentType: {
        name: string;
    };
    equipmentTypeId: string;
    notes: string | null;
}

export default function SectorDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { firebaseUser } = useAuth();
    const { permissions, isCriador, loading: userLoading } = useUser();

    const [sector, setSector] = useState<Sector | null>(null);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

    const sectorId = params.id as string;

    const fetchDetails = async () => {
        if (!firebaseUser || !sectorId) return;
        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();

            // 1. Fetch Sector Params
            const sectorRes = await fetch(`/api/sectors/${sectorId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (sectorRes.ok) {
                setSector(await sectorRes.json());
            } else {
                toast.error('Erro ao carregar setor');
                router.push('/setores');
                return;
            }

            // 2. Fetch Equipment
            const eqRes = await fetch(`/api/equipment?sectorId=${sectorId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (eqRes.ok) {
                const data = await eqRes.json();
                setEquipmentList(data.items || []);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firebaseUser) fetchDetails();
    }, [firebaseUser, sectorId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch(`/api/equipment/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Equipamento excluído com sucesso');
                fetchDetails();
            } else {
                const error = await res.json();
                toast.error(`Erro ao excluir: ${error.message}`);
            }
        } catch (error) {
            toast.error('Erro ao excluir equipamento');
        }
    };

    const filteredEquipment = equipmentList.filter(eq => {
        const matchesSearch =
            eq.name.toLowerCase().includes(search.toLowerCase()) ||
            eq.code.toLowerCase().includes(search.toLowerCase()) ||
            (eq.manufacturerModel && eq.manufacturerModel.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || eq.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CALIBRADO': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'IRA_VENCER': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'VENCIDO': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'DESATIVADO': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
            case 'REFERENCIA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'CALIBRADO': return 'Calibrado';
            case 'IRA_VENCER': return 'Irá Vencer';
            case 'VENCIDO': return 'Vencido';
            case 'DESATIVADO': return 'Desativado';
            case 'REFERENCIA': return 'Referência';
            default: return status;
        }
    };

    const canEdit = isCriador || permissions?.canEditEquipment;

    if (userLoading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/setores">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{sector?.name || 'Carregando...'}</h2>
                    <p className="text-muted-foreground">
                        {sector?.code ? `Código: ${sector.code}` : 'Detalhes do setor e equipamentos vinculados'}
                    </p>
                </div>
                <div className="ml-auto">
                    {canEdit && (
                        <Button onClick={() => { setSelectedEquipment(null); setIsModalOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Novo Equipamento
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, código ou modelo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="w-full sm:w-[200px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos os Status</SelectItem>
                            <SelectItem value="CALIBRADO">Calibrado</SelectItem>
                            <SelectItem value="IRA_VENCER">Irá Vencer</SelectItem>
                            <SelectItem value="VENCIDO">Vencido</SelectItem>
                            <SelectItem value="DESATIVADO">Desativado</SelectItem>
                            <SelectItem value="REFERENCIA">Referência</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Equipamento</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredEquipment.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    Nenhum equipamento encontrado neste setor.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEquipment.map((eq) => (
                                <TableRow key={eq.id}>
                                    <TableCell className="font-mono text-xs">{eq.code}</TableCell>
                                    <TableCell className="font-medium">{eq.name}</TableCell>
                                    <TableCell>{eq.equipmentType?.name}</TableCell>
                                    <TableCell>{eq.manufacturerModel || '-'}</TableCell>
                                    <TableCell>
                                        {eq.dueDate
                                            ? format(new Date(eq.dueDate), 'dd/MM/yyyy', { locale: ptBR })
                                            : '-'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(eq.status)}`}>
                                            {getStatusLabel(eq.status)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/equipamentos/${eq.id}/calibracoes`}>
                                                        📅 Histórico
                                                    </Link>
                                                </DropdownMenuItem>
                                                {canEdit && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => { setSelectedEquipment(eq); setIsModalOpen(true); }}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(eq.id)} className="text-red-600">
                                                            <Trash className="mr-2 h-4 w-4" /> Excluir
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EquipmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                equipment={selectedEquipment}
                sectorId={sectorId}
                onSuccess={fetchDetails}
            />
        </div>
    );
}
