'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Save, X, FileText, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface EquipmentDetail {
    id: string;
    name: string;
    code: string;
    manufacturerModel: string | null;
    resolution: string | null;
    capacity: string | null;
    responsible: string | null;
    imageUrl: string | null;
    status: string;
    lastCalibrationDate: string | null;
    lastCertificateNumber: string | null;
    dueDate: string | null;
    daysLeft: number | null;
    createdAt: string;
    updatedAt: string;
    Sector: { id: string; name: string } | null;
    EquipmentType: { id: string; name: string } | null;
    CalibrationRecord: Array<{
        id: string;
        calibratedAt: string;
        certificateNumber: string | null;
    }>;
}

export default function EquipmentDetailPage() {
    const { firebaseUser } = useAuth();
    const { permissions } = useUser();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        code: '',
        manufacturerModel: '',
        resolution: '',
        capacity: '',
        responsible: '',
    });

    useEffect(() => {
        async function fetchEquipment() {
            if (!firebaseUser) return;
            try {
                const token = await firebaseUser.getIdToken();
                const res = await fetch(`/api/equipment/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setEquipment(data);
                    setForm({
                        name: data.name || '',
                        code: data.code || '',
                        manufacturerModel: data.manufacturerModel || '',
                        resolution: data.resolution || '',
                        capacity: data.capacity || '',
                        responsible: data.responsible || '',
                    });
                } else {
                    toast.error('Equipamento não encontrado');
                    router.push('/equipamentos');
                }
            } catch {
                toast.error('Erro ao carregar equipamento');
            } finally {
                setLoading(false);
            }
        }

        if (firebaseUser && id) fetchEquipment();
    }, [firebaseUser, id, router]);

    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        const loadEquipmentImage = async () => {
            if (!equipment?.imageUrl) return;

            // Se já for uma URL completa, usar ela
            if (equipment.imageUrl.startsWith('http')) {
                setPreview(equipment.imageUrl);
                return;
            }

            // Se for uma chave, gerar URL assinada
            try {
                const token = await firebaseUser?.getIdToken();
                const res = await fetch(`/api/upload/presigned-download?key=${encodeURIComponent(equipment.imageUrl)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPreview(data.url);
                }
            } catch (error) {
                console.error('Erro ao carregar imagem:', error);
            }
        };

        loadEquipmentImage();
    }, [equipment, firebaseUser]);

    const handleSave = async () => {
        if (!firebaseUser || !id) return;
        setSaving(true);
        try {
            const token = await firebaseUser.getIdToken();
            let imageUrl = equipment?.imageUrl;

            // Upload nova foto se houver
            if (photo) {
                const presignRes = await fetch('/api/upload/presigned', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fileName: photo.name,
                        fileType: photo.type,
                        fileSize: photo.size,
                        folder: 'equipment-photos',
                    }),
                });

                if (!presignRes.ok) throw new Error('Erro ao gerar URL de upload');
                const { uploadUrl, publicUrl } = await presignRes.json();

                const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: photo,
                    headers: { 'Content-Type': photo.type },
                });

                if (!uploadRes.ok) throw new Error('Erro ao fazer upload da imagem');
                imageUrl = publicUrl;
            }

            const res = await fetch(`/api/equipment/${id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...form, imageUrl }),
            });

            if (res.ok) {
                const updated = await res.json();
                setEquipment((prev) => (prev ? { ...prev, ...updated } : prev));
                setEditing(false);
                setPhoto(null);
                toast.success('Equipamento atualizado!');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao atualizar');
            }
        } catch {
            toast.error('Erro ao atualizar equipamento');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                    ))}
                </div>
            </div>
        );
    }

    if (!equipment) return null;

    const statusConfig: Record<string, { label: string; className: string }> = {
        CALIBRADO: { label: 'Calibrado', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
        IRA_VENCER: { label: 'Irá Vencer', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
        VENCIDO: { label: 'Vencido', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
        DESATIVADO: { label: 'Desativado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
        undefined: { label: 'Indefinido', className: '' }
    };

    const sc = statusConfig[equipment.status] || { label: equipment.status, className: '' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/equipamentos">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Voltar
                        </Button>
                    </Link>

                    {/* Foto */}
                    <div className="relative group">
                        <div className={`w-16 h-16 rounded-lg border flex items-center justify-center overflow-hidden bg-muted ${editing ? 'cursor-pointer' : ''}`}
                            onClick={() => editing && document.getElementById('edit-photo')?.click()}>
                            {preview ? (
                                <img src={preview} alt={equipment.name} className="w-full h-full object-cover" />
                            ) : (
                                <FileText className="h-8 w-8 text-muted-foreground/50" />
                            )}
                        </div>
                        {editing && (
                            <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="text-white text-[10px] font-medium">Alterar</span>
                            </div>
                        )}
                        {editing && (
                            <Input
                                id="edit-photo"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setPhoto(file);
                                        setPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        )}
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold">{equipment.name}</h1>
                        <p className="text-sm text-muted-foreground">{equipment.code}</p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${sc.className}`}>
                        {sc.label}
                    </span>
                </div>

                <div className="flex gap-2">
                    {permissions?.canEditEquipment && !editing && (
                        <Button variant="outline" onClick={() => setEditing(true)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    )}
                    {editing && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => {
                                setEditing(false);
                                setPhoto(null);
                                setPreview(equipment.imageUrl || null);
                            }}>
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                <Save className="h-4 w-4 mr-1" />
                                {saving ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailCard label="Nome" editing={editing}>
                    {editing ? (
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    ) : (
                        equipment.name
                    )}
                </DetailCard>
                <DetailCard label="Código" editing={editing}>
                    {editing ? (
                        <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                    ) : (
                        equipment.code
                    )}
                </DetailCard>
                <DetailCard label="Tipo">{equipment.EquipmentType?.name || '-'}</DetailCard>
                <DetailCard label="Setor">{equipment.Sector?.name || '-'}</DetailCard>
                <DetailCard label="Modelo / Fabricante" editing={editing}>
                    {editing ? (
                        <Input value={form.manufacturerModel} onChange={e => setForm(f => ({ ...f, manufacturerModel: e.target.value }))} />
                    ) : (
                        equipment.manufacturerModel || '-'
                    )}
                </DetailCard>
                <DetailCard label="Resolução" editing={editing}>
                    {editing ? (
                        <Input value={form.resolution} onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))} />
                    ) : (
                        equipment.resolution || '-'
                    )}
                </DetailCard>
                <DetailCard label="Capacidade" editing={editing}>
                    {editing ? (
                        <Input value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
                    ) : (
                        equipment.capacity || '-'
                    )}
                </DetailCard>
                <DetailCard label="Responsável" editing={editing}>
                    {editing ? (
                        <Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} />
                    ) : (
                        equipment.responsible || '-'
                    )}
                </DetailCard>
                <DetailCard label="Última Calibração">
                    {equipment.lastCalibrationDate
                        ? new Date(equipment.lastCalibrationDate).toLocaleDateString('pt-BR')
                        : 'Nunca calibrado'}
                </DetailCard>
                <DetailCard label="Certificado">{equipment.lastCertificateNumber || '-'}</DetailCard>
                <DetailCard label="Vencimento">
                    {equipment.dueDate
                        ? new Date(equipment.dueDate).toLocaleDateString('pt-BR')
                        : '-'}
                </DetailCard>
                <DetailCard label="Dias Restantes">
                    {equipment.daysLeft !== null && equipment.daysLeft !== undefined ? (
                        <span className={
                            equipment.daysLeft <= 0 ? 'text-red-600 font-bold' :
                                equipment.daysLeft <= 30 ? 'text-yellow-600 font-bold' :
                                    'text-green-600 font-bold'
                        }>
                            {equipment.daysLeft} dias
                        </span>
                    ) : '-'}
                </DetailCard>
            </div>

            {/* Link para calibrações */}
            <div className="flex gap-3">
                <Link href={`/equipamentos/${id}/calibracoes`}>
                    <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Histórico de Calibrações
                    </Button>
                </Link>
            </div>
        </div>
    );
}

function DetailCard({
    label,
    children,
    editing = false,
}: {
    label: string;
    children: React.ReactNode;
    editing?: boolean;
}) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <div className={editing ? '' : 'text-sm font-medium text-foreground'}>{children}</div>
        </div>
    );
}
