/**
 * Lógica de aprovação de calibração:
 * REPROVADO quando erro > incerteza
 * APROVADO quando erro <= incerteza
 * 
 * Se os valores estiverem ausentes, o status padrão é APPROVED 
 * (desde que não haja dados que provem o contrário).
 */

export type CalibrationStatus = 'APPROVED' | 'REJECTED';

export function parseCalibrationValue(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;

    // Converte vírgula para ponto e remove espaços
    const cleanValue = value.toString().replace(',', '.').trim();
    const parsed = parseFloat(cleanValue);

    return isNaN(parsed) ? null : parsed;
}

export function getCalibrationResult(
    error: string | number | null | undefined,
    uncertainty: string | number | null | undefined
): CalibrationStatus {
    const errorVal = parseCalibrationValue(error);
    const uncertaintyVal = parseCalibrationValue(uncertainty);

    // Se um dos valores não existir, não podemos aplicar a regra de reprovação
    if (errorVal === null || uncertaintyVal === null) {
        return 'APPROVED';
    }

    // Regra: REPROVADO quando erro > incerteza
    if (errorVal > uncertaintyVal) {
        return 'REJECTED';
    }

    return 'APPROVED';
}
