
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Layers, Type, Calendar, FileText, ExternalLink, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, MapPin, User as UserIcon } from 'lucide-react';
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
    const isInStock = equipment.usageStatus === 'IN_STOCK';

    // Determinar URL do certificado
    const certUrl = lastCert ? `/api/public/certificate/${lastCert.id}` : null;

    // Lógica para "Próxima Calibração"
    const getNextCalibrationText = () => {
        if ((equipment.status === 'VENCIDO' || isReference) && !certUrl) {
            return 'Não disponível';
        }
        return equipment.dueDate ? new Date(equipment.dueDate).toLocaleDateString('pt-BR') : 'Apenas Consulta';
    };

    // Helper para renderizar o status com cores e textos corretos
    const renderStatusBadge = () => {
        if (isReference) {
            return (
                <Badge className="bg-purple-600 text-white hover:bg-purple-600 border-none px-6 py-2 rounded-full font-bold shadow-md">
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
                    <Badge variant="outline" className="px-6 py-2 rounded-full font-bold shadow-sm border-slate-300 text-slate-700">
                        {equipment.status}
                    </Badge>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-6 px-4 overflow-y-auto">
            <Card className="w-full max-w-md shadow-xl border-none overflow-hidden rounded-2xl bg-white mb-8">
                <div className="bg-primary h-2 w-full" />

                <CardHeader className="text-center pb-2 pt-6">
                    <div className="mx-auto w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20 transform -rotate-3 border-4 border-white">
                        <ShieldCheck className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-extrabold text-slate-800 tracking-tight leading-tight px-2">
                        {equipment.name}
                    </CardTitle>
                    <p className="text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-widest bg-slate-100 inline-block px-3 py-1 rounded border border-slate-200">
                        {equipment.code}
                    </p>
                </CardHeader>

                <CardContent className="space-y-6 pt-4 px-6 pb-8">
                    {/* Status Centralizado */}
                    <div className="flex justify-center flex-col items-center gap-5">
                        {renderStatusBadge()}

                        {certUrl ? (
                            <a
                                href={certUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button className="w-full h-12 text-base font-bold gap-3 rounded-xl shadow-md hover:translate-y-[-1px] transition-all bg-white text-slate-900 border border-slate-200 hover:bg-slate-50">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Ver Certificado Digital
                                    <ExternalLink className="h-3 w-3 opacity-40 ml-auto" />
                                </Button>
                            </a>
                        ) : !isReference && (
                            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 text-xs flex gap-3 shadow-sm w-full">
                                <FileText className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-amber-900">Certificado Digital Ausente</p>
                                    <p className="opacity-80 leading-relaxed text-amber-700">Este equipamento ainda não possui um certificado digital anexado ao sistema.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-6 border-t border-slate-100">
                        <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 px-0.5">
                                {isInStock ? <MapPin className="h-3 w-3 text-primary/60" /> : <Layers className="h-3 w-3 text-primary/60" />}
                                {isInStock ? 'Localização' : 'Setor'}
                            </span>
                            <p className="text-xs font-bold text-slate-700 break-words">
                                {isInStock ? (equipment.location || 'Não Informado') : (equipment.Sector?.name || 'Não Informado')}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 px-0.5">
                                <Type className="h-3 w-3 text-primary/60" /> Tipo
                            </span>
                            <p className="text-xs font-bold text-slate-700 break-words">{equipment.EquipmentType?.name || 'Não Informado'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 px-0.5">
                                <Calendar className="h-3 w-3 text-primary/60" /> Próxima Calibração
                            </span>
                            <p className="text-xs font-bold text-slate-700 italic">
                                {getNextCalibrationText()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 px-0.5">
                                <UserIcon className="h-3 w-3 text-primary/60" /> Responsável
                            </span>
                            <p className="text-xs font-bold text-slate-700 break-words">
                                {equipment.responsible || 'Qualidade Gatron'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 text-center flex flex-col items-center opacity-80">
                        <img src="/logoazul.png" alt="Gatron Logo" className="h-7" />
                        <div className="h-px w-12 bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />
                        <p className="text-[9px] text-slate-500 font-bold tracking-[0.15em] uppercase">
                            Gestão de Calibração Gatron
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
