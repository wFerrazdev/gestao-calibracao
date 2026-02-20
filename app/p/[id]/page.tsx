
import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Tag, Layers, Type, Calendar } from 'lucide-react';

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

    // Lógica de redirecionamento inteligente
    const needsRedirect = ['CALIBRADO', 'IRA_VENCER', 'VENCIDO'].includes(equipment.status);
    const lastCert = equipment.CalibrationRecord[0];

    if (needsRedirect && lastCert?.attachmentUrl) {
        redirect(lastCert.attachmentUrl);
    }

    // Se for REFERENCIA ou não tiver certificado, mostra página de info
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Settings className="h-8 w-8 text-primary animate-spin-slow" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{equipment.name}</CardTitle>
                    <p className="text-sm font-mono text-muted-foreground">{equipment.code}</p>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="flex justify-center">
                        <Badge variant={equipment.status === 'REFERENCIA' ? 'secondary' : 'destructive'} className="text-sm px-4 py-1">
                            {equipment.status === 'REFERENCIA' ? 'Item de Referência' : 'Certificado não disponível'}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                <Layers className="h-3 w-3" /> Setor
                            </span>
                            <p className="text-sm font-medium">{equipment.Sector?.name || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                <Type className="h-3 w-3" /> Tipo
                            </span>
                            <p className="text-sm font-medium">{equipment.EquipmentType?.name || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Próxima Calibração
                            </span>
                            <p className="text-sm font-medium">
                                {equipment.dueDate ? new Date(equipment.dueDate).toLocaleDateString('pt-BR') : '-'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                <Tag className="h-3 w-3" /> Próximo Passo
                            </span>
                            <p className="text-sm font-medium">
                                {equipment.status === 'REFERENCIA' ? 'Apenas Consulta' : 'Contatar Qualidade'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 text-center">
                        <img src="/gtpequeno.png" alt="Gatron Logo" className="h-6 mx-auto opacity-50" />
                        <p className="text-[10px] text-muted-foreground mt-2">© Gestão de Calibração Gatron</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
