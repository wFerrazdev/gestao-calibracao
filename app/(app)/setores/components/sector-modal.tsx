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
import { toast } from 'sonner';

interface Sector {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
}

interface SectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    sector: Sector | null;
    onSuccess: () => void;
}

export function SectorModal({ isOpen, onClose, sector, onSuccess }: SectorModalProps) {
    const { firebaseUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
    });

    useEffect(() => {
        if (sector) {
            setFormData({
                name: sector.name,
                code: sector.code || '',
                description: sector.description || '',
            });
        } else {
            setFormData({ name: '', code: '', description: '' });
        }
    }, [sector, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await firebaseUser?.getIdToken();
            const url = sector ? `/api/sectors/${sector.id}` : '/api/sectors';
            const method = sector ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(`Setor ${sector ? 'atualizado' : 'criado'} com sucesso`);
                onSuccess();
                onClose();
            } else {
                const error = await res.json();
                toast.error(`Erro ao salvar: ${error.message}`);
            }
        } catch (error) {
            console.error('Error saving sector:', error);
            toast.error('Erro ao salvar setor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{sector ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
                    <DialogDescription>
                        {sector ? 'Edite os detalhes do setor abaixo.' : 'Preencha os dados para criar um novo setor.'}
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
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">
                                Código
                            </Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Descrição
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="col-span-3"
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
