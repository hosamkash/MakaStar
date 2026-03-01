"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Edit,
  Trash2,
  Printer,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Employee {
  ID?: number
  IDBranch?: number
  Code?: number
  Name?: string
  IsActive?: boolean
  IsBindShop?: boolean
  Phone?: string
  Mobile?: string
  Address?: string
  NationalID?: string
  BirthDate?: string
  Age?: number
  IDMaritalStatus?: number
  ChildrenCount?: number
  IDReligions?: number
  IDGender?: number
  IDMilitaryStatus?: number
  Qualification?: string
  IDJob?: number
  IDDepartment?: number
  DateHiring?: string
  TimeWorkFrom?: string
  TimeWorkTo?: string
  TimeTotalWorkHour?: number
  MonthlyVacationDays?: number
  ExpiryDateJob?: string
  LeavingReson?: string
  SalaryMonthValue?: number
  SalaryWeekValue?: number
  SalaryDayValue?: number
  SalaryHourValue?: number
  MonthlyTarget?: number
  MonthlyCommissionExecute?: number
  MonthlyCommissionNotExecute?: number
  DailyTarget?: number
  DailyCommissionExecute?: number
  DailyCommissionNotExecute?: number
  CommissionSales1?: number
  CommissionSalesReturned1?: number
  CommissionSales2?: number
  CommissionSalesReturned2?: number
  CommissionSales3?: number
  CommissionSalesReturned3?: number
  CommissionSales4?: number
  CommissionSalesReturned4?: number
  CommissionSales5?: number
  CommissionSalesReturned5?: number
  RelativeName1?: string
  RelativeMobile1?: string
  RelativeType1?: string
  RelativeName2?: string
  RelativeMobile2?: string
  RelativeType2?: string
  RelativeName3?: string
  RelativeMobile3?: string
  RelativeType3?: string
  RelativeName4?: string
  RelativeMobile4?: string
  RelativeType4?: string
  ImageName?: string
  ImageURL?: string
  UserName?: string
  Password?: string
  LoginIsAdmin?: boolean
}

interface Branch {
  ID?: number
  Name?: string
  IsActive?: boolean
}

