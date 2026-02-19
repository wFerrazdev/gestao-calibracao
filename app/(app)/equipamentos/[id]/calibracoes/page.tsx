'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect, useCallback } from 'react';
import { SmartUpload } from '@/components/smart-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Plus, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ConfirmModal } from '@/components/confirm-modal';
import { CalibrationTimeline } from '@/components/calibrations/calibration-timeline';

interface Calibration {
    id: string;
    calibrationDate: string;
    certificateNumber: string | null;
    performedBy: string | null;
    notes: string | null;
    attachmentUrl: string | null;
    attachmentKey: string | null;
    createdAt: string;
    error: number | null;
    uncertainty: number | null;
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
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

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

    const fetchCalibrations = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        if (!firebaseUser || !equipmentId) return;

        if (append) setLoadingMore(true);
        else setLoading(true);

        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/equipment/${equipmentId}/calibrations?page=${pageNum}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                const fetchedCalibrations = data.calibrations || [];

                if (append) {
                    setCalibrations(prev => [...prev, ...fetchedCalibrations]);
                } else {
                    setCalibrations(fetchedCalibrations);
                }

                setHasMore(data.hasMore);
                setPage(pageNum);

                // Buscar info do equipamento apenas na primeira carga
                if (pageNum === 1) {
                    const eqRes = await fetch(`/api/equipment/${equipmentId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (eqRes.ok) {
                        const eq = await eqRes.json();
                        setEquipmentInfo({ id: eq.id, name: eq.name, code: eq.code });
                    }
                }
            }
        } catch (e) {
            console.error('Erro ao buscar calibrações:', e);
            toast.error('Erro ao carregar histórico');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [firebaseUser, equipmentId]);

    useEffect(() => {
        fetchCalibrations(1);
    }, [fetchCalibrations]);

    const handleUploadAndSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser) return;

        setSubmitting(true);
        try {
            const token = await firebaseUser.getIdToken();
            let attachmentUrl = '';
            let attachmentKey = '';

            // Upload de arquivo
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

            const res = await fetch(`/api/equipment/${equipmentId}/calibrations`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    calibrationDate: form.calibratedAt,
                    certificateNumber: form.certificateNumber || undefined,
                    performedBy: form.performedBy || undefined,
                    notes: form.notes || undefined,
                    error: form.error || undefined,
                    uncertainty: form.uncertainty || undefined,
                    attachmentKey: attachmentKey || undefined,
                    attachmentUrl: attachmentUrl || undefined,
                    attachmentName: file?.name,
                    attachmentMime: file?.type,
                    attachmentSize: file?.size,
                }),
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
                fetchCalibrations(1);
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
                toast.success('Calibração excluída!');
                setDeleteId(null);
                fetchCalibrations(1);
            } else {
                toast.error('Erro ao excluir calibração');
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
            notes: prev.notes ? `${prev.notes}\n\n[IA] Status: ${data.status}` : `[IA] Status: ${data.status}`,
        }));
    };

    if (loading && page === 1) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-24" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="space-y-8 pl-8">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Estilo Stitch */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-4">
                    <Link href={`/equipamentos/${equipmentId}`}>
                        <Button variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Histórico de Calibrações
                        </h1>
                        <p className="text-base text-muted-foreground font-medium uppercase tracking-wide">
                            {equipmentInfo?.name} <span className="mx-2 text-border">•</span> ({equipmentInfo?.code})
                        </p>
                    </div>
                </div>

                {permissions?.canEditEquipment && (
                    <Button
                        size="lg"
                        className="rounded-full px-6 font-semibold shadow-md active:scale-95 transition-transform"
                        onClick={() => setShowForm(!showForm)}
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Nova Calibração
                    </Button>
                )}
            </div>

            {/* Formulário (Modal logic could be improved, keeping existing inline for now but styled) */}
            {showForm && (
                <div className="rounded-2xl border bg-card p-6 shadow-lg animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Registrar Calibração</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
                    </div>

                    <div className="mb-6">
                        <SmartUpload
                            onAnalysisComplete={handleAIAnalysis}
                            onFileSelected={(f) => setFile(f)}
                        />
                    </div>

                    <form onSubmit={handleUploadAndSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Data da Calibração *</label>
                                <Input
                                    type="date"
                                    value={form.calibratedAt}
                                    onChange={e => setForm(f => ({ ...f, calibratedAt: e.target.value }))}
                                    required
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Nº Certificado</label>
                                <Input
                                    value={form.certificateNumber}
                                    onChange={e => setForm(f => ({ ...f, certificateNumber: e.target.value }))}
                                    placeholder="CERT-XXXX-2024"
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Realizada por</label>
                                <Input
                                    value={form.performedBy}
                                    onChange={e => setForm(f => ({ ...f, performedBy: e.target.value }))}
                                    placeholder="Laboratório"
                                    className="rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Erro Encontrado</label>
                                <Input
                                    value={form.error}
                                    onChange={e => setForm(f => ({ ...f, error: e.target.value }))}
                                    placeholder="Ex: 0,02"
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Incerteza</label>
                                <Input
                                    value={form.uncertainty}
                                    onChange={e => setForm(f => ({ ...f, uncertainty: e.target.value }))}
                                    placeholder="Ex: 0,01"
                                    className="rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Observações</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Anotações adicionais..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Certificado (PDF)</label>
                            <Input
                                type="file"
                                accept=".pdf,.PDF"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="rounded-lg"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={submitting} className="rounded-full px-8">
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {uploading ? 'Fazendo upload...' : submitting ? 'Salvando...' : 'Salvar Calibração'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Timeline Wrapper */}
            <div className="py-4">
                {calibrations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-16 text-center bg-muted/10">
                        <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-muted-foreground">Nenhuma calibração</h4>
                        <p className="text-sm text-muted-foreground mt-1">Clique em "Nova Calibração" para registrar.</p>
                    </div>
                ) : (
                    <CalibrationTimeline
                        calibrations={calibrations}
                        hasMore={hasMore}
                        onLoadMore={() => fetchCalibrations(page + 1, true)}
                        isLoadingMore={loadingMore}
                        onDownload={handleDownload}
                        onDelete={setDeleteId}
                        canDelete={isCriador || user?.role === 'ADMIN'}
                    />
                )}
            </div>

            {/* Modal de Confirmação */}
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Excluir Registro"
                description="Tem certeza que deseja excluir esta calibração do histórico?"
                variant="destructive"
                confirmText="Excluir"
            />
        </div>
    );
}
