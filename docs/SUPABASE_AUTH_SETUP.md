# Supabase Gmail Authentication Setup Guide

This guide will help you configure Google OAuth authentication for your EMI Hacks application using Supabase.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- A Google Cloud Console account
- Your `.env.local` file with Supabase credentials

## Step 1: Configure Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if you haven't already:
   - Choose **External** user type
   - Fill in the required app information
   - Add your email to test users
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `EMI Hacks` (or your preferred name)
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL (when deploying)
   - Authorized redirect URIs:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - Replace `<your-project-ref>` with your Supabase project reference ID
7. Click **Create** and save your **Client ID** and **Client Secret**

## Step 2: Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list of providers
5. Enable Google authentication
6. Enter your Google OAuth credentials:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console
7. Click **Save**

## Step 3: Update Your Environment Variables

Make sure your `.env.local` file contains the following Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings under **API**.

## Step 4: Test the Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. You should be redirected to the login page

4. Click **Continue with Google**

5. Sign in with your Google account

6. You should be redirected back to the main application

## Features Implemented

### 1. **Authentication Context** (`src/contexts/AuthContext.tsx`)
   - Manages authentication state globally
   - Provides sign-in and sign-out functions
   - Listens for auth state changes

### 2. **Login Page** (`src/app/login/page.tsx`)
   - Beautiful, premium UI design
   - Google OAuth sign-in button
   - Auto-redirects if already logged in

### 3. **OAuth Callback Handler** (`src/app/auth/callback/route.ts`)
   - Handles the OAuth redirect from Google
   - Exchanges authorization code for session
   - Redirects to home page

### 4. **User Profile Component** (`src/components/UserProfile.tsx`)
   - Displays user avatar and name
   - Dropdown menu with profile options
   - Sign-out functionality

### 5. **Protected Routes** (`src/components/ProtectedRoute.tsx`)
   - Ensures users are authenticated
   - Redirects to login if not authenticated
   - Shows loading state during auth check

### 6. **Avatar Component** (`src/components/ui/avatar.tsx`)
   - Radix UI-based avatar component
   - Displays user profile picture
   - Fallback to initials if no picture

## Usage

### Accessing User Information

You can access the current user anywhere in your application using the `useAuth` hook:

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return (
    <div>
      <p>Welcome, {user.user_metadata?.full_name || user.email}!</p>
    </div>
  )
}
```

### Protecting Additional Pages

To protect other pages, wrap them with the `ProtectedRoute` component:

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  )
}
```

### Sign Out

Users can sign out by clicking their avatar in the header and selecting "Sign out" from the dropdown menu.

## Troubleshooting

### Issue: "Invalid redirect URI"
**Solution**: Make sure the redirect URI in Google Cloud Console matches exactly:
`https://<your-project-ref>.supabase.co/auth/v1/callback`

### Issue: "Access blocked: This app's request is invalid"
**Solution**: Ensure your OAuth consent screen is properly configured and your email is added to test users.

### Issue: User is not redirected after login
**Solution**: Check that the callback route (`/auth/callback/route.ts`) is properly configured and the redirect URL is correct.

### Issue: "Missing Supabase environment variables"
**Solution**: Ensure your `.env.local` file exists and contains the correct Supabase credentials.

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use Row Level Security (RLS)** - Ensure your Supabase tables have proper RLS policies
3. **Validate user data** - Always validate and sanitize user input
4. **Keep dependencies updated** - Regularly update Supabase and other packages

## Next Steps

- Add email/password authentication as an alternative
- Implement user profile editing
- Add role-based access control
- Set up RLS policies for user-specific data
- Add social login with other providers (GitHub, Facebook, etc.)

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
