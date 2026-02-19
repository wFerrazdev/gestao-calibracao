'use client';
// Force refresh

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CalibrationRule {
    id: string;
    intervalMonths: number;
    warnDays: number;
    equipmentTypeId: string;
}

interface EquipmentType {
    id: string;
    name: string;
}

interface RuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    rule: CalibrationRule | null;
    onSuccess: () => void;
}

export function RuleModal({ isOpen, onClose, rule, onSuccess }: RuleModalProps) {
    const { firebaseUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [types, setTypes] = useState<EquipmentType[]>([]);
    const [formData, setFormData] = useState({
        equipmentTypeId: '',
        intervalMonths: 12,
        warnDays: 30,
    });

    useEffect(() => {
        // Fetch equipment types for select
        const fetchTypes = async () => {
            if (!firebaseUser) return;
            try {
                const token = await firebaseUser.getIdToken();
                const res = await fetch('/api/equipment-types', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTypes(data);
                }
            } catch (e) {
                console.error(e);
            }
        };

        if (isOpen) fetchTypes();
    }, [isOpen, firebaseUser]);

    useEffect(() => {
        if (rule) {
            setFormData({
                equipmentTypeId: rule.equipmentTypeId,
                intervalMonths: rule.intervalMonths,
                warnDays: rule.warnDays,
            });
        } else {
            setFormData({ equipmentTypeId: '', intervalMonths: 12, warnDays: 30 });
        }
    }, [rule, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await firebaseUser?.getIdToken();
            const url = rule ? `/api/calibration-rules/${rule.id}` : '/api/calibration-rules';
            const method = rule ? 'PATCH' : 'POST';

            const payload = {
                ...formData,
                intervalMonths: Number(formData.intervalMonths),
                warnDays: Number(formData.warnDays),
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(`Regra ${rule ? 'atualizada' : 'criada'} com sucesso`);
                onSuccess();
                onClose();
            } else {
                const error = await res.json();
                toast.error(`Erro ao salvar: ${error.message}`);
            }
        } catch (error) {
            console.error('Error saving rule:', error);
            toast.error('Erro ao salvar regra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{rule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
                    <DialogDescription>
                        {rule ? 'Edite os parâmetros da regra de calibração.' : 'Defina uma regra para um tipo de equipamento.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Tipo
                            </Label>
                            <div className="col-span-3">
                                <Select
                                    disabled={!!rule} // Disable type selection on edit
                                    value={formData.equipmentTypeId}
                                    onValueChange={(val) => setFormData({ ...formData, equipmentTypeId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {types.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="interval" className="text-right">
                                Intervalo (Meses)
                            </Label>
                            <Input
                                id="interval"
                                type="number"
                                min={1}
                                value={formData.intervalMonths}
                                onChange={(e) => setFormData({ ...formData, intervalMonths: Number(e.target.value) })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="warn" className="text-right">
                                Alerta (Dias)
                            </Label>
                            <Input
                                id="warn"
                                type="number"
                                min={0}
                                value={formData.warnDays}
                                onChange={(e) => setFormData({ ...formData, warnDays: Number(e.target.value) })}
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
