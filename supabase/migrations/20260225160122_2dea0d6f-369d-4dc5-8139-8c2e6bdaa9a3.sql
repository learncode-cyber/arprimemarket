
-- Payment methods table for admin-managed payment configurations
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_type text NOT NULL, -- 'card', 'crypto', 'mobile', 'cod'
  method_key text NOT NULL UNIQUE, -- 'visa_mastercard', 'usdt', 'btc', 'eth', 'bnb', 'bkash', 'cod'
  display_name text NOT NULL,
  display_name_bn text,
  display_name_ar text,
  icon_name text, -- lucide icon name
  is_active boolean NOT NULL DEFAULT false,
  wallet_address text,
  deposit_link text,
  instructions text,
  instructions_bn text,
  instructions_ar text,
  network text, -- e.g. 'ERC-20', 'BEP-20', 'TRC-20'
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can read active payment methods
CREATE POLICY "Anyone can read active payment methods"
ON public.payment_methods FOR SELECT
USING (is_active = true);

-- Admins can manage all payment methods (including inactive)
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default payment methods
INSERT INTO public.payment_methods (method_type, method_key, display_name, display_name_bn, display_name_ar, icon_name, is_active, sort_order, instructions, instructions_bn, instructions_ar) VALUES
('cod', 'cod', 'Cash on Delivery', 'ক্যাশ অন ডেলিভারি', 'الدفع عند الاستلام', 'Banknote', true, 1, 'Pay when you receive your order.', 'অর্ডার পেলে পেমেন্ট করুন।', 'ادفع عند استلام طلبك.'),
('mobile', 'bkash', 'bKash', 'বিকাশ', 'بيكاش', 'Smartphone', false, 2, 'Send payment to the bKash number shown. Include order number as reference.', 'দেখানো বিকাশ নম্বরে পেমেন্ট পাঠান। রেফারেন্স হিসেবে অর্ডার নম্বর দিন।', 'أرسل الدفع إلى رقم بيكاش المعروض.'),
('card', 'visa_mastercard', 'Visa / MasterCard', 'ভিসা / মাস্টারকার্ড', 'فيزا / ماستركارد', 'CreditCard', false, 3, 'Secure card payment via payment gateway.', 'পেমেন্ট গেটওয়ের মাধ্যমে নিরাপদ কার্ড পেমেন্ট।', 'دفع آمن بالبطاقة عبر بوابة الدفع.'),
('crypto', 'usdt', 'USDT (Tether)', 'ইউএসডিটি (টেথার)', 'USDT (تيثر)', 'Coins', false, 4, 'Send USDT to the wallet address shown. Include order number in memo.', 'দেখানো ওয়ালেট অ্যাড্রেসে USDT পাঠান।', 'أرسل USDT إلى عنوان المحفظة المعروض.'),
('crypto', 'btc', 'Bitcoin (BTC)', 'বিটকয়েন (BTC)', 'بيتكوين (BTC)', 'Coins', false, 5, 'Send BTC to the wallet address shown.', 'দেখানো ওয়ালেট অ্যাড্রেসে BTC পাঠান।', 'أرسل BTC إلى عنوان المحفظة المعروض.'),
('crypto', 'eth', 'Ethereum (ETH)', 'ইথেরিয়াম (ETH)', 'إيثيريوم (ETH)', 'Coins', false, 6, 'Send ETH to the wallet address shown.', 'দেখানো ওয়ালেট অ্যাড্রেসে ETH পাঠান।', 'أرسل ETH إلى عنوان المحفظة المعروض.'),
('crypto', 'bnb', 'BNB (Binance)', 'বিএনবি (বাইনান্স)', 'BNB (بينانس)', 'Coins', false, 7, 'Send BNB to the wallet address shown.', 'দেখানো ওয়ালেট অ্যাড্রেসে BNB পাঠান।', 'أرسل BNB إلى عنوان المحفظة المعروض.');

-- Payment transactions table for tracking
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method_key text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed', 'refunded'
  transaction_reference text,
  admin_notes text,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment transactions"
ON public.payment_transactions FOR SELECT
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Users can insert payment transactions"
ON public.payment_transactions FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Admins can manage all payment transactions"
ON public.payment_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
