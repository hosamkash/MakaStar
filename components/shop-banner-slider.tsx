"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { ref, listAll, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  ExternalLink,
  ShoppingCart,
  Star,
  Tag
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ShopBanner {
  id: string
  ID: number
  Code: number
  Name: string
  IsActive: boolean
  ShortDescription: string
  LongDescription: string
  ImageFolderPath: string
  ImageURL?: string
  Images?: Array<{
    name: string
    url: string
  }>
}

interface SlideItem {
  id: string
  bannerId: string
  bannerName: string
  bannerShortDescription: string
  bannerLongDescription: string
  imageUrl: string
  imageName: string
  bannerCode: number
}

interface ShopBannerSliderProps {
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  showControls?: boolean
  showIndicators?: boolean
  showArrows?: boolean
}

export default function ShopBannerSlider({
  className = "",
  autoPlay = true,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  showArrows = true
}: ShopBannerSliderProps) {
  const [slides, setSlides] = useState<SlideItem[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [loading, setLoading] = useState(true)

  // جلب البانرات المفعلة من Firebase
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        console.log("بدء جلب البانرات المفعلة...")
        
        const bannersCollection = collection(db, "Def_ShopBanner")
        const bannersQuery = query(
          bannersCollection,
          where("IsActive", "==", true)
        )
        const bannersSnapshot = await getDocs(bannersQuery)
        console.log("عدد البانرات المستلمة:", bannersSnapshot.size)
        
        // فلترة إضافية للتأكد من أن البانرات مفعلة
        const activeBanners = bannersSnapshot.docs.filter(doc => {
          const data = doc.data()
          return data.IsActive === true
        })
        console.log("عدد البانرات المفعلة:", activeBanners.length)
        
        const bannersData = await Promise.all(
          activeBanners.map(async (doc) => {
            const data = doc.data()
            const banner = {
              id: doc.id,
              ID: data.ID || parseInt(doc.id),
              Code: data.Code || 0,
              Name: data.Name || '',
              IsActive: data.IsActive || false,
              ShortDescription: data.ShortDescription || '',
              LongDescription: data.LongDescription || '',
              ImageFolderPath: data.ImageFolderPath || '',
              ImageURL: data.ImageURL || '',
              Images: [] as Array<{ name: string; url: string }>
            }

            // جلب الصور من Firebase Storage إذا كان هناك مسار
            if (banner.ImageFolderPath && storage) {
              try {
                console.log(`جلب الصور من المسار: ${banner.ImageFolderPath}`)
                const folderRef = ref(storage, banner.ImageFolderPath)
                const result = await listAll(folderRef)
                
                const imageUrls = await Promise.all(
                  result.items.map(async (item) => {
                    const url = await getDownloadURL(item)
                    return {
                      name: item.name,
                      url: url
                    }
                  })
                )
                
                banner.Images = imageUrls
                console.log(`تم جلب ${imageUrls.length} صورة للبانر ${banner.Name}`)
              } catch (error) {
                console.error(`خطأ في جلب الصور للبانر ${banner.Name}:`, error)
                banner.Images = []
              }
            }

            return banner
          })
        ) as ShopBanner[]

        // ترتيب البانرات حسب الكود
        const sortedBanners = bannersData.sort((a, b) => a.Code - b.Code)
        console.log("البانرات المرتبة:", sortedBanners)
        
        // تحويل البانرات إلى شرائح فردية
        const allSlides: SlideItem[] = []
        
        sortedBanners.forEach(banner => {
          if (banner.Images && banner.Images.length > 0) {
            // إضافة كل صورة من الجاليري كشريحة منفصلة
            banner.Images.forEach((image, imageIndex) => {
              allSlides.push({
                id: `${banner.id}_${imageIndex}`,
                bannerId: banner.id,
                bannerName: banner.Name,
                bannerShortDescription: banner.ShortDescription,
                bannerLongDescription: banner.LongDescription,
                imageUrl: image.url,
                imageName: image.name,
                bannerCode: banner.Code
              })
            })
          } else if (banner.ImageURL) {
            // إضافة الصورة الفردية كشريحة
            allSlides.push({
              id: `${banner.id}_single`,
              bannerId: banner.id,
              bannerName: banner.Name,
              bannerShortDescription: banner.ShortDescription,
              bannerLongDescription: banner.LongDescription,
              imageUrl: banner.ImageURL,
              imageName: 'single_image',
              bannerCode: banner.Code
            })
          }
        })
        
        console.log("إجمالي الشرائح:", allSlides.length)
        setSlides(allSlides)
        
      } catch (error) {
        console.error("Error fetching banners:", error)
        setSlides([])
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  // التحكم في التشغيل التلقائي
  useEffect(() => {
    if (!autoPlay || !isPlaying || slides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, isPlaying, slides.length, autoPlayInterval])

  // الانتقال إلى شريحة محددة
  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // الانتقال للشريحة التالية
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  // الانتقال للشريحة السابقة
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  // تبديل التشغيل/الإيقاف
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  if (loading) {
    return (
      <div className={cn("relative w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البانرات...</p>
        </div>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className={cn("relative w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد بانرات مفعلة</h3>
          <p className="text-gray-500">قم بإضافة بانرات وتفعيلها في لوحة الإدارة</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full h-[200px] md:h-50 lg:h-60 overflow-hidden rounded-2xl shadow-2xl", className)}>
      {/* الشرائح */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-all duration-1000 ease-in-out",
              index === currentSlide 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-105"
            )}
          >
                         {/* صورة الخلفية - بدون تأثيرات للاعتماد على الصور فقط */}
            <img
              src={slide.imageUrl}
              alt={slide.bannerName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
                         {/* المحتوى - محذوف للاعتماد على الصور فقط */}
          </div>
        ))}
      </div>

      {/* الأسهم */}
      {showArrows && slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-full w-12 h-12"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-full w-12 h-12"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* مؤشرات الشريحة */}
      {showIndicators && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              )}
            />
          ))}
        </div>
      )}

      {/* أزرار التحكم */}
      {showControls && slides.length > 1 && (
        <div className="absolute top-6 right-6 z-30 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-full w-10 h-10"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {/* عداد الشريحة */}
      {slides.length > 1 && (
        <div className="absolute top-6 left-6 z-30">
          <Badge className="bg-white/20 text-white backdrop-blur-sm border-0">
            {currentSlide + 1} / {slides.length}
          </Badge>
        </div>
      )}

             {/* تأثير التدرج السفلي - محذوف للاعتماد على الصور فقط */}
    </div>
  )
}
