import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// Support both old (service_role) and new (secret) naming conventions
const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase server environment variables. Please check your .env.local file.')
}

// Server-side client with service role key
// Use this ONLY in API routes or server components
// This bypasses Row Level Security (RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})
