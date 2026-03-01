"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, Eye, Star, Tag, Gift, Share2 } from "lucide-react"
import { formatCurrencyEGP } from "@/lib/utils"
import { Offer } from "@/lib/types/offers"
import { useCart } from "@/lib/contexts/cart-context"
import { useClientSession } from "@/lib/hooks/use-client-session"
import { notify } from "@/lib/notifications"
import OfferDetailsDialog from "./offer-details-dialog"
import ClientLoginDialog from "./client-login-dialog"

interface OfferCardProps {
  offer: Offer
  onAddToCart?: (offer: Offer) => void
}

export default function OfferCard({ offer, onAddToCart }: OfferCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const { addToCart, isInCart } = useCart()
  const { session: clientSession } = useClientSession()

  const handleAddToCart = async () => {
    if (!clientSession) {
      setShowLoginDialog(true)
      return
    }

    try {
      // إنشاء عرض كباكدج كامل في السلة
      const cartOffer = {
        ID: offer.ID || 0,
        BarCode: offer.ID || 0, // استخدام معرف العرض كباركود
        IDProduct: offer.ID || 0, // استخدام معرف العرض كمعرف المنتج
        Name: offer.Name || 'عرض',
        IDCategory: 0, // فئة افتراضية للعروض
        IDProductionCompany: 0, // شركة إنتاج افتراضية
        UnitID: 1, // وحدة افتراضية
        PurchasePrice: 0, // سعر الشراء (غير مطلوب للعروض)
        Qty: 1, // الكمية
        // السعر الأصلي (قبل الخصم)
        PriceBeforDiscount: offer.TotalValue || 0,
        // السعر بعد الخصم
        SalesPrice: offer.TotalValueAfterOffer || 0,
        // قيمة الخصم
        DiscountValue: (offer.TotalValue || 0) - (offer.TotalValueAfterOffer || 0),
        DiscountPercent: offer.TotalValue && offer.TotalValueAfterOffer 
          ? ((offer.TotalValue - offer.TotalValueAfterOffer) / offer.TotalValue) * 100 
          : 0,
        // الإجماليات
        TotalPriceBeforDiscount: offer.TotalValue || 0,
        TotalSalesPrice: offer.TotalValueAfterOffer || 0,
        TotalDiscountValue: (offer.TotalValue || 0) - (offer.TotalValueAfterOffer || 0),
        // الربح (غير مطلوب للعروض)
        ProfitValue: 0,
        TotalProfitValue: 0,
        // معلومات إضافية
        ShopColors: '', // ألوان فارغة للعروض
        ShopSizes: '', // مقاسات فارغة للعروض
        ShopShortDiscription: offer.ShortDiscription || '',
        ShopLongDiscription: offer.ShortDiscription || '',
        ImageName: '', // اسم الصورة فارغ
        ImageURL: offer.ImageURL || '',
        ImageFolderPath: '', // مسار الصورة فارغ
        Notes: '', // ملاحظات فارغة
        UserID: 0, // معرف المستخدم (سيتم تحديثه في CartContext)
        UID: '', // معرف فريد فارغ
        DefaultSalesCommission: 0, // عمولة المبيعات الافتراضية
        // حقول خاصة بالعروض
        isOffer: true,
        offerId: offer.ID,
        offerName: offer.Name,
        offerProductsCount: offer.ProductsCount,
        offerDescription: offer.ShortDiscription
      }
      
      await addToCart(cartOffer, 1)
      notify.success(`تم إضافة عرض "${offer.Name || 'العرض'}" إلى السلة`)
      
      if (onAddToCart) {
        onAddToCart(offer)
      }
    } catch (error) {
      console.error('Error adding offer to cart:', error)
      notify.error('فشل في إضافة العرض للسلة')
    }
  }

  const handleLoginSuccess = () => {
    // بعد تسجيل الدخول، أضف العرض للسلة تلقائياً
    handleAddToCart()
  }

  const isOfferInCart = isInCart(offer.ID || 0)

  const shareOffer = async () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/store?offer=${offer.ID}`
    const shareData: ShareData = {
      title: offer.Name || 'عرض خاص',
      text: offer.ShortDiscription || `اكتشف عرض "${offer.Name}" في متجر مكة ستار`,
      url
    }

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData)
        return
      }
      await navigator.clipboard.writeText(url)
      alert('تم نسخ رابط العرض للحافظة')
    } catch (error: any) {
      if (error && (error.name === 'AbortError' || error.message?.includes('AbortError'))) {
        return
      }
      console.error('Error sharing:', error)
      try {
        await navigator.clipboard.writeText(url)
        alert('تم نسخ رابط العرض للحافظة')
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError)
        alert('حدث خطأ في المشاركة')
      }
    }
  }

  return (
    <>
      <Card 
        className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 cursor-pointer active:scale-95"
        onClick={() => setShowDetails(true)}
      >
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-t-lg flex items-center justify-center overflow-hidden">
            {offer.ImageURL ? (
              <img 
                src={offer.ImageURL} 
                alt={offer.Name}
                className="w-full h-full object-contain rounded-t-lg group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-center">
                <Gift className="w-20 h-20 text-orange-400 mx-auto mb-2" />
                <p className="text-orange-600 font-semibold">عرض خاص</p>
              </div>
            )}
            
            {/* شارة العرض */}
            <div className="absolute top-2 right-2">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                عرض خاص
              </Badge>
            </div>
            
            {/* شارة الحالة */}
            <div className="absolute top-2 left-2">
              <Badge className={offer.IsActive ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                {offer.IsActive ? "متوفر" : "غير متوفر"}
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-3 text-right line-clamp-2">
              {offer.Name}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 text-right line-clamp-3">
              {offer.ShortDiscription || "عرض مميز بأسعار تنافسية"}
            </p>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">#{offer.Code}</span>
              <Badge className="bg-orange-100 text-orange-800 text-xs">
                {offer.ProductsCount || 0} منتج
              </Badge>
            </div>
          </div>
          
          <div className="mt-auto">
            {/* الأسعار */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-right">
                {offer.TotalValue && offer.TotalValueAfterOffer ? (
                  <>
                    <div className="font-bold text-xl text-green-600">
                      {formatCurrencyEGP(offer.TotalValueAfterOffer)}
                    </div>
                    <div className="text-sm text-gray-500 line-through">
                      {formatCurrencyEGP(offer.TotalValue)}
                    </div>
                  </>
                ) : (
                  <div className="font-bold text-xl text-gray-900">
                    {formatCurrencyEGP(offer.TotalValueAfterOffer || 0)}
                  </div>
                )}
              </div>
              
              {offer.TotalValue && offer.TotalValueAfterOffer && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  توفير {formatCurrencyEGP(offer.TotalValue - offer.TotalValueAfterOffer)}
                </Badge>
              )}
            </div>
            
            {/* الأزرار */}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                className="flex-1" 
                size="sm"
                variant={isOfferInCart ? "default" : "default"}
                onClick={handleAddToCart}
                disabled={!offer.IsActive}
              >
                <ShoppingCart className="w-4 h-4 ml-2" />
                {isOfferInCart ? "مضاف للسلة" : "إضافة للسلة"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={() => setShowDetails(true)}
                title="عرض التفاصيل"
              >
                <Eye className="w-4 h-4" />
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={shareOffer}
                title="مشاركة العرض"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ديالوج تفاصيل العرض */}
      <OfferDetailsDialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        offerId={offer.ID || null}
      />

      {/* Client Login Dialog */}
      <ClientLoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onLoginSuccess={handleLoginSuccess}
        title="تسجيل دخول العميل"
        message="يجب تسجيل الدخول لإضافة العروض إلى السلة"
      />
    </>
  )
}
