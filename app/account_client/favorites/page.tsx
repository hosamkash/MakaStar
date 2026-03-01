'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, ShoppingCart, Eye, Trash2, Package } from 'lucide-react'
import { useClientSession } from '@/lib/hooks/use-client-session'
import { formatCurrencyEGP } from '@/lib/utils'
import Image from 'next/image'

interface FavoriteProduct {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  imageUrl?: string
  category: string
  isInStock: boolean
}

export default function FavoritesPage() {
  const router = useRouter()
  const { session: clientSession } = useClientSession()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([
    {
      id: '1',
      name: 'منتج إلكتروني متطور',
      description: 'منتج إلكتروني عالي الجودة مع ميزات متقدمة',
      price: 150.00,
      originalPrice: 200.00,
      imageUrl: '/placeholder.jpg',
      category: 'الإلكترونيات',
      isInStock: true
    },
    {
      id: '2',
      name: 'منتج منزلي مفيد',
      description: 'منتج منزلي عملي ومفيد للاستخدام اليومي',
      price: 75.50,
      imageUrl: '/placeholder.jpg',
      category: 'المنزل',
      isInStock: true
    },
    {
      id: '3',
      name: 'منتج أزياء أنيق',
      description: 'منتج أزياء أنيق وعصري يناسب جميع المناسبات',
      price: 120.00,
      originalPrice: 150.00,
      imageUrl: '/placeholder.jpg',
      category: 'الأزياء',
      isInStock: false
    }
  ])

  // Redirect if not logged in
  if (!clientSession) {
    router.push('/account_client/client-login')
    return null
  }

  const handleRemoveFavorite = (id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id))
  }

  const handleAddToCart = (product: FavoriteProduct) => {
    // Here you would typically add the product to cart
    console.log('Adding to cart:', product)
  }

  const handleViewProduct = (product: FavoriteProduct) => {
    // Here you would typically navigate to product details
    console.log('Viewing product:', product)
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
            <h1 className="text-lg font-bold">منتجاتي المفضلة</h1>
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Summary */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            المنتجات المفضلة ({favorites.length})
          </h2>
          <p className="text-gray-600">
            المنتجات التي أضفتها إلى قائمة المفضلة
          </p>
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative">
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                {/* Remove from favorites button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveFavorite(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                {/* Stock status */}
                {!product.isInStock && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="text-xs">
                      نفذ المخزون
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrencyEGP(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrencyEGP(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="text-xs text-green-600 mt-1">
                      خصم {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewProduct(product)}
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    عرض
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!product.isInStock}
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="w-4 h-4 ml-1" />
                    إضافة للسلة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {favorites.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد منتجات مفضلة</h3>
              <p className="text-gray-500 mb-4">لم تقم بإضافة أي منتجات إلى المفضلة بعد</p>
              <Button asChild>
                <a href="/store">تصفح المتجر</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {favorites.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                // Add all to cart logic
                console.log('Adding all to cart')
              }}
            >
              <ShoppingCart className="w-4 h-4 ml-2" />
              إضافة الكل للسلة
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                // Clear all favorites logic
                if (confirm('هل أنت متأكد من حذف جميع المنتجات المفضلة؟')) {
                  setFavorites([])
                }
              }}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف الكل
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
