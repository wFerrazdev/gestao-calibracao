'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

interface DataTableShellProps {
    children: React.ReactNode;
    toolbar?: React.ReactNode;
    pagination?: React.ReactNode;
    className?: string;
}

/**
 * DataTableShell
 * Um componente de layout premium para tabelas que garante:
 * 1. Altura consistente (não cresce infinito)
 * 2. Corpo da tabela rolável internamente
 * 3. Cabeçalho sticky (definido na tabela filha)
 * 4. Paginação sempre fixa no rodapé do card
 * 5. Design clean com bordas arredondadas e suavidade visual
 */
export function DataTableShell({
    children,
    toolbar,
    pagination,
    className
}: DataTableShellProps) {
    return (
        <div className={cn("flex flex-col flex-1 min-h-0 w-full animate-in fade-in duration-500", className)}>
            {/* Toolbar/Filtros Section */}
            {toolbar && (
                <div className="shrink-0 mb-4 px-1">
                    {toolbar}
                </div>
            )}

            {/* Container Principal do Card */}
            <div className="flex flex-col flex-1 min-h-0 rounded-2xl border bg-card shadow-sm overflow-hidden ring-1 ring-border/5">
                {/* Área Rolável da Tabela */}
                {/* O overflow-auto aqui permite que apenas o corpo role */}
                <div className="flex-1 min-h-0 overflow-auto relative">
                    {children}
                </div>

                {/* Footer Fixo da Paginação */}
                {pagination && (
                    <div className="shrink-0 border-t bg-card/98 backdrop-blur-md px-4 py-3 md:px-6 z-20">
                        {pagination}
                    </div>
                )}
            </div>

            {/* Respiro no final da tela */}
            <div className="h-4 md:h-6 shrink-0" />
        </div>
    );
}
