import React from "react";
import { X, Minus, Plus, Trash2, Send, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CartItem, SiteSettings, Area, MenuItem } from "../types";
import { cn } from "../lib/utils";
import { useLanguage } from "../context/LanguageContext";
import { calculateOrderTotals, PotentialOffer } from "../lib/promoUtils";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number, variantId?: string) => void;
  onRemove: (id: string, variantId?: string) => void;
  onSubmitOrder: (customerData: { 
    name: string; 
    phone: string; 
    address: string; 
    notes: string; 
    deliveryFee: number; 
    location: string;
    branchId: string;
    areaId?: string;
  } & { items: any[] }) => void;
  settings: SiteSettings | null;
  menuItems?: MenuItem[];
  onAddToCart?: (item: MenuItem, event?: React.MouseEvent, variantId?: string) => void;
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove, onSubmitOrder, settings, menuItems = [], onAddToCart }: CartProps) {
  const { t, language, isRTL } = useLanguage();

  const [step, setStep] = React.useState<"items" | "checkout" | "confirming">("items");
  const [selectedBranchId, setSelectedBranchId] = React.useState(() => localStorage.getItem("burger_station_branch") || "");
  const [selectedAreaId, setSelectedAreaId] = React.useState(() => localStorage.getItem("burger_station_area") || "");
  const [deliveryFee, setDeliveryFee] = React.useState(0);

  const { subtotal, discount, total: calculatedSubtotal, appliedOffers, potentialOffers } = React.useMemo(() => 
    calculateOrderTotals(items, settings, selectedBranchId), 
  [items, settings, selectedBranchId]);

  const selectedBranch = React.useMemo(() => 
    settings?.branches?.find(b => b.id === selectedBranchId),
  [settings, selectedBranchId]);

  const selectedArea = React.useMemo(() => 
    selectedBranch?.areas?.find(a => a.id === selectedAreaId),
  [selectedBranch, selectedAreaId]);

  React.useEffect(() => {
    if (settings && selectedBranchId) {
      const branchIndices = settings.branches || [];
      const branchExists = branchIndices.some(b => b.id === selectedBranchId);
      if (!branchExists) {
        setSelectedBranchId("");
        setSelectedAreaId("");
      } else if (selectedAreaId) {
        const branch = branchIndices.find(b => b.id === selectedBranchId);
        const areaExists = branch?.areas?.some(a => a.id === selectedAreaId);
        if (!areaExists) {
          setSelectedAreaId("");
        }
      }
    }
  }, [settings, selectedBranchId, selectedAreaId]);

  React.useEffect(() => {
    if (selectedArea) {
      setDeliveryFee(selectedArea.fee);
    } else if (selectedBranch) {
      setDeliveryFee(selectedBranch.deliveryFee);
    } else if (settings) {
      setDeliveryFee(settings.defaultDeliveryFee);
    }
  }, [selectedArea, selectedBranch, settings]);

  const [formData, setFormData] = React.useState({
    name: localStorage.getItem("burger_station_name") || "",
    phone: localStorage.getItem("burger_station_phone") || "",
    address: localStorage.getItem("burger_station_address") || "",
    notes: ""
  });

  // Save to localStorage whenever data changes
  React.useEffect(() => {
    localStorage.setItem("burger_station_name", formData.name);
    localStorage.setItem("burger_station_phone", formData.phone);
    localStorage.setItem("burger_station_address", formData.address);
  }, [formData.name, formData.phone, formData.address]);

  React.useEffect(() => {
    localStorage.setItem("burger_station_branch", selectedBranchId);
  }, [selectedBranchId]);

  React.useEffect(() => {
    localStorage.setItem("burger_station_area", selectedAreaId);
  }, [selectedAreaId]);

  React.useEffect(() => {
    const fetchCustomer = async () => {
      const phone = localStorage.getItem("burger_station_phone");
      if (phone) {
        try {
          const res = await fetch(`/api/customer/${phone}`);
          const data = await res.json();
          if (data.name) {
            setFormData(prev => ({
              ...prev,
              name: data.name,
              address: data.address,
              notes: data.notes || ""
            }));
            if (data.favoriteBranchId) setSelectedBranchId(data.favoriteBranchId);
            if (data.favoriteAreaId) setSelectedAreaId(data.favoriteAreaId);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    if (isOpen && step === "checkout") {
      fetchCustomer();
    }
  }, [isOpen, step]);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.phone && formData.phone.length >= 10) {
        try {
          const res = await fetch(`/api/customer/${formData.phone}`);
          const data = await res.json();
          if (data.name) {
            setFormData(prev => ({
              ...prev,
              name: data.name,
              address: data.address,
              notes: data.notes || ""
            }));
            if (data.favoriteBranchId) setSelectedBranchId(data.favoriteBranchId);
            if (data.favoriteAreaId) setSelectedAreaId(data.favoriteAreaId);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.phone]);

  const appliedDeliveryFee = (settings?.freeDeliveryThreshold && (calculatedSubtotal || 0) >= settings.freeDeliveryThreshold) ? 0 : (deliveryFee || 0);
  const total = (calculatedSubtotal || 0) + (appliedDeliveryFee || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone && formData.address && selectedBranchId) {
      localStorage.setItem("burger_station_phone", formData.phone);
      
      const locationLabel = selectedArea 
        ? `${language === 'ar' ? selectedArea.nameAr : selectedArea.name} (${language === 'ar' ? selectedBranch?.nameAr : selectedBranch?.name})`
        : (language === 'ar' ? selectedBranch?.nameAr : selectedBranch?.name) || "";

      setStep("confirming");
      onSubmitOrder({
        ...formData,
        deliveryFee,
        location: locationLabel,
        branchId: selectedBranchId,
        areaId: selectedAreaId,
        items
      });
    }
  };

  const handleFinalConfirm = async () => {
    onClose();
    setStep("items");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
          />
          <motion.div
            initial={{ x: isRTL ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed top-0 bottom-0 w-full md:max-w-md bg-[#0F0F0F] z-[70] shadow-2xl flex flex-col",
              isRTL ? "left-0 border-r border-white/10" : "right-0 border-l border-white/10"
            )}
          >
            <div className={cn("p-4 md:p-6 border-b border-white/5 flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <h2 className="font-display font-black text-lg md:text-xl uppercase tracking-tight">
                  {step === "items" ? t.yourOrder : t.checkout}
                </h2>
                {step === "items" && items.length > 0 && (
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded font-mono text-white/60">
                    {items.length} {items.length === 1 ? t.item : t.items}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <X size={20} className={cn(isRTL && "rotate-180")} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
              {items.length === 0 ? (
                <div className={cn("h-full flex flex-col items-center justify-center text-center p-8", isRTL && "rtl")}>
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                    <ShoppingBag size={40} className="text-white/20" />
                  </div>
                  <h3 className="font-display font-black text-xl mb-2">{t.emptyStation}</h3>
                  <p className="text-white/40 text-sm mb-8">{t.refuelRequired}</p>
                  <button
                    onClick={onClose}
                    className="bg-primary text-black px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-widest"
                  >
                    {t.enterMenu}
                  </button>
                </div>
              ) : step === "items" ? (
                <div className="space-y-4">
                    {items.map((item) => {
                      const variant = item.variants?.find(v => v.id === item.selectedVariantId);
                      const itemName = language === "ar" && item.nameAr ? item.nameAr : item.name;
                      const variantName = variant ? (language === "ar" ? variant.nameAr : variant.name) : null;
                      const price = variant ? variant.price : (item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price);
                      
                      return (
                        <div key={`${item._id}-${item.selectedVariantId}`} className={cn("flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group", isRTL && "flex-row-reverse")}>
                          <div className="relative w-20 h-20 shrink-0">
                            <img
                              src={item.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=200"}
                              alt={itemName}
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <div className={cn("absolute -top-2 w-6 h-6 bg-black border border-white/10 rounded-lg flex items-center justify-center text-[10px] font-mono", isRTL ? "-right-2" : "-left-2")}>
                              {item.quantity}x
                            </div>
                          </div>
                          <div className={cn("flex-1 min-w-0 flex flex-col justify-between py-1", isRTL ? "text-right" : "text-left")}>
                            <div className={cn("flex justify-between items-start gap-2", isRTL && "flex-row-reverse")}>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm truncate uppercase tracking-tight">
                                  {itemName}
                                </h4>
                                {variantName && (
                                  <p className="text-[10px] text-primary font-black uppercase italic leading-none mt-1">
                                    {variantName}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => onRemove(item._id, item.selectedVariantId)}
                                className="text-white/20 hover:text-red-500 transition-colors shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className={cn("flex items-center justify-between mt-auto", isRTL && "flex-row-reverse")}>
                              <div className={cn("flex flex-col items-start", isRTL && "items-end")}>
                                <p className={cn("text-primary font-black italic", isRTL && "flex flex-row-reverse gap-1")}>
                                  {price * item.quantity} {t.egp}
                                </p>
                              </div>
                              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                                <button
                                  onClick={() => onUpdateQuantity(item._id, -1, item.selectedVariantId)}
                                  className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:border-primary transition-all"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="font-mono text-xs w-4 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item._id, 1, item.selectedVariantId)}
                                  className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:border-primary transition-all"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <form id="checkout-form" onSubmit={handleSubmit} className={cn("space-y-6", isRTL && "text-right")}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.fullName}</label>
                    <input
                      required
                      className={cn("w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm", isRTL && "text-right")}
                      placeholder={t.placeholderName}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.phoneWhatsapp}</label>
                    <input
                      required
                      type="tel"
                      className={cn("w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm", isRTL && "text-right")}
                      placeholder={t.placeholderPhone}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.deliveryAddress}</label>
                    <textarea
                      required
                      rows={3}
                      className={cn("w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm resize-none", isRTL && "text-right")}
                      placeholder={t.placeholderAddress}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.specialNotes}</label>
                    <input
                      className={cn("w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm", isRTL && "text-right")}
                      placeholder={t.placeholderNotes}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.location}</label>
                      <select
                        required
                        className={cn(
                          "w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm appearance-none cursor-pointer",
                          isRTL ? "text-right pr-5 pl-10" : "text-left pl-5 pr-10"
                        )}
                        value={selectedBranchId}
                        onChange={(e) => {
                          setSelectedBranchId(e.target.value);
                          setSelectedAreaId("");
                        }}
                      >
                        <option value="" disabled className="bg-[#0F0F0F]">{isRTL ? "اختر الفرع" : "Select Branch"}</option>
                        {(settings?.branches || []).map((branch) => (
                          <option key={branch.id} value={branch.id} className="bg-[#0F0F0F]">
                            {language === 'ar' ? branch.nameAr : branch.name}
                          </option>
                        ))}
                      </select>
                      <div className={cn("absolute bottom-4 pointer-events-none text-white/20", isRTL ? "left-4" : "right-4")}>
                        <Plus size={16} className="rotate-45" />
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.deliveryArea}</label>
                      <select
                        className={cn(
                          "w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm appearance-none cursor-pointer",
                          !selectedBranchId && "opacity-50 cursor-not-allowed",
                          isRTL ? "text-right pr-5 pl-10" : "text-left pl-5 pr-10"
                        )}
                        value={selectedAreaId}
                        onChange={(e) => setSelectedAreaId(e.target.value)}
                        disabled={!selectedBranchId}
                      >
                        <option value="" className="bg-[#0F0F0F]">{isRTL ? "منطقة التوصيل (اختياري)" : "Delivery Area (Optional)"}</option>
                        {(selectedBranch?.areas || []).map((area) => (
                          <option key={area.id} value={area.id} className="bg-[#0F0F0F]">
                            {language === 'ar' ? area.nameAr : area.name}
                          </option>
                        ))}
                      </select>
                      <div className={cn("absolute bottom-4 pointer-events-none text-white/20", isRTL ? "left-4" : "right-4")}>
                        <Plus size={16} className="rotate-45" />
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 md:p-6 bg-[#0F0F0F] border-t border-white/10 space-y-4">
                  <AnimatePresence>
                    {potentialOffers.map((pot) => {
                      // Find best item in category to suggest
                      const suggestItem = pot.category 
                        ? menuItems.filter(i => i.category === pot.category).sort((a,b) => a.price - b.price)[0]
                        : menuItems.sort((a,b) => a.price - b.price)[0];
                      
                      if (!suggestItem) return null;

                      return (
                        <motion.div
                          key={pot.offerId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 mb-2"
                        >
                          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                              <Plus size={20} className="text-primary" />
                            </div>
                            <div className={cn("flex-1", isRTL && "text-right")}>
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">
                                {isRTL ? "عرض متاح قريباً" : "Unlock this Offer"}
                              </p>
                              <p className="text-xs font-bold text-white/90 leading-tight">
                                {isRTL 
                                  ? `أضف ${pot.missingQuantity} قطع أخرى لتفعيل ${pot.titleAr}`
                                  : `Add ${pot.missingQuantity} more to activate ${pot.title}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              if (onAddToCart) {
                                for(let i=0; i<pot.missingQuantity; i++) {
                                  onAddToCart(suggestItem, e);
                                }
                              }
                            }}
                            className="w-full bg-primary/20 text-primary border border-primary/20 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                          >
                            {isRTL ? "إضافة الأصناف وتفعيل العرض" : "Add Items & Activate Sale"}
                          </button>
                        </motion.div>
                      );
                    })}

                    {discount > 0 && (
                      <motion.div
                        key="activated-banner"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-primary/15 border border-primary/30 rounded-2xl p-4 flex items-center gap-3 shadow-xl shadow-primary/5"
                      >
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0">
                          <ShoppingBag size={20} className="text-black" />
                        </div>
                        <div className={cn("flex-1", isRTL && "text-right")}>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">
                            {isRTL ? "تم تفعيل العرض!" : "Sale Activated!"}
                          </p>
                          <p className="text-sm font-bold text-white/90 leading-tight">
                            {isRTL ? "لقد وفرت مبللاً جيداً!" : "You've saved big on this order!"}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={cn("space-y-2 text-sm opacity-60", isRTL && "text-right")}>
                    <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                      <p>{t.subtotal}</p>
                      <p className={cn(isRTL && "flex flex-row-reverse gap-1")}>{subtotal} {t.egp}</p>
                    </div>
                  <AnimatePresence>
                    {discount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className={cn("flex justify-between text-green-500", isRTL && "flex-row-reverse")}>
                          <p className="font-bold">{isRTL ? "الخصومات" : "Discounts"}</p>
                          <p className={cn(isRTL && "flex flex-row-reverse gap-1")}>-{Math.round(discount)} {t.egp}</p>
                        </div>
                        <div className="space-y-1 mt-1">
                          {appliedOffers.map((offer, idx) => (
                            <motion.div 
                              key={offer.title || idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={cn("flex justify-between text-[10px] italic text-green-500/80", isRTL && "flex-row-reverse")}
                            >
                              <p>{language === 'ar' ? offer.titleAr : offer.title}</p>
                              <p>-{Math.round(offer.discountAmount)} {t.egp}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                    <p>{t.deliveryFee}</p>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      {appliedDeliveryFee === 0 && deliveryFee > 0 && (
                        <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-black uppercase italic tracking-tighter">
                          {t.freeDelivery}
                        </span>
                      )}
                      <p className={cn(appliedDeliveryFee === 0 && deliveryFee > 0 && "text-white/20 line-through h-[14px]", isRTL && "flex flex-row-reverse gap-1")}>
                        {deliveryFee} {t.egp}
                      </p>
                    </div>
                  </div>
                  <div className={cn("p-4 bg-primary/5 rounded-2xl border border-primary/10 mt-4", isRTL && "text-right")}>
                    <p className="text-[10px] md:text-xs font-black text-primary uppercase mb-1">
                      {isRTL ? "💡 ملحوظة بخصوص التوصيل:" : "💡 Delivery Note:"}
                    </p>
                    <p className="text-[9px] md:text-[10px] opacity-80 font-medium leading-relaxed italic">
                      {isRTL 
                        ? "قد يتغير سعر التوصيل بشكل بسيط حسب مسافة مكانك بالضبط وقت خروج الطيار." 
                        : "The final delivery fee might change slightly based on your exact location when the driver heads your way."}
                    </p>
                  </div>
                </div>

                <div className={cn("flex justify-between items-center text-3xl md:text-4xl font-display font-black text-primary italic", isRTL && "flex-row-reverse")}>
                  <span>{t.total}</span>
                  <motion.span 
                    key={total}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={cn(isRTL && "flex flex-row-reverse gap-2 items-baseline")}
                  >
                    {total} <span className="text-[10px] md:text-xs not-italic text-white opacity-40 uppercase">{t.egp}</span>
                  </motion.span>
                </div>
                
                {step === "items" ? (
                  <button
                    onClick={() => setStep("checkout")}
                    className="w-full bg-white text-black h-14 md:h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all outline-none"
                  >
                    {t.confirmOrderDetails}
                  </button>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {step === "checkout" ? (
                      <button
                        form="checkout-form"
                        type="submit"
                        className={cn("w-full bg-accent text-black h-14 md:h-16 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-transform", isRTL && "flex-row-reverse")}
                      >
                        <Send size={20} className={cn(isRTL && "rotate-[-135deg]")} />
                        <div className={cn(isRTL ? "text-right" : "text-left")}>
                          <p className="text-[8px] md:text-[10px] font-black uppercase leading-none">{t.confirmVia}</p>
                          <p className="text-lg md:text-xl font-black leading-none">WhatsApp</p>
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-center">
                          <p className="text-primary font-bold text-[10px] uppercase tracking-widest animate-pulse">
                            {t.waitingForConfirm}
                          </p>
                        </div>
                        <button
                          onClick={handleFinalConfirm}
                          className="w-full bg-primary text-black h-14 md:h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl"
                        >
                          {t.confirmSent}
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setStep("items")}
                      className="text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-white mt-1 py-3 px-4"
                    >
                      {isRTL ? "العودة للأصناف ←" : "← Back to Items"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
