"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LogIn,
  Building2,
  User,
  Lock,
  List,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAdminSession } from "@/lib/hooks/use-admin-session"

interface Employee {
  ID?: number
  IDBranch?: number
  Code?: number
  Name?: string
  UserName?: string
  Password?: string
  IsActive?: boolean
}

interface Branch {
  ID?: number
  Name?: string
  IsActive?: boolean
}

export default function EmployeeLoginPage() {
  const router = useRouter()
  const { login } = useAdminSession()
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // تحميل الفروع
  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const branchesSnapshot = await getDocs(collection(db, "Def_CompanyStructure"))
      const branchesData = branchesSnapshot.docs.map(doc => ({ ...doc.data(), ID: parseInt(doc.id) }))
      setBranches(branchesData)
    } catch (error) {
      console.error("Error loading branches:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!selectedBranchId) {
      setError("يرجى اختيار الفرع")
      return
    }

    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور")
      return
    }

    try {
      // البحث عن الموظف في قاعدة البيانات
      const employeesRef = collection(db, "Dealing_Employees")
      const q = query(
        employeesRef,
        where("UserName", "==", username.trim()),
        where("Password", "==", password.trim()),
        where("IDBranch", "==", selectedBranchId),
        where("IsActive", "==", true)
      )
      
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة أو الفرع غير مطابق")
        return
      }

      const employeeData = querySnapshot.docs[0].data() as Employee

      // حفظ بيانات الجلسة
      const sessionData = {
        id: employeeData.ID || 0,
        username: employeeData.UserName || "",
        name: employeeData.Name || "",
        loginTime: new Date().toISOString(),
        branchId: selectedBranchId,
        branchName: branches.find(b => b.ID === selectedBranchId)?.Name || "غير محدد"
      }

      login(sessionData)

      // حفظ في localStorage للتحكم في الوصول
      localStorage.setItem("employee_login_ok", "true")
      localStorage.setItem("logged_in_branch_id", String(selectedBranchId))

      // حفظ تذكرني
      if (rememberMe) {
        localStorage.setItem("remembered_employee", JSON.stringify({
          username,
          branchId: selectedBranchId
        }))
      }

      setSuccess(`مرحباً ${employeeData.Name}! تم تسجيل الدخول بنجاح`)

      // إعادة التوجيه بعد ثانيتين
      setTimeout(() => {
        router.push("/admin/dealings/employee-login/employees-list")
      }, 2000)

    } catch (error) {
      console.error("Login error:", error)
      setError("حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى")
    } finally {
      setLoading(false)
    }
  }

  // تحميل البيانات المحفوظة عند بدء التطبيق
  useEffect(() => {
    const remembered = localStorage.getItem("remembered_employee")
    if (remembered) {
      try {
        const data = JSON.parse(remembered)
        setUsername(data.username || "")
        setSelectedBranchId(data.branchId || null)
        setRememberMe(true)
      } catch (error) {
        console.error("Error parsing remembered data:", error)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* العنوان الرئيسي */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            تسجيل دخول الموظفين
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            نظام إدارة الموظفين - تعريف الموظفين فقط
          </p>
        </div>

        {/* بطاقة تسجيل الدخول */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center text-xl font-semibold text-gray-900">
              بيانات تسجيل الدخول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* رسائل الخطأ والنجاح */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  {success}
                </div>
              )}

              {/* اختيار الفرع */}
              <div className="space-y-2">
                <Label htmlFor="branch" className="text-sm font-medium text-gray-700">
                  الفرع *
                </Label>
                <Select 
                  value={selectedBranchId === null ? "" : String(selectedBranchId)} 
                  onValueChange={(value) => setSelectedBranchId(value ? Number(value) : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.ID} value={String(branch.ID)}>
                        {branch.Name || `فرع ${branch.ID}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* اسم المستخدم */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  اسم المستخدم *
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  كلمة المرور *
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="pr-10"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* تذكرني */}
              <div className="flex items-center">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="mr-2 text-sm text-gray-700">
                  تذكرني
                </Label>
              </div>

              {/* زر تسجيل الدخول */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    تسجيل الدخول
                  </div>
                )}
              </Button>

              {/* زر عرض قائمة الموظفين */}
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/dealings/employee-login/employees-list")}
                className="w-full"
              >
                <List className="w-4 h-4 ml-2" />
                قائمة الموظفين
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


