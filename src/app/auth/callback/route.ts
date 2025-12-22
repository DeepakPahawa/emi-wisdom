import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey =
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        await supabase.auth.exchangeCodeForSession(code)
    }

    // Redirect to home page after successful authentication
    return NextResponse.redirect(new URL('/', requestUrl.origin))
}
