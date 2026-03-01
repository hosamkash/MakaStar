'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Hash, 
  Phone, 
  MessageCircle, 
  X, 
  Save,
  User
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore'
import { useClientSession } from '@/lib/hooks/use-client-session'
import { useCart } from '@/lib/contexts/cart-context'
import { notify } from '@/lib/notifications'

interface PersonalSponsorData {
  id: string
  name: string
  code: string
  mobile: string
}

interface PersonalSponsorProps {
  onSponsorChange?: (sponsor: PersonalSponsorData | null) => void
  className?: string
  mode?: 'cart' | 'order' | 'admin'
  clientId?: number
  initialSponsorID?: number
  orderId?: string
  readOnly?: boolean // إخفاء أزرار التعديل والحذف
}

export default function PersonalSponsor({ 
  onSponsorChange, 
  className = "",
  mode = 'cart',
  clientId,
  initialSponsorID,
  orderId,
  readOnly = false
}: PersonalSponsorProps) {
  const { session: clientSession } = useClientSession()
  const { updatePersonalSponsor } = useCart()
  const [sponsorCode, setSponsorCode] = useState('')
  const [sponsorData, setSponsorData] = useState<PersonalSponsorData | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingSponsor, setIsLoadingSponsor] = useState(false)

  // دالة تحميل الراعي الشخصي حسب الوضع
  const loadPersonalSponsor = async () => {
    try {
      setIsLoadingSponsor(true)

      if (mode === 'order' && orderId) {
        await loadOrderPersonalSponsor()
      } else if (mode === 'admin') {
        await loadAdminPersonalSponsor()
      } else if (mode === 'cart') {
        await loadCartPersonalSponsor()
      }
    } catch (error) {
      console.error('Error loading personal sponsor:', error)
    } finally {
      setIsLoadingSponsor(false)
    }
  }

  // تحميل الراعي الشخصي من الطلب
  const loadOrderPersonalSponsor = async () => {
    if (!orderId) return

    try {
      const orderRef = doc(db, 'Shop_Orders', orderId)
      const orderSnap = await getDoc(orderRef)
      
      if (orderSnap.exists()) {
        const orderData = orderSnap.data()
        
        if (orderData.PersonalSponsorID) {
          try {
            const employeesRef = collection(db, "Dealing_Employees")
            const empQuery = query(employeesRef, where("ID", "==", orderData.PersonalSponsorID))
            const empSnapshot = await getDocs(empQuery)
            if (!empSnapshot.empty) {
              const empData = empSnapshot.docs[0].data()
              const sponsorInfo: PersonalSponsorData = {
                id: empData.ID?.toString() || '',
                name: empData.Name || orderData.PersonalSponsorName || '',
                code: empData.Code?.toString() || orderData.PersonalSponsorCode || '',
                mobile: empData.Mobile || orderData.PersonalSponsorMobile || ''
              }
              
              setSponsorCode(sponsorInfo.code)
              setSponsorData(sponsorInfo)
              console.log('تم تحميل الراعي الشخصي من الطلب:', sponsorInfo.name)
            } else {
              // استخدام البيانات المحفوظة في الطلب
              const sponsorInfo: PersonalSponsorData = {
                id: orderData.PersonalSponsorID?.toString() || '',
                name: orderData.PersonalSponsorName || '',
                code: orderData.PersonalSponsorCode || '',
                mobile: orderData.PersonalSponsorMobile || ''
              }
              
              setSponsorCode(sponsorInfo.code)
              setSponsorData(sponsorInfo)
              console.log('تم تحميل الراعي الشخصي من بيانات الطلب المحفوظة:', sponsorInfo.name)
            }
          } catch (error) {
            console.error('Error loading personal sponsor from order:', error)
            // في حالة الخطأ، استخدم البيانات المحفوظة في الطلب
            const sponsorInfo: PersonalSponsorData = {
              id: orderData.PersonalSponsorID?.toString() || '',
              name: orderData.PersonalSponsorName || '',
              code: orderData.PersonalSponsorCode || '',
              mobile: orderData.PersonalSponsorMobile || ''
            }
            
            setSponsorCode(sponsorInfo.code)
            setSponsorData(sponsorInfo)
          }
        }
      }
    } catch (error) {
      console.error('Error loading order data:', error)
    }
  }

  // تحميل الراعي الشخصي في وضع الإدارة
  const loadAdminPersonalSponsor = async () => {
    try {
      // أولوية: initialSponsorID إن وُجد
      const sponsorId = initialSponsorID
      if (sponsorId && sponsorId > 0) {
        const employeesRef = collection(db, "Dealing_Employees")
        const empQuery = query(employeesRef, where("ID", "==", sponsorId))
        const empSnapshot = await getDocs(empQuery)
        if (!empSnapshot.empty) {
          const empData = empSnapshot.docs[0].data()
          const sponsorInfo: PersonalSponsorData = {
            id: empData.ID?.toString() || '',
            name: empData.Name || '',
            code: empData.Code?.toString() || '',
            mobile: empData.Mobile || ''
          }
          setSponsorCode(sponsorInfo.code)
          setSponsorData(sponsorInfo)
        }
        return
      }
      // أو نحمل من مستند العميل بواسطة clientId
      if (clientId && clientId > 0) {
        const clientsRef = collection(db, "Dealing_Clients")
        const q = query(clientsRef, where("ID", "==", clientId))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const clientDoc = snap.docs[0].data() as any
          if (clientDoc.PersonalSponsorID) {
            const employeesRef = collection(db, "Dealing_Employees")
            const empQuery = query(employeesRef, where("ID", "==", clientDoc.PersonalSponsorID))
            const empSnapshot = await getDocs(empQuery)
            if (!empSnapshot.empty) {
              const empData = empSnapshot.docs[0].data()
              const sponsorInfo: PersonalSponsorData = {
                id: empData.ID?.toString() || '',
                name: empData.Name || '',
                code: empData.Code?.toString() || '',
                mobile: empData.Mobile || ''
              }
              setSponsorCode(sponsorInfo.code)
              setSponsorData(sponsorInfo)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading personal sponsor (admin):', error)
    }
  }

  // تحميل الراعي الشخصي في وضع السلة
  const loadCartPersonalSponsor = async () => {
    if (!clientSession?.username) return

    try {
      // تحميل الراعي المحفوظ من localStorage أولاً
      const savedSponsorCode = localStorage.getItem('cartPersonalSponsorCode')
      const savedSponsorName = localStorage.getItem('cartPersonalSponsorName')
      const savedSponsorMobile = localStorage.getItem('cartPersonalSponsorMobile')
      
      if (savedSponsorCode && savedSponsorName) {
        setSponsorCode(savedSponsorCode)
        setSponsorData({
          id: savedSponsorCode,
          name: savedSponsorName,
          code: savedSponsorCode,
          mobile: savedSponsorMobile || ''
        })
        console.log('تم تحميل الراعي الشخصي المحفوظ:', savedSponsorName)
        return
      }

      // إذا لم يكن هناك راعي محفوظ، حمّل الراعي الأصلي للعميل
      const clientsRef = collection(db, "Dealing_Clients")
      const q = query(
        clientsRef,
        where("UserName", "==", clientSession.username),
        where("IsActive", "==", true)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0].data()
        
        if (clientDoc.PersonalSponsorID) {
          try {
            const employeesRef = collection(db, "Dealing_Employees")
            const empQuery = query(employeesRef, where("ID", "==", clientDoc.PersonalSponsorID))
            const empSnapshot = await getDocs(empQuery)
            if (!empSnapshot.empty) {
              const empData = empSnapshot.docs[0].data()
              const sponsorInfo: PersonalSponsorData = {
                id: empData.ID?.toString() || '',
                name: empData.Name || '',
                code: empData.Code?.toString() || '',
                mobile: empData.Mobile || ''
              }
              
              setSponsorCode(sponsorInfo.code)
              setSponsorData(sponsorInfo)
              console.log('تم تحميل الراعي الشخصي الأصلي للعميل:', sponsorInfo.name)
            }
          } catch (error) {
            console.error('Error loading personal sponsor:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error loading client data:', error)
    }
  }

  // تحميل الراعي الشخصي عند تحميل المكون
  useEffect(() => {
    if (mode === 'cart') {
      if (clientSession) loadPersonalSponsor()
    } else {
      loadPersonalSponsor()
    }
  }, [clientSession, mode, clientId, initialSponsorID, orderId])

  // دالة البحث عن الراعي الشخصي
  const searchPersonalSponsor = async (code: string) => {
    try {
      setIsSearching(true)
      if (!code.trim()) {
        setSponsorData(null)
        return
      }

      const employeesQuery = query(
        collection(db, 'Dealing_Employees'),
        where('Code', '==', parseInt(code)),
        where('IsActive', '==', true)
      )

      const querySnapshot = await getDocs(employeesQuery)
      
      if (!querySnapshot.empty) {
        const employeeDoc = querySnapshot.docs[0].data()
        const sponsorInfo: PersonalSponsorData = {
          id: employeeDoc.ID?.toString() || '',
          name: employeeDoc.Name || '',
          code: employeeDoc.Code?.toString() || '',
          mobile: employeeDoc.Mobile || ''
        }
        setSponsorData(sponsorInfo)
        console.log('تم العثور على الراعي الشخصي:', sponsorInfo.name)
      } else {
        setSponsorData(null)
        console.log('لم يتم العثور على راعي شخصي بهذا الكود')
      }
    } catch (error) {
      console.error('خطأ في البحث عن الراعي الشخصي:', error)
      setSponsorData(null)
    } finally {
      setIsSearching(false)
    }
  }

  // دالة للتحقق من صحة الراعي الشخصي المختار
  const isValidSponsor = () => {
    return sponsorCode.trim() !== '' && sponsorData && sponsorData.name
  }

  // دالة حفظ الراعي الشخصي
  const savePersonalSponsor = async () => {
    try {
      setIsSaving(true)
      if (!sponsorData) return

      if (mode === 'cart') {
        // حفظ بيانات الراعي الشخصي في localStorage
        localStorage.setItem('cartPersonalSponsorCode', sponsorData.code)
        localStorage.setItem('cartPersonalSponsorName', sponsorData.name)
        localStorage.setItem('cartPersonalSponsorMobile', sponsorData.mobile)
        localStorage.setItem('cartPersonalSponsorID', sponsorData.id)
        // تحديث الراعي الشخصي في جميع عناصر السلة في Firebase
        await updatePersonalSponsor(sponsorData)
      } else if (mode === 'order' && orderId) {
        // حفظ بيانات الراعي الشخصي في الطلب
        const orderRef = doc(db, 'Shop_Orders', orderId)
        await updateDoc(orderRef, {
          PersonalSponsorID: parseInt(sponsorData.id),
          PersonalSponsorCode: sponsorData.code,
          PersonalSponsorName: sponsorData.name,
          PersonalSponsorMobile: sponsorData.mobile
        })
      } else if (mode === 'admin') {
        if (!clientId) {
          notify.error('لا يوجد عميل محدد لحفظ الراعي')
          return
        }
        // حفظ الراعي مباشرة في مستند العميل
        const clientRef = doc(db, 'Dealing_Clients', String(clientId))
        await setDoc(clientRef, { PersonalSponsorID: Number(sponsorData.id) || 0 }, { merge: true })
      }
      
      console.log('تم حفظ الراعي الشخصي:', sponsorData.name)
      notify.success('تم حفظ الراعي الشخصي بنجاح')
      
      // إشعار المكون الأب بالتغيير
      if (onSponsorChange) {
        onSponsorChange(sponsorData)
      }
    } catch (error) {
      console.error('خطأ في حفظ الراعي الشخصي:', error)
      notify.error('حدث خطأ أثناء حفظ الراعي الشخصي')
    } finally {
      setIsSaving(false)
    }
  }

  // دالة إلغاء الراعي الشخصي
  const cancelPersonalSponsor = async () => {
    try {
      setIsSaving(true)
      
      setSponsorCode('')
      setSponsorData(null)
      
      if (mode === 'cart') {
        // حذف بيانات الراعي الشخصي من localStorage
        localStorage.removeItem('cartPersonalSponsorCode')
        localStorage.removeItem('cartPersonalSponsorName')
        localStorage.removeItem('cartPersonalSponsorMobile')
        localStorage.removeItem('cartPersonalSponsorID')
      } else if (mode === 'order' && orderId) {
        // حذف بيانات الراعي الشخصي من الطلب
        const orderRef = doc(db, 'Shop_Orders', orderId)
        await updateDoc(orderRef, {
          PersonalSponsorID: null,
          PersonalSponsorCode: null,
          PersonalSponsorName: null,
          PersonalSponsorMobile: null
        })
      } else if (mode === 'admin') {
        if (clientId) {
          const clientRef = doc(db, 'Dealing_Clients', String(clientId))
          await setDoc(clientRef, { PersonalSponsorID: null }, { merge: true })
        }
      }
      
      console.log('تم إلغاء الراعي الشخصي')
      notify.info('تم إلغاء الراعي الشخصي')
      
      // إشعار المكون الأب بالتغيير
      if (onSponsorChange) {
        onSponsorChange(null)
      }
    } catch (error) {
      console.error('خطأ في إلغاء الراعي الشخصي:', error)
      notify.error('حدث خطأ أثناء إلغاء الراعي الشخصي')
    } finally {
      setIsSaving(false)
    }
  }

  // دالة استعادة الراعي الشخصي الأصلي (للسلة فقط)
  const restoreOriginalSponsor = async () => {
    if (mode !== 'cart') return

    try {
      setIsSaving(true)
      
      // حذف البيانات المحفوظة أولاً
      localStorage.removeItem('cartPersonalSponsorCode')
      localStorage.removeItem('cartPersonalSponsorName')
      localStorage.removeItem('cartPersonalSponsorMobile')
      localStorage.removeItem('cartPersonalSponsorID')
      
      // تحميل الراعي الأصلي
      await loadCartPersonalSponsor()
      
      console.log('تم استعادة الراعي الشخصي الأصلي')
      notify.success('تم استعادة الراعي الشخصي الأصلي')
    } catch (error) {
      console.error('خطأ في استعادة الراعي الشخصي الأصلي:', error)
      notify.error('حدث خطأ أثناء استعادة الراعي الشخصي الأصلي')
    } finally {
      setIsSaving(false)
    }
  }

  // دالة الاتصال العادي
  const handleCall = (mobile: string) => {
    if (mobile) {
      window.open(`tel:${mobile}`, '_self')
    }
  }

  // دالة الواتس آب
  const handleWhatsApp = (mobile: string) => {
    if (mobile) {
      // تنظيف رقم الموبيل من المسافات والرموز
      const cleanMobile = mobile.replace(/\s+/g, '').replace(/[^\d]/g, '')
      // إضافة رمز مصر إذا لم يكن موجوداً
      const formattedMobile = cleanMobile.startsWith('20') ? cleanMobile : `20${cleanMobile}`
      
      // إنشاء رسالة ترحيبية
      const welcomeMessage = `مرحباً ${sponsorData?.name || 'السيد/ة'}،

أريد التواصل معك بخصوص طلبي الحالي.

أشكرك على خدمتك المتميزة.`

      // ترميز الرسالة للرابط
      const encodedMessage = encodeURIComponent(welcomeMessage)
      const whatsappUrl = `https://wa.me/${formattedMobile}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
    }
  }

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-center text-blue-800 flex items-center justify-center gap-2">
          <Users className="w-5 h-5" />
          الراعي الشخصي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* حقل إدخال كود الراعي الشخصي */}
        <div>
          <Label htmlFor="sponsorCode" className="text-sm font-medium text-gray-700">
            كود الراعي الشخصي
          </Label>
          <Input
            id="sponsorCode"
            type="number"
            placeholder={readOnly ? "كود الراعي الشخصي" : "أدخل كود الراعي الشخصي"}
            className={`mt-1 ${readOnly ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-blue-50 border-blue-300'}`}
            value={sponsorCode}
            readOnly={readOnly}
            onChange={(e) => {
              if (!readOnly) {
                setSponsorCode(e.target.value)
                // البحث التلقائي عند الكتابة
                if (e.target.value.trim()) {
                  searchPersonalSponsor(e.target.value)
                } else {
                  setSponsorData(null)
                }
              }
            }}
          />
        </div>
        
        {/* مؤشر البحث */}
        {isSearching && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-300">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">جاري البحث عن الراعي الشخصي...</span>
            </div>
          </div>
        )}

        {/* مؤشر تحميل الراعي الشخصي */}
        {isLoadingSponsor && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-300">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">
                {mode === 'order' ? 'جاري تحميل الراعي الشخصي من الطلب...' : 'جاري تحميل الراعي الشخصي...'}
              </span>
            </div>
          </div>
        )}
        
        {/* عرض بيانات الراعي الشخصي */}
        {sponsorData && !isSearching && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-300">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800 mb-2">
                  {sponsorData.name}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700">كود: {sponsorData.code}</span>
                  </div>
                  
                  {sponsorData.mobile && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700">{sponsorData.mobile}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCall(sponsorData.mobile)}
                          className="h-6 px-2 text-xs bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWhatsApp(sponsorData.mobile)}
                          className="h-6 px-2 text-xs bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-green-600 mt-2">مندوب مخصص لخدمتك</p>
              </div>
            </div>
          </div>
        )}
        
        {/* رسالة عدم وجود راعي شخصي */}
        {!sponsorData && sponsorCode && !isSearching && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-300">
            <div className="text-sm text-red-600">
              لم يتم العثور على راعي شخصي بهذا الكود
            </div>
          </div>
        )}
       
        {/* أزرار الإجراءات - مخفية في الوضع readOnly */}
        {!readOnly && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                onClick={cancelPersonalSponsor}
                disabled={isSaving}
              >
                <X className="w-4 h-4 ml-1" />
                إلغاء الراعي
              </Button>
              <Button
                size="sm"
                className={`flex-1 ${
                  isValidSponsor() 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={savePersonalSponsor}
                disabled={isSaving || !isValidSponsor()}
              >
                <Save className="w-4 h-4 ml-1" />
                حفظ الراعي
              </Button>
            </div>
            
            {/* زر استعادة الراعي الأصلي (للسلة فقط) */}
            {mode === 'cart' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                onClick={restoreOriginalSponsor}
                disabled={isSaving || isLoadingSponsor}
              >
                <Users className="w-4 h-4 ml-1" />
                استعادة الراعي الأصلي
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
