import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
        console.error('OAuth error:', error, errorDescription)
        return NextResponse.redirect(
            new URL(`/?error=${error}&error_description=${errorDescription}`, requestUrl.origin)
        )
    }

    if (code) {
        try {
            const cookieStore = await cookies()

            // Create a response object to set cookies
            const response = NextResponse.redirect(new URL('/', requestUrl.origin))

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseKey =
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                process.env.SUPABASE_ANON_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_KEY ||
                process.env.SUPABASE_KEY

            const supabase = createServerClient(
                supabaseUrl,
                supabaseKey!,
                {
                    cookies: {
                        get(name: string) {
                            return cookieStore.get(name)?.value
                        },
                        set(name: string, value: string, options: CookieOptions) {
                            cookieStore.set({ name, value, ...options })
                            response.cookies.set({ name, value, ...options })
                        },
                        remove(name: string, options: CookieOptions) {
                            cookieStore.set({ name, value: '', ...options })
                            response.cookies.set({ name, value: '', ...options })
                        },
                    },
                }
            )

            // Exchange the code for a session
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
                console.error('Error exchanging code for session:', exchangeError)
                return NextResponse.redirect(
                    new URL(`/?error=auth_error&error_description=${exchangeError.message}`, requestUrl.origin)
                )
            }

            // Return the response with cookies set
            return response
        } catch (err) {
            console.error('Unexpected error in auth callback:', err)
            return NextResponse.redirect(
                new URL('/?error=auth_error&error_description=Authentication failed', requestUrl.origin)
            )
        }
    }

    // Redirect to home page if no code
    return NextResponse.redirect(new URL('/', requestUrl.origin))
}
