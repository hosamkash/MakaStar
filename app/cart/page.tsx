"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  Eye,
  Gift,
  Share2,
  Edit3,
  FileText,
  Bug,
  X,
  Save,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrencyEGP } from "@/lib/utils";
import { OffersService } from "@/lib/services/offers-service";
import { notify } from "@/lib/notifications";
import ProductDetailsDialog from "@/components/product-details-dialog";
import OfferDetailsDialog from "@/components/offer-details-dialog";
import ProductGalleryDialog from "@/components/product-gallery-dialog";
import OrderFinancialSummary from "@/components/order-financial-summary";
import PersonalSponsor from "@/components/personal-sponsor";
import { CartService } from "@/lib/services/cart-service";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function CartPage() {
  const router = useRouter();
  const {
    state: cartState,
    removeFromCart,
    updateQuantity,
    updateItemNotes,
    applyOffer,
    clearCart,
    syncWithFirebase,
    loadFromFirebase,
    isFirebaseEnabled,
    isLoading,
  } = useCart();
  const [loading, setLoading] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);
  const [editingNotes, setEditingNotes] = useState<{ [key: number]: string }>(
    {}
  );
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [currentEditingItem, setCurrentEditingItem] = useState<any>(null);

  // حالة الديالوجات
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);

  // متغيرات الراعي الشخصي
  const [personalSponsor, setPersonalSponsor] = useState<any>(null);

  const handleQuantityChange = async (
    IDProduct: number,
    newQuantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    try {
      if (newQuantity <= 0) {
        await removeFromCart(IDProduct, selectedColor, selectedSize);
      } else {
        await updateQuantity(
          IDProduct,
          newQuantity,
          selectedColor,
          selectedSize
        );
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // جلب العروض المتاحة وتحميل السلة من Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        // جلب العروض
        const offers = await OffersService.getActiveDiscountOffers();
        setAvailableOffers(offers);

        // تحميل السلة من Firebase إذا كان متاحاً
        if (isFirebaseEnabled) {
          console.log("تحميل السلة من Firebase...");
          await loadFromFirebase();
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [isFirebaseEnabled]); // إزالة loadFromFirebase من dependencies

  // دالة فلترة العروض المتاحة حسب قيمة السلة
  const getEligibleOffers = () => {
    // قيمة السلع - خصم الأصناف (قبل خصم العروض)
    const cartValueBeforeOffers =
      cartState.totalPrice - cartState.totalDiscount;
    console.log("=== تشخيص العروض ===");
    console.log("قيمة السلة الأصلية:", cartState.totalPrice);
    console.log("خصم الأصناف:", cartState.totalDiscount);
    console.log("قيمة السلة للعروض (قبل خصم العروض):", cartValueBeforeOffers);
    console.log("عدد العروض المتاحة:", availableOffers.length);

    const eligibleOffers = availableOffers.filter((offer) => {
      console.log(`\n--- فحص العرض: ${offer.Name} ---`);
      console.log("IsActive:", offer.IsActive);
      console.log("IsBindShop:", offer.IsBindShop);
      console.log(
        "contconditionToApplayOffer:",
        offer.contconditionToApplayOffer
      );

      // التحقق من أن العرض نشط
      if (!offer.IsActive) {
        console.log(`❌ العرض ${offer.Name} مرفوض - غير نشط`);
        return false;
      }

      // التحقق من أن العرض مرتبط بالمتجر
      if (!offer.IsBindShop) {
        console.log(`❌ العرض ${offer.Name} مرفوض - غير مرتبط بالمتجر`);
        return false;
      }

      // التحقق من شرط تطبيق العرض
      if (
        offer.contconditionToApplayOffer &&
        cartValueBeforeOffers < offer.contconditionToApplayOffer
      ) {
        console.log(
          `❌ العرض ${offer.Name} مرفوض - السلة: ${cartValueBeforeOffers}, المطلوب: ${offer.contconditionToApplayOffer}`
        );
        return false;
      }

      console.log(
        `✅ العرض ${offer.Name} مقبول - السلة: ${cartValueBeforeOffers}, المطلوب: ${offer.contconditionToApplayOffer}`
      );
      return true;
    });

    console.log(`\n=== النتيجة النهائية ===`);
    console.log(`عدد العروض المقبولة: ${eligibleOffers.length}`);
    console.log(
      "العروض المقبولة:",
      eligibleOffers.map((o) => o.Name)
    );

    return eligibleOffers;
  };

  // إلغاء تطبيق العرض إذا لم يعد متاحاً
  useEffect(() => {
    if (cartState.appliedOffer) {
      const eligibleOffers = getEligibleOffers();
      const isStillEligible = eligibleOffers.some(
        (offer) => offer.ID === cartState.appliedOffer?.ID
      );

      if (!isStillEligible) {
        handleApplyOffer(null);
      }
    }
  }, [cartState.totalPrice, cartState.totalDiscount, availableOffers]);

  const handleCheckout = () => {
    // لا نحذف بيانات المندوب عند الانتقال لإتمام الطلب
    // لأن الشاشتين مرتبطتين ببعض
    router.push("/checkout");
  };

  // دالة فتح نافذة تعديل الملاحظات
  const openNotesDialog = (item: any) => {
    setCurrentEditingItem(item);
    setEditingNotes({ [item.IDProduct]: item.Notes || "" });
    setShowNotesDialog(true);
  };

  // دالة حفظ الملاحظات
  const saveNotes = async () => {
    if (!currentEditingItem) return;

    try {
      const notes = editingNotes[currentEditingItem.IDProduct] || "";
      await updateItemNotes(currentEditingItem.IDProduct, notes);
      setShowNotesDialog(false);
      setCurrentEditingItem(null);
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  // دالة تطبيق عرض
  const handleApplyOffer = async (offer: any) => {
    try {
      await applyOffer(offer);
    } catch (error) {
      console.error("Error applying offer:", error);
    }
  };

  // دالة إصلاح معرف المستخدم في Firebase
  const fixUserIDInFirebase = async () => {
    try {
      console.log("بدء إصلاح معرف المستخدم في Firebase...");

      // جلب جميع العناصر من Firebase
      const allItems = await CartService.getAllCartItems();
      const currentUserID = CartService.getCurrentUserID();

      console.log("معرف المستخدم الحالي:", currentUserID);
      console.log("جميع العناصر في Firebase:", allItems);

      // البحث عن العناصر التي لا تظهر للمستخدم الحالي
      const itemsToFix = allItems.filter(
        (item: any) => item.UserID !== (parseInt(currentUserID) || 0)
      );

      if (itemsToFix.length > 0) {
        console.log("العناصر التي تحتاج إصلاح:", itemsToFix);

        // إصلاح معرف المستخدم لهذه العناصر
        await CartService.fixUserIDForItems(itemsToFix, currentUserID);

        // تحميل السلة من Firebase بعد الإصلاح
        await loadFromFirebase();

        alert(`تم إصلاح ${itemsToFix.length} عنصر. تحقق من السلة الآن.`);
      } else {
        alert("لا توجد عناصر تحتاج إصلاح.");
      }
    } catch (error) {
      console.error("خطأ في إصلاح معرف المستخدم:", error);
      alert("حدث خطأ في إصلاح معرف المستخدم");
    }
  };

  // دالة تشخيص السلة
  const diagnoseCart = async () => {
    try {
      console.log("=== تشخيص السلة ===");

      // فحص السلة المحلية
      console.log("السلة المحلية:", cartState.items);
      console.log("عدد العناصر المحلية:", cartState.items.length);

      // فحص جميع بيانات Firebase
      await CartService.diagnoseCartData();

      // فحص Firebase إذا كان متاحاً
      if (isFirebaseEnabled) {
        const userID = CartService.getCurrentUserID();
        console.log("معرف المستخدم الحالي:", userID);

        try {
          const firebaseItems = await CartService.getCartItems(userID);
          console.log("عناصر Firebase للمستخدم الحالي:", firebaseItems);
          console.log(
            "عدد عناصر Firebase للمستخدم الحالي:",
            firebaseItems.length
          );

          // مقارنة العناصر
          console.log("=== مقارنة العناصر ===");
          firebaseItems.forEach((firebaseItem, index) => {
            const localItem = cartState.items.find(
              (item) => item.IDProduct === firebaseItem.IDProduct
            );
            console.log(`عنصر ${index + 1}:`, {
              IDProduct: firebaseItem.IDProduct,
              Name: firebaseItem.Name,
              Qty: firebaseItem.Qty,
              في_المحلية: !!localItem,
              في_Firebase: true,
              userID: firebaseItem.UserID,
            });
          });

          cartState.items.forEach((localItem, index) => {
            const firebaseItem = firebaseItems.find(
              (item) => item.IDProduct === localItem.IDProduct
            );
            if (!firebaseItem) {
              console.log(`عنصر محلي ${index + 1} غير موجود في Firebase:`, {
                IDProduct: localItem.IDProduct,
                Name: localItem.Name,
                Qty: localItem.Qty,
              });
            }
          });

          // فحص مشكلة عدم تطابق معرف المستخدم
          console.log("=== فحص معرف المستخدم ===");
          const allFirebaseItems = await CartService.getAllCartItems();
          console.log("جميع العناصر في Firebase:", allFirebaseItems);

          const itemsWithDifferentUserID = allFirebaseItems.filter(
            (item: any) => item.UserID !== (parseInt(userID) || 0)
          );

          if (itemsWithDifferentUserID.length > 0) {
            console.log("عناصر بمعرف مستخدم مختلف:", itemsWithDifferentUserID);
            console.log("هذه العناصر لن تظهر للمستخدم الحالي");
          }
        } catch (firebaseError) {
          console.error("خطأ في جلب بيانات Firebase:", firebaseError);
        }
      } else {
        console.log("Firebase غير متاح");
      }

      // فحص localStorage
      const savedCart = localStorage.getItem("shopping-cart");
      console.log("بيانات localStorage:", savedCart);

      alert("تم إرسال معلومات التشخيص إلى Console. اضغط F12 لرؤية النتائج.");
    } catch (error) {
      console.error("خطأ في التشخيص:", error);
      alert("حدث خطأ في التشخيص");
    }
  };

  // دالة فتح تفاصيل المنتج
  const openProductDetails = (item: any) => {
    if (!item) {
      console.warn("Attempting to open product details with null item");
      return;
    }
    setSelectedProduct(item);
    setShowProductDialog(true);
  };

  // دالة فتح تفاصيل العرض
  const openOfferDetails = (item: any) => {
    if (!item) {
      console.warn("Attempting to open offer details with null item");
      return;
    }
    setSelectedOffer(item);
    setShowOfferDialog(true);
  };

  // دالة فتح معرض الصور
  const openProductGallery = (item: any) => {
    if (!item) {
      console.warn("Attempting to open product gallery with null item");
      return;
    }
    setSelectedProduct(item);
    setShowGalleryDialog(true);
  };

  // دالة مشاركة المنتج/العرض
  const shareItem = async (item: any) => {
    if (!item) return;

    const url = `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/store/product/${item.IDProduct || item.ID}`;
    const shareData: ShareData = {
      title:
        item.Name ||
        (isOfferItem(item) ? "عرض من متجر مكة ستار" : "منتج من متجر مكة ستار"),
      text:
        item.ShopShortDiscription ||
        item.ShortDiscription ||
        (isOfferItem(item)
          ? `اكتشف عرض "${item.Name}" في متجر مكة ستار`
          : `اكتشف ${item.Name} في متجر مكة ستار`),
      url,
    };

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("تم نسخ الرابط للحافظة");
    } catch (error: any) {
      if (
        error &&
        (error.name === "AbortError" || error.message?.includes("AbortError"))
      ) {
        return;
      }
      console.error("Error sharing:", error);
      try {
        await navigator.clipboard.writeText(url);
        alert("تم نسخ الرابط للحافظة");
      } catch (clipboardError) {
        console.error("Error copying to clipboard:", clipboardError);
        alert("حدث خطأ في المشاركة");
      }
    }
  };

  // دالة تحديث الراعي الشخصي
  const handlePersonalSponsorChange = (sponsor: any) => {
    setPersonalSponsor(sponsor);
    console.log("تم تحديث الراعي الشخصي:", sponsor);
  };

  // دالة تحديد نوع العنصر
  const isOfferItem = (item: any) => {
    if (!item) return false;
    return item.isOffer === true || item.offerId || item.offerName;
  };

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                سلة التسوق فارغة
              </h1>
              <p className="text-gray-600 mb-8">
                لم تقم بإضافة أي منتجات إلى سلة التسوق بعد
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/store">
                  <Package className="w-4 h-4 ml-2" />
                  تصفح المتجر
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/maka-star-logo.png"
                  alt="مكه ستار"
                  className="w-10 h-10 object-contain"
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    سلة التسوق
                  </h1>
                  <Badge
                    variant="secondary"
                    className="text-base lg:text-lg px-3 py-1 w-fit"
                  >
                    {cartState.totalItems} منتج
                  </Badge>
                </div>
              </div>
            </div>

            {/* Admin Tools Menu */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Button
                  variant="outline"
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                >
                  <Bug className="w-4 h-4 ml-2" />
                  أدوات الإدارة
                  <svg
                    className="w-4 h-4 mr-2 transition-transform group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Button>

                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2 space-y-1">
                    {isFirebaseEnabled && (
                      <>
                        <Button
                          key="sync-firebase"
                          variant="ghost"
                          onClick={() => syncWithFirebase()}
                          disabled={isLoading}
                          className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <div className="flex items-center gap-2">
                            {isLoading && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            )}
                            مزامنة مع Firebase
                          </div>
                        </Button>
                        <Button
                          key="load-firebase"
                          variant="ghost"
                          onClick={() => loadFromFirebase()}
                          disabled={isLoading}
                          className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              {isLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              )}
                              تحميل من Firebase
                            </div>
                          </div>
                        </Button>
                      </>
                    )}
                    <Button
                      key="diagnose-cart"
                      variant="ghost"
                      onClick={diagnoseCart}
                      className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      تشخيص السلة
                    </Button>
                    <Button
                      key="fix-userid"
                      variant="ghost"
                      onClick={fixUserIDInFirebase}
                      className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <Edit3 className="w-4 h-4 ml-2" />
                      إصلاح معرف المستخدم
                    </Button>
                    <Button
                      key="debug-offers"
                      variant="ghost"
                      onClick={() => {
                        console.log("=== تشخيص العروض ===");
                        console.log("العروض المتاحة:", availableOffers);
                        console.log("قيمة السلة:", cartState.totalPrice);
                        console.log("خصم الأصناف:", cartState.totalDiscount);
                        console.log(
                          "قيمة السلة للعروض:",
                          cartState.totalPrice - cartState.totalDiscount
                        );
                        getEligibleOffers();
                      }}
                      className="w-full justify-start text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    >
                      <Bug className="w-4 h-4 ml-2" />
                      تشخيص العروض
                    </Button>
                  </div>
                </div>
              </div>

              {/* زر تفريغ السلة - خارج القائمة */}
              <Button
                variant="outline"
                onClick={() => clearCart()}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                title="تفريغ السلة بالكامل"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                تفريغ السلة
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="xl:col-span-2 space-y-4">
              {cartState.items.map((item, index) => (
                <Card
                  key={`${item.IDProduct}-${item.SelectedColor || "default"}-${
                    item.SelectedSize || "default"
                  }-${index}`}
                  className="overflow-hidden"
                >
                  <CardContent className="p-6">
                    
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto lg:mx-0">
                        {item.SelectedImageURL || item.ImageURL ? (
                          <Image
                            key={`image-${item.IDProduct}-${
                              item.SelectedColor || "default"
                            }-${item.SelectedSize || "default"}`}
                            src={item.SelectedImageURL || item.ImageURL}
                            alt={item.Name || "منتج"}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : isOfferItem(item) ? (
                          <Gift
                            key={`gift-${item.IDProduct}`}
                            className="w-8 h-8 text-orange-400"
                          />
                        ) : (
                          <Package
                            key={`package-${item.IDProduct}`}
                            className="w-8 h-8 text-gray-400"
                          />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {item.Name}
                          </h3>
                          {isOfferItem(item) && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs w-fit">
                              عرض ({item.offerProductsCount || 0} منتج)
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {isOfferItem(item)
                            ? item.offerDescription ||
                              item.ShopShortDiscription ||
                              "عرض مميز"
                            : item.ShopShortDiscription || "لا يوجد وصف"}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                          {isOfferItem(item) ? (
                            <span>عرض #{item.offerId}</span>
                          ) : (
                            <>
                              <span>#{item.BarCode}</span>
                              <span>فئة {item.IDCategory}</span>
                            </>
                          )}
                        </div>

                        {/* عرض اللون والمقاس المختارين */}
                        {(item.SelectedColor || item.SelectedSize) && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {item.SelectedColor && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">
                                  اللون:
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
                                >
                                  <span
                                    className="inline-block w-3 h-3 rounded-full border border-gray-300"
                                    style={{
                                      backgroundColor:
                                        item.SelectedColorHex || "#e5e7eb",
                                    }}
                                  />
                                  {item.SelectedColor}
                                </Badge>
                              </div>
                            )}
                            {item.SelectedSize && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">
                                  المقاس:
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  {item.SelectedSize}
                                  {item.SelectedFitting && (
                                    <span className="text-gray-500 ml-1">
                                      ({item.SelectedFitting})
                                    </span>
                                  )}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                        {/* عرض التاريخ والوقت */}
                        {item.AddedDate && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-400 mt-1">
                            <span>📅 {item.AddedDate}</span>
                            {item.AddedTime && <span>🕐 {item.AddedTime}</span>}
                            {item.LastUpdatedDate &&
                              item.LastUpdatedDate !== item.AddedDate && (
                                <>
                                  <span>|</span>
                                  <span>🔄 {item.LastUpdatedDate}</span>
                                  {item.LastUpdatedTime && (
                                    <span>🕐 {item.LastUpdatedTime}</span>
                                  )}
                                </>
                              )}
                          </div>
                        )}
                      </div>

                      {/* Price and Quantity */}
                      <div className="text-center lg:text-right flex-shrink-0">
                        <div className="mb-2">
                          <div className="font-bold text-lg text-gray-900">
                            {formatCurrencyEGP(item.SalesPrice || 0)}
                          </div>
                          {item.PriceBeforDiscount &&
                          item.PriceBeforDiscount > (item.SalesPrice || 0) ? (
                            <div
                              key={`discount-${item.IDProduct}`}
                              className="text-sm text-gray-500 line-through"
                            >
                              {formatCurrencyEGP(item.PriceBeforDiscount)}
                            </div>
                          ) : null}
                          {isOfferItem(item) &&
                            item.TotalDiscountValue &&
                            item.TotalDiscountValue > 0 && (
                              <div className="text-xs text-green-600 font-medium">
                                توفير{" "}
                                {formatCurrencyEGP(item.TotalDiscountValue)}
                              </div>
                            )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-center lg:justify-end gap-2 mb-2">
                          <Button
                            key={`minus-${item.IDProduct}`}
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                item.IDProduct!,
                                item.Qty - 1,
                                item.SelectedColor,
                                item.SelectedSize
                              )
                            }
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            key={`input-${item.IDProduct}`}
                            type="number"
                            value={item.Qty}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.IDProduct!,
                                parseInt(e.target.value) || 0,
                                item.SelectedColor,
                                item.SelectedSize
                              )
                            }
                            className="w-16 text-center"
                            min="1"
                          />
                          <Button
                            key={`plus-${item.IDProduct}`}
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                item.IDProduct!,
                                item.Qty + 1,
                                item.SelectedColor,
                                item.SelectedSize
                              )
                            }
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Total Price */}
                        <div className="font-semibold text-blue-600">
                          {formatCurrencyEGP(item.TotalSalesPrice || 0)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center lg:flex-col gap-2">
                        {/* Edit Notes Button */}
                        <Button
                          key={`notes-${item.IDProduct}`}
                          variant="outline"
                          size="sm"
                          onClick={() => openNotesDialog(item)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          title="تعديل الملاحظات"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>

                        {/* Share Button */}
                        <Button
                          key={`share-${item.IDProduct}`}
                          variant="outline"
                          size="sm"
                          onClick={() => shareItem(item)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="مشاركة"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>

                        {/* View Details Button */}
                        <Button
                          key={`view-${item.IDProduct}`}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!item) return;
                            if (isOfferItem(item)) {
                              openOfferDetails(item);
                            } else {
                              openProductGallery(item);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title={
                            isOfferItem(item)
                              ? "عرض تفاصيل العرض"
                              : "معرض الصور"
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Remove Button */}
                        <Button
                          key={`remove-${item.IDProduct}`}
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeFromCart(
                              item.IDProduct!,
                              item.SelectedColor,
                              item.SelectedSize
                            )
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="إزالة من السلة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Notes - Moved outside the main flex container */}
                    {item.Notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700 text-sm">
                            ملاحظات:
                          </span>
                          <p className="text-sm text-gray-600 break-words flex-1">
                            {item.Notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* الراعي الشخصي */}
            <div className="xl:col-span-1 space-y-6">
              <PersonalSponsor
                mode="cart"
                onSponsorChange={handlePersonalSponsorChange}
              />

              {/* Order Summary */}
              <OrderFinancialSummary
                cartState={cartState}
                availableOffers={getEligibleOffers()}
                onApplyOffer={handleApplyOffer}
                onCheckout={handleCheckout}
                showCheckoutButton={true}
                showAddMoreButton={true}
                showProfit={false}
                className="sticky top-4"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        isOpen={showProductDialog}
        onClose={() => setShowProductDialog(false)}
        product={selectedProduct || null}
      />

      {/* Offer Details Dialog */}
      <OfferDetailsDialog
        isOpen={showOfferDialog}
        onClose={() => setShowOfferDialog(false)}
        offerId={selectedOffer?.offerId || selectedOffer?.ID || null}
        cartItem={selectedOffer || null}
      />

      {/* Product Gallery Dialog */}
      <ProductGalleryDialog
        isOpen={showGalleryDialog}
        onClose={() => setShowGalleryDialog(false)}
        product={selectedProduct || null}
      />

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">
              تعديل ملاحظات المنتج
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                ملاحظات (اللون، المقاس، إلخ)
              </label>
              <Textarea
                value={editingNotes[currentEditingItem?.IDProduct] || ""}
                onChange={(e) =>
                  setEditingNotes({
                    ...editingNotes,
                    [currentEditingItem?.IDProduct]: e.target.value,
                  })
                }
                placeholder="اكتب ملاحظاتك هنا..."
                className="min-h-[120px] resize-none"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                يمكنك كتابة أي ملاحظات خاصة بالمنتج مثل اللون، المقاس، أو أي
                متطلبات خاصة
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={saveNotes} className="flex-1 order-2 sm:order-1">
                حفظ الملاحظات
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNotesDialog(false)}
                className="flex-1 order-1 sm:order-2"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
