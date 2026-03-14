# 🚀 AR Prime Market — Full E-Commerce Platform Blueprint
## Copy-Paste This Entire Prompt to Any AI Coder (Claude, GPT, Lovable, Bolt, etc.)

---

## 📋 PROJECT OVERVIEW

Build a **production-grade, multilingual, multi-currency e-commerce platform** called "AR Prime Market" with the following tech stack:

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, Database, Edge Functions, Storage)
- **State:** React Context API (Auth, Cart, Currency, Language, Tracking) + TanStack Query v5
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router v6 (nested routes)
- **SEO:** react-helmet-async + JSON-LD structured data
- **Phone Input:** react-phone-input-2 + libphonenumber-js

---

## 🏗️ ARCHITECTURE

### Directory Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (button, card, dialog, sheet, tabs, etc.)
│   ├── admin/                 # Admin dashboard components (28+ sections)
│   ├── checkout/              # Checkout-specific components
│   ├── editor/                # Rich text editor
│   ├── Navbar.tsx             # Main navigation with mega menu
│   ├── Footer.tsx             # Multi-column footer
│   ├── Layout.tsx             # Public layout wrapper
│   ├── ProductCard.tsx        # Product display card
│   ├── CartDrawer.tsx         # Slide-out cart
│   ├── ChatWidget.tsx         # Live chat widget
│   ├── HeroBanner.tsx         # Homepage hero carousel
│   ├── CurrencySelector.tsx   # Currency switcher (30+ currencies)
│   ├── LanguageSelector.tsx   # Language switcher (35+ languages)
│   ├── FloatingWhatsApp.tsx   # WhatsApp floating button
│   ├── FloatingActionMenu.tsx # Mobile floating action menu
│   ├── CookieConsent.tsx      # GDPR cookie banner
│   ├── PWAInstallPrompt.tsx   # PWA install prompt
│   ├── SEOHead.tsx            # Dynamic SEO meta tags
│   ├── ProductReviews.tsx     # Product review system
│   ├── RelatedProducts.tsx    # Related products section
│   ├── RecentlyViewed.tsx     # Recently viewed products
│   ├── WishlistButton.tsx     # Wishlist toggle
│   ├── StockAlertButton.tsx   # Stock notification
│   ├── VariantSelector.tsx    # Size/Color variant picker
│   ├── FlashSaleTimer.tsx     # Countdown timer for sales
│   ├── TrustBadges.tsx        # Trust/security badges
│   ├── InvoiceDownload.tsx    # PDF invoice generator
│   ├── AdvancedSearch.tsx     # Full-text search with filters
│   ├── ProductComparison.tsx  # Compare products side-by-side
│   ├── CustomerReviews.tsx    # Homepage testimonials
│   ├── PromotionsBanner.tsx   # Promotional banners
│   └── QuickOrderModal.tsx    # 1-click order form
├── context/
│   ├── AuthContext.tsx        # Authentication + RBAC
│   ├── CartContext.tsx        # Shopping cart state
│   ├── CurrencyContext.tsx    # Multi-currency conversion
│   ├── LanguageContext.tsx    # i18n translations
│   └── TrackingContext.tsx    # Analytics tracking
├── hooks/
│   ├── useProductData.ts      # Product CRUD hooks
│   ├── usePaymentMethods.ts   # Payment method hooks
│   ├── useShipping.ts         # Shipping calculation
│   ├── useWishlist.ts         # Wishlist management
│   ├── useRecentlyViewed.ts   # Recently viewed tracking
│   ├── useProductVariants.ts  # Variant management
│   ├── useSiteContent.ts      # CMS content hooks
│   ├── useSupplier.ts         # Supplier management
│   └── useTheme.ts            # Dark/Light theme
├── pages/
│   ├── Index.tsx              # Homepage
│   ├── Products.tsx           # Product listing with filters
│   ├── ProductDetail.tsx      # Single product page
│   ├── Cart.tsx               # Cart page
│   ├── Checkout.tsx           # Multi-step checkout
│   ├── Login.tsx              # Login page
│   ├── Register.tsx           # Registration page
│   ├── Dashboard.tsx          # User dashboard
│   ├── Admin.tsx              # Admin routes config
│   ├── TrackOrder.tsx         # Order tracking (public)
│   ├── Blog.tsx               # Blog listing
│   ├── BlogPost.tsx           # Single blog post
│   ├── HelpCenter.tsx         # Help center
│   ├── FAQ.tsx                # FAQ page
│   ├── Contact.tsx            # Contact form
│   ├── About.tsx              # About page
│   ├── Tickets.tsx            # Support tickets
│   ├── AffiliateDashboard.tsx # Affiliate program
│   └── [Legal pages...]       # Privacy, Terms, Refund, Cookie
├── lib/
│   ├── api.ts                 # API gateway client
│   ├── services.ts            # Backend service wrappers
│   ├── storageImage.ts        # Image URL resolver
│   ├── seoSchemas.ts          # JSON-LD generators
│   ├── seoScoring.ts          # SEO score calculator
│   ├── validation.ts          # Form validation utils
│   ├── phoneUtils.ts          # Phone number utilities
│   └── dummyData.ts           # Fallback/seed data
└── integrations/
    └── supabase/
        ├── client.ts          # Supabase client init
        └── types.ts           # Auto-generated DB types
