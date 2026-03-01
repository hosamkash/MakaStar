"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Crown } from "lucide-react"
import Image from "next/image"

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

interface ResponsiveCategoryGridProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  title?: string
  showScrollIndicator?: boolean
  maxRows?: number
}

export default function ResponsiveCategoryGrid({
  categories,
  selectedCategory,
  onCategoryChange,
  title = "التصنيفات",
  showScrollIndicator = true,
  maxRows = 3
}: ResponsiveCategoryGridProps) {
  const [showAll, setShowAll] = useState(false)
  const [gridCols, setGridCols] = useState(8)

  // حساب عدد العناصر في الصف الواحد بناءً على حجم الشاشة
  const getGridCols = () => {
    if (typeof window === 'undefined') return 8 // default for SSR
    const width = window.innerWidth
    if (width < 640) return 6 // sm - 6 عناصر في الصف للموبايل
    if (width < 768) return 7 // md
    if (width < 1024) return 8 // lg
    if (width < 1280) return 9 // xl
    return 10 // 2xl
  }

  // تحديث عدد الأعمدة عند تغيير حجم النافذة
  useEffect(() => {
    const updateGridCols = () => {
      setGridCols(getGridCols())
    }

    updateGridCols()
    window.addEventListener('resize', updateGridCols)
    
    return () => {
      window.removeEventListener('resize', updateGridCols)
    }
  }, [])

  // في الموبايل: صفين فقط مع تمرير أفقي
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const maxItems = isMobile ? (maxRows * gridCols) : (maxRows * gridCols)
  const displayCategories = showAll ? categories : categories.slice(0, maxItems)
  const hasMoreItems = categories.length > maxItems

  return (
    <div className="w-full bg-white">
      <div className="container mx-auto px-4 py-4">
        {/* العنوان */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 text-right">{title}</h2>
          {hasMoreItems && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-sm"
            >
              {showAll ? "عرض أقل" : "عرض المزيد"}
            </Button>
          )}
        </div>

        {/* شبكة التصنيفات الدائرية */}
        <div 
          className={`${
            isMobile 
              ? `grid gap-3 overflow-x-auto ${showAll ? 'max-h-none' : 'overflow-hidden'}` 
              : `grid gap-4 transition-all duration-300 ${showAll ? 'max-h-none' : 'overflow-hidden'}`
          }`}
          style={{
            gridTemplateColumns: isMobile ? `repeat(${Math.ceil(displayCategories.length / 2)}, minmax(80px, 1fr))` : `repeat(${gridCols}, minmax(0, 1fr))`,
            gridTemplateRows: isMobile ? 'repeat(2, 1fr)' : 'auto',
            maxHeight: showAll ? 'none' : isMobile ? '280px' : `${maxRows * 140}px`,
            scrollbarWidth: isMobile ? 'thin' : 'auto'
          }}
        >
          {displayCategories.map((category) => (
            <div
              key={category.id}
              className={`group cursor-pointer transition-all duration-300 hover:scale-105 rounded-lg p-2 ${
                selectedCategory === category.id ? 'bg-blue-50' : ''
              } ${isMobile ? 'flex-shrink-0' : ''}`}
              onClick={() => onCategoryChange(category.id)}
              style={isMobile ? { minWidth: '80px' } : {}}
            >
              {/* الأيقونة الدائرية */}
              <div className="relative mb-2">
                <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} mx-auto bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-colors shadow-sm`}>
                  {category.ImageURL ? (
                    <Image
                      src={category.ImageURL}
                      alt={category.Name}
                      width={isMobile ? 64 : 80}
                      height={isMobile ? 64 : 80}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <Package className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400 ${category.ImageURL ? 'hidden' : ''}`} />
                </div>
              </div>

              {/* اسم التصنيف */}
              <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900 text-center line-clamp-2 leading-tight`}>
                {category.Name}
              </h3>
            </div>
          ))}
        </div>

        {/* مؤشر التمرير */}
        {hasMoreItems && !showAll && showScrollIndicator && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span>{isMobile ? 'اسحب أفقياً لعرض المزيد' : 'اسحب للأسفل لعرض المزيد'}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
