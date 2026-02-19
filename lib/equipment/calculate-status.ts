import { addMonths, differenceInDays, startOfDay } from 'date-fns';
import type { EquipmentStatus } from '@prisma/client';

interface CalibrationRule {
    intervalMonths: number;
    warnDays: number;
}

interface CalculateStatusResult {
    dueDate: Date | null;
    status: EquipmentStatus;
    daysRemaining: number | null;
}

export function calculateEquipmentStatus(
    lastCalibrationDate: Date | null,
    calibrationRule: CalibrationRule | null
): CalculateStatusResult {
    // Se não há regra de calibração, é um equipamento de REFERÊNCIA (não precisa calibrar)
    if (!calibrationRule) {
        return {
            dueDate: null,
            status: 'REFERENCIA',
            daysRemaining: null,
        };
    }

    // Se tem regra mas não tem data de calibração, está vencido (precisa calibrar para começar a contar)
    if (!lastCalibrationDate) {
        return {
            dueDate: null,
            status: 'VENCIDO',
            daysRemaining: null,
        };
    }

    // Calcular data de vencimento
    const dueDate = addMonths(lastCalibrationDate, calibrationRule.intervalMonths);

    // Comparar com data atual (início do dia para evitar problemas de timezone)
    const today = startOfDay(new Date());
    const dueDateStart = startOfDay(dueDate);
    const daysRemaining = differenceInDays(dueDateStart, today);

    let status: EquipmentStatus;

    if (daysRemaining < 0) {
        // Vencido
        status = 'VENCIDO';
    } else if (daysRemaining <= calibrationRule.warnDays) {
        // Irá vencer (dentro da janela de aviso)
        status = 'IRA_VENCER';
    } else {
        // Calibrado
        status = 'CALIBRADO';
    }

    return {
        dueDate,
        status,
        daysRemaining,
    };
}
