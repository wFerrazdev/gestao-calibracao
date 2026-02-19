'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AuditLog {
    id: string;
    createdAt: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: any;
    User: {
        name: string;
        email: string;
    } | null;
}

import { useAuth } from '@/contexts/AuthContext';

// ...

export default function AuditLogsPage() {
    const { user, isCriador } = useUser();
    const { firebaseUser } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = useCallback(async () => {
        if (!firebaseUser) return;

        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotalPages(data.pages);
            }
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, firebaseUser]);

    useEffect(() => {
        if (user && (isCriador || user.role === 'ADMIN')) {
            fetchLogs();
        }
    }, [user, isCriador, fetchLogs]);

    if (!isCriador && user?.role !== 'ADMIN') {
        return <div className="p-8 text-destructive">Acesso negado</div>;
    }

    const getActionBadge = (action: string) => {
        let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
        switch (action) {
            case 'CREATE': variant = 'default'; break;
            case 'UPDATE': variant = 'secondary'; break;
            case 'DELETE': variant = 'destructive'; break;
        }
        return <Badge variant={variant}>{action}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h2>
                <p className="text-muted-foreground">
                    Histórico de ações críticas realizadas no sistema.
                </p>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Ação</TableHead>
                            <TableHead>Entidade</TableHead>
                            <TableHead className="w-[100px]">Detalhes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Nenhum registro encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs">
                                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{log.User?.name || 'Sistema'}</span>
                                            <span className="text-xs text-muted-foreground">{log.User?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getActionBadge(log.action)}</TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs text-muted-foreground">{log.entityType}</span>
                                        <br />
                                        <span className="text-xs text-muted-foreground truncate max-w-[100px] block" title={log.entityId}>
                                            {log.entityId.slice(0, 8)}...
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </Button>
                <div className="text-sm font-medium">
                    Página {page} de {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Modal de Detalhes JSON */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl" aria-describedby="log-description">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Log</DialogTitle>
                        <DialogDescription id="log-description">
                            ID: {selectedLog?.id}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto rounded-md bg-muted p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                            {JSON.stringify(selectedLog?.metadata, null, 2)}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
