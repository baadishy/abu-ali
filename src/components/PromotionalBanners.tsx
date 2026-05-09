import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { PromotionalOffer } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/utils";

interface PromotionalBannersProps {
  offers?: PromotionalOffer[];
}

export function PromotionalBanners({ offers = [] }: PromotionalBannersProps) {
  const { language, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const activeOffers = offers.filter(o => o.isActive);

  React.useEffect(() => {
    if (activeOffers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeOffers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeOffers.length]);

  if (activeOffers.length === 0) return null;

  const next = () => setCurrentIndex(prev => (prev + 1) % activeOffers.length);
  const prev = () => setCurrentIndex(prev => (prev - 1 + activeOffers.length) % activeOffers.length);

  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 md:pt-16">
      <div className="relative group rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-[#1A1A1A] border border-white/5 aspect-[4/5] sm:aspect-video lg:aspect-[21/9] xl:aspect-[21/7]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeOffers[currentIndex].id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-10" />
            
            <div className={cn(
              "absolute top-6 md:top-10 z-30",
              isRTL ? "right-6 md:right-10" : "left-6 md:left-10"
            )}>
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                  <Zap className="text-primary fill-primary" size={16} />
                </div>
                <div className={isRTL ? "text-right" : "text-left"}>
                  <p className="text-primary text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">Exclusive</p>
                  <p className="text-white text-[10px] md:text-sm font-black uppercase tracking-[0.1em] leading-none italic">
                    {isRTL ? "عرض خاص" : "Featured"}
                  </p>
                </div>
              </div>
            </div>

            {activeOffers[currentIndex].image ? (
              <img 
                src={activeOffers[currentIndex].image} 
                alt={language === "ar" ? activeOffers[currentIndex].titleAr : activeOffers[currentIndex].title}
                className="w-full h-full object-cover object-center"
              />
            ) : null}
            
            <div className={cn(
              "absolute inset-0 z-20 p-6 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-end items-center text-center",
            )}>
              <div className="max-w-4xl space-y-4 md:space-y-6">
                {/* Only show title/description if they exist to avoid empty boxes overlapping image text */}
                {(language === "ar" ? activeOffers[currentIndex].titleAr : activeOffers[currentIndex].title) && (
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black italic uppercase tracking-tighter text-white break-words"
                  >
                    {language === "ar" ? activeOffers[currentIndex].titleAr : activeOffers[currentIndex].title}
                  </motion.h2>
                )}
                
                {(language === "ar" ? activeOffers[currentIndex].descriptionAr : activeOffers[currentIndex].description) && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/80 text-xs sm:text-sm md:text-lg lg:text-xl font-medium max-w-2xl mx-auto line-clamp-2 sm:line-clamp-none"
                  >
                    {language === "ar" ? activeOffers[currentIndex].descriptionAr : activeOffers[currentIndex].description}
                  </motion.p>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="pt-2"
                >
                  <button 
                    onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white text-black px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-xl"
                  >
                    {isRTL ? "اطلب الآن" : "Order Now"}
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {activeOffers.length > 1 && (
          <>
            <div className={cn(
              "absolute bottom-6 md:bottom-8 z-30 flex items-center gap-3 md:gap-4",
              isRTL ? "left-6 md:left-8" : "right-6 md:right-8"
            )}>
              <button 
                onClick={prev} 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all bg-black/20 backdrop-blur-md"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={next} 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all bg-black/20 backdrop-blur-md"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
              {activeOffers.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-1 transition-all duration-500 rounded-full",
                    idx === currentIndex ? "w-12 bg-primary" : "w-4 bg-white/20"
                  )} 
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
