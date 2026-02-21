'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Calendar, FileText, ExternalLink, Upload, User, Image as ImageIcon, Printer, Pencil, Copy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { generateLabelPDF } from '@/lib/label-pdf';

interface EquipmentDetailsModalProps {
    equipment: any;
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (equipment: any) => void;
    onEdit?: (equipment: any) => void;
    onDuplicate?: (equipment: any) => void;
}

export function EquipmentDetailsModal({ equipment, isOpen, onClose, onSchedule, onEdit, onDuplicate }: EquipmentDetailsModalProps) {
    const router = useRouter();
    const { permissions, isCriador } = useUser();
    const { firebaseUser } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(equipment?.imageUrl);
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);

    useEffect(() => {
        setImageUrl(equipment?.imageUrl);
    }, [equipment]);

    useEffect(() => {
        const loadEquipmentImage = async () => {
            if (!imageUrl) {
                setDisplayUrl(null);
                return;
            }

            // Se for URL completa (http/https) ou blob (preview local), usa direto
            if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:')) {
                setDisplayUrl(imageUrl);
                return;
            }

            // Se for chave do R2, busca URL assinada
            try {
                const token = await firebaseUser?.getIdToken();
                const res = await fetch(`/api/upload/presigned-download?key=${encodeURIComponent(imageUrl)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setDisplayUrl(data.url);
                }
            } catch (error) {
                console.error('Erro ao carregar imagem:', error);
            }
        };

        loadEquipmentImage();
    }, [imageUrl, firebaseUser]);

    const canEdit = permissions?.canManageRules || isCriador;

    const handleViewDetails = () => {
        router.push(`/equipamentos/${equipment.id}`);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // Preview imediato
        const localPreview = URL.createObjectURL(file);
        setImageUrl(localPreview);

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Imagem muito grande (máx 5MB)');
            return;
        }

        setUploading(true);
        try {
            // 1. Obter URL pré-assinada
            const token = await firebaseUser?.getIdToken();
            if (!token) {
                toast.error('Você precisa estar logado para fazer upload');
                return;
            }

            const presignRes = await fetch('/api/upload/presigned', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    folder: 'equipment-photos'
                }),
            });

            if (!presignRes.ok) throw new Error('Falha ao gerar URL de upload (Server Error)');
            const { uploadUrl, publicUrl, key } = await presignRes.json();

            // 2. Upload para R2
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            if (!uploadRes.ok) throw new Error('Falha no upload da imagem');

            // 3. Atualizar URL no banco
            // Se publicUrl for apenas a key (sem dominio configurado), salvamos a key
            // O useEffect vai tratar de carregar a URL assinada
            await fetch(`/api/equipment/${equipment.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ imageUrl: publicUrl }),
            });

            // Se publicUrl não for http, mantemos o preview local até o próximo reload ou atualizamos imageUrl
            // Se atualizarmos imageUrl com a key, o useEffect vai rodar e buscar a URL assinada
            setImageUrl(publicUrl);
            toast.success('Foto atualizada com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar foto');
            setImageUrl(equipment?.imageUrl); // Reverte em caso de erro
        } finally {
            setUploading(false);
        }
    };

    const handlePrintLabel = async () => {
        const origin = window.location.origin;
        toast.promise(generateLabelPDF([equipment], origin), {
            loading: 'Gerando PDF da etiqueta...',
            success: 'Etiqueta gerada com sucesso!',
            error: 'Erro ao gerar etiqueta'
        });
    };

    if (!equipment) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1100px] p-0 overflow-hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>{equipment.name}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Coluna da Imagem (Esquerda ou Topo) */}
                    <div className="relative w-full md:w-[320px] h-[320px] md:h-auto bg-muted border-r-0 md:border-r border-border min-h-[400px]">
                        {displayUrl ? (
                            <img src={displayUrl} alt={equipment.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <ImageIcon className="h-12 w-12 mb-2" />
                                <span>Sem foto</span>
                            </div>
                        )}

                        {canEdit && (
                            <div className="absolute bottom-4 right-4">
                                <input
                                    type="file"
                                    id="image-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => document.getElementById('image-upload')?.click()} disabled={uploading}>
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Coluna de Detalhes (Direita ou Baixo) */}
                    <div className="flex-1 flex flex-col p-8">
                        <div className="flex justify-between items-start mb-8 pr-8">
                            <div>
                                <h2 className="text-2xl font-bold leading-tight">{equipment.name}</h2>
                                <p className="text-base font-mono text-muted-foreground mt-1">{equipment.code}</p>
                            </div>
                            <Badge
                                variant={
                                    equipment.status === 'CALIBRADO' ? 'success' :
                                        equipment.status === 'IRA_VENCER' ? 'warning' :
                                            equipment.status === 'VENCIDO' ? 'destructive' : 'secondary'
                                }
                                className="shrink-0 text-sm px-3 py-1"
                            >
                                {equipment.status === 'CALIBRADO' ? 'Calibrado' :
                                    equipment.status === 'IRA_VENCER' ? 'Irá Vencer' :
                                        equipment.status === 'VENCIDO' ? 'Vencido' : equipment.status}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 flex-grow">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Setor</span>
                                <div className="text-sm font-medium">{equipment.Sector?.name}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Tipo</span>
                                <div className="text-sm font-medium">{equipment.EquipmentType?.name}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Responsável</span>
                                <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm">{equipment.responsible || '-'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Próxima Calibração</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        {equipment.dueDate ? new Date(equipment.dueDate).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Informações Técnicas Adicionais */}
                        <div className="mt-6 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Faixa de Trabalho</span>
                                <div className="text-sm">{equipment.workingRange || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Incerteza Admissível</span>
                                <div className="text-sm">{equipment.admissibleUncertainty || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Erro Máximo</span>
                                <div className="text-sm">{equipment.maxError || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Unidade</span>
                                <div className="text-sm">{equipment.unit || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Fornecedor</span>
                                <div className="text-sm">{equipment.provider || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Localização</span>
                                <div className="text-sm">{equipment.location || '-'}</div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-4 border-t">
                            {canEdit && (
                                <>
                                    <Button variant="outline" className="flex-1" onClick={handlePrintLabel}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        Etiqueta
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={() => { if (onEdit) onEdit(equipment); }}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={() => { if (onDuplicate) onDuplicate(equipment); }}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Duplicar
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" className="flex-1" onClick={handleViewDetails}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver Detalhes
                            </Button>
                            {canEdit && (
                                <Button className="flex-1" onClick={() => { onClose(); onSchedule(equipment); }}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Agendar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
