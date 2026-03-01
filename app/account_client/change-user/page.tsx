'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useClientSession } from '@/lib/hooks/use-client-session'
import { notify } from '@/lib/notifications'

export default function ChangeUserPage() {
  const router = useRouter()
  const { session: clientSession } = useClientSession()
  const [formData, setFormData] = useState({
    currentUsername: clientSession?.username || '',
    newUsername: '',
    confirmUsername: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect if not logged in
  if (!clientSession) {
    router.push('/account_client/client-login')
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('') // Clear error when user types
  }

  const validateForm = () => {
    if (!formData.newUsername.trim()) {
      setError('اسم المستخدم الجديد مطلوب')
      return false
    }
    if (formData.newUsername.length < 3) {
      setError('اسم المستخدم الجديد يجب أن يكون 3 أحرف على الأقل')
      return false
    }
    if (formData.newUsername.length > 20) {
      setError('اسم المستخدم الجديد يجب أن يكون أقل من 20 حرف')
      return false
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.newUsername)) {
      setError('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط')
      return false
    }
    if (formData.newUsername !== formData.confirmUsername) {
      setError('اسم المستخدم الجديد وتأكيده غير متطابقين')
      return false
    }
    if (formData.currentUsername === formData.newUsername) {
      setError('اسم المستخدم الجديد يجب أن يكون مختلفاً عن الحالي')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Here you would typically call an API to change the username
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSuccess(true)
      notify('تم تغيير اسم المستخدم بنجاح', 'success')
      
      // Redirect back to account page after 2 seconds
      setTimeout(() => {
        router.push('/account_client')
      }, 2000)
      
    } catch (err) {
      console.error('Error changing username:', err)
      setError('حدث خطأ أثناء تغيير اسم المستخدم')
      notify('حدث خطأ أثناء تغيير اسم المستخدم', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-blue-700 p-1"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">تغيير المستخدم</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold">تغيير اسم المستخدم</CardTitle>
              <p className="text-gray-600 mt-2">
                أدخل اسم المستخدم الجديد
              </p>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">تم تغيير اسم المستخدم بنجاح!</h3>
                  <p className="text-gray-600">سيتم تحويلك إلى صفحة الحساب...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Current Username */}
                  <div className="space-y-2">
                    <Label htmlFor="currentUsername">اسم المستخدم الحالي</Label>
                    <Input
                      id="currentUsername"
                      value={formData.currentUsername}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  {/* New Username */}
                  <div className="space-y-2">
                    <Label htmlFor="newUsername">اسم المستخدم الجديد</Label>
                    <Input
                      id="newUsername"
                      value={formData.newUsername}
                      onChange={(e) => handleInputChange('newUsername', e.target.value)}
                      placeholder="أدخل اسم المستخدم الجديد"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      3-20 حرف، أحرف إنجليزية وأرقام وشرطة سفلية فقط
                    </p>
                  </div>

                  {/* Confirm New Username */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmUsername">تأكيد اسم المستخدم الجديد</Label>
                    <Input
                      id="confirmUsername"
                      value={formData.confirmUsername}
                      onChange={(e) => handleInputChange('confirmUsername', e.target.value)}
                      placeholder="أعد إدخال اسم المستخدم الجديد"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري تغيير اسم المستخدم...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 ml-2" />
                        تغيير اسم المستخدم
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