```

---

## 🗄️ DATABASE SCHEMA (Supabase/PostgreSQL)

### Core Tables

#### 1. `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compare_at_price NUMERIC,
  cost_price NUMERIC,
  supplier_price NUMERIC,
  supplier_url TEXT,
  currency TEXT NOT NULL DEFAULT 'BDT',
  category_id UUID REFERENCES categories(id),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  sku TEXT,
  barcode TEXT,
  brand TEXT,
  weight NUMERIC,
  height_cm NUMERIC,
  width_cm NUMERIC,
  length_cm NUMERIC,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Anyone can read active products, Admins can manage all
```

#### 2. `categories`
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Supports nested/hierarchical categories
```

#### 3. `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,  -- Format: ARP-YYYYMMDD-XXXXXX (auto-generated via trigger)
  user_id UUID,  -- NULL for guest orders
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, confirmed, processing, shipped, delivered, cancelled
  payment_status TEXT NOT NULL DEFAULT 'unpaid',  -- unpaid, awaiting_payment, paid, refunded
  payment_method TEXT,
  payment_reference TEXT,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_email TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_country TEXT DEFAULT 'BD',
  shipping_postal_code TEXT,
  shipping_method TEXT,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  coupon_id UUID REFERENCES coupons(id),
  tracking_number TEXT,
  tracking_token TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  notes TEXT,
  is_dropship BOOLEAN DEFAULT false,
  auto_forwarded BOOLEAN DEFAULT false,
  forwarded_at TIMESTAMPTZ,
  supplier_order_id TEXT,
  processing_errors JSONB DEFAULT '[]',
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Supports both authenticated and guest (anon) orders
```

#### 4. `order_items`
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total NUMERIC NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 5. `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,  -- matches auth.users.id
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Auto-created via trigger on auth.users insert
```

#### 6. `user_roles` (RBAC)
```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Security definer function (prevents RLS recursion)
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  )
$$;
```

#### 7. `addresses`
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Bangladesh',
  postal_code TEXT,
  label TEXT NOT NULL DEFAULT 'Home',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 8. `product_variants`
```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_label TEXT NOT NULL DEFAULT '',
  size TEXT,
  color TEXT,
  sku TEXT,
  price_delta NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 9. `coupons`
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',  -- percentage, fixed
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 10. `payment_methods`
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_key TEXT NOT NULL UNIQUE,  -- bkash, nagad, rocket, binance, bank_transfer, cod
  method_type TEXT NOT NULL,        -- mobile_banking, crypto, bank, cod
  display_name TEXT NOT NULL,
  display_name_bn TEXT,
  display_name_ar TEXT,
  icon_name TEXT,
  instructions TEXT,
  instructions_bn TEXT,
  instructions_ar TEXT,
  wallet_address TEXT,
  network TEXT,                     -- e.g., BEP20, TRC20
  deposit_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Also create a VIEW "payment_methods_public" that hides wallet_address for public access
