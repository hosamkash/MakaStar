'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Menu, 
  LogOut,
  User
} from 'lucide-react'
import { useClientSession } from '@/lib/hooks/use-client-session'
import { useClientData } from '@/lib/hooks/use-client-data'
import { CartProvider, useCart } from '@/lib/contexts/cart-context'
import { useFavorites } from '@/lib/hooks/use-favorites'
import {
  ClientProfileTab,
  ClientOrdersTab,
  ClientCartTab,
  ClientFavoritesTab,
  ClientPaymentMethodsTab,
  ClientTransactionsTab
} from '@/components/account-client'

function AccountPageContent() {
  const router = useRouter()
  const { session: clientSession, logout: clientLogout, isLoading } = useClientSession()
  const { state: cartState } = useCart()
  const { favorites, removeFromFavorites } = useFavorites()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // استخدام الـ hook المشترك لإدارة بيانات العميل
  const {
    clientData,
    setClientData,
    locationData,
    setLocationData,
    isLoadingData,
    orders,
    isLoadingOrders,
    handleSaveChanges,
    handleGetLocation,
    handleClearLocation,
    handleOpenMap,
    handleGetAddressFromLocation,
    refreshData
  } = useClientData()


  const handleLogout = async () => {
    await clientLogout()
    router.push('/')
  }

  // Redirect if not logged in
  useEffect(() => {
    if (!clientSession && !isLoading) {
      router.push('/account_client/client-login')
    }
  }, [clientSession, isLoading, router])

  if (!clientSession && !isLoading) {
    return null
  }

  // Show loading while checking session
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
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
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src="/maka-star-logo.png" 
              alt="مكه ستار" 
              className="w-6 h-6 object-contain"
            />
            <h1 className="text-lg font-bold">حسابك</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-blue-700 p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-4 max-w-4xl">
        {/* Profile Information */}
        <Card className="mb-4">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-blue-200">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {clientData.name || clientSession?.name || ''}
            </h2>
            <p className="text-sm text-gray-500">
              {clientData.username || clientSession?.username || ''}
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4 gap-2">
            <TabsTrigger value="profile" className="text-xs px-2 py-2 font-medium">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs px-2 py-2 font-medium">طلباتي الحالية</TabsTrigger>
            <TabsTrigger value="cart" className="text-xs px-2 py-2 font-medium">سلة المشتريات</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs px-2 py-2 font-medium">منتجاتي المفضلة</TabsTrigger>
            <TabsTrigger value="payment-methods" className="text-xs px-2 py-2 font-medium">طرق الدفع</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs px-2 py-2 font-medium">مشترياتي السابقة</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <ClientProfileTab
              clientData={clientData}
              locationData={locationData}
              onClientDataChange={setClientData}
              onLocationDataChange={setLocationData}
              onSaveChanges={handleSaveChanges}
              onGetLocation={handleGetLocation}
              onClearLocation={handleClearLocation}
              onOpenMap={handleOpenMap}
              onGetAddressFromLocation={handleGetAddressFromLocation}
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <ClientOrdersTab
              orders={orders}
              isLoadingOrders={isLoadingOrders}
              onRefresh={refreshData}
            />
          </TabsContent>

          {/* Cart Tab */}
          <TabsContent value="cart" className="space-y-4">
            <ClientCartTab
              cartState={cartState}
            />
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            <ClientFavoritesTab
              favorites={favorites}
              onRemoveFromFavorites={removeFromFavorites}
            />
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods" className="space-y-4">
            <ClientPaymentMethodsTab />
          </TabsContent>

          {/* Transactions Tab - Previous Purchases */}
          <TabsContent value="transactions" className="space-y-4">
            <ClientTransactionsTab
              orders={orders}
              isLoadingOrders={isLoadingOrders}
            />
          </TabsContent>
        </Tabs>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full text-red-600 border-red-200 hover:bg-red-50 text-sm py-3 mt-4"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <CartProvider>
      <AccountPageContent />
    </CartProvider>
  )
}
