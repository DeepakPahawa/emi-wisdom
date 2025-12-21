import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * Test endpoint to verify Supabase connection
 * GET /api/test-supabase
 */
export async function GET(request: NextRequest) {
    try {
        // Test the connection by checking if we can reach Supabase
        const { data, error } = await supabase.from('_test_connection').select('*').limit(1)

        // Even if the table doesn't exist, we'll get a specific error that confirms connection
        if (error) {
            // Check if it's a "table not found" error (which means connection is working)
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                return NextResponse.json({
                    success: true,
                    message: 'Supabase connection successful! ✅',
                    note: 'The test table does not exist, but the connection is working.',
                    connectionDetails: {
                        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
                        keyType: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
                            ? 'publishable (new)'
                            : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                                ? 'publishable (new)'
                                : 'anon (old)',
                    },
                }, { status: 200 })
            }

            // Other errors
            return NextResponse.json({
                success: false,
                error: error.message,
                code: error.code,
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Supabase connection successful! ✅',
            data,
        }, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error',
            message: 'Failed to connect to Supabase. Please check your environment variables.',
        }, { status: 500 })
    }
}
