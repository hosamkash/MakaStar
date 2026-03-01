"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ShoppingCart, 
  Clock, 
  User, 
  Package, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  RefreshCw,
  Search,
  XCircle,
  MapPin,
  MessageCircle,
  ShoppingBag
} from "lucide-react"
import { CartService } from "@/lib/services/cart-service"
import { formatCurrencyEGP } from "@/lib/utils"
import { notify } from "@/lib/notifications"
import Image from "next/image"

interface CartCustomer {
  userID: number
  customerName: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string
  customerCode?: number
  customerBalance?: number
  customerUsername?: string
  cartItems: any[]
  totalItems: number
  totalValue: number
  addedDate: string
  addedTime: string
  daysSinceAdded: number
  hoursSinceAdded: number
  lastActivity: string
}

export default function ShopBasketManagementPage() {
  const [customers, setCustomers] = useState<CartCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<CartCustomer | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('recent')

  // جلب بيانات العملاء من السلة مع معلوماتهم الكاملة
  const loadCartCustomers = async () => {
    try {
      setLoading(true)
      console.log('جلب بيانات العملاء من السلة مع المعلومات الكاملة...')
      
      // استخدام الدالة الجديدة لجلب بيانات العملاء مع معلوماتهم الكاملة
      const customersList = await CartService.getCartCustomersWithDetails()
      console.log('قائمة العملاء مع المعلومات الكاملة:', customersList)
      
      setCustomers(customersList)
    } catch (error) {
      console.error('خطأ في جلب بيانات العملاء:', error)
      notify.error('فشل في جلب بيانات العملاء')
    } finally {
      setLoading(false)
    }
  }

  // دالة حذف البيانات القديمة
  const handleDeleteData = async () => {
    try {
      setLoading(true)
      console.log('بدء حذف البيانات...')
      
      await CartService.migrateOldCartData()
      notify.success('تم حذف البيانات بنجاح')
      
      // إعادة تحميل البيانات بعد الحذف
      await loadCartCustomers()
    } catch (error) {
      console.error('خطأ في حذف البيانات:', error)
      notify.error('فشل في حذف البيانات')
    } finally {
      setLoading(false)
    }
  }

  // دالة تنظيف البيانات المكررة
  const handleCleanData = async () => {
    try {
      setLoading(true)
      console.log('بدء تنظيف البيانات المكررة...')
      
      await CartService.cleanDuplicateCartData()
      notify.success('تم تنظيف البيانات المكررة بنجاح')
      
      // إعادة تحميل البيانات بعد التنظيف
      await loadCartCustomers()
    } catch (error) {
      console.error('خطأ في تنظيف البيانات:', error)
      notify.error('فشل في تنظيف البيانات')
    } finally {
      setLoading(false)
    }
  }

  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    loadCartCustomers()
  }, [])

  // فلترة وترتيب العملاء
  const filteredAndSortedCustomers = customers
    .filter(customer => {
      // فلترة حسب البحث
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          customer.customerName.toLowerCase().includes(searchLower) ||
          customer.customerPhone?.includes(searchTerm) ||
          customer.customerEmail?.toLowerCase().includes(searchLower) ||
          customer.customerUsername?.toLowerCase().includes(searchLower) ||
          customer.customerCode?.toString().includes(searchTerm) ||
          customer.userID.toString().includes(searchTerm) ||
          customer.customerAddress?.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        case 'oldest':
          return new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()
        case 'value':
          return b.totalValue - a.totalValue
        case 'items':
          return b.totalItems - a.totalItems
        case 'days':
          return b.daysSinceAdded - a.daysSinceAdded
        default:
          return 0
      }
    })

  // فتح تفاصيل العميل
  const openCustomerDetails = (customer: CartCustomer) => {
    setSelectedCustomer(customer)
    setShowDetailsDialog(true)
  }

  // تحويل السلة إلى طلب
  const handleConvertToOrder = async (customer: CartCustomer) => {
    try {
      setLoading(true)
      
      console.log('تحويل السلة إلى طلب للعميل:', customer.customerName)
      
      // استيراد خدمة الطلبات
      const { OrdersService } = await import('@/lib/services/orders-service')
      
      // تحويل السلة إلى طلب
      const orderId = await OrdersService.convertCartToOrder(customer)
      
      // تفريغ السلة بعد التحويل
      await CartService.clearCart(customer.userID.toString())
      
      notify.success(`تم تحويل سلة العميل ${customer.customerName} إلى طلب بنجاح (رقم الطلب: ${orderId})`)
      
      // إعادة تحميل البيانات
      await loadCartCustomers()
      
    } catch (error) {
      console.error('خطأ في تحويل السلة إلى طلب:', error)
      notify.error('فشل في تحويل السلة إلى طلب')
    } finally {
      setLoading(false)
    }
  }

  // إحصائيات سريعة
  const getStats = () => {
    const totalCustomers = customers.length
    const totalValue = customers.reduce((sum, c) => sum + c.totalValue, 0)
    
    return { totalCustomers, totalValue }
  }

  const stats = getStats()

  // تنسيق الوقت المنقضي
  const formatTimeElapsed = (days: number, hours: number) => {
    if (days > 0) {
      return `${days} يوم ${hours} ساعة`
    }
    return `${hours} ساعة`
  }



  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان والإحصائيات */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            إدارة سلة المشتريات
          </h1>
          <p className="text-gray-600 mt-2">
            متابعة العملاء الذين أضافوا منتجات للسلة ولم يحولوها لطلبات
          </p>
        </div>
        
                 <div className="flex gap-2">
           <Button onClick={loadCartCustomers} disabled={loading} className="flex items-center gap-2">
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             تحديث البيانات
           </Button>
                       <Button 
              onClick={handleDeleteData} 
              disabled={loading} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              حذف البيانات
            </Button>
           <Button 
             onClick={handleCleanData} 
             disabled={loading} 
             variant="outline"
             className="flex items-center gap-2"
           >
             <XCircle className="w-4 h-4" />
             تنظيف المكررات
           </Button>
         </div>
      </div>

             {/* الإحصائيات السريعة */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-gray-600">إجمالي العملاء</p>
                 <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
               </div>
               <User className="w-8 h-8 text-blue-600" />
             </div>
           </CardContent>
         </Card>

         <Card>
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-gray-600">إجمالي القيمة</p>
                 <p className="text-2xl font-bold text-green-600">{formatCurrencyEGP(stats.totalValue)}</p>
               </div>
               <Package className="w-8 h-8 text-green-600" />
             </div>
           </CardContent>
         </Card>
       </div>

      {/* الفلاتر والبحث */}
      <Card>
        <CardContent className="p-4">
                     <div className="flex flex-col lg:flex-row gap-4">
             <div className="flex-1">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                 <Input
                   placeholder="البحث في العملاء..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10"
                 />
               </div>
             </div>
             
             <Select value={sortBy} onValueChange={setSortBy}>
               <SelectTrigger className="w-full lg:w-48">
                 <SelectValue placeholder="ترتيب حسب" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="recent">الأحدث</SelectItem>
                 <SelectItem value="oldest">الأقدم</SelectItem>
                 <SelectItem value="value">الأعلى قيمة</SelectItem>
                 <SelectItem value="items">الأكثر منتجات</SelectItem>
                 <SelectItem value="days">الأطول في السلة</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </CardContent>
      </Card>

      {/* جدول العملاء */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            قائمة العملاء ({filteredAndSortedCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="mr-2">جاري التحميل...</span>
            </div>
          ) : filteredAndSortedCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد بيانات للعملاء</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                                 <TableHeader>
                   <TableRow>
                     <TableHead>العميل</TableHead>
                     <TableHead>المنتجات</TableHead>
                     <TableHead>القيمة الإجمالية</TableHead>
                     <TableHead>تاريخ الإضافة</TableHead>
                     <TableHead>الوقت المنقضي</TableHead>
                     <TableHead className="text-center">الإجراءات</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {filteredAndSortedCustomers.map((customer) => (
                    <TableRow key={customer.userID}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.customerName}</p>
                            <div className="text-sm text-gray-500 space-y-1">
                              <p>ID: {customer.userID}</p>
                              {customer.customerCode && <p>الكود: {customer.customerCode}</p>}
                              {customer.customerPhone && <p>الهاتف: {customer.customerPhone}</p>}
                              {customer.customerEmail && <p>البريد: {customer.customerEmail}</p>}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span>{customer.totalItems} منتج</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {formatCurrencyEGP(customer.totalValue)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.addedDate}</p>
                          <p className="text-gray-500">{customer.addedTime}</p>
                        </div>
                      </TableCell>
                      
                                             <TableCell>
                         <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4 text-gray-400" />
                           <span className="text-sm">
                             {formatTimeElapsed(customer.daysSinceAdded, customer.hoursSinceAdded)}
                           </span>
                         </div>
                       </TableCell>
                       
                       <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {/* زر الاتصال */}
                          {customer.customerPhone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(`tel:${customer.customerPhone}`, '_blank')
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              title="اتصال بالعميل"
                            >
                              <Phone className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {/* زر واتس آب */}
                          {customer.customerPhone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const message = `مرحباً ${customer.customerName}، نود التواصل معك بخصوص منتجاتك في السلة`
                                const whatsappUrl = `https://wa.me/${customer.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
                                window.open(whatsappUrl, '_blank')
                              }}
                              className="flex items-center gap-1 text-green-600 hover:text-green-700"
                              title="إرسال واتس آب"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {/* زر إرسال إيميل */}
                          {customer.customerEmail && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const subject = `متابعة منتجاتك في السلة - ${customer.customerName}`
                                const body = `مرحباً ${customer.customerName}،\n\nنود التواصل معك بخصوص المنتجات الموجودة في سلة مشترياتك.\n\nيمكنك إكمال عملية الشراء من خلال الرابط التالي:\n[رابط إكمال الطلب]\n\nشكراً لك`
                                const mailtoUrl = `mailto:${customer.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                window.open(mailtoUrl, '_blank')
                              }}
                              className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                              title="إرسال إيميل"
                            >
                              <Mail className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {/* زر تحويل لطلب */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConvertToOrder(customer)}
                            className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                            title="تحويل لطلب"
                          >
                            <ShoppingBag className="w-3 h-3" />
                          </Button>
                          
                          {/* زر التفاصيل */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCustomerDetails(customer)}
                            className="flex items-center gap-1"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ديالوج تفاصيل العميل */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              تفاصيل العميل: {selectedCustomer?.customerName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* معلومات العميل */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات العميل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">معرف العميل</p>
                      <p className="font-medium">{selectedCustomer.userID}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">الاسم</p>
                      <p className="font-medium">{selectedCustomer.customerName}</p>
                    </div>
                    {selectedCustomer.customerCode && (
                      <div>
                        <p className="text-sm text-gray-600">كود العميل</p>
                        <p className="font-medium">{selectedCustomer.customerCode}</p>
                      </div>
                    )}
                    {selectedCustomer.customerUsername && (
                      <div>
                        <p className="text-sm text-gray-600">اسم المستخدم</p>
                        <p className="font-medium">{selectedCustomer.customerUsername}</p>
                      </div>
                    )}
                    {selectedCustomer.customerPhone && (
                      <div>
                        <p className="text-sm text-gray-600">رقم الهاتف</p>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {selectedCustomer.customerPhone}
                        </p>
                      </div>
                    )}
                    {selectedCustomer.customerEmail && (
                      <div>
                        <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {selectedCustomer.customerEmail}
                        </p>
                      </div>
                    )}
                    {selectedCustomer.customerAddress && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">العنوان</p>
                        <p className="font-medium">{selectedCustomer.customerAddress}</p>
                      </div>
                    )}
                    {selectedCustomer.customerBalance !== undefined && (
                      <div>
                        <p className="text-sm text-gray-600">الرصيد الحالي</p>
                        <p className="font-semibold text-blue-600">
                          {formatCurrencyEGP(selectedCustomer.customerBalance)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">تاريخ الإضافة</p>
                      <p className="font-medium">{selectedCustomer.addedDate} {selectedCustomer.addedTime}</p>
                    </div>
                                         <div>
                       <p className="text-sm text-gray-600">الوقت المنقضي</p>
                       <p className="font-medium">
                         {formatTimeElapsed(selectedCustomer.daysSinceAdded, selectedCustomer.hoursSinceAdded)}
                       </p>
                     </div>
                     <div>
                       <p className="text-sm text-gray-600">إجمالي القيمة</p>
                       <p className="font-semibold text-green-600">
                         {formatCurrencyEGP(selectedCustomer.totalValue)}
                       </p>
                     </div>
                  </div>
                </CardContent>
              </Card>

              {/* منتجات السلة */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">منتجات السلة ({selectedCustomer.cartItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedCustomer.cartItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.ImageURL ? (
                            <Image
                              src={item.ImageURL}
                              alt={item.Name || "منتج"}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium">{item.Name}</h4>
                          <p className="text-sm text-gray-600">الباركود: {item.BarCode}</p>
                          <p className="text-sm text-gray-600">الفئة: {item.IDCategory}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">{item.Qty} × {formatCurrencyEGP(item.SalesPrice || 0)}</p>
                          <p className="text-green-600 font-medium">
                            {formatCurrencyEGP(item.TotalSalesPrice || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ملاحظات وإجراءات */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الإجراءات</CardTitle>
                </CardHeader>
                                 <CardContent>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                     {/* الاتصال */}
                     {selectedCustomer.customerPhone && (
                       <Button 
                         variant="outline" 
                         className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                         onClick={() => {
                           if (selectedCustomer.customerPhone) {
                             window.open(`tel:${selectedCustomer.customerPhone}`, '_blank')
                           }
                         }}
                       >
                         <Phone className="w-4 h-4" />
                         <span className="hidden sm:inline">اتصال</span>
                       </Button>
                     )}
                     
                     {/* واتس آب */}
                     {selectedCustomer.customerPhone && (
                       <Button 
                         variant="outline" 
                         className="flex items-center gap-2 text-green-600 hover:text-green-700"
                         onClick={() => {
                           if (selectedCustomer.customerPhone) {
                             const message = `مرحباً ${selectedCustomer.customerName}، نود التواصل معك بخصوص منتجاتك في السلة`
                             const whatsappUrl = `https://wa.me/${selectedCustomer.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
                             window.open(whatsappUrl, '_blank')
                           }
                         }}
                       >
                         <MessageCircle className="w-4 h-4" />
                         <span className="hidden sm:inline">واتس آب</span>
                       </Button>
                     )}
                     
                     {/* إرسال إيميل */}
                     {selectedCustomer.customerEmail && (
                       <Button 
                         variant="outline" 
                         className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                         onClick={() => {
                           if (selectedCustomer.customerEmail) {
                             const subject = `متابعة منتجاتك في السلة - ${selectedCustomer.customerName}`
                             const body = `مرحباً ${selectedCustomer.customerName}،\n\nنود التواصل معك بخصوص المنتجات الموجودة في سلة مشترياتك.\n\nيمكنك إكمال عملية الشراء من خلال الرابط التالي:\n[رابط إكمال الطلب]\n\nشكراً لك`
                             const mailtoUrl = `mailto:${selectedCustomer.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                             window.open(mailtoUrl, '_blank')
                           }
                         }}
                       >
                         <Mail className="w-4 h-4" />
                         <span className="hidden sm:inline">إيميل</span>
                       </Button>
                     )}
                     
                     {/* تحويل لطلب */}
                     <Button 
                       variant="outline" 
                       className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                       onClick={() => handleConvertToOrder(selectedCustomer)}
                     >
                       <ShoppingBag className="w-4 h-4" />
                       <span className="hidden sm:inline">تحويل لطلب</span>
                     </Button>
                     
                     {/* عرض الموقع */}
                     {selectedCustomer.customerAddress && (
                       <Button 
                         variant="outline" 
                         className="flex items-center gap-2"
                         onClick={() => {
                           if (selectedCustomer.customerAddress) {
                             const encodedAddress = encodeURIComponent(selectedCustomer.customerAddress)
                             window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank')
                           }
                         }}
                       >
                         <MapPin className="w-4 h-4" />
                         <span className="hidden sm:inline">الموقع</span>
                       </Button>
                     )}
                     
                     {/* جدولة متابعة */}
                     <Button variant="outline" className="flex items-center gap-2">
                       <Calendar className="w-4 h-4" />
                       <span className="hidden sm:inline">جدولة</span>
                     </Button>
                   </div>
                 </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
