"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Shield,
  UserPlus,
  X
} from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useClientSession } from "@/lib/hooks/use-client-session"
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

interface ClientLoginDialogProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: () => void
  pendingAction?: () => void
  title?: string
  message?: string
}

export default function ClientLoginDialog({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  pendingAction,
  title = "تسجيل دخول العميل",
  message = "يجب تسجيل الدخول لإضافة المنتجات إلى السلة"
}: ClientLoginDialogProps) {
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
  }, [])

  // إعادة تعيين الحالة عند فتح الديالوج
  useEffect(() => {
    if (isOpen) {
      setError("")
      setSuccess("")
      setActiveTab("login")
    }
  }, [isOpen])

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
      
      // تنفيذ الإجراء المعلق إذا كان موجوداً
      if (pendingAction) {
        setTimeout(() => {
          pendingAction()
        }, 1000)
      }

      // إغلاق الديالوج وتنفيذ callback النجاح
      setTimeout(() => {
        onLoginSuccess?.()
        onClose()
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/maka-star-logo.png" 
              alt="مكه ستار" 
              className="w-12 h-12 object-contain mr-3"
            />
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">{title}</DialogTitle>
              <p className="text-gray-600 text-sm">تسجيل الدخول أو إنشاء حساب جديد</p>
            </div>
          </div>
          <div className="flex items-center justify-center text-xs text-gray-500">
            <Shield className="w-3 h-3 mr-1" />
            {message}
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="text-sm font-medium">
              <LogIn className="w-4 h-4 ml-2" />
              تسجيل الدخول
            </TabsTrigger>
            <TabsTrigger value="register" className="text-sm font-medium">
              <UserPlus className="w-4 h-4 ml-2" />
              إنشاء حساب جديد
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
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
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <ClientRegister 
              onSuccess={handleRegistrationSuccess}
              showHeader={false}
              className=""
            />
          </TabsContent>
        </Tabs>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 ml-2" />
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}