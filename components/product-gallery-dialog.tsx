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
import {
  Package,
  ShoppingCart,
  Star,
  Tag,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  ZoomIn,
  ZoomOut,
  ImageIcon,
} from "lucide-react";
import { formatCurrencyEGP } from "@/lib/utils";
import { useCart } from "@/lib/contexts/cart-context";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProductOptions from "@/components/product-options";

interface ProductGalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

interface GalleryImage {
  id: string;
  name: string;
  url: string;
}

export default function ProductGalleryDialog({
  isOpen,
  onClose,
  product,
}: ProductGalleryDialogProps) {
  const { addToCart, isInCart, getCartItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [colorSizeToPrice, setColorSizeToPrice] = useState<
    Record<string, number>
  >({});
  const [colorToVariantImage, setColorToVariantImage] = useState<
    Record<string, string>
  >({});
  const [overrideMainImageUrl, setOverrideMainImageUrl] = useState<
    string | null
  >(null);
  const [sizeToFitting, setSizeToFitting] = useState<Record<string, string>>(
    {}
  );
  const [colorSizeToFitting, setColorSizeToFitting] = useState<
    Record<string, string>
  >({});
  const [colorHexByName, setColorHexByName] = useState<Record<string, string>>(
    {}
  );
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // إنشاء مصفوفة الصور (الصورة الرئيسية + صور الجاليري)
  const mainUrl = overrideMainImageUrl || product?.ImageURL || "";
  const productImages = [
    ...(mainUrl ? [{ id: "main", name: "الصورة الرئيسية", url: mainUrl }] : []),
    ...galleryImages,
  ];

  // إضافة console.log للتشخيص
  console.log("🔍 ProductGalleryDialog Debug Info:");
  console.log("📦 Product data:", product);
  console.log("🆔 Product ID:", product?.ID || product?.IDProduct);
  console.log("🖼️ Product ImageURL:", product?.ImageURL);
  console.log("🎨 Gallery images:", galleryImages);
  console.log("📸 Total product images:", productImages);
  console.log("📊 Product structure:", {
    ID: product?.ID,
    IDProduct: product?.IDProduct,
    Name: product?.Name,
    ImageName: product?.ImageName,
    ImageURL: product?.ImageURL,
    SalesPrice: product?.SalesPrice,
    ShopPrice: product?.ShopPrice,
  });

  const cartItem = getCartItem(
    product?.ID || product?.IDProduct || 0,
    selectedColor || undefined,
    selectedSize || undefined
  );
  const isProductInCart = isInCart(
    product?.ID || product?.IDProduct || 0,
    selectedColor || undefined,
    selectedSize || undefined
  );

  const getDisplayPrice = (p: any) => {
    if (!p) return 0;
    if (p.ShopPrice && p.ShopPrice > 0) return p.ShopPrice;
    if (p.UnitSmall_Sales1 && p.UnitSmall_Sales1 > 0) return p.UnitSmall_Sales1;
    if (p.UnitBig_Sales1 && p.UnitBig_Sales1 > 0) return p.UnitBig_Sales1;
    return p.SalesPrice || 0;
  };

  const getOriginalPrice = (p: any) => {
    if (!p) return 0;
    if (p.ShopPriceBeforDiscount && p.ShopPriceBeforDiscount > 0)
      return p.ShopPriceBeforDiscount;
    return getDisplayPrice(p);
  };

  useEffect(() => {
    setCurrentPrice(getDisplayPrice(product));
  }, [product]);

  // جلب صور الجاليري من Firebase
  const loadGalleryImages = async () => {
    const productID = product?.ID || product?.IDProduct;
    console.log("🔍 Loading gallery images for product:", {
      productID,
      productData: product,
      hasID: !!product?.ID,
      hasIDProduct: !!product?.IDProduct,
    });

    if (!productID) {
      console.log("❌ No product ID found");
      return;
    }

    try {
      setLoadingGallery(true);
      const folderPath = `Application/Def_ProductStructure/${productID}`;
      const folderRef = ref(storage, folderPath);

      console.log("📁 Searching in folder:", folderPath);

      try {
        const result = await listAll(folderRef);
        console.log(
          `📸 Found ${result.items.length} images in folder: ${folderPath}`
        );
        console.log(
          "📋 All items:",
          result.items.map((item) => item.name)
        );

        // جلب جميع الصور ما عدا الصورة الرئيسية
        const imageName =
          product.ImageName ||
          product.ImageURL?.split("/").pop()?.split("?")[0];
        console.log("🖼️ Main image name:", imageName);

        const galleryItems = result.items.filter(
          (item) => item.name !== imageName
        );

        console.log(
          `🎨 Filtered ${galleryItems.length} gallery images (excluding main image)`
        );
        console.log(
          "🎨 Gallery items:",
          galleryItems.map((item) => item.name)
        );

        const urls = await Promise.all(
          galleryItems.map(async (item) => {
            const url = await getDownloadURL(item);
            return {
              id: item.name,
              name: item.name,
              url: url,
            };
          })
        );
        setGalleryImages(urls);
        console.log(`✅ Loaded ${urls.length} gallery images successfully`);
      } catch (error) {
        console.log("❌ No gallery images found or error:", error);
        setGalleryImages([]);
      }
    } catch (error) {
      console.error("❌ Error loading gallery:", error);
      setGalleryImages([]);
    } finally {
      setLoadingGallery(false);
    }
  };

  // جلب Varianten: ألوان/مقاسات وأسعار وصور اللون
  const loadVariants = async () => {
    try {
      const productID = product?.ID || product?.IDProduct;
      if (!productID) {
        // fallback إلى الحقول النصية إذا لم يتوفر المعرّف
        const colors = String(product?.ShopColors || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        const sizes = String(product?.ShopSizes || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        setAvailableColors(colors);
        setAvailableSizes(sizes);
        if (colors.length && !selectedColor) setSelectedColor(colors[0]);
        if (sizes.length && !selectedSize) setSelectedSize(sizes[0]);
        return;
      }

      const variantsCol = collection(
        db,
        "Def_ProductStructure",
        String(productID),
        "Variants"
      );
      const variantsSnap = await getDocs(variantsCol);
      const colorsSet = new Set<string>();
      const sizesSet = new Set<string>();
      const priceMap: Record<string, number> = {};
      const colorImageMap: Record<string, string> = {};
      const sizeFit: Record<string, string> = {};
      const colorSizeFit: Record<string, string> = {};
      for (const d of variantsSnap.docs) {
        const v: any = d.data();
        const colorName = String(v?.Color?.Name || "").trim();
        const sizeName = String(v?.Size?.Name || "").trim();
        if (colorName) colorsSet.add(colorName);
        if (sizeName) sizesSet.add(sizeName);
        const priceNum = Number(v?.Price) || 0;
        if (colorName && sizeName && priceNum > 0)
          priceMap[`${colorName}__${sizeName}`] = priceNum;
        if (colorName && v?.ImageURL) {
          colorImageMap[colorName] = v.ImageURL;
        } else if (colorName && v?.ImageName) {
          try {
            const fileRef = ref(
              storage,
              `Application/Def_ProductStructure/${productID}/variants/${v.ImageName}`
            );
            const url = await getDownloadURL(fileRef);
            colorImageMap[colorName] = url;
          } catch (e) {}
        }
        const fit = String(v?.Fitting || "").trim();
        if (sizeName && fit && !sizeFit[sizeName]) sizeFit[sizeName] = fit;
        if (colorName && sizeName && fit)
          colorSizeFit[`${colorName}__${sizeName}`] = fit;
      }

      let colors = Array.from(colorsSet);
      let sizes = Array.from(sizesSet);
      if (colors.length === 0) {
        colors = String(product?.ShopColors || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      if (sizes.length === 0) {
        sizes = String(product?.ShopSizes || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      setAvailableColors(colors);
      setAvailableSizes(sizes);
      setColorSizeToPrice(priceMap);
      setColorToVariantImage(colorImageMap);
      setSizeToFitting(sizeFit);
      setColorSizeToFitting(colorSizeFit);
      if (colors.length && !selectedColor) setSelectedColor(colors[0]);
      if (sizes.length && !selectedSize) setSelectedSize(sizes[0]);
    } catch {
      // fallback إلى الحقول النصية
      const colors = String(product?.ShopColors || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const sizes = String(product?.ShopSizes || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      setAvailableColors(colors);
      setAvailableSizes(sizes);
      if (colors.length && !selectedColor) setSelectedColor(colors[0]);
      if (sizes.length && !selectedSize) setSelectedSize(sizes[0]);
    }
  };

  // تحميل المتغيرات عند فتح الديالوج
  useEffect(() => {
    if (isOpen && product) {
      setSelectedColor(null);
      setSelectedSize(null);
      setOverrideMainImageUrl(null);
      loadVariants();
    }
  }, [isOpen, product]);

  // تحميل تعريفات الألوان لإظهار اللون الحقيقي
  useEffect(() => {
    const loadColorDefs = async () => {
      try {
        const colorsCol = collection(db, "Def_Colors");
        const snap = await getDocs(colorsCol);
        const map: Record<string, string> = {};
        snap.docs.forEach((d) => {
          const data: any = d.data();
          if (data?.Name && data?.ColorHex) {
            map[data.Name] = data.ColorHex;
          }
        });
        setColorHexByName(map);
      } catch {}
    };
    loadColorDefs();
  }, []);

  const handleAddToCart = async () => {
    if (!product) {
      alert("لا يمكن إضافة منتج غير موجود");
      return;
    }

    try {
      setLoading(true);
      const original = getOriginalPrice(product);
      const priceNow = currentPrice;
      const discountValue = Math.max(0, original - priceNow);
      const discountPercent =
        original > 0 ? Math.round((discountValue / original) * 100) : 0;
      const notesParts: string[] = [];
      if (selectedColor) notesParts.push(`اللون: ${selectedColor}`);
      if (selectedSize) notesParts.push(`المقاس: ${selectedSize}`);
      const notes = notesParts.join(" | ");
      const cartPayload = {
        ...product,
        PriceBeforDiscount: original,
        SalesPrice: priceNow,
        DiscountValue: discountValue,
        DiscountPercent: discountPercent,
        Notes: "",
        selectedColor: selectedColor || "",
        selectedSize: selectedSize || "",
        selectedFitting:
          selectedColor && selectedSize
            ? colorSizeToFitting[`${selectedColor}__${selectedSize}`] || ""
            : selectedSize
            ? sizeToFitting[selectedSize] || ""
            : "",
        SelectedImageURL: overrideMainImageUrl || product.ImageURL || "",
        selectedColorHex: selectedColor
          ? colorHexByName[selectedColor] || ""
          : "",
      };
      await addToCart(cartPayload, 1);

      // تنظيف البيانات بعد الإضافة
      setSelectedColor("");
      setSelectedSize("");
      setOverrideMainImageUrl("");
      // alert(`تم إضافة ${product.Name || 'المنتج'} إلى السلة`)
    } catch (error) {
      console.error("Error adding product to cart:", error);
      alert("فشل في إضافة المنتج للسلة");
    } finally {
      setLoading(false);
    }
  };

  const shareProduct = async () => {
    if (!product) return;
    const url = `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/store/product/${product.ID || product.IDProduct}`;
    const shareData: ShareData = {
      title: product.Name || "منتج من متجر مكة ستار",
      text:
        product.ShopShortDiscription ||
        product.ShortDiscription ||
        `اكتشف ${product.Name || ""} في متجر مكة ستار`,
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
      alert("تم نسخ رابط المنتج للحافظة");
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
        alert("تم نسخ رابط المنتج للحافظة");
      } catch (clipboardError) {
        console.error("Error copying to clipboard:", clipboardError);
        alert("حدث خطأ في المشاركة");
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    try {
      await toggleFavorite(product.ID || product.IDProduct);
      alert(
        isFavorite(product.ID || product.IDProduct)
          ? "تم إزالة المنتج من المفضلة"
          : "تم إضافة المنتج للمفضلة"
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("حدث خطأ في تحديث المفضلة");
    }
  };

  const nextImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }
  };

  const prevImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + productImages.length) % productImages.length
      );
    }
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  // إعادة تعيين عند فتح ديالوج جديد
  useEffect(() => {
    console.log("🔄 useEffect triggered:", { product: !!product, isOpen });
    if (isOpen) {
      setCurrentImageIndex(0);
      setIsZoomed(false);
      console.log("🚀 Starting to load gallery images...");
      loadGalleryImages(); // Load gallery images when dialog opens
    }
  }, [isOpen, product]);

  if (!product) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

  // إضافة console.log للتشخيص عند فتح الديالوج
  console.log("🚀 ProductGalleryDialog opened with product:", product);
  console.log(
    "🔍 Product keys:",
    product ? Object.keys(product) : "No product"
  );
  console.log("🆔 Product identifiers:", {
    ID: product?.ID,
    IDProduct: product?.IDProduct,
    BarCode: product?.BarCode,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>
            معرض صور {product?.Name || product?.Name || "المنتج"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
          {/* معرض الصور */}
          <div className="bg-gray-50 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-base font-semibold text-gray-900">
                  معرض الصور
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  {isZoomed ? (
                    <ZoomOut className="w-4 h-4" />
                  ) : (
                    <ZoomIn className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareProduct}
                  title="مشاركة المنتج"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* تخطيط الصور - مطابق لصفحة المنتج: صورة رئيسية بالأعلى ومصغرات أفقية أسفلها */}
            <div className="flex flex-col gap-4 h-full">
              {/* الصورة الرئيسية */}
              <div className="w-full relative bg-white rounded-lg overflow-hidden">
                {productImages.length > 0 ? (
                  <div className="relative w-full h-full min-h-[150px] sm:min-h-[180px] md:min-h-[220px]">
                    <img
                      src={productImages[currentImageIndex].url}
                      alt={product?.Name || product?.Name || "منتج"}
                      className={`w-full h-full object-contain transition-all duration-300 ${
                        isZoomed ? "scale-150" : "scale-100"
                      }`}
                    />

                    {/* أزرار التنقل */}
                    {productImages.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {/* عداد الصور */}
                    {productImages.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {productImages.length}
                      </div>
                    )}
                    {/* أيقونة التكبير */}
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsZoomed(!isZoomed)}
                        className="bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900"
                      >
                        {isZoomed ? (
                          <ZoomOut className="w-4 h-4" />
                        ) : (
                          <ZoomIn className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[150px] sm:min-h-[180px] md:min-h-[220px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex flex-col items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400 mb-4" />
                    <span className="text-gray-500 text-center">
                      صورة المنتج غير متوفرة
                    </span>
                  </div>
                )}
              </div>
              {/* مصغرات الصور - صف أفقي */}
              {productImages.length > 1 && (
                <div className="w-full">
                  {loadingGallery ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      جاري تحميل الصور...
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <div className="flex gap-2 pb-2 min-w-max">
                        {productImages.map(
                          (image: GalleryImage, index: number) => (
                            <div
                              key={image.id}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                                index === currentImageIndex
                                  ? "border-blue-500 ring-2 ring-blue-200"
                                  : "border-gray-200"
                              }`}
                              onClick={() => handleImageClick(index)}
                            >
                              <img
                                src={image.url}
                                alt={`صورة ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* تفاصيل المنتج */}
          <div className="p-4 flex flex-col">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={
                      isFavorite(product?.ID || product?.IDProduct || 0)
                        ? "default"
                        : "ghost"
                    }
                    size="sm"
                    onClick={handleToggleFavorite}
                    className={
                      isFavorite(product?.ID || product?.IDProduct || 0)
                        ? "text-red-600 bg-red-50 hover:bg-red-100"
                        : ""
                    }
                    title={
                      isFavorite(product?.ID || product?.IDProduct || 0)
                        ? "إزالة من المفضلة"
                        : "إضافة للمفضلة"
                    }
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isFavorite(product?.ID || product?.IDProduct || 0)
                          ? "fill-current"
                          : ""
                      }`}
                    />
                  </Button>
                </div>
                <div className="text-right">
                  {(product?.BarCode || product?.BarCode) && (
                    <Badge className="bg-gray-100 text-gray-800 mb-2">
                      #{product.BarCode || product.BarCode}
                    </Badge>
                  )}
                  <h1 className="text-xl font-bold text-gray-900 mb-2">
                    {product?.Name || product?.Name || "منتج غير محدد"}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">متوفر</Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      فئة{" "}
                      {product?.IDCategory || product?.IDCategory || "غير محدد"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              <ProductOptions
                product={product}
                onChange={({
                  selectedColor,
                  selectedSize,
                  currentPrice,
                  imageOverrideUrl,
                }) => {
                  setSelectedColor(selectedColor);
                  setSelectedSize(selectedSize);
                  setCurrentPrice(currentPrice);
                  if (imageOverrideUrl) {
                    setOverrideMainImageUrl(imageOverrideUrl);
                    setCurrentImageIndex(0);
                  } else {
                    setOverrideMainImageUrl(null);
                  }
                }}
              />

              {/* الوصف */}
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">
                  الوصف
                </h3>
                <p className="text-gray-600 text-right leading-relaxed text-sm">
                  {product?.ShopShortDiscription ||
                    product?.ShortDiscription ||
                    product?.ShopShortDiscription ||
                    "منتج عالي الجودة"}
                </p>
              </div>

              {/* الأسعار ضمن ProductOptions */}

              {/* معلومات إضافية */}
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">
                  معلومات إضافية
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">
                      الشركة المنتجة:
                    </div>
                    <div className="font-semibold text-sm">
                      {product?.IDProductionCompany ||
                        product?.IDProductionCompany ||
                        "غير محدد"}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">الوحدة:</div>
                    <div className="font-semibold text-sm">
                      {product?.UnitID ||
                        product?.UnitSmall_ID ||
                        product?.UnitID ||
                        "غير محدد"}
                    </div>
                  </div>
                  {(product?.ShopColors || product?.ShopColors) && (
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">
                        الألوان المتوفرة:
                      </div>
                      <div className="font-semibold text-sm">
                        {product?.ShopColors || product?.ShopColors}
                      </div>
                    </div>
                  )}
                  {(product?.ShopSizes || product?.ShopSizes) && (
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">
                        المقاسات المتوفرة:
                      </div>
                      <div className="font-semibold text-sm">
                        {product?.ShopSizes || product?.ShopSizes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* الوصف التفصيلي */}
              {(product?.ShopLongDiscription ||
                product?.LongDescription ||
                product?.ShopLongDiscription) && (
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">
                    وصف تفصيلي
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-700 text-right leading-relaxed text-sm">
                      {product?.ShopLongDiscription ||
                        product?.LongDescription ||
                        product?.ShopLongDiscription}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="border-t pt-3 mt-auto">
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2"
                  size="lg"
                  disabled={loading || isProductInCart}
                >
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  {loading
                    ? "جاري الإضافة..."
                    : isProductInCart
                    ? "المنتج موجود في السلة"
                    : "إضافة للسلة"}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="px-4"
                  onClick={shareProduct}
                >
                  <Share2 className="w-4 h-4 ml-2" />
                  مشاركة
                </Button>
              </div>

              {isProductInCart && (
                <p className="text-xs text-green-600 text-center mt-2">
                  هذا المنتج موجود بالفعل في سلة التسوق
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
