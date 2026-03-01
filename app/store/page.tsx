"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Grid3X3,
  List,
  Search,
  Filter,
  ShoppingCart,
  Heart,
  Star,
  Package,
  Tag,
  Eye,
  Gift,
  Share2,
  UserPlus,
  Crown,
  Palette,
  Ruler,
} from "lucide-react";
import Link from "next/link";
import { formatCurrencyEGP } from "@/lib/utils";
import { useCart } from "@/lib/contexts/cart-context";
import { useClientSession } from "@/lib/hooks/use-client-session";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useCartAdd } from "@/lib/hooks/use-cart-add";
import { OffersService } from "@/lib/services/offers-service";
import { Offer } from "@/lib/types/offers";
import OfferCard from "@/components/offer-card";
import ProductGalleryDialog from "@/components/product-gallery-dialog";
import ClientLoginDialog from "@/components/client-login-dialog";
import CategoryFilter from "@/components/category-filter";
import ShopCategoryFilter from "@/components/shop-category-filter";
import ProductShareButton from "@/components/product-share-button";

// تعريف نوع التصنيف
interface Category {
  id: string;
  ID: number;
  Code: number;
  Name: string;
  IsActive: boolean;
  IsSalesCategory: boolean;
  IsViewAllProducts: boolean;
  IsBindShop: boolean;
  IsBindShopMaster: boolean;
  ImageName: string;
  ImageURL: string;
  ShortName: string;
  IsSelected: boolean;
}

// تعريف نوع تصنيف المتجر
interface ShopCategory {
  id: string;
  mainCategoryId: number;
  mainCategoryName: string;
  subCategories: number[];
  subCategoriesNames: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: string;
  ID: number;
  BarCode: number;
  Name: string;
  IDCategory: number;
  IDProductionCompany: number;
  UnitBig_ID: number;
  UnitBig_PurchasePrice: number;
  UnitBig_Sales1: number;
  UnitBig_Sales2: number;
  UnitBig_Sales3: number;
  UnitBig_Sales4: number;
  UnitBig_Sales5: number;
  UnitCountOf: number;
  UnitSmall_ID: number;
  UnitSmall_PurchasePrice: number;
  UnitSmall_Sales1: number;
  UnitSmall_Sales2: number;
  UnitSmall_Sales3: number;
  UnitSmall_Sales4: number;
  UnitSmall_Sales5: number;
  LimitedQty: number;
  IsActive: boolean;
  IsPOS: boolean;
  IsShop: boolean;
  IsUpdated: boolean;
  ImageName: string;
  ImageURL: string;
  ImageFolderPath: string;
  ShopPriceBeforDiscount: number;
  ShopDiscountValue: number;
  ShopDiscountPercent: number;
  ShopPrice: number;
  ShopColors: string;
  ShopSizes: string;
  ShopShortDiscription: string;
  ShopLongDiscription: string;
  IsFavoritClientTemp: boolean;
  SalesComission_PurchasePrice: number;
  SalesComission_Sales1: number;
  SalesComission_Sales2: number;
  SalesComission_Sales3: number;
  SalesComission_Sales4: number;
  SalesComission_Sales5: number;
  AdminComission_PurchasePrice: number;
  AdminComission_Sales1: number;
  AdminComission_Sales2: number;
  AdminComission_Sales3: number;
  AdminComission_Sales4: number;
  AdminComission_Sales5: number;
  DefaultSalesCommission: number;
  createdAt?: Date;
  updatedAt?: Date;
  totalSold?: number;
  IsShopUnavailable?: boolean;
}

