import React from "react";
import { User, Package, Calendar, MapPin, CheckCircle2, AlertTriangle, RefreshCw, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../NotificationContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface Order {
  _id: string;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  appliedOffers?: { title: string; titleAr: string; discountAmount: number }[];
  status: string;
  createdAt: string;
  branchName?: string;
  branchNameAr?: string;
  areaName?: string;
  areaNameAr?: string;
  selectedArea?: string;
  address: string;
  notes?: string;
  cancelReason?: string;
}

export function Profile() {
  const { t, isRTL, language } = useLanguage();
  const { showNotification } = useNotification();

  const getStatusTranslation = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pending") return t.pending;
    if (s === "preparing") return t.preparing;
    if (s === "out for delivery") return t.outForDelivery;
    if (s === "completed") return t.completed;
    if (s === "cancelled") return t.cancelled;
    return status;
  };
  const [phone, setPhone] = React.useState(() => localStorage.getItem("burger_station_phone") || "");
  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    notes: ""
  });
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [genericConfirm, setGenericConfirm] = React.useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  } | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
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
          notes: data.notes || ""
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
        body: JSON.stringify({ phone, ...formData })
      });
      if (res.ok) {
        localStorage.setItem("burger_station_phone", phone);
        setSaved(true);
        showNotification("success", t.profileSaved);
        setTimeout(() => setSaved(false), 3000);
      } else {
        showNotification("error", "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Connection error");
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    setGenericConfirm({
      title: t.cancelOrder,
      message: isRTL ? "هل أنت متأكد من إلغاء هذا الطلب؟" : "Are you sure you want to cancel this order?",
      isDangerous: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/orders/${orderId}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, reason: "Cancelled by user" })
          });
          if (res.ok) {
            showNotification("success", t.orderCancelled);
            fetchOrders(phone);
          } else {
            const data = await res.json();
            showNotification("error", data.error || "Failed to cancel order");
          }
        } catch (err) {
          showNotification("error", "Connection error");
        } finally {
          setLoading(false);
          setGenericConfirm(null);
        }
      }
    });
  };

  return (
    <div className={cn("min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-6", isRTL && "font-arabic rtl")}>
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          <div className="flex flex-col items-center p-6 md:p-8 bg-card rounded-[1.5rem] md:rounded-[2rem] border border-white/5">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <User className="text-primary" size={32} />
            </div>
            <h3 className="font-display font-black text-lg md:text-xl uppercase italic">
              {formData.name || t.profile}
            </h3>
            <p className="text-white/40 text-xs font-mono mt-1">{phone || "---- --- ----"}</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.phoneWhatsapp}</label>
              <input
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.fullName}</label>
              <input
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.deliveryAddress}</label>
              <textarea
                required
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-sm resize-none"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
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
              <p className="text-white/20 font-black uppercase tracking-widest italic">{t.noOrders}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-card border border-white/5 rounded-2xl p-4 md:p-6 hover:border-primary/20 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        <Calendar size={12} />
                        {formatDate(order.createdAt)}
                      </div>
                      <h4 className="text-[10px] md:text-sm font-bold opacity-40">ORDER #{order._id.slice(-6).toUpperCase()}</h4>
                    </div>
                    <div className="bg-white/5 px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10">
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">
                        {getStatusTranslation(order.status)}
                      </span>
                    </div>
                  </div>

                  {order.status === "Pending" && (
                    <button
                      onClick={() => cancelOrder(order._id)}
                      className="mb-6 w-full py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      {t.cancelOrder}
                    </button>
                  )}

                  <div className="flex flex-wrap gap-3 mb-6 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    <div className={cn("flex flex-col gap-1", isRTL && "items-end")}>
                      <span className="text-[8px] opacity-40">{t.branch || "Branch"}</span>
                      <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                        <MapPin size={12} className="text-primary" />
                        <span className="text-white">
                          {language === 'ar' ? (order.branchNameAr || order.branchName) : order.branchName || t.locationName}
                        </span>
                      </div>
                    </div>
                    <div className={cn("flex flex-col gap-1", isRTL && "items-end")}>
                      <span className="text-[8px] opacity-40">{t.area || "Area"}</span>
                      <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="text-white">
                          {language === 'ar' ? (order.areaNameAr || order.areaName) : order.areaName || order.selectedArea || t.deliveryArea}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl mb-6 space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{t.deliveryAddress}</span>
                    <p className="text-xs italic text-white/80">{order.address}</p>
                    {order.notes && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{t.notesLabel || "Notes"}</span>
                        <p className="text-xs text-white/60">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className={cn("flex justify-between text-xs font-medium", isRTL && "flex-row-reverse")}>
                        <span className="opacity-60">{item.quantity}x {item.name}</span>
                        <span className="font-mono">{item.price * item.quantity} {t.egp}</span>
                      </div>
                    ))}
                  </div>

                  {order.appliedOffers && order.appliedOffers.length > 0 && (
                    <div className="space-y-1 mb-4 border-t border-white/5 pt-4">
                      {order.appliedOffers.map((offer, idx) => (
                        <div key={idx} className={cn("flex justify-between text-[10px] font-bold text-green-500 italic", isRTL && "flex-row-reverse")}>
                          <span>{language === 'ar' ? offer.titleAr : offer.title}</span>
                          <span>-{offer.discountAmount} {t.egp}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <div className={cn("flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40", isRTL && "flex-row-reverse")}>
                      <span>{t.subtotal}</span>
                      <span>{order.subtotal || (order.total - (order.deliveryFee || 0) + (order.discount || 0))} {t.egp}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className={cn("flex justify-between text-[10px] font-black uppercase tracking-widest text-green-500", isRTL && "flex-row-reverse")}>
                        <span>{t.discount || "Discount"}</span>
                        <span>-{order.discount} {t.egp}</span>
                      </div>
                    )}
                    <div className={cn("flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40", isRTL && "flex-row-reverse")}>
                      <span>{t.deliveryFee}</span>
                      <span>{order.deliveryFee || 0} {t.egp}</span>
                    </div>
                    <div className={cn("flex justify-between items-center pt-2 mt-2 border-t border-white/5", isRTL && "flex-row-reverse")}>
                      <span className="text-xs font-black uppercase tracking-widest text-white">{t.orderTotal}</span>
                      <span className="text-xl font-display font-black text-primary italic">
                        {order.total} {t.egp}
                      </span>
                    </div>
                  </div>

                  {order.status === "Cancelled" && order.cancelReason && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-[8px] font-black uppercase tracking-widest text-red-500 mb-1">{t.cancelReason}</p>
                      <p className="text-xs font-bold text-white/80">{order.cancelReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {genericConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#1A1A1A] p-10 rounded-[2.5rem] border border-white/10 w-full max-w-sm text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className={cn("text-primary", genericConfirm.isDangerous && "text-red-500")} size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">{genericConfirm.title}</h3>
              <p className="text-white/40 text-sm mb-8">{genericConfirm.message}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setGenericConfirm(null)} className="py-4 bg-white/5 rounded-xl font-black uppercase text-[10px] hover:bg-white/10 transition-colors">{t.cancel}</button>
                <button onClick={genericConfirm.onConfirm} disabled={loading} className={cn("py-4 rounded-xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2", genericConfirm.isDangerous ? "bg-red-500 text-white" : "bg-white text-black")}>
                  {loading ? <RefreshCw className="animate-spin" size={14} /> : t.confirm}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
