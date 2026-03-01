"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Plus, CheckCircle } from "lucide-react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Client {
  UserName: string
  Password: string
  Name: string
  Email: string
  Mobile: string
  IsActive: boolean
}

export default function SetupTestClientPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const defaultClient: Client = {
    UserName: "client",
    Password: "123456",
    Name: "عميل تجريبي",
    Email: "client@test.com",
    Mobile: "0123456789",
    IsActive: true
  }

  const handleAddClient = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const clientsRef = collection(db, "Dealing_Clients")
      await addDoc(clientsRef, {
        ...defaultClient,
        ID: Date.now(), // استخدام timestamp كـ ID مؤقت
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      })

      setSuccess(true)
    } catch (error) {
      console.error("Error adding client:", error)
      setError("حدث خطأ في إضافة العميل")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إعداد عميل تجريبي</h1>
              <p className="text-gray-600">لاختبار نظام تسجيل دخول العملاء</p>
            </div>
          </div>
        </div>

        {/* Client Info Card */}
        <Card className="shadow-xl border-0 mb-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-gray-900">
              بيانات العميل التجريبي
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">اسم المستخدم:</Label>
                <div className="font-medium text-gray-900">{defaultClient.UserName}</div>
              </div>
              <div>
                <Label className="text-gray-600">كلمة المرور:</Label>
                <div className="font-medium text-gray-900">{defaultClient.Password}</div>
              </div>
              <div>
                <Label className="text-gray-600">الاسم:</Label>
                <div className="font-medium text-gray-900">{defaultClient.Name}</div>
              </div>
              <div>
                <Label className="text-gray-600">البريد الإلكتروني:</Label>
                <div className="font-medium text-gray-900">{defaultClient.Email}</div>
              </div>
              <div>
                <Label className="text-gray-600">رقم الهاتف:</Label>
                <div className="font-medium text-gray-900">{defaultClient.Mobile}</div>
              </div>
              <div>
                <Label className="text-gray-600">الحالة:</Label>
                <div className="font-medium text-green-600">نشط</div>
              </div>
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
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  تم إضافة العميل التجريبي بنجاح! يمكنك الآن استخدام بيانات تسجيل الدخول أعلاه.
                </AlertDescription>
              </Alert>
            )}

            {/* Add Button */}
            <Button
              onClick={handleAddClient}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              disabled={loading || success}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الإضافة...
                </div>
              ) : success ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  تم الإضافة بنجاح
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة العميل التجريبي
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              تعليمات الاستخدام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>اضغط على "إضافة العميل التجريبي" لإنشاء حساب تجريبي</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>استخدم بيانات تسجيل الدخول المعروضة أعلاه</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>اذهب إلى صفحة تسجيل دخول العملاء: <code className="bg-gray-100 px-1 rounded">/client-login</code></p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>بعد تسجيل الدخول يمكنك إضافة المنتجات إلى السلة</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            هذه الصفحة مخصصة للاختبار فقط
          </p>
        </div>
      </div>
    </div>
  )
}
