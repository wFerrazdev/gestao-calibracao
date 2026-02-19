import { z } from 'zod';

// ============================================
// User Schemas
// ============================================

export const createUserSchema = z.object({
    firebaseUid: z.string(),
    email: z.string().email(),
    name: z.string().min(1),
    photoUrl: z.string().url().optional(),
    age: z.number().int().min(1).max(150).optional(),
});

export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    photoUrl: z.string().url().optional().nullable(),
    age: z.number().int().min(1).max(150).optional().nullable(),
});

export const updateUserAdminSchema = z.object({
    userId: z.string(),
    role: z.enum(['CRIADOR', 'ADMIN', 'QUALIDADE', 'PRODUCAO', 'VIEWER']).optional(),
    status: z.enum(['PENDING', 'ACTIVE', 'DISABLED']).optional(),
    sectorId: z.string().optional().nullable(),
});

export const approveUserSchema = z.object({
    userId: z.string(),
    role: z.enum(['ADMIN', 'QUALIDADE', 'PRODUCAO', 'VIEWER']),
    sectorId: z.string().optional().nullable(),
});

// ============================================
// Sector Schemas
// ============================================

export const createSectorSchema = z.object({
    name: z.string().min(1),
    code: z.string().optional(),
    description: z.string().optional(),
});

export const updateSectorSchema = z.object({
    name: z.string().min(1).optional(),
    code: z.string().optional(),
    description: z.string().optional(),
});

// ============================================
// Equipment Type Schemas
// ============================================

export const createEquipmentTypeSchema = z.object({
    name: z.string().min(1),
});

export const updateEquipmentTypeSchema = z.object({
    name: z.string().min(1),
});

// ============================================
// Calibration Rule Schemas
// ============================================

export const createCalibrationRuleSchema = z.object({
    equipmentTypeId: z.string(),
    intervalMonths: z.number().int().min(1),
    warnDays: z.number().int().min(0).default(30),
});

export const updateCalibrationRuleSchema = z.object({
    intervalMonths: z.number().int().min(1).optional(),
    warnDays: z.number().int().min(0).optional(),
});

// ============================================
// Equipment Schemas
// ============================================

export const createEquipmentSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    manufacturerModel: z.string().optional(),
    resolution: z.string().optional(),
    capacity: z.string().optional(),
    responsible: z.string().optional(),
    notes: z.string().optional(),
    sectorId: z.string(),
    equipmentTypeId: z.string(),
    lastCalibrationDate: z.string().optional(), // ISO date string
    lastCertificateNumber: z.string().optional(),
});

export const updateEquipmentSchema = z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    manufacturerModel: z.string().optional(),
    resolution: z.string().optional(),
    capacity: z.string().optional(),
    responsible: z.string().optional(),
    notes: z.string().optional(),
    sectorId: z.string().nullable().optional(),
    equipmentTypeId: z.string().optional(),
    lastCalibrationDate: z.string().optional(),
    lastCertificateNumber: z.string().optional(),
    usageStatus: z.enum(['IN_USE', 'IN_STOCK']).optional(),
    location: z.string().optional().nullable(),
});

export const queryEquipmentSchema = z.object({
    sectorId: z.string().optional(),
    status: z.enum(['CALIBRADO', 'IRA_VENCER', 'VENCIDO', 'DESATIVADO']).optional(),
    usageStatus: z.enum(['IN_USE', 'IN_STOCK']).optional(),
    q: z.string().optional(), // Busca por texto
    equipmentTypeId: z.string().optional(),
    page: z.string().default('1'),
    pageSize: z.string().default('20'),
    sortBy: z.enum(['dueDate', 'name', 'code']).default('dueDate'),
});

// ============================================
// Calibration Record Schemas
// ============================================

export const createCalibrationRecordSchema = z.object({
    calibrationDate: z.string(), // ISO date string
    certificateNumber: z.string().min(1),
    notes: z.string().optional(),
    attachmentKey: z.string().optional(),
    attachmentName: z.string().optional(),
    attachmentMime: z.string().optional(),
    attachmentSize: z.number().int().optional(),
});

// ============================================
// Dashboard Schemas
// ============================================

export const dashboardQuerySchema = z.object({
    sectorId: z.string().optional(),
    startDate: z.string().optional(), // ISO date string
    endDate: z.string().optional(), // ISO date string
});

// ============================================
// R2 Schemas
// ============================================

export const r2PresignSchema = z.object({
    equipmentId: z.string(),
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number().int(),
});
