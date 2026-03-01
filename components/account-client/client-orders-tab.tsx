'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ShoppingBag, Eye, Package, RefreshCw, ChevronDown, ChevronUp, Calendar, User, MapPin, CreditCard, FileText, Users } from 'lucide-react'
import Link from 'next/link'
import { formatCurrencyEGP } from '@/lib/utils'

interface ClientOrdersTabProps {
  orders: any[]
  isLoadingOrders: boolean
  onRefresh?: () => void
}

export default function ClientOrdersTab({
  orders,
  isLoadingOrders,
  onRefresh
}: ClientOrdersTabProps) {
  const [openOrders, setOpenOrders] = useState<Set<string>>(new Set())

  const toggleOrder = (orderId: string) => {
    setOpenOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {isLoadingOrders ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">جاري تحميل الطلبات...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">لا توجد طلبات حالياً</p>
              <Link href="/store" className="text-blue-600 text-xs hover:underline">تصفح المنتجات</Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">آخر الطلبات</span>
                <div className="flex items-center gap-2">
                  {onRefresh && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefresh}
                      disabled={isLoadingOrders}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  <Link href="/orders" className="text-blue-600 text-xs hover:underline">عرض الكل</Link>
                </div>
              </div>
              
              <div className="space-y-3 max-h-120 overflow-y-auto">
                {orders.slice(0, 5).map((orderData) => {
                  const isOpen = openOrders.has(orderData.order.ID.toString())
                  const orderDate = new Date(orderData.order.CreatedDate || orderData.order.OrderDate || new Date())
                  const statusText = (() => {
                    const status = orderData.order.IDRequestStatus || 1
                    switch (status) {
                      case 1: return 'تم تأكيد الطلب'
                      case 2: return 'جاري التجهيز'
                      case 3: return 'تم الشحن'
                      case 4: return 'تم التوصيل'
                      case 5: return 'مرفوض من العميل'
                      case 6: return 'ملغي'
                      default: return 'غير محدد'
                    }
                  })()

                  return (
                    <Collapsible 
                      key={orderData.order.ID} 
                      open={isOpen} 
                      onOpenChange={() => toggleOrder(orderData.order.ID.toString())}
                    >
                      <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                        {/* Order Header - Collapsible Trigger */}
                        <CollapsibleTrigger className="w-full">
                          <div className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="text-right">
                                  <h5 className="text-lg font-semibold text-gray-900">
                                    طلب رقم: {orderData.order.OrderNo}
                                  </h5>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {orderDate.toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Package className="w-4 h-4" />
                                      {orderData.order.ProductsCount || 0} منتج
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <div className={`w-2 h-2 rounded-full ${
                                        (orderData.order.IDRequestStatus || 1) === 1 ? 'bg-yellow-400' :
                                        (orderData.order.IDRequestStatus || 1) === 2 ? 'bg-blue-400' :
                                        (orderData.order.IDRequestStatus || 1) === 3 ? 'bg-purple-400' :
                                        (orderData.order.IDRequestStatus || 1) === 4 ? 'bg-orange-400' :
                                        (orderData.order.IDRequestStatus || 1) === 5 ? 'bg-red-400' :
                                        (orderData.order.IDRequestStatus || 1) === 6 ? 'bg-green-400' : 'bg-gray-400'
                                      }`}></div>
                                      {statusText}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-xl font-bold text-blue-600">
                                    {formatCurrencyEGP(orderData.order.NetValue || 0)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    الإجمالي النهائي
                                  </div>
                                </div>
                                <div className="text-gray-400">
                                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        {/* Order Details - Collapsible Content */}
                        <CollapsibleContent>
                          <div className="border-t border-gray-200 p-4 space-y-4">
                            {/* Customer Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h6 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                بيانات العميل
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <span className="text-sm text-gray-600">الاسم:</span>
                                  <span className="text-sm font-medium text-gray-900 mr-2">
                                    {orderData.order.CustomerName || 'غير محدد'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">الهاتف:</span>
                                  <span className="text-sm font-medium text-gray-900 mr-2">
                                    {orderData.order.Mobile || 'غير محدد'}
                                  </span>
                                </div>
                                <div className="md:col-span-2">
                                  <span className="text-sm text-gray-600">العنوان:</span>
                                  <span className="text-sm font-medium text-gray-900 mr-2">
                                    {orderData.order.Address || 'غير محدد'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Personal Sponsor Information */}
                            {(orderData.order.PersonalSponsorName || orderData.order.PersonalSponsorID) && (
                              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <h6 className="text-base font-semibold text-green-800 mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  الراعي الشخصي
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-sm text-green-600">الاسم:</span>
                                    <span className="text-sm font-medium text-green-800 mr-2">
                                      {orderData.order.PersonalSponsorName || 'غير محدد'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm text-green-600">الكود:</span>
                                    <span className="text-sm font-medium text-green-800 mr-2">
                                      {orderData.order.PersonalSponsorCode || 'غير محدد'}
                                    </span>
                                  </div>
                                  {orderData.order.PersonalSponsorMobile && (
                                    <div className="md:col-span-2">
                                      <span className="text-sm text-green-600">الهاتف:</span>
                                      <span className="text-sm font-medium text-green-800 mr-2">
                                        {orderData.order.PersonalSponsorMobile}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Financial Summary */}
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h6 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                الملخص المالي
                              </h6>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="text-center">
                                  <div className="text-sm text-gray-600 mb-1">المجموع الفرعي</div>
                                  <div className="text-base font-semibold text-gray-900">
                                    {formatCurrencyEGP(orderData.order.PriceBeforDiscount || 0)}
                                  </div>
                                </div>
                                {orderData.order.Discount && orderData.order.Discount > 0 && (
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-1">خصم الأصناف</div>
                                    <div className="text-base font-semibold text-green-600">
                                      -{formatCurrencyEGP(orderData.order.Discount)}
                                    </div>
                                  </div>
                                )}
                                {orderData.order.ProductOffersDiscount && orderData.order.ProductOffersDiscount > 0 && (
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-1">خصم المنتجات</div>
                                    <div className="text-base font-semibold text-purple-600">
                                      -{formatCurrencyEGP(orderData.order.ProductOffersDiscount)}
                                    </div>
                                  </div>
                                )}
                                {orderData.order.OfferDiscount && orderData.order.OfferDiscount > 0 && (
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-1">خصم العروض</div>
                                    <div className="text-base font-semibold text-blue-600">
                                      -{formatCurrencyEGP(orderData.order.OfferDiscount)}
                                    </div>
                                  </div>
                                )}
                                {orderData.order.Shipping && orderData.order.Shipping > 0 && (
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-1">الشحن</div>
                                    <div className="text-base font-semibold text-orange-600">
                                      +{formatCurrencyEGP(orderData.order.Shipping)}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="border-t border-blue-200 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-semibold text-gray-900">الإجمالي النهائي:</span>
                                  <span className="text-xl font-bold text-blue-600">
                                    {formatCurrencyEGP(orderData.order.NetValue || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Products Details */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <h6 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                تفاصيل المنتجات ({orderData.details.length} منتج)
                              </h6>
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {orderData.details.map((item: any, index: number) => (
                                  <div key={item.ID} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                                      {item.ImageURL ? (
                                        <img 
                                          src={item.ImageURL} 
                                          alt={item.Name}
                                          className="w-full h-full object-cover rounded-lg"
                                        />
                                      ) : (
                                        <Package className="w-6 h-6 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 mb-1">
                                        {item.Name}
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">الكمية: {item.Qty}</span>
                                        <span className="text-gray-600">السعر: {formatCurrencyEGP(item.SalesPrice || 0)}</span>
                                        <span className="font-semibold text-blue-600">
                                          المجموع: {formatCurrencyEGP(item.TotalSalesPrice || 0)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Order Notes */}
                            {orderData.order.Notes && (
                              <div className="bg-yellow-50 rounded-lg p-4">
                                <h6 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  ملاحظات الطلب
                                </h6>
                                <p className="text-sm text-gray-700">{orderData.order.Notes}</p>
                              </div>
                            )}

                            {/* Applied Offers */}
                            {(orderData.order.AppliedOfferName || (orderData.order.AppliedPackageOffersNames && orderData.order.AppliedPackageOffersNames.length > 0)) && (
                              <div className="bg-green-50 rounded-lg p-4">
                                <h6 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  العروض المطبقة
                                </h6>
                                {orderData.order.AppliedOfferName && (
                                  <div className="text-sm text-gray-700 mb-1">
                                    عرض عام: {orderData.order.AppliedOfferName}
                                  </div>
                                )}
                                {orderData.order.AppliedPackageOffersNames && orderData.order.AppliedPackageOffersNames.length > 0 && (
                                  <div className="text-sm text-gray-700">
                                    عروض المنتجات: {orderData.order.AppliedPackageOffersNames.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  (orderData.order.IDRequestStatus || 1) === 1 ? 'bg-yellow-400' :
                                  (orderData.order.IDRequestStatus || 1) === 2 ? 'bg-blue-400' :
                                  (orderData.order.IDRequestStatus || 1) === 3 ? 'bg-purple-400' :
                                  (orderData.order.IDRequestStatus || 1) === 4 ? 'bg-orange-400' :
                                  (orderData.order.IDRequestStatus || 1) === 5 ? 'bg-red-400' :
                                  (orderData.order.IDRequestStatus || 1) === 6 ? 'bg-green-400' : 'bg-gray-400'
                                }`}></div>
                                <span className="text-sm font-medium text-gray-600">
                                  حالة الطلب: {statusText}
                                </span>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => {
                                  window.open(`/account_client/order-details?id=${orderData.order.ID}`, '_blank')
                                }}
                              >
                                <Eye className="w-4 h-4 ml-1" />
                                عرض التفاصيل الكاملة
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
