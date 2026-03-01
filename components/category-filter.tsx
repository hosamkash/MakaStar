"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Package } from "lucide-react"
import ResponsiveCategoryGrid from "./responsive-category-grid"

interface Category {
  id: string
  ID: number
  Code: number
  Name: string
  IsActive: boolean
  IsSalesCategory: boolean
  IsViewAllProducts: boolean
  IsBindShop: boolean
  IsBindShopMaster: boolean
  ImageName: string
  ImageURL: string
  ShortName: string
  IsSelected: boolean
}

interface ShopCategory {
  id: string
  mainCategoryId: number
  mainCategoryName: string
  subCategories: number[]
  subCategoriesNames: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  productCount?: number
  selectedMainCategory?: number | null
  shopCategories?: ShopCategory[]
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  productCount = 0,
  selectedMainCategory = null,
  shopCategories = []
}: CategoryFilterProps) {
  const getCategoryDisplayName = (category: Category) => {
    return category.ShortName || category.Name
  }

  const isCategorySelected = (categoryId: string) => {
    return selectedCategory === categoryId
  }

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId)
  }

  // الحصول على التصنيفات الفرعية المراد عرضها
  const getDisplayCategories = () => {
    if (selectedMainCategory !== null) {
      // التصنيفات الفرعية للتصنيف الرئيسي المحدد
      const selectedShopCategory = shopCategories.find(sc => sc.mainCategoryId === selectedMainCategory)
      if (selectedShopCategory) {
        return categories.filter(cat => selectedShopCategory.subCategories.includes(cat.ID))
      }
    } else {
      // جميع التصنيفات الفرعية من جميع التصنيفات الرئيسية
      const allSubCategories = shopCategories.flatMap(sc => sc.subCategories)
      return categories.filter(cat => allSubCategories.includes(cat.ID))
    }
    return []
  }

  const displayCategories = getDisplayCategories()

  return (
    <div className="w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 py-2">
       
        {/* عرض التصنيفات باستخدام المكون الجديد */}
        <ResponsiveCategoryGrid
          categories={displayCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryClick}
          title={selectedMainCategory !== null ? "التصنيفات الفرعية" : "جميع التصنيفات الفرعية"}
          showScrollIndicator={true}
          maxRows={3}
        />
      </div>
    </div>
  )
}
