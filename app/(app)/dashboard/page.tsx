'use client';

import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area,
} from 'recharts';
import { Heart } from 'lucide-react';
import { DonutChartPremium } from '@/components/dashboard/donut-chart-premium';
import { StatusChartPremium } from '@/components/dashboard/status-chart-premium';
import { TrendLinePremium } from '@/components/dashboard/trend-line-premium';
import { ChartCardPremium } from '@/components/dashboard/chart-card-premium';

interface DashboardData {
    totalEquipment: number;
    countByStatus: {
        CALIBRADO: number;
        IRA_VENCER: number;
        VENCIDO: number;
        DESATIVADO: number;
        REFERENCIA: number;
    };
    countBySector: Array<{ sectorId: string; sectorName: string; count: number }>;
    upcomingDue: any[];
    calibrationsByMonth: Array<{ month: string; count: number }>;
    equipmentByType: Array<{ typeName: string; count: number }>;
    sectorHealthScores: Array<{
        sectorId: string;
        sectorName: string;
        total: number;
        calibrated: number;
        score: number;
    }>;
    approvalRate: {
        APPROVED: number;
        REJECTED: number;
    };
    recentFailures: Array<{
        id: string;
        calibrationDate: string;
        Equipment: {
            name: string;
            code: string;
        };
    }>;
}


const STATUS_COLORS: Record<string, string> = {
    CALIBRADO: '#22c55e',
    IRA_VENCER: '#f59e0b',
    VENCIDO: '#ef4444',
    DESATIVADO: '#94a3b8',
    REFERENCIA: '#9333ea',
};

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];



