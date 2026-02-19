
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Trash2, Plus, Pencil } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface AcceptanceCriteria {
    id: string;
    rangeMin: number | null;
    rangeMax: number | null;
    maxError: number | null;
    maxUncertainty: number | null;
}

interface AcceptanceCriteriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipmentTypeId: string;
    equipmentTypeName: string;
}

export function AcceptanceCriteriaModal({
    isOpen,
    onClose,
    equipmentTypeId,
    equipmentTypeName,
}: AcceptanceCriteriaModalProps) {
    const [criteria, setCriteria] = useState<AcceptanceCriteria[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        rangeMin: '',
        rangeMax: '',
        maxError: '',
        maxUncertainty: '',
    });

    const fetchCriteria = async () => {
        if (!equipmentTypeId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/acceptance-criteria?equipmentTypeId=${equipmentTypeId}`);
            if (res.ok) {
                const data = await res.json();
                setCriteria(data);
            }
        } catch (error) {
            toast.error('Erro ao buscar critérios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && equipmentTypeId) {
            fetchCriteria();
            resetForm();
        }
    }, [isOpen, equipmentTypeId]);

    const resetForm = () => {
        setEditingId(null);
        setForm({
            rangeMin: '',
            rangeMax: '',
            maxError: '',
            maxUncertainty: '',
        });
    };

    const handleEdit = (item: AcceptanceCriteria) => {
        setEditingId(item.id);
        setForm({
            rangeMin: item.rangeMin?.toString() || '',
            rangeMax: item.rangeMax?.toString() || '',
            maxError: item.maxError?.toString() || '',
            maxUncertainty: item.maxUncertainty?.toString() || '',
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este critério?')) return;
        try {
            const res = await fetch(`/api/acceptance-criteria/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Critério excluído');
                fetchCriteria();
            } else {
                toast.error('Erro ao excluir');
            }
        } catch {
            toast.error('Erro ao excluir');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            equipmentTypeId,
            rangeMin: form.rangeMin ? parseFloat(form.rangeMin) : null,
            rangeMax: form.rangeMax ? parseFloat(form.rangeMax) : null,
            maxError: form.maxError ? parseFloat(form.maxError) : null,
            maxUncertainty: form.maxUncertainty ? parseFloat(form.maxUncertainty) : null,
        };

        try {
            const url = editingId
                ? `/api/acceptance-criteria/${editingId}`
                : '/api/acceptance-criteria';

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(editingId ? 'Critério atualizado' : 'Critério criado');
                resetForm();
                fetchCriteria();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao salvar');
            }
        } catch {
            toast.error('Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Incerteza Admissível - {equipmentTypeName}</DialogTitle>
                    <DialogDescription>
                        Defina os critérios de aceitação baseados na capacidade do equipamento.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-4 border rounded-md space-y-4 bg-muted/20">
                        <h4 className="font-medium text-sm">
                            {editingId ? 'Editar Critério' : 'Novo Critério'}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Capacidade Mín.</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 0"
                                    value={form.rangeMin}
                                    onChange={e => setForm({ ...form, rangeMin: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Capacidade Máx.</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 150"
                                    value={form.rangeMax}
                                    onChange={e => setForm({ ...form, rangeMax: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Erro Máx.</Label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    placeholder="Ex: 0.05"
                                    value={form.maxError}
                                    onChange={e => setForm({ ...form, maxError: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Incerteza Máx.</Label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    placeholder="Ex: 0.02"
                                    value={form.maxUncertainty}
                                    onChange={e => setForm({ ...form, maxUncertainty: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingId && (
                                <Button type="button" variant="ghost" onClick={resetForm}>
                                    Cancelar
                                </Button>
                            )}
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Atualizar' : 'Adicionar'}
                            </Button>
                        </div>
                    </form>

                    {/* Table */}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Faixa (Capacidade)</TableHead>
                                    <TableHead>Erro Máx. Adm.</TableHead>
                                    <TableHead>Incerteza Máx.</TableHead>
                                    <TableHead className="w-[100px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : criteria.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Nenhum critério definido.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    criteria.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {item.rangeMin ?? '0'} - {item.rangeMax ?? '∞'}
                                            </TableCell>
                                            <TableCell>{item.maxError ?? '-'}</TableCell>
                                            <TableCell>{item.maxUncertainty ?? '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

