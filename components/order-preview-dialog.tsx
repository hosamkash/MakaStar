'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  X, 
  User, 
  Package, 
  Calendar,
  Hash,
  CreditCard,
  CheckCircle,
  Clock,
  Truck,
  Home,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import { OrdersService } from '@/lib/services/orders-service'
import { formatCurrencyEGP } from '@/lib/utils'
import OrderFinancialSummary from './order-financial-summary'
import PersonalSponsor from './personal-sponsor'

interface OrderPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  orderId: number
}

export default function OrderPreviewDialog({ isOpen, onClose, orderId }: OrderPreviewDialogProps) {
  const [orderData, setOrderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails()
    }
  }, [isOpen, orderId])

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true)
      const orderDetails = await OrdersService.getOrder(orderId)
      if (orderDetails) {
        setOrderData(orderDetails)
      }
    } catch (error) {
      console.error('خطأ في تحميل تفاصيل الطلب:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getOrderStatusData = (status: number) => {
    const statuses = [
      { id: 1, name: 'تم تأكيد الطلب', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: CheckCircle, description: 'تم تأكيد طلبك بنجاح' },
      { id: 2, name: 'جاري التجهيز', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', icon: Clock, description: 'تجهيز المنتجات' },
      { id: 3, name: 'تم الشحن', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: Truck, description: 'الطلب في الطريق إليك' },
      { id: 4, name: 'تم التوصيل', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: Home, description: 'تم استلام الطلب' },
      { id: 5, name: 'مرفوض من العميل', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
      { id: 6, name: 'ملغي', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
    ]
    return statuses.find(s => s.id === status) || statuses[0]
  }

  const getOrderTrackingSteps = () => {
    const currentStatus = orderData?.order?.IDRequestStatus || 1
    const steps = [
      { id: 1, name: 'تم تأكيد الطلب', description: 'تم تأكيد طلبك بنجاح', icon: CheckCircle, date: orderData?.order?.ConfirmedDate },
      { id: 2, name: 'جاري التجهيز', description: 'تجهيز المنتجات', icon: Clock, date: orderData?.order?.ProcessingDate },
      { id: 3, name: 'تم الشحن', description: 'الطلب في الطريق إليك', icon: Truck, date: orderData?.order?.ShippedDate },
      { id: 4, name: 'تم التوصيل', description: 'تم استلام الطلب', icon: Home, date: orderData?.order?.DeliveredDate }
    ]
    
    return steps.map(step => ({
      ...step,
      isCompleted: currentStatus >= step.id
    }))
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير محدد"
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG')
  }

  if (!orderData && !isLoading) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            معاينة الطلب #{orderData?.order?.Code || orderId}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل تفاصيل الطلب...</p>
          </div>
        ) : orderData ? (
          <div className="space-y-6">
            {/* معلومات الطلب الأساسية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  معلومات الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">رقم الطلب:</span>
                    <span>{orderData.order.Code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">تاريخ الطلب:</span>
                    <span>{formatDate(orderData.order.CreatedDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">حالة الطلب:</span>
                    <Badge className={getOrderStatusData(orderData.order.IDRequestStatus).bgColor + ' ' + getOrderStatusData(orderData.order.IDRequestStatus).color}>
                      {getOrderStatusData(orderData.order.IDRequestStatus).name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">إجمالي القيمة:</span>
                    <span className="font-bold">{formatCurrencyEGP(orderData.order.TotalValue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* معلومات العميل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  معلومات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">اسم العميل:</span>
                    <span>{orderData.order.CustomerName || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">رقم الهاتف:</span>
                    <span>{orderData.order.CustomerPhone || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">البريد الإلكتروني:</span>
                    <span>{orderData.order.CustomerEmail || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">العنوان:</span>
                    <span>{orderData.order.CustomerAddress || 'غير محدد'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* المنتجات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  المنتجات ({orderData.details?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.details?.map((product: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex gap-4">
                        {/* صورة المنتج */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border">
                            {product.ImageURL ? (
                              <img 
                                src={product.ImageURL} 
                                alt={product.Name || product.ProductName || 'صورة المنتج'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.jpg'
                                }}
                                loading="lazy"
                              />
                            ) : product.ImagePath ? (
                              <img 
                                src={`https://storage.googleapis.com/YOUR_BUCKET_NAME/${product.ImagePath}`}
                                alt={product.Name || product.ProductName || 'صورة المنتج'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.jpg'
                                }}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* تفاصيل المنتج */}
                        <div className="flex-1">
                          <h4 className="font-medium">{product.Name || product.ProductName || 'منتج غير محدد'}</h4>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                            <p>الكمية: {product.Qty || product.Quantity || 0}</p>
                            <p>السعر: {formatCurrencyEGP(product.SalesPrice || product.Price || 0)}</p>
                            {product.BarCode && <p>الباركود: {product.BarCode}</p>}
                            {product.IDProduct && <p>رقم المنتج: {product.IDProduct}</p>}
                          </div>
                          {(product.DiscountValue && product.DiscountValue > 0) && (
                            <p className="text-sm text-green-600 mt-1">
                              الخصم: {formatCurrencyEGP(product.DiscountValue)}
                            </p>
                          )}
                        </div>
                        
                        {/* السعر الإجمالي */}
                        <div className="text-left">
                          <p className="font-bold text-lg">{formatCurrencyEGP((product.SalesPrice || product.Price || 0) * (product.Qty || product.Quantity || 0))}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!orderData.details || orderData.details.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>لا توجد منتجات في هذا الطلب</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* تتبع الطلب */}
            <Card>
              <CardHeader>
                <CardTitle>تتبع الطلب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getOrderTrackingSteps().map((step, index) => (
                    <div key={step.id} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.isCompleted 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step.isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          step.isCompleted ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step.name}
                        </h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        {step.date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(step.date)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* الراعي الشخصي */}
            <PersonalSponsor 
              mode="order"
              orderId={orderData.order.ID?.toString() || orderId.toString()}
              readOnly={true}
              onSponsorChange={(sponsor) => {
                console.log('تم تحديث الراعي الشخصي في معاينة الطلب:', sponsor)
              }}
            />

            {/* ملخص المالية */}
            <OrderFinancialSummary 
              order={orderData.order} 
              showCheckoutButton={false}
              showAddMoreButton={false}
              showProfit={true}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">الطلب غير موجود</h2>
            <p className="text-gray-600">لم يتم العثور على الطلب المطلوب</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
