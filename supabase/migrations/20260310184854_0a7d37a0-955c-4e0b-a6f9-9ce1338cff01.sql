-- Fix products: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active products"
  ON public.products FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT
  TO public
  USING (true);

-- Fix site_content
DROP POLICY IF EXISTS "Deny anon access to site_content" ON public.site_content;
DROP POLICY IF EXISTS "Anyone can read active site content" ON public.site_content;
CREATE POLICY "Anyone can read active site content"
  ON public.site_content FOR SELECT
  TO public
  USING (is_active = true);

-- Fix other public-facing tables
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
CREATE POLICY "Anyone can read active coupons"
  ON public.coupons FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read active faqs" ON public.faq_items;
CREATE POLICY "Anyone can read active faqs"
  ON public.faq_items FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read faq categories" ON public.faq_categories;
CREATE POLICY "Anyone can read faq categories"
  ON public.faq_categories FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Anyone can read blog categories" ON public.blog_categories;
CREATE POLICY "Anyone can read blog categories"
  ON public.blog_categories FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Anyone can read published posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published posts"
  ON public.blog_posts FOR SELECT
  TO public
  USING (is_published = true);

DROP POLICY IF EXISTS "Anyone can read active variants" ON public.product_variants;
CREATE POLICY "Anyone can read active variants"
  ON public.product_variants FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read help categories" ON public.help_categories;
CREATE POLICY "Anyone can read help categories"
  ON public.help_categories FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Anyone can read published articles" ON public.help_articles;
CREATE POLICY "Anyone can read published articles"
  ON public.help_articles FOR SELECT
  TO public
  USING (is_published = true);