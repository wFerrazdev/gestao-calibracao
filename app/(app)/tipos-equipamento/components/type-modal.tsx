'use client';

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
import { toast } from 'sonner';

interface EquipmentType {
    id: string;
    name: string;
}

interface TypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: EquipmentType | null;
    onSuccess: () => void;
}

export function TypeModal({ isOpen, onClose, type, onSuccess }: TypeModalProps) {
    const { firebaseUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        if (type) {
            setName(type.name);
        } else {
            setName('');
        }
    }, [type, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await firebaseUser?.getIdToken();
            const url = type ? `/api/equipment-types/${type.id}` : '/api/equipment-types';
            const method = type ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                toast.success(`Tipo ${type ? 'atualizado' : 'criado'} com sucesso`);
                onSuccess();
                onClose();
            } else {
                const error = await res.json();
                toast.error(error.error || error.message || 'Erro ao salvar tipo');
            }
        } catch (error) {
            console.error('Error saving type:', error);
            toast.error('Erro ao salvar tipo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{type ? 'Editar Tipo' : 'Novo Tipo'}</DialogTitle>
                    <DialogDescription>
                        {type ? 'Edite o nome do tipo de equipamento.' : 'Cadastre um novo tipo de equipamento.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nome
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
