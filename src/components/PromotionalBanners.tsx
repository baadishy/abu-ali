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
      <div className="relative group rounded-[2rem] md:rounded-[3.5rem] overflow-hidden bg-[#1A1A1A] border border-white/5 aspect-[4/5] sm:aspect-video lg:aspect-[21/9] xl:aspect-[25/9] min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeOffers[currentIndex].id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent z-10 hidden lg:block" />
            
            {activeOffers[currentIndex].image ? (
              <img 
                src={activeOffers[currentIndex].image} 
                alt={language === "ar" ? activeOffers[currentIndex].titleAr : activeOffers[currentIndex].title}
                className="w-full h-full object-cover object-center transition-transform duration-[10s] ease-linear scale-105 group-hover:scale-100"
              />
            ) : null}
            
            <div className={cn(
              "absolute inset-0 z-20 p-6 sm:p-10 md:p-16 lg:p-20 flex flex-col justify-end lg:justify-center overflow-hidden",
              isRTL ? "right-0 text-right items-end" : "left-0 text-left items-start"
            )}>
              <div className="max-w-full lg:max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn("flex items-center gap-3 mb-4 md:mb-6", isRTL && "flex-row-reverse")}
                >
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center glow-orange shrink-0">
                    <Zap className="text-black fill-black" size={20} />
                  </div>
                  <span className="text-primary font-black whitespace-nowrap uppercase tracking-[0.4em] text-[10px] md:text-sm">Featured Offer</span>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-black italic uppercase tracking-tighter mb-4 md:mb-6 leading-[0.9] text-white break-words"
                >
                  {language === "ar" ? activeOffers[currentIndex].titleAr : activeOffers[currentIndex].title}
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/70 text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-medium leading-relaxed mb-6 md:mb-8 max-w-xl md:max-w-2xl xl:max-w-4xl line-clamp-3 md:line-clamp-none whitespace-normal"
                >
                  {language === "ar" ? activeOffers[currentIndex].descriptionAr : activeOffers[currentIndex].description}
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <button 
                    onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white text-black px-6 sm:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-sm hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/50"
                  >
                    {isRTL ? "اطلب الآن" : "Order This Now"}
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
