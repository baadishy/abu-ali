import React from "react";
import { X, ShoppingBag, Info, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MenuItem } from "../types";
import { cn } from "../lib/utils";
import { useLanguage } from "../context/LanguageContext";

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, event: React.MouseEvent, variantId?: string) => void;
}

export function ItemDetailModal({ item, onClose, onAddToCart }: ItemDetailModalProps) {
  const { t, language, isRTL } = useLanguage();
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (item?.variants && item.variants.length > 0) {
      setSelectedVariantId(item.variants[0].id);
    } else {
      setSelectedVariantId(undefined);
    }
  }, [item]);

  if (!item) return null;

  const itemName = language === "ar" && item.nameAr ? item.nameAr : item.name;
  const itemDescription = language === "ar" && item.descriptionAr ? item.descriptionAr : item.description;

  const selectedVariant = item.variants?.find(v => v.id === selectedVariantId);
  const displayPrice = selectedVariant ? selectedVariant.price : (item.discountPrice !== undefined && item.discountPrice > 0 ? item.discountPrice : item.price);
  const originalPrice = selectedVariant ? undefined : (item.discountPrice !== undefined && item.discountPrice > 0 ? item.price : undefined);

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-[#1A1A1A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-20 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className={cn("flex flex-col md:flex-row", isRTL && "md:flex-row-reverse")}>
              <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden bg-[#121212]">
                <img
                  src={item.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=800"}
                  alt={itemName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
              </div>

              <div className={cn("flex-1 p-8 md:p-10 flex flex-col justify-between", isRTL && "text-right font-arabic")}>
                <div>
                  <div className={cn("flex items-center gap-2 mb-4", isRTL && "flex-row-reverse")}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-display font-black uppercase italic tracking-tight mb-4">
                    {itemName}
                  </h2>
                  
                  <div className="space-y-4 mb-8">
                    <p className="text-white/60 leading-relaxed text-sm md:text-base">
                      {itemDescription || "No description available for this item."}
                    </p>
                  </div>

                  {item.variants && item.variants.length > 0 ? (
                    <div className="space-y-4 mb-8">
                      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Select Size</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={cn(
                              "px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border",
                              selectedVariantId === v.id
                                ? "bg-primary text-black border-primary"
                                : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
                            )}
                          >
                            {language === "ar" ? v.nameAr : v.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6 pt-6 border-t border-white/5">
                  <div className={cn("flex items-baseline gap-2", isRTL && "flex-row-reverse")}>
                    <span className="text-4xl font-display font-black text-primary italic">
                      {displayPrice}
                    </span>
                    <span className="text-sm font-black uppercase opacity-40">{t.egp}</span>
                    {originalPrice !== undefined && originalPrice > 0 && (
                      <span className="text-lg line-through opacity-20 ml-2 font-mono">{originalPrice}</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      onAddToCart(item, e, selectedVariantId);
                      onClose();
                    }}
                    className="w-full bg-primary text-black h-16 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all font-black uppercase tracking-widest text-xs"
                  >
                    <ShoppingBag size={18} />
                    {t.addToCart}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
