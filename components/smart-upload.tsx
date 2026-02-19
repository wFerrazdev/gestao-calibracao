
"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SmartUploadProps {
    onAnalysisComplete: (data: any) => void;
    onFileSelected?: (file: File) => void;
}

export function SmartUpload({ onAnalysisComplete, onFileSelected }: SmartUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
            toast.error("Por favor, envie uma imagem ou PDF.");
            return;
        }

        if (onFileSelected) {
            onFileSelected(file);
        }

        setAnalyzing(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/ai/parse-certificate", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Falha na análise");

            const data = await response.json();
            onAnalysisComplete(data);
            toast.success("Certificado analisado com sucesso!", {
                icon: <Sparkles className="h-4 w-4 text-yellow-500" />,
            });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao analisar certificado. Tente preencher manualmente.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div
            className={cn(
                "border-2 border-dashed rounded-lg p-6 transition-colors text-center cursor-pointer relative overflow-hidden group/upload",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                analyzing && "pointer-events-none opacity-80"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("smart-upload-input")?.click()}
        >
            <input
                id="smart-upload-input"
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {analyzing ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    <div className="relative">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <div>
                        <p className="font-medium text-primary">Analisando Certificado...</p>
                        <p className="text-xs text-muted-foreground">A IA está extraindo os dados para você</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="mx-auto bg-muted rounded-full p-3 w-12 h-12 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            Toque para usar o <span className="text-purple-600 font-bold">Preenchimento Mágico</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Solte o certificado aqui para preencher automaticamente
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
