"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Users, 
  DollarSign, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  Calendar,
  Target
} from "lucide-react"
import { notify } from "@/lib/notifications"

type Commission = {
  id?: string
  ID: number
  EmployeeID: number
  EmployeeName: string
  CommissionType: number // 1: نسبة مئوية, 2: مبلغ ثابت
  CommissionValue: number
  MinSalesAmount: number
  MaxSalesAmount: number
  IsActive: boolean
  CreatedDate: string
  Description: string
}

type Employee = {
  ID: number
  Name: string
  IsActive: boolean
}

export default function CommissionsManagementPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null)
  const [formData, setFormData] = useState<Partial<Commission>>({
    EmployeeID: 0,
    EmployeeName: "",
    CommissionType: 1,
    CommissionValue: 0,
    MinSalesAmount: 0,
    MaxSalesAmount: 0,
    IsActive: true,
    Description: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // تحميل الموظفين
      const employeesCollection = collection(db, "Dealing_Employees")
      const employeesQuery = query(employeesCollection, where("IsActive", "==", true))
      const employeesSnapshot = await getDocs(employeesQuery)
      
      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[]
      
      setEmployees(employeesData)
      
      // تحميل العمولات
      const commissionsCollection = collection(db, "Shop_Commissions")
      const commissionsSnapshot = await getDocs(commissionsCollection)
      
      const commissionsData = commissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commission[]
      
      setCommissions(commissionsData)
    } catch (error) {
      console.error("Error loading data:", error)
      notify.error("حدث خطأ أثناء تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editingCommission) {
        // تحديث عمولة موجودة
        const commissionRef = doc(db, "Shop_Commissions", editingCommission.id!)
        await updateDoc(commissionRef, {
          ...formData,
          ModifiedDate: new Date().toISOString()
        })
        notify.success("تم تحديث العمولة بنجاح")
      } else {
        // إضافة عمولة جديدة
        const newCommission = {
          ...formData,
          ID: Date.now(),
          CreatedDate: new Date().toISOString()
        }
        await addDoc(collection(db, "Shop_Commissions"), newCommission)
        notify.success("تم إضافة العمولة بنجاح")
      }
      
      setShowAddDialog(false)
      setEditingCommission(null)
      setFormData({
        EmployeeID: 0,
        EmployeeName: "",
        CommissionType: 1,
        CommissionValue: 0,
        MinSalesAmount: 0,
        MaxSalesAmount: 0,
        IsActive: true,
        Description: ""
      })
      loadData()
    } catch (error) {
      console.error("Error saving commission:", error)
      notify.error("حدث خطأ أثناء حفظ العمولة")
    }
  }

  const handleDelete = async (commissionId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه العمولة؟")) {
      try {
        await deleteDoc(doc(db, "Shop_Commissions", commissionId))
        notify.success("تم حذف العمولة بنجاح")
        loadData()
      } catch (error) {
        console.error("Error deleting commission:", error)
        notify.error("حدث خطأ أثناء حذف العمولة")
      }
    }
  }

  const handleEdit = (commission: Commission) => {
    setEditingCommission(commission)
    setFormData({
      EmployeeID: commission.EmployeeID,
      EmployeeName: commission.EmployeeName,
      CommissionType: commission.CommissionType,
      CommissionValue: commission.CommissionValue,
      MinSalesAmount: commission.MinSalesAmount,
      MaxSalesAmount: commission.MaxSalesAmount,
      IsActive: commission.IsActive,
      Description: commission.Description
    })
    setShowAddDialog(true)
  }

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.ID.toString() === employeeId)
    if (employee) {
      setFormData({
        ...formData,
        EmployeeID: employee.ID,
        EmployeeName: employee.Name
      })
    }
  }

  const filteredCommissions = commissions.filter(commission =>
    commission.EmployeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commission.Description.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const getCommissionTypeText = (type: number) => {
    return type === 1 ? "نسبة مئوية" : "مبلغ ثابت"
  }

  const getCommissionDisplay = (commission: Commission) => {
    if (commission.CommissionType === 1) {
      return `${commission.CommissionValue}%`
    } else {
      return formatCurrency(commission.CommissionValue)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة عمولات المندوبين</h1>
        <p className="text-gray-600">إدارة عمولات وبدلات مندوبي المبيعات</p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">إجمالي العمولات</p>
                <p className="text-2xl font-bold">{commissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">متوسط العمولة</p>
                <p className="text-2xl font-bold">
                  {commissions.length > 0 
                    ? formatCurrency(commissions.reduce((sum, comm) => sum + comm.CommissionValue, 0) / commissions.length)
                    : "0 ج.م"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">العمولات النشطة</p>
                <p className="text-2xl font-bold">
                  {commissions.filter(comm => comm.IsActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">الموظفين المؤهلين</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والإضافة */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في العمولات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عمولة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCommission ? "تعديل العمولة" : "إضافة عمولة جديدة"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employee">الموظف</Label>
                    <Select
                      value={formData.EmployeeID?.toString()}
                      onValueChange={handleEmployeeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.ID} value={employee.ID.toString()}>
                            {employee.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="commissionType">نوع العمولة</Label>
                    <Select
                      value={formData.CommissionType?.toString()}
                      onValueChange={(value) => setFormData({ ...formData, CommissionType: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع العمولة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">نسبة مئوية</SelectItem>
                        <SelectItem value="2">مبلغ ثابت</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="commissionValue">
                      {formData.CommissionType === 1 ? "النسبة المئوية (%)" : "المبلغ الثابت"}
                    </Label>
                    <Input
                      id="commissionValue"
                      type="number"
                      value={formData.CommissionValue}
                      onChange={(e) => setFormData({ ...formData, CommissionValue: Number(e.target.value) })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minSales">أقل مبيعات</Label>
                      <Input
                        id="minSales"
                        type="number"
                        value={formData.MinSalesAmount}
                        onChange={(e) => setFormData({ ...formData, MinSalesAmount: Number(e.target.value) })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxSales">أعلى مبيعات</Label>
                      <Input
                        id="maxSales"
                        type="number"
                        value={formData.MaxSalesAmount}
                        onChange={(e) => setFormData({ ...formData, MaxSalesAmount: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Input
                      id="description"
                      value={formData.Description}
                      onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.IsActive}
                      onChange={(e) => setFormData({ ...formData, IsActive: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isActive">نشط</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1">
                      {editingCommission ? "تحديث" : "إضافة"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false)
                        setEditingCommission(null)
                        setFormData({
                          EmployeeID: 0,
                          EmployeeName: "",
                          CommissionType: 1,
                          CommissionValue: 0,
                          MinSalesAmount: 0,
                          MaxSalesAmount: 0,
                          IsActive: true,
                          Description: ""
                        })
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* قائمة العمولات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العمولات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل العمولات...</p>
            </div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد عمولات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4">الموظف</th>
                    <th className="text-right py-3 px-4">نوع العمولة</th>
                    <th className="text-right py-3 px-4">قيمة العمولة</th>
                    <th className="text-right py-3 px-4">نطاق المبيعات</th>
                    <th className="text-right py-3 px-4">الحالة</th>
                    <th className="text-right py-3 px-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{commission.EmployeeName}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-blue-100 text-blue-800">
                          {getCommissionTypeText(commission.CommissionType)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {getCommissionDisplay(commission)}
                      </td>
                      <td className="py-3 px-4">
                        {formatCurrency(commission.MinSalesAmount)} - {formatCurrency(commission.MaxSalesAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={commission.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {commission.IsActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(commission)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600"
                            onClick={() => handleDelete(commission.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
