import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
    try {
        // Test basic connection
        const { data, error } = await supabase
            .from('loan_details')
            .select('count')
            .limit(1)

        if (error) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Supabase query failed',
                    error: error.message,
                    details: error,
                    config: {
                        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                        hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
                        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                    }
                },
                { status: 500 }
            )
        }

        return NextResponse.json({
            status: 'success',
            message: 'Supabase connection is working!',
            data,
            config: {
                url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
                hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            }
        })

    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                message: 'Unexpected error',
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                config: {
                    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                    hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
                    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                }
            },
            { status: 500 }
        )
    }
}
