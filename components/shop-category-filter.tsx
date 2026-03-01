"use client"

import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

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

interface ShopCategoryFilterProps {
  shopCategories: ShopCategory[]
  selectedMainCategory: number | null
  onMainCategoryChange: (mainCategoryId: number | null) => void
  productCount: number
}

export default function ShopCategoryFilter({
  shopCategories,
  selectedMainCategory,
  onMainCategoryChange,
  productCount
}: ShopCategoryFilterProps) {
  return (
    <section className="py-2 bg-yellow-50 border-b border-yellow-200">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-3">
          {/* العنوان وعدد المنتجات */}
          <div className="flex items-center justify-between">
           
            <div className="flex items-center gap-2">

                  {/* رابط "كل التصنيفات الفرعية" */}
            <button
              onClick={() => onMainCategoryChange(null)}
              className={`text-sm font-medium transition-colors ${
                selectedMainCategory === null 
                  ? 'text-blue-600 underline' 
                  : 'text-gray-600 hover:text-blue-600 hover:underline'
              }`}
            >
              كل التصنيفات
            </button>

              {/* التصنيفات الرئيسية */}
              {shopCategories.map((shopCategory) => (
              <button
                key={shopCategory.id}
                onClick={() => onMainCategoryChange(shopCategory.mainCategoryId)}
                className={`text-sm font-medium transition-colors ${
                  selectedMainCategory === shopCategory.mainCategoryId 
                    ? 'text-blue-600 underline' 
                    : 'text-gray-600 hover:text-blue-600 hover:underline'
                }`}
              >
                {shopCategory.mainCategoryName}
              </button>
            ))}
            
              <Badge variant="secondary" className="text-sm">
                {productCount} منتج
              </Badge>
              

           

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
