"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, FileText, Package } from "lucide-react"
import Link from "next/link"
import { formatCurrencyEGP } from "@/lib/utils"

interface OrderFinancialSummaryProps {
  // بيانات الطلب
  order?: {
    TotalValue?: number
    PriceBeforDiscount?: number
    ProductsDiscount?: number
    OffersDiscount?: number
    PackageOffersDiscount?: number
    Shipping?: number
    ShippingValue?: number
    NetValue?: number
    ProfitValue?: number
    ProductsCount?: number
    AppliedOfferName?: string
    AppliedPackageOffersNames?: string[]
  }
  // بيانات السلة (للحالات التي تستخدم السلة)
  cartState?: {
    totalItems: number
    totalPrice: number
    shipping: number
    totalDiscount: number
    productOffersDiscount: number
    offerDiscount: number
    finalTotal: number
    appliedOffer?: any
    items: any[]
  }
  // بيانات العروض المتاحة
  availableOffers?: any[]
  // دوال التحكم
  onApplyOffer?: (offer: any) => void
  onCheckout?: () => void
  // خيارات العرض
  showCheckoutButton?: boolean
  showAddMoreButton?: boolean
  showProfit?: boolean
  className?: string
}

export default function OrderFinancialSummary({ 
  order,
  cartState,
  availableOffers = [],
  onApplyOffer,
  onCheckout,
  showCheckoutButton = true,
  showAddMoreButton = true,
  showProfit = false,
  className = "" 
}: OrderFinancialSummaryProps) {
  
  // تحديد مصدر البيانات
  const isCartMode = !!cartState
  const isOrderMode = !!order
  
  // حساب القيم
  const totalItems = isCartMode ? cartState.totalItems : (order?.ProductsCount || 0)
  const totalPrice = isCartMode ? cartState.totalPrice : (order?.TotalValue || order?.PriceBeforDiscount || 0)
  const shipping = isCartMode ? cartState.shipping : (order?.Shipping || order?.ShippingValue || 0)
  const totalDiscount = isCartMode ? cartState.totalDiscount : (order?.ProductsDiscount || 0)
  const productOffersDiscount = isCartMode ? cartState.productOffersDiscount : (order?.OffersDiscount || 0)
  const offerDiscount = isCartMode ? cartState.offerDiscount : (order?.PackageOffersDiscount || 0)
  const finalTotal = isCartMode ? cartState.finalTotal : (order?.NetValue || 0)
  const profitValue = order?.ProfitValue || 0
  
  // حساب إجمالي الخصومات
  const totalDiscounts = totalDiscount + productOffersDiscount + offerDiscount
  // خصم موحد محسوب من الفرق بين قبل الخصم وبعده (يشمل عروض المنتجات والأصناف)
  const unifiedDiscount = Math.max(0, totalPrice + shipping - finalTotal)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          ملخص الأوردر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ملخص الأوردر */}
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>عدد المنتجات:</span>
            <span>{totalItems} قطع</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>قيمة السلع:</span>
            <span>{formatCurrencyEGP(totalPrice)} جنية</span>
          </div>
          {shipping > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>الشحن والتوصيل:</span>
              <span>{formatCurrencyEGP(shipping)} جنية</span>
            </div>
          )}
        </div>

        {/* الخصم الموحد (الفرق بين قبل وبعد الخصم) */}
        {unifiedDiscount > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">الخصم</h4>
            <div className="flex justify-between text-green-600 font-semibold">
              <span>إجمالي الخصم:</span>
              <span>- {formatCurrencyEGP(unifiedDiscount)} جنية</span>
            </div>
          </div>
        )}

        {/* الصافي */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">الصافي</h4>
          
          {/* الربح (للأدمن فقط) */}
          {showProfit && profitValue > 0 && (
            <div className="flex justify-between text-green-600 mb-2">
              <span>الربح:</span>
              <span className="font-semibold">{formatCurrencyEGP(profitValue)} جنية</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold text-lg">
            <span>الإجمالي النهائي:</span>
            <span className="text-blue-600">
              {formatCurrencyEGP(finalTotal)} جنية
            </span>
          </div>
        </div>

        {/* العروض المطبقة */}
        {(isOrderMode && (order?.AppliedOfferName || (order?.AppliedPackageOffersNames && order.AppliedPackageOffersNames.length > 0))) && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">العروض المطبقة</h4>
            {order?.AppliedOfferName && (
              <div className="flex justify-between text-blue-600">
                <span>العرض النقدي:</span>
                <span className="font-semibold">{order.AppliedOfferName}</span>
              </div>
            )}
            {order?.AppliedPackageOffersNames && order.AppliedPackageOffersNames.length > 0 && (
              <div className="space-y-1">
                <span className="text-blue-600">عروض المنتجات:</span>
                {order.AppliedPackageOffersNames.map((offerName, index) => (
                  <div key={index} className="flex justify-between text-blue-600 text-sm">
                    <span>• {offerName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* العروض المتاحة */}
        {isCartMode && availableOffers.length > 0 && onApplyOffer && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">العروض المتاحة</h4>
            <Select onValueChange={(value) => {
              if (value === 'none') {
                onApplyOffer(null)
              } else {
                const offer = availableOffers.find(o => o.ID.toString() === value)
                onApplyOffer(offer || null)
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="اختر عرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">إلغاء العرض</SelectItem>
                {availableOffers.map((offer) => (
                  <SelectItem key={offer.ID} value={offer.ID.toString()}>
                    {offer.Name} - {offer.DiscountType === 'fixed' ? 
                      `${formatCurrencyEGP(offer.DiscountValue)} خصم` : 
                      `${offer.DiscountValue}% خصم`
                    } {offer.contconditionToApplayOffer && `(من ${formatCurrencyEGP(offer.contconditionToApplayOffer)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cartState.appliedOffer && (
              <div className="text-blue-600 text-sm">
                عرض {cartState.appliedOffer.Name}
              </div>
            )}
          </div>
        )}

        {/* أزرار التحكم */}
        {showCheckoutButton && onCheckout && (
          <Button 
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3"
            onClick={onCheckout}
            disabled={isCartMode ? cartState.items.length === 0 : false}
          >
            <FileText className="w-4 h-4 ml-2" />
            إتمام الطلب
          </Button>
        )}

        {showAddMoreButton && (
          <div className="text-center">
            <Button variant="outline" asChild className="w-full">
              <Link href="/store">
                <Package className="w-4 h-4 ml-2" />
                إضافة المزيد من المنتجات
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
