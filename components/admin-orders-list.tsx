"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, where, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, Filter, Eye, Edit, Trash2, Calendar, Package, DollarSign, User 
} from "lucide-react"
import { notify } from "@/lib/notifications"
import OrderPreviewDialog from "@/components/order-preview-dialog"

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

interface AdminOrdersListProps {
  clientId?: number | null
  title?: string
}

export default function AdminOrdersList({ clientId = null, title = "إدارة الطلبات" }: AdminOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCommission, setFilterCommission] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [previewOrderId, setPreviewOrderId] = useState<number | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const showCustomerColumn = !(clientId && clientId > 0)

  useEffect(() => {
    loadOrders()
  }, [clientId])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const ordersCollection = collection(db, "Shop_Orders")
      // لتفادي الحاجة إلى فهرس مركب: عند وجود clientId نستخدم where فقط ثم نفرز على العميل
      const qBase = clientId && clientId > 0
        ? query(ordersCollection, where("IDClient", "==", clientId))
        : query(ordersCollection, orderBy("CreatedDate", "desc"))
      const snapshot = await getDocs(qBase)
      const data = snapshot.docs.map(docu => {
        const data = docu.data() as any
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
        } as Order
      })
      // فرز محلي بحسب التاريخ تنازلياً
      const sorted = data.sort((a, b) => {
        const da = new Date(a.CreatedDate).getTime()
        const dbt = new Date(b.CreatedDate).getTime()
        return dbt - da
      })
      setOrders(sorted)
    } catch (e) {
      console.error(e)
      notify.error("فشل تحميل الطلبات")
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1: return { text: "تم تأكيد الطلب", color: "bg-blue-100 text-blue-800" }
      case 2: return { text: "جاري التجهيز", color: "bg-purple-100 text-purple-800" }
      case 3: return { text: "تم الشحن", color: "bg-orange-100 text-orange-800" }
      case 4: return { text: "تم التوصيل", color: "bg-green-100 text-green-800" }
      case 5: return { text: "مرفوض من العميل", color: "bg-red-100 text-red-800" }
      case 6: return { text: "ملغي", color: "bg-gray-100 text-gray-800" }
      default: return { text: "غير محدد", color: "bg-gray-100 text-gray-800" }
    }
  }

  const filtered = orders.filter(o => {
    const matchesSearch =
      o.Code.toString().includes(searchTerm) ||
      o.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.EmployeeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || o.IDRequestStatus.toString() === filterStatus
    const matchesCommission = filterCommission === 'all' ||
      (filterCommission === 'calculated' && o.IsCommissionCalculated) ||
      (filterCommission === 'not-calculated' && !o.IsCommissionCalculated)
    const orderDate = new Date(o.CreatedDate)
    const matchesStartDate = !startDate || orderDate >= new Date(startDate)
    const matchesEndDate = !endDate || orderDate <= new Date(endDate + 'T23:59:59')
    return matchesSearch && matchesStatus && matchesCommission && matchesStartDate && matchesEndDate
  })

  const openPreview = (orderId: number) => { setPreviewOrderId(orderId); setIsPreviewOpen(true) }
  const closePreview = () => { setIsPreviewOpen(false); setPreviewOrderId(null) }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {clientId ? <p className="text-gray-600">عرض طلبات العميل رقم: {clientId}</p> : null}
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث..." className="pr-10" />
                </div>
              </div>
              <div className="flex gap-2">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-md">
                  <option value="all">جميع الحالات</option>
                  <option value="1">تم تأكيد الطلب</option>
                  <option value="2">جاري التجهيز</option>
                  <option value="3">تم الشحن</option>
                  <option value="4">تم التوصيل</option>
                  <option value="5">مرفوض</option>
                  <option value="6">ملغي</option>
                </select>
                <select value={filterCommission} onChange={(e) => setFilterCommission(e.target.value)} className="px-3 py-2 border rounded-md">
                  <option value="all">جميع العمولات</option>
                  <option value="calculated">تم الحساب</option>
                  <option value="not-calculated">لم يتم الحساب</option>
                </select>
                <Button variant="outline" onClick={loadOrders} className="flex items-center gap-2"><Filter className="h-4 w-4" />تحديث</Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm">من:</label>
                <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="px-3 py-2 border rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">إلى:</label>
                <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="px-3 py-2 border rounded-md" />
              </div>
              <Button variant="outline" onClick={()=>{setStartDate('');setEndDate('')}}>مسح التاريخ</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-right py-3 px-4">رقم</th>
                    <th className="text-right py-3 px-4">التاريخ</th>
                    <th className="text-right py-3 px-4">الساعة</th>
                    {showCustomerColumn && (
                      <th className="text-right py-3 px-4">العميل</th>
                    )}
                    <th className="text-right py-3 px-4">الموظف/الراعي</th>
                    <th className="text-right py-3 px-4">عدد المنتجات</th>
                    <th className="text-right py-3 px-4">القيمة</th>
                    <th className="text-right py-3 px-4">العمولة</th>
                    <th className="text-right py-3 px-4">الحالة</th>
                    <th className="text-right py-3 px-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const s = getStatusInfo(o.IDRequestStatus)
                    return (
                      <tr key={o.ID} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{o.Code}</td>
                        <td className="py-3 px-4">{new Date(o.CreatedDate).toLocaleDateString('ar-EG')}</td>
                        <td className="py-3 px-4">{o.Time?.slice(0,5)}</td>
                        {showCustomerColumn && (
                          <td className="py-3 px-4">{o.CustomerName}</td>
                        )}
                        <td className="py-3 px-4">{o.EmployeeName}</td>
                        <td className="py-3 px-4">{o.ProductsCount}</td>
                        <td className="py-3 px-4 font-medium">{new Intl.NumberFormat('ar-EG',{style:'currency',currency:'EGP'}).format(o.NetValue)}</td>
                        <td className="py-3 px-4 font-medium">{new Intl.NumberFormat('ar-EG',{style:'currency',currency:'EGP'}).format(o.DefaultSalesCommission)}</td>
                        <td className="py-3 px-4"><Badge className={s.color}>{s.text}</Badge></td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline" onClick={()=>openPreview(o.Code)} className="mr-2"><Eye className="h-4 w-4"/></Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={async()=>{
                            if(!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return
                            await deleteDoc(doc(db,'Shop_Orders', o.ID.toString()))
                            notify.success('تم الحذف')
                            await loadOrders()
                          }}><Trash2 className="h-4 w-4"/></Button>
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

      {previewOrderId && (
        <OrderPreviewDialog isOpen={isPreviewOpen} onClose={closePreview} orderId={previewOrderId} />
      )}
    </div>
  )
}


