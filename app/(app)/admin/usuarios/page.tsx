'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import {
    UserCheck, UserX, Shield, Search,
    MoreHorizontal, CheckCircle, XCircle, RotateCcw,
    Trash2, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    sectorId: string | null;
    firebaseUid: string;
    createdAt: string;
    Sector: { id: string; name: string } | null;
}

interface Sector {
    id: string;
    name: string;
}

const ROLES = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'QUALIDADE', label: 'Qualidade' },
    { value: 'PRODUCAO', label: 'Produção' },
    { value: 'VIEWER', label: 'Visualizador' },
];

const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
        CRIADOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        QUALIDADE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        PRODUCAO: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        VIEWER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    const labels: Record<string, string> = {
        CRIADOR: 'Criador',
        ADMIN: 'Admin',
        QUALIDADE: 'Qualidade',
        PRODUCAO: 'Produção',
        VIEWER: 'Viewer',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || colors.VIEWER}`}>
            {labels[role] || role}
        </span>
    );
};

export default function AdminUsuariosPage() {
    const { firebaseUser } = useAuth();
    const { isCriador, loading: userLoading, user: dbUser } = useUser();

    const [users, setUsers] = useState<User[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('PENDING');

    // Modal de aprovação
    const [approveModal, setApproveModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [approveRole, setApproveRole] = useState('');
    const [approveSector, setApproveSector] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Modal de edição
    const [editModal, setEditModal] = useState(false);
    const [editRole, setEditRole] = useState('');
    const [editSector, setEditSector] = useState('');

    // Modal de exclusão
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        if (!firebaseUser) return;
        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const [usersRes, sectorsRes] = await Promise.all([
                fetch('/api/admin/users', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('/api/sectors', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users);
                setPendingCount(data.pendingCount);
            }
            if (sectorsRes.ok) {
                setSectors(await sectorsRes.json());
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    }, [firebaseUser]);

    useEffect(() => {
        if (firebaseUser && isCriador) fetchUsers();
    }, [firebaseUser, isCriador, fetchUsers]);

    const handleApprove = async () => {
        if (!selectedUser || !approveRole) return;

        if (approveRole === 'PRODUCAO' && !approveSector) {
            toast.error('Selecione um setor para usuário Produção');
            return;
        }

        setSubmitting(true);
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch('/api/admin/users/approve', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    role: approveRole,
                    sectorId: approveSector || null,
                }),
            });

            if (res.ok) {
                toast.success(`${selectedUser.name} aprovado como ${approveRole}`);
                setApproveModal(false);
                setSelectedUser(null);
                setApproveRole('');
                setApproveSector('');
                fetchUsers();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Erro ao aprovar');
            }
        } catch {
            toast.error('Erro ao aprovar usuário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (userId: string, status: string) => {
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, status }),
            });

            if (res.ok) {
                toast.success(status === 'DISABLED' ? 'Usuário bloqueado' : 'Usuário reativado');
                fetchUsers();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Erro ao atualizar');
            }
        } catch {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleEdit = async () => {
        if (!selectedUser || !editRole) return;

        if (editRole === 'PRODUCAO' && !editSector) {
            toast.error('Selecione um setor para usuário Produção');
            return;
        }

        setSubmitting(true);
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    role: editRole,
                    sectorId: editSector || null,
                }),
            });

            if (res.ok) {
                toast.success('Usuário atualizado');
                setEditModal(false);
                setSelectedUser(null);
                fetchUsers();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Erro ao atualizar');
            }
        } catch {
            toast.error('Erro ao atualizar usuário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;

        setDeleteLoading(true);
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Usuário excluído com sucesso');
                setDeleteModal(false);
                setSelectedUser(null);
                fetchUsers();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Erro ao excluir usuário');
                if (error.code === 'HAS_DEPENDENCIES') {
                    // Sugerir desativação se tiver dependências
                    // Opcional: abrir modal de bloqueio ou só avisar
                }
            }
        } catch {
            toast.error('Erro ao excluir usuário');
        } finally {
            setDeleteLoading(false);
        }
    };

    const isCriadorUser = (u: User) => u.role === 'CRIADOR';

    if (userLoading) return <div className="p-8">Carregando...</div>;

    // Permission Check: Only Criador, Admin or Producao
    const canView = isCriador || dbUser?.role === 'ADMIN' || dbUser?.role === 'PRODUCAO';

    if (!canView) return <div className="p-8 text-destructive">Acesso negado</div>;

    const filteredUsers = users.filter(u => {
        // Sector Filter for PRODUCAO
        if (dbUser?.role === 'PRODUCAO' && u.sectorId !== dbUser.sectorId) {
            return false;
        }

        const matchesTab = activeTab === 'ALL' || u.status === activeTab;
        const matchesSearch = !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const renderTable = (userList: User[]) => (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                {Array.from({ length: 7 }).map((_, j) => (
                                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : userList.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                Nenhum usuário encontrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        userList.map((u) => {
                            // Permission Logic for Actions
                            const isSelf = u.id === dbUser?.id;
                            const isTargetAdminOrHigher = u.role === 'ADMIN' || u.role === 'CRIADOR';
                            const isCurUserAdmin = dbUser?.role === 'ADMIN';

                            // Admin cannot edit/delete other Admins or Criador
                            // Admin cannot delete anyone (per requirement "Cannot delete existing registered users")
                            // Admin can approve users (PENDING)

                            const canEdit = isCriador || (isCurUserAdmin && !isTargetAdminOrHigher);
                            // Delete is ONLY for Criador now
                            const canDelete = isCriador && !isSelf;
                            const canApprove = isCriador || isCurUserAdmin;

                            return (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {u.name}
                                            {isCriadorUser(u) && (
                                                <Shield className="h-4 w-4 text-purple-500" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                                    <TableCell>{u.Sector?.name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            u.status === 'ACTIVE' ? 'default' :
                                                u.status === 'PENDING' ? 'secondary' : 'destructive'
                                        }>
                                            {u.status === 'ACTIVE' ? 'Ativo' :
                                                u.status === 'PENDING' ? 'Pendente' : 'Bloqueado'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        {!isCriadorUser(u) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />

                                                    {u.status === 'PENDING' && canApprove && (
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedUser(u);
                                                            setApproveRole('');
                                                            setApproveSector('');
                                                            setApproveModal(true);
                                                        }}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                            Aprovar
                                                        </DropdownMenuItem>
                                                    )}

                                                    {u.status === 'ACTIVE' && canEdit && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedUser(u);
                                                                setEditRole(u.role);
                                                                setEditSector(u.sectorId || '');
                                                                setEditModal(true);
                                                            }}>
                                                                <Shield className="mr-2 h-4 w-4" />
                                                                Editar Role/Setor
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleUpdateStatus(u.id, 'DISABLED')}
                                                                className="text-red-600"
                                                            >
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                                Bloquear
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {u.status === 'DISABLED' && canEdit && (
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}>
                                                            <RotateCcw className="mr-2 h-4 w-4 text-green-600" />
                                                            Reativar
                                                        </DropdownMenuItem>
                                                    )}

                                                    {canDelete && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedUser(u);
                                                                    setDeleteModal(true);
                                                                }}
                                                                className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h2>
                <p className="text-muted-foreground">
                    Aprove, edite e gerencie os acessos dos usuários do sistema.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="PENDING" className="gap-2">
                        <UserCheck className="h-4 w-4" />
                        Pendentes
                        {pendingCount > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                                {pendingCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="ACTIVE">Ativos</TabsTrigger>
                    <TabsTrigger value="DISABLED" className="gap-2">
                        <UserX className="h-4 w-4" />
                        Bloqueados
                    </TabsTrigger>
                    <TabsTrigger value="ALL">Todos</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                    {renderTable(filteredUsers)}
                </TabsContent>
            </Tabs>

            {/* Modal de Aprovação */}
            <Dialog open={approveModal} onOpenChange={setApproveModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Aprovar Usuário</DialogTitle>
                        <DialogDescription>
                            Defina a role e setor para <strong>{selectedUser?.name}</strong> ({selectedUser?.email})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role *</label>
                            <Select value={approveRole} onValueChange={setApproveRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(r => (
                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(approveRole === 'PRODUCAO' || approveRole === 'QUALIDADE') && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Setor {approveRole === 'PRODUCAO' ? '*' : '(opcional)'}
                                </label>
                                <Select value={approveSector} onValueChange={setApproveSector}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um setor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sectors.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveModal(false)}>Cancelar</Button>
                        <Button onClick={handleApprove} disabled={submitting || !approveRole}>
                            {submitting ? 'Aprovando...' : 'Aprovar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Edição */}
            <Dialog open={editModal} onOpenChange={setEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Usuário</DialogTitle>
                        <DialogDescription>
                            Altere a role ou setor de <strong>{selectedUser?.name}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(r => (
                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Setor {editRole === 'PRODUCAO' ? '*' : '(opcional)'}
                            </label>
                            <Select value={editSector} onValueChange={setEditSector}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Nenhum setor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {sectors.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditModal(false)}>Cancelar</Button>
                        <Button onClick={handleEdit} disabled={submitting}>
                            {submitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Exclusão */}
            <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Excluir Usuário
                        </DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o usuário <strong>{selectedUser?.name}</strong>?
                            <br /><br />
                            Esta ação é irreversível e removerá o acesso do usuário permanentemente.
                            <br />
                            <span className="text-xs text-muted-foreground mt-2 block">
                                Nota: Usuários com histórico de calibrações ou logs não podem ser excluídos.
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? 'Excluindo...' : 'Excluir Usuário'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
