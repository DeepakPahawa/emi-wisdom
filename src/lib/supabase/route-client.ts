import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client for use in API routes
 * This version accepts request and response objects to properly handle cookies
 */
export function createClient(request: NextRequest, response?: NextResponse) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

    // Support multiple naming conventions for the API key (same as client-side)
    const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_KEY ||
        process.env.SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase URL or API key in environment variables')
    }

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Update request cookies
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    // Update response cookies if response is provided
                    if (response) {
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    }
                },
                remove(name: string, options: CookieOptions) {
                    // Update request cookies
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    // Update response cookies if response is provided
                    if (response) {
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    }
                },
            },
        }
    )
}
