'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/confirm-modal';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    serviceToEdit?: any; // Se passado, é edição
    readOnly?: boolean;
}

export function ServiceModal({ isOpen, onClose, onSuccess, serviceToEdit, readOnly = false }: ServiceModalProps) {
    const { firebaseUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [equipments, setEquipments] = useState<any[]>([]);

    // Form state
    const [equipmentId, setEquipmentId] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    // const [scheduledTime, setScheduledTime] = useState('09:00'); // Removed time input, defaulting to 08:00
    const [technician, setTechnician] = useState(''); // This is "Fornecedor"
    const [status, setStatus] = useState('SCHEDULED');
    const [notes, setNotes] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen && firebaseUser) {
            fetchEquipments();
            if (serviceToEdit) {
                setEquipmentId(serviceToEdit.equipmentId);
                const date = new Date(serviceToEdit.scheduledDate);
                setScheduledDate(date.toISOString().split('T')[0]);
                // setScheduledTime(date.toTimeString().slice(0, 5));
                setTechnician(serviceToEdit.technician || '');
                setStatus(serviceToEdit.status);
                setNotes(serviceToEdit.notes || '');
                setDescription(serviceToEdit.description || '');
            } else {
                resetForm();
            }
        }
    }, [isOpen, serviceToEdit, firebaseUser]);

    const resetForm = () => {
        setEquipmentId('');
        setScheduledDate(new Date().toISOString().split('T')[0]);
        // setScheduledTime('09:00');
        setTechnician('');
        setStatus('SCHEDULED');
        setNotes('');
        setDescription('');
    };

    const fetchEquipments = async () => {
        if (!firebaseUser) return;
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch('/api/equipment?pageSize=1000', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // FIX: API returns 'items', not 'data'
                setEquipments(data.items || []);
            }
        } catch (error) {
            console.error('Erro ao buscar equipamentos', error);
            toast.error('Erro ao carregar lista de equipamentos');
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!serviceToEdit?.id) return;
        if (!firebaseUser) return;
        setLoading(true);

        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/services/${serviceToEdit.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Erro ao excluir serviço');

            toast.success('Agendamento excluído!');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Erro ao excluir agendamento');
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        if (!firebaseUser) return;
        setLoading(true);

        try {
            const token = await firebaseUser.getIdToken();
            // Defaulting time to 08:00 since we removed the input
            const dateTime = new Date(`${scheduledDate}T08:00:00`);

            const payload = {
                equipmentId,
                scheduledDate: dateTime.toISOString(),
                technician, // Fornecedor
                status,
                notes,
                description
            };

            const url = serviceToEdit?.id ? `/api/services/${serviceToEdit.id}` : '/api/services';
            const method = serviceToEdit?.id ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Erro ao salvar serviço');

            toast.success(serviceToEdit?.id ? 'Agendamento atualizado!' : 'Agendamento criado!');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Erro ao salvar agendamento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {readOnly ? 'Detalhes do Agendamento' : (serviceToEdit?.id ? 'Editar Agendamento' : 'Novo Agendamento')}
                        </DialogTitle>
                        {/* Added DialogDescription for accessibility */}
                        <p className="text-sm text-muted-foreground">
                            {readOnly ? 'Visualize os detalhes do agendamento abaixo.' : `Preencha os dados abaixo para ${serviceToEdit?.id ? 'editar' : 'criar'} um agendamento.`}
                        </p>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="equipment">Equipamento</Label>
                            <Select value={equipmentId} onValueChange={setEquipmentId} disabled={!!serviceToEdit?.id || readOnly}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um equipamento" />
                                </SelectTrigger>
                                <SelectContent>
                                    {equipments.map((eq) => (
                                        <SelectItem key={eq.id} value={eq.id}>
                                            {eq.name} - {eq.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Data</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    required
                                    disabled={readOnly}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="technician">Fornecedor</Label>
                            <Input
                                id="technician"
                                value={technician}
                                onChange={(e) => setTechnician(e.target.value)}
                                placeholder="Nome do fornecedor ou laboratório"
                                disabled={readOnly}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição do Serviço</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Calibração Anual"
                                disabled={readOnly}
                            />
                        </div>

                        {serviceToEdit?.id && (
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={setStatus} disabled={readOnly}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SCHEDULED">Agendado</SelectItem>
                                        <SelectItem value="WAITING_QUOTE">Aguardando Orçamento</SelectItem>
                                        <SelectItem value="WAITING_PAYMENT">Aguardando Pagamento</SelectItem>
                                        <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                                        <SelectItem value="COMPLETED">Finalizado</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                disabled={readOnly}
                            />
                        </div>

                        <DialogFooter className="flex justify-between sm:justify-between">
                            {serviceToEdit?.id && !readOnly && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDeleteClick}
                                    disabled={loading}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                </Button>
                            )}
                            <div className="flex gap-2 w-full justify-end">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    {readOnly ? 'Fechar' : 'Cancelar'}
                                </Button>
                                {!readOnly && (
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                )}
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Excluir Agendamento"
                description="Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="destructive"
                loading={loading}
            />
        </>
    );
}