export default function DashboardPage() {
    const { firebaseUser } = useAuth();
    const { user: dbUser, permissions, loading: userLoading } = useUser();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sectorFilter, setSectorFilter] = useState<string>('');
    const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        async function fetchSectors() {
            if (!firebaseUser) return;
            try {
                const token = await firebaseUser.getIdToken();
                const res = await fetch('/api/sectors', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setSectors(data);
                }
            } catch (e) {
                console.error('Erro ao buscar setores:', e);
            }
        }
        if (firebaseUser) fetchSectors();
    }, [firebaseUser]);

    useEffect(() => {
        async function fetchData() {
            if (!firebaseUser) return;

            try {
                const token = await firebaseUser.getIdToken();
                const params = new URLSearchParams();
                if (sectorFilter) params.set('sectorId', sectorFilter);

                const response = await fetch(`/api/dashboard?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const dashboardData = await response.json();
                    setData(dashboardData);
                }
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setLoading(false);
            }
        }

        if (firebaseUser && !userLoading) {
            setLoading(true);
            fetchData();
        } else if (!userLoading && !firebaseUser) {
            setLoading(false);
        }
    }, [firebaseUser, userLoading, sectorFilter]);

    const isLoading = loading || (userLoading && !dbUser);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-72 rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // Preparar dados para gráficos
    const statusChartData = data ? [
        { name: 'Calibrado', value: data.countByStatus.CALIBRADO, fill: STATUS_COLORS.CALIBRADO },
        { name: 'Irá Vencer', value: data.countByStatus.IRA_VENCER, fill: STATUS_COLORS.IRA_VENCER },
        { name: 'Vencido', value: data.countByStatus.VENCIDO, fill: STATUS_COLORS.VENCIDO },
        { name: 'Referência', value: data.countByStatus.REFERENCIA, fill: STATUS_COLORS.REFERENCIA },
        { name: 'Desativado', value: data.countByStatus.DESATIVADO, fill: STATUS_COLORS.DESATIVADO },
    ] : [];

    const approvalChartData = data ? [
        { name: 'Aprovado', value: data.approvalRate.APPROVED, fill: '#22c55e' }, // Green
        { name: 'Reprovado', value: data.approvalRate.REJECTED, fill: '#ef4444' }, // Red
    ] : [];

    const monthChartData = data?.calibrationsByMonth?.map(item => ({
        month: formatMonth(item.month),
        Calibrações: item.count,
    })) || [];

    const typeChartData = data?.equipmentByType?.map((item, index) => ({
        name: item.typeName,
        value: item.count,
        fill: PIE_COLORS[index % PIE_COLORS.length]
    })) || [];

    return (
        <div className="space-y-6">
            {/* Header com filtro */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Visão geral do sistema de calibração</p>
                </div>
                {/* Filtro por setor (não mostrar para PRODUCAO que já é filtrado automaticamente) */}
                {dbUser?.role !== 'PRODUCAO' && dbUser?.role !== 'VIEWER' && (
                    <select
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">Todos os setores</option>
                        {sectors.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Cards de Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard
                    label="Total de Equipamentos"
                    value={data?.totalEquipment || 0}
                    className="bg-card border"
                />
                <StatusCard
                    label="Calibrados"
                    value={data?.countByStatus.CALIBRADO || 0}
                    className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                    valueColor="text-green-700 dark:text-green-400"
                    labelColor="text-green-600 dark:text-green-500"
                />
                <StatusCard
                    label="Irá Vencer"
                    value={data?.countByStatus.IRA_VENCER || 0}
                    className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                    valueColor="text-yellow-700 dark:text-yellow-400"
                    labelColor="text-yellow-600 dark:text-yellow-500"
                />
                <StatusCard
                    label="Vencidos"
                    value={data?.countByStatus.VENCIDO || 0}
                    className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                    valueColor="text-red-700 dark:text-red-400"
                    labelColor="text-red-600 dark:text-red-500"
                />

            </div>

            {/* Gráficos — Linha 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Barras: Quantidade por Status */}
                {/* Gráfico de Barras Premium: Equipamentos por Status */}
                <div className="h-full min-h-[460px]">
                    <StatusChartPremium
                        data={statusChartData}
                        total={data?.totalEquipment || 0}
                    />
                </div>

                {/* Gráfico de Barras: Distribuição por Tipo - Substituído por Donut Chart */}
                {/* Donut Chart Premium */}
                <div className="h-full min-h-[460px]">
                    <DonutChartPremium data={typeChartData} />
                </div>
            </div>

            {/* Gráficos — Linha 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Área: Calibrações por Mês */}
                {/* Gráfico de Área Premium: Calibrações por Mês */}
                <div className="h-[380px]">
                    <TrendLinePremium data={monthChartData} />
                </div>

                {/* Widget: Saúde dos Setores */}
                {/* Widget: Saúde dos Setores */}
                <div className="h-[380px]">
                    <ChartCardPremium title="Saúde dos Setores" icon={Heart} iconColor="text-pink-500 dark:text-pink-400">
                        <div className="space-y-4 pr-2 max-h-[290px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 relative z-10">
                            {data?.sectorHealthScores?.map((sector) => (
                                <div key={sector.sectorId} className="space-y-1.5 p-1 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{sector.sectorName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 dark:text-slate-500">{sector.calibrated}/{sector.total}</span>
                                            <span className={`font-bold tabular-nums ${sector.score >= 80
                                                ? 'text-green-600 dark:text-green-400'
                                                : sector.score >= 50
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {sector.score}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out relative ${sector.score >= 80
                                                ? 'bg-green-500'
                                                : sector.score >= 50
                                                    ? 'bg-yellow-500'
                                                    : 'bg-red-500'
                                                }`}
                                            style={{ width: `${sector.score}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 blur-[1px]"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!data?.sectorHealthScores || data.sectorHealthScores.length === 0) && (
                                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                                    Sem dados disponíveis
                                </div>
                            )}
                        </div>
                    </ChartCardPremium>
                </div>
            </div>


            {/* Tabela: Próximos Vencimentos */}
            <div className="rounded-lg border bg-card">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-sm font-semibold text-foreground">Próximos Vencimentos</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Nome
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Setor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Vencimento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data?.upcomingDue?.map((equipment: any) => (
                                <tr key={equipment.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-foreground">
                                        {equipment.code}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">
                                        {equipment.name}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">
                                        {equipment.Sector?.name || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">
                                        {equipment.dueDate
                                            ? new Date(equipment.dueDate).toLocaleDateString('pt-BR')
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <StatusBadge status={equipment.status} />
                                    </td>
                                </tr>
                            ))}
                            {(!data?.upcomingDue || data.upcomingDue.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                                        Nenhum equipamento com vencimento próximo
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}

// --- Componentes auxiliares ---

function StatusCard({
    label,
    value,
    className = '',
    valueColor = 'text-foreground',
    labelColor = 'text-muted-foreground',
}: {
    label: string;
    value: number;
    className?: string;
    valueColor?: string;
    labelColor?: string;
}) {
    return (
        <div className={`rounded-lg border p-5 ${className}`}>
            <p className={`text-sm font-medium ${labelColor} mb-1`}>{label}</p>
            <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        CALIBRADO: { label: 'Calibrado', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
        IRA_VENCER: { label: 'Irá Vencer', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
        VENCIDO: { label: 'Vencido', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
        REFERENCIA: { label: 'Referência', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
        DESATIVADO: { label: 'Desativado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    };

    const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.className}`}>
            {c.label}
        </span>
    );
}

function formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}