```

#### 11. `payment_transactions`
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  payment_method_key TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, confirmed, rejected
  transaction_reference TEXT,
  admin_notes TEXT,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Content & CMS Tables

#### 12. `blog_posts` + `blog_categories` + `blog_comments`
```sql
-- Blog with categories, SEO fields, scheduling, comments with moderation
-- Fields: title, slug, content (rich HTML), excerpt, image_url, author_name,
--         category_id, is_published, published_at, scheduled_at,
--         meta_title, meta_description, read_time
```

#### 13. `help_categories` + `help_articles`
```sql
-- Help center with categorized articles
-- Categories have icon, description, sort_order
-- Articles have rich content, slug, is_published
```

#### 14. `faq_categories` + `faq_items`
```sql
-- FAQ system with categorized Q&A
-- Items have question, answer, sort_order, is_active
```

### Marketing & Sales Tables

#### 15. `promotions`
```sql
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL DEFAULT 'sale',  -- sale, bogo, bundle, flash_sale
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  product_ids TEXT[],
  category_ids TEXT[],
  banner_url TEXT,
  conditions JSONB,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 16. `campaigns`
```sql
-- Marketing campaigns linked to promotions/coupons
-- Fields: name, campaign_type, status, budget, spent, metrics (JSONB),
--         related_promotion_id, related_coupon_id, starts_at, ends_at
```

#### 17. `affiliates` + `affiliate_commissions`
```sql
-- Full affiliate program
-- affiliates: user_id, affiliate_code, commission_rate, commission_type,
--             total_clicks, total_orders, total_sales, total_earnings,
--             pending_earnings, paid_earnings, payout_method, payout_details
-- affiliate_commissions: affiliate_id, order_id, order_total,
--                        commission_rate, commission_amount, status, paid_at
```

#### 18. `referral_codes` + `referrals`
```sql
-- Referral program with reward tracking
-- referral_codes: user_id, code, reward_type, reward_value, referrer_reward_value
-- referrals: referrer_id, referred_id, referral_code_id, order_id, status
```

#### 19. `abandoned_carts` + `cart_reminder_logs`
```sql
-- Abandoned cart recovery system
-- abandoned_carts: user_id, session_id, email, cart_items (JSONB),
--                  subtotal, currency, recovery_token, is_recovered
-- cart_reminder_logs: abandoned_cart_id, email_to, reminder_tier, status
```

### Support Tables

#### 20. `chat_sessions` + `chat_messages`
```sql
-- Live chat system with realtime
-- chat_sessions: user_id, visitor_name, visitor_email, status
-- chat_messages: session_id, sender_type (user/admin/bot), content, is_read
-- Enable realtime: ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

### AI & Analytics Tables

#### 21. AI Tables
```sql
-- ai_scan_results: Store scan findings with auto-fix queries
-- ai_activity_log: Track AI actions
-- ai_learning_log: AI learns from corrections
-- ai_marketing_strategies: AI-powered marketing tactics
-- ai_knowledge_updates: Track knowledge base syncs
-- ai_engine_logs: Track AI model usage, tokens, latency
```

#### 22. API Management
```sql
-- api_keys: API key management with rate limits, permissions
-- api_call_logs: Request logging with status codes, token usage
```

### Other Tables
```sql
-- order_alerts: Order-related alerts for admin
-- email_logs: Email delivery tracking
-- return_requests: Product return/refund management
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Auth Flow
1. **Email/Password signup** with email verification (NO auto-confirm)
2. **Login** with `supabase.auth.signInWithPassword()`
3. **Password reset** via `supabase.auth.resetPasswordForEmail()`
4. **Session management** with proactive token refresh every 10 minutes
5. **RBAC** using `user_roles` table + `has_role()` security definer function

### AuthContext Features
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;  // Checked via user_roles table
  signUp: (email, password, fullName) => Promise<{ error: string | null }>;
  signIn: (email, password) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}
```

### Profile Auto-Creation
```sql
-- Trigger: Automatically create profile when user signs up
CREATE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 🛒 CART SYSTEM

