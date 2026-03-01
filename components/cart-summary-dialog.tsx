"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/lib/contexts/cart-context";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Eye,
  Check,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface CartSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  showSuccessMessage?: boolean;
}

export default function CartSummaryDialog({
  isOpen,
  onClose,
  showSuccessMessage = false,
}: CartSummaryDialogProps) {
  const { state: cartState, updateQuantity, removeFromCart } = useCart();
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);

  const handleQuantityChange = async (
    IDProduct: number,
    newQuantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    if (newQuantity < 1) return;

    setIsUpdating(IDProduct);
    try {
      await updateQuantity(IDProduct, newQuantity, selectedColor, selectedSize);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (
    IDProduct: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    setIsUpdating(IDProduct);
    try {
      await removeFromCart(IDProduct, selectedColor, selectedSize);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleProductClick = (item: any) => {
    setSelectedProduct(item);
    setShowProductDialog(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
    }).format(price);
  };

  if (cartState.items.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <ShoppingCart className="w-5 h-5" />
              سلة التسوق
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              السلة فارغة
            </h3>
            <p className="text-gray-600 mb-6">
              لم تقم بإضافة أي منتجات إلى السلة بعد
            </p>
            <Button onClick={onClose} className="w-full">
              متابعة التسوق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] flex flex-col"
        dir="rtl"
      >
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingCart className="w-5 h-5" />
            {showSuccessMessage ? "تم إضافة المنتج بنجاح" : "ملخص السلة"}
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 text-xs"
            >
              {cartState.totalItems} منتج
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-green-700 font-medium text-sm">
                تم إضافة المنتج بنجاح إلى السلة
              </span>
            </div>
          </div>
        )}

        {/* قائمة المنتجات - قابلة للتمرير */}
        <div className="flex-1 min-h-0 max-h-80">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-2">
              {cartState.items.map((item, index) => (
                <div
                  key={`${item.IDProduct}-${item.SelectedColor || "default"}-${
                    item.SelectedSize || "default"
                  }-${index}`}
                  className="flex gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                  onClick={() => handleProductClick(item)}
                >
                  {/* صورة المنتج */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      {item.ImageURL ? (
                        <Image
                          key={`summary-image-${item.IDProduct}-${
                            item.SelectedColor || "default"
                          }-${item.SelectedSize || "default"}`}
                          src={item.ImageURL}
                          alt={item.Name || ""}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* تفاصيل المنتج */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-xs truncate mb-1">
                          {item.Name}
                        </h4>
                        {item.isOffer && (
                          <Badge
                            variant="outline"
                            className="text-xs mt-1 bg-orange-50 text-orange-700 border-orange-200"
                          >
                            عرض
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-gray-900">
                            {formatPrice(item.SalesPrice || 0)}
                          </span>
                          {item.DiscountValue && item.DiscountValue > 0 && (
                            <span className="text-xs text-green-600 bg-green-50 px-1 py-0.5 rounded-full">
                              خصم {formatPrice(item.DiscountValue)}
                            </span>
                          )}
                        </div>
                        {(item.SelectedColor || item.SelectedSize) && (
                          <div className="mt-1 text-xs text-gray-700 flex items-center gap-3">
                            {item.SelectedColor && (
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded-full border bg-gray-200" />
                                <span>اللون: {item.SelectedColor}</span>
                              </span>
                            )}
                            {item.SelectedSize && (
                              <span>
                                المقاس: {item.SelectedSize}
                                {item.SelectedFitting
                                  ? ` - ${item.SelectedFitting}`
                                  : ""}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* زر الحذف */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveItem(
                            item.IDProduct!,
                            item.SelectedColor,
                            item.SelectedSize
                          )
                        }
                        disabled={isUpdating === item.IDProduct}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* التحكم في الكمية */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(
                              item.IDProduct!,
                              (item.Qty || 1) - 1,
                              item.SelectedColor,
                              item.SelectedSize
                            )
                          }
                          disabled={
                            isUpdating === item.IDProduct ||
                            (item.Qty || 1) <= 1
                          }
                          className="w-6 h-6 p-0 rounded-full border"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>

                        <span className="text-xs font-semibold min-w-[1.5rem] text-center bg-gray-100 px-1 py-0.5 rounded">
                          {isUpdating === item.IDProduct ? "..." : item.Qty}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(
                              item.IDProduct!,
                              (item.Qty || 1) + 1,
                              item.SelectedColor,
                              item.SelectedSize
                            )
                          }
                          disabled={isUpdating === item.IDProduct}
                          className="w-6 h-6 p-0 rounded-full border"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-900">
                          {formatPrice(item.TotalSalesPrice || 0)}
                        </div>
                        {item.TotalDiscountValue &&
                          item.TotalDiscountValue > 0 && (
                            <div className="text-xs text-green-600">
                              توفير {formatPrice(item.TotalDiscountValue)}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ملخص الإجماليات - ثابت */}
        <div className="flex-shrink-0 border-t border-gray-200 pt-4 mt-4 bg-gray-50 rounded-lg p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">إجمالي المنتجات:</span>
              <span className="font-medium">
                {formatPrice(cartState.totalPrice)}
              </span>
            </div>

            {cartState.totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>إجمالي الخصم:</span>
                <span>-{formatPrice(cartState.totalDiscount)}</span>
              </div>
            )}

            {cartState.appliedOffer && (
              <div className="flex justify-between text-blue-600">
                <span>خصم العرض ({cartState.appliedOffer.Name}):</span>
                <span>-{formatPrice(cartState.offerDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">الشحن والتوصيل:</span>
              <span className="font-medium">
                {formatPrice(cartState.shipping)}
              </span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between text-sm font-bold">
              <span>الإجمالي النهائي:</span>
              <span className="text-primary">
                {formatPrice(cartState.finalTotal)}
              </span>
            </div>
          </div>

          {/* الأزرار - ثابتة */}
          <div className="flex flex-col gap-2 mt-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full text-xs py-2 rounded-lg border hover:bg-gray-50"
            >
              <ShoppingBag className="w-3 h-3 ml-2" />
              متابعة التسوق
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                asChild
                variant="outline"
                className="w-full text-xs py-2 rounded-lg border hover:bg-gray-50"
                onClick={onClose}
              >
                <Link href="/cart">
                  <Eye className="w-3 h-3 ml-2" />
                  عرض كامل السلة
                </Link>
              </Button>

              <Button
                asChild
                className="w-full text-xs py-2 rounded-lg bg-primary hover:bg-primary/90"
                onClick={onClose}
              >
                <Link href="/checkout">
                  <CreditCard className="w-3 h-3 ml-2" />
                  إتمام الطلب
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* ديالوج عرض المنتج السريع */}
      {showProductDialog && selectedProduct && (
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent
            className="sm:max-w-2xl max-h-[90vh] flex flex-col"
            dir="rtl"
          >
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <ExternalLink className="w-5 h-5" />
                عرض المنتج
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* صورة المنتج */}
              <div className="flex-shrink-0">
                <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border">
                  {selectedProduct.ImageURL ? (
                    <Image
                      src={selectedProduct.ImageURL}
                      alt={selectedProduct.Name || ""}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ShoppingCart className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* تفاصيل المنتج */}
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {selectedProduct.Name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          متوفر
                        </Badge>
                        <Badge variant="outline">
                          فئة {selectedProduct.IDCategory}
                        </Badge>
                      </div>
                    </div>

                    {/* الخيارات المختارة */}
                    {(selectedProduct.SelectedColor ||
                      selectedProduct.SelectedSize) && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">
                          الخيارات المختارة:
                        </h4>
                        <div className="space-y-1">
                          {selectedProduct.SelectedColor && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                اللون:
                              </span>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border-2 border-gray-300"
                                  style={{
                                    backgroundColor:
                                      selectedProduct.SelectedColorHex ||
                                      "#ccc",
                                  }}
                                />
                                <span className="text-sm font-medium">
                                  {selectedProduct.SelectedColor}
                                </span>
                              </div>
                            </div>
                          )}
                          {selectedProduct.SelectedSize && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                المقاس:
                              </span>
                              <span className="text-sm font-medium">
                                {selectedProduct.SelectedSize}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* الأسعار */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">الأسعار:</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            السعر الحالي:
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(selectedProduct.SalesPrice || 0)}
                          </span>
                        </div>
                        {selectedProduct.PriceBeforDiscount &&
                          selectedProduct.PriceBeforDiscount >
                            selectedProduct.SalesPrice && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                السعر قبل الخصم:
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(
                                  selectedProduct.PriceBeforDiscount
                                )}
                              </span>
                            </div>
                          )}
                        {selectedProduct.DiscountValue &&
                          selectedProduct.DiscountValue > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                قيمة الخصم:
                              </span>
                              <span className="text-sm text-green-600">
                                -{formatPrice(selectedProduct.DiscountValue)}
                              </span>
                            </div>
                          )}
                        {selectedProduct.DiscountPercent &&
                          selectedProduct.DiscountPercent > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                نسبة الخصم:
                              </span>
                              <span className="text-sm text-green-600">
                                {selectedProduct.DiscountPercent}%
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* الكمية الحالية */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">
                        الكمية في السلة:
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">الكمية:</span>
                        <span className="text-lg font-bold text-primary">
                          {selectedProduct.Qty}
                        </span>
                      </div>
                    </div>

                    {/* الإجمالي */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">
                          الإجمالي:
                        </span>
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(selectedProduct.TotalSalesPrice || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex-shrink-0 border-t pt-4 mt-4">
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowProductDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إغلاق
                </Button>
                <Button asChild className="flex-1">
                  <Link href={`/store/product/${selectedProduct.IDProduct}`}>
                    <ExternalLink className="w-4 h-4 ml-2" />
                    عرض كامل
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
