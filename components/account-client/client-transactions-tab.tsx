'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ShoppingBag, Eye, Package, Receipt, Users, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { formatCurrencyEGP } from '@/lib/utils'

interface ClientTransactionsTabProps {
  orders: any[]
  isLoadingOrders: boolean
}

export default function ClientTransactionsTab({
  orders,
  isLoadingOrders
}: ClientTransactionsTabProps) {
  // فلترة الطلبات - استبعاد الطلبات المعلقة (حالة 1)
  const previousOrders = orders.filter(orderData => 
    (orderData.order.IDRequestStatus || 1) !== 1
  )

  // state لتتبع الطلبات المفتوحة
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-center mb-3">
            <Receipt className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-900">مشترياتي السابقة</h3>
            <p className="text-xs text-gray-500">عرض جميع الطلبات المكتملة والمؤكدة</p>
          </div>
          
          {isLoadingOrders ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">جاري تحميل المشتريات السابقة...</p>
            </div>
          ) : previousOrders.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">لا توجد مشتريات سابقة</p>
              <Link href="/store" className="text-blue-600 text-xs hover:underline">تصفح المنتجات</Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">المشتريات السابقة</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{previousOrders.length} طلب</span>
                  {previousOrders.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allOrderIds = new Set(previousOrders.map(order => order.order.ID))
                          setExpandedOrders(allOrderIds)
                        }}
                        className="text-xs h-7 px-2"
                      >
                        فتح الكل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedOrders(new Set())}
                        className="text-xs h-7 px-2"
                      >
                        إغلاق الكل
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 max-h-120 overflow-y-auto">
                {previousOrders.map((orderData) => {
                  const isExpanded = expandedOrders.has(orderData.order.ID)
                  return (
                    <Collapsible key={orderData.order.ID} open={isExpanded} onOpenChange={() => toggleOrderExpansion(orderData.order.ID)}>
                      <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                        {/* Order Header - Collapsible Trigger */}
                        <CollapsibleTrigger asChild>
                          <div className="p-3 border-b border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <h5 className="text-base font-semibold text-gray-900">
                                    طلب رقم: {orderData.order.OrderNo}
                                  </h5>
                                  <p className="text-sm text-gray-500">
                                    {new Date(orderData.order.CreatedDate || orderData.order.OrderDate || new Date()).toLocaleDateString('ar-EG', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {/* ملخص سريع للحالة */}
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${
                                      (orderData.order.IDRequestStatus || 1) === 1 ? 'bg-yellow-400' :
                                      (orderData.order.IDRequestStatus || 1) === 2 ? 'bg-blue-400' :
                                      (orderData.order.IDRequestStatus || 1) === 3 ? 'bg-purple-400' :
                                      (orderData.order.IDRequestStatus || 1) === 4 ? 'bg-orange-400' :
                                      (orderData.order.IDRequestStatus || 1) === 5 ? 'bg-red-400' :
                                      (orderData.order.IDRequestStatus || 1) === 6 ? 'bg-green-400' : 'bg-gray-400'
                                    }`}></div>
                                    <span className="text-xs text-gray-600">
                                      {(() => {
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
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">
                                    {formatCurrencyEGP(orderData.order.NetValue || 0)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {orderData.order.ProductsCount || 0} منتج
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                  )}
                                  <span className="text-sm text-gray-500">
                                    {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        {/* Order Details - Collapsible Content */}
                        <CollapsibleContent>
                          <div className="p-3">
                      {/* Personal Sponsor Information */}
                      {(orderData.order.PersonalSponsorName || orderData.order.PersonalSponsorID) && (
                        <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
                          <h6 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            الراعي الشخصي
                          </h6>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-green-600">الاسم:</span>
                              <span className="text-sm font-medium text-green-800 mr-1">
                                {orderData.order.PersonalSponsorName || 'غير محدد'}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-green-600">الكود:</span>
                              <span className="text-sm font-medium text-green-800 mr-1">
                                {orderData.order.PersonalSponsorCode || 'غير محدد'}
                              </span>
                            </div>
                            {orderData.order.PersonalSponsorMobile && (
                              <div className="col-span-2">
                                <span className="text-xs text-green-600">الهاتف:</span>
                                <span className="text-sm font-medium text-green-800 mr-1">
                                  {orderData.order.PersonalSponsorMobile}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Financial Summary - Simplified */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">المجموع الفرعي</div>
                            <div className="text-base font-semibold text-gray-900">
                              {formatCurrencyEGP(orderData.order.PriceBeforDiscount || 0)}
                            </div>
                          </div>
                          {orderData.order.Discount && orderData.order.Discount > 0 && (
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-1">الخصم</div>
                              <div className="text-base font-semibold text-green-600">
                                -{formatCurrencyEGP(orderData.order.Discount)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Financial Info - Simplified */}
                      {(orderData.order.ProductsDiscount > 0 || orderData.order.OffersDiscount > 0) && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="grid grid-cols-2 gap-3">
                            {orderData.order.ProductsDiscount && orderData.order.ProductsDiscount > 0 && (
                              <div className="text-center">
                                <div className="text-sm text-gray-600 mb-1">خصم المنتجات</div>
                                <div className="text-base font-semibold text-purple-600">
                                  -{formatCurrencyEGP(orderData.order.ProductsDiscount)}
                                </div>
                              </div>
                            )}
                            {orderData.order.OffersDiscount && orderData.order.OffersDiscount > 0 && (
                              <div className="text-center">
                                <div className="text-sm text-gray-600 mb-1">خصم العروض</div>
                                <div className="text-base font-semibold text-blue-600">
                                  -{formatCurrencyEGP(orderData.order.OffersDiscount)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Products Preview - Larger and Clearer */}
                      <div className="mb-3">
                        <div className="text-base font-semibold text-gray-900 mb-3">المنتجات المطلوبة</div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {orderData.details.slice(0, 3).map((item: any, index: number) => (
                            <div key={item.ID} className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">الكمية: {item.Qty}</span>
                                  <span className="text-sm font-semibold text-blue-600">
                                    {formatCurrencyEGP(item.TotalSalesPrice || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {orderData.details.length > 3 && (
                            <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="text-sm text-blue-600 font-medium">
                                +{orderData.details.length - 3} منتج آخر
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Status and Actions - Simplified */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            (orderData.order.IDRequestStatus || 1) === 1 ? 'bg-yellow-400' :
                            (orderData.order.IDRequestStatus || 1) === 2 ? 'bg-blue-400' :
                            (orderData.order.IDRequestStatus || 1) === 3 ? 'bg-purple-400' :
                            (orderData.order.IDRequestStatus || 1) === 4 ? 'bg-orange-400' :
                            (orderData.order.IDRequestStatus || 1) === 5 ? 'bg-red-400' :
                            (orderData.order.IDRequestStatus || 1) === 6 ? 'bg-green-400' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm text-gray-600">
                            {(() => {
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
                            })()}
                          </span>
                        </div>
                        
                        {/* View Details Button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            // فتح في تبويب جديد
                            window.open(`/account_client/order-details?id=${orderData.order.ID}`, '_blank')
                          }}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض التفاصيل
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
