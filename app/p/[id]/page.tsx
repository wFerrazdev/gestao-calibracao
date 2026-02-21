
import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Tag, Layers, Type, Calendar, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-2xl border-none overflow-hidden rounded-2xl">
                <div className="bg-primary h-2 w-full" />

                <CardHeader className="text-center pb-2 pt-8">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        {equipment.name}
                    </CardTitle>
                    <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest bg-slate-100 inline-block px-2 py-1 rounded">
                        {equipment.code}
                    </p>
                </CardHeader>

                <CardContent className="space-y-8 pt-6 px-8 pb-10">
                    {/* Status Centralizado */}
                    <div className="flex justify-center flex-col items-center gap-4">
                        <Badge
                            variant={isReference ? 'secondary' : (equipment.status === 'CALIBRADO' ? 'default' : 'destructive')}
                            className="text-sm px-6 py-2 rounded-full font-bold shadow-sm"
                        >
                            {isReference ? 'ITEM DE REFERÊNCIA' : (equipment.status === 'CALIBRADO' ? '✓ EQUIPAMENTO CALIBRADO' : equipment.status)}
                        </Badge>

                        {certUrl ? (
                            <a
                                href={certUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button className="w-full h-14 text-lg font-bold gap-3 rounded-xl shadow-lg hover:translate-y-[-2px] transition-all">
                                    <FileText className="h-6 w-6" />
                                    Ver Certificado Digital
                                    <ExternalLink className="h-4 w-4 opacity-50" />
                                </Button>
                            </a>
                        ) : !isReference && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm flex gap-3">
                                <FileText className="h-5 w-5 text-amber-500 shrink-0" />
                                <div>
                                    <p className="font-bold">Certificado Ausente</p>
                                    <p className="opacity-80 text-xs">O arquivo digital ainda não foi anexado ao sistema por este equipamento.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-slate-100">
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                <Layers className="h-3 w-3" /> Setor
                            </span>
                            <p className="text-sm font-semibold text-slate-700">{equipment.Sector?.name || 'Não Informado'}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                <Type className="h-3 w-3" /> Tipo
                            </span>
                            <p className="text-sm font-semibold text-slate-700">{equipment.EquipmentType?.name || 'Não Informado'}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" /> Próxima Calibração
                            </span>
                            <p className="text-sm font-semibold text-slate-700">
                                {equipment.dueDate ? new Date(equipment.dueDate).toLocaleDateString('pt-BR') : 'Apenas Consulta'}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                                <Tag className="h-3 w-3" /> Responsável
                            </span>
                            <p className="text-sm font-semibold text-slate-700">Qualidade Gatron</p>
                        </div>
                    </div>

                    <div className="pt-8 text-center flex flex-col items-center">
                        <img src="/logoazul.png" alt="Gatron Logo" className="h-7 opacity-80" />
                        <div className="h-px w-12 bg-slate-200 my-4" />
                        <p className="text-[9px] text-slate-400 font-medium tracking-tighter uppercase">
                            Sistema de Gestão de Conformidade e Metrologia
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
