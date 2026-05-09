import React from "react";
import { 
  Upload, Plus, Trash2, Camera, LogOut, Package, Users, 
  Utensils, Edit2, Check, X, RefreshCw, Settings as SettingsIcon, 
  Facebook, Instagram, Phone, MapPin, Globe, ChevronRight, ChevronDown, AlertTriangle,
  Zap, Languages, Save
} from "lucide-react";
import { MenuItem, Category, SiteSettings, Area, ItemVariant, PromotionalOffer } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../NotificationContext";
import { GoogleGenAI } from "@google/genai";

type AdminTab = "menu" | "orders" | "users" | "offers" | "settings";

interface Order {
  _id: string;
  customerName: string;
  phone: string;
  address: string;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  selectedArea: string;
  total: number;
  status: string;
  createdAt: string;
  notes?: string;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  updatedAt: string;
}

export function Admin() {
  const { t, language, isRTL } = useLanguage();
  const { showNotification } = useNotification();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [adminId, setAdminId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<AdminTab>("menu");

  React.useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'users') fetchCustomers();
      if (activeTab === 'menu') fetchItems();
    }
  }, [activeTab, isLoggedIn]);
  
  const [items, setItems] = React.useState<MenuItem[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [siteSettings, setSiteSettings] = React.useState<SiteSettings | null>(null);
  
  const [offerFormData, setOfferFormData] = React.useState<PromotionalOffer>({
    id: "",
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    image: "",
    imagePublicId: "",
    isActive: true,
    type: 'manual',
    buyQuantity: 0,
    getQuantity: 0,
    categoryLimit: undefined,
    discountValue: 0,
    branchIds: []
  });
  const [editingOfferId, setEditingOfferId] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
  const [confirmStatus, setConfirmStatus] = React.useState<{ orderId: string, status: string } | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [deliveryFeeUpdate, setDeliveryFeeUpdate] = React.useState<number>(0);
  const [genericConfirm, setGenericConfirm] = React.useState<{ title: string, message: string, onConfirm: () => void, isDangerous?: boolean } | null>(null);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [formData, setFormData] = React.useState({
    name: "",
    nameAr: "",
    price: 0,
    discountPrice: 0 as number | undefined,
    category: "Burger" as Category,
    image: "",
    imagePublicId: "",
    description: "",
    descriptionAr: "",
    isAvailable: true,
    variants: [
      { id: "default-single", name: "Single", nameAr: "سنجل", price: 0 }
    ] as ItemVariant[]
  });

  const [discountPercent, setDiscountPercent] = React.useState<number>(0);
  const [showSale, setShowSale] = React.useState(false);

  // Auto-translation logic for Menu Items
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name && !formData.nameAr) translateField('name', true);
      if (!formData.name && formData.nameAr) translateField('name', false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData.name, formData.nameAr]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.description && !formData.descriptionAr) translateField('description', true);
      if (!formData.description && formData.descriptionAr) translateField('description', false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData.description, formData.descriptionAr]);

  // Auto-translation logic for Offers
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (offerFormData.title && !offerFormData.titleAr) translateOfferField('title', true);
      if (!offerFormData.title && offerFormData.titleAr) translateOfferField('title', false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [offerFormData.title, offerFormData.titleAr]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (offerFormData.description && !offerFormData.descriptionAr) translateOfferField('description', true);
      if (!offerFormData.description && offerFormData.descriptionAr) translateOfferField('description', false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [offerFormData.description, offerFormData.descriptionAr]);

  const [expandedBranches, setExpandedBranches] = React.useState<Record<string, boolean>>({});
  
  // Auto-populate branchIds for new offers if empty
  React.useEffect(() => {
    if (siteSettings?.branches && !editingOfferId && offerFormData.branchIds.length === 0) {
      setOfferFormData(prev => ({
        ...prev,
        branchIds: siteSettings.branches.map(b => b.id)
      }));
    }
  }, [siteSettings?.branches, editingOfferId]);

  const toggleBranch = (id: string) => {
    setExpandedBranches(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Auto-translation logic for Store Name
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (siteSettings?.storeName && !siteSettings.storeNameAr) translateStoreName(true);
      if (!siteSettings?.storeName && siteSettings?.storeNameAr) translateStoreName(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [siteSettings?.storeName, siteSettings?.storeNameAr]);

  // Instant Auto-translation for Branches
  React.useEffect(() => {
    if (!siteSettings?.branches) return;
    const timers: NodeJS.Timeout[] = [];
    
    siteSettings.branches.forEach(branch => {
      // Name Auto-Translation
      const nameTimer = setTimeout(() => {
        if (branch.name && !branch.nameAr) translateBranchField(branch.id, 'name', true);
        if (!branch.name && branch.nameAr) translateBranchField(branch.id, 'name', false);
      }, 1000);

      // Address Auto-Translation
      const addrTimer = setTimeout(() => {
        if (branch.address && !branch.addressAr) translateBranchField(branch.id, 'address', true);
        if (!branch.address && branch.addressAr) translateBranchField(branch.id, 'address', false);
      }, 1200);

      timers.push(nameTimer, addrTimer);

      // Areas Auto-Translation
      (branch.areas || []).forEach(area => {
        const areaTimer = setTimeout(() => {
          if (area.name && !area.nameAr) translateAreaField(branch.id, area.id, 'name', true);
          if (!area.name && area.nameAr) translateAreaField(branch.id, area.id, 'name', false);
        }, 1500);
        timers.push(areaTimer);
      });
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, [JSON.stringify(siteSettings?.branches)]);

  // Auto-translation logic for Variants
  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    formData.variants.forEach(variant => {
      const timer = setTimeout(() => {
        if (variant.name && !variant.nameAr) {
          translateText(variant.name, 'en', 'ar').then(trans => {
            if (trans) updateVariant(variant.id, 'nameAr', trans);
          });
        }
        if (!variant.name && variant.nameAr) {
          translateText(variant.nameAr, 'ar', 'en').then(trans => {
            if (trans) updateVariant(variant.id, 'name', trans);
          });
        }
      }, 2000);
      timers.push(timer);
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [JSON.stringify(formData.variants)]);

  const calculateDiscountByPercent = (percent: number, basePrice: number) => {
    if (percent <= 0) return 0;
    const discount = (basePrice * percent) / 100;
    return Math.max(0, Math.floor(basePrice - discount));
  };

  const handlePercentChange = (percent: number) => {
    setDiscountPercent(percent);
    if (formData.price > 0) {
      setFormData(prev => ({ ...prev, discountPrice: calculateDiscountByPercent(percent, prev.price) }));
    }
  };

  const translateText = async (text: string, from: 'en' | 'ar', to: 'en' | 'ar') => {
    if (!text) return "";
    setLoading(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
      if (!res.ok) return "";
      const data = await res.json();
      return data?.responseData?.translatedText || "";
    } catch (err) {
      console.error(err);
      showNotification("error", "Translation failed");
      return "";
    } finally {
      setLoading(false);
    }
  };

  const translateOfferField = async (field: 'title' | 'description', toArabic: boolean) => {
    const text = field === 'title' 
      ? (toArabic ? offerFormData.title : offerFormData.titleAr) 
      : (toArabic ? offerFormData.description : offerFormData.descriptionAr);

    if (!text) return;
    const translated = await translateText(text, toArabic ? 'en' : 'ar', toArabic ? 'ar' : 'en');
    if (translated) {
      if (field === 'title') {
        if (toArabic) setOfferFormData(prev => ({ ...prev, titleAr: translated }));
        else setOfferFormData(prev => ({ ...prev, title: translated }));
      } else {
        if (toArabic) setOfferFormData(prev => ({ ...prev, descriptionAr: translated }));
        else setOfferFormData(prev => ({ ...prev, description: translated }));
      }
    }
  };

  const translateField = async (field: 'name' | 'description', toArabic: boolean) => {
    const text = field === 'name' 
      ? (toArabic ? formData.name : formData.nameAr) 
      : (toArabic ? formData.description : formData.descriptionAr);

    if (!text) return;
    const translated = await translateText(text, toArabic ? 'en' : 'ar', toArabic ? 'ar' : 'en');
    if (translated) {
      if (field === 'name') {
        if (toArabic) setFormData(prev => ({ ...prev, nameAr: translated }));
        else setFormData(prev => ({ ...prev, name: translated }));
      } else {
        if (toArabic) setFormData(prev => ({ ...prev, descriptionAr: translated }));
        else setFormData(prev => ({ ...prev, description: translated }));
      }
    }
  };

  const translateStoreName = async (toArabic: boolean) => {
    if (!siteSettings) return;
    const text = toArabic ? siteSettings.storeName : siteSettings.storeNameAr;
    if (!text) return;

    const translated = await translateText(text, toArabic ? 'en' : 'ar', toArabic ? 'ar' : 'en');
    if (translated) {
      if (toArabic) setSiteSettings(prev => prev ? { ...prev, storeNameAr: translated } : null);
      else setSiteSettings(prev => prev ? { ...prev, storeName: translated } : null);
    }
  };

  const translateBranchField = async (branchId: string, field: 'name' | 'address', toArabic: boolean) => {
    if (!siteSettings) return;
    const branch = siteSettings?.branches?.find(b => b.id === branchId);
    if (!branch) return;

    const text = field === 'name'
      ? (toArabic ? branch.name : branch.nameAr)
      : (toArabic ? branch.address : branch.addressAr);

    if (!text) return;
    const translated = await translateText(text, toArabic ? 'en' : 'ar', toArabic ? 'ar' : 'en');
    if (translated) {
      const targetField = field === 'name' ? (toArabic ? 'nameAr' : 'name') : (toArabic ? 'addressAr' : 'address');
      updateBranch(branchId, targetField, translated);
    }
  };

  const addVariant = () => {
    const variants = formData.variants;
    const hasSingle = variants.some(v => v.name.toLowerCase() === 'single');
    const hasDouble = variants.some(v => v.name.toLowerCase() === 'double');
    const hasTriple = variants.some(v => v.name.toLowerCase() === 'triple');

    if (hasTriple) return; // Max reached

    let name = "Single";
    let nameAr = "سنجل";
    
    if (hasSingle && !hasDouble) {
      name = "Double";
      nameAr = "دابل";
    } else if (hasDouble && !hasTriple) {
      name = "Triple";
      nameAr = "تريبل";
    }

    const newVariant: ItemVariant = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      nameAr,
      price: formData.price
    };
    setFormData(prev => ({ ...prev, variants: [...prev.variants, newVariant] }));
  };

  const removeVariant = (id: string) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== id) }));
  };

  const updateVariant = (id: string, field: keyof ItemVariant, value: any) => {
    setFormData(prev => {
      const newVariants = prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v);
      
      // If updating price of Single, sync with main price
      const variant = newVariants?.find(v => v.id === id);
      const isSingle = variant?.name.toLowerCase() === 'single';
      
      return {
        ...prev,
        variants: newVariants,
        price: (isSingle && field === 'price') ? value : prev.price
      };
    });
  };

  React.useEffect(() => {
    if (formData.price > 0 && discountPercent > 0) {
      setFormData(prev => ({ ...prev, discountPrice: calculateDiscountByPercent(discountPercent, prev.price) }));
    }
    // Sync main price with Single variant
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.name.toLowerCase() === 'single' ? { ...v, price: prev.price } : v)
    }));
  }, [formData.price]);

  React.useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (token === "admin-session-token") {
      setIsLoggedIn(true);
      fetchAllData();
    }
  }, []);

  const fetchAllData = () => {
    fetchItems();
    fetchOrders();
    fetchCustomers();
    fetchSiteSettings();
  };

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) {
        const text = await res.text();
        console.error(`Admin Settings Fetch Error (${res.status}):`, text.slice(0, 500));
        return;
      }
      const data = await res.json();
      if (data && !data.storeNameAr) {
        data.storeNameAr = data.storeName;
      }
      if (data && data.branches) {
        data.branches = data.branches.map((b: any) => ({
          ...b,
          deliveryFee: b.deliveryFee ?? data.defaultDeliveryFee ?? 0,
          areas: b.areas ?? []
        }));
      }
      setSiteSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/menu");
      if (!res.ok) {
        const text = await res.text();
        console.error(`Admin Menu Fetch Error (${res.status}):`, text.slice(0, 500));
        return;
      }
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) {
        const text = await res.text();
        console.error(`Admin Orders Fetch Error (${res.status}):`, text.slice(0, 500));
        return;
      }
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/admin/customers");
      if (!res.ok) {
        const text = await res.text();
        console.error(`Admin Customers Fetch Error (${res.status}):`, text.slice(0, 500));
        return;
      }
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("admin-token", data.token);
        setIsLoggedIn(true);
        fetchAllData();
      } else {
        setLoginError(data.error);
      }
    } catch (err) {
      setLoginError("Login failed");
    }
  };

  const handleLogout = () => {
    setGenericConfirm({
      title: isRTL ? "تسجيل الخروج" : "Logout",
      message: isRTL ? "هل أنت متأكد أنك تريد تسجيل الخروج من لوحة التحكم؟" : "Are you sure you want to log out of the admin panel?",
      onConfirm: () => {
        localStorage.removeItem("admin-token");
        setIsLoggedIn(false);
        setGenericConfirm(null);
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setFormData(prev => ({ ...prev, image: data.url, imagePublicId: data.public_id }));
      showNotification("success", isRTL ? "تم رفع الصورة" : "Image uploaded successfully");
    } catch (err) {
      showNotification("error", isRTL ? "فشل الرفع. تأكد من إعدادات Cloudinary" : "Upload failed. Check Cloudinary settings");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingItem ? `/api/admin/menu/${editingItem._id}` : "/api/admin/menu";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        resetForm();
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      price: 0,
      discountPrice: 0,
      category: "Burger",
      image: "",
      imagePublicId: "",
      description: "",
      descriptionAr: "",
      isAvailable: true,
      variants: [
        { id: "default-single", name: "Single", nameAr: "سنجل", price: 0 }
      ]
    });
    setEditingItem(null);
    setDiscountPercent(0);
    setShowSale(false);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      nameAr: item.nameAr || "",
      price: item.price,
      discountPrice: item.discountPrice || 0,
      category: item.category,
      image: item.image || "",
      imagePublicId: item.imagePublicId || "",
      description: item.description || "",
      descriptionAr: item.descriptionAr || "",
      isAvailable: item.isAvailable,
      variants: item.variants || []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateOffers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    setLoading(true);
    try {
      let updatedOffers = [...(siteSettings.offers || [])];
      if (editingOfferId) {
        updatedOffers = updatedOffers.map(o => o.id === editingOfferId ? { ...offerFormData, id: editingOfferId } : o);
      } else {
        updatedOffers.push({ ...offerFormData, id: Math.random().toString(36).substr(2, 9) });
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...siteSettings, offers: updatedOffers }),
      });
      if (res.ok) {
        setSiteSettings({ ...siteSettings, offers: updatedOffers });
        setOfferFormData({ 
          id: "", 
          title: "", 
          titleAr: "", 
          description: "", 
          descriptionAr: "", 
          image: "", 
          imagePublicId: "", 
          isActive: true,
          type: 'manual',
          buyQuantity: 0,
          getQuantity: 0,
          categoryLimit: undefined,
          discountValue: 0,
          branchIds: siteSettings?.branches?.map(b => b.id) || []
        });
        setEditingOfferId(null);
        showNotification("success", t.updateSuccess);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = (id: string, imagePublicId?: string) => {
    if (!siteSettings) return;
    setGenericConfirm({
      title: t.deleteItem,
      message: isRTL ? "هل أنت متأكد من حذف هذا العرض؟" : "Are you sure you want to delete this offer?",
      isDangerous: true,
      onConfirm: async () => {
        const updatedOffers = siteSettings.offers?.filter(o => o.id !== id) || [];
        
        // Remove image from Cloudinary
        if (imagePublicId) {
          try {
            await fetch("/api/admin/remove-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ public_id: imagePublicId }),
            });
          } catch (err) {
            console.error("Failed to delete image from Cloudinary:", err);
          }
        }

        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...siteSettings, offers: updatedOffers }),
        });
        if (res.ok) {
          setSiteSettings({ ...siteSettings, offers: updatedOffers });
          showNotification("success", t.deleteItem);
        }
        setGenericConfirm(null);
      }
    });
  };

  const handleEditOffer = (offer: any) => {
    setEditingOfferId(offer.id);
    setOfferFormData({ 
      ...offer, 
      branchIds: offer.branchIds || (siteSettings?.branches?.map(b => b.id) || [])
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteItem = async (id: string, imagePublicId?: string) => {
    setGenericConfirm({
      title: isRTL ? "حذف العنصر" : "Delete Item",
      message: isRTL ? "هل أنت متأكد من حذف هذا الصنف من القائمة؟" : "Are you sure you want to delete this item from the menu?",
      isDangerous: true,
      onConfirm: async () => {
        try {
          // Remove image from Cloudinary
          if (imagePublicId) {
            try {
              await fetch("/api/admin/remove-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ public_id: imagePublicId }),
              });
            } catch (err) {
              console.error("Failed to delete image from Cloudinary:", err);
            }
          }

          await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
          fetchItems();
          showNotification("success", isRTL ? "تم حذف العنصر بنجاح" : "Item deleted successfully");
        } catch (err) {
          showNotification("error", "Failed to delete item");
        }
        setGenericConfirm(null);
      }
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, reason?: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancelReason: reason }),
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    setGenericConfirm({
      title: isRTL ? "حذف الطلب" : "Delete Order",
      message: isRTL ? "هل أنت متأكد من حذف هذا الطلب نهائياً؟" : "Are you sure you want to delete this order permanently?",
      isDangerous: true,
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
          fetchOrders();
          showNotification("success", isRTL ? "تم حذف الطلب" : "Order deleted");
        } catch (err) {
          showNotification("error", "Failed to delete order");
        }
        setGenericConfirm(null);
      }
    });
  };

  const convertMapsUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("google.com/maps/embed")) return url;
    
    // Check for "place" URLs
    const placeMatch = url.match(/\/place\/([^\/]+)/);
    if (placeMatch) {
      const decodedPlace = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      return `https://www.google.com/maps?q=${encodeURIComponent(decodedPlace)}&output=embed`;
    }

    // Check for coordinates
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
    }

    // Handle shortened maps.app.goo.gl links or other google maps links
    if (url.includes("maps.app.goo.gl") || url.includes("google.com/maps")) {
      return `https://www.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
    }

    return url;
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    setLoading(true);
    try {
      // Auto-convert map URLs for all branches
      const finalBranches = (siteSettings.branches || []).map(b => ({
        ...b,
        mapUrl: b.mapUrl ? convertMapsUrl(b.mapUrl) : ""
      }));

      const finalSettings = {
        ...siteSettings,
        branches: finalBranches
      };
      
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalSettings),
      });
      if (res.ok) {
        setSiteSettings(finalSettings);
        showNotification("success", t.updateSuccess);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addBranchArea = (branchId: string) => {
    if (!siteSettings) return;
    setSiteSettings(prev => {
      if (!prev) return prev;
      const branches = (prev.branches || []).map(b => {
        if (b.id === branchId) {
          const newArea: Area = {
            id: Math.random().toString(36).substr(2, 9),
            name: "New Area",
            nameAr: "منطقة جديدة",
            fee: b.deliveryFee || 0
          };
          return { ...b, areas: [...(b.areas || []), newArea] };
        }
        return b;
      });
      return { ...prev, branches };
    });
  };

  const updateBranchArea = (branchId: string, areaId: string, field: string, value: any) => {
    if (!siteSettings) return;
    setSiteSettings(prev => {
      if (!prev) return prev;
      const branches = (prev.branches || []).map(b => {
        if (b.id === branchId) {
          const areas = (b.areas || []).map(a => a.id === areaId ? { ...a, [field]: value } : a);
          return { ...b, areas };
        }
        return b;
      });
      return { ...prev, branches };
    });
  };

  const removeBranchArea = (branchId: string, areaId: string) => {
    if (!siteSettings) return;
    setSiteSettings(prev => {
      if (!prev) return prev;
      const branches = (prev.branches || []).map(b => {
        if (b.id === branchId) {
          return { ...b, areas: (b.areas || []).filter(a => a.id !== areaId) };
        }
        return b;
      });
      return { ...prev, branches };
    });
  };

  const translateAreaField = async (branchId: string, areaId: string, field: 'name', toArabic: boolean) => {
    if (!siteSettings) return;
    const branch = siteSettings?.branches?.find(b => b.id === branchId);
    if (!branch) return;
    const area = branch?.areas?.find(a => a.id === areaId);
    if (!area) return;

    const text = toArabic ? area.name : area.nameAr;
    if (!text) return;
    const translated = await translateText(text, toArabic ? 'en' : 'ar', toArabic ? 'ar' : 'en');
    if (translated) {
      updateBranchArea(branchId, areaId, toArabic ? 'nameAr' : 'name', translated);
    }
  };

  const addBranch = () => {
    if (!siteSettings) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newBranch = {
      id: newId,
      name: "New Branch",
      nameAr: "فرع جديد",
      address: "",
      addressAr: "",
      phones: [""],
      mapUrl: "",
      deliveryFee: siteSettings.defaultDeliveryFee || 0,
      areas: []
    };
    setSiteSettings(prev => prev ? { ...prev, branches: [...(prev.branches || []), newBranch] } : prev);
    setExpandedBranches(prev => ({ ...prev, [newId]: true }));
  };

  const updateBranch = (id: string, field: string, value: any) => {
    setSiteSettings(prev => {
      if (!prev) return prev;
      const branches = (prev.branches || []).map(b => b.id === id ? { ...b, [field]: value } : b);
      return { ...prev, branches };
    });
  };

  const removeBranch = (id: string) => {
    if (!siteSettings) return;
    setGenericConfirm({
      title: isRTL ? "حذف الفرع" : "Delete Branch",
      message: isRTL ? "هل أنت متأكد من حذف هذا الفرع؟" : "Are you sure you want to delete this branch?",
      isDangerous: true,
      onConfirm: () => {
        setSiteSettings(prev => prev ? { ...prev, branches: (prev.branches || []).filter(b => b.id !== id) } : prev);
        setGenericConfirm(null);
      }
    });
  };

  const addBranchPhone = (branchId: string) => {
    setSiteSettings(prev => {
      if (!prev) return prev;
      const branches = (prev.branches || []).map(b => b.id === branchId ? { ...b, phones: [...b.phones, ""] } : b);
      return { ...prev, branches };
    });
  };

  const updateBranchPhone = (branchId: string, index: number, value: string) => {
    setSiteSettings(prev => {
      if (!prev) return prev;
      const branches = (prev.branches || []).map(b => {
        if (b.id === branchId) {
          const phones = [...b.phones];
          phones[index] = value;
          return { ...b, phones };
        }
        return b;
      });
      return { ...prev, branches };
    });
  };

  const removeBranchPhone = (branchId: string, index: number) => {
    setSiteSettings(prev => {
      if (!prev) return prev;
      const branches = (prev.branches || []).map(b => {
        if (b.id === branchId) {
          return { ...b, phones: b.phones.filter((_, i) => i !== index) };
        }
        return b;
      });
      return { ...prev, branches };
    });
  };

  const handleStatusChangeClick = (orderId: string, status: string, currentStatus: string, currentFee?: number) => {
    if (currentStatus === "Completed") return;
    setConfirmStatus({ orderId, status });
    setDeliveryFeeUpdate(currentFee || 0);
  };

  const confirmStatusChange = async () => {
    if (!confirmStatus) return;
    if (confirmStatus.status === "Cancelled" && !cancelReason) {
      showNotification("info", t.provideReason);
      return;
    }
    try {
      await fetch(`/api/admin/orders/${confirmStatus.orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: confirmStatus.status, 
          cancelReason,
          deliveryFee: confirmStatus.status === "Out for Delivery" ? deliveryFeeUpdate : undefined
        }),
      });
      fetchOrders();
      setConfirmStatus(null);
      setCancelReason("");
    } catch (err) {
      console.error(err);
    }
  };

  const activeOrders = orders.filter(o => o.status !== "Completed" && o.status !== "Cancelled");
  const completedOrders = orders.filter(o => o.status === "Completed");
  const cancelledOrders = orders.filter(o => o.status === "Cancelled");

  if (!isLoggedIn) {
    return (
      <div className={cn("min-h-screen bg-black flex items-center justify-center p-4")}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#1A1A1A] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl flex flex-col"
        >
          <div className="text-center mb-8 md:mb-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 glow-orange shadow-[0_0_50px_rgba(255,145,0,0.3)]">
              <span className="text-black text-3xl md:text-5xl font-black italic tracking-tighter">B</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black italic uppercase tracking-tighter">Station <span className="text-primary">Admin</span></h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40 ml-2">ID</label>
                <input 
                  type="text"
                  required
                  value={adminId}
                  onChange={e => setAdminId(e.target.value)}
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 font-mono focus:border-primary transition-all outline-none"
                  placeholder="Admin ID"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40 ml-2">{isRTL ? "كلمة المرور" : "Password"}</label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 font-mono focus:border-primary transition-all outline-none text-center tracking-[0.5em]"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {loginError && <p className="text-red-500 text-[10px] font-black uppercase text-center">{loginError}</p>}
            <button className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all">
              Enter Station
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-black text-white p-4 md:p-12 font-sans pt-24 md:pt-32 overflow-x-hidden", isRTL && "font-arabic")}>
      <div className="max-w-screen-2xl mx-auto">
        <header className={cn("flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12", isRTL && "md:flex-row-reverse text-right")}>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black mb-2 italic uppercase tracking-tighter">
              {t.adminDashboard}
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/10 hover:text-red-500 px-6 py-4 md:py-3 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest border border-white/10"
          >
            <LogOut size={14} /> {t.logout}
          </button>
        </header>

        <div className={cn("flex gap-2 mb-8 md:mb-10 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x snap-mandatory", isRTL && "flex-row-reverse")}>
          {[
            { id: "menu", label: t.inventory, icon: Utensils },
            { id: "orders", label: t.missions, icon: Package },
            { id: "users", label: t.operators, icon: Users },
            { id: "offers", label: t.offers, icon: Zap },
            { id: "settings", label: t.settings, icon: SettingsIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={cn(
                "flex items-center gap-3 px-6 md:snap-align-none snap-center md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border whitespace-nowrap",
                activeTab === tab.id ? "bg-primary text-black border-primary" : "bg-white/5 text-white/40 border-white/5"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-12">
          {activeTab === "menu" && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:col-span-3 xl:col-span-4 grid grid-cols-1 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-8 md:gap-12"
            >
              <div className="lg:col-span-1 xl:col-span-1">
                <div className="bg-[#1A1A1A] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-white/5 sticky top-32">
                  <h2 className="text-xl font-black italic uppercase mb-6">{editingItem ? t.editFuel : t.newFuel}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                            <label className="text-[8px] uppercase font-black opacity-30 px-2">{t.nameEn}</label>
                            <button type="button" onClick={() => translateField('name', true)} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1 hover:bg-primary hover:text-black transition-all">
                              <Languages size={8} /> {t.translate} AR
                            </button>
                          </div>
                          <input 
                            placeholder={t.nameEn}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm w-full focus:border-primary outline-none transition-all"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                            <label className="text-[8px] uppercase font-black opacity-30 px-2">{t.nameAr}</label>
                            <button type="button" onClick={() => translateField('name', false)} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1 hover:bg-primary hover:text-black transition-all">
                              <Languages size={8} /> {t.translate} EN
                            </button>
                          </div>
                          <input 
                            placeholder={t.nameAr}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm text-right w-full focus:border-primary outline-none transition-all"
                            value={formData.nameAr}
                            onChange={e => setFormData({...formData, nameAr: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                            <label className="text-[8px] uppercase font-black opacity-30 px-2">{t.descriptionEn}</label>
                            <button type="button" onClick={() => translateField('description', true)} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1 hover:bg-primary hover:text-black transition-all">
                              <Languages size={8} /> {t.translate} AR
                            </button>
                          </div>
                          <textarea 
                            placeholder={t.descriptionEn}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm w-full focus:border-primary outline-none transition-all min-h-[100px] resize-none"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                            <label className="text-[8px] uppercase font-black opacity-30 px-2">{t.descriptionAr}</label>
                            <button type="button" onClick={() => translateField('description', false)} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1 hover:bg-primary hover:text-black transition-all">
                              <Languages size={8} /> {t.translate} EN
                            </button>
                          </div>
                          <textarea 
                            placeholder={t.descriptionAr}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm text-right w-full focus:border-primary outline-none transition-all min-h-[100px] resize-none"
                            value={formData.descriptionAr}
                            onChange={e => setFormData({...formData, descriptionAr: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.sizesAndVariants}</h4>
                        <button 
                          type="button"
                          onClick={addVariant}
                          className="text-[10px] font-black uppercase text-primary hover:scale-110 transition-transform"
                        >
                          + {t.addSize}
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {formData.variants.map((variant) => (
                          <div key={variant.id} className={cn("grid grid-cols-12 gap-2 bg-white/5 p-3 rounded-xl border border-white/5 group", isRTL && "flex-row-reverse")}>
                            <div className="col-span-4 relative group/v">
                              <input 
                                placeholder={t.nameEn}
                                className="w-full bg-black/20 p-2 pr-8 rounded text-[10px] outline-none border border-transparent focus:border-primary/30"
                                value={variant.name}
                                onChange={e => updateVariant(variant.id, 'name', e.target.value)}
                              />
                              <button 
                                type="button" 
                                onClick={async () => {
                                  const translated = await translateText(variant.name, 'en', 'ar');
                                  if (translated) updateVariant(variant.id, 'nameAr', translated);
                                }}
                                className="absolute right-1 top-1.5 text-white/20 hover:text-primary transition-colors opacity-0 group-hover/v:opacity-100"
                              >
                                <Languages size={10} />
                              </button>
                            </div>
                            <div className="col-span-4 relative group/v">
                              <input 
                                placeholder={t.nameAr}
                                className="w-full bg-black/20 p-2 pl-8 rounded text-[10px] text-right outline-none border border-transparent focus:border-primary/30"
                                value={variant.nameAr}
                                onChange={e => updateVariant(variant.id, 'nameAr', e.target.value)}
                              />
                              <button 
                                type="button" 
                                onClick={async () => {
                                  const translated = await translateText(variant.nameAr, 'ar', 'en');
                                  if (translated) updateVariant(variant.id, 'name', translated);
                                }}
                                className="absolute left-1 top-1.5 text-white/20 hover:text-primary transition-colors opacity-0 group-hover/v:opacity-100"
                              >
                                <Languages size={10} />
                              </button>
                            </div>
                            <input 
                              type="number"
                              placeholder={t.egp}
                              className="col-span-3 bg-black/20 p-2 rounded text-[10px] outline-none"
                              value={variant.price}
                              onChange={e => updateVariant(variant.id, 'price', parseInt(e.target.value))}
                            />
                            <button 
                              type="button"
                              onClick={() => removeVariant(variant.id)}
                              className="col-span-1 flex items-center justify-center text-red-500 opacity-20 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className={cn("text-[8px] font-black uppercase opacity-40 mx-2 block", isRTL && "text-right")}>{t.originalPrice}</label>
                        <input 
                          type="number"
                          placeholder="Price"
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm transition-all focus:border-primary"
                          value={formData.price || ""}
                          onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                        />
                      </div>

                      <button 
                        type="button" 
                        onClick={() => setShowSale(!showSale)}
                        className={cn(
                          "w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-[8px] font-black uppercase transition-all",
                          showSale ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-white/40"
                        )}
                      >
                        {showSale ? <Check size={10} /> : <Zap size={10} />}
                        {isRTL ? "تفعيل العروض / الخصومات" : "Activate Sale / Offers"}
                      </button>

                      <AnimatePresence>
                        {showSale && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-4 pb-2">
                              <div className="space-y-1">
                                <label className={cn("text-[8px] font-black uppercase opacity-40 mx-2 block", isRTL && "text-right")}>{t.discountPercentage}</label>
                                <input 
                                  type="number"
                                  placeholder="%"
                                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm"
                                  value={discountPercent || ""}
                                  onChange={e => handlePercentChange(parseInt(e.target.value) || 0)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className={cn("text-[8px] font-black uppercase opacity-40 mx-2 block", isRTL && "text-right")}>{t.discountPrice}</label>
                                <input 
                                  type="number"
                                  placeholder="0 = No Sale"
                                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm"
                                  value={formData.discountPrice || ""}
                                  onChange={e => setFormData({...formData, discountPrice: parseInt(e.target.value) || 0})}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <select
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as Category})}
                    >
                      <option value="Burger">Burger</option>
                      <option value="Meals">Meals</option>
                      <option value="Fries">Fries</option>
                      <option value="Drinks">Drinks</option>
                    </select>
                    <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                      <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 relative overflow-hidden">
                        {formData.image ? (
                          <img src={formData.image} className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="opacity-20" />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <RefreshCw className="animate-spin text-primary" size={20} />
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait" 
                          disabled={uploading}
                          onChange={handleImageUpload} 
                        />
                      </div>
                      <p className="text-[8px] uppercase font-black opacity-30">{isRTL ? "يفضل إضافة صورة" : "Image recommended"}</p>
                    </div>
                    <button type="submit" className="w-full bg-primary text-black py-4 rounded-xl font-black uppercase text-[10px]">
                      {editingItem ? t.editFuel : t.saveItem}
                    </button>
                    {editingItem && (
                      <button type="button" onClick={resetForm} className="w-full bg-white/5 text-white/40 py-2 rounded-xl text-[8px] font-black uppercase">
                        {t.close}
                      </button>
                    )}
                  </form>
                </div>
              </div>
              <div className="lg:col-span-2 xl:col-span-3 2xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {items.map(item => (
                  <motion.div 
                    layout
                    key={item._id} 
                    className="group bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 flex items-start sm:items-center gap-4 hover:border-primary/50 transition-all hover:bg-primary/5 cursor-pointer relative"
                    onClick={() => handleEdit(item)}
                  >
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/5 shrink-0">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : null}
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[8px] font-black uppercase bg-red-500 text-white px-2 py-1 rounded">Out</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black uppercase text-primary/40 leading-none">{item.category}</span>
                        {item.isAvailable && <span className="w-1 h-1 bg-green-500 rounded-full" />}
                      </div>
                      <h4 className="font-black text-sm uppercase truncate mb-1 group-hover:text-primary transition-colors">
                        {language === "ar" ? item.nameAr : item.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {item.discountPrice !== undefined && item.discountPrice > 0 ? (
                          <>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <p className="text-primary font-black italic text-base sm:text-lg leading-none">{item.discountPrice} <span className="text-[10px] uppercase not-italic opacity-40">EGP</span></p>
                                <span className="text-[7px] bg-primary text-black px-1.5 py-0.5 rounded-full font-black tracking-tighter">SALE</span>
                              </div>
                              <p className="text-white/20 line-through text-[10px] font-mono leading-none mt-1">{item.price} EGP</p>
                            </div>
                          </>
                        ) : (
                          <p className="text-primary font-black italic text-base sm:text-lg leading-none">{item.price} <span className="text-[10px] uppercase not-italic opacity-40">EGP</span></p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }} 
                        className="p-3 bg-white/5 hover:bg-primary hover:text-black rounded-xl transition-all"
                        title="Edit"
                       >
                        <Edit2 size={14}/>
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item._id, item.imagePublicId); }} 
                        className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        title="Delete"
                       >
                        <Trash2 size={14}/>
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-3 xl:col-span-4 space-y-10 md:space-y-16">
              <div className={cn("flex flex-col sm:flex-row items-center gap-4 border-b border-white/5 pb-8", isRTL && "sm:flex-row-reverse")}>
                 <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <Package className="text-black" size={24} />
                 </div>
                 <h2 className="text-3xl md:text-5xl font-display font-black italic uppercase tracking-tighter text-center sm:text-left">
                   {t.missions}
                 </h2>
              </div>

              <section className="space-y-6">
                <h2 className="text-xl font-black uppercase italic flex items-center gap-3">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" /> {t.activeMissions}
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-4 md:gap-8">
                  {activeOrders.length > 0 ? activeOrders.map(order => (
                    <OrderCard key={order._id} order={order} onStatusChange={handleStatusChangeClick} onDelete={handleDeleteOrder} t={t} formatDate={formatDate} isRTL={isRTL} />
                  )) : (
                    <div className="col-span-full p-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] text-white/20 font-black uppercase italic tracking-widest">
                      No Active Missions
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-xl font-black uppercase italic flex items-center gap-3">
                  <Check className="text-green-500" size={20} /> {t.completedMissions}
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-4 md:gap-8">
                  {completedOrders.length > 0 ? completedOrders.map(order => (
                    <OrderCard key={order._id} order={order} onStatusChange={handleStatusChangeClick} onDelete={handleDeleteOrder} t={t} formatDate={formatDate} isRTL={isRTL} />
                  )) : (
                    <div className="col-span-full p-8 text-center border border-white/5 rounded-[2rem] text-white/10 font-black uppercase italic text-xs">
                      No Completed Missions
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-xl font-black uppercase italic flex items-center gap-3 text-red-500">
                  <X size={20} /> {t.cancelled}
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-4 md:gap-8">
                  {cancelledOrders.length > 0 ? cancelledOrders.map(order => (
                    <OrderCard key={order._id} order={order} onStatusChange={handleStatusChangeClick} onDelete={handleDeleteOrder} t={t} formatDate={formatDate} isRTL={isRTL} />
                  )) : (
                    <div className="col-span-full p-8 text-center border border-white/5 rounded-[2rem] text-white/10 font-black uppercase italic text-xs">
                      No {t.cancelled} Orders
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "users" && (
            <div className="lg:col-span-3 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 md:gap-6">
               {customers.map(c => (
                 <div key={c._id} className="bg-[#1A1A1A] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 hover:border-primary/20 transition-all">
                   <h3 className="font-black text-lg md:text-xl italic uppercase mb-1 truncate">{c.name}</h3>
                   <p className="text-primary font-mono mb-4 text-xs md:text-sm">{c.phone}</p>
                   <p className="text-[10px] md:text-xs text-white/40 mb-3 italic line-clamp-2 min-h-[2.5rem]">{c.address}</p>
                   <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                     <p className="text-[8px] font-mono opacity-20">{formatDate(c.updatedAt)}</p>
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 glow-green" />
                   </div>
                 </div>
               ))}
               {customers.length === 0 && (
                 <div className="col-span-full p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 font-black uppercase italic tracking-[0.2em]">
                   Empty Operator Database
                 </div>
               )}
            </div>
          )}

          {activeTab === "offers" && (
            <motion.div key="offers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12">
              <div className="xl:col-span-4 space-y-6">
                <div className="bg-[#1A1A1A] p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <Zap className="text-primary" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter">{editingOfferId ? t.editOffer : t.newOffer}</h2>
                      <p className="text-[10px] uppercase font-black opacity-30 mt-1">Create engaging promotional banners</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateOffers} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                          <label className="text-[8px] uppercase font-black opacity-30 px-2">{t.nameEn}</label>
                          <button type="button" onClick={() => translateOfferField('title', true)} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1 hover:bg-primary hover:text-black transition-all">
                            <Languages size={8} /> {t.translate} AR
                          </button>
                        </div>
                        <input placeholder={t.nameEn} className="w-full bg-white/5 p-4 rounded-xl text-sm focus:border-primary outline-none transition-all" value={offerFormData.title} onChange={e => setOfferFormData({...offerFormData, title: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                          <label className="text-[8px] uppercase font-black opacity-30 px-2">{t.nameAr}</label>
                          <button type="button" onClick={() => translateOfferField('title', false)} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1 hover:bg-primary hover:text-black transition-all">
                            <Languages size={8} /> {t.translate} EN
                          </button>
                        </div>
                        <input placeholder={t.nameAr} className="w-full bg-white/5 p-4 rounded-xl text-sm text-right focus:border-primary outline-none transition-all" value={offerFormData.titleAr} onChange={e => setOfferFormData({...offerFormData, titleAr: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                          <label className="text-[8px] uppercase font-black opacity-30 px-2">{t.descriptionEn}</label>
                          <button type="button" onClick={() => translateOfferField('description', true)} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1 hover:bg-primary hover:text-black transition-all">
                            <Languages size={8} /> {t.translate} AR
                          </button>
                        </div>
                        <textarea placeholder={t.descriptionEn} className="w-full bg-white/5 p-4 rounded-xl text-sm min-h-[80px] focus:border-primary outline-none transition-all" value={offerFormData.description} onChange={e => setOfferFormData({...offerFormData, description: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                          <label className="text-[8px] uppercase font-black opacity-30 px-2">{t.descriptionAr}</label>
                          <button type="button" onClick={() => translateOfferField('description', false)} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1 hover:bg-primary hover:text-black transition-all">
                            <Languages size={8} /> {t.translate} EN
                          </button>
                        </div>
                        <textarea placeholder={t.descriptionAr} className="w-full bg-white/5 p-4 rounded-xl text-sm text-right min-h-[80px] focus:border-primary outline-none transition-all" value={offerFormData.descriptionAr} onChange={e => setOfferFormData({...offerFormData, descriptionAr: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <select 
                        className="bg-white/5 p-4 rounded-xl text-sm outline-none border border-white/5 focus:border-primary"
                        value={offerFormData.type}
                        onChange={e => setOfferFormData({...offerFormData, type: e.target.value as any})}
                      >
                        <option value="manual">{isRTL ? "يدوي (للمعرض فقط)" : "Manual (Display Only)"}</option>
                        <option value="buy_x_get_y">{isRTL ? "اشترِ X واحصل على Y مجاناً" : "Buy X Get Y Free"}</option>
                        <option value="fixed_discount">{isRTL ? "خصم ثابت" : "Fixed Discount"}</option>
                        <option value="percentage_discount">{isRTL ? "خصم بنسبة مئوية" : "Percentage Discount"}</option>
                      </select>
                      {offerFormData.type === 'buy_x_get_y' && (
                        <div className="flex gap-2">
                          <input type="number" placeholder="Buy X" className="bg-white/5 p-4 rounded-xl text-sm w-1/2" value={offerFormData.buyQuantity || ''} onChange={e => setOfferFormData({...offerFormData, buyQuantity: parseInt(e.target.value) || 0})} />
                          <input type="number" placeholder="Get Y Free" className="bg-white/5 p-4 rounded-xl text-sm w-1/2" value={offerFormData.getQuantity || ''} onChange={e => setOfferFormData({...offerFormData, getQuantity: parseInt(e.target.value) || 0})} />
                        </div>
                      )}
                      {(offerFormData.type === 'fixed_discount' || offerFormData.type === 'percentage_discount') && (
                        <input type="number" placeholder={offerFormData.type === 'fixed_discount' ? "Discount Value (EGP)" : "Discount %"} className="bg-white/5 p-4 rounded-xl text-sm" value={offerFormData.discountValue || ''} onChange={e => setOfferFormData({...offerFormData, discountValue: parseInt(e.target.value) || 0})} />
                      )}
                    </div>

                    {offerFormData.type !== 'manual' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-2">{isRTL ? "قصر العرض على صنف محدد (اختياري)" : "Limit to Category (Optional)"}</label>
                        <div className="flex flex-wrap gap-2">
                          {["Burger", "Side", "Drink", "Sauce"].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setOfferFormData({...offerFormData, categoryLimit: offerFormData.categoryLimit === cat ? undefined : cat as Category})}
                              className={cn(
                                "text-[10px] uppercase font-black px-4 py-2 rounded-lg border transition-all",
                                offerFormData.categoryLimit === cat ? "bg-primary text-black border-primary" : "bg-white/5 border-white/5 opacity-50"
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Branch Selection */}
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                        <label className="text-[10px] font-black uppercase opacity-40 ml-2">
                          {isRTL ? "الفروع المشمولة بالعرض" : "Applicable Branches"}
                        </label>
                        <button 
                          type="button" 
                          onClick={() => {
                            const allBranchIds = siteSettings?.branches?.map(b => b.id) || [];
                            const currentIds = offerFormData.branchIds || [];
                            if (currentIds.length === allBranchIds.length) {
                              setOfferFormData({ ...offerFormData, branchIds: [] });
                            } else {
                              setOfferFormData({ ...offerFormData, branchIds: allBranchIds });
                            }
                          }}
                          className="text-[9px] font-black uppercase text-primary px-2 py-1 bg-primary/10 rounded transition-all hover:bg-primary hover:text-black"
                        >
                          {(offerFormData.branchIds || []).length === (siteSettings?.branches || []).length 
                            ? (isRTL ? "إلغاء اختيار الكل" : "Deselect All") 
                            : (isRTL ? "اختيار الكل" : "Select All")}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto no-scrollbar p-1">
                        {siteSettings?.branches?.map(branch => (
                          <label 
                            key={branch.id} 
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all shrink-0",
                              (offerFormData.branchIds || []).includes(branch.id)
                                ? "bg-primary/10 border-primary/50 text-foreground" 
                                : "bg-white/5 border-white/5 opacity-40 hover:opacity-100"
                            )}
                          >
                            <input 
                              type="checkbox" 
                              checked={(offerFormData.branchIds || []).includes(branch.id)}
                              onChange={() => {
                                const currentIds = offerFormData.branchIds || [];
                                if (currentIds.includes(branch.id)) {
                                  setOfferFormData({ ...offerFormData, branchIds: currentIds.filter(id => id !== branch.id) });
                                } else {
                                  setOfferFormData({ ...offerFormData, branchIds: [...currentIds, branch.id] });
                                }
                              }}
                              className="accent-primary"
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase truncate">
                                {language === "ar" ? branch.nameAr : branch.name}
                              </span>
                              <span className="text-[8px] opacity-40 truncate">
                                {language === "ar" ? branch.addressAr : branch.address}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      {(offerFormData.branchIds || []).length === 0 && (
                        <p className="text-[9px] text-red-500 font-black uppercase text-center mt-2 flex items-center justify-center gap-1">
                          <AlertTriangle size={10} /> {isRTL ? "يجب اختيار فرع واحد على الأقل" : "Select at least one branch"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
                        {offerFormData.image ? (
                          <img src={offerFormData.image} className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={24} className="opacity-20" />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <RefreshCw className="animate-spin text-primary" size={20} />
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait" 
                          disabled={uploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            // Visual feedback: local preview
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setOfferFormData(prev => ({ ...prev, image: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                            
                            setUploading(true);
                            const uploadData = new FormData();
                            uploadData.append("image", file);
                            try {
                              const res = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
                              if (!res.ok) throw new Error("Upload failed");
                              const data = await res.json();
                              setOfferFormData(prev => ({ ...prev, image: data.url, imagePublicId: data.public_id }));
                              showNotification("success", isRTL ? "تم رفع الصورة" : "Image uploaded successfully");
                            } catch (err) {
                              showNotification("error", isRTL ? "فشل الرفع" : "Upload failed");
                            } finally { 
                              setUploading(false); 
                            }
                          }} 
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={offerFormData.isActive} onChange={e => setOfferFormData(prev => ({...prev, isActive: e.target.checked}))} className="accent-primary" />
                          <span className="text-[10px] uppercase font-black">{offerFormData.isActive ? t.active : t.inactive}</span>
                        </label>
                        <p className="text-[8px] uppercase font-black opacity-30">Add a stunning banner image for this offer to show on home page</p>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-black py-4 rounded-xl font-black uppercase text-[10px]">
                      {editingOfferId ? t.saveOffer : t.addOffer}
                    </button>
                    {editingOfferId && (
                      <button type="button" onClick={() => { 
                        setEditingOfferId(null); 
                        setOfferFormData({ 
                          id: "", 
                          title: "", 
                          titleAr: "", 
                          description: "", 
                          descriptionAr: "", 
                          image: "", 
                          imagePublicId: "", 
                          isActive: true,
                          type: 'manual',
                          buyQuantity: 0,
                          getQuantity: 0,
                          categoryLimit: undefined,
                          discountValue: 0,
                          branchIds: siteSettings?.branches?.map(b => b.id) || []
                        }); 
                      }} className="w-full bg-white/5 text-white/40 py-2 rounded-xl text-[8px] font-black uppercase">
                        {t.cancel}
                      </button>
                    )}
                  </form>
                </div>

                <div className="bg-[#1A1A1A] p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.deliveryFeesConfig}</h4>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-black text-sm uppercase italic">{t.freeDelivery}</h4>
                      <p className="text-[10px] opacity-40 uppercase font-black">{isRTL ? "تفعيل التوصيل المجاني تلقائياً" : "Enable free shipping automatic"}</p>
                    </div>
                    <div className="w-32">
                      <input type="number" placeholder={t.total} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-mono text-center" value={siteSettings?.freeDeliveryThreshold || 0} onChange={e => setSiteSettings(s => s ? {...s, freeDeliveryThreshold: parseInt(e.target.value) || 0} : null)} />
                    </div>
                  </div>
                  <button onClick={handleUpdateSettings} className="w-full bg-white/10 py-3 rounded-xl font-black uppercase text-[8px]">{t.saveSettings}</button>
                </div>
              </div>

              <div className="xl:col-span-8 3xl:col-span-9 grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-6 auto-rows-min max-h-[1200px] overflow-y-auto pr-2 no-scrollbar">
                {siteSettings?.offers?.map(offer => (
                  <div key={offer.id} className="bg-[#1A1A1A] rounded-3xl border border-white/5 overflow-hidden group hover:border-primary/30 transition-all flex flex-col h-auto">
                    <div className="w-full aspect-video shrink-0 relative overflow-hidden">
                      {offer.image ? (
                        <img src={offer.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <Camera className="opacity-10" size={48} />
                        </div>
                      )}
                      {!offer.isActive && <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-black text-[10px] uppercase text-white/40">Inactive</div>}
                    </div>
                    <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-2xl italic uppercase mb-2 line-clamp-1">{language === "ar" ? offer.titleAr : offer.title}</h3>
                        <p className="text-white/40 text-xs line-clamp-2">{language === "ar" ? offer.descriptionAr : offer.description}</p>
                        {offer.type && offer.type !== 'manual' && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <span className="text-[10px] font-black uppercase px-3 py-1.5 bg-primary/10 text-primary rounded-xl border border-primary/20 italic">
                              {offer.type === 'buy_x_get_y' ? `Buy ${offer.buyQuantity} Get ${offer.getQuantity} Free` : 
                               offer.type === 'fixed_discount' ? `${offer.discountValue} EGP OFF` : 
                               `${offer.discountValue}% OFF`}
                            </span>
                            {offer.categoryLimit && (
                              <span className="text-[10px] font-black uppercase px-3 py-1.5 bg-white/5 text-white/40 rounded-xl border border-white/10">
                                {offer.categoryLimit} Only
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/5">
                        <button onClick={() => handleEditOffer(offer)} className="flex-1 bg-white/5 hover:bg-primary hover:text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Edit</button>
                        <button onClick={() => handleDeleteOffer(offer.id, offer.imagePublicId)} className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {(!siteSettings?.offers || siteSettings.offers.length === 0) && (
                  <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] text-white/20 font-black uppercase italic tracking-widest text-[10px]">
                    No Active Promotions
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-screen-2xl mx-auto px-4 pb-24 sm:pb-20">
              <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                {/* Left Column: Core & Social */}
                <div className="lg:col-span-7 space-y-6 md:space-y-8">
                  <div className="bg-[#1A1A1A] p-5 sm:p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-white/5 space-y-6">
                    <h3 className={cn("text-lg sm:text-xl font-black italic uppercase flex items-center gap-3", isRTL && "flex-row-reverse")}>
                      <SettingsIcon size={20} className="text-primary" /> {isRTL ? "الإعدادات الأساسية" : "Core Engine"}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
                        <div className="space-y-2">
                          <div className={cn("flex flex-col sm:flex-row justify-between sm:items-center gap-2", isRTL && "sm:flex-row-reverse")}>
                            <label className="text-[10px] font-black uppercase opacity-40 italic">{t.storeName} (EN)</label>
                            <button 
                              type="button" 
                              onClick={() => translateStoreName(true)} 
                              className="text-[9px] font-black uppercase text-primary px-3 py-2 sm:py-1 bg-primary/10 rounded-xl sm:rounded-full hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-1 border border-primary/20 sm:border-transparent"
                            >
                              <Globe size={10} /> {isRTL ? "ترجمة للعربية" : "Translate Store to Arabic"}
                            </button>
                          </div>
                          <input className="w-full bg-white/5 p-4 rounded-xl text-sm border border-white/5 focus:border-primary outline-none transition-all" value={siteSettings?.storeName || ""} onChange={e => setSiteSettings(s => s ? {...s, storeName: e.target.value} : null)} />
                        </div>
                        <div className="space-y-2">
                          <div className={cn("flex flex-col sm:flex-row justify-between sm:items-center gap-2", isRTL && "sm:flex-row-reverse")}>
                            <label className="text-[10px] font-black uppercase opacity-40 italic text-right block">{t.storeName} (AR)</label>
                            <button 
                              type="button" 
                              onClick={() => translateStoreName(false)} 
                              className="text-[9px] font-black uppercase text-primary px-3 py-2 sm:py-1 bg-primary/10 rounded-xl sm:rounded-full hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-1 border border-primary/20 sm:border-transparent"
                            >
                              <Globe size={10} /> {isRTL ? "ترجمة للإنجليزية" : "Translate Store to English"}
                            </button>
                          </div>
                          <input className={cn("w-full bg-white/5 p-4 rounded-xl text-sm border border-white/5 focus:border-primary outline-none transition-all text-right")} dir="rtl" value={siteSettings?.storeNameAr || ""} onChange={e => setSiteSettings(s => s ? {...s, storeNameAr: e.target.value} : null)} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 space-y-6 border-t border-white/5">
                      <h3 className={cn("text-lg sm:text-xl font-black italic uppercase flex items-center gap-3", isRTL && "flex-row-reverse")}><Globe className="text-primary" size={20} /> {t.socialMedia}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] sm:text-[8px] uppercase font-black opacity-30 sm:ml-2">Facebook</label>
                          <input placeholder="Facebook URL" className="bg-white/5 p-4 rounded-xl text-sm w-full outline-none border border-white/5 focus:border-primary" value={siteSettings?.socialLinks?.facebook || ""} onChange={e => setSiteSettings(s => s ? {...s, socialLinks: {...(s.socialLinks || {}), facebook: e.target.value}} : null)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] sm:text-[8px] uppercase font-black opacity-30 sm:ml-2">Instagram</label>
                          <input placeholder="Instagram URL" className="bg-white/5 p-4 rounded-xl text-sm w-full outline-none border border-white/5 focus:border-primary" value={siteSettings?.socialLinks?.instagram || ""} onChange={e => setSiteSettings(s => s ? {...s, socialLinks: {...(s.socialLinks || {}), instagram: e.target.value}} : null)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] sm:text-[8px] uppercase font-black opacity-30 sm:ml-2">WhatsApp</label>
                          <input placeholder="WhatsApp Number" className="bg-white/5 p-4 rounded-xl text-sm w-full outline-none border border-white/5 focus:border-primary" value={siteSettings?.socialLinks?.whatsapp || ""} onChange={e => setSiteSettings(s => s ? {...s, socialLinks: {...(s.socialLinks || {}), whatsapp: e.target.value}} : null)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] sm:text-[8px] uppercase font-black opacity-30 sm:ml-2">TikTok</label>
                          <input placeholder="TikTok URL" className="bg-white/5 p-4 rounded-xl text-sm w-full outline-none border border-white/5 focus:border-primary" value={siteSettings?.socialLinks?.tiktok || ""} onChange={e => setSiteSettings(s => s ? {...s, socialLinks: {...(s.socialLinks || {}), tiktok: e.target.value}} : null)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1A1A1A] p-5 sm:p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-white/5 space-y-6">
                    <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                      <h3 className={cn("text-lg sm:text-xl font-black italic uppercase flex items-center gap-3", isRTL && "flex-row-reverse")}><MapPin className="text-primary" size={20} /> {t.locationConfig}</h3>
                      <button type="button" onClick={addBranch} className="p-3 sm:p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-black transition-all">
                        <Plus size={16}/>
                      </button>
                    </div>
                    
                    <div className="space-y-8">
                      {(siteSettings?.branches || []).map((branch) => (
                        <div key={branch.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-6 relative group transition-all hover:border-primary/20">
                          <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                            <div className="flex items-center gap-4">
                              <button 
                                type="button"
                                onClick={() => toggleBranch(branch.id)}
                                className="p-3 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl transition-all"
                              >
                                {expandedBranches[branch.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} className={isRTL ? "rotate-180" : ""} />}
                              </button>
                              <div className={isRTL ? "text-right" : "text-left"}>
                                <h3 className="font-black italic uppercase tracking-wider text-base text-white/90">
                                  {language === 'ar' ? (branch.nameAr || (isRTL ? "فرع جديد" : "New Branch")) : (branch.name || "New Branch")}
                                </h3>
                                <p className="text-[9px] opacity-30 font-mono tracking-tighter uppercase">{branch.id}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeBranch(branch.id)} className="p-3 hover:bg-red-500/20 text-red-500 rounded-xl transition-all shadow-lg active:scale-90">
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {expandedBranches[branch.id] && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="space-y-8 pt-6 border-t border-white/5"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className={cn("flex flex-col sm:flex-row justify-between sm:items-center gap-2", isRTL && "sm:flex-row-reverse")}>
                                    <label className="text-[10px] uppercase font-black opacity-30 italic">{t.branchNameEn}</label>
                                    <button 
                                      type="button" 
                                      onClick={() => translateBranchField(branch.id, 'name', true)} 
                                      className="text-[10px] font-black uppercase text-primary px-3 py-2 sm:py-1.5 bg-primary/10 rounded-xl hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-2 border border-primary/20 w-full sm:w-auto"
                                    >
                                      <Languages size={12} /> {t.translate} AR
                                    </button>
                                  </div>
                                  <input className="w-full bg-black/40 p-4 rounded-xl text-sm outline-none border border-white/10 focus:border-primary transition-all shadow-inner placeholder:opacity-20" value={branch.name} onChange={e => updateBranch(branch.id, 'name', e.target.value)} placeholder="e.g. Khalda Branch" />
                                </div>
                                <div className="space-y-2">
                                  <div className={cn("flex flex-col sm:flex-row justify-between sm:items-center gap-2", isRTL && "sm:flex-row-reverse")}>
                                    <label className="text-[10px] uppercase font-black opacity-30 italic text-right block">{t.branchNameAr}</label>
                                    <button 
                                      type="button" 
                                      onClick={() => translateBranchField(branch.id, 'name', false)} 
                                      className="text-[10px] font-black uppercase text-primary px-3 py-2 sm:py-1.5 bg-primary/10 rounded-xl hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-2 border border-primary/20 w-full sm:w-auto"
                                    >
                                      <Languages size={12} /> {t.translate} EN
                                    </button>
                                  </div>
                                  <input className="w-full bg-black/40 p-4 rounded-xl text-sm text-right outline-none border border-white/10 focus:border-primary transition-all shadow-inner placeholder:opacity-20" dir="rtl" value={branch.nameAr} onChange={e => updateBranch(branch.id, 'nameAr', e.target.value)} placeholder="فرع خلدا" />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className={cn("flex flex-col sm:flex-row justify-between sm:items-center gap-2", isRTL && "sm:flex-row-reverse")}>
                                    <label className="text-[10px] uppercase font-black opacity-30 italic">{t.branchAddressEn}</label>
                                    <button 
                                      type="button" 
                                      onClick={() => translateBranchField(branch.id, 'address', true)} 
                                      className="text-[10px] font-black uppercase text-primary px-3 py-2 sm:py-1.5 bg-primary/10 rounded-xl hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-2 border border-primary/20 w-full sm:w-auto"
                                    >
                                      <Languages size={12} /> {t.translate} AR
                                    </button>
                                  </div>
                                  <input className="w-full bg-black/40 p-4 rounded-xl text-sm outline-none border border-white/10 focus:border-primary transition-all shadow-inner placeholder:opacity-20" value={branch.address} onChange={e => updateBranch(branch.id, 'address', e.target.value)} placeholder="e.g. King Abdullah St." />
                                </div>
                                <div className="space-y-2">
                                  <div className={cn("flex flex-col sm:flex-row justify-between sm:items-center gap-2", isRTL && "sm:flex-row-reverse")}>
                                    <label className="text-[10px] uppercase font-black opacity-30 italic text-right block">{t.branchAddressAr}</label>
                                    <button 
                                      type="button" 
                                      onClick={() => translateBranchField(branch.id, 'address', false)} 
                                      className="text-[10px] font-black uppercase text-primary px-3 py-2 sm:py-1.5 bg-primary/10 rounded-xl hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-2 border border-primary/20 w-full sm:w-auto"
                                    >
                                      <Languages size={12} /> {t.translate} EN
                                    </button>
                                  </div>
                                  <input className="w-full bg-black/40 p-4 rounded-xl text-sm text-right outline-none border border-white/10 focus:border-primary transition-all shadow-inner placeholder:opacity-20" dir="rtl" value={branch.addressAr} onChange={e => updateBranch(branch.id, 'addressAr', e.target.value)} placeholder="شارع الملك عبدالله" />
                                </div>
                              </div>

                              <div className="space-y-4">
                                 <div className={cn("flex flex-col sm:flex-row justify-between sm:items-center gap-2", isRTL && "sm:flex-row-reverse")}>
                                   <label className="text-[10px] uppercase font-black opacity-30 italic">{t.branchPhone}</label>
                                   <button 
                                     type="button" 
                                     onClick={() => addBranchPhone(branch.id)} 
                                     className="text-[10px] font-black uppercase text-primary px-4 py-2 bg-primary/10 rounded-xl hover:bg-primary hover:text-black transition-all border border-primary/20 w-full sm:w-auto"
                                   >
                                     + {isRTL ? "أضف رقم" : "Add Phone"}
                                   </button>
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                   {(branch.phones || []).map((phone, idx) => (
                                     <div key={idx} className="flex gap-2">
                                       <input 
                                         className="flex-1 bg-black/40 p-4 rounded-xl text-sm font-mono outline-none border border-white/10 focus:border-primary transition-all" 
                                         value={phone} 
                                         onChange={e => updateBranchPhone(branch.id, idx, e.target.value)} 
                                         placeholder="+962..." 
                                       />
                                       {(branch.phones || []).length > 1 && (
                                         <button 
                                           type="button" 
                                           onClick={() => removeBranchPhone(branch.id, idx)} 
                                           className="p-4 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 shrink-0"
                                         >
                                           <X size={16}/>
                                         </button>
                                       )}
                                     </div>
                                   ))}
                                 </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black opacity-30 italic">{t.googleMapsUrl}</label>
                                <input className="w-full bg-black/40 p-4 rounded-xl text-sm outline-none border border-white/10 focus:border-primary transition-all font-mono placeholder:opacity-20" value={branch.mapUrl} onChange={e => updateBranch(branch.id, 'mapUrl', e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." />
                              </div>

                              <div className="pt-8 border-t border-white/5 space-y-6">
                                <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                                  <h4 className="text-[12px] font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                                    <Package size={14} /> {t.manageAreas}
                                  </h4>
                                  <button type="button" onClick={() => addBranchArea(branch.id)} className="text-[11px] font-black bg-primary text-black px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,145,0,0.3)]">
                                    <Plus size={16} className="inline mr-2" /> {t.addArea}
                                  </button>
                                </div>

                                <div className="space-y-6">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] uppercase font-black opacity-30 italic px-2">{t.branchDefaultFee}</label>
                                      <input className="w-full bg-black/40 p-4 rounded-xl text-sm font-mono outline-none border border-white/10 focus:border-primary transition-all" value={branch.deliveryFee || 0} onChange={e => updateBranch(branch.id, 'deliveryFee', parseInt(e.target.value) || 0)} />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4">
                                    {(branch.areas || []).map((area) => (
                                      <div key={area.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4 relative group/area hover:border-primary/30 transition-all shadow-xl">
                                        <button 
                                          type="button" 
                                          onClick={() => removeBranchArea(branch.id, area.id)}
                                          className="absolute top-4 right-4 text-red-500 opacity-0 group-hover/area:opacity-100 transition-all p-3 hover:bg-red-500/10 rounded-xl"
                                        >
                                          <X size={18} />
                                        </button>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                          <div className="space-y-2">
                                            <div className={cn("flex flex-col sm:flex-row justify-between sm:items-center gap-2", isRTL && "sm:flex-row-reverse")}>
                                              <label className="text-[10px] uppercase font-black opacity-30 italic">{t.areaNameEn}</label>
                                              <button 
                                                type="button" 
                                                onClick={() => translateAreaField(branch.id, area.id, 'name', true)} 
                                                className="text-[10px] font-black uppercase text-primary px-3 py-2 sm:py-1.5 bg-primary/10 rounded-xl hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-2 border border-primary/20 w-full sm:w-auto"
                                              ><Languages size={10} /> {t.translate} AR</button>
                                            </div>
                                            <input className="w-full bg-black/20 p-3.5 rounded-xl text-sm outline-none border border-white/10 focus:border-primary transition-all" value={area.name} onChange={e => updateBranchArea(branch.id, area.id, 'name', e.target.value)} />
                                          </div>
                                          <div className="space-y-2">
                                            <div className={cn("flex flex-col sm:flex-row justify-between sm:items-center gap-2", isRTL && "sm:flex-row-reverse")}>
                                              <label className="text-[10px] uppercase font-black opacity-30 italic">{t.areaNameAr}</label>
                                              <button 
                                                type="button" 
                                                onClick={() => translateAreaField(branch.id, area.id, 'name', false)} 
                                                className="text-[10px] font-black uppercase text-primary px-3 py-2 sm:py-1.5 bg-primary/10 rounded-xl hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-2 border border-primary/20 w-full sm:w-auto"
                                              ><Languages size={10} /> {t.translate} EN</button>
                                            </div>
                                            <input className="w-full bg-black/20 p-3.5 rounded-xl text-sm text-right outline-none border border-white/10 focus:border-primary transition-all" dir="rtl" value={area.nameAr} onChange={e => updateBranchArea(branch.id, area.id, 'nameAr', e.target.value)} />
                                          </div>
                                          <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black opacity-30 block italic">{t.areaFee}</label>
                                            <input type="number" className="w-full bg-black/20 p-3.5 rounded-xl text-sm outline-none border border-white/10 focus:border-primary transition-all font-mono" value={area.fee || 0} onChange={e => updateBranchArea(branch.id, area.id, 'fee', parseInt(e.target.value) || 0)} />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Featured & Delivery */}
                <div className="lg:col-span-5 space-y-6 md:space-y-8">
                  <div className="bg-[#1A1A1A] p-5 sm:p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-white/5 space-y-6 sticky lg:top-24">
                    <h3 className={cn("text-lg sm:text-xl font-black italic uppercase flex items-center gap-3", isRTL && "flex-row-reverse")}><Utensils className="text-primary" size={20} /> {isRTL ? "الساندوتش المميز" : "Hero Sandwich"}</h3>
                    <div className="space-y-4">
                      <label className={cn("text-[10px] font-black uppercase opacity-40 block", isRTL && "text-right")}>Select Hero Sandwich</label>
                      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[350px] sm:max-h-[400px] lg:max-h-[500px] overflow-y-auto p-2 no-scrollbar">
                        {items.filter(item => item.category === "Burger").map(item => (
                          <div 
                            key={item._id}
                            onClick={() => setSiteSettings(s => s ? {...s, featuredItemId: item._id} : null)}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all shrink-0 hover:scale-[1.02] active:scale-95",
                              siteSettings?.featuredItemId === item._id 
                                ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(255,145,0,0.15)]" 
                                : "bg-white/5 border-white/5 hover:border-primary/30"
                            )}
                          >
                            {item.image ? (
                              <img src={item.image} className="w-10 h-10 rounded-lg object-cover" />
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <p className="font-black text-[10px] uppercase truncate">{language === "ar" ? item.nameAr : item.name}</p>
                              <p className="text-[8px] opacity-40 italic truncate">{item.category}</p>
                            </div>
                            {siteSettings?.featuredItemId === item._id && <Check size={12} className="ml-auto text-primary shrink-0" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Submit button spans full width on desktop */}
                <div className="lg:col-span-12 pt-4">
                  <button type="submit" className="w-full bg-primary text-black h-16 sm:h-20 rounded-2xl sm:rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-sm sm:text-base">
                    {loading ? <RefreshCw className="animate-spin" /> : (
                      <>
                        <Save size={20} />
                        {t.saveSettings}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {confirmStatus && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#1A1A1A] p-10 rounded-[3rem] border border-white/10 w-full max-w-sm text-center">
                <h3 className="text-2xl font-black uppercase italic mb-4">{t.areYouSure}</h3>
                <p className="text-white/40 text-sm mb-8">{t.confirmStatusChange} <span className="text-primary">"{confirmStatus.status}"</span></p>
                
                {confirmStatus.status === "Out for Delivery" && (
                  <div className="mb-8 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">{t.deliveryFee}</label>
                    <input 
                      type="number"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 font-mono outline-none focus:border-primary transition-colors"
                      value={deliveryFeeUpdate}
                      onChange={e => setDeliveryFeeUpdate(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-[8px] opacity-30 uppercase font-black px-2 mt-1">Set final delivery amount for this location</p>
                  </div>
                )}

                {confirmStatus.status === "Cancelled" && (
                  <div className="mb-8 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">{t.cancelReason}</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-red-500/50 transition-colors resize-none"
                      rows={3}
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder={t.provideReason}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setConfirmStatus(null); setCancelReason(""); }} className="py-4 bg-white/5 rounded-xl font-black uppercase text-[10px]">Cancel</button>
                  <button onClick={confirmStatusChange} className={cn("py-4 rounded-xl font-black uppercase text-[10px]", confirmStatus.status === "Cancelled" ? "bg-red-500 text-white" : "bg-white text-black")}>Confirm</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
                  <button onClick={() => setGenericConfirm(null)} className="py-4 bg-white/5 rounded-xl font-black uppercase text-[10px] hover:bg-white/10 transition-colors">Cancel</button>
                  <button onClick={genericConfirm.onConfirm} className={cn("py-4 rounded-xl font-black uppercase text-[10px] transition-all glow-orange-sm", genericConfirm.isDangerous ? "bg-red-500 text-white" : "bg-white text-black")}>
                    Confirm
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OrderCard({ order, onStatusChange, onDelete, t, formatDate, isRTL }: any) {
  const statusMap: Record<string, string> = {
    "Pending": t.pending || "Pending",
    "Preparing": t.preparing || "Preparing",
    "Out for Delivery": t.outForDelivery || "Out for Delivery",
    "Completed": t.completed || "Completed",
    "Cancelled": t.cancelled || "Cancelled"
  };

  return (
    <div className={cn("bg-[#1A1A1A] p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 group relative", isRTL && "text-right")}>
      <div className={cn("flex flex-col lg:flex-row justify-between gap-8", isRTL && "lg:flex-row-reverse")}>
        <div className="flex-1 space-y-6">
          <div className={cn("flex flex-wrap gap-2 md:gap-3", isRTL && "flex-row-reverse")}>
            <span className="bg-white/5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-[10px] font-mono opacity-60">#{order._id.slice(-6).toUpperCase()}</span>
            <span className="bg-white/5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-[10px] font-mono opacity-60">{formatDate(order.createdAt)}</span>
            <span className={cn("px-3 md:px-4 py-2 rounded-full text-xs md:text-[10px] font-black uppercase", order.status === "Pending" ? "bg-yellow-500/10 text-yellow-500" : "bg-primary/10 text-primary")}>
              {statusMap[order.status] || order.status}
            </span>
          </div>
          <div>
            <h4 className="text-xl md:text-2xl font-black italic uppercase mb-1 flex flex-wrap items-center gap-2">
              {order.customerName}
              {order.status === "Cancelled" && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded not-italic whitespace-nowrap">{t.cancelled}</span>}
            </h4>
            <p className="text-primary font-mono text-sm md:text-base">{order.phone}</p>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-white/40 italic flex items-start md:items-center gap-2">
                <MapPin size={10} className="text-primary mt-1 md:mt-0" />
                <span className="flex-1 line-clamp-2 md:line-clamp-none">{order.address}</span>
              </p>
              <p className="text-[9px] md:text-[10px] font-black uppercase text-primary/60 px-3 md:px-4 py-1 bg-primary/5 rounded-full inline-block">
                {order.selectedArea || "No Area Selected"}
              </p>
            </div>
          </div>
          {order.notes && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[8px] font-black uppercase opacity-40 mb-1">{t.notesLabel || "Notes"}</p>
              <p className="text-[10px] text-white/80 italic">{order.notes}</p>
            </div>
          )}
          <div className="space-y-2 py-4 border-y border-white/5">
            {order.items.map((item: any, i: number) => (
              <div key={i} className={cn("flex justify-between text-xs md:text-sm", isRTL && "flex-row-reverse")}>
                <span className="opacity-60">{item.quantity}x {item.name}</span>
                <span className="font-mono whitespace-nowrap">{item.price * item.quantity} {t.egp}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2">
            <div className={cn("flex justify-between text-[9px] md:text-[10px] uppercase font-black opacity-40 italic", isRTL && "flex-row-reverse")}>
               <span>{t.subtotal}</span>
               <span className="whitespace-nowrap">{order.subtotal || (order.total - (order.deliveryFee || 0))} {t.egp}</span>
            </div>
            <div className={cn("flex justify-between text-[9px] md:text-[10px] uppercase font-black opacity-40 italic", isRTL && "flex-row-reverse")}>
               <span>{t.deliveryFee}</span>
               <span className="text-primary whitespace-nowrap">{order.deliveryFee || 0} {t.egp}</span>
            </div>
            <div className={cn("flex justify-between items-center pt-4 border-t border-white/10", isRTL && "flex-row-reverse")}>
               <span className="text-xs font-black uppercase text-white italic">{t.finalAmount}</span>
               <span className="text-xl md:text-2xl font-black text-primary italic glow-orange-sm whitespace-nowrap">{order.total} {t.egp}</span>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-48 space-y-2">
           <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2")}>
             {["Preparing", "Out for Delivery", "Completed"].map(s => (
               <button key={s} onClick={() => onStatusChange(order._id, s, order.status, order.deliveryFee)} disabled={order.status === "Completed" || order.status === "Cancelled" || order.status === s} className={cn("w-full py-4 lg:py-3 rounded-xl text-[10px] font-black uppercase border transition-all", order.status === s ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/5 hover:border-primary/40")}>
                 {statusMap[s] || s}
               </button>
             ))}
           </div>
           {order.status === "Pending" && (
             <button onClick={() => onStatusChange(order._id, "Cancelled", order.status)} className="w-full py-4 lg:py-3 rounded-xl text-[10px] font-black uppercase border border-red-500/50 text-red-500 hover:bg-red-500/10 mt-2">
               {t.cancelOrder}
             </button>
           )}
           {order.status === "Cancelled" && order.cancelReason && (
             <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
               <p className="text-[8px] font-black uppercase opacity-40 mb-1">{t.cancelReason}</p>
               <p className="text-[10px] text-red-500 font-bold italic">{order.cancelReason}</p>
             </div>
           )}
           <button onClick={() => onDelete(order._id)} className="w-full py-4 lg:py-3 rounded-xl text-[10px] font-black uppercase text-red-500/40 hover:text-red-500 mt-4"><Trash2 size={12} className="inline mr-2"/> {isRTL ? "حذف" : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}
