'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Receipt, Download, Eye, Filter, Search } from 'lucide-react'
import { useClientSession } from '@/lib/hooks/use-client-session'
import { formatCurrencyEGP } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'payment' | 'refund' | 'withdrawal'
  amount: number
  description: string
  date: string
  status: 'completed' | 'pending' | 'failed'
  reference: string
}

export default function TransactionsPage() {
  const router = useRouter()
  const { session: clientSession } = useClientSession()
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'payment',
      amount: 150.00,
      description: 'دفع طلب #1001',
      date: '2024-01-15',
      status: 'completed',
      reference: 'TXN-001'
    },
    {
      id: '2',
      type: 'refund',
      amount: -25.50,
      description: 'استرداد جزئي لطلب #1000',
      date: '2024-01-10',
      status: 'completed',
      reference: 'TXN-002'
    },
    {
      id: '3',
      type: 'payment',
      amount: 75.25,
      description: 'دفع طلب #999',
      date: '2024-01-05',
      status: 'completed',
      reference: 'TXN-003'
    },
    {
      id: '4',
      type: 'payment',
      amount: 200.00,
      description: 'دفع طلب #998',
      date: '2024-01-01',
      status: 'pending',
      reference: 'TXN-004'
    }
  ])

  // Redirect if not logged in
  if (!clientSession) {
    router.push('/account_client/client-login')
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل'
      case 'pending':
        return 'قيد المعالجة'
      case 'failed':
        return 'فشل'
      default:
        return 'غير معروف'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return '💳'
      case 'refund':
        return '↩️'
      case 'withdrawal':
        return '💸'
      default:
        return '📄'
    }
  }

  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

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
            <h1 className="text-lg font-bold">سجل المعاملات</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-blue-700 p-1"
            >
              <Filter className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-blue-700 p-1"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">إجمالي المعاملات</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrencyEGP(totalAmount)}
                </p>
                <p className="text-sm text-gray-500">
                  {transactions.length} معاملة
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {transaction.description}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString('ar-EG')}
                      </p>
                      <p className="text-xs text-gray-500">
                        المرجع: {transaction.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}{formatCurrencyEGP(transaction.amount)}
                    </div>
                    <Badge className={`mt-1 ${getStatusColor(transaction.status)}`}>
                      {getStatusText(transaction.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    <Eye className="w-4 h-4 ml-1" />
                    عرض التفاصيل
                  </Button>
                  <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                    <Download className="w-4 h-4 ml-1" />
                    تحميل الإيصال
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {transactions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد معاملات</h3>
              <p className="text-gray-500 mb-4">لم تقم بأي معاملات بعد</p>
              <Button asChild>
                <a href="/store">تصفح المتجر</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More Button */}
        {transactions.length > 0 && (
          <div className="text-center mt-6">
            <Button variant="outline">
              تحميل المزيد
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
