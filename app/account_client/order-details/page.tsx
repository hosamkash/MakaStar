'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  User, 
  Package, 
  Eye, 
  Gift,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  CreditCard,
  CheckCircle,
  Clock,
  Truck,
  Home
} from 'lucide-react'
import { useClientSession } from '@/lib/hooks/use-client-session'
import { formatCurrencyEGP } from '@/lib/utils'
import OrderFinancialSummary from '@/components/order-financial-summary'
import { db } from '@/lib/firebase'
import { OrdersService } from '@/lib/services/orders-service'
import PersonalSponsor from '@/components/personal-sponsor'

export default function OrderDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const { session: clientSession } = useClientSession()
  
  const [orderData, setOrderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      loadOrderDetails()
    }
  }, [orderId])

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true)
      if (!orderId) return

      const orderDetails = await OrdersService.getOrder(parseInt(orderId))
      if (orderDetails) {
        setOrderData(orderDetails)
      }
    } catch (error) {
      console.error('خطأ في تحميل تفاصيل الطلب:', error)
    } finally {
      setIsLoading(false)
    }
  }


  // دالة الحصول على بيانات حالة الطلب
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

  // دالة الحصول على جميع حالات التتبع
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


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">الطلب غير موجود</h2>
          <p className="text-gray-600 mb-4">لم يتم العثور على الطلب المطلوب</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 ml-2" />
                العودة
              </Button>
                             <div className="flex items-center gap-3">
                 <img 
                   src="/maka-star-logo.png" 
                   alt="مكه ستار" 
                   className="w-8 h-8 object-contain"
                 />
                 <div>
                   <h1 className="text-xl font-semibold text-gray-900">تفاصيل الطلب</h1>
                   <p className="text-sm text-gray-500">طلب رقم: {orderData.order.OrderNo}</p>
                 </div>
               </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${
                (orderData.order.IDRequestStatus || 1) === 1 ? 'bg-blue-100 text-blue-800' :
                (orderData.order.IDRequestStatus || 1) === 2 ? 'bg-purple-100 text-purple-800' :
                (orderData.order.IDRequestStatus || 1) === 3 ? 'bg-orange-100 text-orange-800' :
                (orderData.order.IDRequestStatus || 1) === 4 ? 'bg-green-100 text-green-800' :
                (orderData.order.IDRequestStatus || 1) === 5 ? 'bg-red-100 text-red-800' :
                (orderData.order.IDRequestStatus || 1) === 6 ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
              }`}>
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
              </Badge>
            </div>
          </div>
        </div>
      </div>

             {/* Content */}
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {/* Order Status Notification */}
         {orderData && (() => {
           const statusData = getOrderStatusData(orderData.order.IDRequestStatus || 1)
           const IconComponent = statusData.icon
           
           return (
             <div className={`mb-6 p-4 rounded-lg border ${statusData.bgColor} ${statusData.borderColor}`}>
               <div className="flex items-center gap-3">
                 {IconComponent && <IconComponent className={`w-6 h-6 ${statusData.color}`} />}
                 <div className="flex-1">
                   <h3 className={`font-semibold ${statusData.color}`}>
                     {statusData.name}
                   </h3>
                   {statusData.description && (
                     <p className={`text-sm mt-1 ${statusData.color.replace('text-', 'text-').replace('-600', '-700')}`}>
                       {statusData.description}
                     </p>
                   )}
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-gray-500">
                     {new Date(orderData.order.ModifiedDate || orderData.order.CreatedDate || new Date()).toLocaleDateString('ar-EG', {
                       year: 'numeric',
                       month: 'short',
                       day: 'numeric',
                       hour: '2-digit',
                       minute: '2-digit'
                     })}
                   </p>
                 </div>
               </div>
             </div>
           )
         })()}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Main Content */}
           <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  ملخص الطلب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">رقم الطلب</div>
                    <div className="text-lg font-semibold">{orderData.order.OrderNo}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">تاريخ الطلب</div>
                    <div className="text-lg font-semibold">
                      {new Date(orderData.order.CreatedDate || orderData.order.OrderDate || new Date()).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">عدد المنتجات</div>
                    <div className="text-lg font-semibold">{orderData.order.ProductsCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">القيمة الإجمالية</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {formatCurrencyEGP(orderData.order.NetValue || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  المنتجات المطلوبة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.details.map((item: any) => (
                    <div key={item.ID} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.ImageURL ? (
                          <img 
                            src={item.ImageURL} 
                            alt={item.Name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">
                          {item.Name}
                        </h5>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">السعر:</span>
                            <span className="font-medium ml-2">{formatCurrencyEGP(item.SalesPrice || 0)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">الكمية:</span>
                            <span className="font-medium ml-2">{item.Qty}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">الإجمالي:</span>
                            <span className="font-medium text-blue-600 ml-2">{formatCurrencyEGP(item.TotalSalesPrice || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

                         {/* Order Tracking */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Package className="w-5 h-5" />
                   تتبع الطلب
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="relative">
                   {/* Timeline */}
                   <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                   
                   <div className="space-y-8">
                     {getOrderTrackingSteps().map((step, index) => {
                       const IconComponent = step.icon
                       const isLast = index === getOrderTrackingSteps().length - 1
                       
                       return (
                         <div key={step.id} className="relative flex items-start">
                           {/* Timeline Node */}
                           <div className={`absolute right-6 top-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                             step.isCompleted 
                               ? 'bg-blue-600 border-blue-600' 
                               : 'bg-gray-100 border-gray-300'
                           }`}>
                             {step.isCompleted && (
                               <CheckCircle className="w-3 h-3 text-white" />
                             )}
                           </div>
                           
                           {/* Timeline Line */}
                           {!isLast && (
                             <div className={`absolute right-7 top-6 w-0.5 h-8 ${
                               step.isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                             }`}></div>
                           )}
                           
                           {/* Content */}
                           <div className="mr-12 flex-1">
                             <div className={`p-4 rounded-lg border ${
                               step.isCompleted 
                                 ? 'bg-blue-50 border-blue-200' 
                                 : 'bg-gray-50 border-gray-200'
                             }`}>
                               <div className="flex items-center gap-3 mb-2">
                                 <IconComponent className={`w-5 h-5 ${
                                   step.isCompleted 
                                     ? 'text-blue-600' 
                                     : 'text-gray-400'
                                 }`} />
                                 <h4 className={`font-semibold ${
                                   step.isCompleted 
                                     ? 'text-blue-900' 
                                     : 'text-gray-500'
                                 }`}>
                                   {step.name}
                                 </h4>
                               </div>
                               
                               <p className={`text-sm ${
                                 step.isCompleted 
                                   ? 'text-blue-700' 
                                   : 'text-gray-500'
                               }`}>
                                 {step.description}
                               </p>
                               
                               {step.date && (
                                 <p className={`text-xs mt-2 ${
                                   step.isCompleted 
                                     ? 'text-blue-600' 
                                     : 'text-gray-400'
                                 }`}>
                                   {new Date(step.date).toLocaleDateString('ar-EG', {
                                     year: 'numeric',
                                     month: 'short',
                                     day: 'numeric',
                                     hour: '2-digit',
                                     minute: '2-digit'
                                   })}
                                 </p>
                               )}
                             </div>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Customer Information */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <User className="w-5 h-5" />
                   معلومات العميل
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   <div className="flex items-center gap-3">
                     <User className="w-4 h-4 text-gray-400" />
                     <span className="text-sm">{orderData.order.CustomerName}</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <Phone className="w-4 h-4 text-gray-400" />
                     <span className="text-sm">{orderData.order.Mobile || orderData.order.Phone}</span>
                   </div>
                   {orderData.order.EMail && (
                     <div className="flex items-center gap-3">
                       <Mail className="w-4 h-4 text-gray-400" />
                       <span className="text-sm">{orderData.order.EMail}</span>
                     </div>
                   )}
                   {orderData.order.Address && (
                     <div className="flex items-center gap-3">
                       <MapPin className="w-4 h-4 text-gray-400" />
                       <span className="text-sm">{orderData.order.Address}</span>
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>
          </div>

                     {/* Sidebar */}
           <div className="space-y-6">
             {/* Current Order Status */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Package className="w-5 h-5" />
                   حالة الطلب الحالية
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {orderData && (() => {
                   const statusData = getOrderStatusData(orderData.order.IDRequestStatus || 1)
                   const IconComponent = statusData.icon
                   
                   return (
                     <div className={`p-4 rounded-lg border ${statusData.bgColor} ${statusData.borderColor}`}>
                       <div className="flex items-center gap-3 mb-2">
                         {IconComponent && <IconComponent className={`w-5 h-5 ${statusData.color}`} />}
                         <h4 className={`font-semibold ${statusData.color}`}>
                           {statusData.name}
                         </h4>
                       </div>
                       
                       {statusData.description && (
                         <p className={`text-sm ${statusData.color.replace('text-', 'text-').replace('-600', '-700')}`}>
                           {statusData.description}
                         </p>
                       )}
                       
                       <div className="mt-3 pt-3 border-t border-gray-200">
                         <p className="text-xs text-gray-500">
                           آخر تحديث: {new Date(orderData.order.ModifiedDate || orderData.order.CreatedDate || new Date()).toLocaleDateString('ar-EG', {
                             year: 'numeric',
                             month: 'short',
                             day: 'numeric',
                             hour: '2-digit',
                             minute: '2-digit'
                           })}
                         </p>
                       </div>
                     </div>
                   )
                 })()}
               </CardContent>
             </Card>

             {/* مكون الراعي الشخصي */}
            <PersonalSponsor 
              mode="order"
              orderId={orderId || ''}
              readOnly={true}
              onSponsorChange={(sponsor) => {
                console.log('تم تحديث الراعي الشخصي:', sponsor)
              }}
            />

            {/* منتجات الهدايا */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900">
                  منتجات الهدايا
                  <Gift className="w-5 h-5 text-yellow-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderData.order.giftProducts && orderData.order.giftProducts.length > 0 ? (
                  <div className="space-y-3">
                    {orderData.order.giftProducts.map((gift: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-300">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {gift.ImageURL ? (
                            <img 
                              src={gift.ImageURL} 
                              alt={gift.Name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Gift className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-gray-900 mb-1">
                            {gift.Name}
                          </h5>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>الكمية: {gift.Qty}</span>
                            <span>السعر: {formatCurrencyEGP(gift.Price || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Gift className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">لا توجد منتجات هدايا مضافة</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <OrderFinancialSummary 
              order={orderData.order} 
              showCheckoutButton={false}
              showAddMoreButton={false}
              showProfit={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
