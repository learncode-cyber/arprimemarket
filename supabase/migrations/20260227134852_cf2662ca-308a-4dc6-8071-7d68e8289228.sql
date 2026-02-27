-- Activate all existing payment methods
UPDATE payment_methods SET is_active = true, updated_at = now();

-- Add Binance Pay if not exists
INSERT INTO payment_methods (method_key, method_type, display_name, display_name_bn, display_name_ar, icon_name, instructions, instructions_bn, instructions_ar, is_active, sort_order)
SELECT 'binance_pay', 'crypto', 'Binance Pay', 'বাইনান্স পে', 'بينانس باي', 'Coins',
  'Pay using Binance Pay. Scan the QR code or use the deposit link.',
  'বাইনান্স পে ব্যবহার করে পেমেন্ট করুন। QR কোড স্ক্যান করুন।',
  'ادفع باستخدام Binance Pay. امسح رمز QR.',
  true, 8
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE method_key = 'binance_pay');

-- Add Nagad if not exists
INSERT INTO payment_methods (method_key, method_type, display_name, display_name_bn, display_name_ar, icon_name, instructions, instructions_bn, instructions_ar, is_active, sort_order)
SELECT 'nagad', 'mobile', 'Nagad', 'নগদ', 'نقد', 'Smartphone',
  'Send payment to the Nagad number shown. Include order number as reference.',
  'দেখানো নগদ নম্বরে পেমেন্ট পাঠান। রেফারেন্স হিসেবে অর্ডার নম্বর দিন।',
  'أرسل الدفع إلى رقم نقد المعروض.',
  true, 3
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE method_key = 'nagad');