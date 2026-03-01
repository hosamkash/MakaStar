'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ShoppingBag, Package, Calendar, MapPin, Phone, Mail, Receipt, Eye, User, Bug } from 'lucide-react'
import { useClientSession } from '@/lib/hooks/use-client-session'
import { OrdersService, OrderWithDetails } from '@/lib/services/orders-service'
import { formatCurrencyEGP } from '@/lib/utils'

export default function OrdersPage() {
  const router = useRouter()
  const { session: clientSession } = useClientSession()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (clientSession) {
      loadOrders()
      
      // تحديث الطلبات فقط كل 5 ثوان بدون إعادة تحميل الصفحة
      const interval = setInterval(() => {
        updateOrdersOnly()
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [clientSession])

  const loadOrders = async (showNotification = false) => {
    try {
      setIsLoading(true)
      const clientOrders = await OrdersService.getClientOrders(clientSession?.id || 0)
      setOrders(clientOrders)
      
      if (showNotification) {
        // يمكن إضافة إشعار هنا إذا كان لديك نظام إشعارات
        console.log('تم تحديث قائمة الطلبات بنجاح')
      }
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('فشل في تحميل الطلبات')
    } finally {
      setIsLoading(false)
    }
  }

  // دالة تحديث الطلبات فقط بدون إعادة تحميل الصفحة
  const updateOrdersOnly = async () => {
    try {
      const clientOrders = await OrdersService.getClientOrders(clientSession?.id || 0)
      setOrders(clientOrders)
    } catch (err) {
      console.error('Error updating orders:', err)
    }
  }

  const diagnoseOrders = async () => {
    try {
      console.log('بدء تشخيص الطلبات...')
      await OrdersService.diagnoseOrdersStructure()
      await OrdersService.inspectClientOrders(clientSession?.id || 0)
      alert('تم إرسال معلومات التشخيص إلى Console. اضغط F12 لرؤية النتائج.')
    } catch (err) {
      console.error('Error diagnosing orders:', err)
      alert('حدث خطأ في التشخيص')
    }
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'تم تأكيد الطلب'
      case 2: return 'جاري التجهيز'
      case 3: return 'تم الشحن'
      case 4: return 'تم التوصيل'
      case 5: return 'مرفوض من العميل'
      case 6: return 'ملغي'
      default: return 'غير محدد'
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-blue-100 text-blue-800'
      case 2: return 'bg-purple-100 text-purple-800'
      case 3: return 'bg-orange-100 text-orange-800'
      case 4: return 'bg-green-100 text-green-800'
      case 5: return 'bg-red-100 text-red-800'
      case 6: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDescription = (status: number) => {
    switch (status) {
      case 1: return 'تم تأكيد طلبك بنجاح'
      case 2: return 'تجهيز المنتجات'
      case 3: return 'الطلب في الطريق إليك'
      case 4: return 'تم استلام الطلب'
      case 5: return 'مرفوض من العميل'
      case 6: return 'تم إلغاء الطلب'
      default: return 'حالة غير محددة'
    }
  }

  const formatDate = (date: Date | string) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('ar-EG')
    }
    return date.toLocaleDateString('ar-EG')
  }

  useEffect(() => {
    if (!clientSession) {
      router.push('/account_client/client-login')
    }
  }, [clientSession, router])

  if (!clientSession) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-blue-700 p-1"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src="/maka-star-logo.png" 
              alt="مكه ستار" 
              className="w-6 h-6 object-contain"
            />
            <h1 className="text-lg font-bold">طلباتي</h1>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">لا توجد طلبات</h2>
            <p className="text-gray-600 mb-6">لم تقم بأي طلبات بعد</p>
            <div className="space-y-4">
              <Button onClick={() => router.push('/store')}>
                <Package className="w-4 h-4 ml-2" />
                تصفح المنتجات
              </Button>
              <div>
                <Button 
                  variant="outline" 
                  onClick={diagnoseOrders}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Bug className="w-4 h-4 ml-2" />
                  تشخيص الطلبات
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">جميع الطلبات</h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {orders.length} طلب
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadOrders(true)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Package className="w-4 h-4 ml-1" />
                  تحديث
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={diagnoseOrders}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Bug className="w-4 h-4 ml-1" />
                  تشخيص
                </Button>
              </div>
            </div>

            {orders.map((orderData) => (
              <Card key={orderData.order.ID} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        طلب رقم: {orderData.order.OrderNo}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(orderData.order.OrderDate || new Date())}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {orderData.order.ProductsCount} منتج
                        </span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(orderData.order.IDRequestStatus || 1)}>
                        {getStatusText(orderData.order.IDRequestStatus || 1)}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {getStatusDescription(orderData.order.IDRequestStatus || 1)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Details */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">تفاصيل الطلب</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">المجموع الفرعي:</span>
                          <span className="font-medium">{formatCurrencyEGP(orderData.order.PriceBeforDiscount || 0)}</span>
                        </div>
                        {orderData.order.Discount && orderData.order.Discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>الخصم:</span>
                            <span className="font-medium">-{formatCurrencyEGP(orderData.order.Discount)}</span>
                          </div>
                        )}
                        {orderData.order.Shipping && orderData.order.Shipping > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">الشحن:</span>
                            <span className="font-medium">{formatCurrencyEGP(orderData.order.Shipping)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2">
                          <div className="flex justify-between text-lg font-bold">
                            <span>الإجمالي النهائي:</span>
                            <span className="text-blue-600">{formatCurrencyEGP(orderData.order.NetValue || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">معلومات العميل</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{orderData.order.CustomerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{orderData.order.Mobile || orderData.order.Phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{orderData.order.EMail}</span>
                        </div>
                        {orderData.order.Address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{orderData.order.Address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">المنتجات المطلوبة</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {orderData.details.map((item) => (
                        <div key={item.ID} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
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
                            <h5 className="text-sm font-medium text-gray-900 truncate">{item.Name}</h5>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-600">الكمية: {item.Qty}</span>
                              <span className="text-xs font-semibold text-blue-600">
                                {formatCurrencyEGP(item.TotalSalesPrice || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Notes */}
                  {orderData.order.Notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-1">ملاحظات الطلب:</h5>
                      <p className="text-sm text-blue-800">{orderData.order.Notes}</p>
                    </div>
                  )}

                  {/* Applied Offers */}
                  {(orderData.order.AppliedOfferName || (orderData.order.AppliedPackageOffersNames && orderData.order.AppliedPackageOffersNames.length > 0)) && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-900 mb-2">العروض المطبقة:</h5>
                      <div className="space-y-1">
                        {orderData.order.AppliedOfferName && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-800">• العرض النقدي:</span>
                            <span className="text-sm font-semibold text-green-900">{orderData.order.AppliedOfferName}</span>
                          </div>
                        )}
                        {orderData.order.AppliedPackageOffersNames && orderData.order.AppliedPackageOffersNames.length > 0 && (
                          <div>
                            <span className="text-sm text-green-800">• عروض المنتجات:</span>
                            {orderData.order.AppliedPackageOffersNames.map((offerName, index) => (
                              <div key={index} className="text-sm font-semibold text-green-900 mr-4">
                                {offerName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Receipt className="w-4 h-4 ml-2" />
                      طباعة الفاتورة
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 ml-2" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
