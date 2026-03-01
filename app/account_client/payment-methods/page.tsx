'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CreditCard, Plus, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useClientSession } from '@/lib/hooks/use-client-session'
import { notify } from '@/lib/notifications'

interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  name: string
  number: string
  expiry?: string
  isDefault: boolean
}

export default function PaymentMethodsPage() {
  const router = useRouter()
  const { session: clientSession } = useClientSession()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'بطاقة فيزا',
      number: '**** **** **** 1234',
      expiry: '12/25',
      isDefault: true
    },
    {
      id: '2',
      type: 'bank',
      name: 'البنك الأهلي المصري',
      number: '**** **** **** 5678',
      isDefault: false
    }
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if not logged in
  if (!clientSession) {
    router.push('/account_client/client-login')
    return null
  }

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // Here you would typically call an API to add payment method
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setShowAddForm(false)
      setSuccess('تم إضافة طريقة الدفع بنجاح')
      notify('تم إضافة طريقة الدفع بنجاح', 'success')
      
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (err) {
      console.error('Error adding payment method:', err)
      setError('حدث خطأ أثناء إضافة طريقة الدفع')
      notify('حدث خطأ أثناء إضافة طريقة الدفع', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePaymentMethod = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Here you would typically call an API to remove payment method
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPaymentMethods(prev => prev.filter(method => method.id !== id))
      setSuccess('تم حذف طريقة الدفع بنجاح')
      notify('تم حذف طريقة الدفع بنجاح', 'success')
      
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (err) {
      console.error('Error removing payment method:', err)
      setError('حدث خطأ أثناء حذف طريقة الدفع')
      notify('حدث خطأ أثناء حذف طريقة الدفع', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      // Here you would typically call an API to set default payment method
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        isDefault: method.id === id
      })))
      setSuccess('تم تعيين طريقة الدفع الافتراضية بنجاح')
      notify('تم تعيين طريقة الدفع الافتراضية بنجاح', 'success')
      
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (err) {
      console.error('Error setting default payment method:', err)
      setError('حدث خطأ أثناء تعيين طريقة الدفع الافتراضية')
      notify('حدث خطأ أثناء تعيين طريقة الدفع الافتراضية', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-blue-700 p-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">طرق الدفع</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-blue-700 p-1"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Payment Methods List */}
        <div className="space-y-4 mb-6">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.number}</p>
                      {method.expiry && (
                        <p className="text-xs text-gray-500">ينتهي في {method.expiry}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        افتراضي
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={isLoading}
                      >
                        تعيين افتراضي
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Payment Method Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">إضافة طريقة دفع جديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">اسم البطاقة</Label>
                  <Input
                    id="cardName"
                    placeholder="أدخل اسم البطاقة"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">رقم البطاقة</Label>
                  <Input
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الإضافة...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    disabled={isLoading}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {paymentMethods.length === 0 && !showAddForm && (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد طرق دفع</h3>
              <p className="text-gray-500 mb-4">لم تقم بإضافة أي طرق دفع بعد</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة طريقة دفع
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
