'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function ClientPaymentMethodsTab() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-center mb-3">
            <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-900">طرق الدفع</h3>
            <p className="text-xs text-gray-500">إدارة طرق الدفع الخاصة بك</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 mb-2">لا توجد طرق دفع محفوظة</p>
            <Link href="/account_client/payment-methods" className="text-blue-600 text-xs">إضافة طريقة دفع</Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
