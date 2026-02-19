import type { UserRole } from '@prisma/client';

export function requireRole(userRole: UserRole, allowedRoles: UserRole[]): void {
    if (!allowedRoles.includes(userRole)) {
        throw new Error('Permissão insuficiente para acessar este recurso');
    }
}
