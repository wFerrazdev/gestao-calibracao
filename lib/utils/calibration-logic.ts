/**
 * Converte um valor de calibração (string, number ou null) para um número válido.
 * Lida com strings contendo vírgulas (padrão brasileiro).
 */
export function parseCalibrationValue(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;

    // Converte vírgula para ponto e remove espaços
    const sanitized = value.replace(',', '.').trim();
    const parsed = parseFloat(sanitized);

    return isNaN(parsed) ? null : parsed;
}

/**
 * Determina o status da calibração com base na regra:
 * REPROVADO se erro > incerteza
 * APROVADO se erro <= incerteza
 * Se um dos dois for nulo, retorna null (neutro)
 */
export function getCalibrationResult(
    error: string | number | null | undefined,
    uncertainty: string | number | null | undefined
): 'APPROVED' | 'REJECTED' | null {
    const errorVal = parseCalibrationValue(error);
    const uncertaintyVal = parseCalibrationValue(uncertainty);

    if (errorVal === null || uncertaintyVal === null) {
        return null;
    }

    return errorVal > uncertaintyVal ? 'REJECTED' : 'APPROVED';
}
