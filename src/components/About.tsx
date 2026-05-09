import React from "react";
import { motion } from "motion/react";
import { MapPin, Phone, MessageCircle, Instagram, Facebook, Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/utils";
import { SiteSettings } from "../types";

interface AboutProps {
  settings: SiteSettings | null;
}

export function About({ settings }: AboutProps) {
  const { t, language, isRTL } = useLanguage();

  return (
    <section id="about" className="max-w-screen-2xl mx-auto px-4 md:px-8 py-16 md:py-24 border-t border-white/5">
      <div className={cn("space-y-16", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
        <div className={cn("max-w-3xl", isRTL ? "text-right" : "text-left")}>
          <h2 className={cn("text-3xl md:text-5xl font-display font-black mb-6 uppercase tracking-tighter italic")}>
            {t.aboutTitle}
          </h2>
          <p className={cn("text-white/60 text-sm md:text-lg leading-relaxed")}>
            {t.aboutDescription}
          </p>
        </div>

        <div className="space-y-12">
          <h3 className="text-lg md:text-xl font-black text-primary uppercase tracking-widest">{t.ourLocation}</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {(settings?.branches || []).map((branch) => (
              <motion.div 
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card/50 border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-6 md:gap-8 hover:border-primary/20 transition-all group"
              >
                <div className="flex-1 space-y-5 md:space-y-6">
                  <div>
                    <h4 className="text-xl md:text-2xl font-black italic uppercase mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {language === "ar" ? branch.nameAr : branch.name}
                    </h4>
                    <div className="flex items-start gap-3 opacity-60">
                      <MapPin size={16} className="shrink-0 mt-1 text-primary" />
                      <p className="text-xs md:text-sm font-bold leading-relaxed line-clamp-2 md:line-clamp-none">
                        {language === "ar" ? branch.addressAr : branch.address}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[8px] md:text-[10px] uppercase font-black opacity-30 tracking-widest">{t.phone}</p>
                    <div className="flex flex-wrap gap-3 md:gap-4">
                      {branch.phones.map((phone, idx) => (
                        <a 
                          key={idx}
                          href={`tel:${phone}`}
                          className="flex items-center gap-2 hover:text-primary transition-all group/phone"
                        >
                          <Phone size={14} className="text-primary group-hover/phone:scale-110 transition-transform" />
                          <span className="font-mono font-bold text-xs md:text-sm tracking-tighter">{phone}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {branch.mapUrl && (
                    <div className="pt-2 md:pt-4">
                      <a 
                        href={branch.mapUrl.includes('embed') ? branch.mapUrl.split('src="')[1]?.split('"')[0] || branch.mapUrl : branch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                      >
                        <Globe size={12} />
                        {t.getDirections}
                      </a>
                    </div>
                  )}
                </div>

                {branch.mapUrl && branch.mapUrl.includes('google.com/maps/embed') && (
                  <div className="w-full sm:w-48 lg:w-full xl:w-72 h-40 sm:h-auto lg:h-48 xl:h-auto rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shrink-0">
                    <iframe
                      src={branch.mapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </motion.div>
            ))}
            
            {(!settings?.branches || settings.branches.length === 0) && (
              <div className="lg:col-span-2 p-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-20 italic uppercase font-black">
                {isRTL ? "سيتم إضافة الفروع قريباً" : "Branches coming soon"}
              </div>
            )}
          </div>
        </div>

        <div className="pt-16 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
              <h4 className="text-primary font-black uppercase tracking-widest text-[10px]">{t.followUs}</h4>
              <div className="flex gap-4">
                {settings?.socialLinks.facebook && (
                  <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-black transition-all">
                    <Facebook size={20} />
                  </a>
                )}
                {settings?.socialLinks.instagram && (
                  <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-black transition-all">
                    <Instagram size={20} />
                  </a>
                )}
                {settings?.socialLinks.whatsapp && (
                  <a href={`https://wa.me/${settings.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-black transition-all">
                    <MessageCircle size={20} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

