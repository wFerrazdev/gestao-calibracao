'use client';

import { ToolbarProps } from 'react-big-calendar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomToolbarProps extends ToolbarProps { }

export function CalendarToolbar({ label, onNavigate, onView, view }: CustomToolbarProps) {
    const goToBack = () => {
        onNavigate('PREV');
    };

    const goToNext = () => {
        onNavigate('NEXT');
    };

    const goToToday = () => {
        onNavigate('TODAY');
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                <Button variant="outline" size="sm" onClick={goToToday}>
                    Hoje
                </Button>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={goToBack}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={goToNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <span className="text-lg font-semibold capitalize ml-2 min-w-[150px] text-center md:text-left">
                    {/* Format label properly if needed, but RB-Calendar passes a string normally */}
                    {label}
                </span>
            </div>

            <div className="flex items-center bg-muted p-1 rounded-md">
                <Button
                    variant={view === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onView('month')}
                    className="flex-1"
                >
                    Mês
                </Button>
                <Button
                    variant={view === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onView('week')}
                    className="flex-1"
                >
                    Semana
                </Button>
                <Button
                    variant={view === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onView('day')}
                    className="flex-1"
                >
                    Dia
                </Button>
                <Button
                    variant={view === 'agenda' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onView('agenda')}
                    className="flex-1"
                >
                    Agenda
                </Button>
            </div>
        </div>
    );
}
