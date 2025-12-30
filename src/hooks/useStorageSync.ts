/**
 * React hook for automatic storage synchronization
 * Listens to auth state changes and syncs data between IndexedDB and Supabase
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { storageService } from '@/services/StorageService';
import { StorageBackend, SyncResult } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useStorageSync() {
    const [backend, setBackend] = useState<StorageBackend>('indexeddb');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        // Initialize storage service
        storageService.init().then(() => {
            storageService.getBackend().then(setBackend);
        });

        // Listen to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    // User signed in - sync IndexedDB to Supabase
                    await handleSync();
                    setBackend('supabase');
                } else if (event === 'SIGNED_OUT') {
                    // User signed out - switch to IndexedDB
                    setBackend('indexeddb');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSync = async (): Promise<SyncResult> => {
        setIsSyncing(true);

        try {
            toast({
                title: 'Syncing data...',
                description: 'Transferring your local data to the cloud.',
            });

            const result = await storageService.syncToSupabase();

            if (result.success) {
                setLastSyncedAt(new Date().toISOString());

                toast({
                    title: 'Sync successful!',
                    description: `${result.recordsSynced} record(s) synced to your account.`,
                });

                // Optionally clear local storage after successful sync
                // await storageService.clearLocalStorage();
            } else {
                toast({
                    title: 'Sync completed with errors',
                    description: result.errors.join(', '),
                    variant: 'destructive',
                });
            }

            return result;
        } catch (error: any) {
            toast({
                title: 'Sync failed',
                description: error.message || 'Failed to sync data',
                variant: 'destructive',
            });

            return {
                success: false,
                recordsSynced: 0,
                errors: [error.message],
            };
        } finally {
            setIsSyncing(false);
        }
    };

    return {
        backend,
        isSyncing,
        lastSyncedAt,
        syncNow: handleSync,
    };
}
