"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { dataMigrationService } from '@/services/DataMigrationService'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signInWithGoogle: () => Promise<{ error: AuthError | null }>
    signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    // Handle data migration after login
    const handlePostLoginMigration = async (userId: string) => {
        try {
            // Check if there's local data to migrate
            const hasLocalData = await dataMigrationService.hasLocalDataToMigrate();

            if (hasLocalData) {
                console.log('Migrating local data to Supabase...');
                const result = await dataMigrationService.migrateLocalDataToSupabase(userId);

                if (result.success) {
                    console.log(`Migration successful: ${result.migratedLoans} loans, ${result.migratedTransactions} transactions`);
                } else {
                    console.error('Migration failed:', result.error);
                }
            }
        } catch (error) {
            console.error('Error during post-login migration:', error);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)

            // Handle post-login migration
            if (event === 'SIGNED_IN' && session?.user) {
                await handlePostLoginMigration(session.user.id);
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })
        return { error }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        return { error }
    }

    const value = {
        user,
        session,
        loading,
        signInWithGoogle,
        signOut,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
