import React from "react";
import { User, Package, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/utils";

interface Order {
  _id: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  status: string;
  createdAt: string;
  branchName?: string;
  branchNameAr?: string;
  areaName?: string;
  areaNameAr?: string;
  selectedArea?: string;
}

export function Profile() {
  const { t, isRTL, language } = useLanguage();

  const getStatusTranslation = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pending") return t.pending;
    if (s === "preparing") return t.preparing;
    if (s === "out for delivery") return t.outForDelivery;
    if (s === "completed") return t.completed;
    if (s === "cancelled") return t.cancelled;
    return status;
  };
  const [phone, setPhone] = React.useState(
    () => localStorage.getItem("burger_station_phone") || "",
  );
  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    notes: "",
  });
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchProfile = async (phoneNum: string) => {
    try {
      const res = await fetch(`/api/customer/${phoneNum}`);
      const data = await res.json();
      if (data.name) {
        setFormData({
          name: data.name,
          address: data.address,
          notes: data.notes || "",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async (phoneNum: string) => {
    try {
      const res = await fetch(`/api/orders/${phoneNum}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (phone) {
      fetchProfile(phone);
      fetchOrders(phone);
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, ...formData }),
      });
      if (res.ok) {
        localStorage.setItem("burger_station_phone", phone);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-6",
        isRTL && "font-arabic rtl",
      )}
    >
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          <div className="flex flex-col items-center p-6 md:p-8 bg-card rounded-[1.5rem] md:rounded-[2rem] border border-white/5">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <User className="text-primary" size={32} />
            </div>
            <h3 className="font-display font-black text-lg md:text-xl uppercase italic">
              {formData.name || t.profile}
            </h3>
            <p className="text-white/40 text-xs font-mono mt-1">
              {phone || "---- --- ----"}
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {t.phoneWhatsapp}
              </label>
              <input
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {t.fullName}
              </label>
              <input
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {t.deliveryAddress}
              </label>
              <textarea
                required
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-sm resize-none"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black h-12 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle2 size={16} />
                  {t.profileSaved}
                </>
              ) : (
                t.saveProfile
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-2xl md:text-3xl font-display font-black mb-6 md:mb-8 uppercase italic flex items-center gap-4">
            <Package size={24} className="text-primary" />
            {t.orderHistory}
          </h2>

          {orders.length === 0 ? (
            <div className="p-8 md:p-12 border border-dashed border-white/10 rounded-[1.5rem] md:rounded-[2rem] text-center">
              <p className="text-white/20 font-black uppercase tracking-widest italic">
                {t.noOrders}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-card border border-white/5 rounded-2xl p-4 md:p-6 hover:border-primary/20 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        <Calendar size={12} />
                        {formatDate(order.createdAt)}
                      </div>
                      <h4 className="text-[10px] md:text-sm font-bold opacity-40">
                        ORDER #{order._id.slice(-6).toUpperCase()}
                      </h4>
                    </div>
                    <div className="bg-white/5 px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10">
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">
                        {getStatusTranslation(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-6 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        isRTL && "flex-row-reverse",
                      )}
                    >
                      <MapPin size={12} className="text-primary" />
                      <span>
                        {language === "ar"
                          ? order.branchNameAr || order.branchName
                          : order.branchName || t.locationName}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        isRTL && "flex-row-reverse",
                      )}
                    >
                      <div className="w-1 h-1 bg-white/20 rounded-full" />
                      <span>
                        {language === "ar"
                          ? order.areaNameAr || order.areaName
                          : order.areaName ||
                            order.selectedArea ||
                            t.deliveryArea}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-xs font-medium"
                      >
                        <span className="opacity-60">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono">
                          {item.price * item.quantity} {t.egp}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      {t.orderTotal}
                    </span>
                    <span className="text-xl font-display font-black text-primary italic">
                      {order.total} {t.egp}
                    </span>
                  </div>

                  {order.status === "Cancelled" && order.cancelReason && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-[8px] font-black uppercase tracking-widest text-red-500 mb-1">
                        {t.cancelReason}
                      </p>
                      <p className="text-xs font-bold text-white/80">
                        {order.cancelReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
