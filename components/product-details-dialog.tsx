"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package, ShoppingCart, Star, Tag, Eye, Info } from "lucide-react";
import { formatCurrencyEGP } from "@/lib/utils";
import { useCart } from "@/lib/contexts/cart-context";
import { useClientSession } from "@/lib/hooks/use-client-session";
import { notify } from "@/lib/notifications";
import ClientLoginDialog from "./client-login-dialog";

interface ProductDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any; // CartItem أو Product
}

export default function ProductDetailsDialog({
  isOpen,
  onClose,
  product,
}: ProductDetailsDialogProps) {
  const { addToCart, isInCart, getCartItem } = useCart();
  const { session: clientSession } = useClientSession();
  const [loading, setLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // فحص إضافي للتأكد من وجود المنتج
  if (!product) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">المنتج غير موجود</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              المنتج غير موجود
            </h3>
            <p className="text-gray-500 mb-4">
              لم يتم العثور على تفاصيل المنتج المطلوب
            </p>
            <Button onClick={onClose} variant="outline" size="sm">
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const cartItem = getCartItem(
    product?.ID || product?.IDProduct || 0,
    product?.selectedColor,
    product?.selectedSize
  );
  const isProductInCart = isInCart(
    product?.ID || product?.IDProduct || 0,
    product?.selectedColor,
    product?.selectedSize
  );

  const handleAddToCart = async () => {
    if (!product) {
      notify.error("لا يمكن إضافة منتج غير موجود");
      return;
    }

    if (!clientSession) {
      setPendingAction(() => () => addToCart(product, 1));
      setShowLoginDialog(true);
      return;
    }

    try {
      setLoading(true);
      await addToCart(product, 1);
      // notify.success(`تم إضافة ${product.Name || 'المنتج'} إلى السلة`)
    } catch (error) {
      console.error("Error adding product to cart:", error);
      notify.error("فشل في إضافة المنتج للسلة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {product?.BarCode && (
              <Badge className="bg-gray-100 text-gray-800">
                #{product.BarCode}
              </Badge>
            )}
            <DialogTitle className="text-right text-2xl font-bold text-gray-900">
              {product?.Name || "منتج غير محدد"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات المنتج */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-right">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-100 text-green-800">متوفر</Badge>
                    <h3 className="text-lg font-semibold text-gray-900">
                      معلومات المنتج
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {product?.ShopShortDiscription ||
                      product?.ShortDiscription ||
                      "منتج عالي الجودة"}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">الفئة:</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        فئة {product?.IDCategory || "غير محدد"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">الباركود:</span>
                      <Badge className="bg-gray-100 text-gray-800">
                        #{product?.BarCode || "غير محدد"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">الشركة المنتجة:</span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {product?.IDProductionCompany || "غير محدد"}
                      </Badge>
                    </div>

                    {cartItem && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">الكمية في السلة:</span>
                        <Badge className="bg-orange-100 text-orange-800">
                          {cartItem.Qty} قطعة
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  {product?.ImageURL ? (
                    <img
                      src={product.ImageURL}
                      alt={product?.Name || "منتج"}
                      className="w-48 h-48 object-contain rounded-lg border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        );
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-48 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-gray-200 ${
                      product?.ImageURL ? "hidden" : ""
                    }`}
                  >
                    <Package className="w-16 h-16 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 text-center">
                      صورة المنتج غير متوفرة
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3"
                  size="lg"
                  disabled={loading || isProductInCart}
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  {loading
                    ? "جاري الإضافة..."
                    : isProductInCart
                    ? "المنتج موجود في السلة"
                    : "إضافة للسلة"}
                </Button>

                {isProductInCart && (
                  <p className="text-sm text-green-600 text-center mt-2">
                    هذا المنتج موجود بالفعل في سلة التسوق
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* الأسعار */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-right">
              معلومات الأسعار
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2 text-right">
                  الأسعار
                </h4>
                <div className="space-y-2 text-sm text-right">
                  <div className="flex justify-between">
                    <span className="text-green-700">السعر الحالي:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrencyEGP(
                        product?.SalesPrice || product?.ShopPrice || 0
                      )}
                    </span>
                  </div>
                  {product?.PriceBeforDiscount &&
                    product.PriceBeforDiscount >
                      (product?.SalesPrice || product?.ShopPrice || 0) && (
                      <div className="flex justify-between">
                        <span className="text-green-700">السعر قبل الخصم:</span>
                        <span className="font-semibold text-gray-500 line-through">
                          {formatCurrencyEGP(product.PriceBeforDiscount)}
                        </span>
                      </div>
                    )}
                  {product?.DiscountValue && product.DiscountValue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-700">قيمة الخصم:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrencyEGP(product.DiscountValue)}
                      </span>
                    </div>
                  )}
                  {product?.DiscountPercent && product.DiscountPercent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-700">نسبة الخصم:</span>
                      <span className="font-semibold text-green-600">
                        {product.DiscountPercent}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 text-right">
                  إجماليات السلة
                </h4>
                <div className="space-y-2 text-sm text-right">
                  {cartItem && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-700">الكمية:</span>
                        <span className="font-semibold">{cartItem.Qty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">السعر الإجمالي:</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrencyEGP(cartItem.TotalSalesPrice || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">الخصم الإجمالي:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrencyEGP(cartItem.TotalDiscountValue || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* الوصف التفصيلي */}
          {(product?.ShopLongDiscription || product?.LongDescription) && (
            <>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-right">
                  وصف تفصيلي
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 text-right leading-relaxed">
                    {product?.ShopLongDiscription || product?.LongDescription}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* معلومات إضافية */}
          <Separator />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-right">
              معلومات إضافية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2 text-right">
                  تفاصيل المنتج
                </h4>
                <div className="space-y-1 text-sm text-right">
                  <div className="flex justify-between">
                    <span className="text-purple-700">معرف المنتج:</span>
                    <span className="font-mono">
                      {product?.ID || product?.IDProduct || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">الوحدة:</span>
                    <span>
                      {product?.UnitID || product?.UnitSmall_ID || "غير محدد"}
                    </span>
                  </div>
                  {product?.ShopColors && (
                    <div className="flex justify-between">
                      <span className="text-purple-700">الألوان المتوفرة:</span>
                      <span>{product.ShopColors}</span>
                    </div>
                  )}
                  {product?.ShopSizes && (
                    <div className="flex justify-between">
                      <span className="text-purple-700">
                        المقاسات المتوفرة:
                      </span>
                      <span>{product.ShopSizes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2 text-right">
                  إحصائيات
                </h4>
                <div className="space-y-1 text-sm text-right">
                  <div className="flex justify-between">
                    <span className="text-orange-700">سعر الشراء:</span>
                    <span className="font-semibold">
                      {formatCurrencyEGP(
                        product?.PurchasePrice ||
                          product?.UnitSmall_PurchasePrice ||
                          0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">هامش الربح:</span>
                    <span className="font-semibold">
                      {formatCurrencyEGP(
                        (product?.SalesPrice || product?.ShopPrice || 0) -
                          (product?.PurchasePrice ||
                            product?.UnitSmall_PurchasePrice ||
                            0)
                      )}
                    </span>
                  </div>
                  {cartItem && (
                    <div className="flex justify-between">
                      <span className="text-orange-700">إجمالي الربح:</span>
                      <span className="font-semibold">
                        {formatCurrencyEGP(cartItem.TotalProfitValue || 0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Client Login Dialog */}
      <ClientLoginDialog
        isOpen={showLoginDialog}
        onClose={() => {
          setShowLoginDialog(false);
          setPendingAction(null);
        }}
        onLoginSuccess={() => {
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        title="تسجيل دخول العميل"
        message="يجب تسجيل الدخول لإضافة المنتجات إلى السلة"
      />
    </Dialog>
  );
}
