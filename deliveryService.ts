import mongoose from 'mongoose';

export interface Area {
  name: string;
  fee: number;
}

export interface Settings {
  storeName: string;
  defaultDeliveryFee: number;
  areas: Area[];
}

export const getDeliveryFee = async (areaName: string, branchId?: string): Promise<number> => {
  const Settings = mongoose.model("Settings");
  const settings = await Settings.findOne() as any;
  
  if (!settings) return 0;
  
  // Try to find in a specific branch if branchId is provided
  if (branchId && settings.branches) {
    const branch = settings.branches.find((b: any) => b.id === branchId);
    if (branch && branch.areas) {
      const area = branch.areas.find((a: any) => a.name === areaName || a.nameAr === areaName);
      if (area) return area.fee;
      return branch.deliveryFee || settings.defaultDeliveryFee || 0;
    }
  }

  // Fallback to global areas (if any left) or default
  if (settings.areas) {
    const area = settings.areas.find((a: any) => a.name === areaName || a.nameAr === areaName);
    if (area) return area.fee;
  }
  
  return settings.defaultDeliveryFee || 0;
};
