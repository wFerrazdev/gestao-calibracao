'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, MoreHorizontal, Pencil, Trash, ListChecks } from 'lucide-react';
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
import { RuleModal } from '@/app/(app)/regras-calibracao/components/rule-modal';
import { AcceptanceCriteriaModal } from '@/app/(app)/regras-calibracao/components/acceptance-criteria-modal';

interface CalibrationRule {
    id: string;
    intervalMonths: number;
    warnDays: number;
    equipmentTypeId: string;
    EquipmentType: {
        name: string;
    };
}

export default function RulesPage() {
    const { firebaseUser } = useAuth();
    const { permissions, isCriador, loading: userLoading } = useUser();
    const [rules, setRules] = useState<CalibrationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<CalibrationRule | null>(null);

    const [ruleToDelete, setRuleToDelete] = useState<CalibrationRule | null>(null);

    const [acceptanceModalOpen, setAcceptanceModalOpen] = useState(false);
    const [selectedTypeForCriteria, setSelectedTypeForCriteria] = useState<{ id: string; name: string } | null>(null);

    const fetchRules = async () => {
        if (!firebaseUser) return;
        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch('/api/calibration-rules', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (error) {
            console.error('Error fetching rules:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firebaseUser) fetchRules();
    }, [firebaseUser]);

    const handleDeleteClick = (rule: CalibrationRule) => {
        setRuleToDelete(rule);
    };

    const confirmDelete = async () => {
        if (!ruleToDelete) return;

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch(`/api/calibration-rules/${ruleToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Regra excluída com sucesso');
                fetchRules();
            } else {
                const error = await res.json();
                toast.error(`Erro ao excluir: ${error.message}`);
            }
        } catch (error) {
            toast.error('Erro ao excluir regra');
        } finally {
            setRuleToDelete(null);
        }
    };

    const filteredRules = rules.filter(rule =>
        rule.EquipmentType?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const canEdit = isCriador || permissions?.canManageRules;

    if (userLoading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Regras de Calibração</h2>
                    <p className="text-muted-foreground">
                        Defina a periodicidade de calibração para cada tipo de equipamento.
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => { setSelectedRule(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Nova Regra
                    </Button>
                )}
            </div>

            <div className="flex items-center py-4">
                <Input
                    placeholder="Filtrar por tipo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tipo de Equipamento</TableHead>
                            <TableHead>Periodicidade (Meses)</TableHead>
                            <TableHead>Alerta Prévio (Dias)</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredRules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Nenhuma regra cadastrada.</TableCell>
                            </TableRow>
                        ) : (
                            filteredRules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">{rule.EquipmentType?.name || '-'}</TableCell>
                                    <TableCell>{rule.intervalMonths} meses</TableCell>
                                    <TableCell>{rule.warnDays} dias</TableCell>
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
                                                    <DropdownMenuItem onClick={() => { setSelectedRule(rule); setIsModalOpen(true); }}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedTypeForCriteria({ id: rule.equipmentTypeId, name: rule.EquipmentType.name });
                                                        setAcceptanceModalOpen(true);
                                                    }}>
                                                        <ListChecks className="mr-2 h-4 w-4" /> Critérios de Aceitação
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(rule)} className="text-red-600">
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

            <RuleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                rule={selectedRule}
                onSuccess={fetchRules}
            />

            <AcceptanceCriteriaModal
                isOpen={acceptanceModalOpen}
                onClose={() => setAcceptanceModalOpen(false)}
                equipmentTypeId={selectedTypeForCriteria?.id || ''}
                equipmentTypeName={selectedTypeForCriteria?.name || ''}
            />

            <ConfirmModal
                isOpen={!!ruleToDelete}
                onClose={() => setRuleToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Regra"
                description={`Tem certeza que deseja excluir a regra para o tipo "${ruleToDelete?.EquipmentType?.name || 'Desconhecido'}"? Os equipamentos deste tipo perderão o cálculo automático.`}
                confirmText="Excluir"
                variant="destructive"
            />
        </div>
    );
}
