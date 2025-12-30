'use client';

import { Database, Cloud, HardDrive } from 'lucide-react';
import { useLoanDetailsStore } from '@/store/loan-details-store';
import { Badge } from '@/components/ui/badge';

export function StorageIndicator() {
    const { storageBackend, isSyncing } = useLoanDetailsStore();

    const getIcon = () => {
        switch (storageBackend) {
            case 'supabase':
                return <Cloud className="w-3 h-3" />;
            case 'indexeddb':
                return <HardDrive className="w-3 h-3" />;
            default:
                return <Database className="w-3 h-3" />;
        }
    };

    const getLabel = () => {
        if (isSyncing) return 'Syncing...';

        switch (storageBackend) {
            case 'supabase':
                return 'Cloud';
            case 'indexeddb':
                return 'Local';
            default:
                return 'Memory';
        }
    };

    const getVariant = () => {
        if (isSyncing) return 'secondary';

        switch (storageBackend) {
            case 'supabase':
                return 'default';
            case 'indexeddb':
                return 'outline';
            default:
                return 'destructive';
        }
    };

    return (
        <Badge variant={getVariant() as any} className="gap-1.5">
            {getIcon()}
            <span className="text-xs">{getLabel()}</span>
        </Badge>
    );
}