### CartContext Features
```typescript
interface CartContextType {
  items: CartItem[];
  addItem: (product, quantity, variant?) => void;
  removeItem: (id) => void;
  updateQuantity: (id, quantity) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  // Cart persists in localStorage
}
```

### Cart Features
- Add to cart with variant support (size/color)
- Quantity adjustment with stock validation
- Cart drawer (slide-out sheet)
- Cart upsell recommendations
- Abandoned cart tracking (saves to DB for logged-in users)
- Cart recovery emails (via Edge Function)

---

## 💳 CHECKOUT SYSTEM

### Multi-Step Checkout Flow
1. **Shipping Info** — Name, phone (international with country code), email, address, city, country
2. **Shipping Method** — Dynamic based on country:
   - Bangladesh: Inside Dhaka (৳80) / Outside Dhaka (৳150)
   - International: Calculated by region
3. **Payment Method** — Dynamic from `payment_methods` table:
   - Bangladesh: bKash, Nagad, Rocket (mobile banking)
   - International: Binance (USDT), Bank Transfer
   - Universal: Cash on Delivery
4. **Order Review** — Summary with coupon application
5. **Order Confirmation** — Order number, tracking token

### Checkout Logic
- Guest checkout supported (no auth required)
- Phone validation with `libphonenumber-js`
- Country auto-detection via IP
- Shipping method resets on country change
- COD orders → status: 'pending', payment: 'unpaid'
- Digital payment orders → status: 'pending', payment: 'awaiting_payment'
- Order number auto-generated: `ARP-YYYYMMDD-XXXXXX`

---

## 🌍 INTERNATIONALIZATION

### Language System (35+ languages)
```typescript
// LanguageContext provides:
- currentLanguage: string (ISO code)
- setLanguage: (lang) => void
- t: (key) => string  // Translation function
- isRTL: boolean  // Right-to-left support

// Languages include: en, bn, ar, hi, ur, es, fr, de, ja, ko, zh, pt, ru, etc.
// RTL languages: ar, he, fa, ur
```

### Currency System (30+ currencies)
```typescript
// CurrencyContext provides:
- currency: string (ISO code)
- setCurrency: (code) => void
- convertPrice: (amount) => number
- formatPrice: (amount) => string

// Exchange rates fetched via Edge Function from external API
// Supported: BDT, USD, EUR, GBP, SAR, AED, MYR, SGD, INR, PKR, etc.
```

---

## 👨‍💼 ADMIN DASHBOARD (28+ Sections)

### Admin Route: `/ar/*` (with AdminLayout sidebar)

#### Navigation Sections:
1. **Dashboard** (`/ar`) — KPI cards, charts, recent orders, revenue stats
2. **Orders** (`/ar/orders`) — Order list, status management, detail modal with timeline
3. **Products** (`/ar/products`) — CRUD with image upload, SEO preview, variants
4. **Categories** (`/ar/categories`) — Category management with image upload
5. **Customers** (`/ar/customers`) — Customer list with order history
6. **Inventory** (`/ar/inventory`) — Stock levels, low stock alerts
7. **Coupons** (`/ar/coupons`) — Coupon CRUD with usage tracking
8. **Promotions** (`/ar/promotions`) — Promotion management
9. **Campaigns** (`/ar/campaigns`) — Marketing campaign management
10. **Blog** (`/ar/blog`) — Blog post editor with rich text, SEO, scheduling
11. **FAQ** (`/ar/faq`) — FAQ management
12. **Help Center** (`/ar/help`) — Help article management
13. **Chat** (`/ar/chat`) — Live chat management (realtime)
14. **Tickets** (`/ar/tickets`) — Support ticket management
15. **Returns** (`/ar/returns`) — Return request management
16. **Shipping** (`/ar/shipping`) — Shipping method configuration
17. **Payments** (`/ar/payments`) — Payment method & transaction management
18. **Tracking** (`/ar/tracking`) — Order tracking management
19. **SEO** (`/ar/seo`) — SEO management with score widget
20. **Site Content** (`/ar/content`) — CMS for static pages
21. **Suppliers** (`/ar/suppliers`) — Supplier management (dropshipping)
22. **Affiliates** (`/ar/affiliates`) — Affiliate program management
23. **Referrals** (`/ar/referrals`) — Referral program management
24. **API Keys** (`/ar/api-keys`) — API key management
25. **API Health** (`/ar/api-health`) — API monitoring dashboard
26. **Webhooks** (`/ar/webhooks`) — Webhook configuration
27. **AI Assistant** (`/ar/ai`) — AI dashboard with scan results
28. **Account & Security** (`/ar/account`) — Team management, password change
29. **Backup** (`/ar/backup`) — Data export/backup

