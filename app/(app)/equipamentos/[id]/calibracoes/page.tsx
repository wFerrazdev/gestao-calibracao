'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect, useCallback } from 'react';
import { SmartUpload } from '@/components/smart-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Download, Upload, FileText, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ConfirmModal } from '@/components/confirm-modal';

interface Calibration {
    id: string;
    calibrationDate: string;
    certificateNumber: string | null;
    performedBy: string | null;
    notes: string | null;
    attachmentUrl: string | null;
    attachmentKey: string | null;
    createdAt: string;
    error?: number | null;
    uncertainty?: number | null;
    status: 'APPROVED' | 'REJECTED';
}

interface EquipmentInfo {
    id: string;
    name: string;
    code: string;
}

export default function CalibracoesPage() {
    const { firebaseUser } = useAuth();
    const { user, permissions, isCriador } = useUser();
    const params = useParams();
    const equipmentId = params.id as string;

    const [calibrations, setCalibrations] = useState<Calibration[]>([]);
    const [equipmentInfo, setEquipmentInfo] = useState<EquipmentInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [form, setForm] = useState({
        calibratedAt: new Date().toISOString().split('T')[0],
        certificateNumber: '',
        performedBy: '',
        notes: '',
        error: '',
        uncertainty: '',
    });
    const [file, setFile] = useState<File | null>(null);

    const fetchCalibrations = useCallback(async () => {
        if (!firebaseUser || !equipmentId) return;
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/equipment/${equipmentId}/calibrations`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setCalibrations(data.calibrations || data);
                // Buscar info do equipamento
                const eqRes = await fetch(`/api/equipment/${equipmentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (eqRes.ok) {
                    const eq = await eqRes.json();
                    setEquipmentInfo({ id: eq.id, name: eq.name, code: eq.code });
                }
            }
        } catch (e) {
            console.error('Erro ao buscar calibrações:', e);
        } finally {
            setLoading(false);
        }
    }, [firebaseUser, equipmentId]);

    useEffect(() => {
        fetchCalibrations();
    }, [fetchCalibrations]);

    const handleUploadAndSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser) return;

        setSubmitting(true);
        try {
            const token = await firebaseUser.getIdToken();
            let attachmentUrl = '';
            let attachmentKey = '';

            // Se tem arquivo, fazer upload via R2
            if (file) {
                setUploading(true);
                const presignRes = await fetch('/api/upload/presigned', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type || 'application/pdf',
                        fileSize: file.size,
                        folder: 'calibration-certificates'
                    }),
                });

                if (!presignRes.ok) {
                    toast.error('Erro ao gerar URL de upload');
                    setUploading(false);
                    return;
                }

                const { uploadUrl, key, publicUrl } = await presignRes.json();

                const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type || 'application/pdf' },
                });

                if (!uploadRes.ok) {
                    toast.error('Erro ao fazer upload do arquivo');
                    setUploading(false);
                    return;
                }

                attachmentKey = key;
                attachmentUrl = publicUrl;
                setUploading(false);
            }

            // Criar registro de calibração
            const body: any = {
                calibrationDate: form.calibratedAt,
                certificateNumber: form.certificateNumber || undefined,
                performedBy: form.performedBy || undefined,
                notes: form.notes || undefined,
                error: form.error ? parseFloat(form.error) : undefined,
                uncertainty: form.uncertainty ? parseFloat(form.uncertainty) : undefined,
            };

            if (attachmentKey) {
                body.attachmentKey = attachmentKey;
                body.attachmentUrl = attachmentUrl;
                body.attachmentName = file?.name;
                body.attachmentMime = file?.type;
                body.attachmentSize = file?.size;
            }

            const res = await fetch(`/api/equipment/${equipmentId}/calibrations`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success('Calibração registrada com sucesso!');
                setShowForm(false);
                setForm({
                    calibratedAt: new Date().toISOString().split('T')[0],
                    certificateNumber: '',
                    performedBy: '',
                    notes: '',
                    error: '',
                    uncertainty: '',
                });
                setFile(null);
                fetchCalibrations();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao registrar calibração');
            }
        } catch {
            toast.error('Erro ao registrar calibração');
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!firebaseUser || !deleteId) return;
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/calibrations/${deleteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Calibração excluída com sucesso');
                setDeleteId(null);
                fetchCalibrations();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao excluir calibração');
            }
        } catch {
            toast.error('Erro ao excluir calibração');
        }
    };

    const handleDownload = async (key: string, certNumber: string | null) => {
        if (!firebaseUser) return;
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/upload/presigned-download?key=${encodeURIComponent(key)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const { url } = await res.json();
                window.open(url, '_blank');
            } else {
                toast.error('Erro ao gerar link de download');
            }
        } catch {
            toast.error('Erro ao baixar arquivo');
        }
    };

    const handleAIAnalysis = (data: any) => {
        toast.info("Dados extraídos pela IA aplicados!", { icon: "🤖" });
        setForm(prev => ({
            ...prev,
            calibratedAt: data.calibrationDate || prev.calibratedAt,
            certificateNumber: data.certificateNumber || prev.certificateNumber,
            notes: prev.notes ? `${prev.notes}\n\n[IA] Status identificado: ${data.status}` : `[IA] Status identificado: ${data.status}`,
        }));
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/equipamentos/${equipmentId}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Voltar
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Histórico de Calibrações</h1>
                    <p className="text-sm text-muted-foreground">
                        {equipmentInfo?.name} ({equipmentInfo?.code})
                    </p>
                </div>
                {permissions?.canEditEquipment && (
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Calibração
                    </Button>
                )}
            </div>

            {/* Formulário para nova calibração */}
            {showForm && (
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="text-sm font-semibold mb-4">Registrar Calibração</h3>

                    <div className="mb-6">
                        <SmartUpload
                            onAnalysisComplete={handleAIAnalysis}
                            onFileSelected={(f) => setFile(f)}
                        />
                    </div>

                    <form onSubmit={handleUploadAndSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data da Calibração *</label>
                                <Input
                                    type="date"
                                    value={form.calibratedAt}
                                    onChange={e => setForm(f => ({ ...f, calibratedAt: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nº Certificado</label>
                                <Input
                                    value={form.certificateNumber}
                                    onChange={e => setForm(f => ({ ...f, certificateNumber: e.target.value }))}
                                    placeholder="CERT-2024-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Realizada por</label>
                                <Input
                                    value={form.performedBy}
                                    onChange={e => setForm(f => ({ ...f, performedBy: e.target.value }))}
                                    placeholder="Laboratório XYZ"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Erro Encontrado</label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    value={form.error}
                                    onChange={e => setForm(f => ({ ...f, error: e.target.value }))}
                                    placeholder="Ex: 0.02"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Incerteza</label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    value={form.uncertainty}
                                    onChange={e => setForm(f => ({ ...f, uncertainty: e.target.value }))}
                                    placeholder="Ex: 0.01"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Observações</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                                placeholder="Anotações sobre a calibração..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Anexar Certificado (PDF)</label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="file"
                                    accept=".pdf,.PDF"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                    className="flex-1"
                                />
                                {file && (
                                    <span className="text-xs text-muted-foreground">
                                        {file.name} ({(file.size / 1024).toFixed(0)} KB)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {uploading
                                    ? 'Fazendo upload...'
                                    : submitting
                                        ? 'Salvando...'
                                        : 'Registrar Calibração'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal de Confirmação */}
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Excluir Calibração"
                description="Tem certeza que deseja excluir este registro de calibração? Esta ação não pode ser desfeita e pode afetar a data de última calibração do equipamento."
                variant="destructive"
                confirmText="Excluir"
            />

            {/* Lista de calibrações */}
            <div className="space-y-3">
                {calibrations.length === 0 ? (
                    <div className="rounded-lg border bg-card p-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Nenhuma calibração registrada</p>
                    </div>
                ) : (
                    calibrations.map((cal) => (
                        <div key={cal.id} className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {new Date(cal.calibrationDate).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                                            {cal.certificateNumber && (
                                                <span>Cert: {cal.certificateNumber}</span>
                                            )}
                                            {cal.performedBy && (
                                                <span>Por: {cal.performedBy}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-4 mt-2 text-sm">
                                            {cal.error !== null && cal.error !== undefined && (
                                                <span className="text-muted-foreground">Erro: <span className="font-medium text-foreground">{cal.error}</span></span>
                                            )}
                                            {cal.uncertainty !== null && cal.uncertainty !== undefined && (
                                                <span className="text-muted-foreground">Incerteza: <span className="font-medium text-foreground">{cal.uncertainty}</span></span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 mt-2 sm:mt-0">
                                    <div className="flex items-center gap-2">
                                        {cal.status === 'APPROVED' ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                <XCircle className="h-3 w-3 mr-1" /> Reprovado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {cal.attachmentKey && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownload(cal.attachmentKey!, cal.certificateNumber)}
                                            >
                                                <Download className="h-4 w-4 mr-1" />
                                                PDF
                                            </Button>
                                        )}
                                        {(isCriador || user?.role === 'ADMIN') && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeleteId(cal.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {cal.notes && (
                                <p className="text-sm text-muted-foreground mt-2 pl-14">
                                    {cal.notes}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
