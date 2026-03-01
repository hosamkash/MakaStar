'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Package, Eye, X, Grid3X3, List } from 'lucide-react'
import Link from 'next/link'
import { formatCurrencyEGP } from '@/lib/utils'
import ProductGalleryDialog from '@/components/product-gallery-dialog'

interface ClientFavoritesTabProps {
  favorites: any[]
  onRemoveFromFavorites: (productId: number) => void
}

export default function ClientFavoritesTab({
  favorites,
  onRemoveFromFavorites
}: ClientFavoritesTabProps) {
  const [favoritesViewMode, setFavoritesViewMode] = useState<"list" | "cards">("cards")
  const [selectedFavoriteProduct, setSelectedFavoriteProduct] = useState<any>(null)
  const [showFavoriteProductDialog, setShowFavoriteProductDialog] = useState(false)

  const openFavoriteProductDialog = (favorite: any) => {
    setSelectedFavoriteProduct(favorite)
    setShowFavoriteProductDialog(true)
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* View Mode Toggle */}
            {favorites.length > 0 && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-sm font-medium text-gray-700 ml-2">طريقة العرض:</span>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <Button
                    variant={favoritesViewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFavoritesViewMode("list")}
                    className="rounded-none px-4 py-2 text-xs font-medium"
                    title="عرض قائمة"
                  >
                    <List className="w-4 h-4 ml-1" />
                    قائمة
                  </Button>
                  <Button
                    variant={favoritesViewMode === "cards" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFavoritesViewMode("cards")}
                    className="rounded-none px-4 py-2 text-xs font-medium"
                    title="عرض كروت"
                  >
                    <Grid3X3 className="w-4 h-4 ml-1" />
                    كروت
                  </Button>
                </div>
              </div>
            )}
            
            {favorites.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600 mb-2">لا توجد منتجات مفضلة</p>
                <Link href="/store" className="text-blue-600 text-xs">تصفح المنتجات</Link>
              </div>
            ) : (
              <>
                {/* List View */}
                {favoritesViewMode === "list" && (
                  <div className="space-y-3">
                    {favorites.map((favorite) => (
                      <div key={favorite.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => openFavoriteProductDialog(favorite)}>
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          {favorite.productImage ? (
                            <img 
                              src={favorite.productImage} 
                              alt={favorite.productName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium text-gray-900 mb-1">{favorite.productName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>#{favorite.productId}</span>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              فئة 1
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-blue-600 mt-1">{formatCurrencyEGP(favorite.productPrice)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFavoriteProductDialog(favorite);
                            }}
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromFavorites(favorite.productId);
                            }}
                            title="إزالة من المفضلة"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cards View */}
                {favoritesViewMode === "cards" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {favorites.map((favorite) => (
                      <Card 
                        key={favorite.id} 
                        className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col cursor-pointer"
                        onClick={() => openFavoriteProductDialog(favorite)}
                      >
                        <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                          {favorite.productImage ? (
                            <img 
                              src={favorite.productImage} 
                              alt={favorite.productName}
                              className="w-full h-full object-contain rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <Package className="w-16 h-16 text-gray-400" />
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 text-white text-xs">
                              متوفر
                            </Badge>
                          </div>
                          <div className="absolute top-2 left-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFromFavorites(favorite.productId);
                              }}
                              className="rounded-full w-7 h-7 p-0 text-red-600 bg-red-50 hover:bg-red-100"
                              title="إزالة من المفضلة"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-3 flex-1 flex flex-col">
                          <div className="flex-1">
                            <h3 className="font-bold text-sm text-gray-900 mb-2 text-right line-clamp-2 leading-tight">{favorite.productName}</h3>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">#{favorite.productId}</span>
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                فئة 1
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-right">
                                <div className="font-bold text-lg text-gray-900">{formatCurrencyEGP(favorite.productPrice)}</div>
                              </div>
                            </div>
                            <Button 
                              className="w-full" 
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openFavoriteProductDialog(favorite);
                              }}
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-3 h-3 ml-1" />
                              عرض التفاصيل
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Product Details Dialog */}
      <ProductGalleryDialog
        isOpen={showFavoriteProductDialog}
        onClose={() => {
          setShowFavoriteProductDialog(false)
          setSelectedFavoriteProduct(null)
        }}
        product={selectedFavoriteProduct}
      />
    </>
  )
}