### Admin Layout
- Left sidebar with collapsible navigation
- Top bar with admin info
- Responsive (hamburger menu on mobile)
- Admin access controlled via `isAdmin` from AuthContext

---

## ⚡ EDGE FUNCTIONS (Serverless)

### 23 Edge Functions:

1. **api-gateway** — Central API router with caching, rate limiting, auth middleware
2. **order-processor** — Order processing, stock deduction, email triggers
3. **send-email** — Email sending via Resend (order confirmation, shipping updates, delivery)
4. **cart-recovery** — Abandoned cart recovery emails (3-tier system)
5. **exchange-rates** — Currency exchange rate fetching
6. **security** — Rate limiting, fraud detection, session validation
7. **security-guard** — Advanced security monitoring
8. **backup** — Data export functionality
9. **ai-assistant** — AI-powered store assistant
10. **ai-bridge** — AI model routing (Lovable AI integration)
11. **ai-content** — AI content generation
12. **admin-tools** — Admin utility functions
13. **binance-pay** — Binance cryptocurrency payment
14. **image-enhance** — AI image enhancement
15. **image-optimize** — Image optimization
16. **supplier-sync** — Supplier inventory sync (dropshipping)
17. **affiliate-cleanup** — Affiliate data maintenance
18. **translate-content** — AI-powered content translation
19. **sitemap** — Dynamic sitemap generation
20. **webhook-dispatcher** — Outgoing webhook delivery
21. **webhook-receiver** — Incoming webhook processing
22. **widget-chat** — Embeddable chat widget backend
23. **widget-scraper** — Product data scraping for widgets

---

## 🎨 UI/UX DESIGN SYSTEM

### Theme
- Dark/Light mode toggle
- CSS custom properties for all colors (HSL format)
- Semantic tokens: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`
- Card shadows, rounded corners (radius tokens)

### Key UI Components
- **Navbar:** Logo, search, cart badge, user menu, language/currency selectors
- **Product Cards:** Image, title, price (with compare price), rating stars, add to cart
- **Hero Banner:** Animated carousel with CTA buttons
- **Trust Badges:** Security/guarantee icons
- **Flash Sale Timer:** Countdown component
- **Floating Actions:** WhatsApp button, chat widget, scroll-to-top

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640-1024px
- Desktop: > 1024px
- Admin sidebar collapses on mobile

---

## 🔍 SEO IMPLEMENTATION

### On-Page SEO
- Dynamic `<title>` and `<meta description>` via react-helmet-async
- Single `<h1>` per page
- Semantic HTML (`<main>`, `<section>`, `<article>`, `<nav>`)
- Alt text on all images
- Lazy loading images

### Structured Data (JSON-LD)
```typescript
// Product pages: Product schema with offers, reviews, availability
// Blog posts: Article schema with author, date
// Organization: Organization schema with logo, contact
// Breadcrumbs: BreadcrumbList schema
// FAQ: FAQPage schema
```

### Technical SEO
- Dynamic sitemap via Edge Function
- robots.txt
- Canonical tags
- Open Graph + Twitter Card meta tags

---

## 📦 ORDER TRACKING (Public)

### Track Order Page (`/track-order`)
- Input: Order number + tracking token (from confirmation email)
- No authentication required
- Shows: Order status timeline, items, shipping info
- Visual status steps: Pending → Confirmed → Processing → Shipped → Delivered

---

## 🔄 REALTIME FEATURES

### Enabled Tables
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
-- Chat messages update in real-time for admin and users
```

