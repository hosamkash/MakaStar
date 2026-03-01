"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Building2,
  Shield
} from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAdminSession } from "@/lib/hooks/use-admin-session"

interface Employee {
  ID: number
  UserName: string
  Password: string
  Name: string
  IsActive: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const { session, login } = useAdminSession()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // التحقق من وجود بيانات لوجن محفوظة
  useEffect(() => {
    const savedUsername = localStorage.getItem("admin_username")
    const savedRememberMe = localStorage.getItem("admin_remember_me")
    
    if (savedUsername && savedRememberMe === "true") {
      setUsername(savedUsername)
      setRememberMe(true)
    }

    // التحقق من وجود جلسة نشطة
    if (session) {
      router.push("/admin")
    }
  }, [router, session])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // التحقق من إدخال البيانات
      if (!username.trim() || !password.trim()) {
        setError("يرجى إدخال اسم المستخدم وكلمة المرور")
        return
      }

      // البحث في جدول Dealing_Employees
      const employeesRef = collection(db, "Dealing_Employees")
      const q = query(
        employeesRef,
        where("UserName", "==", username.trim()),
        where("Password", "==", password.trim()),
        where("IsActive", "==", true)
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة")
        return
      }

      const employeeData = querySnapshot.docs[0].data() as Employee
      
      // حفظ بيانات الجلسة
      const sessionData = {
        id: employeeData.ID,
        username: employeeData.UserName,
        name: employeeData.Name,
        loginTime: new Date().toISOString()
      }

      login(sessionData)

      // حفظ بيانات "تذكرني" إذا تم تحديدها
      if (rememberMe) {
        localStorage.setItem("admin_username", username)
        localStorage.setItem("admin_remember_me", "true")
      } else {
        localStorage.removeItem("admin_username")
        localStorage.removeItem("admin_remember_me")
      }

      setSuccess(`مرحباً ${employeeData.Name}! تم تسجيل الدخول بنجاح`)
      
      // الانتقال إلى لوحة التحكم بعد ثانيتين
      setTimeout(() => {
        router.push("/admin")
      }, 2000)

    } catch (error) {
      console.error("Login error:", error)
      setError("حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session")
    localStorage.removeItem("admin_username")
    localStorage.removeItem("admin_remember_me")
    router.push("/account_employee")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-12 h-12 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">مكة ستار</h1>
              <p className="text-gray-600">نظام إدارة المتجر</p>
            </div>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-1" />
            تسجيل دخول الموظفين
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              تسجيل الدخول
            </CardTitle>
            <p className="text-gray-600">
              أدخل بياناتك للوصول إلى لوحة التحكم
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pr-10 text-right"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 text-right"
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  تذكر تسجيل الدخول
                </Label>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    تسجيل الدخول
                  </div>
                )}
              </Button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                <p>فقط الموظفين المسجلين يمكنهم الوصول إلى لوحة التحكم</p>
                <p className="mt-1">للمساعدة، تواصل مع مدير النظام</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 مكة ستار. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  )
}
