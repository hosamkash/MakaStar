"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import Image from "next/image"
import { 
  Package, 
  ShoppingCart, 
  Clock,
  Info
} from "lucide-react"
import { collection, getDocs, query, where, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatCurrencyEGP } from "@/lib/utils"
import ClientLoginDialog from "@/components/client-login-dialog"
import { notify } from "@/lib/notifications"
import { useClientSession } from "@/lib/hooks/use-client-session"
import { useCart } from "@/lib/contexts/cart-context"

interface ProductOffer {
  id: string
  ID: string
  Code: string
  Name: string
  ShortDiscription: string
  LongDescription: string
  IsActive: boolean
  IsBindShop: boolean
  IsBindShopMaster: boolean
  ImageName: string
  ImageURL: string
  TotalValue: number
  TotalValueAfterOffer: number
  ProductsCount: number
  DefaultSalesCommission: number
}

export default function OffersPage() {
  const { session: clientSession } = useClientSession()
  const { addToCart } = useCart()
  const [productOffers, setProductOffers] = useState<ProductOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOffer, setSelectedOffer] = useState<ProductOffer | null>(null)
  const [offerDetails, setOfferDetails] = useState<any[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        console.log("بدء جلب البيانات...")
        
        // التحقق من أن Firebase متاح
        if (!db) {
          console.error("Firebase database is not available")
          setProductOffers([])
          return
        }
        
        // Fetch Product Offers - جلب جميع البيانات أولاً
        const productOffersCollection = collection(db, "Def_OffersByProducts")
        const productOffersSnapshot = await getDocs(productOffersCollection)
        console.log("عدد عروض الأصناف المستلمة:", productOffersSnapshot.size)
        
        const productOffersData = productOffersSnapshot.docs.map(doc => {
          const data = doc.data()
          console.log("عرض أصناف:", data)
          return {
            id: doc.id,
            ID: data.ID?.toString() || '',
            Code: data.Code?.toString() || '',
            Name: data.Name || '',
            ShortDiscription: data.ShortDiscription || '',
            LongDescription: data.LongDescription || '',
            IsActive: data.IsActive || false,
            IsBindShop: data.IsBindShop || false,
            IsBindShopMaster: data.IsBindShopMaster || false,
            ImageName: data.ImageName || '',
            ImageURL: data.ImageURL || '',
            TotalValue: data.TotalValue || 0,
            TotalValueAfterOffer: data.TotalValueAfterOffer || 0,
            ProductsCount: data.ProductsCount || 0,
            DefaultSalesCommission: data.DefaultSalesCommission || 0
          }
        }) as ProductOffer[]

        // فلترة العروض النشطة والمرتبطة بالمتجر
        const activeProductOffers = productOffersData.filter(offer => 
          offer.IsActive === true && 
          (offer.IsBindShop === true || offer.IsBindShopMaster === true)
        )
        console.log("عروض الأصناف النشطة والمرتبطة بالمتجر:", activeProductOffers)
        console.log("جميع عروض الأصناف:", productOffersData)
        
        setProductOffers(activeProductOffers)
      } catch (error) {
        console.error("Error fetching offers:", error)
        // في حالة الخطأ، نضع مصفوفات فارغة
        setProductOffers([])
        // إظهار رسالة خطأ للمستخدم
        alert("حدث خطأ في تحميل العروض. يرجى المحاولة مرة أخرى.")
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [])

  const calculateDiscountPercentage = (original: number, offer: number) => {
    return Math.round(((original - offer) / original) * 100)
  }

  const getDiscountType = (discountValue: number, discountPercent: number) => {
    if (discountPercent > 0) return "percentage"
    if (discountValue > 0) return "fixed"
    return "percentage"
  }

  const getDiscountDisplay = (discountValue: number, discountPercent: number) => {
    if (discountPercent > 0) return `${discountPercent}%`
    return formatCurrencyEGP(discountValue)
  }

  // دالة للتعامل مع إضافة العروض للسلة (كعنصر واحد غير قابل للتجزئة)
  const handleAddOfferToCart = async (offer: ProductOffer) => {
    if (!clientSession) {
      setPendingAction(() => () => {
        notify.success("تم تسجيل الدخول بنجاح! يمكنك الآن إضافة العروض للسلة")
      })
      setShowLoginDialog(true)
      return
    }

    try {
      // جلب تفاصيل العرض ثم إنشاء عنصر واحد للسلة يحتوي على الوصف الكامل
      setDetailsLoading(true)
      const offerDocRef = doc(db, "Def_OffersByProducts", offer.id)
      const detailsCol = collection(offerDocRef, "Def_OffersByProductsDetails")
      const snap = await getDocs(detailsCol)

      const lines: string[] = []
      let totalQty = 0
      await Promise.all(snap.docs.map(async (d, idx) => {
        const data: any = d.data()
        const productsCollection = collection(db, "Def_ProductStructure")
        const productQuery = query(productsCollection, where('ID', '==', data.IDProduct))
        const productSnapshot = await getDocs(productQuery)
        const productData: any = productSnapshot.docs[0]?.data() || {}
        const name = productData?.Name || `صنف ${data.IDProduct}`
        const color = data.SelectedColor ? ` - اللون: ${data.SelectedColor}` : ''
        const size = data.SelectedSize ? ` - المقاس: ${data.SelectedSize}` : ''
        const qty = Number(data.Qty) || 1
        totalQty += qty
        lines.push(`${idx + 1}: ${name}${color}${size} × ${qty}`)
      }))

      const offerFullDescription = `العرض مكون من: ${lines.join(' + ')}`

      // إنشاء عنصر السلة الواحد الممثل للعرض
      const offerCartItem: any = {
        ID: parseInt(offer.ID) || 0,
        IDProduct: parseInt(offer.ID) || 0, // نستخدم معرف العرض لضمان التفرد
        Name: offer.Name,
        BarCode: 0,
        // التسعير (عرض واحد لا يتجزأ)
        Qty: 1,
        PriceBeforDiscount: offer.TotalValue || 0,
        SalesPrice: offer.TotalValueAfterOffer || 0,
        TotalPriceBeforDiscount: offer.TotalValue || 0,
        TotalSalesPrice: offer.TotalValueAfterOffer || 0,
        DiscountValue: (offer.TotalValue || 0) - (offer.TotalValueAfterOffer || 0),
        TotalDiscountValue: (offer.TotalValue || 0) - (offer.TotalValueAfterOffer || 0),
        // وصف العرض الكامل + تفاصيل الأصناف
        ShopShortDiscription: offer.ShortDiscription || '',
        ShopLongDiscription: offerFullDescription,
        ImageURL: offer.ImageURL || '',
        // علامات العرض
        isOffer: true,
        offerId: parseInt(offer.ID) || 0,
        offerName: offer.Name,
        offerProductsCount: totalQty,
        offerDescription: offerFullDescription,
        DefaultSalesCommission: offer.DefaultSalesCommission || 0,
      }

      await addToCart(offerCartItem, 1)

      notify.success(`تم إضافة عرض "${offer.Name}" إلى السلة كعنصر واحد`)
    } catch (e) {
      console.error('Error adding offer to cart', e)
      notify.error('تعذر إضافة العرض للسلة')
    } finally {
      setDetailsLoading(false)
    }
  }

  // دالة تنفيذ الإجراء المعلق بعد تسجيل الدخول
  const handleLoginSuccess = () => {
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  const fetchOfferDetails = async (offerId: string) => {
    try {
      setDetailsLoading(true)
      console.log("جلب تفاصيل العرض:", offerId)
      
      // استخدام المجموعة الصحيحة Def_OffersByProductsDetails كـ subcollection
      const offerDoc = doc(db, "Def_OffersByProducts", offerId)
      const detailsCollection = collection(offerDoc, "Def_OffersByProductsDetails")
      const detailsSnapshot = await getDocs(detailsCollection)
      
        console.log("عدد المنتجات في العرض:", detailsSnapshot.size)
      
      if (!detailsSnapshot.empty) {
        const details = await Promise.all(detailsSnapshot.docs.map(async docSnapshot => {
          const data: any = docSnapshot.data()
          console.log("بيانات المنتج في العرض:", data)

          // جلب بيانات الصنف
          const productsCollection = collection(db, "Def_ProductStructure")
          const productQuery = query(
            productsCollection,
            where('ID', '==', data.IDProduct)
          )
          const productSnapshot = await getDocs(productQuery)
          const productData: any = productSnapshot.docs[0]?.data() || {}

          // محاولة جلب صورة المتغير المطابق للون والمقاس إن وُجدا
          let variantImageURL: string | undefined
          let selectedColor: string | undefined = data.SelectedColor || data.Color || undefined
          let selectedSize: string | undefined = data.SelectedSize || data.Size || undefined
          try {
            if (data.IDProduct && (selectedColor || selectedSize)) {
              const variantsCol = collection(db, "Def_ProductStructure", String(data.IDProduct), "Variants")
              const variantsSnap = await getDocs(variantsCol)
              for (const vDoc of variantsSnap.docs) {
                const v: any = vDoc.data()
                const vColor = String(v?.Color?.Name || '').trim()
                const vSize = String(v?.Size?.Name || '').trim()
                const colorMatch = selectedColor ? vColor === selectedColor : true
                const sizeMatch = selectedSize ? vSize === selectedSize : true
                if (colorMatch && sizeMatch) {
                  variantImageURL = v?.ImageURL || v?.Image || (Array.isArray(v?.Images) ? v.Images[0] : undefined)
                  break
                }
              }
            }
          } catch {}

          return {
            id: data.ID?.toString() || docSnapshot.id,
            productName: productData?.Name || 'غير محدد',
            categoryName: productData?.IDCategory?.toString() || 'غير محدد',
            qty: data.Qty || data.Quantity || 1,
            price: data.Price || data.OriginalPrice || 0,
            totalPrice: data.TotalPrice || (data.Price * (data.Qty || 1)) || 0,
            barcode: productData?.BarCode?.toString() || '',
            selectedColor: selectedColor || '',
            selectedSize: selectedSize || '',
            imageURL: variantImageURL || productData?.ImageURL || ''
          }
        }))
        
        console.log("تفاصيل العرض المجلوبة:", details)
        setOfferDetails(details)
      } else {
        console.log("لا توجد منتجات في هذا العرض")
        setOfferDetails([])
      }
    } catch (error) {
      console.error("Error fetching offer details:", error)
      setOfferDetails([])
    } finally {
      setDetailsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 bg-white min-h-screen">
        <p className="text-center text-gray-600">جاري تحميل العروض...</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          {/* قسم العروض النقدية تمت إزالته حسب الطلب */}
          {/* Product Offers */}
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">عروض الأصناف</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  باقات وعروض خاصة على مجموعات منتجات محددة بأسعار مخفضة
                </p>
              </div>

              {productOffers.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد عروض حالياً</h3>
                  <p className="text-gray-500 mb-4">تابعنا للحصول على أحدث العروض والخصومات</p>
                  
                  {/* رسائل تشخيصية */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto text-right">
                    <h4 className="font-semibold text-yellow-800 mb-2">معلومات تشخيصية:</h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p>• عدد العروض المجلوبة: {productOffers.length}</p>
                      <p>• حالة التحميل: {loading ? 'جاري التحميل' : 'مكتمل'}</p>
                      <p>• تأكد من أن العروض نشطة ومرتبطة بالمتجر</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productOffers.map((offer) => (
                    <Card 
                      key={offer.id} 
                      className="group hover:shadow-md transition-all duration-200 border overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedOffer(offer)
                        fetchOfferDetails(offer.id)
                      }}
                    >
                      <div className="p-4">
                        {offer.ImageURL && (
                          <div className="relative w-full h-36 mb-3 rounded-md overflow-hidden bg-white">
                            <Image src={offer.ImageURL || "/placeholder.jpg"} alt={offer.Name} fill className="object-contain" />
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <Badge className="px-2 py-0.5 text-xs bg-blue-600 text-white">
                             باقة منتجات
                           </Badge>
                         </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                           {offer.Name}
                         </h3>

                        <p className="text-gray-600 mb-3 leading-relaxed text-sm line-clamp-2">
                           {offer.ShortDiscription || offer.LongDescription}
                         </p>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between bg-white rounded-md p-2 border">
                            <span className="text-xs text-gray-600">السعر الأصلي</span>
                            <span className="font-semibold text-gray-500 line-through text-sm">
                               {formatCurrencyEGP(offer.TotalValue)}
                             </span>
                           </div>

                          <div className="flex items-center justify-between bg-white rounded-md p-2 border">
                            <span className="text-xs text-gray-600">سعر العرض</span>
                            <span className="font-bold text-blue-600">
                               {formatCurrencyEGP(offer.TotalValueAfterOffer)}
                             </span>
                           </div>

                          <div className="flex items-center justify-between bg-green-50 rounded-md p-2 border border-green-100">
                            <span className="text-xs text-gray-600">التوفير</span>
                            <span className="font-semibold text-green-600 text-sm">
                               {calculateDiscountPercentage(offer.TotalValue, offer.TotalValueAfterOffer)}%
                             </span>
                           </div>

                          <div className="flex items-center justify-between bg-white rounded-md p-2 border">
                            <span className="text-xs text-gray-600">عدد المنتجات</span>
                            <span className="font-semibold text-gray-900 text-sm">
                               {offer.ProductsCount} منتج
                             </span>
                           </div>
                         </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                           <span>الكود:</span>
                           <span>{offer.Code}</span>
                         </div>

                        {/* الحالة محذوفة حسب الطلب */}

                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                           <Dialog>
                             <DialogTrigger asChild>
                               <Button 
                                 onClick={() => {
                                   setSelectedOffer(offer)
                                   fetchOfferDetails(offer.id)
                                 }}
                                 variant="outline"
                                className="flex-1 h-9 border border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 rounded-md text-sm"
                               >
                                <Info className="w-4 h-4 ml-1" />
                                 <span>تفاصيل العرض</span>
                               </Button>
                             </DialogTrigger>
                             <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                               <DialogHeader>
                                 <DialogTitle className="text-right text-xl font-bold text-gray-900">
                                   تفاصيل عرض: {selectedOffer?.Name}
                                 </DialogTitle>
                               </DialogHeader>
                               
                               {detailsLoading ? (
                                 <div className="text-center py-8">
                                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                   <p className="text-gray-600">جاري تحميل تفاصيل العرض...</p>
                                 </div>
                               ) : offerDetails.length > 0 ? (
                                 <div className="space-y-4">
                                  <div className="bg-blue-50 rounded-lg p-4">
                                     <div className="grid grid-cols-2 gap-4 text-right">
                                       <div>
                                         <span className="text-sm text-gray-600">السعر الأصلي:</span>
                                         <div className="font-bold text-gray-900">{formatCurrencyEGP(selectedOffer?.TotalValue || 0)}</div>
                                       </div>
                                       <div>
                                         <span className="text-sm text-gray-600">سعر العرض:</span>
                                         <div className="font-bold text-blue-600">{formatCurrencyEGP(selectedOffer?.TotalValueAfterOffer || 0)}</div>
                                       </div>
                                       <div>
                                         <span className="text-sm text-gray-600">التوفير:</span>
                                         <div className="font-bold text-green-600">
                                           {calculateDiscountPercentage(selectedOffer?.TotalValue || 0, selectedOffer?.TotalValueAfterOffer || 0)}%
                                         </div>
                                       </div>
                                      <div>
                                        <span className="text-sm text-gray-600">عدد المنتجات:</span>
                                        <div className="font-bold text-gray-900">{offerDetails.reduce((sum, d) => sum + (Number(d.qty) || 0), 0)} منتج</div>
                                      </div>
                                     </div>
                                   </div>
                                   
                                   <div>
                                     <h4 className="text-lg font-semibold text-gray-900 mb-3 text-right">المنتجات المدرجة:</h4>
                                    <div className="space-y-3">
                                      {offerDetails.map((detail, index) => (
                                        <div key={detail.id} className="bg-gray-50 rounded-lg p-4 text-right">
                                          <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-gray-500">#{index + 1}</span>
                                            <h5 className="font-semibold text-gray-900">{detail.productName}</h5>
                                          </div>
                                          <div className="grid grid-cols-3 gap-4 text-sm items-center">
                                            <div className="col-span-1">
                                              <div className="relative w-full h-20 rounded-md overflow-hidden bg-white">
                                                <Image src={detail.imageURL || "/placeholder.jpg"} alt={detail.productName} fill className="object-contain" />
                                              </div>
                                            </div>
                                            <div className="col-span-2 grid grid-cols-2 gap-3">
                                              <div>
                                                <span className="text-gray-600">الفئة:</span>
                                                <span className="font-medium text-gray-900 mr-2">{detail.categoryName}</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-600">الكمية:</span>
                                                <span className="font-medium text-gray-900 mr-2">{detail.qty}</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-600">اللون:</span>
                                                <span className="font-medium text-gray-900 mr-2">{detail.selectedColor || '—'}</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-600">المقاس:</span>
                                                <span className="font-medium text-gray-900 mr-2">{detail.selectedSize || '—'}</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-600">السعر:</span>
                                                <span className="font-medium text-gray-900 mr-2">{formatCurrencyEGP(detail.price)}</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-600">الإجمالي:</span>
                                                <span className="font-medium text-blue-600 mr-2">{formatCurrencyEGP(detail.totalPrice)}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="text-center py-8">
                                   <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                   <p className="text-gray-600">لا توجد تفاصيل متاحة لهذا العرض</p>
                                 </div>
                               )}
                             </DialogContent>
                           </Dialog>

                          <Button 
                            className="flex-1 h-9 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm"
                             onClick={() => handleAddOfferToCart(offer)}
                           >
                             <ShoppingCart className="w-4 h-4 ml-2" />
                             <span>احصل على العرض</span>
                           </Button>
                         </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
        </div>
      </section>

      {/* Client Login Dialog */}
      <ClientLoginDialog
        isOpen={showLoginDialog}
        onClose={() => {
          setShowLoginDialog(false)
          setPendingAction(null)
        }}
        onLoginSuccess={handleLoginSuccess}
        title="تسجيل دخول العميل"
        message="يجب تسجيل الدخول لإضافة العروض إلى السلة"
      />
    </div>
  )
}