---

## 📱 PWA SUPPORT

- Install prompt component
- Responsive design for all devices
- Offline-capable (basic)

---

## 🛡️ SECURITY

### RLS Policies Pattern
Every table has RLS enabled with these common patterns:
1. **Public read:** `USING (true)` or `USING (is_active = true)`
2. **Owner access:** `USING (user_id = auth.uid())`
3. **Admin access:** `USING (has_role(auth.uid(), 'admin'))`
4. **Anon deny:** `USING (false)` for SELECT on sensitive tables
5. **Guest inserts:** `WITH CHECK (user_id IS NULL)` for guest orders

### Helper Functions
```sql
-- Check if order is guest (for anon RLS)
CREATE FUNCTION is_guest_order(order_uuid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM orders WHERE id = order_uuid AND user_id IS NULL)
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 🗃️ STORAGE BUCKETS

1. **product-images** — Product photos
2. **category-images** — Category photos
3. **blog-images** — Blog post images
4. **site-assets** — General site assets (logo, banners)

### Image URL Resolution
```typescript
// Resolve storage URLs: If URL starts with storage path, convert to full Supabase URL
// Fallback to placeholder if URL is invalid
function resolveStorageImageUrl(url: string | null, fallback: string): string
```

---

## 📊 DATABASE TRIGGERS & FUNCTIONS

### Auto-Generated Order Numbers
```sql
CREATE FUNCTION generate_order_number() RETURNS TRIGGER AS $$
DECLARE
  date_part TEXT;
  random_part TEXT;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  random_part := upper(substr(md5(random()::text), 1, 6));
  NEW.order_number := 'ARP-' || date_part || '-' || random_part;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Updated_at Trigger
```sql
CREATE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Apply to: products, orders, profiles, payment_methods, etc.
```

---

## 🚀 DEPLOYMENT NOTES

- Frontend: Deploy via Lovable publish or Vercel (connect GitHub repo)
- Backend: Supabase Edge Functions auto-deploy
- Environment Variables:
  - `VITE_SUPABASE_URL` — Supabase project URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
  - Edge Function secrets: `RESEND_API_KEY`, `EXCHANGE_RATE_API_KEY`

---

## 📝 IMPLEMENTATION PRIORITY

### Phase 1: Core (Week 1-2)
1. Set up Supabase project with all tables + RLS
2. Auth system (signup, login, RBAC)
3. Product listing + detail pages
4. Cart system
5. Basic checkout (COD)

### Phase 2: Payments & Orders (Week 2-3)
6. Payment methods (mobile banking, crypto)
7. Order management admin
8. Order tracking
9. Email notifications

### Phase 3: Content & Marketing (Week 3-4)
10. Blog system
11. Coupon system
12. Promotions
13. SEO implementation

### Phase 4: Advanced (Week 4-6)
14. Affiliate program
15. Chat system (realtime)
16. AI features
17. Multi-language + multi-currency
18. Help center + FAQ
19. Abandoned cart recovery

### Phase 5: Polish (Week 6-8)
20. PWA
21. Performance optimization
22. Admin dashboard analytics
23. Supplier management
24. API gateway

---

## ⚠️ CRITICAL RULES

1. **NEVER store roles on profiles table** — Always use separate `user_roles` table
2. **NEVER use anonymous signups** — Always email/password with verification
3. **NEVER skip RLS policies** — Every table must have appropriate policies
4. **NEVER hardcode admin checks** — Always use `has_role()` DB function
5. **Use SECURITY DEFINER** for role-checking functions to avoid RLS recursion
6. **Guest orders** must work without authentication (user_id = NULL)
7. **Phone validation** must use libphonenumber-js for international support
8. **All prices** stored in base currency (BDT), converted on display
9. **Images** resolved through storage URL helper, never hardcoded
10. **All admin routes** protected by isAdmin check in AuthContext

---

*This blueprint contains everything needed to rebuild AR Prime Market from scratch. Follow the database schema exactly, implement RLS policies for every table, and build the UI components in the order specified in the implementation priority.*
