
-- CMS content table for managing all frontend editable sections
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_label TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read active content
CREATE POLICY "Anyone can read active site content"
ON public.site_content FOR SELECT
USING (is_active = true);

-- Only admins can manage
CREATE POLICY "Admins can manage site content"
ON public.site_content FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
CREATE POLICY "Deny anon access to site_content"
ON public.site_content FOR SELECT
TO anon
USING (false);

-- Insert default sections with editable content
INSERT INTO public.site_content (section_key, section_label, content) VALUES
('hero_banner', 'Hero Banner Slides', '{
  "slides": [
    {
      "title": "New Season Collection",
      "subtitle": "Up to 40% Off",
      "description": "Discover our carefully curated collection of premium products at unbeatable prices.",
      "cta_text": "Shop Now",
      "cta_link": "/products",
      "image": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80&auto=format&fit=crop",
      "badge": "🔥 Hot Deal",
      "accent": "from-rose-900/80 via-rose-900/40"
    },
    {
      "title": "Premium Electronics",
      "subtitle": "Latest Gadgets",
      "description": "Shop the latest electronics, gadgets, and accessories from top brands.",
      "cta_text": "Explore Electronics",
      "cta_link": "/products?category=Electronics",
      "image": "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&q=80&auto=format&fit=crop",
      "badge": "⚡ New Arrivals",
      "accent": "from-slate-900/80 via-slate-900/40"
    },
    {
      "title": "Home & Living",
      "subtitle": "Transform Your Space",
      "description": "Elevate your living space with our premium home decor collection.",
      "cta_text": "Shop Home",
      "cta_link": "/products?category=Home",
      "image": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1200&q=80&auto=format&fit=crop",
      "badge": "✨ Trending",
      "accent": "from-emerald-900/70 via-emerald-900/30"
    }
  ]
}'::jsonb),
('announcement_bar', 'Announcement Bar', '{
  "enabled": true,
  "text": "🎉 Free Shipping on orders over ৳999!",
  "link": "/products",
  "bg_color": "primary"
}'::jsonb),
('footer', 'Footer Settings', '{
  "brand_name": "Prime Market",
  "brand_tagline": "Premium Shopping",
  "brand_description": "Curated collection of premium quality products delivered to your doorstep. Shop with confidence at AR Prime Market.",
  "email": "support@arprimemarket.com",
  "phone": "+880 1910-521565",
  "address": "Dhaka, Bangladesh",
  "developer_name": "Abdullah Raiyan",
  "developer_url": "https://abdullahraiyan.com/"
}'::jsonb),
('whatsapp', 'WhatsApp Button', '{
  "enabled": true,
  "phone": "8801910521565",
  "message": "Hello! I need help with my order."
}'::jsonb),
('mega_sale_banner', 'Mega Sale Banner', '{
  "enabled": true,
  "title": "Mega Sale Event",
  "description": "Don''t miss our biggest sale of the year. Up to 70% off on selected items!",
  "cta_text": "Shop the Sale",
  "cta_link": "/products"
}'::jsonb),
('category_images', 'Homepage Categories', '{
  "categories": [
    {"name": "Electronics", "image": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=85&auto=format&fit=crop"},
    {"name": "Fashion", "image": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=85&auto=format&fit=crop"},
    {"name": "Accessories", "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=85&auto=format&fit=crop"},
    {"name": "Home", "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=85&auto=format&fit=crop"}
  ]
}'::jsonb),
('trust_badges', 'Trust Badges', '{
  "badges": [
    {"icon": "ShieldCheck", "title": "Secure Checkout", "description": "SSL Encrypted"},
    {"icon": "Truck", "title": "Free Shipping", "description": "Orders over ৳999"},
    {"icon": "RotateCcw", "title": "Easy Returns", "description": "30-day return policy"},
    {"icon": "HeadphonesIcon", "title": "24/7 Support", "description": "We are here to help"}
  ]
}'::jsonb),
('seo_global', 'Global SEO Settings', '{
  "site_name": "AR Prime Market",
  "default_description": "Shop premium curated products at AR Prime Market. Electronics, Fashion, Accessories & more with fast delivery.",
  "default_image": "https://lovable.dev/opengraph-image-p98pqg.png",
  "base_url": "https://arprimemarket.lovable.app"
}'::jsonb),
('navbar', 'Navbar Settings', '{
  "brand_name": "Prime Market",
  "logo_url": "/images/logo.png"
}'::jsonb);
