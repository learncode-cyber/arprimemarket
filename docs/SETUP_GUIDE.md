# AR Prime Market — External Supabase Setup Guide

## 🚀 Step-by-Step Migration Guide

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose region (Singapore recommended for Bangladesh traffic)
3. Save your **Project URL** and **Anon Key** from Settings → API

### Step 2: Run Database Migration
1. Go to Supabase Dashboard → **SQL Editor**
2. Open `docs/EXTERNAL_SUPABASE_MIGRATION.sql`
3. Copy entire content → Paste → **Run**
4. Wait for completion (takes ~30 seconds)

### Step 3: Configure Authentication
1. Go to **Authentication → Providers**
2. Enable **Email** (enable email confirmations)
3. Enable **Google OAuth** (if needed):
   - Create OAuth client at [console.cloud.google.com](https://console.cloud.google.com)
   - Add redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Paste Client ID & Secret in Supabase

### Step 4: Create Storage Buckets
1. Go to **Storage** → Create bucket: `return-images` (public)
2. Create bucket: `product-images` (public)
3. Add policies for each bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Auth users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'return-images');

-- Allow public read
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'return-images');
```

### Step 5: Deploy Edge Functions
1. Install Supabase CLI: `npm i -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_ID`
4. Deploy all functions: `supabase functions deploy`

### Step 6: Set Edge Function Secrets
```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set LOVABLE_API_KEY=your_lovable_api_key  # For AI features
```

### Step 7: Configure Frontend Environment
Create `.env` in project root:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### Step 8: Deploy to Vercel/Netlify
**Vercel:**
1. Connect GitHub repo
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variables from Step 7

**Netlify:**
1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add `_redirects` file: `/* /index.html 200`

### Step 9: Create Admin User
1. Sign up on your deployed app
2. Go to Supabase → SQL Editor → Run:
```sql
-- Find your user ID
SELECT id, email FROM auth.users;

-- Make yourself admin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('YOUR_USER_ID', 'admin');
```

### Step 10: Custom Domain (Optional)
1. In Vercel/Netlify → Add custom domain
2. Update DNS records (A or CNAME)
3. Update Supabase → Authentication → URL Configuration:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/**`

---

## 📋 Required Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Frontend | Supabase project ID |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Service role key (never expose!) |
| `LOVABLE_API_KEY` | Edge Functions | For AI content generation |

---

## ⚠️ Important Notes

- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- The `handle_new_user` trigger auto-creates profiles and assigns 'user' role on signup
- RLS policies are already configured — all tables are protected
- Realtime is enabled for: orders, supplier_orders, warehouse_stock, chat_sessions, chat_messages, product_variants
