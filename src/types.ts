export interface Category {
  _id?: string;
  name: string;
  nameAr: string;
  slug: string;
  order: number;
}

export interface ItemVariant {
  id: string;
  name: string;
  nameAr: string;
  price: number;
}

export interface MenuItem {
  _id: string;
  name: string;
  nameAr?: string;
  price: number;
  discountPrice?: number;
  category: string; // Category slug
  image?: string;
  imagePublicId?: string;
  description?: string;
  descriptionAr?: string;
  isAvailable: boolean;
  variants?: ItemVariant[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedVariantId?: string;
}

export interface Order {
  _id: string;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  selectedArea: string; // This used to store the label, will keep for backward compatibility or change its use
  branchId?: string;
  branchName?: string;
  branchNameAr?: string;
  areaId?: string;
  areaName?: string;
  areaNameAr?: string;
  customerName: string;
  phone: string;
  address: string;
  status: "Pending" | "Preparing" | "Out for Delivery" | "Completed" | "Cancelled";
  cancelReason?: string;
  notes?: string;
  createdAt?: string;
}

export interface Area {
  id: string;
  name: string;
  nameAr: string;
  fee: number;
}

export interface PromotionalOffer {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  imagePublicId?: string;
  isActive: boolean;
  type: 'buy_x_get_y' | 'fixed_discount' | 'percentage_discount' | 'manual';
  buyQuantity?: number;
  getQuantity?: number;
  categoryLimit?: string; // Category slug
  discountValue?: number;
  branchIds?: string[];
}

export interface Branch {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  phones: string[];
  mapUrl?: string; // Optional Google Maps link
  deliveryFee: number;
  areas: Area[];
}

export interface SiteSettings {
  storeName: string;
  storeNameAr: string;
  defaultDeliveryFee: number;
  freeDeliveryThreshold?: number;
  areas: Area[];
  offers?: PromotionalOffer[];
  featuredItemId?: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    whatsapp: string;
    tiktok: string;
  };
  hotlineNumbers: string[];
  openingTime?: string;
  closingTime?: string;
  isOpen24Hours?: boolean;
  branches: Branch[];
}
