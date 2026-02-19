'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Wrench } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Definição de tipos alinhada com o retorno da API
export interface ServiceOrder {
    id: string;
    equipmentId: string;
    scheduledDate: string;
    status: string;
    technician?: string;
    description?: string;
    Equipment: {
        name: string;
        code: string;
        imageUrl?: string;
        Sector: { name: string };
    };
}

interface ServiceOrderProps {
    service: ServiceOrder;
    onClick?: () => void;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
    SCHEDULED: { label: 'Agendado', variant: 'outline' },
    IN_PROGRESS: { label: 'Em Andamento', variant: 'default' }, // Azul
    WAITING_QUOTE: { label: 'Orçamento', variant: 'secondary' }, // Cinza
    WAITING_PAYMENT: { label: 'Ag. Pagamento', variant: 'secondary' },
    COMPLETED: { label: 'Finalizado', variant: 'success' }, // Verde (preciso criar variant success ou usar default com style)
    CANCELLED: { label: 'Cancelado', variant: 'destructive' },
};

export function ServiceCard({ service, onClick }: ServiceOrderProps) {
    const statusInfo = statusMap[service.status] || { label: service.status, variant: 'outline' };

    return (
        <Card
            className="mb-3 cursor-pointer hover:shadow-md transition-shadow border-l-4"
            style={{ borderLeftColor: getStatusColor(service.status) }}
            onClick={onClick}
        >
            <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant={statusInfo.variant as any} className="text-[10px] px-1.5 py-0 h-5">
                        {statusInfo.label}
                    </Badge>
                    {service.technician && (
                        <div className="flex items-center text-xs text-muted-foreground" title={`Fornecedor: ${service.technician}`}>
                            <User className="h-3 w-3 mr-1" />
                            {service.technician.split(' ')[0]}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 mb-1">
                    {service.Equipment.imageUrl ? (
                        <Avatar className="h-8 w-8 rounded-sm">
                            <AvatarImage src={service.Equipment.imageUrl} className="object-cover" />
                            <AvatarFallback className="rounded-sm"><Wrench className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-8 w-8 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                    <div>
                        <h4 className="text-sm font-semibold leading-tight line-clamp-1">{service.Equipment.name}</h4>
                        <span className="text-xs text-muted-foreground">{service.Equipment.code} • {service.Equipment.Sector.name}</span>
                    </div>
                </div>

                <div className="flex items-center text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(service.scheduledDate), "dd MMM, HH:mm", { locale: ptBR })}
                </div>
            </CardContent>
        </Card>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'SCHEDULED': return '#3b82f6'; // blue-500
        case 'IN_PROGRESS': return '#8b5cf6'; // violet-500
        case 'WAITING_QUOTE': return '#f59e0b'; // amber-500
        case 'WAITING_PAYMENT': return '#f97316'; // orange-500
        case 'COMPLETED': return '#22c55e'; // green-500
        case 'CANCELLED': return '#ef4444'; // red-500
        default: return '#94a3b8';
    }
}
