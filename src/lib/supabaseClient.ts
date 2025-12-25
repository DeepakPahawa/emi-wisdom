"use client"

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// Support multiple naming conventions for the API key
// Newest Supabase (2024+): NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
// Older naming: NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    process.env.SUPABASE_KEY

if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL. Please check your .env.local file.')
}

if (!supabaseKey) {
    throw new Error(
        'Missing Supabase API key. Please add one of these to your .env.local file:\n' +
        '- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (newest, recommended)\n' +
        '- NEXT_PUBLIC_SUPABASE_ANON_KEY (older naming)\n' +
        '- SUPABASE_ANON_KEY'
    )
}

// Use createBrowserClient from @supabase/ssr for proper cookie-based auth
// This ensures the session is stored in cookies, not localStorage
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)


