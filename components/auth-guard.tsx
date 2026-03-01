"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, LogOut, User } from "lucide-react"
import { useAdminSession } from "@/lib/hooks/use-admin-session"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { session, isLoading, isAuthenticated, logout } = useAdminSession()

  const handleLogout = () => {
    logout()
    router.push("/account_employee")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-red-500 mr-3" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              الوصول مرفوض
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                يجب تسجيل الدخول للوصول إلى لوحة التحكم
              </AlertDescription>
            </Alert>
            
            <div className="text-center text-sm text-gray-600">
              <p>فقط الموظفين المسجلين يمكنهم الوصول إلى هذه الصفحة</p>
            </div>

            <Button 
              onClick={() => router.push("/account_employee")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <User className="w-4 h-4 ml-2" />
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                لوحة تحكم مكة ستار
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span>مرحباً، </span>
                <span className="font-medium text-gray-900">{session?.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}
