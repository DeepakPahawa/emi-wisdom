# Quick Start: Gmail Authentication

## What Was Added

Your EMI Hacks application now has Gmail authentication using Supabase! The app is **publicly accessible** - users can use the calculator without logging in, but **authentication is required to save loan details**.

### 🔐 New Components

1. **Login Dialog** (Appears when saving)
   - Beautiful, premium UI with Google sign-in button
   - Shows when unauthenticated users click "Save"
   - Seamless authentication flow

2. **Login Page** (`/login`)
   - Dedicated login page for direct access
   - Auto-redirects if already logged in

3. **User Profile** (Header)
   - Shows user avatar and name
   - Dropdown menu with sign-out option
   - Displays user initials if no avatar

4. **Public Access**
   - Main page accessible without login
   - Full calculator functionality available
   - Authentication only required for saving data

### 📁 Files Created

```
src/
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── components/
│   ├── UserProfile.tsx          # User avatar & dropdown
│   ├── ProtectedRoute.tsx       # Route protection wrapper
│   └── ui/
│       └── avatar.tsx           # Avatar UI component
└── app/
    ├── login/
    │   └── page.tsx             # Login page
    └── auth/
        └── callback/
            └── route.ts         # OAuth callback handler
```

## 🚀 Setup Steps

### 1. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth credentials
3. Add redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
4. Save Client ID and Client Secret

### 2. Configure Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Enter your Client ID and Client Secret
5. Click **Save**

### 3. Test It Out

```bash
npm run dev
```

Visit `http://localhost:3000` - you'll be redirected to login!

## 🎨 Features

- ✅ Google OAuth sign-in
- ✅ Protected routes
- ✅ User profile display
- ✅ Session persistence
- ✅ Auto token refresh
- ✅ Sign-out functionality
- ✅ Premium UI design
- ✅ Dark mode support

## 📖 Usage Examples

### Access User Info

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, loading } = useAuth()
  
  return <div>Hello, {user?.email}!</div>
}
```

### Protect a Page

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  )
}
```

### Sign Out

```tsx
import { useAuth } from '@/contexts/AuthContext'

function SignOutButton() {
  const { signOut } = useAuth()
  
  return (
    <button onClick={() => signOut()}>
      Sign Out
    </button>
  )
}
```

## 🔍 User Object Properties

```typescript
user.id                          // Unique user ID
user.email                       // User's email
user.user_metadata.full_name     // Full name from Google
user.user_metadata.avatar_url    // Profile picture URL
```

## 🛠️ Troubleshooting

### "Missing Supabase environment variables"
- Check your `.env.local` file exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### "Invalid redirect URI"
- Ensure redirect URI in Google Console matches Supabase exactly
- Format: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

### User not redirected after login
- Clear browser cache and cookies
- Check browser console for errors
- Verify callback route is working

## 📚 Full Documentation

See `docs/SUPABASE_AUTH_SETUP.md` for complete setup instructions and advanced configuration.

## 🎯 Next Steps

- [ ] Configure Google OAuth credentials
- [ ] Enable Google provider in Supabase
- [ ] Test sign-in flow
- [ ] Add user-specific data with RLS policies
- [ ] Customize user profile page
- [ ] Add additional auth providers (GitHub, etc.)

---

**Need Help?** Check the full setup guide in `docs/SUPABASE_AUTH_SETUP.md`
