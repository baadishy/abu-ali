import { CartItem, SiteSettings, PromotionalOffer } from "../types";

export interface PotentialOffer {
  offerId: string;
  title: string;
  titleAr: string;
  missingQuantity: number;
  category?: string;
  type: 'buy_x_get_y';
}

export interface CalculationResult {
  subtotal: number;
  discount: number;
  total: number;
  appliedOffers: {
    offerId: string;
    discountAmount: number;
    title: string;
    titleAr: string;
  }[];
  potentialOffers: PotentialOffer[];
}

export function calculateOrderTotals(items: CartItem[], settings: SiteSettings | null, selectedBranchId?: string): CalculationResult {
  let subtotal = 0;
  const itemCosts: { price: number; quantity: number; category: string }[] = [];

  // 1. Calculate raw subtotal and prepare items for offer processing
  items.forEach(item => {
    const variant = item.variants?.find(v => v.id === item.selectedVariantId);
    const price = variant ? variant.price : (item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price);
    subtotal += price * item.quantity;
    
    // Add clones of items to list for logic processing (splitting by quantity)
    for (let i = 0; i < item.quantity; i++) {
      itemCosts.push({ price, quantity: 1, category: item.category });
    }
  });

  if (!settings || !settings.offers) {
    return { subtotal, discount: 0, total: subtotal, appliedOffers: [], potentialOffers: [] };
  }

  const activeOffers = settings.offers.filter(o => 
    o.isActive && 
    o.type !== 'manual' && 
    (!selectedBranchId || !o.branchIds || o.branchIds.length === 0 || o.branchIds.includes(selectedBranchId))
  );
  let discount = 0;
  const appliedOffers: CalculationResult['appliedOffers'] = [];
  const potentialOffers: PotentialOffer[] = [];

  // Sort offers: Buy X Get Y usually comes first, then percentage, then fixed?
  // Actually, we process Buy X Get Y on individual items.
  
  // We'll track which "item units" have already been discounted
  const discountedIndices = new Set<number>();

  activeOffers.forEach(offer => {
    let offerDiscount = 0;

    if (offer.type === 'buy_x_get_y') {
      const buyQ = offer.buyQuantity || 0;
      const getQ = offer.getQuantity || 0;
      if (buyQ <= 0 || getQ <= 0) return;

      // Filter eligible items for this offer
      const pool = itemCosts
        .map((item, index) => ({ ...item, originalIndex: index }))
        .filter(item => !discountedIndices.has(item.originalIndex))
        .filter(item => !offer.categoryLimit || item.category === offer.categoryLimit);

      // Number of groups of (Buy X + Get Y)
      const groupSize = buyQ + getQ;
      const numGroups = Math.floor(pool.length / groupSize);

      if (numGroups > 0) {
        // Sort by price ascending to give away cheaper items first (standard restaurant logic)
        const eligibleItems = [...pool].sort((a, b) => a.price - b.price);
        // High price items are paid, low price items are free in each group
        // To be safe, we just take the cheapest `numGroups * getQ` items from the eligible pool as free
        for (let i = 0; i < numGroups * getQ; i++) {
          const freeItem = eligibleItems[i];
          offerDiscount += freeItem.price;
          discountedIndices.add(freeItem.originalIndex);
        }
      }

      // Check for potential offer (if user has some items but not enough for a group)
      const remainingInPool = pool.length % groupSize;
      if (remainingInPool >= buyQ && remainingInPool < groupSize) {
        potentialOffers.push({
          offerId: offer.id,
          title: offer.title,
          titleAr: offer.titleAr,
          missingQuantity: groupSize - remainingInPool,
          category: offer.categoryLimit,
          type: 'buy_x_get_y'
        });
      } else if (pool.length > 0 && pool.length < buyQ) {
         // Also suggest if they have at least one but less than buy amount
         potentialOffers.push({
          offerId: offer.id,
          title: offer.title,
          titleAr: offer.titleAr,
          missingQuantity: buyQ + getQ - pool.length,
          category: offer.categoryLimit,
          type: 'buy_x_get_y'
        });
      }
    } else if (offer.type === 'fixed_discount') {
      // Fixed discount applies once if any eligible item exists
      const hasEligible = itemCosts.some((item, index) => 
        !discountedIndices.has(index) && (!offer.categoryLimit || item.category === offer.categoryLimit)
      );
      if (hasEligible) {
        offerDiscount = offer.discountValue || 0;
      }
    } else if (offer.type === 'percentage_discount') {
      // Apply percentage to ALL eligible items that haven't been discounted yet
      const eligibleTotal = itemCosts
        .filter((item, index) => !discountedIndices.has(index) && (!offer.categoryLimit || item.category === offer.categoryLimit))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      if (eligibleTotal > 0) {
        offerDiscount = eligibleTotal * ((offer.discountValue || 0) / 100);
      }
    }

    if (offerDiscount > 0) {
      discount += offerDiscount;
      appliedOffers.push({
        offerId: offer.id,
        discountAmount: offerDiscount,
        title: offer.title,
        titleAr: offer.titleAr
      });
    }
  });

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    appliedOffers,
    potentialOffers
  };
}
