import React, { Component, ReactNode } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { MenuCard } from "./components/MenuCard";
import { Cart } from "./components/Cart";
import { CategoryFilter } from "./components/CategoryFilter";
import { PromotionalBanners } from "./components/PromotionalBanners";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { MenuItem, CartItem, Category, SiteSettings } from "./types";
import { calculateOrderTotals } from "./lib/promoUtils";
import { motion, AnimatePresence } from "motion/react";

const Admin = React.lazy(() =>
  import("./components/Admin").then((m) => ({ default: m.Admin })),
);
const Profile = React.lazy(() =>
  import("./components/Profile").then((m) => ({ default: m.Profile })),
);
const About = React.lazy(() =>
  import("./components/About").then((m) => ({ default: m.About })),
);

import { cn } from "./lib/utils";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { NotificationProvider, useNotification } from "./NotificationContext";

const CATEGORIES: Category[] = ["Burger", "Meals", "Fries", "Drinks"];

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut",
      }}
      className="w-16 h-16 bg-primary rounded-3xl shadow-2xl shadow-primary/20 flex items-center justify-center"
    >
      <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
    </motion.div>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8 text-primary font-black uppercase italic tracking-widest text-xs"
    >
      Loading Burger Station...
    </motion.p>
  </div>
);

