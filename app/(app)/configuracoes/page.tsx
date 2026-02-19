'use client';

import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, User, Moon, Sun, Monitor, Loader2, Camera } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function ConfiguracoesPage() {
    const { firebaseUser } = useAuth();
    const { user: dbUser, loading: userLoading, refetch } = useUser();
    const { theme, setTheme } = useTheme();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [pageUser, setPageUser] = useState<any>(null);

    // Sync with dbUser when loaded
    useEffect(() => {
        if (dbUser) {
            setPageUser(dbUser);
            setName(dbUser.name || '');
            setPhotoPreview(dbUser.photoUrl || null);
        }
    }, [dbUser]);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !firebaseUser) return;

        // Preview immediate
        const objectUrl = URL.createObjectURL(file);
        setPhotoPreview(objectUrl);

        try {
            setLoading(true);
            const token = await firebaseUser.getIdToken();

            // 1. Get Presigned URL
            const presignRes = await fetch('/api/upload/presigned', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    folder: 'profile-photos',
                }),
            });

            if (!presignRes.ok) throw new Error('Erro ao preparar upload');
            const { uploadUrl, publicUrl } = await presignRes.json();

            // 2. Upload to R2
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            if (!uploadRes.ok) throw new Error('Erro ao enviar foto');

            // 3. Update User Profile with new Photo URL
            await updateUserProfile({ photoUrl: publicUrl });

        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar foto de perfil');
            // Revert preview on error
            setPhotoPreview(pageUser?.photoUrl || null);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            toast.error('O nome não pode estar vazio');
            return;
        }
        setLoading(true);
        try {
            await updateUserProfile({ name });
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfile = async (data: any) => {
        if (!firebaseUser) return;
        const token = await firebaseUser.getIdToken();

        const res = await fetch('/api/me', {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error('Falha ao atualizar perfil');
        const updated = await res.json();

        // Update local state to reflect changes
        if (updated.user) {
            setPageUser(updated.user);
            // Sync global state immediately
            await refetch();
        }
    };

    if (userLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">
                    Gerencie os detalhes do seu perfil e preferências de aparência.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_250px] lg:grid-cols-[1fr_300px]">
                <div className="space-y-6">
                    {/* Perfil Público */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil Público</CardTitle>
                            <CardDescription>
                                Atualize suas informações pessoais e foto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Foto Upload */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-2 border-muted cursor-pointer">
                                            <AvatarImage src={photoPreview || undefined} className="object-cover" />
                                            <AvatarFallback className="text-2xl">
                                                {pageUser?.name?.charAt(0).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <label
                                            htmlFor="photo-upload"
                                            className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-sm cursor-pointer hover:bg-primary/90 transition-colors"
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                        </label>
                                        <Input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center max-w-[150px]">
                                        Suporta PNG, JPG e GIF até 10MB
                                    </p>
                                </div>

                                {/* Campos */}
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nome Completo</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            value={pageUser?.email || ''}
                                            disabled
                                            className="bg-muted text-muted-foreground"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Função (Role)</Label>
                                        <div className="flex items-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                {pageUser?.role || 'User'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4 justify-end">
                            <Button onClick={handleSaveProfile} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Aparência */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Aparência</CardTitle>
                            <CardDescription>
                                Personalize como o sistema aparece para você.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <Button
                                    variant="outline"
                                    className={`h-24 flex flex-col gap-2 ${theme === 'light' ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                                    onClick={() => setTheme('light')}
                                >
                                    <Sun className="h-6 w-6" />
                                    <span>Claro</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`h-24 flex flex-col gap-2 ${theme === 'dark' ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                                    onClick={() => setTheme('dark')}
                                >
                                    <Moon className="h-6 w-6" />
                                    <span>Escuro</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`h-24 flex flex-col gap-2 ${theme === 'system' ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                                    onClick={() => setTheme('system')}
                                >
                                    <Monitor className="h-6 w-6" />
                                    <span>Sistema</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar com Info Extra (Opcional) */}

            </div>
        </div>
    );
}
