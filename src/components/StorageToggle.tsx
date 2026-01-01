'use client';

import { useState, useEffect } from 'react';
import { Database, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { storageService } from '@/services/StorageService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { StorageBackend } from '@/types';

export function StorageToggle() {
    const [currentBackend, setCurrentBackend] = useState<StorageBackend>('indexeddb');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        refreshBackend();
    }, [user]);

    const refreshBackend = async () => {
        setIsRefreshing(true);
        try {
            const backend = await storageService.getBackend();
            setCurrentBackend(backend);
        } catch (error) {
            console.error('Failed to get storage backend:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const getBackendInfo = () => {
        switch (currentBackend) {
            case 'supabase':
                return {
                    icon: <Cloud className="w-5 h-5" />,
                    label: 'Cloud Storage (Supabase)',
                    description: 'Your data is synced to the cloud and accessible from any device.',
                    color: 'text-blue-600 dark:text-blue-400',
                    bgColor: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/20',
                };
            case 'indexeddb':
                return {
                    icon: <HardDrive className="w-5 h-5" />,
                    label: 'Local Storage (IndexedDB)',
                    description: 'Your data is stored locally in your browser. Sign in to sync to cloud.',
                    color: 'text-amber-600 dark:text-amber-400',
                    bgColor: 'bg-amber-500/10',
                    borderColor: 'border-amber-500/20',
                };
            default:
                return {
                    icon: <Database className="w-5 h-5" />,
                    label: 'Memory Storage',
                    description: 'Data is stored in memory and will be lost on page refresh.',
                    color: 'text-red-600 dark:text-red-400',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/20',
                };
        }
    };

    const info = getBackendInfo();

    return (
        <Card className={`${info.bgColor} border-2 ${info.borderColor}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={info.color}>
                            {info.icon}
                        </div>
                        <CardTitle className="text-base">{info.label}</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshBackend}
                        disabled={isRefreshing}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <CardDescription className="text-xs">
                    {info.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={currentBackend === 'supabase' ? 'default' : 'outline'} className="text-xs">
                        {currentBackend === 'supabase' ? 'Online' : 'Offline'}
                    </Badge>
                    {user ? (
                        <span>Signed in as {user.email}</span>
                    ) : (
                        <span>Not signed in</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