export default function EmployeesListPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof Employee>("ID")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [loading, setLoading] = useState(true)
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)

  // حارس وصول: يمنع فتح الصفحة بدون لوجن خاص بهذه المنطقة
  useEffect(() => {
    const ok = typeof window !== 'undefined' ? localStorage.getItem("employee_login_ok") === "true" : false
    const storedBranchId = typeof window !== 'undefined' ? localStorage.getItem("logged_in_branch_id") : null
    
    if (!ok) {
      router.replace("/admin/dealings/employee-login")
    } else if (storedBranchId) {
      // تعيين الفرع تلقائياً بناءً على الموظف الذي عمل لوجن
      setSelectedBranchId(Number(storedBranchId))
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let filtered = employees.filter((employee) =>
      Object.values(employee).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )

    // تصفية إجبارية بالفرع المحدد (لا يمكن تغييرها)
    if (selectedBranchId !== null) {
      filtered = filtered.filter(e => e.IDBranch === selectedBranchId)
    }

    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return 1
      if (bValue === undefined) return -1
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
      return 0
    })

    setFilteredEmployees(filtered)
    setCurrentPage(1)
  }, [employees, searchTerm, sortField, sortDirection, selectedBranchId])

  const loadData = async () => {
    try {
      setLoading(true)
      const branchesSnapshot = await getDocs(collection(db, "Def_CompanyStructure"))
      const branchesData = branchesSnapshot.docs.map(doc => ({ ...doc.data(), ID: parseInt(doc.id) }))
      setBranches(branchesData)
      const employeesSnapshot = await getDocs(collection(db, "Dealing_Employees"))
      const employeesData = employeesSnapshot.docs.map(doc => ({ ...doc.data(), ID: parseInt(doc.id) }))
      setEmployees(employeesData)
    } catch (error) {
      toast.error("خطأ في تحميل البيانات")
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleDelete = async (employee: Employee) => {
    if (!employee.ID) return
    
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الموظف التالي؟\n\n` +
      `الاسم: ${employee.Name || 'غير محدد'}\n` +
      `الكود: ${employee.Code || 'غير محدد'}\n` +
      `الفرع: ${getBranchName(employee.IDBranch)}\n\n` +
      `هذا الإجراء لا يمكن التراجع عنه!`
    )
    
    if (confirmed) {
      try {
        await deleteDoc(doc(db, "Dealing_Employees", employee.ID.toString()))
        setEmployees(prev => prev.filter(e => e.ID !== employee.ID))
        setSelectedEmployee(null)
        toast.success(`تم حذف الموظف "${employee.Name}" بنجاح`)
      } catch (error) {
        toast.error("خطأ في حذف الموظف")
        console.error("Error deleting employee:", error)
      }
    }
  }

  const handleExport = () => {
    const csvContent = [
      // Header
      ['الكود', 'الاسم', 'الفرع', 'الموبايل', 'الهاتف', 'العنوان', 'نشط', 'متجر'].join(','),
      // Data
      ...filteredEmployees.map(employee => [
        employee.Code || '',
        employee.Name || '',
        getBranchName(employee.IDBranch),
        employee.Mobile || '',
        employee.Phone || '',
        employee.Address || '',
        employee.IsActive ? 'نعم' : 'لا',
        employee.IsBindShop ? 'نعم' : 'لا'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `الموظفين_${getBranchName(selectedBranchId || undefined)}_${new Date().toLocaleDateString('ar-EG')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`تم تصدير ${filteredEmployees.length} موظف بنجاح`)
  }


  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex)

  // دالة للحصول على اسم الفرع
  const getBranchName = (branchId?: number) => {
    if (!branchId) return "-"
    const branch = branches.find(b => b.ID === branchId)
    return branch?.Name || `فرع ${branchId}`
  }

  const SortIcon = ({ field }: { field: keyof Employee }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button variant="destructive" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 ml-2" />
            إغلاق
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-lg">
          <h1 className="text-xl font-bold text-gray-700">
            عرض الموظفين - فرع: {getBranchName(selectedBranchId || undefined)}
          </h1>
        </div>
        <Button 
          onClick={() => router.push(`/admin/dealings/employee-login/employees-item?branchId=${selectedBranchId}`)} 
          className="bg-white text-green-600 border border-green-600 hover:bg-green-50"
        >
          <Plus className="w-4 h-4 ml-2" />
          جديد
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="البحث في جميع الحقول..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
            </div>
            <Select value={selectedBranchId ? String(selectedBranchId) : ""} disabled>
              <SelectTrigger className="w-56 bg-gray-50">
                <SelectValue placeholder="اختر الفرع" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.ID} value={String(b.ID)}>
                    {b.Name || `فرع ${b.ID}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="40">40</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الإجراءات</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("Code")} className="h-auto p-0 font-bold">
                    الكود
                    <SortIcon field="Code" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("Name")} className="h-auto p-0 font-bold">
                    الاسم
                    <SortIcon field="Name" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("IDBranch")} className="h-auto p-0 font-bold">
                    الفرع
                    <SortIcon field="IDBranch" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("Mobile")} className="h-auto p-0 font-bold">
                    الموبايل
                    <SortIcon field="Mobile" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("Phone")} className="h-auto p-0 font-bold">
                    الهاتف
                    <SortIcon field="Phone" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("Address")} className="h-auto p-0 font-bold">
                    العنوان
                    <SortIcon field="Address" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("IsActive")} className="ه-auto p-0 font-bold">
                    نشط
                    <SortIcon field="IsActive" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("IsBindShop")} className="h-auto p-0 font-bold">
                    متجر
                    <SortIcon field="IsBindShop" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span>جاري التحميل...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchTerm ? `لا توجد نتائج للبحث: "${searchTerm}"` : "لا توجد بيانات"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentEmployees.map((employee) => (
                  <TableRow
                    key={employee.ID}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedEmployee?.ID === employee.ID ? "bg-blue-50 border-blue-200" : ""
                    }`}
                    onClick={() => setSelectedEmployee(employee)}
                    onDoubleClick={() => router.push(`/admin/dealings/employee-login/employees-item?id=${employee.ID}&branchId=${selectedBranchId}`)}
                  >
                    <TableCell className="text-right">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/dealings/employee-login/employees-item?id=${employee.ID}&branchId=${selectedBranchId}`)
                          }}
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(employee)
                          }}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{employee.Code || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{employee.Name || "-"}</TableCell>
                    <TableCell className="text-right">{getBranchName(employee.IDBranch)}</TableCell>
                    <TableCell className="text-right">{employee.Mobile || "-"}</TableCell>
                    <TableCell className="text-right">{employee.Phone || "-"}</TableCell>
                    <TableCell className="text-right max-w-xs truncate" title={employee.Address || ""}>{employee.Address || "-"}</TableCell>
                    <TableCell className="text-right"><Badge variant={employee.IsActive ? "default" : "secondary"}>{employee.IsActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                    <TableCell className="text-right"><Badge variant={employee.IsBindShop ? "default" : "secondary"}>{employee.IsBindShop ? "متجر" : "عادي"}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-sm text-gray-700">عدد العناصر في الصفحة:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">عرض {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} من {filteredEmployees.length} موظف</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-sm text-gray-700">صفحة {currentPage} من {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
            <ChevronsRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
            <ChevronsLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}


