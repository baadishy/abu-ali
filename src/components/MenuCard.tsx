import React from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { MenuItem } from "../types";
import { cn } from "../lib/utils";
import { useLanguage } from "../context/LanguageContext";

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, event: React.MouseEvent) => void;
  onClick: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onAddToCart, onClick }) => {
  const { t, language, isRTL } = useLanguage();
  const itemName = language === "ar" && item.nameAr ? item.nameAr : item.name;
  const itemDescription = language === "ar" && item.descriptionAr ? item.descriptionAr : item.description;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(item)}
      className={cn(
        "bg-card rounded-2xl p-4 border border-white/5 flex gap-4 hover:border-primary/50 transition-all group relative overflow-hidden cursor-pointer",
        isRTL && "flex-row-reverse"
      )}
    >
      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#1A1A1A] rounded-xl overflow-hidden shrink-0 relative">
        <img
          src={item.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=400"}
          alt={itemName}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {item.discountPrice !== undefined && item.discountPrice > 0 && (
          <div className="absolute top-2 left-2 bg-primary text-black text-[8px] font-black px-2 py-0.5 rounded shadow-lg shadow-primary/20 rotate-[-12deg]">
            SALE
          </div>
        )}
      </div>

      <div className={cn("flex flex-col justify-between flex-1 min-w-0", isRTL ? "text-right" : "text-left")}>
        <div>
          <h4 className="font-display font-black text-sm leading-tight uppercase tracking-tight truncate">
            {itemName}
          </h4>
          <p className="text-white/40 text-[10px] line-clamp-1 mt-1">
            {itemDescription}
          </p>
        </div>
        
        <div className="mt-2">
          <div className={cn("flex items-baseline gap-2", isRTL && "flex-row-reverse")}>
            <p className={cn("text-primary font-black text-xl italic leading-none", isRTL && "flex flex-row-reverse justify-end gap-1")}>
              {item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price}<span className="text-[10px] font-normal not-italic opacity-60">{t.egp}</span>
            </p>
            {item.discountPrice !== undefined && item.discountPrice > 0 && item.price > 0 && (
              <p className="text-white/20 line-through text-[10px] font-mono leading-none">{item.price}</p>
            )}
          </div>
        </div>

        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            if (item.variants && item.variants.length > 0) {
              onClick(item);
            } else {
              onAddToCart(item, e); 
            }
          }}
          className={cn("text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors mt-2", isRTL ? "text-right" : "text-left")}
        >
          {item.variants && item.variants.length > 0 ? (isRTL ? "اختر المقاس" : "Select Size") : t.quickAdd}
        </button>
      </div>
    </motion.div>
  );
}
