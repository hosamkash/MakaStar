"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Building2,
  Shield,
  ArrowLeft,
  UserPlus
} from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useClientSession } from "@/lib/hooks/use-client-session"
import Link from "next/link"
import ClientRegister from "@/components/account-client/client-register"

interface Client {
  ID: number
  UserName: string
  Password: string
  Name: string
  Email: string
  Mobile: string
  Phone: string
  Address: string
  Latitude: number
  Longitude: number
  IsActive: boolean
}

export default function ClientLoginPage() {
  const router = useRouter()
  const { session, login } = useClientSession()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("login")

  // التحقق من وجود بيانات لوجن محفوظة
  useEffect(() => {
    const savedUsername = localStorage.getItem("client_username")
    const savedRememberMe = localStorage.getItem("client_remember_me")
    
    if (savedUsername && savedRememberMe === "true") {
      setUsername(savedUsername)
      setRememberMe(true)
    }

    // التحقق من وجود جلسة نشطة
    if (session) {
      router.push("/account_client")
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

      // البحث في جدول Dealing_Clients
      const clientsRef = collection(db, "Dealing_Clients")
      const q = query(
        clientsRef,
        where("UserName", "==", username.trim()),
        where("Password", "==", password.trim()),
        where("IsActive", "==", true)
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة")
        return
      }

      const clientData = querySnapshot.docs[0].data() as Client
      
      // حفظ بيانات الجلسة
      const sessionData = {
        id: clientData.ID,
        username: clientData.UserName,
        name: clientData.Name,
        email: clientData.Email || "",
        mobile: clientData.Mobile || "",
        phone: clientData.Phone || "",
        address: clientData.Address || "",
        latitude: clientData.Latitude?.toString() || "",
        longitude: clientData.Longitude?.toString() || "",
        loginTime: new Date().toISOString()
      }

      await login(sessionData)

      // حفظ بيانات "تذكرني" إذا تم تحديدها
      if (rememberMe) {
        localStorage.setItem("client_username", username)
        localStorage.setItem("client_remember_me", "true")
      } else {
        localStorage.removeItem("client_username")
        localStorage.removeItem("client_remember_me")
      }

      setSuccess(`مرحباً ${clientData.Name}! تم تسجيل الدخول بنجاح`)
      
      // الانتقال إلى الصفحة المطلوبة بعد ثانيتين
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const redirect = urlParams.get('redirect')
          router.push(redirect || "/account_client")
        }
      }, 2000)

    } catch (error) {
      console.error("Login error:", error)
      setError("حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى")
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrationSuccess = () => {
    // عند نجاح إنشاء الحساب، انتقل إلى تاب تسجيل الدخول
    setActiveTab("login")
    setSuccess("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/maka-star-logo.png" 
              alt="مكه ستار" 
              className="w-16 h-16 object-contain mr-3"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">مكة ستار</h1>
              <p className="text-gray-600">مرحباً بك في نظام العملاء</p>
            </div>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-1" />
            سجل دخولك أو أنشئ حساب جديد للوصول إلى المتجر
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login" className="text-lg font-medium">
              <LogIn className="w-5 h-5 ml-2" />
              تسجيل الدخول
            </TabsTrigger>
            <TabsTrigger value="register" className="text-lg font-medium">
              <UserPlus className="w-5 h-5 ml-2" />
              إنشاء عميل جديد
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-6">
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  تسجيل دخول العميل
                </CardTitle>
                <p className="text-gray-600">
                  أدخل بياناتك للوصول إلى المتجر
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
                    <span className="inline-flex items-center gap-2">
                      {loading ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      <span>{loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}</span>
                    </span>
                  </Button>
                </form>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center text-sm text-gray-500">
                    <p>يجب تسجيل الدخول لإضافة المنتجات إلى السلة</p>
                    <p className="mt-1">للمساعدة، تواصل مع خدمة العملاء</p>
                  </div>
                </div>

                {/* Back to Store */}
                <div className="mt-4">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/store">
                      <ArrowLeft className="w-4 h-4 ml-2" />
                      العودة للمتجر
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-6">
            <ClientRegister 
              onSuccess={handleRegistrationSuccess}
              showHeader={false}
              className=""
            />
          </TabsContent>
        </Tabs>

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
