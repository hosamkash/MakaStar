'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft, 
  User, 
  Package, 
  Eye, 
  X, 
  Save, 
  Gift as GiftIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  CreditCard,
  CheckCircle,
  Clock,
  Truck,
  Home,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Edit,
  FileText,
  Users,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import { formatCurrencyEGP } from '@/lib/utils'
import OrderFinancialSummary from '@/components/order-financial-summary'
import { db } from '@/lib/firebase'
import { collection, doc, updateDoc, query, where, getDocs, deleteDoc, getDoc } from 'firebase/firestore'
import { OrdersService } from '@/lib/services/orders-service'
import { notify } from '@/lib/notifications'
import PersonalSponsor from '@/components/personal-sponsor'



export default function AdminOrderEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  
  const [orderData, setOrderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  
  // بيانات الطلب القابلة للتعديل
  const [orderStatus, setOrderStatus] = useState<number>(1)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerLatitude, setCustomerLatitude] = useState('')
  const [customerLongitude, setCustomerLongitude] = useState('')
  const [notes, setNotes] = useState('')
  
  // بيانات الراعي الشخصي
  const [personalSponsorData, setPersonalSponsorData] = useState<any>(null)
  
  // إدارة منتجات الهدايا
  const [giftProducts, setGiftProducts] = useState<any[]>([])
  const [isGiftsSaving, setIsGiftsSaving] = useState(false)
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false)
  const [giftSearchTerm, setGiftSearchTerm] = useState('')
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  
  // إدارة متابعات العميل
  const [customerFollowUps, setCustomerFollowUps] = useState<any[]>([])
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<any>(null)
  const [followUpForm, setFollowUpForm] = useState({
    method: 'phone',
    notes: '',
    customerResponse: '',
    orderStatus: orderStatus
  })
  
  // معلومات الموظف الحالي
  const [currentEmployee, setCurrentEmployee] = useState({
    name: 'غير محدد',
    code: '',
    id: ''
  })
  
  // عمولة المندوب
  const [salesCommission, setSalesCommission] = useState<number>(0)
  const [isCommissionCalculated, setIsCommissionCalculated] = useState<boolean>(false)



  useEffect(() => {
    if (orderId) {
      loadOrderDetails()
    }
    loadCurrentEmployee()
  }, [orderId])

  // مراقبة تغييرات جلسة الأدمن
  useEffect(() => {
    const handleStorageChange = () => {
      loadCurrentEmployee()
    }

    // مراقبة تغييرات sessionStorage
    window.addEventListener('storage', handleStorageChange)
    
    // مراقبة تغييرات sessionStorage في نفس التاب
    const interval = setInterval(() => {
      const adminSession = sessionStorage.getItem('admin_session')
      if (adminSession) {
        try {
          const sessionData = JSON.parse(adminSession)
          if (currentEmployee.id !== sessionData.id) {
            loadCurrentEmployee()
          }
        } catch (error) {
          console.error('خطأ في فحص الجلسة:', error)
        }
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [currentEmployee.id])

  const loadCurrentEmployee = async () => {
    try {
      // الحصول على معلومات الموظف الإداري من sessionStorage
      const adminSession = sessionStorage.getItem('admin_session')
      if (adminSession) {
        const sessionData = JSON.parse(adminSession)
        setCurrentEmployee({
          name: sessionData.name || 'غير محدد',
          code: sessionData.username || '',
          id: sessionData.id || ''
        })
        return
      }

      // إذا لم توجد جلسة إدارية، محاولة الحصول من localStorage كبديل
      const savedEmployee = localStorage.getItem('currentEmployee')
      if (savedEmployee) {
        const employeeData = JSON.parse(savedEmployee)
        setCurrentEmployee({
          name: employeeData.name || employeeData.Name || 'غير محدد',
          code: employeeData.code || employeeData.Code || '',
          id: employeeData.id || employeeData.ID || ''
        })
        return
      }

      console.log('لم يتم العثور على جلسة إدارية نشطة')
    } catch (error) {
      console.error('خطأ في تحميل معلومات الموظف:', error)
    }
  }

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true)
      if (!orderId) return

      const orderDetails = await OrdersService.getOrder(parseInt(orderId))
      if (orderDetails) {
        setOrderData(orderDetails)
        
        // تعيين البيانات القابلة للتعديل
        setOrderStatus(orderDetails.order.IDRequestStatus || 1)
        setCustomerName(orderDetails.order.CustomerName || '')
        setCustomerPhone(orderDetails.order.CustomerPhone || '')
        setCustomerEmail(orderDetails.order.CustomerEmail || '')
        setCustomerAddress(orderDetails.order.CustomerAddress || '')
        setCustomerLatitude(orderDetails.order.CustomerLatitude || '')
        setCustomerLongitude(orderDetails.order.CustomerLongitude || '')
        setNotes(orderDetails.order.Notes || '')
        
        // تحميل عمولة المندوب
        setSalesCommission(orderDetails.order.DefaultSalesCommission || 0)
        setIsCommissionCalculated(orderDetails.order.IsCommissionCalculated || false)
        
        // تحميل بيانات الراعي الشخصي إذا كان موجود
        if (orderDetails.order.PersonalSponsorID) {
          setPersonalSponsorData({
            id: orderDetails.order.PersonalSponsorID,
            code: orderDetails.order.PersonalSponsorCode,
            name: orderDetails.order.PersonalSponsorName,
            mobile: orderDetails.order.PersonalSponsorMobile
          })
        }
        
        // تحميل منتجات الهدايا إن وجدت
        setGiftProducts(orderDetails.order.giftProducts || [])
        
        // تحميل متابعات العميل إن وجدت
        setCustomerFollowUps(orderDetails.order.customerFollowUps || [])
      }
    } catch (error) {
      console.error('خطأ في تحميل تفاصيل الطلب:', error)
      notify.error('حدث خطأ في تحميل تفاصيل الطلب')
    } finally {
      setIsLoading(false)
    }
  }

  // فتح ديالوج اختيار الهدايا وتحميل المنتجات النشطة
  const openGiftDialog = async () => {
    try {
      setIsGiftDialogOpen(true)
      setIsLoadingProducts(true)
      const productsRef = collection(db, 'Def_ProductStructure')
      const qProducts = query(productsRef, where('IsActive', '==', true))
      const snap = await getDocs(qProducts)
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
      // ترتيب بسيط بالاسم
      list.sort((a, b) => (a?.Name || '').localeCompare(b?.Name || ''))
      setAvailableProducts(list)
    } catch (error) {
      console.error('خطأ في تحميل منتجات الهدايا:', error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // إضافة منتج هدية من عنصر منتج
  const addGiftFromProduct = async (product: any, qty: number = 1, price: number = 0) => {
    try {
      if (!orderId) return
      setIsGiftsSaving(true)

      const newGift = {
        IDProduct: product.IDProduct || product.ID || parseInt(product.id) || 0,
        Name: product.Name || `منتج ${product.id}`,
        Qty: qty,
        Price: price ?? product.ShopPrice ?? 0,
        TotalPrice: (price ?? product.ShopPrice ?? 0) * qty,
        ImageURL: product.ImageURL || '',
        BarCode: product.BarCode || ''
      }

      const newGiftsArray = [...giftProducts, newGift]
      const orderRef = doc(db, 'Shop_Orders', orderId)
      await updateDoc(orderRef, { giftProducts: newGiftsArray })
      setGiftProducts(newGiftsArray)
      notify.success('تم إضافة الهدية للطلب')
    } catch (error) {
      console.error('خطأ في إضافة هدية:', error)
      notify.error('حدث خطأ أثناء إضافة الهدية')
    } finally {
      setIsGiftsSaving(false)
    }
  }

  // حذف منتج هدية
  const removeGiftProduct = async (index: number) => {
    try {
      if (!orderId) return
      setIsGiftsSaving(true)
      const newGiftsArray = giftProducts.filter((_, i) => i !== index)
      const orderRef = doc(db, 'Shop_Orders', orderId)
      await updateDoc(orderRef, { giftProducts: newGiftsArray })
      setGiftProducts(newGiftsArray)
      notify.success('تم حذف الهدية')
    } catch (error) {
      console.error('خطأ في حذف الهدية:', error)
      notify.error('حدث خطأ أثناء حذف الهدية')
    } finally {
      setIsGiftsSaving(false)
    }
  }


  // دالة الحصول على بيانات حالة الطلب
  const getOrderStatusData = (status: number) => {
    const statuses = [
      { id: 1, name: 'تم تأكيد الطلب', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: CheckCircle, description: 'تم تأكيد طلبك بنجاح' },
      { id: 2, name: 'جاري التجهيز', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', icon: Clock, description: 'تجهيز المنتجات' },
      { id: 3, name: 'تم الشحن', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: Truck, description: 'الطلب في الطريق إليك' },
      { id: 4, name: 'تم التوصيل', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: Home, description: 'تم استلام الطلب' },
      { id: 5, name: 'مرفوض من العميل', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: X, description: 'تم رفض الطلب من العميل' },
      { id: 6, name: 'ملغي', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: X, description: 'تم إلغاء الطلب' }
    ]
    const result = statuses.find(s => s.id === status) || statuses[0]
    // التأكد من وجود الأيقونة
    if (!result.icon) {
      result.icon = X // استخدام أيقونة X كأيقونة افتراضية
    }
    return result
  }



  // دالة الحصول على جميع حالات التتبع
  const getOrderTrackingSteps = () => {
    const currentStatus = orderStatus
    
    // إذا كانت الحالة ملغية أو مرفوضة، لا نعرض خطوات التتبع
    if (currentStatus === 5 || currentStatus === 6) {
      return []
    }
    
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

  // دالة للحصول على آخر حالة نشطة للطلب
  const getLastActiveStatus = () => {
    if (orderData?.order?.DeliveredDate) return { status: 'تم التوصيل', date: orderData.order.DeliveredDate }
    if (orderData?.order?.ShippedDate) return { status: 'تم الشحن', date: orderData.order.ShippedDate }
    if (orderData?.order?.ProcessingDate) return { status: 'جاري التجهيز', date: orderData.order.ProcessingDate }
    if (orderData?.order?.ConfirmedDate) return { status: 'تم التأكيد', date: orderData.order.ConfirmedDate }
    return null
  }

  // دوال إدارة متابعات العميل
  const getFollowUpMethodIcon = (method: string) => {
    switch (method) {
      case 'phone':
        return <Phone className="h-4 w-4 text-blue-600" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case 'email':
        return <Mail className="h-4 w-4 text-red-600" />
      default:
        return <Phone className="h-4 w-4 text-gray-600" />
    }
  }

  const getFollowUpMethodName = (method: string) => {
    switch (method) {
      case 'phone':
        return 'اتصال هاتفي'
      case 'whatsapp':
        return 'واتساب'
      case 'sms':
        return 'رسالة نصية'
      case 'email':
        return 'بريد إلكتروني'
      default:
        return 'غير محدد'
    }
  }

  const addFollowUp = async () => {
    try {
      if (customerFollowUps.length >= 3) {
        notify.error('لا يمكن إضافة أكثر من 3 متابعات')
        return
      }

      const now = new Date()
      const formattedDate = now.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const formattedTime = now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      const newFollowUp = {
        id: Date.now().toString(),
        followUpDate: now.toISOString(),
        formattedDate: formattedDate,
        formattedTime: formattedTime,
        method: followUpForm.method,
        notes: followUpForm.notes,
        customerResponse: followUpForm.customerResponse,
        orderStatus: followUpForm.orderStatus,
        employeeName: currentEmployee.name,
        employeeCode: currentEmployee.code,
        employeeId: currentEmployee.id,
        createdBy: {
          name: currentEmployee.name,
          code: currentEmployee.code,
          id: currentEmployee.id,
          date: formattedDate,
          time: formattedTime,
          timestamp: now.toISOString()
        }
      }

      const updatedFollowUps = [...customerFollowUps, newFollowUp]
      setCustomerFollowUps(updatedFollowUps)
      
      // حفظ المتابعة مباشرة في Firebase
      if (orderId) {
        const orderRef = doc(db, 'Shop_Orders', orderId)
        await updateDoc(orderRef, { customerFollowUps: updatedFollowUps })
      }
      
      // تحديث حالة الطلب إذا تم تغييرها
      if (followUpForm.orderStatus !== orderStatus) {
        setOrderStatus(followUpForm.orderStatus)
        // حفظ حالة الطلب المحدثة أيضاً
        if (orderId) {
          const orderRef = doc(db, 'Shop_Orders', orderId)
          await updateDoc(orderRef, { IDRequestStatus: followUpForm.orderStatus })
        }
      }

      // إعادة تعيين النموذج
      setFollowUpForm({
        method: 'phone',
        notes: '',
        customerResponse: '',
        orderStatus: orderStatus
      })

      setShowFollowUpDialog(false)
      notify.success('تم إضافة المتابعة بنجاح')
    } catch (error) {
      console.error('خطأ في إضافة المتابعة:', error)
      notify.error('حدث خطأ في إضافة المتابعة')
    }
  }

  const editFollowUp = (followUpId: string) => {
    const followUp = customerFollowUps.find(f => f.id === followUpId)
    if (followUp) {
      setEditingFollowUp(followUp)
      setFollowUpForm({
        method: followUp.method,
        notes: followUp.notes,
        customerResponse: followUp.customerResponse,
        orderStatus: followUp.orderStatus
      })
      setShowFollowUpDialog(true)
    }
  }

  const updateFollowUp = async () => {
    try {
      if (!editingFollowUp) return

      const now = new Date()
      const formattedDate = now.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const formattedTime = now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      const updatedFollowUps = customerFollowUps.map(f => 
        f.id === editingFollowUp.id 
          ? {
              ...f,
              method: followUpForm.method,
              notes: followUpForm.notes,
              customerResponse: followUpForm.customerResponse,
              orderStatus: followUpForm.orderStatus,
              // تحديث معلومات الموظف والتاريخ
              employeeName: currentEmployee.name,
              employeeCode: currentEmployee.code,
              employeeId: currentEmployee.id,
              updatedBy: {
                name: currentEmployee.name,
                code: currentEmployee.code,
                id: currentEmployee.id,
                date: formattedDate,
                time: formattedTime,
                timestamp: now.toISOString()
              }
            }
          : f
      )

      setCustomerFollowUps(updatedFollowUps)
      
      // حفظ التحديثات مباشرة في Firebase
      if (orderId) {
        const orderRef = doc(db, 'Shop_Orders', orderId)
        await updateDoc(orderRef, { customerFollowUps: updatedFollowUps })
      }
      
      // تحديث حالة الطلب إذا تم تغييرها
      if (followUpForm.orderStatus !== orderStatus) {
        setOrderStatus(followUpForm.orderStatus)
        // حفظ حالة الطلب المحدثة أيضاً
        if (orderId) {
          const orderRef = doc(db, 'Shop_Orders', orderId)
          await updateDoc(orderRef, { IDRequestStatus: followUpForm.orderStatus })
        }
      }

      setEditingFollowUp(null)
      setShowFollowUpDialog(false)
      setFollowUpForm({
        method: 'phone',
        notes: '',
        customerResponse: '',
        orderStatus: orderStatus
      })

      notify.success('تم تحديث المتابعة بنجاح')
    } catch (error) {
      console.error('خطأ في تحديث المتابعة:', error)
      notify.error('حدث خطأ في تحديث المتابعة')
    }
  }

  const deleteFollowUp = async (followUpId: string) => {
    try {
      if (confirm('هل أنت متأكد من حذف هذه المتابعة؟')) {
        const updatedFollowUps = customerFollowUps.filter(f => f.id !== followUpId)
        setCustomerFollowUps(updatedFollowUps)
        
        // حفظ الحذف مباشرة في Firebase
        if (orderId) {
          const orderRef = doc(db, 'Shop_Orders', orderId)
          await updateDoc(orderRef, { customerFollowUps: updatedFollowUps })
        }
        
        notify.success('تم حذف المتابعة بنجاح')
      }
    } catch (error) {
      console.error('خطأ في حذف المتابعة:', error)
      notify.error('حدث خطأ في حذف المتابعة')
    }
  }

  // دالة حفظ التعديلات
  const saveChanges = async () => {
    try {
      setIsSaving(true)
      if (!orderId) return

      const orderRef = doc(db, 'Shop_Orders', orderId)
      const updateData: any = {
        IDRequestStatus: orderStatus,
        CustomerName: customerName,
        CustomerPhone: customerPhone,
        CustomerEmail: customerEmail,
        CustomerAddress: customerAddress,
        CustomerLatitude: customerLatitude,
        CustomerLongitude: customerLongitude,
        Notes: notes,
        customerFollowUps: customerFollowUps // حفظ متابعات العميل
      }


      // إضافة تواريخ التحديث حسب الحالة
      const now = new Date().toISOString()
      if (orderStatus === 1 && !orderData.order.ConfirmedDate) {
        updateData.ConfirmedDate = now
      }
      if (orderStatus === 2 && !orderData.order.ProcessingDate) {
        updateData.ProcessingDate = now
      }
      if (orderStatus === 3 && !orderData.order.ShippedDate) {
        updateData.ShippedDate = now
      }
      if (orderStatus === 4 && !orderData.order.DeliveredDate) {
        updateData.DeliveredDate = now
      }

      await updateDoc(orderRef, updateData)
      
      notify.success('تم حفظ التعديلات بنجاح')
      await loadOrderDetails() // إعادة تحميل البيانات
    } catch (error) {
      console.error('خطأ في حفظ التعديلات:', error)
      notify.error('حدث خطأ في حفظ التعديلات')
    } finally {
      setIsSaving(false)
    }
  }

  // دالة تحديث كمية منتج في الطلب
  const updateProductQuantity = async (productID: number, newQuantity: number) => {
    try {
      if (!orderId) return
      
      setIsSaving(true)
      await OrdersService.updateOrderItemQuantity(orderId, productID, newQuantity)
      
      // إعادة تحميل بيانات الطلب
      await loadOrderDetails()
      
      notify.success('تم تحديث كمية المنتج بنجاح')
    } catch (error) {
      console.error('خطأ في تحديث كمية المنتج:', error)
      notify.error('حدث خطأ في تحديث كمية المنتج')
    } finally {
      setIsSaving(false)
    }
  }

  // دالة تحديث حالة حساب العمولة
  const updateCommissionStatus = async (isCalculated: boolean) => {
    try {
      if (!orderId) return
      setIsSaving(true)
      
      const orderRef = doc(db, 'Shop_Orders', orderId)
      await updateDoc(orderRef, {
        IsCommissionCalculated: isCalculated,
        updatedAt: new Date().toISOString()
      })
      
      setIsCommissionCalculated(isCalculated)
      notify.success(isCalculated ? 'تم تأكيد حساب العمولة' : 'تم إلغاء تأكيد حساب العمولة')
    } catch (error) {
      console.error('خطأ في تحديث حالة العمولة:', error)
      notify.error('حدث خطأ في تحديث حالة العمولة')
    } finally {
      setIsSaving(false)
    }
  }

  // دالة حذف الطلب
  const deleteOrder = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return
    }

    try {
      setIsSaving(true)
      if (!orderId) return

      const orderRef = doc(db, 'Shop_Orders', orderId)
      await deleteDoc(orderRef)
      
      notify.success('تم حذف الطلب بنجاح')
      router.push('/admin/shop_manag/orders')
    } catch (error) {
      console.error('خطأ في حذف الطلب:', error)
      notify.error('حدث خطأ في حذف الطلب')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير محدد"
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG')
  }

  // دالة تحويل حالة الطلب إلى نص مقروء
  const getOrderStatusText = (status: number) => {
    switch (status) {
      case 1: return 'تم التأكيد'
      case 2: return 'جاري التجهيز'
      case 3: return 'تم الشحن'
      case 4: return 'تم التوصيل'
      case 5: return 'مرفوض من العميل'
      case 6: return 'ملغي'
      default: return 'غير محدد'
    }
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
          <Button onClick={() => router.push('/admin/shop_manag/orders')}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة للطلبات
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/shop_manag/orders')}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">العودة للطلبات</span>
                <span className="sm:hidden">رجوع</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">تعديل الطلب #{orderData.order.Code}</h1>
                <p className="text-sm sm:text-base text-gray-600">تعديل تفاصيل الطلب وحالته</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={deleteOrder}
                className="text-red-600 hover:text-red-700 text-sm"
                disabled={isSaving}
                size="sm"
              >
                <X className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">حذف الطلب</span>
                <span className="sm:hidden">حذف</span>
              </Button>
              <Button 
                onClick={saveChanges}
                disabled={isSaving}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </div>
        </div>

        {/* التابات */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 lg:mb-8 gap-2">
            <TabsTrigger value="details" className="flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-2">
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">تفاصيل الطلب</span>
              <span className="sm:hidden">التفاصيل</span>
            </TabsTrigger>
            <TabsTrigger value="representative" className="flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-2">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">معلومات المندوب</span>
              <span className="sm:hidden">المندوب</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-2">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">تتبع الطلب</span>
              <span className="sm:hidden">التتبع</span>
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-2">
              <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">متابعة العميل</span>
              <span className="sm:hidden">العميل</span>
            </TabsTrigger>
          </TabsList>

          {/* تاب تفاصيل الطلب */}
          <TabsContent value="details" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* العمود الأيسر - معلومات الطلب */}
              <div className="lg:col-span-2 space-y-6">
                {/* معلومات الطلب الأساسية */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      معلومات الطلب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label>رقم الطلب</Label>
                        <Input value={orderData.order.Code} disabled />
                      </div>
                      <div>
                        <Label>تاريخ الطلب</Label>
                        <Input value={formatDate(orderData.order.CreatedDate)} disabled />
                      </div>
                      <div>
                        <Label>حالة الطلب</Label>
                        <Select value={orderStatus.toString()} onValueChange={(value) => setOrderStatus(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">تم تأكيد الطلب</SelectItem>
                            <SelectItem value="2">جاري التجهيز</SelectItem>
                            <SelectItem value="3">تم الشحن</SelectItem>
                            <SelectItem value="4">تم التوصيل</SelectItem>
                            <SelectItem value="5">مرفوض من العميل</SelectItem>
                            <SelectItem value="6">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>إجمالي القيمة</Label>
                        <Input value={formatCurrencyEGP(orderData.order.TotalValue)} disabled />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* معلومات العميل */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      معلومات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    
                    {/* المعلومات الأساسية - قابلة للتعديل */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        المعلومات الأساسية (قابلة للتعديل)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label>اسم العميل</Label>
                          <Input 
                            value={customerName} 
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="اسم العميل"
                          />
                        </div>
                        <div>
                          <Label>رقم الهاتف</Label>
                          <Input 
                            value={customerPhone} 
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="رقم الهاتف"
                          />
                        </div>
                        <div>
                          <Label>البريد الإلكتروني</Label>
                          <Input 
                            value={customerEmail} 
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="البريد الإلكتروني"
                            type="email"
                          />
                        </div>
                        <div>
                          <Label>العنوان</Label>
                          <Input 
                            value={customerAddress} 
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            placeholder="عنوان العميل"
                          />
                        </div>
                        <div>
                          <Label>خط العرض (Latitude)</Label>
                          <Input 
                            value={customerLatitude} 
                            onChange={(e) => setCustomerLatitude(e.target.value)}
                            placeholder="مثال: 30.0444"
                            type="number"
                            step="any"
                          />
                        </div>
                        <div>
                          <Label>خط الطول (Longitude)</Label>
                          <Input 
                            value={customerLongitude} 
                            onChange={(e) => setCustomerLongitude(e.target.value)}
                            placeholder="مثال: 31.2357"
                            type="number"
                            step="any"
                          />
                        </div>
                      </div>
                      
                      {/* أزرار الموقع */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  setCustomerLatitude(position.coords.latitude.toString())
                                  setCustomerLongitude(position.coords.longitude.toString())
                                  notify.success('تم الحصول على الموقع الحالي')
                                },
                                (error) => {
                                  console.error('خطأ في الحصول على الموقع:', error)
                                  notify.error('فشل في الحصول على الموقع الحالي')
                                }
                              )
                            } else {
                              notify.error('المتصفح لا يدعم تحديد الموقع')
                            }
                          }}
                          className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <MapPin className="w-4 h-4" />
                          الحصول على الموقع الحالي
                        </Button>
                        
                        {customerLatitude && customerLongitude && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const googleMapsUrl = `https://www.google.com/maps?q=${customerLatitude},${customerLongitude}`
                              window.open(googleMapsUrl, '_blank')
                            }}
                            className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <MapPin className="w-4 h-4" />
                            فتح على خرائط جوجل
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* معلومات الطلب - للقراءة فقط */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        معلومات الطلب
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">رقم الطلب</Label>
                          <Input value={orderData.order.Code || 'غير محدد'} disabled className="bg-gray-50" />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">تاريخ الطلب</Label>
                          <Input value={formatDate(orderData.order.CreatedDate)} disabled className="bg-gray-50" />
                        </div>
                       
                        {personalSponsorData && (
                          <div>
                            <Label className="text-xs text-gray-600">الراعي الشخصي</Label>
                            <Input value={`${personalSponsorData.name} (${personalSponsorData.code})`} disabled className="bg-green-50 border-green-200" />
                          </div>
                        )}
                        <div>
                          <Label className="text-xs text-gray-600">ملاحظات</Label>
                          <Textarea 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="ملاحظات إضافية"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
 
                    

                  </CardContent>
                </Card>

                {/* المنتجات */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      المنتجات ({orderData.details?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {orderData.details?.map((product: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            {/* صورة المنتج */}
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 border">
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
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm sm:text-base mb-2">{product.Name || product.ProductName || 'منتج غير محدد'}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">الكمية:</span>
                                  <Badge variant="outline" className="text-xs">{product.Qty || product.Quantity || 0}</Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">السعر:</span>
                                  <Badge variant="outline" className="text-xs">{formatCurrencyEGP(product.SalesPrice || product.Price || 0)}</Badge>
                                </div>
                                {product.BarCode && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">الباركود:</span>
                                    <Badge variant="outline" className="text-xs font-mono">{product.BarCode}</Badge>
                                  </div>
                                )}
                                {product.IDProduct && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">رقم المنتج:</span>
                                    <Badge variant="outline" className="text-xs">#{product.IDProduct}</Badge>
                                  </div>
                                )}
                              </div>
                              {(product.DiscountValue && product.DiscountValue > 0) && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-xs">
                                  <span className="font-medium">الخصم:</span> {formatCurrencyEGP(product.DiscountValue)}
                                </div>
                              )}
                            </div>
                            
                            {/* السعر الإجمالي */}
                            <div className="text-left sm:text-right">
                              <p className="font-bold text-base sm:text-lg text-blue-600">
                                {formatCurrencyEGP((product.SalesPrice || product.Price || 0) * (product.Qty || product.Quantity || 0))}
                              </p>
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

                {/* ملاحظات */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">ملاحظات الطلب</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أضف ملاحظات للطلب..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* العمود الأيمن - الملخص المالي */}
              <div className="space-y-6">
                <OrderFinancialSummary 
                  order={orderData.order} 
                  showCheckoutButton={false}
                  showAddMoreButton={false}
                  showProfit={true}
                />
                
                {/* عمولة المندوب */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      عمولة المندوب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">العمولة</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrencyEGP(salesCommission)}
                        </p>
                      </div>
                    </div>
                    
                    {salesCommission > 0 ? (
                      <div className="p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs text-green-800 font-medium">
                          ✓ عمولة محددة
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-800 font-medium">
                          ⚠ لا توجد عمولة
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* منتجات الطلب - مثال على تعديل الكمية */}
                {orderData?.orderDetails && orderData.orderDetails.length > 0 && (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="h-4 w-4 text-green-600" />
                        منتجات الطلب
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {orderData.orderDetails.map((product: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{product.Name}</p>
                            <p className="text-xs text-gray-500">الكمية: {product.Qty}</p>
                            {product.DefaultSalesCommission && (
                              <p className="text-xs text-blue-600">
                                عمولة: {formatCurrencyEGP(product.DefaultSalesCommission * product.Qty)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProductQuantity(product.IDProduct, Math.max(1, product.Qty - 1))}
                              disabled={isSaving}
                            >
                              -
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{product.Qty}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProductQuantity(product.IDProduct, product.Qty + 1)}
                              disabled={isSaving}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* تاب معلومات المندوب والهدايا */}
          <TabsContent value="representative" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">

              {/* مكون الراعي الشخصي */}
              <PersonalSponsor 
                mode="order"
                orderId={orderId || ''}
                onSponsorChange={(sponsor) => {
                  setPersonalSponsorData(sponsor)
                }}
                className="h-fit"
              />

              {/* عمولة المندوب */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    عمولة المندوب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">العمولة المحددة</p>
                        <p className="text-xs text-gray-500">من بيانات الطلب</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrencyEGP(salesCommission)}
                      </p>
                      <p className="text-xs text-gray-500">جنيه مصري</p>
                    </div>
                  </div>
                  
                  {salesCommission > 0 ? (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ تم تحديد عمولة المندوب لهذا الطلب
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        العمولة: {formatCurrencyEGP(salesCommission)}
                      </p>
                      
                      {/* Switch لحالة حساب العمولة */}
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              تم حساب العمولة وقبضها
                            </span>
                          </div>
                          <Switch
                            checked={isCommissionCalculated}
                            onCheckedChange={updateCommissionStatus}
                            disabled={isSaving}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          {isCommissionCalculated ? 'تم تأكيد حساب العمولة' : 'لم يتم حساب العمولة بعد'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠ لا توجد عمولة محددة
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        لم يتم تحديد عمولة للمندوب في هذا الطلب
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* منتجات الهدايا */}
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-lg text-gray-900">
                    <span className="flex items-center gap-2">
                      <GiftIcon className="w-5 h-5 text-yellow-600" />
                      منتجات الهدايا
                    </span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {giftProducts?.length || 0} منتج
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button 
                      onClick={openGiftDialog} 
                      className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة هدايا
                    </Button>
                  </div>

                  {giftProducts && giftProducts.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {giftProducts.map((gift, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-300 shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border">
                            {gift.ImageURL ? (
                              <img 
                                src={gift.ImageURL} 
                                alt={gift.Name} 
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.jpg'
                                }}
                              />
                            ) : (
                              <GiftIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-gray-900 mb-1 truncate">{gift.Name}</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <span className="font-medium">الكمية:</span>
                                <Badge variant="outline" className="text-xs">{gift.Qty}</Badge>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="font-medium">السعر:</span>
                                <Badge variant="outline" className="text-xs">{formatCurrencyEGP(gift.Price)}</Badge>
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeGiftProduct(index)}
                              disabled={isGiftsSaving}
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <GiftIcon className="w-8 h-8 text-yellow-500" />
                      </div>
                      <p className="text-sm font-medium mb-2">لا توجد منتجات هدايا مضافة</p>
                      <p className="text-xs text-gray-400">اضغط على زر "إضافة هدايا" لإضافة منتجات هدايا للطلب</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* تاب تتبع الطلب */}
          <TabsContent value="tracking" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* تتبع الطلب */}
              <Card>
                <CardHeader>
                  <CardTitle>تتبع الطلب</CardTitle>
                </CardHeader>
                <CardContent>
                  {getOrderTrackingSteps().length > 0 ? (
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
                  ) : (
                    <div className="text-center py-8">
                      {orderStatus === 5 ? (
                        <div className="space-y-3">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <X className="w-8 h-8 text-red-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-red-700">الطلب مرفوض</h4>
                          <p className="text-sm text-gray-600">تم رفض هذا الطلب من العميل</p>
                        </div>
                      ) : orderStatus === 6 ? (
                        <div className="space-y-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <X className="w-8 h-8 text-gray-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-700">الطلب ملغي</h4>
                          <p className="text-sm text-gray-600">تم إلغاء هذا الطلب</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">لا توجد خطوات تتبع متاحة</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* تحديث حالة الطلب */}
              <Card>
                <CardHeader>
                  <CardTitle>تحديث حالة الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الحالة الحالية</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const statusData = getOrderStatusData(orderStatus)
                          const Icon = statusData.icon
                          return (
                            <>
                              <Icon className={`h-5 w-5 ${statusData.color}`} />
                              <span className={`font-medium ${statusData.color}`}>
                                {statusData.name}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>تغيير الحالة</Label>
                    <Select value={orderStatus.toString()} onValueChange={(value) => setOrderStatus(parseInt(value))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">تم تأكيد الطلب</SelectItem>
                        <SelectItem value="2">جاري التجهيز</SelectItem>
                        <SelectItem value="3">تم الشحن</SelectItem>
                        <SelectItem value="4">تم التوصيل</SelectItem>
                        <SelectItem value="5">مرفوض من العميل</SelectItem>
                        <SelectItem value="6">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={saveChanges}
                      disabled={isSaving}
                      className="w-full flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* تاب متابعة العميل */}
          <TabsContent value="customer" className="space-y-4 sm:space-y-6">
            <div className="space-y-6">
              {/* معلومات الموظف الحالي */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">الموظف المسؤول</h4>
                      <p className="text-sm text-blue-700">
                        {currentEmployee.name}
                        {currentEmployee.code && ` (${currentEmployee.code})`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* عرض المتابعات الموجودة */}
              {customerFollowUps.map((followUp, index) => (
                <Card key={followUp.id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg text-blue-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        المتابعة {index + 1}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editFollowUp(followUp.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4 ml-2" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteFollowUp(followUp.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">تاريخ المتابعة</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {followUp.formattedDate || formatDate(followUp.followUpDate)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">ساعة المتابعة</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {followUp.formattedTime || new Date(followUp.followUpDate).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">طريقة المتابعة</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {getFollowUpMethodIcon(followUp.method)}
                          <span className="text-sm text-gray-900">{getFollowUpMethodName(followUp.method)}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">الموظف المسؤول</Label>
                        <div className="mt-1">
                          <p className="text-sm text-gray-900 font-medium">{followUp.employeeName || 'غير محدد'}</p>
                          {followUp.employeeCode && (
                            <p className="text-xs text-gray-500">كود الموظف: {followUp.employeeCode}</p>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">ملاحظات المتابعة</Label>
                        <p className="text-sm text-gray-900 mt-1">{followUp.notes || 'لا توجد ملاحظات'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">رد العميل</Label>
                        <p className="text-sm text-gray-900 mt-1">{followUp.customerResponse || 'لا يوجد رد'}</p>
                      </div>
                      
                      {/* معلومات إضافية عن منشئ المتابعة */}
                      {followUp.createdBy && (
                        <div className="md:col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <Label className="text-sm font-medium text-blue-700">معلومات إنشاء المتابعة</Label>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-blue-600">
                              <span className="font-medium">أنشأها:</span> {followUp.createdBy.name}
                              {followUp.createdBy.code && ` (${followUp.createdBy.code})`}
                            </p>
                            <p className="text-xs text-blue-600">
                              <span className="font-medium">التاريخ:</span> {followUp.createdBy.date}
                            </p>
                            <p className="text-xs text-blue-600">
                              <span className="font-medium">الوقت:</span> {followUp.createdBy.time}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* معلومات إضافية عن محدث المتابعة */}
                      {followUp.updatedBy && (
                        <div className="md:col-span-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <Label className="text-sm font-medium text-green-700">معلومات آخر تحديث</Label>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-green-600">
                              <span className="font-medium">حدثها:</span> {followUp.updatedBy.name}
                              {followUp.updatedBy.code && ` (${followUp.updatedBy.code})`}
                            </p>
                            <p className="text-xs text-green-600">
                              <span className="font-medium">التاريخ:</span> {followUp.updatedBy.date}
                            </p>
                            <p className="text-xs text-green-600">
                              <span className="font-medium">الوقت:</span> {followUp.updatedBy.time}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* زر إضافة متابعة جديدة */}
              {customerFollowUps.length < 3 && (
                <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                  <CardContent className="py-8">
                    <div className="text-center">
                      <Button
                        onClick={() => setShowFollowUpDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة متابعة جديدة
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        يمكنك إضافة متابعة جديدة للعميل (الحد الأقصى: 3 متابعات)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* رسالة عند الوصول للحد الأقصى */}
              {customerFollowUps.length >= 3 && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm font-medium">تم الوصول للحد الأقصى من المتابعات (3 متابعات)</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ديالوج إنشاء/تعديل متابعة العميل */}
      <Dialog open={showFollowUpDialog} onOpenChange={(open) => setShowFollowUpDialog(open)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingFollowUp ? 'تعديل المتابعة' : 'إضافة متابعة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* العمود الأيسر */}
            <div className="space-y-4">
              {/* طريقة المتابعة */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">طريقة المتابعة</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={followUpForm.method === 'phone' ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, method: 'phone' }))}
                    className="flex items-center gap-2 h-10 text-sm"
                  >
                    <Phone className="h-4 w-4" />
                    اتصال هاتفي
                  </Button>
                  <Button
                    variant={followUpForm.method === 'whatsapp' ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, method: 'whatsapp' }))}
                    className="flex items-center gap-2 h-10 text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    واتساب
                  </Button>
                  <Button
                    variant={followUpForm.method === 'sms' ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, method: 'sms' }))}
                    className="flex items-center gap-2 h-10 text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    رسالة نصية
                  </Button>
                  <Button
                    variant={followUpForm.method === 'email' ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, method: 'email' }))}
                    className="flex items-center gap-2 h-10 text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    بريد إلكتروني
                  </Button>
                </div>
              </div>

              {/* ملاحظات المتابعة */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">ملاحظات المتابعة</Label>
                <Textarea
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ملاحظات المتابعة"
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* رد العميل */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">رد العميل</Label>
                <Textarea
                  value={followUpForm.customerResponse}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, customerResponse: e.target.value }))}
                  placeholder="رد العميل"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            {/* العمود الأيمن */}
            <div className="space-y-4">
              {/* تحديث حالة الطلب */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">تحديث حالة الطلب</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={followUpForm.orderStatus === 1 ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, orderStatus: 1 }))}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    تأكيد الطلب
                  </Button>
                  <Button
                    variant={followUpForm.orderStatus === 2 ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, orderStatus: 2 }))}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    قيد التجهيز
                  </Button>
                  <Button
                    variant={followUpForm.orderStatus === 3 ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, orderStatus: 3 }))}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    تم الشحن
                  </Button>
                  <Button
                    variant={followUpForm.orderStatus === 4 ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, orderStatus: 4 }))}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    تم التوصيل
                  </Button>
                  <Button
                    variant={followUpForm.orderStatus === 5 ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, orderStatus: 5 }))}
                    size="sm"
                    className="h-8 text-xs text-red-600 border-red-600 hover:bg-red-50"
                  >
                    رفض الطلب
                  </Button>
                  <Button
                    variant={followUpForm.orderStatus === 6 ? 'default' : 'outline'}
                    onClick={() => setFollowUpForm(prev => ({ ...prev, orderStatus: 6 }))}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    إلغاء الطلب
                  </Button>
                </div>
              </div>
            </div>

            {/* أزرار الحفظ */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFollowUpDialog(false)
                  setEditingFollowUp(null)
                  setFollowUpForm({
                    method: 'phone',
                    notes: '',
                    customerResponse: '',
                    orderStatus: orderStatus
                  })
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={editingFollowUp ? updateFollowUp : addFollowUp}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 ml-2" />
                {editingFollowUp ? 'تحديث المتابعة' : 'حفظ المتابعة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ديالوج اختيار الهدايا */}
      <Dialog open={isGiftDialogOpen} onOpenChange={(open) => setIsGiftDialogOpen(open)}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>اختيار منتجات الهدايا</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* شريط البحث */}
            <div className="flex-shrink-0">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="بحث باسم المنتج أو الباركود أو الرقم..."
                  value={giftSearchTerm}
                  onChange={(e) => setGiftSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            {/* قائمة المنتجات - قابلة للتمرير */}
            <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
              {isLoadingProducts ? (
                <div className="p-4 text-center text-gray-500">جاري تحميل المنتجات...</div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="divide-y">
                    {availableProducts
                      .filter(p => {
                        if (!giftSearchTerm.trim()) return true
                        const s = giftSearchTerm.toLowerCase()
                        return (
                          (p.Name || '').toLowerCase().includes(s) ||
                          String(p.BarCode || '').includes(giftSearchTerm) ||
                          String(p.IDProduct || p.ID || p.id || '').includes(giftSearchTerm)
                        )
                      })
                      .map((p, idx) => (
                        <div key={idx} className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                          {/* صورة المنتج */}
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {p.ImageURL ? (
                              <img src={p.ImageURL} alt={p.Name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          
                          {/* معلومات المنتج */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{p.Name}</div>
                            <div className="text-xs text-gray-500">#{p.IDProduct || p.ID || p.id} • {p.BarCode || 'بدون باركود'}</div>
                          </div>
                          
                          {/* حقول الإدخال والأزرار */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">الكمية</label>
                              <Input
                                type="number"
                                defaultValue={1}
                                min={1}
                                className="w-16 h-8 text-sm"
                                onChange={(e) => {
                                  (p as any).__giftQty = parseInt(e.target.value) || 1
                                }}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">السعر</label>
                              <Input
                                type="number"
                                defaultValue={p.ShopPrice || 0}
                                step="0.01"
                                className="w-20 h-8 text-sm"
                                onChange={(e) => {
                                  (p as any).__giftPrice = parseFloat(e.target.value) || 0
                                }}
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addGiftFromProduct(p, (p as any).__giftQty || 1, (p as any).__giftPrice || p.ShopPrice || 0)}
                              className="flex items-center gap-1 h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="w-3 h-3" />
                              إضافة
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex-shrink-0 flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setIsGiftDialogOpen(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
