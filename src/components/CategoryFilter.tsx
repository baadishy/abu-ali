import React from "react";
import { Category } from "../types";
import { cn } from "../lib/utils";

import { useLanguage } from "../context/LanguageContext";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: Category | "All";
  onCategoryChange: (category: Category | "All") => void;
}

const CATEGORY_MAP: Record<string, string> = {
  "Burger": "برجر",
  "Meals": "وجبات",
  "Fries": "بطاطس",
  "Drinks": "مشروبات",
  "All": "الكل",
};

export function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
  const { language, t } = useLanguage();

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
      <button
        onClick={() => onCategoryChange("All")}
        className={cn(
          "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
          activeCategory === "All"
            ? "bg-primary border-primary text-black"
            : "bg-white/5 border-white/10 text-white opacity-40 hover:opacity-100"
        )}
      >
        {language === "ar" ? CATEGORY_MAP["All"] : "All Fuel"}
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={cn(
            "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
            activeCategory === category
              ? "bg-primary border-primary text-black"
              : "bg-white/5 border-white/10 text-white opacity-40 hover:opacity-100"
          )}
        >
          {language === "ar" ? CATEGORY_MAP[category] : category}
        </button>
      ))}
    </div>
  );
}
