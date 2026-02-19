'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Copy, Printer, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuoteRequestData {
    id: string;
    supplier: {
        name: string;
        email: string;
    };
    emailSubject: string;
    emailBody: string;
    emailCc: string;
    createdAt: string;
    ServiceOrder: {
        id: string;
        Equipment: {
            name: string;
            code: string;
        };
    }[];
}

export default function QuoteRequestViewPage() {
    // Get firebaseUser to retrieve token, and loading state from context
    const { user, firebaseUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [data, setData] = useState<QuoteRequestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            // If auth is still loading, do nothing yet
            if (authLoading) return;

            // If auth done but no user, redirect or show error
            if (!user || !firebaseUser) {
                // Optional: redirect to login
                // router.push('/login');
                setLoading(false);
                return;
            }

            try {
                // Get token freshly
                const token = await firebaseUser.getIdToken();

                const res = await fetch(`/api/quote-requests/${params.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    const errorText = await res.text();
                    console.error('Failed to fetch quote request', res.status, errorText);
                    toast.error(`Erro ao carregar solicitação: ${errorText}`);
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, firebaseUser, authLoading, params.id, router]);

    const handleBack = () => {
        setShowCancelDialog(true);
    };

    const confirmCancel = async () => {
        if (!user || !firebaseUser) return;
        setIsCancelling(true);
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch(`/api/quote-requests/${params.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Solicitação cancelada e equipamentos removidos.');
                router.push('/fornecedores'); // Redirect to suppliers list
            } else {
                const errorText = await res.text();
                console.error('Failed to cancel request', res.status, errorText);
                toast.error('Erro ao cancelar solicitação');
                setIsCancelling(false);
                setShowCancelDialog(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao cancelar solicitação');
            setIsCancelling(false);
            setShowCancelDialog(false);
        }
    };

    const handleCopyText = () => {
        if (!data) return;
        navigator.clipboard.writeText(data.emailBody);
        toast.success('Texto copiado para a área de transferência!');
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="p-8">Carregando...</div>;
    }

    if (!data) {
        return <div className="p-8">Solicitação não encontrada.</div>;
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl print:p-0 print:max-w-none">

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Solicitação?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ao voltar, esta solicitação será excluída e os itens removidos da lista de programações.
                            Tem certeza que deseja cancelar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>Não, manter</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmCancel(); }} disabled={isCancelling} className="bg-red-600 hover:bg-red-700 text-white">
                            {isCancelling ? 'Cancelando...' : 'Sim, cancelar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="mb-6 flex items-center justify-between print:hidden">
                <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar / Cancelar
                </Button>
                <div className="space-x-2 flex items-center">
                    <Button variant="outline" onClick={handleCopyText} className="h-10">
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Texto
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="h-10">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir / PDF
                    </Button>
                    <Button onClick={() => router.push('/programacoes')} className="bg-green-700 hover:bg-green-800 text-white h-10">
                        Concluir
                    </Button>
                </div>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="print:pb-2">
                    <CardTitle>Solicitação de Orçamento</CardTitle>
                    <div className="text-sm text-muted-foreground">
                        Criado em: {new Date(data.createdAt).toLocaleString('pt-BR')}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-medium">Fornecedor</h3>
                            <p>{data.supplier.name}</p>
                            <p className="text-muted-foreground">{data.supplier.email}</p>
                        </div>
                        <div>
                            <h3 className="font-medium">Assunto do Email</h3>
                            <p>{data.emailSubject}</p>
                            {data.emailCc && (
                                <p className="text-sm text-muted-foreground">CC: {data.emailCc}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">Corpo do Email</h3>
                        <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm border font-mono print:bg-white print:border-none print:p-0">
                            {data.emailBody}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">Equipamentos Solicitados ({data.ServiceOrder.length})</h3>
                        <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3">Código</th>
                                        <th className="px-4 py-3">Nome</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data.ServiceOrder.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-4 py-3">{order.Equipment.code}</td>
                                            <td className="px-4 py-3">{order.Equipment.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
