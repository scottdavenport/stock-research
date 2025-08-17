# Simple Supabase Authentication Setup

This is a minimal authentication setup for your Stock Research App using Supabase magic links.

## Quick Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your API keys** from your Supabase dashboard:
   - Go to Settings > API
   - Copy your Project URL and anon key

3. **Create a `.env.local` file** in your project root:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. **Configure your site URL** in Supabase:
   - Go to Authentication > URL Configuration
   - Set Site URL to `http://localhost:3000` (for development)
   - Add `http://localhost:3000/auth/callback` to Additional Redirect URLs

## How it works

- Users visit `/login` and enter their email
- They receive a magic link via email
- Clicking the link authenticates them and redirects to the app
- The navigation shows their email and a sign out button
- Unauthenticated users see a "Sign In" link

## Features

✅ **Magic Link Authentication** - No passwords needed  
✅ **Automatic User Creation** - Users are created on first login  
✅ **Session Management** - Automatic session handling  
✅ **Simple UI** - Clean, minimal interface  
✅ **Protected Routes** - Easy to add protection to any page  

## To protect a page

Wrap any page component with the `ProtectedRoute` component:

```tsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  )
}
```

## Development

```bash
npm run dev
```

Visit `http://localhost:3000` to test the authentication flow.
