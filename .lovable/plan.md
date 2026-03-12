

## সমস্যা চিহ্নিত হয়েছে

**Lovable Published Link** → Lovable Cloud database ব্যবহার করে — যেখানে আমরা আগে RLS policy fix করেছি। তাই products দেখাচ্ছে।

**Vercel Deployed Site** → আপনার external Supabase instance ব্যবহার করে — সেখানে এখনো পুরনো **RESTRICTIVE** RLS policies আছে, যা anonymous access block করছে। তাই products দেখাচ্ছে না।

## সমাধান

আপনার external Supabase dashboard এ গিয়ে SQL Editor এ নিচের migration SQL টা run করতে হবে — এটাই সেই same fix যা আমরা Lovable Cloud এ apply করেছিলাম:

```sql
-- Fix products
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active products"
  ON public.products FOR SELECT TO public USING (is_active = true);

-- Fix categories
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT TO public USING (true);

-- Fix site_content
DROP POLICY IF EXISTS "Deny anon access to site_content" ON public.site_content;
DROP POLICY IF EXISTS "Anyone can read active site content" ON public.site_content;
CREATE POLICY "Anyone can read active site content"
  ON public.site_content FOR SELECT TO public USING (is_active = true);

-- Fix coupons
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
CREATE POLICY "Anyone can read active coupons"
  ON public.coupons FOR SELECT TO public USING (is_active = true);

-- Fix FAQ
DROP POLICY IF EXISTS "Anyone can read active faqs" ON public.faq_items;
CREATE POLICY "Anyone can read active faqs"
  ON public.faq_items FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read faq categories" ON public.faq_categories;
CREATE POLICY "Anyone can read faq categories"
  ON public.faq_categories FOR SELECT TO public USING (true);

-- Fix blog
DROP POLICY IF EXISTS "Anyone can read blog categories" ON public.blog_categories;
CREATE POLICY "Anyone can read blog categories"
  ON public.blog_categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anyone can read published posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published posts"
  ON public.blog_posts FOR SELECT TO public USING (is_published = true);

-- Fix variants
DROP POLICY IF EXISTS "Anyone can read active variants" ON public.product_variants;
CREATE POLICY "Anyone can read active variants"
  ON public.product_variants FOR SELECT TO public USING (is_active = true);

-- Fix help center
DROP POLICY IF EXISTS "Anyone can read help categories" ON public.help_categories;
CREATE POLICY "Anyone can read help categories"
  ON public.help_categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anyone can read published articles" ON public.help_articles;
CREATE POLICY "Anyone can read published articles"
  ON public.help_articles FOR SELECT TO public USING (is_published = true);
```

## কেন এটা আমি সরাসরি করতে পারছি না

Lovable শুধু নিজের Cloud database এ SQL execute করতে পারে। আপনার external Supabase instance এ আমার access নেই। এটা আপনাকে manually করতে হবে:

1. আপনার **Supabase Dashboard** এ যান (supabase.com/dashboard)
2. আপনার project select করুন
3. **SQL Editor** এ যান
4. উপরের SQL টা paste করে **Run** করুন
5. Vercel site refresh করুন — products দেখা যাবে

## Technical Summary

| Environment | Database | RLS Status | Products |
|---|---|---|---|
| Lovable Published | Lovable Cloud | Fixed (Permissive) | Showing |
| Vercel Deployed | External Supabase | Broken (Restrictive) | Not showing |

একবার SQL run করলেই Vercel site এও products দেখাবে।

