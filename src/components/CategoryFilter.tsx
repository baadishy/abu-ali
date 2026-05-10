import React from "react";
import { Category } from "../types";
import { cn } from "../lib/utils";

import { useLanguage } from "../context/LanguageContext";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string | "All";
  onCategoryChange: (slug: string | "All") => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const { language, t } = useLanguage();

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-4 no-scrollbar",
        language === "ar" && "flex-row-reverse",
      )}
    >
      <button
        onClick={() => onCategoryChange("All")}
        className={cn(
          "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
          activeCategory === "All"
            ? "bg-primary border-primary text-black"
            : "bg-white/5 border-white/10 text-white opacity-40 hover:opacity-100 shadow-xl",
        )}
      >
        {t.allFuel}
      </button>
      {categories.map((category) => (
        <button
          key={category.slug}
          onClick={() => onCategoryChange(category.slug)}
          className={cn(
            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
            activeCategory === category.slug
              ? "bg-primary border-primary text-black"
              : "bg-white/5 border-white/10 text-white opacity-40 hover:opacity-100 shadow-xl",
          )}
        >
          {language === "ar" ? category.nameAr : category.name}
        </button>
      ))}
    </div>
  );
}
