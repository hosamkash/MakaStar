"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ShoppingCart,
  Package,
  CreditCard,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Percent,
  Truck,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { formatCurrencyEGP } from "@/lib/utils";

interface ClientCartTabProps {
  cartState: {
    totalItems: number;
    totalAfterDiscount: number;
    totalPrice: number;
    totalDiscount: number;
    items: any[];
  };
}

export default function ClientCartTab({ cartState }: ClientCartTabProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["summary"])
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {cartState.totalItems === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-3">السلة فارغة</p>
              <Link
                href="/store"
                className="text-blue-600 text-xs hover:underline"
              >
                تصفح المنتجات
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Cart Summary - Collapsible */}
              <Collapsible
                open={openSections.has("summary")}
                onOpenChange={() => toggleSection("summary")}
              >
                <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <CollapsibleTrigger className="w-full">
                    <div className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-right">
                            <h5 className="text-lg font-semibold text-gray-900">
                              ملخص السلة
                            </h5>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {cartState.totalItems} منتج
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {formatCurrencyEGP(cartState.totalPrice)}{" "}
                                المجموع الفرعي
                              </span>
                              {cartState.totalDiscount > 0 && (
                                <span className="flex items-center gap-1">
                                  <Percent className="w-4 h-4" />
                                  خصم{" "}
                                  {formatCurrencyEGP(cartState.totalDiscount)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600">
                              {formatCurrencyEGP(cartState.totalAfterDiscount)}
                            </div>
                            <div className="text-sm text-gray-500">
                              الإجمالي النهائي
                            </div>
                          </div>
                          <div className="text-gray-400">
                            {openSections.has("summary") ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-gray-200 p-4 space-y-4">
                      {/* Detailed Financial Summary */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h6 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          التفاصيل المالية
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">
                              عدد المنتجات
                            </div>
                            <div className="text-base font-semibold text-gray-900">
                              {cartState.totalItems} منتج
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">
                              المجموع الفرعي
                            </div>
                            <div className="text-base font-semibold text-gray-900">
                              {formatCurrencyEGP(cartState.totalPrice)}
                            </div>
                          </div>
                          {cartState.totalDiscount > 0 && (
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-1">
                                إجمالي الخصومات
                              </div>
                              <div className="text-base font-semibold text-green-600">
                                -{formatCurrencyEGP(cartState.totalDiscount)}
                              </div>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">
                              الإجمالي النهائي
                            </div>
                            <div className="text-base font-semibold text-blue-600">
                              {formatCurrencyEGP(cartState.totalAfterDiscount)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cart Actions */}
                      <div className="space-y-2">
                        <Link
                          href="/cart"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          عرض السلة الكاملة
                        </Link>

                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href="/store"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <Package className="w-3 h-3" />
                            إضافة منتجات
                          </Link>
                          <Link
                            href="/checkout"
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <CreditCard className="w-3 h-3" />
                            إتمام الطلب
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Cart Items - Direct Display */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-right">
                        <h5 className="text-lg font-semibold text-gray-900">
                          منتجات السلة
                        </h5>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {cartState.items.length} منتج
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            إجمالي {formatCurrencyEGP(cartState.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-sm">
                      {cartState.items.length} منتج
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cartState.items.map((item, index) => (
                      <div
                        key={`${item.ID || item.IDProduct}-${
                          item.SelectedColor || "default"
                        }-${item.SelectedSize || "default"}-${index}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                          {item.ImageURL ? (
                            <img
                              key={`client-cart-image-${item.IDProduct}-${
                                item.SelectedColor || "default"
                              }-${item.SelectedSize || "default"}`}
                              src={item.ImageURL}
                              alt={item.Name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {item.Name}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              الكمية: {item.Qty}
                            </span>
                            <span className="text-gray-600">
                              السعر: {formatCurrencyEGP(item.SalesPrice || 0)}
                            </span>
                            <span className="font-semibold text-blue-600">
                              المجموع:{" "}
                              {formatCurrencyEGP(item.TotalSalesPrice || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
