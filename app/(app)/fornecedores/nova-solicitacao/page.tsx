'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Supplier {
    id: string;
    name: string;
    email?: string;
}

interface Equipment {
    id: string;
    name: string;
    code: string;
    manufacturerModel: string;
    status: string;
    EquipmentType: { name: string };
    Sector: { name: string };
}

export default function NewQuoteRequestPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedSupplierId = searchParams.get('supplierId');

    const { firebaseUser } = useAuth();
    const { user } = useUser();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>(preSelectedSupplierId || '');

    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loadingEquipments, setLoadingEquipments] = useState(false);

    const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Source Filter: 'all', 'use', 'stock'
    const [sourceFilter, setSourceFilter] = useState<'all' | 'use' | 'stock'>('use');

    // Email Fields
    const [emailSubject, setEmailSubject] = useState('Solicitação de Orçamento');
    const [emailBody, setEmailBody] = useState(`Prezados,\n\nGostaria de solicitar um orçamento para calibração dos equipamentos listados abaixo.\n\nFico no aguardo.\n\nAtenciosamente,`);
    const [emailCc, setEmailCc] = useState('');

    useEffect(() => {
        const fetchSuppliers = async () => {
            if (!firebaseUser) return;
            try {
                const token = await firebaseUser.getIdToken();
                const res = await fetch('/api/suppliers', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSuppliers(data);
                }
            } catch (error) {
                console.error('Error fetching suppliers:', error);
                toast.error('Erro ao carregar fornecedores');
            }
        };

        fetchSuppliers();
    }, [firebaseUser]);

    useEffect(() => {
        const fetchEquipments = async () => {
            if (!firebaseUser) return;
            setLoadingEquipments(true);
            try {
                const token = await firebaseUser.getIdToken();
                // Fetch all active equipments (not deactivated)
                // We might want to filter by "VENCIDO" or "IRA_VENCER" ideally, 
                // but user wants ability to select.
                const res = await fetch('/api/equipment?status=VENCIDO&pageSize=1000', { // Initial fetch, maybe allow search
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Also fetch IRA_VENCER separately or handle pagination/search properly. 
                // For now, let's fetch a broad list. 
                // Actually, the API supports search `q`.

                // Let's just fetch default list for now.
                // Build query string based on filters
                let url = `/api/equipment?pageSize=100`;

                if (sourceFilter === 'use') {
                    url += '&usageStatus=IN_USE';
                } else if (sourceFilter === 'stock') {
                    url += '&usageStatus=IN_STOCK';
                }
                // if 'all', don't send usageStatus param (assuming API returns all)

                if (searchTerm) {
                    url += `&q=${searchTerm}`;
                }

                const resAll = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (resAll.ok) {
                    const data = await resAll.json();
                    // Fix: Check if data is array or object with items
                    const items = Array.isArray(data) ? data : (data.items || []);
                    setEquipments(items);
                }
            } catch (error) {
                console.error('Error fetching equipments:', error);
                toast.error('Erro ao carregar equipamentos');
            } finally {
                setLoadingEquipments(false);
            }
        };

        fetchEquipments();
    }, [firebaseUser]);

    useEffect(() => {
        const fetchEquipments = async () => {
            if (!firebaseUser) return;
            setLoadingEquipments(true);
            try {
                const token = await firebaseUser.getIdToken();
                let url = `/api/equipment?pageSize=100`;
                if (sourceFilter === 'use') url += '&usageStatus=IN_USE';
                else if (sourceFilter === 'stock') url += '&usageStatus=IN_STOCK';

                if (searchTerm) url += `&q=${searchTerm}`;

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const items = Array.isArray(data) ? data : (data.items || []);
                    setEquipments(items);
                }
            } catch (error) {
                console.error("Search/Filter error", error);
            } finally {
                setLoadingEquipments(false);
            }
        }

        // Debounce search, but filter change is immediate
        const timeoutId = setTimeout(() => {
            fetchEquipments();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, sourceFilter, firebaseUser]);


    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = equipments.map(e => e.id);
            setSelectedEquipmentIds(new Set(allIds));
        } else {
            setSelectedEquipmentIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedEquipmentIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedEquipmentIds(newSet);
    };

    // Effect to update email body when selection changes
    useEffect(() => {
        const selectedEquipments = equipments.filter(e => selectedEquipmentIds.has(e.id));
        const equipmentListText = selectedEquipments.length > 0
            ? '\n\nItens para Cotação:\n' + selectedEquipments.map(e => `- ${e.name} (${e.code})`).join('\n')
            : '';

        // Base text (Prezados...)
        const baseIndentifier = 'Prezados,';
        const signatureIdentifier = 'Atenciosamente,';

        // We want to preserve any custom text the user might have added above the list if possible,
        // OR just reset to template + list.
        // Given the request "conforme fomos selecionando... vai adicionando", 
        // a simple approach is: keep the current text BEFORE the "Itens para Cotação" marker, and replace after.

        setEmailBody(prev => {
            const splitMarker = '\n\nItens para Cotação:';
            const parts = prev.split(splitMarker);
            const userText = parts[0] || prev;

            // Should we add signature back if it was cut?
            // If the user text doesn't have signature, maybe we append it? 
            // Better to keep it simple: User text + List.
            // If the original text had the signature at the end, it might be weird.
            // Let's assume the user edits the TOP part mostly.

            return `${userText}${equipmentListText}`;
        });
    }, [selectedEquipmentIds, equipments]);

    const handleSubmit = async () => {
        if (!selectedSupplierId) {
            toast.error('Selecione um fornecedor');
            return;
        }
        if (selectedEquipmentIds.size === 0) {
            toast.error('Selecione pelo menos um equipamento');
            return;
        }

        setSubmitting(true);
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch('/api/service-orders/quote-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    supplierId: selectedSupplierId,
                    equipmentIds: Array.from(selectedEquipmentIds),
                    emailSubject,
                    emailBody,
                    emailCc,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.quoteRequestId) {
                    router.push(`/solicitacoes/${data.quoteRequestId}`);
                } else {
                    // Fallback if no ID returned (shouldn't happen with new API)
                    toast.success('Solicitação criada!');
                    router.push('/dashboard');
                }
            } else {
                toast.error('Erro ao criar solicitação');
            }
        } catch (error) {
            console.error('Error submitting quote request:', error);
            toast.error('Erro ao criar solicitação');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/fornecedores">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nova Solicitação de Orçamento</h2>
                    <p className="text-muted-foreground">
                        Selecione o fornecedor e os equipamentos para solicitar cotação.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                <div className="space-y-4">
                    <div className="bg-card rounded-lg border p-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fornecedor</label>
                            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>



                        <div className="space-y-2">
                            <label className="text-sm font-medium">Dados do Email</label>
                            <div className="space-y-3">
                                <Input
                                    placeholder="Assunto"
                                    value={emailSubject}
                                    onChange={e => setEmailSubject(e.target.value)}
                                />
                                <Input
                                    placeholder="CC (separado por vírgula)"
                                    value={emailCc}
                                    onChange={e => setEmailCc(e.target.value)}
                                />
                                <textarea
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Mensagem"
                                    value={emailBody}
                                    onChange={e => setEmailBody(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground">Selecionados:</span>
                                <span className="font-bold">{selectedEquipmentIds.size}</span>
                            </div>
                            <Button
                                className="w-full"
                                onClick={handleSubmit}
                                disabled={submitting || selectedEquipmentIds.size === 0 || !selectedSupplierId}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Solicitação
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar equipamentos (código, nome...)"
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="space-x-2">
                            <Button
                                variant={sourceFilter === 'use' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSourceFilter('use')}
                            >
                                Mestra (Em Uso)
                            </Button>
                            <Button
                                variant={sourceFilter === 'stock' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSourceFilter('stock')}
                            >
                                Estoque
                            </Button>
                            <Button
                                variant={sourceFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSourceFilter('all')}
                            >
                                Todos
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={equipments.length > 0 && selectedEquipmentIds.size === equipments.length}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Setor</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingEquipments ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : equipments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Nenhum equipamento encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    equipments.map((equipment) => (
                                        <TableRow key={equipment.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedEquipmentIds.has(equipment.id)}
                                                    onCheckedChange={(checked) => handleSelectOne(equipment.id, checked as boolean)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{equipment.code}</TableCell>
                                            <TableCell>{equipment.name}</TableCell>
                                            <TableCell>{equipment.EquipmentType?.name || '-'}</TableCell>
                                            <TableCell>{equipment.Sector?.name || '-'}</TableCell>
                                            <TableCell>
                                                {/* Simple status badge for now, reusing standard badge variants if possible or just text */}
                                                <Badge variant="outline">{equipment.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div >
    );
}
