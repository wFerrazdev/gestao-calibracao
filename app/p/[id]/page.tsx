
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Layers, Type, Calendar, FileText, ExternalLink, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, MapPin, User as UserIcon, Settings } from 'lucide-react';
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

    // Helper para extrair inicial do responsável
    const getResponsibleInitial = () => {
        const name = equipment.responsible || 'Qualidade Gatron';
        return name.charAt(0).toUpperCase();
    };

    // Helper para renderizar o status com cores e textos corretos
    const renderStatusBadge = () => {
        if (isReference) {
            return (
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-purple-500/50 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                    <Badge className="relative bg-[#A855F7] text-white hover:bg-[#A855F7] border-none px-12 py-3 rounded-full font-bold text-sm tracking-wide shadow-lg uppercase">
                        Item de Referência
                    </Badge>
                </div>
            );
        }

        switch (equipment.status) {
            case 'CALIBRADO':
                return (
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-emerald-500/50 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <Badge className="relative bg-[#10B981] text-white hover:bg-[#10B981] border-none px-12 py-3 rounded-full font-bold text-sm tracking-wide shadow-lg flex items-center gap-2 uppercase">
                            <CheckCircle2 className="h-4 w-4" />
                            Equipamento Calibrado
                        </Badge>
                    </div>
                );
            case 'IRA_VENCER':
                return (
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-amber-500/50 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <Badge className="relative bg-[#F59E0B] text-white hover:bg-[#F59E0B] border-none px-12 py-3 rounded-full font-bold text-sm tracking-wide shadow-lg flex items-center gap-2 uppercase">
                            <AlertTriangle className="h-4 w-4" />
                            Irá Vencer
                        </Badge>
                    </div>
                );
            case 'VENCIDO':
                return (
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-red-500/50 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <Badge className="relative bg-[#EF4444] text-white hover:bg-[#EF4444] border-none px-12 py-3 rounded-full font-bold text-sm tracking-wide shadow-lg flex items-center gap-2 uppercase">
                            <XCircle className="h-4 w-4" />
                            Vencido
                        </Badge>
                    </div>
                );
            default:
                return (
                    <Badge variant="outline" className="px-12 py-3 rounded-full font-bold shadow-sm border-slate-700 text-slate-300 bg-slate-800">
                        {equipment.status}
                    </Badge>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-start py-8 px-4 overflow-y-auto selection:bg-cyan-500/30">
            {/* Background Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute top-[40%] right-0 w-[200px] h-[200px] bg-purple-600/10 rounded-full blur-[80px]"></div>
            </div>

            <div className="w-full max-w-md flex flex-col items-center">
                {/* Header Section */}
                <div className="w-full flex justify-center mb-12">
                    <img src="/logo-branca.png" alt="Gatron Logo" className="h-10 opacity-90 drop-shadow-md" />
                </div>

                <Card className="w-full shadow-2xl border border-white/5 overflow-hidden rounded-[2.5rem] bg-[#111827]/40 backdrop-blur-2xl relative">
                    <CardHeader className="text-center pb-2 pt-10 px-8">
                        {/* Icon Shield with Glow */}
                        <div className="relative mx-auto w-24 h-24 mb-6">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative w-full h-full bg-[#1E293B]/80 rounded-[2rem] flex items-center justify-center shadow-inner border border-white/10 glass-morphism">
                                <ShieldCheck className="h-12 w-12 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                            </div>
                        </div>

                        <CardTitle className="text-3xl font-bold text-white tracking-tight leading-none px-2 mb-2">
                            {equipment.name}
                        </CardTitle>

                        <div className="mt-4">
                            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-4 py-1.5 rounded-full tracking-widest uppercase font-bold">
                                {equipment.code}
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-8 px-8 pb-10">
                        {/* Status Section */}
                        <div className="flex justify-center flex-col items-center gap-6">
                            {renderStatusBadge()}

                            {certUrl ? (
                                <a
                                    href={certUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full"
                                >
                                    <Button className="w-full h-14 text-sm font-bold gap-3 rounded-2xl shadow-xl hover:translate-y-[-1px] active:translate-y-[1px] transition-all bg-[#1F2937]/50 text-white border border-white/5 hover:bg-white/5 hover:border-white/10 backdrop-blur-md">
                                        <FileText className="h-5 w-5 text-cyan-400" />
                                        Ver Certificado Digital
                                        <ExternalLink className="h-4 w-4 opacity-40 ml-auto" />
                                    </Button>
                                </a>
                            ) : !isReference && (
                                <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-2xl text-amber-200/80 text-xs flex gap-3 shadow-sm w-full backdrop-blur-sm">
                                    <FileText className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-200 tracking-wide uppercase text-[10px]">Certificado Digital Ausente</p>
                                        <p className="opacity-70 mt-1 leading-relaxed">Este equipamento ainda não possui um certificado digital anexado ao sistema.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Information Grid Section */}
                        <div className="bg-[#0F172A]/40 border border-white/5 rounded-[2rem] p-6 space-y-8 shadow-inner overflow-hidden">
                            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                                <div className="space-y-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                                        {isInStock ? <MapPin className="h-3.5 w-3.5 text-cyan-500/70" /> : <Layers className="h-3.5 w-3.5 text-cyan-500/70" />}
                                        {isInStock ? 'Localização' : 'Setor'}
                                    </span>
                                    <p className="text-sm font-bold text-white tracking-wide truncate">
                                        {isInStock ? (equipment.location || 'Não Informado') : (equipment.Sector?.name || 'Não Informado')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                                        <Settings className="h-3.5 w-3.5 text-cyan-500/70" /> Tipo
                                    </span>
                                    <p className="text-sm font-bold text-white tracking-wide truncate">{equipment.EquipmentType?.name || 'Não Informado'}</p>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-cyan-500/70" /> Próxima Calibração
                                    </span>
                                    <p className="text-sm font-bold text-white/90 italic tracking-wide">
                                        {getNextCalibrationText()}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                                        <UserIcon className="h-3.5 w-3.5 text-cyan-500/70" /> Responsável
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-slate-700/50 border border-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300">
                                            {getResponsibleInitial()}
                                        </div>
                                        <p className="text-sm font-bold text-white tracking-wide truncate leading-none">
                                            {equipment.responsible || 'Qualidade Gatron'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Line */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent pt-2" />

                            <div className="text-center">
                                <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase opacity-60">
                                    Gestão de Calibração Gatron
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
