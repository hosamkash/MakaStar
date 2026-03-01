"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  ShoppingCart, 
  Eye, 
  Package, 
  Tag,
  Star,
  Percent
} from "lucide-react"
import { OffersService } from "@/lib/services/offers-service"
import { Offer, OfferWithProducts } from "@/lib/types/offers"
import { useCart } from "@/lib/contexts/cart-context"
import { formatCurrencyEGP } from "@/lib/utils"

interface OffersSectionProps {
  className?: string
}

export default function OffersSection({ className = "" }: OffersSectionProps) {
  const { addToCart, isInCart } = useCart()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOffer, setSelectedOffer] = useState<OfferWithProducts | null>(null)
  const [showOfferDialog, setShowOfferDialog] = useState(false)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true)
        const activeOffers = await OffersService.getActiveOffers()
        setOffers(activeOffers)
      } catch (error) {
        console.error('Error fetching offers:', error)
        setOffers([])
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [])

  const handleViewOffer = async (offer: Offer) => {
    try {
      if (offer.ID) {
        const offerWithProducts = await OffersService.getOfferWithProducts(offer.ID)
        setSelectedOffer(offerWithProducts)
        setShowOfferDialog(true)
      }
    } catch (error) {
      console.error('Error loading offer details:', error)
    }
  }

  const handleAddOfferToCart = async (offer: Offer) => {
    try {
      if (offer.ID) {
        const offerWithProducts = await OffersService.getOfferWithProducts(offer.ID)
        if (offerWithProducts && offerWithProducts.products.length > 0) {
          // إضافة جميع منتجات العرض للسلة
          for (const product of offerWithProducts.products) {
            if (product.IsActive) {
              // إنشاء كائن منتج للسلة
              const cartProduct = {
                ID: product.IDProduct,
                BarCode: 0, // سيتم تحديثه من قاعدة البيانات
                Name: product.ProductName || `منتج العرض ${product.IDProduct}`,
                IDCategory: 0,
                IDProductionCompany: 0,
                UnitSmall_ID: 1,
                UnitSmall_PurchasePrice: product.OriginalPrice || 0,
                ShopPriceBeforDiscount: product.OriginalPrice || 0,
                ShopDiscountValue: (product.OriginalPrice || 0) - (product.OfferPrice || 0),
                ShopDiscountPercent: product.OriginalPrice && product.OfferPrice 
                  ? ((product.OriginalPrice - product.OfferPrice) / product.OriginalPrice) * 100 
                  : 0,
                ShopPrice: product.OfferPrice || product.OriginalPrice || 0,
                ShopColors: "",
                ShopSizes: "",
                ShopShortDiscription: `منتج من عرض: ${offer.Name}`,
                ShopLongDiscription: `منتج من عرض: ${offer.Name}`,
                ImageName: "",
                ImageURL: product.ProductImageURL || "",
                ImageFolderPath: "",
                DefaultSalesCommission: offer.DefaultSalesCommission || 0,
                Qty: product.Quantity || 1,
                TotalPriceBeforDiscount: (product.OriginalPrice || 0) * (product.Quantity || 1),
                TotalDiscountValue: ((product.OriginalPrice || 0) - (product.OfferPrice || 0)) * (product.Quantity || 1),
                TotalSalesPrice: (product.OfferPrice || 0) * (product.Quantity || 1),
                ProfitValue: 0,
                TotalProfitValue: 0,
                // حقول خاصة بالعروض
                isOffer: true, // هذا منتج من عرض
                offerId: offer.ID, // معرف العرض
                offerName: offer.Name, // اسم العرض
                offerProductsCount: offerWithProducts.products.length, // عدد المنتجات في العرض
                offerDescription: offer.ShortDiscription || offer.LongDescription || ''
              }
              
              await addToCart(cartProduct, product.Quantity || 1)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error adding offer to cart:', error)
    }
  }

  const isOfferInCart = (offer: Offer) => {
    // التحقق من وجود أي منتج من العرض في السلة
    return offer.ID ? true : false // يمكن تحسين هذا المنطق
  }

  if (loading) {
    return (
      <div className={`${className} py-8`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل العروض...</p>
        </div>
      </div>
    )
  }

  if (offers.length === 0) {
    return null // لا تظهر القسم إذا لم تكن هناك عروض
  }

  return (
    <>
      <section className={`${className} py-8 bg-gradient-to-r from-orange-50 to-red-50`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Tag className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl font-bold text-gray-900">العروض المميزة</h2>
            </div>
            <p className="text-gray-600 text-lg">اكتشف أفضل العروض والخصومات الحصرية</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {offers.map((offer) => (
              <Card key={offer.ID} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col border-2 border-orange-200 hover:border-orange-400">
                <div className="aspect-video bg-gradient-to-br from-orange-100 to-red-100 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                  {offer.ImageURL ? (
                    <img 
                      src={offer.ImageURL} 
                      alt={offer.Name}
                      className="w-full h-full object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-orange-600">
                      <Tag className="w-16 h-16 mb-2" />
                      <span className="text-sm font-medium">عرض مميز</span>
                    </div>
                  )}
                  
                  {/* شارة العرض */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-orange-500 text-white text-xs font-bold">
                      <Percent className="w-3 h-3 ml-1" />
                      عرض
                    </Badge>
                  </div>

                  {/* عدد المنتجات */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-blue-500 text-white text-xs">
                      <Package className="w-3 h-3 ml-1" />
                      {offer.ProductsCount || 0} منتج
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-3 text-right line-clamp-2">
                      {offer.Name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 text-right line-clamp-3">
                      {offer.ShortDiscription || "عرض مميز على مجموعة من المنتجات"}
                    </p>

                    {/* الأسعار */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          <div className="text-sm text-gray-500 line-through">
                            {formatCurrencyEGP(offer.TotalValue || 0)}
                          </div>
                          <div className="font-bold text-xl text-orange-600">
                            {formatCurrencyEGP(offer.TotalValueAfterOffer || 0)}
                          </div>
                        </div>
                        
                        {offer.TotalValue && offer.TotalValueAfterOffer && (
                          <Badge className="bg-green-100 text-green-800 text-xs font-bold">
                            توفير {formatCurrencyEGP(offer.TotalValue - offer.TotalValueAfterOffer)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* الأزرار */}
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      className="flex-1 bg-orange-600 hover:bg-orange-700" 
                      size="sm"
                      onClick={() => handleAddOfferToCart(offer)}
                      disabled={!offer.IsActive}
                    >
                      <ShoppingCart className="w-4 h-4 ml-2" />
                      {isOfferInCart(offer) ? "مضاف للسلة" : "إضافة للسلة"}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                      onClick={() => handleViewOffer(offer)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ديالوج تفاصيل العرض */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold text-gray-900">
              {selectedOffer?.Name}
            </DialogTitle>
          </DialogHeader>

          {selectedOffer && (
            <div className="space-y-6">
              {/* معلومات العرض */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-right">
                    <h3 className="font-bold text-lg mb-2">تفاصيل العرض</h3>
                    <p className="text-gray-600 mb-4">
                      {selectedOffer.LongDescription || selectedOffer.ShortDiscription}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">عدد المنتجات:</span>
                        <span className="font-bold">{selectedOffer.ProductsCount || selectedOffer.products.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">السعر الأصلي:</span>
                        <span className="line-through">{formatCurrencyEGP(selectedOffer.TotalValue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">السعر بعد العرض:</span>
                        <span className="font-bold text-orange-600 text-lg">
                          {formatCurrencyEGP(selectedOffer.TotalValueAfterOffer || 0)}
                        </span>
                      </div>
                      {selectedOffer.TotalValue && selectedOffer.TotalValueAfterOffer && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">التوفير:</span>
                          <span className="font-bold text-green-600">
                            {formatCurrencyEGP(selectedOffer.TotalValue - selectedOffer.TotalValueAfterOffer)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedOffer.ImageURL && (
                    <div className="flex justify-center">
                      <img 
                        src={selectedOffer.ImageURL} 
                        alt={selectedOffer.Name}
                        className="w-48 h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* منتجات العرض */}
              <div>
                <h3 className="font-bold text-xl mb-4 text-right">منتجات العرض</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedOffer.products.map((product) => (
                    <Card key={product.ID} className="border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.ProductImageURL ? (
                              <img 
                                src={product.ProductImageURL} 
                                alt={product.ProductName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 text-right">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {product.ProductName || `منتج ${product.IDProduct}`}
                            </h4>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">السعر الأصلي:</span>
                                <span className="line-through">{formatCurrencyEGP(product.OriginalPrice || 0)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">سعر العرض:</span>
                                <span className="font-bold text-orange-600">{formatCurrencyEGP(product.OfferPrice || 0)}</span>
                              </div>
                              {product.Quantity && product.Quantity > 1 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">الكمية:</span>
                                  <span className="font-bold">{product.Quantity}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* زر إضافة العرض للسلة */}
              <div className="flex justify-center pt-4">
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 px-8 py-3 text-lg"
                  onClick={() => {
                    handleAddOfferToCart(selectedOffer)
                    setShowOfferDialog(false)
                  }}
                  disabled={!selectedOffer.IsActive}
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  إضافة العرض للسلة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
