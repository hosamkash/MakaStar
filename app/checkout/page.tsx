'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, CreditCard, Save, Loader2, CheckCircle, AlertCircle, MapPin, Phone, X, User, Package } from 'lucide-react'
import { useClientSession } from '@/lib/hooks/use-client-session'
import { useCart } from '@/lib/contexts/cart-context'
import { OrdersService } from '@/lib/services/orders-service'
import { notify } from '@/lib/notifications'
import PersonalSponsor from '@/components/personal-sponsor'
import AddressSelectorDialog from '@/components/address-selector-dialog'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export default function CheckoutPage() {
  const router = useRouter()
  const { session: clientSession, isLoading: sessionLoading } = useClientSession()
  const { state: cartState, clearCart } = useCart()
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientMobile: '',
    clientEmail: '',
    clientAddress: '',
    clientLatitude: '',
    clientLongitude: '',
    paymentMethod: 'cash',
    notes: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('') 
  const [success, setSuccess] = useState(false)
  const [showRedirectDialog, setShowRedirectDialog] = useState(false)
  
  // متغيرات الراعي الشخصي
  const [personalSponsor, setPersonalSponsor] = useState<any>(null)
  
  // تحميل الراعي الشخصي الافتراضي للعميل
  useEffect(() => {
    const loadDefaultPersonalSponsor = async () => {
      if (!clientSession?.username) return
      
      try {
        // البحث عن العميل في Firebase
        const clientsRef = collection(db, "Dealing_Clients")
        const q = query(
          clientsRef,
          where("UserName", "==", clientSession.username),
          where("IsActive", "==", true)
        )
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const clientDoc = querySnapshot.docs[0].data()
          
          // إذا كان للعميل راعي شخصي افتراضي
          if (clientDoc.PersonalSponsorID) {
            try {
              const employeesRef = collection(db, "Dealing_Employees")
              const empQuery = query(employeesRef, where("ID", "==", clientDoc.PersonalSponsorID))
              const empSnapshot = await getDocs(empQuery)
              
              if (!empSnapshot.empty) {
                const empData = empSnapshot.docs[0].data()
                const defaultSponsor = {
                  id: empData.ID?.toString() || '',
                  name: empData.Name || '',
                  code: empData.Code?.toString() || '',
                  mobile: empData.Mobile || ''
                }
                
                // تعيين الراعي الافتراضي إذا لم يكن هناك راعي محفوظ في localStorage
                const savedSponsorCode = localStorage.getItem('cartPersonalSponsorCode')
                if (!savedSponsorCode && defaultSponsor.name) {
                  setPersonalSponsor(defaultSponsor)
                  console.log('تم تحميل الراعي الشخصي الافتراضي:', defaultSponsor.name)
                }
              }
            } catch (error) {
              console.error('خطأ في تحميل الراعي الشخصي الافتراضي:', error)
            }
          }
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات العميل:', error)
      }
    }
    
    if (clientSession) {
      loadDefaultPersonalSponsor()
    }
  }, [clientSession])
  
  // متغيرات اختيار العنوان
  const [addressSelectorOpen, setAddressSelectorOpen] = useState(false)

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!sessionLoading && !clientSession) {
      router.push('/account_client/client-login?redirect=/checkout')
    }
  }, [clientSession, sessionLoading, router])

  // Pre-fill form data from client session
  useEffect(() => {
    if (clientSession) {
      setFormData(prev => ({
        ...prev,
        clientName: clientSession.name || '',
        clientPhone: clientSession.phone || '',
        clientMobile: clientSession.mobile || '',
        clientEmail: clientSession.email || '',
        clientAddress: clientSession.address || '',
        clientLatitude: clientSession.latitude || '',
        clientLongitude: clientSession.longitude || ''
      }))
    }
  }, [clientSession])

  // تحميل بيانات الراعي الشخصي من localStorage
  useEffect(() => {
    const sponsorCode = localStorage.getItem('cartPersonalSponsorCode')
    const sponsorName = localStorage.getItem('cartPersonalSponsorName')
    const sponsorMobile = localStorage.getItem('cartPersonalSponsorMobile')
    const sponsorID = localStorage.getItem('cartPersonalSponsorID')
    
    if (sponsorCode && sponsorName && sponsorID) {
      setPersonalSponsor({
        id: sponsorID,
        code: sponsorCode,
        name: sponsorName,
        mobile: sponsorMobile || ''
      })
    }
  }, [])


  // Redirect if no items in cart
  useEffect(() => {
    if (cartState.items.length === 0) {
      router.push('/cart')
    }
  }, [cartState.items, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // دالة الحصول على الموقع
  const handleGetLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setFormData(prev => ({
            ...prev,
            clientLatitude: latitude.toString(),
            clientLongitude: longitude.toString()
          }))
          notify.success('تم الحصول على الموقع بنجاح')
        },
        (error) => {
          console.error('Error getting location:', error)
          notify.error('فشل في الحصول على الموقع. يرجى التأكد من السماح بالوصول للموقع')
        }
      )
    } else {
      notify.error('المتصفح لا يدعم تحديد الموقع')
    }
  }

  const validateForm = () => {
    if (!formData.clientName.trim()) {
      setError('اسم العميل مطلوب')
      return false
    }
    if (!formData.clientMobile.trim()) {
      setError('رقم الموبايل مطلوب')
      return false
    }
    // if (!formData.clientEmail.trim()) {
    //   setError('البريد الإلكتروني مطلوب')
    //   return false
    // }
    if (!formData.clientAddress.trim()) {
      setError('العنوان مطلوب')
      return false
    }
    
    // // Email validation
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // if (!emailRegex.test(formData.clientEmail)) {
    //   setError('البريد الإلكتروني غير صحيح')
    //   return false
    // }
    
    // Mobile validation (Egyptian format)
    const mobileRegex = /^(\+20|0)?1[0125][0-9]{8}$/
    if (!mobileRegex.test(formData.clientMobile.replace(/\s/g, ''))) {
      setError('رقم الموبايل غير صحيح')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    if (!clientSession) {
      setError('يجب تسجيل الدخول أولاً')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      // التحقق من وجود عناصر في السلة
      if (!cartState.items || cartState.items.length === 0) {
        setError('السلة فارغة، لا يمكن إنشاء الطلب')
        return
      }

      // تحميل الراعي الشخصي من localStorage إذا لم يكن محفوظاً في state
      let finalPersonalSponsor = personalSponsor
      if (!finalPersonalSponsor) {
        const savedSponsorCode = localStorage.getItem('cartPersonalSponsorCode')
        const savedSponsorName = localStorage.getItem('cartPersonalSponsorName')
        const savedSponsorMobile = localStorage.getItem('cartPersonalSponsorMobile')
        const savedSponsorID = localStorage.getItem('cartPersonalSponsorID')
        
        if (savedSponsorCode && savedSponsorName) {
          finalPersonalSponsor = {
            id: savedSponsorID || '',
            name: savedSponsorName,
            code: savedSponsorCode,
            mobile: savedSponsorMobile || ''
          }
          console.log('تم تحميل الراعي الشخصي من localStorage:', finalPersonalSponsor)
        }
      }

      console.log('بيانات الطلب المرسلة:', {
        customerID: clientSession.id || 0,
        customerName: formData.clientName,
        customerPhone: formData.clientMobile,
        customerEmail: formData.clientEmail,
        customerAddress: formData.clientAddress,
        itemsCount: cartState.items.length,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        personalSponsor: finalPersonalSponsor
      })

      const order = await OrdersService.createOrderFromCart(
        clientSession.id || 0,
        formData.clientName,
        formData.clientMobile, // استخدام الموبايل كرقم الهاتف الرئيسي
        formData.clientEmail,
        formData.clientAddress,
        cartState.items,
        formData.paymentMethod,
        formData.notes,
        cartState.appliedOffer, // العرض النقدي المطبق
        cartState, // حالة السلة الكاملة للحصول على العروض المطبقة
        finalPersonalSponsor // بيانات الراعي الشخصي (من state أو localStorage)
      )
      
      setSuccess(true)
      clearCart()
      
      // حذف بيانات الراعي الشخصي من localStorage بعد إتمام الطلب
      localStorage.removeItem('cartPersonalSponsorCode')
      localStorage.removeItem('cartPersonalSponsorName')
      localStorage.removeItem('cartPersonalSponsorMobile')
      localStorage.removeItem('cartPersonalSponsorID')
      
      // إعادة تعيين متغيرات الراعي الشخصي في الصفحة
      setPersonalSponsor(null)
      
      notify.success('تم إنشاء الطلب بنجاح')
      
      // إظهار ديالوج التوجيه بدلاً من التحويل التلقائي
      setShowRedirectDialog(true)
      
    } catch (err) {
      console.error('Error creating order:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        cartState: cartState,
        formData: formData
      })
      
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الطلب'
      setError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // دالة تحديث الراعي الشخصي
  const handlePersonalSponsorChange = (sponsor: any) => {
    setPersonalSponsor(sponsor)
    console.log('تم تحديث الراعي الشخصي في checkout:', sponsor)
  }

  // دالة معالجة اختيار العنوان من الديالوج
  const handleAddressSelect = (selectedAddress: string) => {
    setFormData(prev => ({
      ...prev,
      clientAddress: selectedAddress
    }))
    console.log('تم اختيار العنوان:', selectedAddress)
  }

  // Show loading while checking session
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من تسجيل الدخول...</p>
        </div>
      </div>
    )
  }

  // Redirect if not logged in
  if (!clientSession) {
    return null
  }

  if (cartState.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">السلة فارغة</h2>
          <p className="text-gray-600 mb-4">لا توجد منتجات في السلة لإتمام الطلب</p>
          <Button asChild>
            <a href="/store">العودة للمتجر</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
                 {/* Header */}
         <div className="mb-8">
           <Button variant="ghost" asChild className="mb-4">
             <a href="/cart">
               <ArrowLeft className="w-4 h-4 ml-2" />
               العودة للسلة
             </a>
           </Button>
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <img 
                 src="/maka-star-logo.png" 
                 alt="مكه ستار" 
                 className="w-10 h-10 object-contain"
               />
               <div>
                 <h1 className="text-3xl font-bold">إتمام الطلب</h1>
                 <p className="text-gray-600 mt-2">أدخل بياناتك لإتمام عملية الشراء</p>
               </div>
             </div>
             
                                         {/* زر إتمام الطلب في الأعلى */}
              <div className="hidden lg:block">
                <Button
                  onClick={handleSubmit}
                  className="bg-red-600 hover:bg-red-700 text-white w-full py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري إنشاء الطلب...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      إتمام الطلب
                    </>
                  )}
                </Button>
              </div>
           </div>
           
                       {/* زر إتمام الطلب للشاشات الصغيرة */}
            <div className="lg:hidden mb-6">
              <Button
                onClick={handleSubmit}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري إنشاء الطلب...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    إتمام الطلب
                  </>
                )}
              </Button>
            </div>
         </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* الراعي الشخصي */}
          <div className="lg:col-span-1 space-y-6">
            <PersonalSponsor 
              mode="cart"
              onSponsorChange={handlePersonalSponsorChange}
            />

            {/* Order Summary */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 ml-2" />
                  ملخص الأوردر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>عدد المنتجات:</span>
                    <span className="font-medium">{cartState.totalItems} قطع</span>
                  </div>
                  <div className="flex justify-between">
                    <span>قيمة السلع:</span>
                    <span className="font-medium">{cartState.totalPrice.toFixed(2)} ج.م جنية</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الشحن والتوصيل:</span>
                    <span className="font-medium">{cartState.shipping.toFixed(2)} ج.م جنية</span>
                  </div>
                  
                  {/* الخصومات */}
                  {(cartState.totalDiscount > 0 || cartState.productOffersDiscount > 0 || cartState.offerDiscount > 0) && (
                    <div className="space-y-2">
                      <div className="font-semibold text-sm">الخصومات</div>
                      {cartState.totalDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>خصم الأصناف:</span>
                          <span className="font-medium">- {cartState.totalDiscount.toFixed(2)} ج.م جنية</span>
                        </div>
                      )}
                      {cartState.productOffersDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>خصم عروض المنتجات:</span>
                          <span className="font-medium">- {cartState.productOffersDiscount.toFixed(2)} ج.م جنية</span>
                        </div>
                      )}
                      {cartState.offerDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>خصم العروض:</span>
                          <span className="font-medium">- {cartState.offerDiscount.toFixed(2)} ج.م جنية</span>
                        </div>
                      )}
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span>إجمالي الخصومات:</span>
                        <span>{(cartState.totalDiscount + cartState.productOffersDiscount + cartState.offerDiscount).toFixed(2)} ج.م جنية</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-2">
                    <div className="font-semibold text-sm mb-2">الصافي</div>
                    <div className="flex justify-between text-lg font-bold text-blue-600">
                      <span>الإجمالي النهائي:</span>
                      <span>{cartState.finalTotal.toFixed(2)} ج.م جنية</span>
                    </div>
                  </div>
                  
                  {/* العروض المتاحة */}
                  <div className="space-y-2">
                    <div className="font-semibold text-sm">العروض المتاحة</div>
                    <div className="text-sm text-gray-600">
                      <div className="p-2 border rounded bg-gray-50">
                        عرض 250 ج خصم على 2000 ج
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>بيانات الطلب</CardTitle>
                <CardDescription>
                  أدخل بياناتك الشخصية وطريقة الدفع
                </CardDescription>
              </CardHeader>
              <CardContent>
                                 {success ? (
                   <div className="text-center py-8">
                     <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                     <h3 className="text-xl font-bold mb-2">تم إنشاء الطلب بنجاح!</h3>
                     <p className="text-gray-600">سيظهر لك خيارات التوجيه قريباً...</p>
                   </div>
                 ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">المعلومات الشخصية</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="clientName">اسم العميل *</Label>
                          <Input
                            id="clientName"
                            value={formData.clientName}
                            onChange={(e) => handleInputChange('clientName', e.target.value)}
                            placeholder="أدخل اسم العميل"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="clientMobile">رقم الموبايل *</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="clientMobile"
                              value={formData.clientMobile}
                              onChange={(e) => handleInputChange('clientMobile', e.target.value)}
                              placeholder="01xxxxxxxxx"
                              className="pr-10 pl-10"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="clientPhone">رقم الهاتف (اختياري)</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="clientPhone"
                              value={formData.clientPhone}
                              onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                              placeholder="02xxxxxxxxx"
                              className="pr-10 pl-10"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="clientEmail">البريد الإلكتروني</Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            value={formData.clientEmail}
                            onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                            placeholder="example@email.com"
                           // required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="clientAddress" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          العنوان التفصيلي *
                        </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                            onClick={() => setAddressSelectorOpen(true)}
                          >
                            <MapPin className="w-4 h-4 ml-1" />
                            اختار العنوان
                          </Button>
                        </div>
                        <Textarea
                          id="clientAddress"
                          value={formData.clientAddress}
                          onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                          placeholder="أدخل العنوان التفصيلي (المحافظة، المدينة، الحي، الشارع، رقم المنزل)"
                          rows={4}
                          className="mt-2 border-blue-200 focus:border-blue-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          مثال: القاهرة، المعادي، شارع 9، عمارة 15، شقة 3
                        </p>
                      </div>

                      {/* Location Information */}
                      <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            إحداثيات الموقع (اختياري)
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGetLocation}
                            className="text-blue-600 border-blue-300 hover:bg-blue-100"
                          >
                            <MapPin className="w-4 h-4 ml-2" />
                            الحصول على الموقع تلقائياً
                          </Button>
                        </div>
                        
                        <p className="text-xs text-blue-700">
                          يمكنك الحصول على إحداثيات موقعك تلقائياً أو إدخالها يدوياً لسهولة الوصول إليك
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="clientLatitude" className="text-sm">خط العرض (Latitude)</Label>
                            <Input
                              id="clientLatitude"
                              value={formData.clientLatitude}
                              onChange={(e) => handleInputChange('clientLatitude', e.target.value)}
                              placeholder="30.0444"
                              className="bg-white border-blue-200"
                            />
                          </div>
                          <div>
                            <Label htmlFor="clientLongitude" className="text-sm">خط الطول (Longitude)</Label>
                            <Input
                              id="clientLongitude"
                              value={formData.clientLongitude}
                              onChange={(e) => handleInputChange('clientLongitude', e.target.value)}
                              placeholder="31.2357"
                              className="bg-white border-blue-200"
                            />
                          </div>
                        </div>
                        
                        {(formData.clientLatitude || formData.clientLongitude) && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-700">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm font-medium">تم تحديد الموقع بنجاح</span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              خط العرض: {formData.clientLatitude || 'غير محدد'} | خط الطول: {formData.clientLongitude || 'غير محدد'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">معلومات الدفع</h3>
                      
                      <div>
                        <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                        <Select
                          value={formData.paymentMethod}
                          onValueChange={(value) => handleInputChange('paymentMethod', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر طريقة الدفع" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">نقداً</SelectItem>
                            <SelectItem value="card">بطاقة ائتمان</SelectItem>
                            <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <Label htmlFor="notes">ملاحظات إضافية</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="أي ملاحظات إضافية للطلب..."
                        rows={3}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري إنشاء الطلب...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 ml-2" />
                          إتمام الطلب
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
                     </div>
         </div>
       </div>

       {/* ديالوج التوجيه بعد إتمام الطلب */}
       <Dialog open={showRedirectDialog} onOpenChange={setShowRedirectDialog}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="text-center text-gray-900">
               تم إنشاء الطلب بنجاح! 🎉
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="text-center">
               <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
               <p className="text-gray-600 mb-6">
                 تم إنشاء طلبك بنجاح. أين تريد الذهاب الآن؟
               </p>
             </div>
             
             <div className="space-y-3">
               <Button
                 onClick={() => {
                   setShowRedirectDialog(false)
                   router.push('/account_client')
                 }}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white"
               >
                 <User className="w-4 h-4 ml-2" />
                 الذهاب للحساب الشخصي
               </Button>
               
               <Button
                 variant="outline"
                 onClick={() => {
                   setShowRedirectDialog(false)
                   router.push('/store')
                 }}
                 className="w-full border-gray-300 hover:bg-gray-50"
               >
                 <Package className="w-4 h-4 ml-2" />
                 متابعة التسوق
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* ديالوج اختيار العنوان */}
       <AddressSelectorDialog
         open={addressSelectorOpen}
         onOpenChange={setAddressSelectorOpen}
         onAddressSelect={handleAddressSelect}
       />
     </div>
   )
 }
