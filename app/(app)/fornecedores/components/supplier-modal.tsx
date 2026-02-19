'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Supplier {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
}

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    supplier?: Supplier | null;
}

export function SupplierModal({
    isOpen,
    onClose,
    onSuccess,
    supplier,
}: SupplierModalProps) {
    const { firebaseUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (supplier) {
            setName(supplier.name);
            setEmail(supplier.email || '');
            setPhone(supplier.phone || '');
            setAddress(supplier.address || '');
            setNotes(supplier.notes || '');
        } else {
            setName('');
            setEmail('');
            setPhone('');
            setAddress('');
            setNotes('');
        }
    }, [supplier, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }

        setLoading(true);
        try {
            const token = await firebaseUser?.getIdToken();
            const url = supplier
                ? `/api/suppliers/${supplier.id}`
                : '/api/suppliers';
            const method = supplier ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    address,
                    notes,
                }),
            });

            if (res.ok) {
                toast.success(
                    supplier
                        ? 'Fornecedor atualizado com sucesso'
                        : 'Fornecedor criado com sucesso'
                );
                onSuccess();
                onClose();
            } else {
                toast.error('Erro ao salvar fornecedor');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar fornecedor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome (Obrigatório)</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
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
