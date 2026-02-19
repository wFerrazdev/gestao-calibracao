'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface Equipment {
    id: string;
    name: string;
    code: string;
    manufacturerModel: string | null;
    resolution: string | null;
    capacity: string | null;
    equipmentTypeId: string;
    notes: string | null;
    lastCalibrationDate: string | null;
    lastCertificateNumber: string | null;
}

interface EquipmentType {
    id: string;
    name: string;
}

interface EquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipment: Equipment | null;
    sectorId: string;
    onSuccess: () => void;
}

export function EquipmentModal({ isOpen, onClose, equipment, sectorId, onSuccess }: EquipmentModalProps) {
    const { firebaseUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [types, setTypes] = useState<EquipmentType[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        manufacturerModel: '',
        resolution: '',
        capacity: '',
        equipmentTypeId: '',
        notes: '',
    });

    // Fetch equipment types
    useEffect(() => {
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

    // Populate form on edit
    useEffect(() => {
        if (equipment) {
            setFormData({
                name: equipment.name,
                code: equipment.code,
                manufacturerModel: equipment.manufacturerModel || '',
                resolution: equipment.resolution || '',
                capacity: equipment.capacity || '',
                equipmentTypeId: equipment.equipmentTypeId,
                notes: equipment.notes || '',
            });
        } else {
            setFormData({
                name: '',
                code: '',
                manufacturerModel: '',
                resolution: '',
                capacity: '',
                equipmentTypeId: '',
                notes: '',
            });
        }
    }, [equipment, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await firebaseUser?.getIdToken();
            const url = equipment ? `/api/equipment/${equipment.id}` : '/api/equipment';
            const method = equipment ? 'PATCH' : 'POST';

            const payload = {
                ...formData,
                sectorId, // Always link to current sector
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
                toast.success(`Equipamento ${equipment ? 'atualizado' : 'criado'} com sucesso`);
                onSuccess();
                onClose();
            } else {
                const error = await res.json();
                toast.error(`Erro ao salvar: ${error.message}`);
            }
        } catch (error) {
            console.error('Error saving equipment:', error);
            toast.error('Erro ao salvar equipamento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{equipment ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
                    <DialogDescription>
                        {equipment ? 'Edite os detalhes do equipamento.' : 'Cadastre um novo equipamento neste setor.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="code">Código/Patrimônio</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">Tipo de Equipamento</Label>
                            <Select
                                value={formData.equipmentTypeId}
                                onValueChange={(val) => setFormData({ ...formData, equipmentTypeId: val })}
                                disabled={!!equipment && !!equipment.lastCalibrationDate}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
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

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="model">Fabricante/Modelo</Label>
                                <Input
                                    id="model"
                                    value={formData.manufacturerModel}
                                    onChange={(e) => setFormData({ ...formData, manufacturerModel: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="resolution">Resolução</Label>
                                <Input
                                    id="resolution"
                                    value={formData.resolution}
                                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="capacity">Capacidade</Label>
                                <Input
                                    id="capacity"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