function AppContent() {
  const { t, language, isRTL } = useLanguage();
  const { showNotification } = useNotification();
  const [currentPath, setCurrentPath] = React.useState(
    window.location.pathname,
  );
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("burger_station_cart");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<Category | "All">(
    "All",
  );
  const [settings, setSettings] = React.useState<SiteSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [flies, setFlies] = React.useState<
    {
      id: string;
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      image: string;
    }[]
  >([]);

  React.useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);

    const init = async () => {
      setLoading(true);
      await Promise.all([fetchMenuItems(), fetchSettings()]);
      setLoading(false);
    };
    init();

    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  React.useEffect(() => {
    localStorage.setItem("burger_station_cart", JSON.stringify(cart));
  }, [cart]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) {
        const text = await res.text();
        console.error(
          `Settings fetch failed (${res.status}):`,
          text.slice(0, 500),
        );
        return;
      }
      const data = await res.json();
      if (data && data.branches) {
        data.branches = data.branches.map((b: any) => ({
          ...b,
          deliveryFee: b.deliveryFee ?? data.defaultDeliveryFee ?? 0,
          areas: b.areas ?? [],
        }));
      }
      setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  React.useEffect(() => {
    if (window.location.hash === "#menu" && !loading && currentPath === "/") {
      setTimeout(() => {
        const element = document.getElementById("menu");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [loading, currentPath]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu");
      if (!response.ok) {
        const text = await response.text();
        console.error(
          `Menu fetch failed (${response.status}):`,
          text.slice(0, 500),
        );
        return;
      }
      const data = (await response.json()) as MenuItem[];
      setMenuItems(data);
    } catch (err) {
      console.error("Error fetching menu:", err);
    }
  };

  const isAdmin = currentPath === "/admin";
  const isProfile = currentPath === "/profile";

  if (isAdmin) {
    return (
      <div
        className={cn(
          "min-h-screen bg-background text-white selection:bg-primary selection:text-black pt-4",
          isRTL && "font-arabic",
        )}
      >
        <Navbar cartCount={0} onOpenCart={() => {}} settings={settings} />
        <React.Suspense fallback={<PageLoader />}>
          <Admin />
        </React.Suspense>
      </div>
    );
  }

  if (isProfile) {
    return (
      <div
        className={cn(
          "min-h-screen bg-background text-white selection:bg-primary selection:text-black pt-4",
          isRTL && "font-arabic",
        )}
      >
        <Navbar cartCount={0} onOpenCart={() => {}} settings={settings} />
        <React.Suspense fallback={<PageLoader />}>
          <Profile />
        </React.Suspense>
      </div>
    );
  }

  const addToCart = (
    item: MenuItem,
    event?: React.MouseEvent,
    variantId?: string,
  ) => {
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const cartBtn = document.getElementById("cart-button");
      const cartRect = cartBtn?.getBoundingClientRect();

      const id = Math.random().toString(36).substr(2, 9);
      setFlies((prev) => [
        ...prev,
        {
          id,
          x: rect.left,
          y: rect.top,
          targetX: cartRect
            ? cartRect.left
            : isRTL
              ? 40
              : window.innerWidth - 80,
          targetY: cartRect ? cartRect.top : 40,
          image: item.image || null,
        },
      ]);

      setTimeout(() => {
        setFlies((prev) => prev.filter((f) => f.id !== id));
      }, 800);
      showNotification(
        "success",
        isRTL ? "تمت الإضافة للسلة!" : "Added to Cart!",
      );
    }

    setCart((prev) => {
      const existing = prev.find(
        (i) => i._id === item._id && i.selectedVariantId === variantId,
      );
      if (existing) {
        return prev.map((i) =>
          i._id === item._id && i.selectedVariantId === variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { ...item, quantity: 1, selectedVariantId: variantId }];
    });
  };

  const updateQuantity = (id: string, delta: number, variantId?: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item._id === id && item.selectedVariantId === variantId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item._id === id && item.selectedVariantId === variantId),
      ),
    );
  };

  const submitOrder = async (orderData: {
    name: string;
    phone: string;
    address: string;
    notes: string;
    deliveryFee: number;
    location: string;
    branchId: string;
    areaId?: string;
  }) => {
    const selectedBranch = settings?.branches?.find(
      (b) => b.id === orderData.branchId,
    );
    const branchPhone = selectedBranch?.phones?.[0]?.replace(/[^0-9]/g, "");
    const defaultWhatsapp = settings?.socialLinks?.whatsapp?.replace(
      /[^0-9]/g,
      "",
    );

    const rawWhatsapp = branchPhone || defaultWhatsapp || "201559993943";
    const whatsappNumber = rawWhatsapp.startsWith("2")
      ? rawWhatsapp
      : "2" + rawWhatsapp;

    const {
      subtotal: rawSubtotal,
      discount,
      total: subtotalAfterDiscount,
      appliedOffers,
    } = calculateOrderTotals(cart, settings, orderData.branchId);

    const isFreeDelivery =
      settings?.freeDeliveryThreshold &&
      subtotalAfterDiscount >= settings.freeDeliveryThreshold;
    const finalDeliveryFee = isFreeDelivery ? 0 : orderData.deliveryFee;
    const total = subtotalAfterDiscount + finalDeliveryFee;

    try {
      const selectedBranch = settings?.branches?.find(
        (b) => b.id === orderData.branchId,
      );
      const selectedArea = selectedBranch?.areas?.find(
        (a) => a.id === orderData.areaId,
      );

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: orderData.name,
          phone: orderData.phone,
          address: orderData.address,
          notes: orderData.notes,
          items: cart.map((i) => {
            const variant = i.variants?.find(
              (v) => v.id === i.selectedVariantId,
            );
            const variantSuffix = variant
              ? ` (${language === "ar" ? variant.nameAr : variant.name})`
              : "";
            return {
              name: i.name + variantSuffix,
              price: variant
                ? variant.price
                : i.discountPrice && i.discountPrice > 0
                  ? i.discountPrice
                  : i.price,
              quantity: i.quantity,
            };
          }),
          subtotal: rawSubtotal,
          discount: discount,
          deliveryFee: finalDeliveryFee,
          selectedArea: orderData.location,
          branchId: orderData.branchId,
          branchName: selectedBranch?.name || "",
          branchNameAr: selectedBranch?.nameAr || "",
          areaId: orderData.areaId,
          areaName: selectedArea?.name || "",
          areaNameAr: selectedArea?.nameAr || "",
          total: total,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save order on server");
      }

      const customerResponse = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: orderData.phone,
          name: orderData.name,
          address: orderData.address,
          notes: orderData.notes,
          branchId: orderData.branchId,
          areaId: orderData.areaId,
        }),
      });

      if (!customerResponse.ok) {
        console.warn("Failed to update customer info, but order was saved");
      }

      // Save user info for future use
      localStorage.setItem("burger_station_phone", orderData.phone);
      localStorage.setItem("burger_station_name", orderData.name);
      localStorage.setItem("burger_station_address", orderData.address);
      localStorage.setItem("burger_station_area", orderData.areaId || "");
      localStorage.setItem("burger_station_location_name", orderData.location);
    } catch (err) {
      console.error("Failed to save order", err);
      showNotification(
        "error",
        isRTL
          ? "فشل إرسال الطلب. يرجى المحاولة مرة أخرى."
          : "Failed to send order. Please try again.",
      );
      return;
    }

    const customerPhone = orderData.phone.startsWith("2")
      ? orderData.phone
      : "2" + orderData.phone;

    let currentStoreName =
      language === "ar"
        ? settings?.storeNameAr || settings?.storeName || t.brandName
        : settings?.storeName || t.brandName;
    let message = `*${t.whatsappOrderTitle} - ${currentStoreName}*\n`;
    message += `--------------------------\n`;
    message += `👤 *${t.customer}:* ${orderData.name}\n`;
    message += `📞 *${t.phoneLabel}:* ${customerPhone}\n`;
    message += `📍 *${t.addressLabel}:* ${orderData.address}\n`;
    message += `📦 *${t.location}:* ${orderData.location}\n`;
    if (orderData.notes)
      message += `📝 *${t.notesLabel}:* ${orderData.notes}\n`;
    message += `--------------------------\n`;
    message += `*${t.itemsLabel}:*\n`;

    cart.forEach((item) => {
      const itemName =
        language === "ar" && item.nameAr ? item.nameAr : item.name;
      const variant = item.variants?.find(
        (v) => v.id === item.selectedVariantId,
      );
      const variantName = variant
        ? ` (${language === "ar" ? variant.nameAr : variant.name})`
        : "";
      const price = variant
        ? variant.price
        : item.discountPrice && item.discountPrice > 0
          ? item.discountPrice
          : item.price;
      message += `- ${item.quantity}x ${itemName}${variantName} (${price * item.quantity} ${t.egp})\n`;
    });

    message += `--------------------------\n`;
    if (finalDeliveryFee > 0) {
      message += `🚚 *${t.deliveryFee}:* ${finalDeliveryFee} ${t.egp}\n`;
    } else if (isFreeDelivery) {
      message += `🚚 *${t.deliveryFee}:* ${t.freeDelivery || "Free"}\n`;
    }
    message += `💰 *${t.totalLabel}:* ${total} ${t.egp}\n`;
    message += `--------------------------\n`;
    message += `_${t.sentVia} - ${currentStoreName}_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodedMessage}`,
      "_blank",
    );
    setCart([]);
    setIsCartOpen(false);
    showNotification(
      "success",
      isRTL ? "تم إرسال طلبك بنجاح!" : "Order sent successfully!",
    );
  };

  const filteredItems =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  const featuredItem = settings?.featuredItemId
    ? menuItems.find((item) => item._id === settings.featuredItemId)
    : null;

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-white selection:bg-primary selection:text-black overflow-x-hidden",
        isRTL && "font-arabic",
      )}
    >
      <Navbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
      />

      <main>
        <Hero
          settings={settings}
          featuredItem={featuredItem}
          onAddToCart={addToCart}
          isLoading={loading}
        />

        {settings?.offers && settings.offers.length > 0 ? (
          <PromotionalBanners offers={settings.offers} />
        ) : null}

        <section
          id="menu"
          className="max-w-screen-2xl mx-auto px-4 md:px-8 py-16 md:py-20 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-2 flex items-center gap-3 md:gap-4 italic uppercase">
                <span className="w-2 md:w-3 h-2 md:h-3 bg-primary rounded-full glow-orange"></span>
                {t.popularItems}
              </h2>
              <p className="text-white/40 text-[10px] md:text-xs uppercase tracking-widest font-black">
                {t.categorySubtitle}
              </p>
            </div>
            <CategoryFilter
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white/5 rounded-2xl h-32 border border-white/5"
                />
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 md:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item: MenuItem) => (
                  <MenuCard
                    key={item._id}
                    item={item}
                    onAddToCart={addToCart}
                    onClick={setSelectedItem}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && filteredItems.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-[2rem]">
              <p className="text-white/20 font-black uppercase tracking-widest italic text-xl">
                {t.noFuel}
              </p>
            </div>
          ) : null}
        </section>

        <React.Suspense
          fallback={
            <div className="py-20 text-center text-white/20 uppercase font-black italic">
              Loading About...
            </div>
          }
        >
          <About settings={settings} />
        </React.Suspense>
      </main>

      <footer className="bg-black/50 border-t border-white/5 py-8 md:py-16">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] text-white/40 text-center md:text-left">
            <div className="order-2 md:order-1">
              © {new Date().getFullYear()}{" "}
              {settings?.storeName || "Burger Station"}.{" "}
              {isRTL ? "جميع الحقوق محفوظة." : "All Rights Reserved."}
            </div>

            <div
              className={cn(
                "flex flex-wrap justify-center gap-4 md:gap-10 order-1 md:order-2",
                isRTL && "flex-row-reverse",
              )}
            >
              {settings?.socialLinks.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {t.facebook}
                </a>
              )}
              {settings?.socialLinks.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {t.instagram}
                </a>
              )}
              {settings?.socialLinks.whatsapp && (
                <a
                  href={`https://wa.me/${settings.socialLinks.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <span className="opacity-40">{t.directCall}:</span>
                  <span dir="ltr">{settings.socialLinks.whatsapp}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onSubmitOrder={submitOrder}
        settings={settings}
        menuItems={menuItems}
        onAddToCart={addToCart}
      />

      <AnimatePresence>
        {flies.map((fly) => (
          <motion.div
            key={fly.id}
            initial={{ left: fly.x, top: fly.y, opacity: 1, scale: 1 }}
            animate={{
              left: fly.targetX,
              top: fly.targetY,
              opacity: 0,
              scale: 0.2,
              rotate: 360,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed z-[9999] pointer-events-none"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-2xl shadow-primary/50 bg-black">
              {fly.image ? (
                <img
                  src={fly.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  declare public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white p-8 text-center">
          <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-3xl font-black uppercase italic mb-4">
            Something went wrong
          </h1>
          <p className="text-white/40 max-w-md mb-8">
            The application encountered an unexpected error. Please try
            refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-black font-black px-8 py-4 rounded-2xl uppercase italic hover:scale-105 transition-transform"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
