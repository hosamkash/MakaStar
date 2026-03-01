"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Calendar,
  Package,
  DollarSign,
  User
} from "lucide-react"
import { notify } from "@/lib/notifications"
import OrderPreviewDialog from "@/components/order-preview-dialog"
import { useRouter } from "next/navigation"
import { LiveUsersService } from "@/lib/services/live-users-service"

type Order = {
  ID: number
  Code: number
  OrderDate: string
  Time: string
  CustomerName: string
  EmployeeName: string
  TotalValue: number
  NetValue: number
  IDRequestStatus: number
  ProductsCount: number
  CreatedDate: string
  DefaultSalesCommission: number
  IsCommissionCalculated: boolean
}

export default function OrdersManagementPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCommission, setFilterCommission] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [previewOrderId, setPreviewOrderId] = useState<number | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isTableUpdating, setIsTableUpdating] = useState(false)
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(0)

  useEffect(() => {
    loadOrders()
    loadLiveUsersCount()
    
    // تحديث الجدول فقط كل 5 ثوان بدون إعادة تحميل الصفحة
    const interval = setInterval(() => {
      updateTableOnly()
    }, 5000)
    
    // تحديث عدد المستخدمين النشطين كل 10 ثوان
    const usersInterval = setInterval(() => {
      loadLiveUsersCount()
    }, 10000)
    
    return () => {
      clearInterval(interval)
      clearInterval(usersInterval)
    }
  }, [])

    const loadOrders = async (showNotification = false) => {
    try {
      setLoading(true)
      const ordersCollection = collection(db, "Shop_Orders")
      const ordersQuery = query(ordersCollection, orderBy("CreatedDate", "desc"))
      const ordersSnapshot = await getDocs(ordersQuery)
      
              const ordersData = ordersSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            ID: data.ID || 0,
            Code: data.Code || 0,
            OrderDate: data.OrderDate || "",
            Time: data.Time || "",
            CustomerName: data.CustomerName || "",
            EmployeeName: data.PersonalSponsorName || data.EmployeeName || "غير محدد",
            TotalValue: data.TotalValue || 0,
            NetValue: data.NetValue || 0,
            IDRequestStatus: data.IDRequestStatus || 1,
            ProductsCount: data.ProductsCount || 0,
            CreatedDate: data.CreatedDate || "",
            DefaultSalesCommission: data.DefaultSalesCommission || 0,
            IsCommissionCalculated: data.IsCommissionCalculated || false
          }
        })
      
      setOrders(ordersData)
      
      if (showNotification) {
        notify.success("تم تحديث قائمة الطلبات بنجاح")
      }
    } catch (error) {
      console.error("Error loading orders:", error)
      
      // معالجة أخطاء الاتصال بـ Firestore
      if (error instanceof Error) {
        if (error.message.includes('unavailable') || error.message.includes('Could not reach Cloud Firestore')) {
          notify.error("مشكلة في الاتصال بالإنترنت. يرجى المحاولة مرة أخرى.")
        } else {
          notify.error("حدث خطأ أثناء تحميل الطلبات: " + error.message)
        }
      } else {
        notify.error("حدث خطأ غير متوقع أثناء تحميل الطلبات")
      }
    } finally {
      setLoading(false)
    }
  }

  // دالة تحميل عدد المستخدمين النشطين
  const loadLiveUsersCount = async () => {
    try {
      const stats = await LiveUsersService.getLiveUsersStats()
      // استخدام عدد الجلسات الفريدة (عدد المتصفحات المختلفة)
      setActiveSessionsCount(stats.uniqueSessions)
    } catch (error) {
      console.error("Error loading live users count:", error)
    }
  }

  // دالة تحديث الجدول فقط بدون إعادة تحميل الصفحة
  const updateTableOnly = async () => {
    try {
      setIsTableUpdating(true)
      const ordersCollection = collection(db, "Shop_Orders")
      const ordersQuery = query(ordersCollection, orderBy("CreatedDate", "desc"))
      const ordersSnapshot = await getDocs(ordersQuery)
      
      const ordersData = ordersSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ID: data.ID || 0,
          Code: data.Code || 0,
          OrderDate: data.OrderDate || "",
          Time: data.Time || "",
          CustomerName: data.CustomerName || "",
            EmployeeName: data.PersonalSponsorName || data.EmployeeName || "غير محدد",
          TotalValue: data.TotalValue || 0,
          NetValue: data.NetValue || 0,
          IDRequestStatus: data.IDRequestStatus || 1,
          ProductsCount: data.ProductsCount || 0,
          CreatedDate: data.CreatedDate || "",
          DefaultSalesCommission: data.DefaultSalesCommission || 0,
          IsCommissionCalculated: data.IsCommissionCalculated || false
        }
      })
      
      setOrders(ordersData)
      
      // إظهار مؤشر التحديث لمدة ثانية واحدة
      setTimeout(() => {
        setIsTableUpdating(false)
      }, 1000)
    } catch (error) {
      console.error("Error updating table:", error)
      
      // معالجة أخطاء الاتصال بـ Firestore
      if (error instanceof Error) {
        if (error.message.includes('unavailable') || error.message.includes('Could not reach Cloud Firestore')) {
          console.warn("مشكلة في الاتصال بالإنترنت أثناء تحديث الجدول")
        }
      }
      
      setIsTableUpdating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير محدد"
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG')
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return "غير محدد"
    // إذا كان الوقت بتنسيق HH:MM:SS
    if (timeString.includes(':')) {
      const timeParts = timeString.split(':')
      return `${timeParts[0]}:${timeParts[1]}`
    }
    return timeString
  }

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1:
        return { text: "تم تأكيد الطلب", color: "bg-blue-100 text-blue-800" }
      case 2:
        return { text: "جاري التجهيز", color: "bg-purple-100 text-purple-800" }
      case 3:
        return { text: "تم الشحن", color: "bg-orange-100 text-orange-800" }
      case 4:
        return { text: "تم التوصيل", color: "bg-green-100 text-green-800" }
      case 5:
        return { text: "مرفوض من العميل", color: "bg-red-100 text-red-800" }
      case 6:
        return { text: "ملغي", color: "bg-gray-100 text-gray-800" }
      default:
        return { text: "غير محدد", color: "bg-gray-100 text-gray-800" }
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.Code.toString().includes(searchTerm) ||
      order.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.EmployeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.ProductsCount.toString().includes(searchTerm) ||
      order.NetValue.toString().includes(searchTerm) ||
      order.DefaultSalesCommission.toString().includes(searchTerm) ||
      (order.IsCommissionCalculated ? "تم الحساب" : "لم يتم الحساب").includes(searchTerm) ||
      getStatusInfo(order.IDRequestStatus).text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(order.CreatedDate).includes(searchTerm) ||
      formatTime(order.Time).includes(searchTerm)
    
    const matchesStatus = filterStatus === "all" || order.IDRequestStatus.toString() === filterStatus
    
    // فلتر العمولة
    const matchesCommission = 
      filterCommission === "all" || 
      (filterCommission === "calculated" && order.IsCommissionCalculated) ||
      (filterCommission === "not-calculated" && !order.IsCommissionCalculated)
    
    // فلتر التاريخ
    const orderDate = new Date(order.CreatedDate)
    const matchesStartDate = !startDate || orderDate >= new Date(startDate)
    const matchesEndDate = !endDate || orderDate <= new Date(endDate + 'T23:59:59')
    
    return matchesSearch && matchesStatus && matchesCommission && matchesStartDate && matchesEndDate
  })

  // دالة حساب الإحصائيات من الطلبات المفلترة
  const getFilteredStats = () => {
    const today = new Date()
    const todayString = today.toDateString()
    
    return {
      totalOrders: filteredOrders.length,
      totalSales: filteredOrders.reduce((sum, order) => sum + order.NetValue, 0),
      activeCustomers: activeSessionsCount, // عدد المستخدمين النشطين فعلياً
      todayOrders: filteredOrders.filter(order => {
        const orderDate = new Date(order.CreatedDate)
        return orderDate.toDateString() === todayString
      }).length,
      // إحصائيات العمولة
      totalCommission: filteredOrders.reduce((sum, order) => sum + order.DefaultSalesCommission, 0),
      paidCommission: filteredOrders
        .filter(order => order.IsCommissionCalculated)
        .reduce((sum, order) => sum + order.DefaultSalesCommission, 0),
      pendingCommission: filteredOrders
        .filter(order => !order.IsCommissionCalculated)
        .reduce((sum, order) => sum + order.DefaultSalesCommission, 0)
    }
  }

  // دالة فتح معاينة الطلب
  const openPreview = (orderId: number) => {
    setPreviewOrderId(orderId)
    setIsPreviewOpen(true)
  }

  // دالة إغلاق معاينة الطلب
  const closePreview = () => {
    setIsPreviewOpen(false)
    setPreviewOrderId(null)
  }

  // دالة فتح تعديل الطلب
  const openEdit = (orderId: number) => {
    router.push(`/admin/shop_manag/orders/edit?id=${orderId}`)
  }

  // دالة حذف الطلب
  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return
    }

    try {
      // البحث عن الطلب في المصفوفة للحصول على ID الفايرستور
      const order = orders.find(o => o.Code === orderId)
      if (!order) {
        notify.error('لم يتم العثور على الطلب')
        return
      }

      // حذف الطلب من فايرستور
      const orderRef = doc(db, 'Shop_Orders', order.ID.toString())
      await deleteDoc(orderRef)
      
      notify.success('تم حذف الطلب بنجاح')
      await loadOrders() // إعادة تحميل الطلبات
    } catch (error) {
      console.error('خطأ في حذف الطلب:', error)
      notify.error('حدث خطأ في حذف الطلب')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الطلبات</h1>
        <p className="text-gray-600">عرض وإدارة جميع طلبات المتجر</p>
      </div>

                     {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="mr-3">
                  <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold">{getFilteredStats().totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="mr-3">
                  <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(getFilteredStats().totalSales)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-purple-600" />
                <div className="mr-3">
                  <p className="text-sm text-gray-600">العملاء النشطين</p>
                  <p className="text-2xl font-bold">
                    {getFilteredStats().activeCustomers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="mr-3">
                  <p className="text-sm text-gray-600">طلبات اليوم</p>
                  <p className="text-2xl font-bold">
                    {getFilteredStats().todayOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div className="mr-3">
                  <p className="text-sm text-gray-600">العمولة المدفوعة</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(getFilteredStats().paidCommission)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-amber-600" />
                <div className="mr-3">
                  <p className="text-sm text-gray-600">العمولة المستحقة</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(getFilteredStats().pendingCommission)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

             {/* أدوات البحث والفلترة */}
       <Card className="mb-6">
         <CardContent className="p-4">
           <div className="flex flex-col gap-4">
             {/* الصف الأول: البحث وحالة الطلب */}
             <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1">
                 <div className="relative">
                   <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                   <Input
                     placeholder="البحث في الطلبات..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pr-10"
                   />
                 </div>
               </div>
               
                               <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="1">تم تأكيد الطلب</option>
                    <option value="2">جاري التجهيز</option>
                    <option value="3">تم الشحن</option>
                    <option value="4">تم التوصيل</option>
                    <option value="5">مرفوض من العميل</option>
                    <option value="6">ملغي</option>
                  </select>
                  
                  <select
                    value={filterCommission}
                    onChange={(e) => setFilterCommission(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">جميع العمولات</option>
                    <option value="calculated">تم الحساب</option>
                    <option value="not-calculated">لم يتم الحساب</option>
                  </select>
                  
                                     <Button variant="outline" onClick={() => loadOrders(true)} className="flex items-center gap-2">
                     <Filter className="h-4 w-4" />
                     تحديث
                   </Button>
                   
                   <Button 
                     variant="outline" 
                     onClick={() => LiveUsersService.debugLiveUsers()} 
                     className="flex items-center gap-2"
                     title="اختبار نظام المستخدمين النشطين"
                   >
                     <User className="h-4 w-4" />
                     اختبار
                   </Button>
                </div>
             </div>

             {/* الصف الثاني: فلتر التاريخ */}
             <div className="flex flex-col sm:flex-row gap-4 items-center">
               <div className="flex items-center gap-2">
                 <label className="text-sm font-medium text-gray-700">من تاريخ:</label>
                 <input
                   type="date"
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               
               <div className="flex items-center gap-2">
                 <label className="text-sm font-medium text-gray-700">إلى تاريخ:</label>
                 <input
                   type="date"
                   value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                   className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               
               <Button 
                 variant="outline" 
                 onClick={() => {
                   setStartDate("")
                   setEndDate("")
                 }}
                 className="flex items-center gap-2"
               >
                 مسح التاريخ
               </Button>
             </div>
           </div>
         </CardContent>
       </Card>

             {/* قائمة الطلبات */}
       <Card>
         <CardHeader>
           <div className="flex items-center justify-between">
             <CardTitle>قائمة الطلبات</CardTitle>
             {isTableUpdating && (
               <div className="flex items-center gap-2 text-sm text-blue-600">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                 <span>تحديث...</span>
               </div>
             )}
           </div>
         </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل الطلبات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                                 <thead>
                   <tr className="border-b bg-gray-50">
                     <th className="text-right py-3 px-4 font-medium text-gray-700">رقم الطلب</th>
                     <th className="text-right py-3 px-4 font-medium text-gray-700">التاريخ</th>
                     <th className="text-right py-3 px-4 font-medium text-gray-700">الساعة</th>
                     <th className="text-right py-3 px-4 font-medium text-gray-700">العميل</th>
                     <th className="text-right py-3 px-4 font-medium text-gray-700">الموظف/الراعي</th>
                     <th className="text-right py-3 px-4 font-medium text-gray-700">عدد المنتجات</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">القيمة</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">عمولة المندوب</th>
                     <th className="text-right py-3 px-4 font-medium text-gray-700">الحالة</th>
                     <th className="text-right py-3 px-4 font-medium text-gray-700">الإجراءات</th>
                   </tr>
                 </thead>
                <tbody>
                                     {filteredOrders.map((order) => {
                     const statusInfo = getStatusInfo(order.IDRequestStatus)
                    return (
                                             <tr 
                         key={order.ID} 
                         className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                         onDoubleClick={() => openEdit(order.Code)}
                         title="انقر مرتين لفتح الطلب للتعديل"
                       >
                         <td className="py-3 px-4 font-medium">{order.Code}</td>
                         <td className="py-3 px-4">{formatDate(order.CreatedDate)}</td>
                         <td className="py-3 px-4">{formatTime(order.Time)}</td>
                         <td className="py-3 px-4">{order.CustomerName}</td>
                         <td className="py-3 px-4">{order.EmployeeName}</td>
                         <td className="py-3 px-4">{order.ProductsCount}</td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(order.NetValue)}</td>
                        <td className="py-3 px-4">
                          {order.IDRequestStatus === 4 ? (
                            <div className={`rounded-md border px-3 py-2 text-sm ${order.IsCommissionCalculated ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium">{formatCurrency(order.DefaultSalesCommission)}</span>
                                <Badge className={order.IsCommissionCalculated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {order.IsCommissionCalculated ? 'تم حساب العمولة' : 'لم تُحسب بعد'}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                         <td className="py-3 px-4">
                           <Badge className={statusInfo.color}>
                             {statusInfo.text}
                           </Badge>
                         </td>
                         <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                openPreview(order.Code)
                              }}
                              title="معاينة الطلب"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEdit(order.Code)
                              }}
                              title="تعديل الطلب"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteOrder(order.Code)
                              }}
                              title="حذف الطلب"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ديالوج معاينة الطلب */}
      {previewOrderId && (
        <OrderPreviewDialog
          isOpen={isPreviewOpen}
          onClose={closePreview}
          orderId={previewOrderId}
        />
      )}
    </div>
  )
}
