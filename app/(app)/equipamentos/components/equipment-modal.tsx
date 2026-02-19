'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface EquipmentModalProps {
    sectors: Array<{ id: string; name: string }>;
    types: Array<{ id: string; name: string }>;
    onClose: () => void;
    onSuccess: () => void;
    mode?: 'create' | 'edit' | 'duplicate';
    equipmentToEdit?: any;
    context?: 'equipment' | 'stock'; // New prop
}

export function EquipmentModal({ sectors, types, onClose, onSuccess, mode = 'create', equipmentToEdit, context = 'equipment' }: EquipmentModalProps) {
    const { firebaseUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<{
        name: string;
        code: string;
        equipmentTypeId: string;
        sectorId: string;
        manufacturerModel: string;
        resolution: string;
        capacity: string;
        responsible: string;
        workingRange: string;
        admissibleUncertainty: string;
        maxError: string;
        provider: string;
        unit: string;
        location: string;
        photo?: File;
        preview?: string;
        imageUrl?: string;
    }>({
        name: '',
        code: '',
        equipmentTypeId: '',
        sectorId: '',
        manufacturerModel: '',
        resolution: '',
        capacity: '',
        responsible: '',
        workingRange: '',
        admissibleUncertainty: '',
        maxError: '',
        provider: '',
        unit: '',
        location: '',
    });

    useEffect(() => {
        if (equipmentToEdit && (mode === 'edit' || mode === 'duplicate')) {
            setForm({
                name: mode === 'duplicate' ? `${equipmentToEdit.name} (Cópia)` : equipmentToEdit.name,
                code: mode === 'duplicate' ? `${equipmentToEdit.code}-COPY` : equipmentToEdit.code,
                equipmentTypeId: equipmentToEdit.equipmentTypeId || equipmentToEdit.EquipmentType?.id || '',
                sectorId: equipmentToEdit.sectorId || equipmentToEdit.Sector?.id || '',
                manufacturerModel: equipmentToEdit.manufacturerModel || '',
                resolution: equipmentToEdit.resolution || '',
                capacity: equipmentToEdit.capacity || '',
                responsible: equipmentToEdit.responsible || '',
                workingRange: equipmentToEdit.workingRange || '',
                admissibleUncertainty: equipmentToEdit.admissibleUncertainty || '',
                maxError: equipmentToEdit.maxError || '',
                provider: equipmentToEdit.provider || '',
                unit: equipmentToEdit.unit || '',
                location: equipmentToEdit.location || '',
                imageUrl: equipmentToEdit.imageUrl || '',
                preview: equipmentToEdit.imageUrl || undefined // If URL logic is complex this might need adjustment
            });
        }
    }, [equipmentToEdit, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser) return;

        // Validations based on context
        if (!form.name || !form.code || !form.equipmentTypeId) {
            toast.error('Preencha todos os campos obrigatórios (Nome, Código, Tipo)');
            return;
        }

        if (context === 'equipment' && !form.sectorId) {
            toast.error('O campo Setor é obrigatório');
            return;
        }

        setLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            let imageUrl = form.imageUrl;

            // Handle Photo Upload if exists
            if (form.photo) {
                const presignRes = await fetch('/api/upload/presigned', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fileName: form.photo.name,
                        fileType: form.photo.type,
                        fileSize: form.photo.size,
                        folder: 'equipment-photos',
                    }),
                });

                if (!presignRes.ok) {
                    toast.error('Erro ao preparar upload da foto');
                    setLoading(false);
                    return;
                }

                const { uploadUrl, publicUrl } = await presignRes.json();

                const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: form.photo,
                    headers: { 'Content-Type': form.photo.type },
                });

                if (!uploadRes.ok) {
                    toast.error('Erro ao enviar foto');
                    setLoading(false);
                    return;
                }

                imageUrl = publicUrl;
            }

            const url = mode === 'edit' ? `/api/equipment/${equipmentToEdit.id}` : '/api/equipment';
            const method = mode === 'edit' ? 'PUT' : 'POST'; // or PATCH

            const res = await fetch(url, {
                method: method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...form,
                    // Define usageStatus baseado no contexto da criação
                    usageStatus: mode === 'create' || mode === 'duplicate'
                        ? (context === 'stock' ? 'IN_STOCK' : 'IN_USE')
                        : undefined, // No Edit, geralmente preservamos o atual a menos que mudemos de página

                    imageUrl: imageUrl || undefined,
                    photo: undefined, // Don't send file object to API
                    preview: undefined, // Don't send preview URL
                    // Remove id if present in spread
                    id: undefined
                }),
            });

            if (res.ok) {
                toast.success(mode === 'edit' ? 'Equipamento atualizado!' : 'Equipamento criado com sucesso!');
                onSuccess();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao salvar equipamento');
            }
        } catch {
            toast.error('Erro ao salvar equipamento');
        } finally {
            setLoading(false);
        }
    };

    const title = mode === 'edit' ? 'Editar Equipamento' : mode === 'duplicate' ? 'Duplicar Equipamento' : 'Novo Equipamento';
    const buttonText = mode === 'edit' ? 'Salvar Alterações' : mode === 'duplicate' ? 'Criar Cópia' : 'Criar Equipamento';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex justify-center mb-6">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
                            <div className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden ${form.preview ? 'border-primary' : 'border-muted-foreground/25'
                                }`}>
                                {form.preview ? (
                                    <img src={form.preview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <span className="text-xs">Adicionar Foto</span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-medium">Alterar</span>
                            </div>
                        </div>
                        <Input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setForm(f => ({ ...f, photo: file, preview: URL.createObjectURL(file) }));
                                }
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome *</label>
                            <Input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Paquímetro Digital"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Código *</label>
                            <Input
                                value={form.code}
                                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                                placeholder="PAQ-001"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo *</label>
                            <select
                                value={form.equipmentTypeId}
                                onChange={e => setForm(f => ({ ...f, equipmentTypeId: e.target.value }))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                            >
                                <option value="">Selecione...</option>
                                {types.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {context === 'equipment' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Setor *</label>
                                <select
                                    value={form.sectorId}
                                    onChange={e => setForm(f => ({ ...f, sectorId: e.target.value }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {sectors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {context === 'stock' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Localização / Endereço</label>
                                <Input
                                    value={form.location}
                                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                                    placeholder="Armário A, Prateleira 2"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Modelo / Fabricante</label>
                        <Input
                            value={form.manufacturerModel}
                            onChange={e => setForm(f => ({ ...f, manufacturerModel: e.target.value }))}
                            placeholder="Mitutoyo 500-196-30"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Resolução</label>
                            <Input
                                value={form.resolution}
                                onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))}
                                placeholder="0.01mm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Capacidade</label>
                            <Input
                                value={form.capacity}
                                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                                placeholder="0-150mm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Responsável</label>
                        <Input
                            value={form.responsible}
                            onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                            placeholder="Nome do responsável"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Faixa de Trabalho</label>
                            <Input
                                value={form.workingRange}
                                onChange={e => setForm(f => ({ ...f, workingRange: e.target.value }))}
                                placeholder="0-100mm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Unidade</label>
                            <Input
                                value={form.unit}
                                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                placeholder="mm, kg, °C"
                            />
                        </div>
                    </div>

                    {/* Incerteza Admissível, Erro Máximo, Fornecedor, Localização REMOVED/MOVED */}

                    {/* Only show Location here if context is EQUIPMENT (which requested removal) or STOCK (moved up) */}
                    {/* User requested: Equipment Page -> Remove Location. Stock Page -> Maintain Location. */}
                    {/* We moved Location up for Stock context. So here we just remove the old location input block. */}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : buttonText}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
