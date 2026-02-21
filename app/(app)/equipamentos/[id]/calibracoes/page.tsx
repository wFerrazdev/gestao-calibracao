'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect, useCallback } from 'react';
import { SmartUpload } from '@/components/smart-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
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
    status: 'APPROVED' | 'REJECTED' | null;
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
    const equipmentId = typeof params?.id === 'string' ? params.id : '';

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

    const fetchCalibrations = useCallback(async (pageNum = 1, append = false) => {
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

                if (append) {
                    setCalibrations(prev => [...prev, ...(data.calibrations || [])]);
                } else {
                    setCalibrations(data.calibrations || []);
                }

                setHasMore(data.hasMore);
                setPage(data.page);

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
            toast.error('Não foi possível carregar o histórico');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [firebaseUser, equipmentId]);

    useEffect(() => {
        fetchCalibrations(1, false);
    }, [fetchCalibrations]);

    const handleLoadMore = () => {
        if (!hasMore || loadingMore) return;
        fetchCalibrations(page + 1, true);
    };

    const handleUploadAndSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser) return;

        setSubmitting(true);
        try {
            const token = await firebaseUser.getIdToken();
            let attachmentUrl = '';
            let attachmentKey = '';

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

            const body = {
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
            };

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
                // Resetar listagem para a página 1
                fetchCalibrations(1, false);
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
                fetchCalibrations(1, false);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao excluir calibração');
            }
        } catch {
            toast.error('Erro ao excluir calibração');
        }
    };

    const handleAIAnalysis = (data: any) => {
        toast.info("Dados extraídos pela IA aplicados!", { icon: "🤖" });
        setForm(prev => ({
            ...prev,
            calibratedAt: data.calibrationDate || prev.calibratedAt,
            certificateNumber: data.certificateNumber || prev.certificateNumber,
            notes: prev.notes ? `${prev.notes}\n\n[IA] Extraído automaticamente.` : `[IA] Extraído automaticamente.`,
        }));
    };

    if (loading && page === 1) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="space-y-4 border-l-2 border-gray-100 dark:border-gray-800 ml-4 pl-8">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-40 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!equipmentId) return null;

    return (
        <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-6">
            {/* Header Estilo Stitch */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
                <div className="flex items-start gap-4">
                    <Link href={`/equipamentos/${equipmentId}`} className="mt-1 flex items-center justify-center h-9 w-9 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            Histórico de Calibrações
                        </h1>
                        <div className="flex items-center gap-2 mt-2 text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">
                            <span className="text-primary dark:text-blue-400 font-bold uppercase tracking-tight">
                                {equipmentInfo?.name}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 text-xs">
                                {equipmentInfo?.code}
                            </span>
                        </div>
                    </div>
                </div>

                {permissions?.canEditEquipment && (
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        className="shadow-md transition-all gap-2 h-11 px-6 rounded-xl"
                    >
                        <Plus className="h-5 w-5" />
                        Nova Calibração
                    </Button>
                )}
            </div>

            {/* Formulário - Design Integrado */}
            {showForm && (
                <div className="mb-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-1 bg-primary/5 dark:bg-primary/10 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Plus className="h-4 w-4 text-primary" />
                            Registrar Calibração
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-8 w-8 p-0 rounded-full">
                            ✕
                        </Button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* IA Section */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                Extração Inteligente (Opcional)
                            </p>
                            <SmartUpload
                                onAnalysisComplete={handleAIAnalysis}
                                onFileSelected={(f) => setFile(f)}
                            />
                        </div>

                        <form onSubmit={handleUploadAndSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Data *</label>
                                    <Input
                                        type="date"
                                        value={form.calibratedAt}
                                        onChange={e => setForm(f => ({ ...f, calibratedAt: e.target.value }))}
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nº Certificado</label>
                                    <Input
                                        value={form.certificateNumber}
                                        onChange={e => setForm(f => ({ ...f, certificateNumber: e.target.value }))}
                                        placeholder="Ex: CERT-2025"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Executante</label>
                                    <Input
                                        value={form.performedBy}
                                        onChange={e => setForm(f => ({ ...f, performedBy: e.target.value }))}
                                        placeholder="Laboratório"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Erro Encontrado</label>
                                    <Input
                                        type="text"
                                        value={form.error}
                                        onChange={e => setForm(f => ({ ...f, error: e.target.value }))}
                                        placeholder="Ex: 0,02"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Incerteza</label>
                                    <Input
                                        type="text"
                                        value={form.uncertainty}
                                        onChange={e => setForm(f => ({ ...f, uncertainty: e.target.value }))}
                                        placeholder="Ex: 0,01"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Observações</label>
                                <textarea
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[100px] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Detalhes adicionais..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Documento PDF</label>
                                <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary/50 transition-colors flex items-center gap-4">
                                    <Input
                                        type="file"
                                        accept=".pdf,.PDF"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                        className="h-auto border-none bg-transparent p-0 flex-1 file:bg-primary/10 file:text-primary file:border-none file:rounded-lg file:px-4 file:py-2 file:mr-4 file:text-xs file:font-bold file:cursor-pointer hover:file:bg-primary/20"
                                    />
                                    {file && <span className="text-xs font-medium text-primary">✓ Selecionado</span>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="h-11 px-6 rounded-xl">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting} className="h-11 px-8 rounded-xl min-w-[160px]">
                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Enviando...
                                        </>
                                    ) : submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Salvando...
                                        </>
                                    ) : 'Salvar Registro'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="pl-6 md:pl-10">
                <CalibrationTimeline
                    calibrations={calibrations}
                    onDelete={(id) => setDeleteId(id)}
                    isCreator={isCriador || user?.role === 'ADMIN'}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    loadingMore={loadingMore}
                />
            </div>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Excluir Registro"
                description="Deseja realmente remover esta calibração do histórico? Os dados do equipamento serão recalculados."
                variant="destructive"
                confirmText="Excluir Agora"
            />
        </div>
    );
}
