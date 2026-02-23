
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Layers, Type, Calendar, FileText, ExternalLink, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, MapPin, User as UserIcon, Settings, Trash } from 'lucide-react';
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
                    <Badge className="relative bg-[#A855F7] text-white hover:bg-[#A855F7] border-none px-6 py-3 rounded-full font-bold text-sm tracking-wide shadow-lg uppercase whitespace-nowrap">
                        Item de Referência
                    </Badge>
                </div>
            );
        }

        switch (equipment.status) {
            case 'CALIBRADO':
            case 'IRA_VENCER':
                return (
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-emerald-500/50 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <Badge className="relative bg-[#10B981] text-white hover:bg-[#10B981] border-none px-6 py-3 rounded-full font-bold text-sm tracking-wide shadow-lg flex items-center gap-2 uppercase whitespace-nowrap">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            Equipamento Calibrado
                        </Badge>
                    </div>
                );
            case 'VENCIDO':
                return (
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-red-500/50 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <Badge className="relative bg-[#EF4444] text-white hover:bg-[#EF4444] border-none px-6 py-3 rounded-full font-bold text-sm tracking-wide shadow-lg flex items-center gap-2 uppercase whitespace-nowrap">
                            <XCircle className="h-4 w-4 shrink-0" />
                            Vencido
                        </Badge>
                    </div>
                );
            case 'SUCATEADO':
                return (
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-orange-500/50 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <Badge className="relative bg-[#F97316] text-white hover:bg-[#F97316] border-none px-6 py-3 rounded-full font-bold text-sm tracking-wide shadow-lg flex items-center gap-2 uppercase whitespace-nowrap">
                            <Trash className="h-4 w-4 shrink-0" />
                            Equipamento Sucateado
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

    // Calculate days until expiration if equipment is IRA_VENCER
    let daysUntilExpiration = null;
    let expirationMessage = "";
    if (equipment.status === 'IRA_VENCER' && equipment.dueDate) {
        const today = new Date();
        const dueDate = new Date(equipment.dueDate);
        const timeDiff = dueDate.getTime() - today.getTime();
        daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const daysLabel = Math.abs(daysUntilExpiration) === 1 ? 'dia' : 'dias';
        expirationMessage = `Certificado do equipamento expira em ${daysUntilExpiration} ${daysLabel}.`;
    }

    return (
        <div className="fixed inset-0 bg-slate-50 overflow-y-auto overflow-x-hidden selection:bg-cyan-500/30 touch-pan-y">
            {/* Background Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-400/5 rounded-full blur-[100px]"></div>
                <div className="absolute top-[40%] right-0 w-[200px] h-[200px] bg-purple-400/5 rounded-full blur-[80px]"></div>
            </div>

            <div className="min-h-full w-full flex flex-col items-center py-12 px-4 text-slate-900">
                <Card className="w-full shadow-xl border border-slate-200 overflow-hidden rounded-[2.5rem] bg-white relative">
                    {/* Minimalist Logo inside Card */}
                    <div className="absolute top-8 left-8 z-20">
                        <img src="/logoazul.png" alt="Gatron Logo" className="h-4 opacity-80" />
                    </div>

                    <CardHeader className="text-center pb-2 pt-14 px-8 relative">
                        {/* Icon Shield with Glow */}
                        <div className="relative mx-auto w-24 h-24 mb-6">
                            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative w-full h-full bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner border border-slate-100">
                                <ShieldCheck className="h-12 w-12 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                            </div>
                        </div>

                        <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight leading-none px-2 mb-2">
                            {equipment.name}
                        </CardTitle>

                        <div className="mt-4">
                            <span className="text-[11px] font-mono text-cyan-600 bg-cyan-50 border border-cyan-200 px-4 py-1.5 rounded-full tracking-widest uppercase font-bold">
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
                                    <Button className="w-full h-14 text-sm font-bold gap-3 rounded-2xl shadow-md hover:translate-y-[-1px] active:translate-y-[1px] transition-all bg-slate-900 text-white hover:bg-slate-800">
                                        <FileText className="h-5 w-5 text-cyan-400" />
                                        Ver Certificado Digital
                                        <ExternalLink className="h-4 w-4 opacity-40 ml-auto" />
                                    </Button>
                                </a>
                            ) : !isReference && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs flex gap-3 shadow-sm w-full">
                                    <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-800 tracking-wide uppercase text-[10px]">Certificado Digital Ausente</p>
                                        <p className="opacity-70 mt-1 leading-relaxed text-amber-700">Este equipamento ainda não possui um certificado digital anexado ao sistema.</p>
                                    </div>
                                </div>
                            )}

                            {equipment.status === 'IRA_VENCER' && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs flex gap-3 shadow-sm w-full mt-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-800 tracking-wide uppercase text-[10px]">Aviso de Vencimento Próximo</p>
                                        <p className="opacity-80 mt-1 leading-relaxed text-amber-700 font-medium">
                                            {expirationMessage || 'Este equipamento encontra-se calibrado, porém seu certificado expira em breve.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Information Grid Section */}
                        <div className="bg-slate-50/80 border border-slate-100 rounded-[2rem] p-6 space-y-8 shadow-inner overflow-hidden">
                            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                                <div className="space-y-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                                        {isInStock ? <MapPin className="h-3.5 w-3.5 text-cyan-600/70" /> : <Layers className="h-3.5 w-3.5 text-cyan-600/70" />}
                                        {isInStock ? 'Localização' : 'Setor'}
                                    </span>
                                    <p className="text-sm font-bold text-slate-900 tracking-wide truncate">
                                        {isInStock ? (equipment.location || 'Não Informado') : (equipment.Sector?.name || 'Não Informado')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                                        <Settings className="h-3.5 w-3.5 text-cyan-600/70" /> Tipo
                                    </span>
                                    <p className="text-sm font-bold text-slate-900 tracking-wide truncate">{equipment.EquipmentType?.name || 'Não Informado'}</p>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-cyan-600/70" /> Próxima Calibração
                                    </span>
                                    <p className="text-sm font-bold text-slate-900 italic tracking-wide">
                                        {getNextCalibrationText()}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                                        <UserIcon className="h-3.5 w-3.5 text-cyan-600/70" /> Responsável
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {getResponsibleInitial()}
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 tracking-wide truncate leading-none">
                                            {equipment.responsible || 'Qualidade Gatron'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Line */}
                            <div className="h-px w-full bg-slate-200 pt-2" />

                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">
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
