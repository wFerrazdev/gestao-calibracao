
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Layers, Type, Calendar, FileText, ExternalLink, ShieldCheck, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function PublicRedirectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const equipment = await prisma.equipment.findUnique({
        where: { id },
        include: {
            Sector: true,
            EquipmentType: true,
            CalibrationRecord: {
                orderBy: { calibrationDate: 'desc' },
                take: 1,
                where: { status: 'APPROVED' }
            }
        }
    });

    if (!equipment) notFound();

    const lastCert = equipment.CalibrationRecord[0];
    const isReference = equipment.status === 'REFERENCIA';

    // Determinar URL do certificado
    // Usamos o nosso endpoint público que faz o proxy do R2 de forma segura
    const certUrl = lastCert ? `/api/public/certificate/${lastCert.id}` : null;

    // Helper para renderizar o status com cores e textos corretos
    const renderStatusBadge = () => {
        if (isReference) {
            return (
                <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 border-none px-6 py-2 rounded-full font-bold shadow-sm">
                    ITEM DE REFERÊNCIA
                </Badge>
            );
        }

        switch (equipment.status) {
            case 'CALIBRADO':
                return (
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-none px-6 py-2 rounded-full font-bold shadow-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        EQUIPAMENTO CALIBRADO
                    </Badge>
                );
            case 'IRA_VENCER':
                return (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-500 border-none px-6 py-2 rounded-full font-bold shadow-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        IRÁ VENCER
                    </Badge>
                );
            case 'VENCIDO':
                return (
                    <Badge className="bg-red-500 text-white hover:bg-red-500 border-none px-6 py-2 rounded-full font-bold shadow-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        VENCIDO
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="px-6 py-2 rounded-full font-bold shadow-sm">
                        {equipment.status}
                    </Badge>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-start py-8 px-4 overflow-y-auto">
            <Card className="w-full max-w-lg shadow-2xl border-none overflow-hidden rounded-2xl bg-white dark:bg-slate-900/95 dark:backdrop-blur-md">
                <div className="bg-primary h-2 w-full" />

                <CardHeader className="text-center pb-2 pt-8">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                        {equipment.name}
                    </CardTitle>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded border border-slate-200 dark:border-slate-700">
                        {equipment.code}
                    </p>
                </CardHeader>

                <CardContent className="space-y-8 pt-6 px-8 pb-10">
                    {/* Status Centralizado */}
                    <div className="flex justify-center flex-col items-center gap-6">
                        {renderStatusBadge()}

                        {certUrl ? (
                            <a
                                href={certUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button className="w-full h-14 text-lg font-bold gap-3 rounded-xl shadow-lg hover:translate-y-[-2px] transition-all bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700">
                                    <FileText className="h-6 w-6 text-primary" />
                                    Ver Certificado Digital
                                    <ExternalLink className="h-4 w-4 opacity-50 ml-auto" />
                                </Button>
                            </a>
                        ) : !isReference && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-4 rounded-xl text-amber-800 dark:text-amber-200 text-sm flex gap-3 shadow-sm">
                                <FileText className="h-5 w-5 text-amber-500 shrink-0" />
                                <div>
                                    <p className="font-bold">Certificado Digital em Processamento</p>
                                    <p className="opacity-80 text-xs text-amber-700 dark:text-amber-300">O arquivo será disponibilizado após o registro no sistema de qualidade.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                <Layers className="h-3 w-3 text-primary/70" /> Setor
                            </span>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{equipment.Sector?.name || 'Não Informado'}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                <Type className="h-3 w-3 text-primary/70" /> Tipo
                            </span>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{equipment.EquipmentType?.name || 'Não Informado'}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-primary/70" /> Próxima Calibração
                            </span>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {equipment.dueDate ? new Date(equipment.dueDate).toLocaleDateString('pt-BR') : 'Apenas Consulta'}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                <Tag className="h-3 w-3 text-primary/70" /> Responsável
                            </span>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Qualidade Gatron</p>
                        </div>
                    </div>

                    <div className="pt-10 text-center flex flex-col items-center">
                        <img src="/logoazul.png" alt="Gatron Logo" className="h-8 dark:brightness-0 dark:invert" />
                        <div className="h-px w-16 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-5" />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-[0.2em] uppercase">
                            Gestão de Calibração Gatron
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
