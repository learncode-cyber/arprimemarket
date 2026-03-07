# AR Prime Market — Workspace Transfer & Setup Guide

## 🔑 Environment Variables (Copy to every new workspace)

When you transfer workspaces or deploy externally, set these variables:

```env
VITE_SUPABASE_URL=https://vwnxnpgujxtomkxdxuvg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bnhucGd1anh0b21reGR4dXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODMzMDUsImV4cCI6MjA4Nzc1OTMwNX0.xGv7eZudP8Gm9N1tkzSCqJydygTT-t2ZjJh_BCcJ2Lo
VITE_SUPABASE_PROJECT_ID=vwnxnpgujxtomkxdxuvg
```

## 🚀 External Deployment (Vercel / Netlify / Hostinger)

### Vercel
1. Import your GitHub repo at [vercel.com](https://vercel.com)
2. Set **Build Command**: `npm run build`
3. Set **Output Directory**: `dist`
4. Add the 3 environment variables above in **Settings → Environment Variables**
5. Deploy!

### Hostinger (via GitHub Actions)
The `.github/workflows/deploy.yml` handles auto-deployment. Set these GitHub Secrets:
- `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_PORT` — your Hostinger SSH credentials

### Netlify
1. Connect your GitHub repo
2. Build command: `npm run build`, publish directory: `dist`
3. Add the 3 env vars in **Site settings → Environment variables**

## 🗄️ Database Setup (New Supabase Project)

1. Go to your Supabase project's **SQL Editor**
2. Copy and run `docs/EXTERNAL_SUPABASE_MIGRATION.sql`
3. Create a **Storage bucket** named `return-images` (private)
4. Register on your app, then grant admin access:
   ```sql
   -- Find your user ID first
   SELECT id, email FROM auth.users WHERE email = 'biz.arprimemarket@gmail.com';
   -- Then insert admin role
   INSERT INTO public.user_roles (user_id, role) VALUES ('<user-id-from-above>', 'admin');
   ```

## 🔐 Edge Function Secrets

In your Supabase project dashboard → **Settings → Edge Functions → Secrets**, add:
- `SUPABASE_URL` = `https://vwnxnpgujxtomkxdxuvg.supabase.co`
- `SUPABASE_ANON_KEY` = (your anon key)
- `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase Settings → API)
- `RESEND_API_KEY` = (your Resend API key for emails)

## 🔄 Supabase Auth Configuration

In your Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://apm.abdullahraiyan.com`
- **Redirect URLs** (add all):
  - `https://apm.abdullahraiyan.com`
  - `https://apm.abdullahraiyan.com/*`
  - `https://arprimemarket.lovable.app`
  - `https://arprimemarket.lovable.app/*`
  - `http://localhost:8080`
  - `http://localhost:8080/*`

### Google OAuth
1. In Google Cloud Console, add your redirect URI:
   `https://vwnxnpgujxtomkxdxuvg.supabase.co/auth/v1/callback`
2. In Supabase → Auth → Providers → Google, add your Client ID and Secret

## 📋 Workspace Transfer Checklist

When moving to a new Lovable workspace:
1. ✅ Connect GitHub repo
2. ✅ Set 3 `VITE_` environment variables
3. ✅ Verify preview loads correctly
4. ✅ Test login works
5. ✅ No database changes needed (it's all in your external Supabase)

## 🏗️ Edge Functions Deployment

Edge functions in `supabase/functions/` must be deployed to your external Supabase:
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link
supabase login
supabase link --project-ref vwnxnpgujxtomkxdxuvg

# Deploy all functions
supabase functions deploy
```

## 📊 Current Feature Status

| Feature | Status |
|---------|--------|
| Product Catalog + Variants | ✅ Active |
| Order Management | ✅ Active |
| Guest Checkout | ✅ Active |
| User Auth (Email + Google) | ✅ Active |
| Admin Dashboard | ✅ Active |
| Abandoned Cart Recovery | ✅ Active |
| Coupon System | ✅ Active |
| Blog CMS | ✅ Active |
| Help Center | ✅ Active |
| FAQ System | ✅ Active |
| Referral System | ✅ Active |
| Return/Refund Workflow | ✅ Active |
| PWA Support | ✅ Active |
| Multi-currency | ✅ Active |
| Multi-language (EN/BN/AR) | ✅ Active |
| AI Chat Widget | ✅ Active |
| Shipping Zones | ✅ Active |
| Invoice Download | ✅ Active |
