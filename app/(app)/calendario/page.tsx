'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { ServiceOrder } from '@/components/service-card';
import { useRouter } from 'next/navigation';
import { CalendarToolbar } from '@/components/calendar-toolbar';
import { useAuth } from '@/contexts/AuthContext';

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
    type: 'SERVICE' | 'DUE_DATE';
    status?: string;
}

// ... existing imports ...
// ... existing imports ...
// CalendarToolbar already imported above

// ... existing locales ...

// ... (keep localizer and CalendarEvent interface) ...

export default function CalendarioPage() {
    const { theme } = useTheme();
    const router = useRouter();
    const { firebaseUser } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<any>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const fetchData = async () => {
        if (!firebaseUser) return;
        try {
            const token = await firebaseUser.getIdToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Buscar Agendamentos
            const servicesRes = await fetch('/api/services', { headers });
            // FIX: Ensure it is an array
            if (!servicesRes.ok) throw new Error('Erro ao buscar serviços');

            const servicesData: ServiceOrder[] = await servicesRes.json();

            const calendarEvents: CalendarEvent[] = [];

            // Mapear Serviços
            if (Array.isArray(servicesData)) {
                servicesData.forEach(service => {
                    const date = new Date(service.scheduledDate);
                    calendarEvents.push({
                        id: service.id,
                        title: `🔧 ${service.Equipment.name} (${service.status})`,
                        start: date,
                        end: new Date(date.getTime() + 60 * 60 * 1000), // 1 hora de duração padrão
                        type: 'SERVICE',
                        status: service.status,
                        resource: service
                    });
                });
            }

            setEvents(calendarEvents);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firebaseUser) {
            fetchData();
        }
    }, [firebaseUser]);

    const eventStyleGetter = (event: CalendarEvent) => {
        let backgroundColor = '#3b82f6'; // blue default

        if (event.type === 'DUE_DATE') {
            backgroundColor = '#ef4444'; // red
        } else if (event.status === 'COMPLETED') {
            backgroundColor = '#22c55e'; // green
        } else if (event.status === 'IN_PROGRESS') {
            backgroundColor = '#8b5cf6'; // violet
        } else if (event.status === 'WAITING_QUOTE' || event.status === 'WAITING_PAYMENT') {
            backgroundColor = '#f97316'; // orange
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        if (event.type === 'SERVICE') {
            // Poderia abrir o modal de edição
        } else {
            router.push(`/equipamentos/${event.resource.id}`);
        }
    };

    if (loading) return <div className="p-8">Carregando calendário...</div>;

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Calendário de Calibrações</h2>
                <p className="text-muted-foreground">Visualize agendamentos e vencimentos.</p>
            </div>

            <Card className="p-4 flex-1 bg-background overflow-hidden relative" style={{ minHeight: '600px' }}>
                <div className="h-full w-full absolute inset-0 p-4">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        culture="pt-BR"
                        messages={{
                            today: 'Hoje',
                            previous: 'Anterior',
                            next: 'Próximo',
                            month: 'Mês',
                            week: 'Semana',
                            day: 'Dia',
                            agenda: 'Agenda',
                            date: 'Data',
                            time: 'Hora',
                            event: 'Evento',
                            noEventsInRange: 'Sem eventos neste período.'
                        }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        views={['month', 'week', 'day', 'agenda']}
                        defaultView={Views.MONTH}
                        components={{
                            toolbar: CalendarToolbar as any
                        }}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                    />
                </div>
            </Card>
        </div>
    );
}
