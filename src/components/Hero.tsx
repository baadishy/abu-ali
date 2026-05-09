import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Star } from "lucide-react";
import { cn } from "../lib/utils";

import { useLanguage } from "../context/LanguageContext";
import { SiteSettings, MenuItem } from "../types";

 interface HeroProps {
  settings: SiteSettings | null;
  featuredItem?: MenuItem | null;
  onAddToCart?: (item: MenuItem, event: React.MouseEvent) => void;
  isLoading?: boolean;
}

export function Hero({ settings, featuredItem, onAddToCart, isLoading }: HeroProps) {
  const { t, isRTL, language } = useLanguage();
  
  const brandName = language === "ar" ? (settings?.storeNameAr || settings?.storeName || t.brandName) : (settings?.storeName || t.brandName);
  const splitName = brandName.split(" ");
  // For Arabic, we might want different split logic, but for now just show full name if it's one word or special handling
  const firstName = splitName[0];
  const restName = splitName.slice(1).join(" ");

  const displayName = featuredItem ? (language === "ar" ? featuredItem.nameAr : featuredItem.name) : (firstName + (restName ? " " + restName : ""));
  const displayDescription = featuredItem ? (language === "ar" ? featuredItem.descriptionAr : featuredItem.description) : t.heroSubtitle;
  const displayPrice = featuredItem ? (featuredItem.discountPrice || featuredItem.price) : 185;
  const displayImage = featuredItem?.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=1200";
  
  if (isLoading) {
    return (
      <section className="relative pt-24 md:pt-32 pb-10 overflow-hidden">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="relative bg-[#1A1A1A] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 min-h-[450px] md:min-h-[400px] flex flex-col md:flex-row items-center border border-white/5 animate-pulse">
            <div className="flex-1 space-y-6">
              <div className="w-24 h-6 bg-white/5 rounded" />
              <div className="w-3/4 h-16 bg-white/5 rounded-2xl" />
              <div className="w-1/2 h-4 bg-white/5 rounded" />
              <div className="w-32 h-12 bg-white/5 rounded-full" />
            </div>
            <div className="flex-1 w-full h-64 bg-white/5 rounded-3xl mt-10 md:mt-0" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative pt-24 md:pt-32 pb-10 overflow-hidden"
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className={cn("relative bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 lg:p-20 min-h-[450px] md:min-h-[400px] lg:min-h-[600px] flex flex-col md:flex-row items-center overflow-hidden border border-white/5 shadow-2xl", isRTL && "md:flex-row-reverse")}>
          <div className={cn("flex-1 z-10 relative w-full", isRTL ? "text-right" : "text-left")}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-primary text-black text-[10px] font-black px-3 py-1 rounded uppercase mb-4 md:mb-6"
            >
              <Star size={10} fill="currentColor" />
              <span>{featuredItem ? (isRTL ? "ساندوتش اليوم" : "Hero Sandwich") : t.bestSeller}</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-black leading-[0.9] uppercase italic tracking-tighter mb-4 md:mb-6 break-words"
            >
              {featuredItem ? (
                displayName
              ) : (
                <>
                  {firstName} <br />
                  <span className="text-primary">{restName}</span>
                </>
              )}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/60 text-xs sm:text-sm md:text-lg max-w-md mb-6 md:mb-8 leading-relaxed"
            >
              {displayDescription}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn("flex items-center gap-4 md:gap-6", isRTL && "flex-row-reverse justify-end")}
            >
              <div className="flex flex-col">
                <span className="text-3xl md:text-4xl font-black text-primary italic flex items-baseline gap-1" dir="ltr">
                {displayPrice}<span className="text-[10px] not-italic opacity-60 font-mono">{t.egp}</span>
              </span>
              </div>
              {featuredItem ? (
                <button
                  onClick={(e) => onAddToCart?.(featuredItem, e)}
                  className="bg-white text-black px-8 md:px-10 py-3 md:py-4 rounded-full text-xs md:text-sm font-black uppercase hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95 whitespace-nowrap"
                >
                  {t.addToCart}
                </button>
              ) : (
                <a
                  href="#menu"
                  className="bg-white text-black px-8 md:px-10 py-3 md:py-4 rounded-full text-xs md:text-sm font-black uppercase hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95 whitespace-nowrap"
                >
                  {t.addToCart}
                </a>
              )}
            </motion.div>
          </div>

          <div className="flex-1 relative h-64 md:h-full w-full mt-10 md:mt-0 flex justify-center items-center">
             <div className="absolute inset-0 md:-right-20 md:-bottom-20 w-64 h-64 md:w-[500px] md:h-[500px] opacity-40 mix-blend-screen overflow-hidden mx-auto">
              <div className="w-full h-full bg-primary rounded-full blur-[80px] md:blur-[100px]"></div>
            </div>
            <motion.img
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              src={displayImage}
              alt={displayName}
              loading="eager"
              className="relative z-10 w-full h-full max-h-[300px] md:max-h-full object-contain filter drop-shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
