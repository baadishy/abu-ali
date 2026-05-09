import React from "react";
import { ShoppingCart, Menu as MenuIcon, X, Phone, User, Home, UtensilsCrossed, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

import { useLanguage } from "../context/LanguageContext";

import { MenuItem, Category, SiteSettings } from "../types";

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  settings: SiteSettings | null;
}

export function Navbar({ cartCount, onOpenCart, settings }: NavbarProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [activePath, setActivePath] = React.useState(window.location.pathname + window.location.hash);
  const { t, language, setLanguage, isRTL } = useLanguage();
  const isAdminLoggedIn = typeof window !== 'undefined' ? localStorage.getItem("admin-token") === "admin-session-token" : false;

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    const handleLocationChange = () => {
      setActivePath(window.location.pathname + window.location.hash);
    };

    // Intersection Observer for Menu Section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.history.replaceState(null, "", "#menu");
            setActivePath(window.location.pathname + "#menu");
          } else if (window.location.hash === "#menu") {
            window.history.replaceState(null, "", " ");
            setActivePath(window.location.pathname);
          }
        });
      },
      { threshold: 0.5 }
    );

    const menuSection = document.getElementById("menu");
    if (menuSection) observer.observe(menuSection);

    window.addEventListener("scroll", handleScroll);
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      if (menuSection) observer.unobserve(menuSection);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setActivePath(path);
    setIsMobileMenuOpen(false);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname !== "/") {
      window.history.pushState({}, '', '/#menu');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      const element = document.getElementById("menu");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-8 py-4",
        isScrolled || isMobileMenuOpen ? "bg-background/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      )}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-white/60 hover:text-white"
          >
            {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
          
          <div className="flex items-center gap-2 md:gap-4 cursor-pointer min-w-0" onClick={() => navigateTo('/')}>
            <div className="w-10 h-10 md:w-16 md:h-16 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group">
              <span className="text-black text-xl md:text-3xl font-black italic tracking-tighter transform group-hover:scale-110 transition-transform">A</span>
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-sm md:text-xl font-black tracking-tight uppercase leading-tight text-white truncate max-w-[120px] md:max-w-none">
                {language === "ar" ? (settings?.storeNameAr || settings?.storeName || t.brandName) : (settings?.storeName || t.brandName)}
              </h1>
              <p className="text-primary text-[7px] md:text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5 truncate">
                {t.locationName}
              </p>
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex gap-8 text-[10px] font-black uppercase tracking-widest opacity-80">
          <a 
            href="/" 
            onClick={(e) => { e.preventDefault(); navigateTo('/'); }} 
            className={cn("hover:text-primary transition-colors cursor-pointer", activePath === "/" && "text-primary opacity-100")}
          >
            Home
          </a>
          <a 
            href="#menu" 
            onClick={handleMenuClick}
            className={cn("hover:text-primary transition-colors", activePath.includes("#menu") && "text-primary opacity-100")}
          >
            {t.menu}
          </a>
          <a 
            href="/profile" 
            onClick={(e) => { e.preventDefault(); navigateTo('/profile'); }} 
            className={cn("hover:text-primary transition-colors cursor-pointer", activePath === "/profile" && "text-primary opacity-100")}
          >
            {t.profile}
          </a>
          {isAdminLoggedIn && (
            <a 
              href="/admin" 
              onClick={(e) => { e.preventDefault(); navigateTo('/admin'); }} 
              className={cn("text-accent hover:text-accent/80 transition-colors cursor-pointer", activePath === "/admin" && "opacity-100 underline decoration-2 underline-offset-4")}
            >
              ADMIN
            </a>
          )}
        </nav>

        <div className="flex items-center gap-3 md:gap-6 justify-end flex-1">
          <button 
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            className="text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-1.5 rounded-full border border-white/10 hover:border-primary transition-all whitespace-nowrap"
          >
            {language === "en" ? "العربية" : "English"}
          </button>

          <div className="hidden sm:block text-right whitespace-nowrap">
            <p className="text-[10px] uppercase opacity-40 leading-none">{t.availableUntil}</p>
            <p className="text-xs font-mono font-bold mt-1">02:00 AM</p>
          </div>
          
          <motion.button
            id="cart-button"
            onClick={onOpenCart}
            key={cartCount}
            initial={false}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.2 }}
            className="relative h-10 w-10 md:h-11 md:w-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-all group shrink-0"
            aria-label="Open cart"
          >
            <ShoppingCart className="text-white group-hover:text-primary transition-colors" size={20} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-[#D90429] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-white/10 p-6 space-y-6 shadow-2xl"
          >
            <div className={cn("grid grid-cols-1 gap-4", isRTL && "text-right")}>
              <button 
                onClick={() => navigateTo('/')}
                className={cn("flex items-center gap-4 text-sm font-black uppercase tracking-widest hover:text-primary transition-colors", activePath === "/" && "text-primary")}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activePath === "/" ? "bg-primary/20 text-primary" : "bg-white/5")}>
                  <Home size={18} />
                </div>
                <span>Home</span>
              </button>
              <a 
                href="#menu" 
                onClick={handleMenuClick}
                className={cn("flex items-center gap-4 text-sm font-black uppercase tracking-widest hover:text-white transition-colors", activePath.includes("#menu") ? "text-primary" : "text-white")}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activePath.includes("#menu") ? "bg-primary/20 text-primary" : "bg-white/5")}>
                  <UtensilsCrossed size={18} />
                </div>
                <span>{t.menu}</span>
              </a>
              <button 
                onClick={() => navigateTo('/profile')}
                className={cn("flex items-center gap-4 text-sm font-black uppercase tracking-widest hover:text-primary transition-colors", activePath === "/profile" && "text-primary")}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activePath === "/profile" ? "bg-primary/20 text-primary" : "bg-white/5")}>
                  <User size={18} />
                </div>
                <span>{t.profile}</span>
              </button>

              {isAdminLoggedIn && (
                <button 
                  onClick={() => navigateTo('/admin')}
                  className={cn("flex items-center gap-4 text-sm font-black uppercase tracking-widest hover:text-accent transition-colors", activePath === "/admin" && "text-accent")}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activePath === "/admin" ? "bg-accent/20 text-accent" : "bg-white/5")}>
                    <Package size={18} />
                  </div>
                  <span>Admin Panel</span>
                </button>
              )}
            </div>
            
            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="text-[10px] uppercase opacity-40 font-black tracking-widest">
                Support
              </div>
              <a href={`tel:${settings?.branches?.[0]?.phones?.[0] || '01511223344'}`} className="flex items-center gap-2 text-primary font-mono text-sm font-bold">
                <Phone size={14} />
                {settings?.branches?.[0]?.phones?.[0] || '01511223344'}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
