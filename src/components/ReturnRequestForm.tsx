import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { RotateCcw, X, Loader2, AlertCircle, CheckCircle, Camera, Trash2 } from "lucide-react";

interface ReturnRequestFormProps {
  order: any;
  items: any[];
  l: (en: string, bn: string, ar: string) => string;
  formatPrice: (n: number) => string;
}

const RETURN_WINDOW_DAYS = 14;
const MAX_IMAGES = 3;

const returnReasons = [
  { en: "Defective / Damaged", bn: "ত্রুটিপূর্ণ / ক্ষতিগ্রস্ত", ar: "معيب / تالف" },
  { en: "Wrong item received", bn: "ভুল পণ্য পেয়েছি", ar: "استلمت منتج خاطئ" },
  { en: "Not as described", bn: "বর্ণনার সাথে মেলেনি", ar: "لا يطابق الوصف" },
  { en: "Changed my mind", bn: "মন পরিবর্তন", ar: "غيرت رأيي" },
  { en: "Other", bn: "অন্যান্য", ar: "آخر" },
];

const ReturnRequestForm = ({ order, items, l, formatPrice }: ReturnRequestFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [existingReturn, setExistingReturn] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const orderDate = new Date(order.created_at);
  const daysSince = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
  const isEligible = daysSince <= RETURN_WINDOW_DAYS && order.status === "delivered";

  useEffect(() => {
    if (!user || !order.id) return;
    supabase.from("return_requests").select("*")
      .eq("order_id", order.id).eq("user_id", user.id)
      .in("status", ["pending", "approved"])
      .maybeSingle()
      .then(({ data }) => setExistingReturn(data));
  }, [order.id, user]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) return;

    setImageFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadImages = async (returnNumber: string): Promise<string[]> => {
    if (!user || imageFiles.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${returnNumber}/${i}.${ext}`;
      const { error } = await supabase.storage.from("return-images").upload(path, file, { upsert: true });
      if (!error) urls.push(path);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!user || !reason) { toast.error(l("Please select a reason", "কারণ নির্বাচন করুন", "يرجى اختيار سبب")); return; }
    const selectedProducts = items.filter((_, i) => selectedItems[i]);
    if (selectedProducts.length === 0) { toast.error(l("Select at least one item", "অন্তত একটি আইটেম নির্বাচন করুন", "اختر عنصرًا واحدًا على الأقل")); return; }

    setSubmitting(true);
    const refundAmount = refundType === "full"
      ? Number(order.total)
      : selectedProducts.reduce((sum: number, item: any) => sum + Number(item.total), 0);

    const { data: insertedReturn, error } = await supabase.from("return_requests").insert({
      return_number: "",
      order_id: order.id,
      user_id: user.id,
      reason,
      details: details || null,
      product_items: selectedProducts.map((item: any) => ({
        product_id: item.product_id,
        title: item.title,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      refund_type: refundType,
      refund_amount: refundAmount,
    } as any).select().single();

    if (error) {
      setSubmitting(false);
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast.error(l("A return request already exists for this order", "এই অর্ডারের জন্য ইতিমধ্যে একটি রিটার্ন অনুরোধ আছে", "يوجد بالفعل طلب إرجاع لهذا الطلب"));
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Upload images if any
    if (imageFiles.length > 0 && insertedReturn) {
      setUploadingImages(true);
      await uploadImages((insertedReturn as any).return_number);
      setUploadingImages(false);
    }

    setSubmitting(false);
    toast.success(l("Return request submitted!", "রিটার্ন অনুরোধ জমা হয়েছে!", "تم تقديم طلب الإرجاع!"));
    setOpen(false);
    setExistingReturn({ status: "pending" });
  };

  if (existingReturn) {
    const statusLabels: Record<string, { en: string; bn: string; ar: string }> = {
      pending: { en: "Return Pending", bn: "রিটার্ন অপেক্ষমাণ", ar: "إرجاع معلق" },
      approved: { en: "Return Approved", bn: "রিটার্ন অনুমোদিত", ar: "تمت الموافقة على الإرجاع" },
    };
    const label = statusLabels[existingReturn.status] || statusLabels.pending;
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-600 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {l(label.en, label.bn, label.ar)}
      </div>
    );
  }

  if (!isEligible) {
    if (order.status !== "delivered") return null;
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 text-muted-foreground text-xs">
        <AlertCircle className="w-3.5 h-3.5" />
        {l(`Return window expired (${RETURN_WINDOW_DAYS} days)`, `রিটার্নের সময়সীমা শেষ (${RETURN_WINDOW_DAYS} দিন)`, `انتهت فترة الإرجاع (${RETURN_WINDOW_DAYS} يوم)`)}
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors">
        <RotateCcw className="w-4 h-4" />
        {l("Request Return / Refund", "রিটার্ন / রিফান্ড অনুরোধ", "طلب إرجاع / استرداد")}
      </button>

      {open && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-foreground">{l("Request Return", "রিটার্ন অনুরোধ", "طلب إرجاع")}</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
              {l(`You have ${RETURN_WINDOW_DAYS - daysSince} days left to request a return.`, `রিটার্ন অনুরোধের জন্য ${RETURN_WINDOW_DAYS - daysSince} দিন বাকি।`, `${RETURN_WINDOW_DAYS - daysSince} يوم متبقي لطلب الإرجاع.`)}
            </div>

            {/* Select items */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{l("Select Items", "আইটেম নির্বাচন", "اختر العناصر")}</label>
              <div className="space-y-2 mt-2">
                {items.map((item: any, i: number) => (
                  <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedItems[i] ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}>
                    <input type="checkbox" checked={!!selectedItems[i]} onChange={e => setSelectedItems(p => ({ ...p, [i]: e.target.checked }))}
                      className="rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity}x {formatPrice(Number(item.price))}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{l("Reason", "কারণ", "السبب")}</label>
              <select value={reason} onChange={e => setReason(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">{l("Select reason...", "কারণ নির্বাচন করুন...", "اختر السبب...")}</option>
                {returnReasons.map((r, i) => (
                  <option key={i} value={r.en}>{l(r.en, r.bn, r.ar)}</option>
                ))}
              </select>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{l("Upload Photos (optional, max 3)", "ছবি আপলোড (ঐচ্ছিক, সর্বোচ্চ ৩)", "تحميل صور (اختياري، حد أقصى ٣)")}</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < MAX_IMAGES && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Camera className="w-5 h-5 text-muted-foreground" />
                    <input type="file" accept="image/*" onChange={handleImageAdd} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{l("Additional Details (optional)", "অতিরিক্ত বিবরণ (ঐচ্ছিক)", "تفاصيل إضافية (اختياري)")}</label>
              <textarea value={details} onChange={e => setDetails(e.target.value)} rows={2}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder={l("Describe the issue...", "সমস্যাটি বর্ণনা করুন...", "صف المشكلة...")} />
            </div>

            {/* Refund type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{l("Refund Type", "রিফান্ডের ধরন", "نوع الاسترداد")}</label>
              <div className="flex gap-2 mt-1">
                {(["full", "partial"] as const).map(t => (
                  <button key={t} onClick={() => setRefundType(t)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${refundType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {l(t === "full" ? "Full Refund" : "Partial Refund", t === "full" ? "সম্পূর্ণ রিফান্ড" : "আংশিক রিফান্ড", t === "full" ? "استرداد كامل" : "استرداد جزئي")}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting || uploadingImages || !reason}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-105 disabled:opacity-60 transition-all">
              {(submitting || uploadingImages) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {uploadingImages ? l("Uploading photos...", "ছবি আপলোড হচ্ছে...", "جاري تحميل الصور...") : l("Submit Return Request", "রিটার্ন অনুরোধ জমা দিন", "تقديم طلب الإرجاع")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReturnRequestForm;
