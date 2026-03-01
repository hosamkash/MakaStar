'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { 
  User, 
  ShoppingBag, 
  TrendingUp, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Package,
  Eye,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  X,
  Search,
  ChevronDown
} from 'lucide-react'
import { formatCurrencyEGP } from '@/lib/utils'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { notify } from '@/lib/notifications'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface EmployeeData {
  id: string
  name: string
  username: string
  loginTime: string
}

interface Employee {
  ID: number
  Code: number
  Name: string
  IsActive: boolean
  UserName?: string
  IDBranch?: number
  BranchName?: string
}

interface OrderData {
  order: any
  details: any[]
}

export default function RepresentAccountPage() {
  const router = useRouter()
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  const [orders, setOrders] = useState<OrderData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [activeTab, setActiveTab] = useState('confirmed')
  
  // Employee search states
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('')
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [branches, setBranches] = useState<{ID: number, Name: string}[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>('all')

  // إحصائيات الموظف
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalValue: 0,
    totalCommission: 0,
    confirmedOrders: 0,
    confirmedValue: 0,
    confirmedCommission: 0,
    processingOrders: 0,
    processingValue: 0,
    processingCommission: 0,
    shippedOrders: 0,
    shippedValue: 0,
    shippedCommission: 0,
    deliveredOrders: 0,
    deliveredValue: 0,
    deliveredCommission: 0,
    rejectedOrders: 0,
    rejectedValue: 0,
    rejectedCommission: 0,
    cancelledOrders: 0,
    cancelledValue: 0,
    cancelledCommission: 0,
    totalCustomers: 0
  })

  useEffect(() => {
    loadEmployeeData()
    loadBranches()
  }, [])

  // تحميل الموظفين بعد تحميل الفروع
  useEffect(() => {
    if (branches.length > 0) {
      loadEmployees()
    }
  }, [branches])

  // إعادة تحميل الموظفين عند فتح البحث
  useEffect(() => {
    if (employeeSearchOpen && employees.length === 0 && !isLoadingEmployees) {
      loadEmployees()
    }
  }, [employeeSearchOpen, employees.length, isLoadingEmployees])

  useEffect(() => {
    if (employeeData) {
      loadEmployeeOrders()
    }
  }, [employeeData])

  const loadEmployeeData = async () => {
    try {
      // بيانات افتراضية للموظف (بدون فحص الجلسة)
      setEmployeeData({
        id: 'default-employee',
        name: 'موظف افتراضي',
        username: 'employee',
        loginTime: new Date().toISOString()
      })
    } catch (error) {
      console.error('خطأ في تحميل بيانات الموظف:', error)
      notify.error('خطأ في تحميل بيانات الموظف')
    }
  }

  const loadBranches = async () => {
    try {
      const branchesRef = collection(db, 'Def_CompanyStructure')
      const querySnapshot = await getDocs(branchesRef)
      const branchesData = querySnapshot.docs.map(doc => ({
        ID: doc.data().ID || parseInt(doc.id),
        Name: doc.data().Name || ''
      }))
      setBranches(branchesData)
    } catch (error) {
      console.error('خطأ في تحميل الفروع:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      setIsLoadingEmployees(true)
      const employeesRef = collection(db, 'Dealing_Employees')
      // إزالة orderBy لتجنب الحاجة للفهرس
      const q = query(employeesRef, where('IsActive', '==', true))
      const querySnapshot = await getDocs(q)
      const employeesData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const branch = branches.find(b => b.ID === data.IDBranch)
        return {
          ID: data.ID || parseInt(doc.id),
          Code: data.Code || 0,
          Name: data.Name || '',
          IsActive: data.IsActive || false,
          UserName: data.UserName || '',
          IDBranch: data.IDBranch || 0,
          BranchName: branch?.Name || 'غير محدد'
        }
      })
      
      // ترتيب البيانات في الكود بدلاً من الاستعلام
      const sortedEmployees = employeesData.sort((a, b) => a.Name.localeCompare(b.Name))
      
      setEmployees(sortedEmployees)
      // طبق فلترة الفرع والبحث الحالية
      applyEmployeesFilter(employeeSearchTerm, selectedBranchId, sortedEmployees)
      console.log('تم تحميل الموظفين:', sortedEmployees.length)
    } catch (error) {
      console.error('خطأ في تحميل قائمة الموظفين:', error)
      notify.error('خطأ في تحميل قائمة الموظفين')
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  const applyEmployeesFilter = (searchTerm: string, branch: number | 'all', source?: Employee[]) => {
    const base = source || employees
    let list = base
    if (branch !== 'all') {
      list = list.filter(e => (e.IDBranch || 0) === branch)
    }
    if (searchTerm.trim() === '') {
      setFilteredEmployees(list)
      return
    }
    const term = searchTerm.toLowerCase()
    const filtered = list.filter(employee =>
      employee.Name.toLowerCase().includes(term) ||
      employee.Code.toString().includes(searchTerm) ||
      (employee.UserName && employee.UserName.toLowerCase().includes(term)) ||
      (employee.BranchName && employee.BranchName.toLowerCase().includes(term))
    )
    setFilteredEmployees(filtered)
  }

  const handleEmployeeSearch = (searchTerm: string) => {
    setEmployeeSearchTerm(searchTerm)
    applyEmployeesFilter(searchTerm, selectedBranchId)
  }

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setEmployeeData({
      id: employee.ID.toString(),
      name: employee.Name,
      username: employee.UserName || employee.Code.toString(),
      loginTime: new Date().toISOString()
    })
    setEmployeeSearchTerm(employee.Name)
    setEmployeeSearchOpen(false)
    // إعادة تعيين البحث لعرض جميع الموظفين
    setFilteredEmployees(employees)
    // إعادة تحميل الطلبات للموظف المحدد
    loadEmployeeOrdersForSelectedEmployee(employee.ID)
  }

  const handleClearEmployee = () => {
    setSelectedEmployee(null)
    setEmployeeData({
      id: 'default-employee',
      name: 'موظف افتراضي',
      username: 'employee',
      loginTime: new Date().toISOString()
    })
    setEmployeeSearchTerm('')
    setFilteredEmployees(employees)
    setOrders([])
    setStats({
      totalOrders: 0,
      totalValue: 0,
      totalCommission: 0,
      confirmedOrders: 0,
      confirmedValue: 0,
      confirmedCommission: 0,
      processingOrders: 0,
      processingValue: 0,
      processingCommission: 0,
      shippedOrders: 0,
      shippedValue: 0,
      shippedCommission: 0,
      deliveredOrders: 0,
      deliveredValue: 0,
      deliveredCommission: 0,
      rejectedOrders: 0,
      rejectedValue: 0,
      rejectedCommission: 0,
      cancelledOrders: 0,
      cancelledValue: 0,
      cancelledCommission: 0,
      totalCustomers: 0
    })
  }

  const loadEmployeeOrdersForSelectedEmployee = async (employeeId: number) => {
    try {
      setIsLoadingOrders(true)
      
      // البحث عن الطلبات التي يكون الموظف المحدد هو الراعي الشخصي لها
      const ordersRef = collection(db, 'Shop_Orders')
      const q = query(
        ordersRef,
        where('PersonalSponsorID', '==', employeeId)
      )

      const querySnapshot = await getDocs(q)
      const ordersData: OrderData[] = []

      for (const doc of querySnapshot.docs) {
        const orderData = doc.data()
        
        // تحميل تفاصيل الطلب
        const detailsRef = collection(db, 'Shop_OrderDetails')
        const detailsQuery = query(
          detailsRef,
          where('IDOrder', '==', orderData.ID)
        )
        const detailsSnapshot = await getDocs(detailsQuery)
        const details = detailsSnapshot.docs.map(detail => detail.data())

        ordersData.push({
          order: orderData,
          details: details
        })
      }

      // ترتيب البيانات حسب التاريخ (الأحدث أولاً)
      const sortedOrders = ordersData.sort((a, b) => {
        const dateA = new Date(a.order.CreatedDate || a.order.OrderDate || 0)
        const dateB = new Date(b.order.CreatedDate || b.order.OrderDate || 0)
        return dateB.getTime() - dateA.getTime()
      })

      setOrders(sortedOrders)
      calculateStats(sortedOrders)
    } catch (error) {
      console.error('خطأ في تحميل طلبات الموظف:', error)
      if (error instanceof Error && error.message.includes('index')) {
        notify.error('يتم إنشاء فهرس قاعدة البيانات، يرجى المحاولة مرة أخرى خلال دقائق')
      } else {
        notify.error('خطأ في تحميل طلبات الموظف')
      }
    } finally {
      setIsLoadingOrders(false)
      setIsLoading(false)
    }
  }

  const loadEmployeeOrders = async () => {
    if (!employeeData) return

    try {
      setIsLoadingOrders(true)
      
      // البحث عن الطلبات التي يكون الموظف الحالي هو الراعي الشخصي لها
      const ordersRef = collection(db, 'Shop_Orders')
      const q = query(
        ordersRef,
        where('PersonalSponsorID', '==', employeeData.id)
      )

      const querySnapshot = await getDocs(q)
      const ordersData: OrderData[] = []

      for (const doc of querySnapshot.docs) {
        const orderData = doc.data()
        
        // تحميل تفاصيل الطلب
        const detailsRef = collection(db, 'Shop_OrderDetails')
        const detailsQuery = query(
          detailsRef,
          where('IDOrder', '==', orderData.ID)
        )
        const detailsSnapshot = await getDocs(detailsQuery)
        const details = detailsSnapshot.docs.map(detail => detail.data())

        ordersData.push({
          order: orderData,
          details: details
        })
      }

      // ترتيب البيانات حسب التاريخ (الأحدث أولاً)
      const sortedOrders = ordersData.sort((a, b) => {
        const dateA = new Date(a.order.CreatedDate || a.order.OrderDate || 0)
        const dateB = new Date(b.order.CreatedDate || b.order.OrderDate || 0)
        return dateB.getTime() - dateA.getTime()
      })

      setOrders(sortedOrders)
      calculateStats(sortedOrders)
    } catch (error) {
      console.error('خطأ في تحميل طلبات الموظف:', error)
      if (error instanceof Error && error.message.includes('index')) {
        notify.error('يتم إنشاء فهرس قاعدة البيانات، يرجى المحاولة مرة أخرى خلال دقائق')
      } else {
        notify.error('خطأ في تحميل طلبات الموظف')
      }
    } finally {
      setIsLoadingOrders(false)
      setIsLoading(false)
    }
  }

  const calculateStats = (ordersData: OrderData[]) => {
    const totalOrders = ordersData.length
    const totalValue = ordersData.reduce((sum, order) => {
      const value = order.order.NetValue || order.order.TotalValue || order.order.PriceBeforDiscount || 0
      return sum + value
    }, 0)
    
    // حساب عدد الطلبات والمبالغ لكل حالة
    const confirmedOrders = ordersData.filter(order => (order.order.IDRequestStatus || 1) === 1)
    const processingOrders = ordersData.filter(order => (order.order.IDRequestStatus || 1) === 2)
    const shippedOrders = ordersData.filter(order => (order.order.IDRequestStatus || 1) === 3)
    const deliveredOrders = ordersData.filter(order => (order.order.IDRequestStatus || 1) === 4)
    const rejectedOrders = ordersData.filter(order => (order.order.IDRequestStatus || 1) === 5)
    const cancelledOrders = ordersData.filter(order => (order.order.IDRequestStatus || 1) === 6)
    
    // حساب المبالغ لكل حالة - استخدام حقول مختلفة محتملة
    const confirmedValue = confirmedOrders.reduce((sum, order) => {
      const value = order.order.NetValue || order.order.TotalValue || order.order.PriceBeforDiscount || 0
      console.log('طلب مؤكد:', order.order.OrderNo, 'القيمة:', value)
      return sum + value
    }, 0)
    const confirmedCommission = confirmedOrders.reduce((sum, order) => sum + (order.order.DefaultSalesCommission || 0), 0)
    const processingValue = processingOrders.reduce((sum, order) => {
      const value = order.order.NetValue || order.order.TotalValue || order.order.PriceBeforDiscount || 0
      return sum + value
    }, 0)
    const processingCommission = processingOrders.reduce((sum, order) => sum + (order.order.DefaultSalesCommission || 0), 0)
    const shippedValue = shippedOrders.reduce((sum, order) => {
      const value = order.order.NetValue || order.order.TotalValue || order.order.PriceBeforDiscount || 0
      return sum + value
    }, 0)
    const shippedCommission = shippedOrders.reduce((sum, order) => sum + (order.order.DefaultSalesCommission || 0), 0)
    const deliveredValue = deliveredOrders.reduce((sum, order) => {
      const value = order.order.NetValue || order.order.TotalValue || order.order.PriceBeforDiscount || 0
      return sum + value
    }, 0)
    const deliveredCommission = deliveredOrders.reduce((sum, order) => sum + (order.order.DefaultSalesCommission || 0), 0)
    const rejectedValue = rejectedOrders.reduce((sum, order) => {
      const value = order.order.NetValue || order.order.TotalValue || order.order.PriceBeforDiscount || 0
      return sum + value
    }, 0)
    const rejectedCommission = rejectedOrders.reduce((sum, order) => sum + (order.order.DefaultSalesCommission || 0), 0)
    const cancelledValue = cancelledOrders.reduce((sum, order) => {
      const value = order.order.NetValue || order.order.TotalValue || order.order.PriceBeforDiscount || 0
      return sum + value
    }, 0)
    const cancelledCommission = cancelledOrders.reduce((sum, order) => sum + (order.order.DefaultSalesCommission || 0), 0)
    const totalCommission = ordersData.reduce((sum, order) => sum + (order.order.DefaultSalesCommission || 0), 0)
    
    // تشخيص البيانات
    console.log('إحصائيات الطلبات:', {
      totalOrders,
      totalValue,
      confirmedOrders: confirmedOrders.length,
      confirmedValue,
      processingOrders: processingOrders.length,
      processingValue,
      shippedOrders: shippedOrders.length,
      shippedValue,
      deliveredOrders: deliveredOrders.length,
      deliveredValue,
      rejectedOrders: rejectedOrders.length,
      rejectedValue,
      cancelledOrders: cancelledOrders.length,
      cancelledValue
    })
    
    // حساب عدد العملاء الفريدين
    const uniqueCustomers = new Set(ordersData.map(order => order.order.CustomerName)).size

    const newStats = {
      totalOrders,
      totalValue,
      totalCommission,
      confirmedOrders: confirmedOrders.length,
      confirmedValue,
      confirmedCommission,
      processingOrders: processingOrders.length,
      processingValue,
      processingCommission,
      shippedOrders: shippedOrders.length,
      shippedValue,
      shippedCommission,
      deliveredOrders: deliveredOrders.length,
      deliveredValue,
      deliveredCommission,
      rejectedOrders: rejectedOrders.length,
      rejectedValue,
      rejectedCommission,
      cancelledOrders: cancelledOrders.length,
      cancelledValue,
      cancelledCommission,
      totalCustomers: uniqueCustomers
    }
    
    console.log('حفظ الإحصائيات:', newStats)
    setStats(newStats)
  }

  const getOrderStatusText = (status: number) => {
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

  const getOrderStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-yellow-100 text-yellow-800'
      case 2: return 'bg-blue-100 text-blue-800'
      case 3: return 'bg-purple-100 text-purple-800'
      case 4: return 'bg-green-100 text-green-800'
      case 5: return 'bg-red-100 text-red-800'
      case 6: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد'
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // فلترة الطلبات حسب التاب النشط
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'confirmed':
        // تم تأكيد الطلب: حالة 1
        return orders.filter(order => (order.order.IDRequestStatus || 1) === 1)
      case 'processing':
        // جاري التجهيز: حالة 2
        return orders.filter(order => (order.order.IDRequestStatus || 1) === 2)
      case 'shipped':
        // تم الشحن: حالة 3
        return orders.filter(order => (order.order.IDRequestStatus || 1) === 3)
      case 'delivered':
        // تم التوصيل: حالة 4
        return orders.filter(order => (order.order.IDRequestStatus || 1) === 4)
      case 'rejected':
        // مرفوض من العميل: حالة 5
        return orders.filter(order => (order.order.IDRequestStatus || 1) === 5)
      case 'cancelled':
        // ملغي: حالة 6
        return orders.filter(order => (order.order.IDRequestStatus || 1) === 6)
      default:
        return orders
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل بيانات المندوب...</p>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/shop_manag')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">حساب المندوب - الموظف</h1>
            <p className="text-gray-600">عرض طلبات العملاء المرتبطة بالموظف المحدد</p>
          </div>
        </div>
      </div>

      {/* Employee Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Branch combo */}
            <div className="min-w-[220px]">
              <select
                value={selectedBranchId === 'all' ? 'all' : String(selectedBranchId)}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                  setSelectedBranchId(val)
                  // تفريغ اختيار الموظف والبحث عند تغيير الفرع
                  setSelectedEmployee(null)
                  setEmployeeSearchTerm('')
                  applyEmployeesFilter('', val)
                }}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">عرض كل الفروع</option>
                {branches.map(b => (
                  <option key={b.ID} value={b.ID}>{b.Name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 max-w-md">
              <Popover open={employeeSearchOpen} onOpenChange={(open) => {
                setEmployeeSearchOpen(open)
                if (open) {
                  // عند فتح الكمبو، إعادة تعيين البحث لعرض جميع الموظفين
                  setEmployeeSearchTerm('')
                  applyEmployeesFilter('', selectedBranchId)
                }
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={employeeSearchOpen}
                    className="w-full justify-between h-10"
                  >
                    <span className="truncate">
                      {selectedEmployee ? selectedEmployee.Name : "اختر الموظف..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="البحث عن الموظف..."
                      value={employeeSearchTerm}
                      onValueChange={handleEmployeeSearch}
                      className="h-9"
                    />
                    <CommandList className="max-h-60">
                      {isLoadingEmployees ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="mr-2 text-sm text-gray-600">جاري تحميل الموظفين...</span>
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>لم يتم العثور على موظف.</CommandEmpty>
                          <CommandGroup>
                            {filteredEmployees.map((employee) => (
                              <CommandItem
                                key={employee.ID}
                                value={`${employee.Name} ${employee.Code} ${employee.UserName || ''}`}
                                onSelect={() => handleSelectEmployee(employee)}
                                className="py-2"
                              >
                                <User className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{employee.Name}</span>
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div>كود: {employee.Code}</div>
                                    <div>الفرع: {employee.BranchName}</div>
                                    <div>اسم المستخدم: {employee.UserName || 'غير محدد'}</div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {selectedEmployee && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearEmployee}
                className="flex items-center gap-2 h-10"
              >
                <X className="w-4 h-4" />
                إلغاء الاختيار
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
 

      {/* إحصائيات حالات الطلبات */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
            إحصائيات حالات الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-800">{stats.confirmedOrders}</div>
              <div className="text-sm text-yellow-600">تم تأكيد الطلب</div>
              <div className="text-xs font-medium text-yellow-700 mt-1">
                {formatCurrencyEGP(stats.confirmedValue)}
              </div>
              <div className="text-xs font-medium text-emerald-700 mt-1">
                عمولة: {formatCurrencyEGP(stats.confirmedCommission)}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-800">{stats.processingOrders}</div>
              <div className="text-sm text-blue-600">جاري التجهيز</div>
              <div className="text-xs font-medium text-blue-700 mt-1">
                {formatCurrencyEGP(stats.processingValue)}
              </div>
              <div className="text-xs font-medium text-emerald-700 mt-1">
                عمولة: {formatCurrencyEGP(stats.processingCommission)}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-800">{stats.shippedOrders}</div>
              <div className="text-sm text-purple-600">تم الشحن</div>
              <div className="text-xs font-medium text-purple-700 mt-1">
                {formatCurrencyEGP(stats.shippedValue)}
              </div>
              <div className="text-xs font-medium text-emerald-700 mt-1">
                عمولة: {formatCurrencyEGP(stats.shippedCommission)}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-800">{stats.deliveredOrders}</div>
              <div className="text-sm text-green-600">تم التوصيل</div>
              <div className="text-xs font-medium text-green-700 mt-1">
                {formatCurrencyEGP(stats.deliveredValue)}
              </div>
              <div className="text-xs font-medium text-emerald-700 mt-1">
                عمولة: {formatCurrencyEGP(stats.deliveredCommission)}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-800">{stats.rejectedOrders}</div>
              <div className="text-sm text-red-600">مرفوض</div>
              <div className="text-xs font-medium text-red-700 mt-1">
                {formatCurrencyEGP(stats.rejectedValue)}
              </div>
              <div className="text-xs font-medium text-emerald-700 mt-1">
                عمولة: {formatCurrencyEGP(stats.rejectedCommission)}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-800">{stats.cancelledOrders}</div>
              <div className="text-sm text-gray-600">ملغي</div>
              <div className="text-xs font-medium text-gray-700 mt-1">
                {formatCurrencyEGP(stats.cancelledValue)}
              </div>
              <div className="text-xs font-medium text-emerald-700 mt-1">
                عمولة: {formatCurrencyEGP(stats.cancelledCommission)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تابات الطلبات */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="confirmed" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                تم تأكيد الطلب ({orders.filter(order => (order.order.IDRequestStatus || 1) === 1).length})
              </TabsTrigger>
              <TabsTrigger value="processing" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                جاري التجهيز ({orders.filter(order => (order.order.IDRequestStatus || 1) === 2).length})
              </TabsTrigger>
              <TabsTrigger value="shipped" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                تم الشحن ({orders.filter(order => (order.order.IDRequestStatus || 1) === 3).length})
              </TabsTrigger>
              <TabsTrigger value="delivered" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                تم التوصيل ({orders.filter(order => (order.order.IDRequestStatus || 1) === 4).length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                مرفوض ({orders.filter(order => (order.order.IDRequestStatus || 1) === 5).length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <X className="w-4 h-4" />
                ملغي ({orders.filter(order => (order.order.IDRequestStatus || 1) === 6).length})
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                جميع الطلبات ({orders.length})
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="confirmed" className="space-y-4">
                <OrdersList orders={getFilteredOrders()} isLoading={isLoadingOrders} />
              </TabsContent>
              <TabsContent value="processing" className="space-y-4">
                <OrdersList orders={getFilteredOrders()} isLoading={isLoadingOrders} />
              </TabsContent>
              <TabsContent value="shipped" className="space-y-4">
                <OrdersList orders={getFilteredOrders()} isLoading={isLoadingOrders} />
              </TabsContent>
              <TabsContent value="delivered" className="space-y-4">
                <OrdersList orders={getFilteredOrders()} isLoading={isLoadingOrders} />
              </TabsContent>
              <TabsContent value="rejected" className="space-y-4">
                <OrdersList orders={getFilteredOrders()} isLoading={isLoadingOrders} />
              </TabsContent>
              <TabsContent value="cancelled" className="space-y-4">
                <OrdersList orders={getFilteredOrders()} isLoading={isLoadingOrders} />
              </TabsContent>
              <TabsContent value="all" className="space-y-4">
                <OrdersList orders={getFilteredOrders()} isLoading={isLoadingOrders} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// مكون قائمة الطلبات
function OrdersList({ orders, isLoading }: { orders: OrderData[], isLoading: boolean }) {
  const router = useRouter()

  const getOrderStatusText = (status: number) => {
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

  const getOrderStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-yellow-100 text-yellow-800'
      case 2: return 'bg-blue-100 text-blue-800'
      case 3: return 'bg-purple-100 text-purple-800'
      case 4: return 'bg-green-100 text-green-800'
      case 5: return 'bg-red-100 text-red-800'
      case 6: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل الطلبات...</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h3>
        <p className="text-gray-600">لم يتم العثور على طلبات مرتبطة بهذا الموظف</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((orderData) => (
        <Card key={orderData.order.ID} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    طلب رقم: {orderData.order.OrderNo || orderData.order.Code}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600">
                      العميل: {orderData.order.CustomerName || 'غير محدد'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(orderData.order.CreatedDate || new Date()).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrencyEGP(orderData.order.NetValue || 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {orderData.details.length} منتج
                  </div>
                </div>
                {/* بطاقة عمولة المندوب لجميع الحالات */}
                <div className={`rounded-md border px-3 py-2 text-sm ${orderData.order.IsCommissionCalculated ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                  <div className="flex items-center justify-between gap-3 min-w-[190px]">
                    <span className="font-medium">{formatCurrencyEGP(orderData.order.DefaultSalesCommission || 0)}</span>
                    <Badge className={orderData.order.IsCommissionCalculated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {orderData.order.IsCommissionCalculated ? 'تم حساب العمولة' : 'لم تُحسب بعد'}
                    </Badge>
                  </div>
                </div>
                
                <Badge className={getOrderStatusColor(orderData.order.IDRequestStatus || 1)}>
                  {getOrderStatusText(orderData.order.IDRequestStatus || 1)}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/shop_manag/orders/edit?id=${orderData.order.ID}`)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  عرض التفاصيل
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