export default function StorePage() {
  const { addToCart, isInCart } = useCart();
  const { session: clientSession } = useClientSession();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCartWithDialog } = useCartAdd();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
  const [productCategories, setProductCategories] = useState<
    Array<{ IDProductStructure: number; IDCategory: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMainCategory, setSelectedMainCategory] = useState<
    number | null
  >(null);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [activeTab, setActiveTab] = useState<
    "products" | "offers" | "featured"
  >("products");
  const [sortBy, setSortBy] = useState<
    | "price-high-to-low"
    | "price-low-to-high"
    | "newest"
    | "best-selling"
    | "highest-rated"
  >("newest");

  // دالة للتعامل مع تغيير التصنيفات
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // دالة للتعامل مع تغيير التصنيف الرئيسي
  const handleMainCategoryChange = (mainCategoryId: number | null) => {
    setSelectedMainCategory(mainCategoryId);
    setSelectedCategory("all"); // إعادة تعيين التصنيف الفرعي
  };

  // دالة لتحديد ما إذا كان المنتج من الأكثر مبيعاً
  const isBestSeller = (product: Product) => {
    const hasSales = product.totalSold && product.totalSold > 0;
    console.log(
      `المنتج ${product.Name} (ID: ${product.ID}): totalSold = ${product.totalSold}, isBestSeller = ${hasSales}`
    );
    return hasSales;
  };

  // دالة ترتيب المنتجات
  const sortProducts = (productsToSort: Product[]) => {
    const sortedProducts = [...productsToSort];

    switch (sortBy) {
      case "price-high-to-low":
        return sortedProducts.sort((a, b) => {
          const priceA = getDisplayPrice(a);
          const priceB = getDisplayPrice(b);
          return priceB - priceA;
        });
      case "price-low-to-high":
        return sortedProducts.sort((a, b) => {
          const priceA = getDisplayPrice(a);
          const priceB = getDisplayPrice(b);
          return priceA - priceB;
        });
      case "newest":
        console.log("=== ترتيب حسب الأحدث ===");
        return sortedProducts.sort((a, b) => {
          const dateA = a.createdAt || new Date(0);
          const dateB = b.createdAt || new Date(0);
          console.log(`المنتج ${a.Name}: ${dateA.toISOString()}`);
          console.log(`المنتج ${b.Name}: ${dateB.toISOString()}`);
          return dateB.getTime() - dateA.getTime(); // من الأحدث للأقدم
        });
      case "best-selling":
        console.log("=== ترتيب حسب الأكثر مبيعاً ===");
        console.log("عدد المنتجات قبل الترتيب:", sortedProducts.length);

        const sortedBySales = sortedProducts.sort((a, b) => {
          const soldA = a.totalSold || 0;
          const soldB = b.totalSold || 0;
          console.log(`المنتج ${a.Name} (ID: ${a.ID}): ${soldA} وحدة مباعة`);
          console.log(`المنتج ${b.Name} (ID: ${b.ID}): ${soldB} وحدة مباعة`);
          return soldB - soldA; // من الأكثر مبيعاً للأقل
        });

        console.log("=== المنتجات بعد الترتيب حسب المبيعات ===");
        sortedBySales.slice(0, 10).forEach((product, index) => {
          console.log(
            `${index + 1}. ${product.Name}: ${
              product.totalSold || 0
            } وحدة مباعة`
          );
        });

        return sortedBySales;
      case "highest-rated":
        // سيتم تفعيلها لاحقاً
        return sortedProducts;
      default:
        return sortedProducts;
    }
  };

  // حالة الديالوج
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // دالة للتحقق من تسجيل الدخول قبل إضافة المنتجات
  const handleAddToCart = (product: Product) => {
    if (!clientSession) {
      setPendingAction(() => () => addToCartWithDialog(product));
      setShowLoginDialog(true);
      return;
    }
    addToCartWithDialog(product);
  };

  // دالة للتحقق من تسجيل الدخول قبل إضافة العروض
  const handleAddOfferToCart = (offer: Offer) => {
    if (!clientSession) {
      setPendingAction(() => () => {
        // سيتم التعامل مع إضافة العرض في مكون OfferCard
        alert("تم تسجيل الدخول بنجاح! يمكنك الآن إضافة العروض للسلة");
      });
      setShowLoginDialog(true);
      return;
    }
    // إضافة العرض للسلة (سيتم التعامل معه في مكون OfferCard)
  };

  // دالة للتعامل مع المفضلة
  const handleToggleFavorite = async (productId: number) => {
    if (!clientSession) {
      setPendingAction(() => () => toggleFavorite(productId));
      setShowLoginDialog(true);
      return;
    }

    try {
      await toggleFavorite(productId);
      alert(
        isFavorite(productId)
          ? "تم إزالة المنتج من المفضلة"
          : "تم إضافة المنتج للمفضلة"
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("حدث خطأ في تحديث المفضلة");
    }
  };

  // دالة تنفيذ الإجراء المعلق بعد تسجيل الدخول
  const handleLoginSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // دالة للتحقق من وجود variants (ألوان ومقاسات) للمنتج
  const hasProductVariants = (product: Product): boolean => {
    // التحقق من وجود ألوان أو مقاسات في الحقول الأساسية
    const hasColors = Boolean(
      product.ShopColors && product.ShopColors.trim() !== ""
    );
    const hasSizes = Boolean(
      product.ShopSizes && product.ShopSizes.trim() !== ""
    );

    return hasColors || hasSizes;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // جلب التصنيفات أولاً
        console.log("بدء جلب التصنيفات...");
        const categoriesCollection = collection(db, "Def_Categories");
        const categoriesQuery = query(
          categoriesCollection,
          where("IsActive", "==", true),
          where("IsBindShop", "==", true)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        console.log("عدد التصنيفات المستلمة:", categoriesSnapshot.size);

        const categoriesData = categoriesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ID: data.ID || parseInt(doc.id),
            Code: data.Code || 0,
            Name: data.Name || "",
            IsActive: data.IsActive || false,
            IsSalesCategory: data.IsSalesCategory || false,
            IsViewAllProducts: data.IsViewAllProducts || false,
            IsBindShop: data.IsBindShop || false,
            IsBindShopMaster: data.IsBindShopMaster || false,
            ImageName: data.ImageName || "",
            ImageURL: data.ImageURL || data.ImageName || "", // تحسين تحميل الصور
            ShortName: data.ShortName || data.Name || "",
            IsSelected: data.IsSelected || false,
          };
        }) as Category[];

        // ترتيب التصنيفات حسب الكود
        const sortedCategories = categoriesData.sort((a, b) => a.Code - b.Code);
        console.log("التصنيفات المرتبة:", sortedCategories);
        setCategories(sortedCategories);

        // جلب بيانات المبيعات للمنتجات
        console.log("بدء جلب بيانات المبيعات...");
        const shopOrdersCollection = collection(db, "Shop_Orders");
        const shopOrdersSnapshot = await getDocs(shopOrdersCollection);
        console.log("عدد طلبات المتجر المستلمة:", shopOrdersSnapshot.size);

        // تجميع بيانات المبيعات لكل منتج
        const productSales: { [productId: number]: number } = {};

        // جلب تفاصيل الطلبات من Shop_OrdersDetails
        for (const orderDoc of shopOrdersSnapshot.docs) {
          const orderData = orderDoc.data();
          console.log("بيانات الطلب:", orderData);
          console.log("مفاتيح الطلب:", Object.keys(orderData));

          // التحقق من حالة الطلب (فقط الطلبات المؤكدة)
          const orderStatus = orderData.Status || orderData.status || "";
          console.log("حالة الطلب:", orderStatus);

          // تجاهل الطلبات الملغية أو المرفوضة
          if (
            orderStatus === "ملغي" ||
            orderStatus === "مرفوض" ||
            orderStatus === "cancelled" ||
            orderStatus === "rejected"
          ) {
            console.log("تجاهل الطلب - حالة غير صالحة");
            continue;
          }

          // محاولة جلب تفاصيل الطلب من Shop_OrdersDetails
          try {
            const orderDetailsCollection = collection(
              db,
              "Shop_Orders",
              orderDoc.id,
              "Shop_OrdersDetails"
            );
            const orderDetailsSnapshot = await getDocs(orderDetailsCollection);
            console.log(
              `تفاصيل الطلب ${orderDoc.id}:`,
              orderDetailsSnapshot.size,
              "عنصر"
            );

            if (orderDetailsSnapshot.size > 0) {
              orderDetailsSnapshot.docs.forEach((detailDoc) => {
                const detailData = detailDoc.data();
                console.log("تفاصيل العنصر:", detailData);
                console.log("مفاتيح العنصر:", Object.keys(detailData));

                const productId =
                  detailData.IDProduct ||
                  detailData.IDProductStructure ||
                  detailData.ProductID ||
                  detailData.ID;
                const quantity = Number(
                  detailData.Qty ||
                    detailData.Quantity ||
                    detailData.quantity ||
                    0
                );

                console.log(`المنتج ${productId}: الكمية ${quantity}`);

                if (
                  productId &&
                  !isNaN(Number(productId)) &&
                  Number(productId) > 0 &&
                  quantity > 0
                ) {
                  const numericProductId = Number(productId);
                  productSales[numericProductId] =
                    (productSales[numericProductId] || 0) + quantity;
                  console.log(
                    `تم إضافة ${quantity} للمنتج ${numericProductId}`
                  );
                } else {
                  console.log(
                    `تجاهل المنتج - معرف غير صالح: ${productId} أو كمية غير صالحة: ${quantity}`
                  );
                }
              });
            } else {
              console.log(`لا توجد تفاصيل للطلب ${orderDoc.id}`);
            }
          } catch (error) {
            console.error(`خطأ في جلب تفاصيل الطلب ${orderDoc.id}:`, error);

            // محاولة بديلة: البحث في البيانات المباشرة للطلب
            console.log("محاولة البحث في البيانات المباشرة للطلب...");
            if (orderData.Products && Array.isArray(orderData.Products)) {
              console.log("وجدت Products في الطلب:", orderData.Products);
              orderData.Products.forEach((item: any) => {
                const productId =
                  item.IDProduct ||
                  item.IDProductStructure ||
                  item.ProductID ||
                  item.ID;
                const quantity = Number(
                  item.Qty || item.Quantity || item.quantity || 0
                );

                if (
                  productId &&
                  !isNaN(Number(productId)) &&
                  Number(productId) > 0 &&
                  quantity > 0
                ) {
                  const numericProductId = Number(productId);
                  productSales[numericProductId] =
                    (productSales[numericProductId] || 0) + quantity;
                  console.log(
                    `تم إضافة ${quantity} للمنتج ${numericProductId} من البيانات المباشرة`
                  );
                }
              });
            }
          }
        }

        console.log("إجمالي المبيعات لكل منتج:", productSales);

        // عرض المنتجات التي لديها مبيعات
        const productsWithSales = Object.keys(productSales).filter(
          (productId) => productSales[Number(productId)] > 0
        );
        console.log("المنتجات التي لديها مبيعات:", productsWithSales);
        console.log(
          "عدد المنتجات التي لديها مبيعات:",
          productsWithSales.length
        );

        // جلب تصنيفات المتجر
        console.log("بدء جلب تصنيفات المتجر...");
        const shopCategoriesCollection = collection(db, "Def_ShopCategories");
        const shopCategoriesSnapshot = await getDocs(shopCategoriesCollection);
        console.log(
          "عدد تصنيفات المتجر المستلمة:",
          shopCategoriesSnapshot.size
        );

        const shopCategoriesData = shopCategoriesSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const mainCategory = sortedCategories.find(
              (cat) => cat.ID === data.mainCategoryId
            );
            const subCategoriesNames =
              data.subCategories?.map((subId: number) => {
                const subCategory = sortedCategories.find(
                  (cat) => cat.ID === subId
                );
                return subCategory?.Name || "غير محدد";
              }) || [];

            return {
              id: doc.id,
              mainCategoryId: data.mainCategoryId || 0,
              mainCategoryName: mainCategory?.Name || "غير محدد",
              subCategories: data.subCategories || [],
              subCategoriesNames: subCategoriesNames,
              isActive: data.isActive || false,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            };
          })
          .filter((shopCat) => shopCat.isActive); // فلترة التصنيفات النشطة فقط

        console.log("تصنيفات المتجر:", shopCategoriesData);
        console.log("تفاصيل تصنيفات المتجر:");
        shopCategoriesData.forEach((shopCat, index) => {
          console.log(`تصنيف ${index + 1}:`, {
            mainCategoryId: shopCat.mainCategoryId,
            mainCategoryName: shopCat.mainCategoryName,
            subCategories: shopCat.subCategories,
            subCategoriesNames: shopCat.subCategoriesNames,
          });
        });
        setShopCategories(shopCategoriesData);

        // جلب التصنيفات الرئيسية المميزة
        console.log("بدء جلب التصنيفات الرئيسية المميزة...");
        const masterCategoriesQuery = query(
          categoriesCollection,
          where("IsActive", "==", true),
          where("IsBindShopMaster", "==", true)
        );
        const masterCategoriesSnapshot = await getDocs(masterCategoriesQuery);
        console.log(
          "عدد التصنيفات الرئيسية المميزة:",
          masterCategoriesSnapshot.size
        );

        const masterCategoriesData = masterCategoriesSnapshot.docs.map(
          (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ID: data.ID || parseInt(doc.id),
              Code: data.Code || 0,
              Name: data.Name || "",
              IsActive: data.IsActive || false,
              IsSalesCategory: data.IsSalesCategory || false,
              IsViewAllProducts: data.IsViewAllProducts || false,
              IsBindShop: data.IsBindShop || false,
              IsBindShopMaster: data.IsBindShopMaster || false,
              ImageName: data.ImageName || "",
              ImageURL: data.ImageURL || data.ImageName || "", // تحسين تحميل الصور
              ShortName: data.ShortName || data.Name || "",
              IsSelected: data.IsSelected || false,
            };
          }
        ) as Category[];

        console.log("التصنيفات الرئيسية المميزة:", masterCategoriesData);

        // جلب المنتجات المرتبطة بالتصنيفات الرئيسية المميزة
        console.log("بدء جلب المنتجات المرتبطة بالتصنيفات الرئيسية...");
        const productCategoriesCollection = collection(
          db,
          "Def_ProductStructureCategoty"
        );
        const productCategoriesQuery = query(
          productCategoriesCollection,
          where("IsChecked", "==", true)
        );
        const productCategoriesSnapshot = await getDocs(productCategoriesQuery);
        console.log("عدد العلاقات المستلمة:", productCategoriesSnapshot.size);

        // حفظ جميع علاقات المنتجات والتصنيفات
        const productCategoriesData = productCategoriesSnapshot.docs.map(
          (doc) => {
            const data = doc.data();
            return {
              IDProductStructure: data.IDProductStructure || 0,
              IDCategory: data.IDCategory || 0,
            };
          }
        );
        console.log(
          "علاقات المنتجات والتصنيفات:",
          productCategoriesData.slice(0, 10)
        ); // عرض أول 10 علاقات فقط
        setProductCategories(productCategoriesData);

        // استخراج معرفات المنتجات المرتبطة بالتصنيفات الرئيسية
        const masterCategoryIds = masterCategoriesData.map((cat) => cat.ID);
        const featuredProductIds = productCategoriesData
          .filter((relation) => masterCategoryIds.includes(relation.IDCategory))
          .map((relation) => relation.IDProductStructure);

        console.log("معرفات المنتجات المميزة:", featuredProductIds);

        // جلب المنتجات
        console.log("بدء جلب المنتجات...");
        const productsCollection = collection(db, "Def_ProductStructure");
        const productsQuery = query(
          productsCollection,
          where("IsShop", "==", true),
          where("IsActive", "==", true)
        );
        const productsSnapshot = await getDocs(productsQuery);
        console.log("عدد المنتجات المستلمة:", productsSnapshot.size);

        const productsData = productsSnapshot.docs.map((doc) => {
          const data = doc.data();
          const productId = data.ID || 0;
          return {
            id: doc.id,
            ID: productId,
            BarCode: data.BarCode || 0,
            Name: data.Name || "",
            IDCategory: data.IDCategory || 0,
            IDProductionCompany: data.IDProductionCompany || 0,
            UnitBig_ID: data.UnitBig_ID || 0,
            UnitBig_PurchasePrice: data.UnitBig_PurchasePrice || 0,
            UnitBig_Sales1: data.UnitBig_Sales1 || 0,
            UnitBig_Sales2: data.UnitBig_Sales2 || 0,
            UnitBig_Sales3: data.UnitBig_Sales3 || 0,
            UnitBig_Sales4: data.UnitBig_Sales4 || 0,
            UnitBig_Sales5: data.UnitBig_Sales5 || 0,
            UnitCountOf: data.UnitCountOf || 0,
            UnitSmall_ID: data.UnitSmall_ID || 0,
            UnitSmall_PurchasePrice: data.UnitSmall_PurchasePrice || 0,
            UnitSmall_Sales1: data.UnitSmall_Sales1 || 0,
            UnitSmall_Sales2: data.UnitSmall_Sales2 || 0,
            UnitSmall_Sales3: data.UnitSmall_Sales3 || 0,
            UnitSmall_Sales4: data.UnitSmall_Sales4 || 0,
            UnitSmall_Sales5: data.UnitSmall_Sales5 || 0,
            LimitedQty: data.LimitedQty || 0,
            IsActive: data.IsActive || false,
            IsPOS: data.IsPOS || false,
            IsShop: data.IsShop || false,
            IsUpdated: data.IsUpdated || false,
            ImageName: data.ImageName || "",
            ImageURL: data.ImageURL || "",
            ImageFolderPath: data.ImageFolderPath || "",
            ShopPriceBeforDiscount: data.ShopPriceBeforDiscount || 0,
            ShopDiscountValue: data.ShopDiscountValue || 0,
            ShopDiscountPercent: data.ShopDiscountPercent || 0,
            ShopPrice: data.ShopPrice || 0,
            ShopColors: data.ShopColors || "",
            ShopSizes: data.ShopSizes || "",
            ShopShortDiscription: data.ShopShortDiscription || "",
            ShopLongDiscription: data.ShopLongDiscription || "",
            IsFavoritClientTemp: featuredProductIds.includes(productId), // تحديث حالة المنتج المميز
            SalesComission_PurchasePrice:
              data.SalesComission_PurchasePrice || 0,
            SalesComission_Sales1: data.SalesComission_Sales1 || 0,
            SalesComission_Sales2: data.SalesComission_Sales2 || 0,
            SalesComission_Sales3: data.SalesComission_Sales3 || 0,
            SalesComission_Sales4: data.SalesComission_Sales4 || 0,
            SalesComission_Sales5: data.SalesComission_Sales5 || 0,
            AdminComission_PurchasePrice:
              data.AdminComission_PurchasePrice || 0,
            AdminComission_Sales1: data.AdminComission_Sales1 || 0,
            AdminComission_Sales2: data.AdminComission_Sales2 || 0,
            AdminComission_Sales3: data.AdminComission_Sales3 || 0,
            AdminComission_Sales4: data.AdminComission_Sales4 || 0,
            AdminComission_Sales5: data.AdminComission_Sales5 || 0,
            DefaultSalesCommission: data.DefaultSalesCommission || 0,
            IsShopUnavailable: data.IsShopUnavailable ?? false,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            totalSold: productSales[productId] || 0,
          };
        }) as Product[];

        console.log("جميع المنتجات:", productsData);
        console.log(
          "المنتجات المميزة:",
          productsData.filter((p) => p.IsFavoritClientTemp)
        );

        // عرض تواريخ بعض المنتجات للتأكد من جلبها
        console.log("=== تواريخ المنتجات ===");
        productsData.slice(0, 5).forEach((product, index) => {
          console.log(`المنتج ${index + 1} (${product.Name}):`);
          console.log(`  - تاريخ الإنشاء: ${product.createdAt?.toISOString()}`);
          console.log(`  - تاريخ التحديث: ${product.updatedAt?.toISOString()}`);
        });

        // عرض بيانات المبيعات لبعض المنتجات
        console.log("=== بيانات المبيعات ===");
        productsData.slice(0, 5).forEach((product, index) => {
          console.log(
            `المنتج ${index + 1} (${product.Name}): ${
              product.totalSold
            } وحدة مباعة`
          );
        });

        // عرض المنتجات التي لديها مبيعات
        const productsWithSalesData = productsData.filter(
          (product) => product.totalSold && product.totalSold > 0
        );
        console.log("=== المنتجات التي لديها مبيعات ===");
        productsWithSalesData.forEach((product, index) => {
          console.log(
            `المنتج ${index + 1} (${product.Name}): ${
              product.totalSold
            } وحدة مباعة`
          );
        });
        console.log(
          "إجمالي المنتجات التي لديها مبيعات:",
          productsWithSalesData.length
        );
        setProducts(productsData);
        setFilteredProducts(productsData);

        // جلب العروض
        console.log("بدء جلب العروض...");
        try {
          const offersData = await OffersService.getActiveOffers();
          console.log("عدد العروض المستلمة:", offersData.length);
          setOffers(offersData);
          setFilteredOffers(offersData);
        } catch (offersError) {
          console.error("Error fetching offers:", offersError);
          setOffers([]);
          setFilteredOffers([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setProducts([]);
        setFilteredProducts([]);
        setOffers([]);
        setFilteredOffers([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log("=== بداية فلترة المنتجات ===");
    console.log("عدد المنتجات الإجمالي:", products.length);
    console.log("التصنيف المحدد:", selectedCategory);
    console.log("التصنيف الرئيسي المحدد:", selectedMainCategory);
    console.log("عدد تصنيفات المتجر:", shopCategories.length);
    console.log("عدد علاقات المنتجات والتصنيفات:", productCategories.length);

    // فلترة المنتجات
    let filteredProducts = products;

    // فلترة حسب البحث
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.ShopShortDiscription?.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
      );
    }

    // فلترة حسب التصنيف الرئيسي أولاً
    if (selectedMainCategory !== null) {
      const selectedShopCategory = shopCategories.find(
        (sc) => sc.mainCategoryId === selectedMainCategory
      );
      console.log("التصنيف الرئيسي المحدد:", selectedMainCategory);
      console.log("بيانات التصنيف الرئيسي:", selectedShopCategory);

      if (selectedShopCategory) {
        // فلترة حسب التصنيف الفرعي إذا تم اختياره
        if (selectedCategory !== "all") {
          // فلترة المنتجات المرتبطة بالتصنيف الفرعي المحدد من جدول Def_ProductStructureCategoty
          const selectedCategoryId = parseInt(selectedCategory);
          console.log("التصنيف الفرعي المحدد:", selectedCategoryId);

          const productsInCategory = productCategories
            .filter((relation) => relation.IDCategory === selectedCategoryId)
            .map((relation) => relation.IDProductStructure);

          console.log("المنتجات في التصنيف الفرعي:", productsInCategory);

          filteredProducts = filteredProducts.filter((product) =>
            productsInCategory.includes(product.ID)
          );
          console.log(
            "عدد المنتجات بعد الفلترة بالتصنيف الفرعي:",
            filteredProducts.length
          );
        } else {
          // عرض جميع المنتجات المرتبطة بالتصنيفات الفرعية للتصنيف الرئيسي
          console.log(
            "التصنيفات الفرعية للتصنيف الرئيسي:",
            selectedShopCategory.subCategories
          );

          const productsInMainCategory = productCategories
            .filter((relation) =>
              selectedShopCategory.subCategories.includes(relation.IDCategory)
            )
            .map((relation) => relation.IDProductStructure);

          console.log("المنتجات في التصنيف الرئيسي:", productsInMainCategory);

          filteredProducts = filteredProducts.filter((product) =>
            productsInMainCategory.includes(product.ID)
          );
          console.log(
            "عدد المنتجات بعد الفلترة بالتصنيف الرئيسي:",
            filteredProducts.length
          );
        }
      }
    } else {
      // في حالة "عرض الكل" - عرض جميع المنتجات المرتبطة بالتصنيفات الفرعية من جميع التصنيفات الرئيسية
      if (selectedCategory === "all") {
        // جمع جميع التصنيفات الفرعية من جميع التصنيفات الرئيسية
        const allSubCategories = shopCategories.flatMap(
          (sc) => sc.subCategories
        );
        console.log("جميع التصنيفات الفرعية:", allSubCategories);

        const productsInAllSubCategories = productCategories
          .filter((relation) => allSubCategories.includes(relation.IDCategory))
          .map((relation) => relation.IDProductStructure);

        console.log(
          "المنتجات في جميع التصنيفات الفرعية:",
          productsInAllSubCategories
        );

        filteredProducts = filteredProducts.filter((product) =>
          productsInAllSubCategories.includes(product.ID)
        );
        console.log(
          "عدد المنتجات بعد الفلترة بجميع التصنيفات الفرعية:",
          filteredProducts.length
        );
      } else {
        // فلترة حسب الفئة العادية إذا لم يتم اختيار تصنيف رئيسي
        const selectedCategoryId = parseInt(selectedCategory);
        console.log("التصنيف المحدد (بدون تصنيف رئيسي):", selectedCategoryId);

        const productsInCategory = productCategories
          .filter((relation) => relation.IDCategory === selectedCategoryId)
          .map((relation) => relation.IDProductStructure);

        console.log("المنتجات في التصنيف المحدد:", productsInCategory);

        filteredProducts = filteredProducts.filter((product) =>
          productsInCategory.includes(product.ID)
        );
        console.log(
          "عدد المنتجات بعد الفلترة بالتصنيف المحدد:",
          filteredProducts.length
        );
      }
    }

    // فلترة المنتجات المميزة إذا كان التاب المحدد هو المنتجات المميزة
    if (activeTab === "featured") {
      filteredProducts = filteredProducts.filter(
        (product) => product.IsFavoritClientTemp === true
      );
    }

    console.log("=== نهاية فلترة المنتجات ===");
    console.log("عدد المنتجات النهائي:", filteredProducts.length);

    // تطبيق الترتيب على المنتجات المفلترة
    const sortedProducts = sortProducts(filteredProducts);
    console.log("=== تطبيق الترتيب ===");
    console.log("نوع الترتيب:", sortBy);
    console.log("عدد المنتجات بعد الترتيب:", sortedProducts.length);

    setFilteredProducts(sortedProducts);

    // فلترة العروض
    let filteredOffers = offers;

    // فلترة حسب البحث
    if (searchTerm) {
      filteredOffers = filteredOffers.filter(
        (offer) =>
          offer.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.ShortDiscription?.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
      );
    }

    setFilteredOffers(filteredOffers);
  }, [
    products,
    offers,
    searchTerm,
    selectedCategory,
    selectedMainCategory,
    shopCategories,
    productCategories,
    activeTab,
    sortBy,
  ]);

  const getDisplayPrice = (product: Product) => {
    if (product.ShopPrice > 0) return product.ShopPrice;
    if (product.UnitSmall_Sales1 > 0) return product.UnitSmall_Sales1;
    if (product.UnitBig_Sales1 > 0) return product.UnitBig_Sales1;
    return 0;
  };

  const getOriginalPrice = (product: Product) => {
    if (product.ShopPriceBeforDiscount > 0)
      return product.ShopPriceBeforDiscount;
    return getDisplayPrice(product);
  };

  const openProductGallery = (product: Product) => {
    setSelectedProduct(product);
    setShowGalleryDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden bg-white">
      {/* Shop Category Filter Section */}
      {(activeTab === "products" || activeTab === "featured") && (
        <ShopCategoryFilter
          shopCategories={shopCategories}
          selectedMainCategory={selectedMainCategory}
          onMainCategoryChange={handleMainCategoryChange}
          productCount={filteredProducts.length}
        />
      )}

      {/* Category Filter Section */}
      {(activeTab === "products" || activeTab === "featured") && (
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          productCount={filteredProducts.length}
          selectedMainCategory={selectedMainCategory}
          shopCategories={shopCategories}
        />
      )}

      {/* Filters and View Controls - HYBRID RESPONSIVE DESIGN */}
      <section className="py-2 sm:py-3 bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Desktop Layout - Horizontal (sm and above) */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            {/* Tabs for Products/Offers/Featured */}
            <div className="flex items-center gap-1">
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "products" | "offers" | "featured")
                }
                className="w-auto"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="products"
                    className="flex items-center gap-2 text-sm"
                  >
                    <Package className="w-4 h-4" />
                    المنتجات
                  </TabsTrigger>
                  <TabsTrigger
                    value="featured"
                    className="flex items-center gap-2 text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    المنتجات المميزة
                  </TabsTrigger>
                  <TabsTrigger
                    value="offers"
                    className="flex items-center gap-2 text-sm"
                  >
                    <Gift className="w-4 h-4" />
                    العروض
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={
                  activeTab === "products" || activeTab === "featured"
                    ? "ابحث عن منتج..."
                    : "ابحث عن عرض..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              {activeTab === "products" || activeTab === "featured" ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 ml-2">الترتيب:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="price-high-to-low">
                      من السعر الأعلى للأقل
                    </option>
                    <option value="price-low-to-high">
                      من السعر الأقل للأعلى
                    </option>
                    <option value="newest">وصل حديثاً</option>
                    <option value="best-selling">الأكثر مبيعاً</option>
                  </select>
                </div>
              ) : (
                <div className="w-32"></div>
              )}

              {/* View Mode Toggle */}
              {activeTab === "products" || activeTab === "featured" ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 ml-2">
                    طريقة العرض:
                  </span>
                  <div className="flex border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "cards" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                      className="rounded-none px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                      title="عرض كروت"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-none px-3"
                      title="عرض قائمة"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-40"></div>
              )}
            </div>
          </div>

          {/* Mobile Layout - Vertical (below sm) */}
          <div className="sm:hidden">
            {/* Tabs Row - Full Width */}
            <div className="mb-4">
              <div className="flex justify-center">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "products" | "offers" | "featured")
                  }
                  className="w-full max-w-md"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="products"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Package className="w-3 h-3" />
                      <span className="hidden xs:inline">المنتجات</span>
                      <span className="xs:hidden">منتجات</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="featured"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Crown className="w-3 h-3" />
                      <span className="hidden xs:inline">المميزة</span>
                      <span className="xs:hidden">مميزة</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="offers"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Gift className="w-3 h-3" />
                      <span className="hidden xs:inline">العروض</span>
                      <span className="xs:hidden">عروض</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Search Row - Full Width */}
            <div className="mb-4">
              <div className="relative w-full max-w-md mx-auto">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={
                    activeTab === "products" || activeTab === "featured"
                      ? "ابحث عن منتج..."
                      : "ابحث عن عرض..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-right w-full"
                />
              </div>
            </div>

            {/* Controls Row - Vertical Layout */}
            {(activeTab === "products" || activeTab === "featured") && (
              <div className="flex flex-col items-center gap-3">
                {/* Sort Controls */}
                <div className="flex items-center gap-2 w-full justify-center">
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    الترتيب:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                  >
                    <option value="price-high-to-low">
                      من السعر الأعلى للأقل
                    </option>
                    <option value="price-low-to-high">
                      من السعر الأقل للأعلى
                    </option>
                    <option value="newest">وصل حديثاً</option>
                    <option value="best-selling">الأكثر مبيعاً</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 w-full justify-center">
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    طريقة العرض:
                  </span>
                  <div className="flex border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "cards" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                      className="rounded-none px-2 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                      title="عرض كروت"
                    >
                      <Grid3X3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-none px-2 py-1.5"
                      title="عرض قائمة"
                    >
                      <List className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Display */}
      <section className="py-2 bg-white">
        <div className="container mx-auto px-6">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">
              {activeTab === "products" && (
                <>
                  تم العثور على{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredProducts.length}
                  </span>{" "}
                  منتج
                </>
              )}
              {activeTab === "featured" && (
                <>
                  تم العثور على{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredProducts.length}
                  </span>{" "}
                  منتج مميز
                </>
              )}
              {activeTab === "offers" && (
                <>
                  تم العثور على{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredOffers.length}
                  </span>{" "}
                  عرض
                </>
              )}
            </p>
          </div>

          {/* Products Tab */}
          {(activeTab === "products" || activeTab === "featured") && (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {activeTab === "featured"
                      ? "لا توجد منتجات مميزة"
                      : "لا توجد منتجات"}
                  </h3>
                  <p className="text-gray-500">جرب تغيير معايير البحث</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cards View */}
                  {viewMode === "cards" && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1 md:gap-2">
                      {filteredProducts.map((product) => {
                        const category = categories.find(
                          (cat) => cat.ID === product.IDCategory
                        );
                        return (
                          <Card
                            key={product.id}
                            className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col cursor-pointer"
                            onClick={() =>
                              window.open(
                                `/store/product/${product.ID}`,
                                "_blank"
                              )
                            }
                          >
                            <div className="aspect-[3/4] bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                              {product.ImageURL ? (
                                <img
                                  src={product.ImageURL}
                                  alt={product.Name}
                                  className="w-full h-full object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <Package className="w-20 h-20 text-gray-400" />
                              )}
                              <div className="absolute top-2 left-2">
                                <Badge
                                  className={
                                    product.IsShopUnavailable
                                      ? "bg-red-600 text-white"
                                      : product.IsActive
                                      ? "bg-green-500 text-white"
                                      : "bg-red-500 text-white"
                                  }
                                >
                                  {product.IsShopUnavailable
                                    ? "غير متوفر"
                                    : product.IsActive
                                    ? "متوفر"
                                    : "غير متوفر"}
                                </Badge>
                              </div>
                              {activeTab === "featured" && (
                                <div className="absolute top-10 left-2">
                                  <Badge className="bg-yellow-500 text-white">
                                    <Crown className="w-3 h-3 ml-1" />
                                    مميز
                                  </Badge>
                                </div>
                              )}
                              {isBestSeller(product) && (
                                <div className="absolute top-2 right-2 z-10">
                                  <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                                    <span className="hidden sm:inline">
                                      الأكثر مبيعاً
                                    </span>
                                    <span className="sm:hidden">🔥</span>
                                    <span className="text-[10px] opacity-90">
                                      ({product.totalSold})
                                    </span>
                                  </Badge>
                                </div>
                              )}
                              <div
                                className={`absolute ${
                                  activeTab === "featured" ? "top-18" : "top-10"
                                } left-2`}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(product.ID);
                                  }}
                                  className={`rounded-full w-8 h-8 p-0 ${
                                    isFavorite(product.ID)
                                      ? "text-red-600 bg-red-50 hover:bg-red-100"
                                      : "text-gray-600 bg-white/80 hover:bg-white"
                                  }`}
                                  title={
                                    isFavorite(product.ID)
                                      ? "إزالة من المفضلة"
                                      : "إضافة للمفضلة"
                                  }
                                >
                                  <Heart
                                    className={`w-4 h-4 ${
                                      isFavorite(product.ID)
                                        ? "fill-current"
                                        : ""
                                    }`}
                                  />
                                </Button>
                              </div>
                            </div>
                            <CardContent className="p-2 md:p-3 flex-1 flex flex-col">
                              <div className="flex-1">
                                <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-0.5 text-right line-clamp-2">
                                  {product.Name}
                                </h3>
                                <p className="text-xs md:text-sm text-gray-600 mb-1 text-right line-clamp-2 md:line-clamp-3">
                                  {product.ShopShortDiscription ||
                                    "لا يوجد وصف"}
                                </p>
                              </div>

                              <div className="mt-auto">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-right">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-lg md:text-xl text-gray-900">
                                        {formatCurrencyEGP(
                                          getDisplayPrice(product)
                                        )}
                                      </span>
                                      {product.ShopPriceBeforDiscount >
                                        getDisplayPrice(product) && (
                                        <span className="text-xs md:text-sm text-gray-500 line-through">
                                          {formatCurrencyEGP(
                                            getOriginalPrice(product)
                                          )}
                                        </span>
                                      )}
                                      {product.ShopDiscountPercent > 0 && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                          خصم {product.ShopDiscountPercent}%
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {hasProductVariants(product) ? (
                                    <Button
                                      className="flex-1 text-xs md:text-sm"
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(
                                          `/store/product/${product.ID}`,
                                          "_blank"
                                        );
                                      }}
                                      disabled={
                                        !product.IsActive ||
                                        product.IsShopUnavailable
                                      }
                                    >
                                      <Palette className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                                      <span className="hidden sm:inline">
                                        عرض المنتج
                                      </span>
                                      <span className="sm:hidden">عرض</span>
                                    </Button>
                                  ) : (
                                    <Button
                                      className="flex-1 text-xs md:text-sm"
                                      size="sm"
                                      variant={
                                        isInCart(product.ID)
                                          ? "default"
                                          : "default"
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCart(product);
                                      }}
                                      disabled={
                                        !product.IsActive ||
                                        product.IsShopUnavailable
                                      }
                                    >
                                      <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                                      <span className="hidden sm:inline">
                                        {isInCart(product.ID)
                                          ? "مضاف للسلة"
                                          : "إضافة للسلة"}
                                      </span>
                                      <span className="sm:hidden">
                                        {isInCart(product.ID)
                                          ? "مضاف"
                                          : "إضافة"}
                                      </span>
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openProductGallery(product);
                                    }}
                                    title="عرض"
                                    className="p-1 md:p-2"
                                  >
                                    <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                  </Button>
                                  <ProductShareButton
                                    product={product}
                                    className="p-1 md:p-2"
                                    size="sm"
                                    variant="outline"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* List View */}
                  {viewMode === "list" && (
                    <div className="space-y-1">
                      {filteredProducts.map((product) => {
                        const category = categories.find(
                          (cat) => cat.ID === product.IDCategory
                        );
                        return (
                          <Card
                            key={product.id}
                            className="group hover:shadow-md transition-all duration-300 cursor-pointer"
                            onClick={() =>
                              window.open(
                                `/store/product/${product.ID}`,
                                "_blank"
                              )
                            }
                          >
                            <CardContent className="p-2 md:p-3">
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {product.ImageURL ? (
                                    <img
                                      src={product.ImageURL}
                                      alt={product.Name}
                                      className="w-full h-full object-contain rounded-lg"
                                    />
                                  ) : (
                                    <Package className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 text-right">
                                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                                    {product.Name}
                                  </h3>
                                  <p className="text-sm md:text-base text-gray-600 mb-3 line-clamp-2">
                                    {product.ShopShortDiscription ||
                                      "لا يوجد وصف"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500">
                                    <span>#{product.BarCode}</span>
                                    <span>
                                      {category
                                        ? category.Name
                                        : `فئة ${product.IDCategory}`}
                                    </span>
                                    <Badge
                                      className={
                                        product.IsShopUnavailable
                                          ? "bg-red-100 text-red-800"
                                          : product.IsActive
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }
                                    >
                                      {product.IsShopUnavailable
                                        ? "غير متوفر"
                                        : product.IsActive
                                        ? "متوفر"
                                        : "غير متوفر"}
                                    </Badge>
                                    {activeTab === "featured" && (
                                      <Badge className="bg-yellow-100 text-yellow-800">
                                        <Crown className="w-3 h-3 ml-1" />
                                        مميز
                                      </Badge>
                                    )}
                                    {isBestSeller(product) && (
                                      <Badge className="bg-orange-100 text-orange-800 text-xs px-2 py-1">
                                        <span className="hidden sm:inline">
                                          الأكثر مبيعاً
                                        </span>
                                        <span className="sm:hidden">🔥</span>
                                        <span className="text-[10px] opacity-90">
                                          ({product.totalSold})
                                        </span>
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-left flex-shrink-0 w-full md:w-auto">
                                  <div className="text-right mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-lg md:text-xl text-gray-900">
                                        {formatCurrencyEGP(
                                          getDisplayPrice(product)
                                        )}
                                      </span>
                                      {product.ShopPriceBeforDiscount >
                                        getDisplayPrice(product) && (
                                        <span className="text-xs md:text-sm text-gray-500 line-through">
                                          {formatCurrencyEGP(
                                            getOriginalPrice(product)
                                          )}
                                        </span>
                                      )}
                                      {product.ShopDiscountPercent > 0 && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                          خصم {product.ShopDiscountPercent}%
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 md:gap-2">
                                    {hasProductVariants(product) ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(
                                            `/store/product/${product.ID}`,
                                            "_blank"
                                          );
                                        }}
                                        disabled={
                                          !product.IsActive ||
                                          product.IsShopUnavailable
                                        }
                                        className="text-xs md:text-sm"
                                      >
                                        <Palette className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                                        <span className="hidden sm:inline">
                                          عرض المنتج
                                        </span>
                                        <span className="sm:hidden">عرض</span>
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant={
                                          isInCart(product.ID)
                                            ? "default"
                                            : "default"
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddToCart(product);
                                        }}
                                        disabled={
                                          !product.IsActive ||
                                          product.IsShopUnavailable
                                        }
                                        className="text-xs md:text-sm"
                                      >
                                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                                        <span className="hidden sm:inline">
                                          {isInCart(product.ID)
                                            ? "مضاف للسلة"
                                            : "إضافة للسلة"}
                                        </span>
                                        <span className="sm:hidden">
                                          {isInCart(product.ID)
                                            ? "مضاف"
                                            : "إضافة"}
                                        </span>
                                      </Button>
                                    )}
                                    <Button
                                      variant={
                                        isFavorite(product.ID)
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(product.ID);
                                      }}
                                      className={`${
                                        isFavorite(product.ID)
                                          ? "text-red-600 bg-red-50 hover:bg-red-100"
                                          : ""
                                      } p-1 md:p-2`}
                                      title={
                                        isFavorite(product.ID)
                                          ? "إزالة من المفضلة"
                                          : "إضافة للمفضلة"
                                      }
                                    >
                                      <Heart
                                        className={`w-3 h-3 md:w-4 md:h-4 ${
                                          isFavorite(product.ID)
                                            ? "fill-current"
                                            : ""
                                        }`}
                                      />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openProductGallery(product);
                                      }}
                                      title="عرض"
                                      className="p-1 md:p-2"
                                    >
                                      <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                    </Button>
                                    <ProductShareButton
                                      product={product}
                                      className="p-1 md:p-2"
                                      size="sm"
                                      variant="outline"
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Offers Tab */}
          {activeTab === "offers" && (
            <>
              {filteredOffers.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    لا توجد عروض
                  </h3>
                  <p className="text-gray-500">جرب تغيير معايير البحث</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {filteredOffers.map((offer) => (
                    <OfferCard key={offer.ID} offer={offer} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Product Gallery Dialog */}
      <ProductGalleryDialog
        isOpen={showGalleryDialog}
        onClose={() => setShowGalleryDialog(false)}
        product={selectedProduct}
      />

      {/* Client Login Dialog */}
      <ClientLoginDialog
        isOpen={showLoginDialog}
        onClose={() => {
          setShowLoginDialog(false);
          setPendingAction(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        title="تسجيل دخول العميل"
        message="يجب تسجيل الدخول لإضافة المنتجات إلى السلة"
      />
    </div>
  );
}
