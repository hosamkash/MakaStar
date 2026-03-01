"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Package, ShoppingCart, Eye, Star, Tag, Share2 } from "lucide-react"
import { formatCurrencyEGP } from "@/lib/utils"
import { OfferWithProducts, OfferProduct } from "@/lib/types/offers"
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { useCart } from "@/lib/contexts/cart-context"
import { notify } from "@/lib/notifications"

interface OfferDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  offerId: number | null
  cartItem?: any // إضافة دعم لعنصر السلة
}

export default function OfferDetailsDialog({ isOpen, onClose, offerId, cartItem }: OfferDetailsDialogProps) {
  const [offer, setOffer] = useState<OfferWithProducts | null>(null)
  const [loading, setLoading] = useState(false)
  const { addToCart, isInCart } = useCart()

  useEffect(() => {
    if (isOpen && offerId) {
      loadOfferDetails()
    }
  }, [isOpen, offerId])

  const loadOfferDetails = async () => {
    if (!offerId) return
    setLoading(true)
    try {
      // جلب بيانات العرض الأساسية
      const offerDoc = await getDoc(doc(db, 'Def_OffersByProducts', offerId.toString()))
      if (!offerDoc.exists()) {
        notify.error('العرض غير موجود')
        setOffer(null)
        return
      }
      const offerData = offerDoc.data() as any

      // جلب تفاصيل المنتجات من الـ subcollection
      const detailsCol = collection(doc(db, 'Def_OffersByProducts', offerId.toString()), 'Def_OffersByProductsDetails')
      const detailsSnap = await getDocs(detailsCol)

      const products: OfferProduct[] = await Promise.all(detailsSnap.docs.map(async (d) => {
        const data: any = d.data()
        // جلب اسم وصورة المنتج
        let productName = ''
        let productImageURL = ''
        try {
          const productsCollection = collection(db, 'Def_ProductStructure')
          const q = query(productsCollection, where('ID', '==', data.IDProduct))
          const pSnap = await getDocs(q)
          const p = pSnap.docs[0]?.data() as any
          productName = p?.Name || ''
          productImageURL = p?.ImageURL || ''
        } catch {}
        return {
          ID: data.ID,
          IDOffer: offerId,
          IDProduct: data.IDProduct,
          ProductName: productName,
          ProductImageURL: productImageURL,
          OriginalPrice: data.Price || 0,
          OfferPrice: data.Price || 0,
          Quantity: data.Qty || 1,
          IsActive: true,
        }
      }))

      const normalizedOffer: OfferWithProducts = {
        ID: offerData.ID || parseInt(offerDoc.id) || offerId,
        Code: offerData.Code || 0,
        Name: offerData.Name || '',
        ShortDiscription: offerData.ShortDiscription || '',
        LongDescription: offerData.LongDescription || '',
        IsActive: !!offerData.IsActive,
        IsBindShop: !!offerData.IsBindShop,
        IsBindShopMaster: !!offerData.IsBindShopMaster,
        ImageName: offerData.ImageName || '',
        ImageURL: offerData.ImageURL || '',
        TotalValue: offerData.TotalValue || 0,
        TotalValueAfterOffer: offerData.TotalValueAfterOffer || 0,
        ProductsCount: offerData.ProductsCount || products.reduce((s,p)=> s + (p.Quantity||0),0),
        DefaultSalesCommission: offerData.DefaultSalesCommission || 0,
        products,
      }

      setOffer(normalizedOffer)
    } catch (error) {
      console.error('Error loading offer details:', error)
      notify.error('فشل في تحميل تفاصيل العرض')
    } finally {
      setLoading(false)
    }
  }

  const handleAddOfferToCart = async () => {
    // هذا الديالوج للعرض من السلة/الواجهة، الإضافة تُدار من شاشة العروض.
    if (!offer) return
    notify.success('تفاصيل العرض فقط - الإضافة تتم من شاشة العروض')
  }

  const shareOffer = async () => {
    if (!offer) return
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/store?offer=${offer.ID}`
    const shareData: ShareData = {
      title: offer.Name || 'عرض خاص من متجر مكة ستار',
      text: offer.ShortDiscription || `اكتشف عرض "${offer.Name}" في متجر مكة ستار`,
      url
    }

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData)
        return
      }
      await navigator.clipboard.writeText(url)
      notify.success('تم نسخ رابط العرض للحافظة')
    } catch (error: any) {
      if (error && (error.name === 'AbortError' || error.message?.includes('AbortError'))) {
        return
      }
      console.error('Error sharing:', error)
      try {
        await navigator.clipboard.writeText(url)
        notify.success('تم نسخ رابط العرض للحافظة')
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError)
        notify.error('حدث خطأ في المشاركة')
      }
    }
  }

  const handleAddProductToCart = async (product: OfferProduct) => {
    try {
      const cartProduct = {
        ID: product.IDProduct,
        Name: product.ProductName || `منتج العرض ${product.IDProduct}`,
        ShopPrice: product.OfferPrice || 0,
        ShopPriceBeforDiscount: product.OriginalPrice || 0,
        ShopDiscountValue: (product.OriginalPrice || 0) - (product.OfferPrice || 0),
        ShopDiscountPercent: product.OriginalPrice && product.OfferPrice 
          ? ((product.OriginalPrice - product.OfferPrice) / product.OriginalPrice) * 100 
          : 0,
        ImageURL: product.ProductImageURL,
        IsActive: product.IsActive,
        // إضافة معلومات إضافية للعرض
        isOfferItem: true,
        offerId: offer?.ID,
        offerName: offer?.Name
      }
      
      await addToCart(cartProduct, product.Quantity || 1)
      //notify.success(`تم إضافة ${product.ProductName || `منتج ${product.IDProduct}`} إلى السلة (${product.Quantity || 1} قطعة)`)
    } catch (error) {
      console.error('Error adding product to cart:', error)
      notify.error('فشل في إضافة المنتج للسلة')
    }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">جاري التحميل</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 mb-2">جاري تحميل تفاصيل العرض...</p>
              <p className="text-sm text-gray-500">جاري جلب المنتجات المدرجة في العرض</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!offer) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">العرض غير موجود</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">العرض غير موجود</h3>
            <p className="text-gray-500 mb-4">لم يتم العثور على تفاصيل العرض المطلوب</p>
            <Button 
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {offer.Code && (
              <Badge className="bg-gray-100 text-gray-800">
                #{offer.Code}
              </Badge>
            )}
            <DialogTitle className="text-right text-2xl font-bold text-gray-900">
              {offer.Name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات العرض */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-right">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={offer.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {offer.IsActive ? "نشط" : "غير نشط"}
                    </Badge>
                    <h3 className="text-lg font-semibold text-gray-900">معلومات العرض</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {offer.ShortDiscription || "عرض مميز بأسعار تنافسية"}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">عدد المنتجات:</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {offer.ProductsCount || offer.products.length} منتج
                      </Badge>
                    </div>
                    
                    {offer.ProductsCount && offer.ProductsCount !== offer.products.length && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">المنتجات المجلوبة:</span>
                        <Badge className="bg-orange-100 text-orange-800">
                          {offer.products.length} منتج
                        </Badge>
                      </div>
                    )}
                    
                    {offer.ProductsCount && offer.ProductsCount > offer.products.length && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                        <p className="text-xs text-yellow-800 text-right">
                          <strong>ملاحظة:</strong> بعض المنتجات قد تكون غير متوفرة أو غير نشطة.
                        </p>
                      </div>
                    )}
                    
                    {offer.products.length === 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                        <p className="text-xs text-red-800 text-right">
                          <strong>تحذير:</strong> لم يتم العثور على منتجات في هذا العرض.
                        </p>
                        <p className="text-xs text-red-700 text-right mt-1">
                          قد تكون المنتجات محفوظة في مجموعة مختلفة أو لم يتم إضافتها بعد.
                        </p>
                      </div>
                    )}
                    
                    {offer.products.length > 0 && offer.products.filter(p => p.IsActive).length === 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
                        <p className="text-xs text-orange-800 text-right">
                          <strong>تنبيه:</strong> جميع المنتجات في هذا العرض غير نشطة.
                        </p>
                      </div>
                    )}
                    
                    {offer.products.length > 0 && offer.products.filter(p => p.IsActive).length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                        <p className="text-xs text-green-800 text-right">
                          <strong>متوفر:</strong> {offer.products.filter(p => p.IsActive).length} منتج نشط متاح للإضافة للسلة.
                        </p>
                      </div>
                    )}
                    
                    {/* معلومات السلة إذا كان العرض موجود فيها */}
                    {cartItem && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                        <p className="text-xs text-blue-800 text-right">
                          <strong>في السلة:</strong> الكمية: {cartItem.Qty} - السعر الإجمالي: {formatCurrencyEGP(cartItem.TotalSalesPrice || 0)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">القيمة الإجمالية:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrencyEGP(offer.TotalValue || 0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">السعر بعد العرض:</span>
                      <span className="font-bold text-xl text-green-600">
                        {formatCurrencyEGP(offer.TotalValueAfterOffer || 0)}
                      </span>
                    </div>
                    
                    {offer.TotalValue && offer.TotalValueAfterOffer && offer.TotalValue > offer.TotalValueAfterOffer && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">التوفير:</span>
                        <Badge className="bg-green-100 text-green-800">
                          {formatCurrencyEGP(offer.TotalValue - offer.TotalValueAfterOffer)}
                        </Badge>
                      </div>
                    )}
                    
                    {offer.Code && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">رمز العرض:</span>
                        <Badge className="bg-gray-100 text-gray-800">
                          #{offer.Code}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  {offer.ImageURL ? (
                    <img 
                      src={offer.ImageURL} 
                      alt={offer.Name}
                      className="w-48 h-48 object-contain rounded-lg border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-48 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-gray-200 ${offer.ImageURL ? 'hidden' : ''}`}>
                    <Package className="w-16 h-16 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 text-center">صورة العرض غير متوفرة</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleAddOfferToCart}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3"
                  size="lg"
                  disabled={!offer.IsActive || offer.products.filter(p => p.IsActive).length === 0}
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  {!offer.IsActive ? "العرض غير متوفر" : 
                   offer.products.filter(p => p.IsActive).length === 0 ? "لا توجد منتجات نشطة" : 
                   `إضافة العرض كاملاً للسلة (${offer.products.filter(p => p.IsActive).length} منتج)`}
                </Button>
                
                {(!offer.IsActive || offer.products.filter(p => p.IsActive).length === 0) && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    {!offer.IsActive ? "هذا العرض غير متوفر حالياً" : 
                     "لا يمكن إضافة العرض للسلة لعدم وجود منتجات نشطة"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* المنتجات في العرض */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {offer.products.length} منتج
                </Badge>
                {offer.products.filter(p => p.IsActive).length !== offer.products.length && (
                  <Badge className="bg-green-100 text-green-800">
                    {offer.products.filter(p => p.IsActive).length} نشط
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-right">
                المنتجات المدرجة في العرض
              </h3>
            </div>
            
            {offer.products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offer.products.map((product) => (
                  <Card key={product.ID} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-3 border border-gray-200">
                        {product.ProductImageURL ? (
                          <img 
                            src={product.ProductImageURL} 
                            alt={product.ProductName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`flex flex-col items-center justify-center text-center ${product.ProductImageURL ? 'hidden' : ''}`}>
                          <Package className="w-12 h-12 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">صورة غير متوفرة</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.ProductName || `منتج ${product.IDProduct}`}
                        </h4>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">الكمية:</span>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              {product.Quantity || 1}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">السعر الأصلي:</span>
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrencyEGP(product.OriginalPrice || 0)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">سعر العرض:</span>
                            <span className="font-bold text-green-600">
                              {formatCurrencyEGP(product.OfferPrice || 0)}
                            </span>
                          </div>
                          
                          {product.OriginalPrice && product.OfferPrice && product.OriginalPrice > product.OfferPrice && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">التوفير:</span>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {formatCurrencyEGP(product.OriginalPrice - product.OfferPrice)}
                              </Badge>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">المجموع:</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrencyEGP((product.OfferPrice || 0) * (product.Quantity || 1))}
                            </span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleAddProductToCart(product)}
                          className="w-full"
                          size="sm"
                          disabled={!product.IsActive}
                          variant={!product.IsActive ? "secondary" : "default"}
                        >
                          <ShoppingCart className="w-4 h-4 ml-2" />
                          {!product.IsActive ? "غير متوفر" : "إضافة للسلة"}
                        </Button>
                        
                        {!product.IsActive && (
                          <div className="mt-2 text-center">
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              غير متوفر حالياً
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-600 mb-2">لا توجد منتجات</h4>
                <p className="text-gray-500 mb-4">لم يتم العثور على منتجات في هذا العرض</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>ملاحظة:</strong> قد تكون المنتجات غير متوفرة حالياً أو لم يتم إضافتها للعرض بعد.
                  </p>
                </div>
              </div>
            )}
            
            {offer.products.length > 0 && offer.products.filter(p => p.IsActive).length === 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <h4 className="font-semibold text-red-800">تنبيه</h4>
                </div>
                <p className="text-sm text-red-700 text-right">
                  جميع المنتجات في هذا العرض غير نشطة حالياً. لا يمكن إضافة العرض للسلة.
                </p>
              </div>
            )}
          </div>

          {(offer.LongDescription || offer.ShortDiscription) && (
            <>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-right">
                  وصف تفصيلي للعرض
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 text-right leading-relaxed">
                    {offer.LongDescription || offer.ShortDiscription}
                  </p>
                </div>
              </div>
            </>
          )}
          
          {!offer.LongDescription && !offer.ShortDiscription && (
            <>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-right">
                  وصف العرض
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-right">
                    <strong>ملاحظة:</strong> لا يوجد وصف متوفر لهذا العرض.
                  </p>
                </div>
              </div>
            </>
          )}
          
          {/* معلومات إضافية */}
          <Separator />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-right">
              معلومات إضافية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 text-right">تفاصيل العرض</h4>
                <div className="space-y-1 text-sm text-right">
                  <div className="flex justify-between">
                    <span className="text-blue-700">الحالة:</span>
                    <span className={offer.IsActive ? "text-green-600" : "text-red-600"}>
                      {offer.IsActive ? "نشط" : "غير نشط"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">مرتبط بالمتجر:</span>
                    <span className={offer.IsBindShop ? "text-green-600" : "text-gray-600"}>
                      {offer.IsBindShop ? "نعم" : "لا"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">مرتبط بالمتجر الرئيسي:</span>
                    <span className={offer.IsBindShopMaster ? "text-green-600" : "text-gray-600"}>
                      {offer.IsBindShopMaster ? "نعم" : "لا"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2 text-right">إحصائيات العرض</h4>
                <div className="space-y-1 text-sm text-right">
                  <div className="flex justify-between">
                    <span className="text-green-700">عدد المنتجات:</span>
                    <span className="font-semibold">{offer.products.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">المنتجات النشطة:</span>
                    <span className="font-semibold">
                      {offer.products.filter(p => p.IsActive).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">المنتجات غير النشطة:</span>
                    <span className="font-semibold">
                      {offer.products.filter(p => !p.IsActive).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">نسبة التوفير:</span>
                    <span className="font-semibold">
                      {offer.TotalValue && offer.TotalValueAfterOffer && offer.TotalValue > offer.TotalValueAfterOffer
                        ? `${Math.round(((offer.TotalValue - offer.TotalValueAfterOffer) / offer.TotalValue) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">قيمة التوفير:</span>
                    <span className="font-semibold">
                      {offer.TotalValue && offer.TotalValueAfterOffer && offer.TotalValue > offer.TotalValueAfterOffer
                        ? formatCurrencyEGP(offer.TotalValue - offer.TotalValueAfterOffer)
                        : formatCurrencyEGP(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* قسم التشخيص */}
          <Separator />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-right">
              تشخيص البيانات
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2 text-sm text-right">
                <div className="flex justify-between">
                  <span className="text-gray-600">معرف العرض:</span>
                  <span className="font-mono text-gray-800">{offer.ID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد المنتجات المتوقع:</span>
                  <span className="font-mono text-gray-800">{offer.ProductsCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد المنتجات المجلوبة:</span>
                  <span className="font-mono text-gray-800">{offer.products.length}</span>
                </div>
                {cartItem && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الكمية في السلة:</span>
                      <span className="font-mono text-blue-600">{cartItem.Qty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">السعر في السلة:</span>
                      <span className="font-mono text-blue-600">{formatCurrencyEGP(cartItem.SalesPrice || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الإجمالي في السلة:</span>
                      <span className="font-mono text-blue-600">{formatCurrencyEGP(cartItem.TotalSalesPrice || 0)}</span>
                    </div>
                  </>
                )}
                {offer.ProductsCount && offer.ProductsCount !== offer.products.length && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                    <p className="text-xs text-yellow-800 text-right">
                      <strong>تنبيه:</strong> هناك فرق بين عدد المنتجات المتوقع ({offer.ProductsCount}) والمنتجات المجلوبة ({offer.products.length}).
                    </p>
                    <p className="text-xs text-yellow-700 text-right mt-1">
                      قد تكون المنتجات محفوظة في مجموعة مختلفة أو لم يتم ربطها بالعرض بشكل صحيح.
                    </p>
                  </div>
                )}
                {offer.products.length === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                    <p className="text-xs text-red-800 text-right">
                      <strong>مشكلة:</strong> لم يتم العثور على منتجات في هذا العرض.
                    </p>
                    <p className="text-xs text-red-700 text-right mt-1">
                      يرجى التحقق من إعدادات العرض في لوحة الإدارة.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <Separator />
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleAddOfferToCart}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-2"
              size="lg"
              disabled={loading || offer.products.filter(p => p.IsActive).length === 0}
            >
              <ShoppingCart className="w-4 h-4 ml-2" />
              {loading ? "جاري الإضافة..." : 
               offer.products.filter(p => p.IsActive).length === 0 ? "لا توجد منتجات نشطة" : 
               "إضافة العرض للسلة"}
            </Button>
            
            <Button variant="outline" size="lg" className="px-4" onClick={shareOffer}>
              <Share2 className="w-4 h-4 ml-2" />
              مشاركة العرض
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
