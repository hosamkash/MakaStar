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

export default function SetupTestEmployee() {
  const [formData, setFormData] = useState({
    UserName: "admin",
    Password: "123456",
    Name: "مدير النظام",
    IsActive: true
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // إضافة موظف تجريبي
      const employeeData = {
        ...formData,
        ID: Date.now(), // استخدام timestamp كـ ID مؤقت
        Code: "EMP001",
        Mobile: "0123456789",
        Address: "عنوان تجريبي",
        Email: "admin@makastar.com",
        IDBranch: 1,
        IDJob: 1,
        IDDepartment: 1,
        IDMaritalStatus: 1,
        IDGender: 1,
        IDMilitaryStatus: 1,
        Age: 30,
        ChildrenCount: 2,
        TimeTotalWorkHour: 8,
        MonthlyVacationDays: 21,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }

      await addDoc(collection(db, "Dealing_Employees"), employeeData)
      
      setSuccess(true)
      setFormData({
        UserName: "admin",
        Password: "123456",
        Name: "مدير النظام",
        IsActive: true
      })
    } catch (error) {
      console.error("Error adding test employee:", error)
      setError("حدث خطأ في إضافة الموظف التجريبي")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-blue-600 mr-3" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              إعداد موظف تجريبي
            </CardTitle>
            <p className="text-gray-600">
              إضافة موظف تجريبي لاختبار نظام تسجيل الدخول
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="UserName">اسم المستخدم</Label>
                <Input
                  id="UserName"
                  value={formData.UserName}
                  onChange={(e) => setFormData(prev => ({ ...prev, UserName: e.target.value }))}
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="Password">كلمة المرور</Label>
                <Input
                  id="Password"
                  type="password"
                  value={formData.Password}
                  onChange={(e) => setFormData(prev => ({ ...prev, Password: e.target.value }))}
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="Name">اسم الموظف</Label>
                <Input
                  id="Name"
                  value={formData.Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, Name: e.target.value }))}
                  placeholder="أدخل اسم الموظف"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    تم إضافة الموظف التجريبي بنجاح!
                    <br />
                    يمكنك الآن تسجيل الدخول باستخدام:
                    <br />
                    اسم المستخدم: {formData.UserName}
                    <br />
                    كلمة المرور: {formData.Password}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الإضافة...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة موظف تجريبي
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                <p>هذه الصفحة مخصصة لإعداد موظف تجريبي للاختبار فقط</p>
                <p className="mt-1">بعد الإضافة، يمكنك حذف هذه الصفحة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
