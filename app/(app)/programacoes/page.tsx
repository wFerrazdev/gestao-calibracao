'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ServiceCard, ServiceOrder } from '@/components/service-card';
import { ServiceModal } from '@/components/service-modal';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ProgramacoesPage() {
    const { permissions, isCriador, user } = useUser();
    const { firebaseUser } = useAuth();
    const [services, setServices] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceOrder | undefined>(undefined);

    const canManage = permissions?.canManageRules || isCriador || user?.role === 'ADMIN';

    const fetchServices = async () => {
        if (!firebaseUser) return;

        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch('/api/services', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Falha ao carregar serviços');
            const data = await res.json();

            if (Array.isArray(data)) {
                setServices(data);
            } else {
                setServices([]);
                console.error('API did not return an array', data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar programações');
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firebaseUser) {
            fetchServices();
        }
    }, [firebaseUser]);

    const handleCreate = () => {
        setEditingService(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (service: ServiceOrder) => {
        // Agora todos podem ver, mas edição é controlada no modal
        setEditingService(service);
        setIsModalOpen(true);
    };

    // Agrupamento
    const todoServices = services.filter(s => ['SCHEDULED', 'WAITING_QUOTE', 'WAITING_PAYMENT'].includes(s.status));
    const inProgressServices = services.filter(s => s.status === 'IN_PROGRESS');
    const doneServices = services.filter(s => ['COMPLETED', 'CANCELLED'].includes(s.status));

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Programações</h2>
                    <p className="text-muted-foreground">Gerencie os agendamentos de calibração.</p>
                </div>
                {canManage && (
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Agendamento
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                {/* Coluna A Fazer */}
                <div className="bg-muted/30 p-4 rounded-lg border min-h-[500px]">
                    <h3 className="font-semibold mb-4 flex items-center justify-between">
                        A Fazer
                        <span className="bg-muted text-xs px-2 py-1 rounded-full">{todoServices.length}</span>
                    </h3>
                    <div className="space-y-3">
                        {todoServices.map(service => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                onClick={() => handleEdit(service)}
                            />
                        ))}
                    </div>
                </div>

                {/* Coluna Em Andamento */}
                <div className="bg-blue-50/50 dark:bg-blue-950/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900 min-h-[500px]">
                    <h3 className="font-semibold mb-4 flex items-center justify-between text-blue-700 dark:text-blue-400">
                        Em Andamento
                        <span className="bg-blue-100 dark:bg-blue-900 text-xs px-2 py-1 rounded-full">{inProgressServices.length}</span>
                    </h3>
                    <div className="space-y-3">
                        {inProgressServices.map(service => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                onClick={() => handleEdit(service)}
                            />
                        ))}
                    </div>
                </div>

                {/* Coluna Finalizados */}
                <div className="bg-green-50/50 dark:bg-green-950/10 p-4 rounded-lg border border-green-100 dark:border-green-900 min-h-[500px]">
                    <h3 className="font-semibold mb-4 flex items-center justify-between text-green-700 dark:text-green-400">
                        Finalizados
                        <span className="bg-green-100 dark:bg-green-900 text-xs px-2 py-1 rounded-full">{doneServices.length}</span>
                    </h3>
                    <div className="space-y-3">
                        {doneServices.map(service => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                onClick={() => handleEdit(service)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <ServiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchServices}
                serviceToEdit={editingService}
                readOnly={!canManage}
            />
        </div>
    );
}
