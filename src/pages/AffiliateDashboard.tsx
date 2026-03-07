import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import SEOHead from "@/components/SEOHead";
import {
  Users, DollarSign, TrendingUp, Copy, Check, Link as LinkIcon,
  BarChart3, Clock, ShieldCheck, Loader2, ArrowLeft, Share2, Gift
} from "lucide-react";

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  commission_type: string;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  total_clicks: number;
  total_orders: number;
  total_sales: number;
  status: string;
  last_sale_at: string | null;
  payout_method: string;
  created_at: string;
}

interface Commission {
  id: string;
  order_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang } = useLanguage();
  const { formatPrice } = useCurrency();

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const tx = (en: string, bn: string) => lang.code === "bn" ? bn : en;

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: aff } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (aff) {
      setAffiliate(aff as unknown as Affiliate);
      const { data: comms } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setCommissions((comms as unknown as Commission[]) || []);
    }
    setLoading(false);
  };

  const joinProgram = async () => {
    if (!user) return;
    setJoining(true);
    const { error } = await supabase.from("affiliates").insert({
      user_id: user.id,
      affiliate_code: "",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: tx("Welcome!", "স্বাগতম!"), description: tx("You've joined the affiliate program!", "আপনি অ্যাফিলিয়েট প্রোগ্রামে যোগ দিয়েছেন!") });
      await loadData();
    }
    setJoining(false);
  };

  const referralLink = affiliate
    ? `${window.location.origin}?ref=${affiliate.affiliate_code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: tx("Copied!", "কপি হয়েছে!") });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Join page
  if (!affiliate) {
    return (
      <>
        <SEOHead title="Affiliate Program | AR Prime Market" description="Join our affiliate program and earn commissions on every sale." />
        <div className="min-h-screen bg-background py-12">
          <div className="container max-w-2xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {tx("Join Our Affiliate Program", "আমাদের অ্যাফিলিয়েট প্রোগ্রামে যোগ দিন")}
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {tx(
                  "Earn competitive commissions on every sale you refer. Share your unique link and start earning today!",
                  "আপনার রেফারেল থেকে প্রতিটি বিক্রিতে কমিশন আয় করুন। আপনার ইউনিক লিংক শেয়ার করুন এবং আজই আয় শুরু করুন!"
                )}
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                {[
                  { icon: DollarSign, label: tx("5%+ Commission", "৫%+ কমিশন") },
                  { icon: BarChart3, label: tx("Real-time Tracking", "রিয়েল-টাইম ট্র্যাকিং") },
                  { icon: ShieldCheck, label: tx("Trusted Platform", "বিশ্বস্ত প্ল্যাটফর্ম") },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-xl">
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={joinProgram}
                disabled={joining}
                className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-105 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {tx("Join Now — It's Free", "এখনই যোগ দিন — বিনামূল্যে")}
              </button>
              <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> {tx("Back to Dashboard", "ড্যাশবোর্ডে ফিরুন")}
              </Link>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // Stats
  const stats = [
    { label: tx("Total Earnings", "মোট আয়"), value: formatPrice(affiliate.total_earnings), icon: DollarSign, color: "text-emerald-500" },
    { label: tx("Pending", "পেন্ডিং"), value: formatPrice(affiliate.pending_earnings), icon: Clock, color: "text-amber-500" },
    { label: tx("Total Orders", "মোট অর্ডার"), value: affiliate.total_orders.toString(), icon: TrendingUp, color: "text-blue-500" },
    { label: tx("Commission Rate", "কমিশন রেট"), value: `${affiliate.commission_rate}%`, icon: BarChart3, color: "text-primary" },
  ];

  return (
    <>
      <SEOHead title="Affiliate Dashboard | AR Prime Market" description="Track your affiliate earnings and performance." />
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-4xl mx-auto px-4 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                {tx("Affiliate Dashboard", "অ্যাফিলিয়েট ড্যাশবোর্ড")}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tx(`Status: ${affiliate.status}`, `স্ট্যাটাস: ${affiliate.status}`)}
                {affiliate.status === "inactive" && (
                  <span className="text-destructive ml-1">({tx("No sales in 30 days", "৩০ দিনে কোনো বিক্রি নেই")})</span>
                )}
              </p>
            </div>
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> {tx("Dashboard", "ড্যাশবোর্ড")}
            </Link>
          </motion.div>

          {/* Referral Link */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-3"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" />
              {tx("Your Referral Link", "আপনার রেফারেল লিংক")}
            </h2>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-xs text-foreground font-mono"
              />
              <button onClick={copyLink} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:brightness-105 transition-all flex items-center gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? tx("Copied", "কপি হয়েছে") : tx("Copy", "কপি")}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {tx(
                "Share this link with your audience. You earn commission on every purchase made through it.",
                "এই লিংকটি আপনার অডিয়েন্সের সাথে শেয়ার করুন। এর মাধ্যমে প্রতিটি কেনাকাটায় আপনি কমিশন পাবেন।"
              )}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4 space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                  <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Commission History */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {tx("Commission History", "কমিশন ইতিহাস")}
            </h2>
            {commissions.length === 0 ? (
              <div className="text-center py-8">
                <Share2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {tx("No commissions yet. Share your link to start earning!", "এখনো কোনো কমিশন নেই। আয় শুরু করতে আপনার লিংক শেয়ার করুন!")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">{tx("Date", "তারিখ")}</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">{tx("Order Total", "অর্ডার মোট")}</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">{tx("Rate", "রেট")}</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">{tx("Commission", "কমিশন")}</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">{tx("Status", "স্ট্যাটাস")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(c => (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="py-2.5 text-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="py-2.5 text-right text-foreground">{formatPrice(c.order_total)}</td>
                        <td className="py-2.5 text-right text-muted-foreground">{c.commission_rate}%</td>
                        <td className="py-2.5 text-right font-semibold text-emerald-500">{formatPrice(c.commission_amount)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            c.status === "paid" ? "bg-emerald-500/10 text-emerald-500" :
                            c.status === "pending" ? "bg-amber-500/10 text-amber-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Program Terms */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-muted/30 rounded-2xl p-4 space-y-2"
          >
            <h3 className="text-xs font-semibold text-muted-foreground">{tx("Program Terms", "প্রোগ্রাম শর্তাবলী")}</h3>
            <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
              <li>{tx("Commissions are earned on confirmed and paid orders only.", "শুধুমাত্র নিশ্চিত ও পরিশোধিত অর্ডারে কমিশন পাওয়া যাবে।")}</li>
              <li>{tx("Accounts with no sales within 30 days may be deactivated.", "৩০ দিনের মধ্যে কোনো বিক্রি না হলে অ্যাকাউন্ট নিষ্ক্রিয় হতে পারে।")}</li>
              <li>{tx("Commission rates may be adjusted by the admin.", "কমিশন রেট অ্যাডমিন দ্বারা পরিবর্তন হতে পারে।")}</li>
              <li>{tx("Self-referrals are not allowed.", "স্ব-রেফারেল অনুমোদিত নয়।")}</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AffiliateDashboard;
