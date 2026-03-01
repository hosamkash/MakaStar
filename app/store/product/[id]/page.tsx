"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Head from "next/head";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Video,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrencyEGP } from "@/lib/utils";
import { useCart } from "@/lib/contexts/cart-context";
import { useClientSession } from "@/lib/hooks/use-client-session";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useCartAdd } from "@/lib/hooks/use-cart-add";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import ClientLoginDialog from "@/components/client-login-dialog";
import ProductShareButton from "@/components/product-share-button";
import CartSummaryDialog from "@/components/cart-summary-dialog";
import ProductGalleryDialog from "@/components/product-gallery-dialog";

// CSS مخصص لإخفاء scroll bar
const customStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #CBD5E0 #F7FAFC;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #F7FAFC;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #CBD5E0;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #A0AEC0;
  }
`;

interface Product {
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
  ShopVideoEmbed: string;
  ShopLink1: string;
  ShopLink2: string;
  ShopLink3: string;
  ShopLink4: string;
  ShopLink5: string;
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
  totalSold?: number;
  IsShopUnavailable?: boolean;
}

interface Category {
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

interface GalleryImage {
  id: string;
  name: string;
  url: string;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { addToCart, isInCart, getCartItem } = useCart();
  const { session: clientSession } = useClientSession();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCartWithDialog } = useCartAdd();

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [activeTab, setActiveTab] = useState<"images" | "video">("images");
  const [isSharing, setIsSharing] = useState(false);
  const [shareImage, setShareImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [colorHexByName, setColorHexByName] = useState<Record<string, string>>(
    {}
  );
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [sizeToFitting, setSizeToFitting] = useState<Record<string, string>>(
    {}
  );
  const [colorSizeToFitting, setColorSizeToFitting] = useState<
    Record<string, string>
  >({});
  const [colorSizeToPrice, setColorSizeToPrice] = useState<
    Record<string, number>
  >({});
  const [colorToVariantImage, setColorToVariantImage] = useState<
    Record<string, string>
  >({});
  const [overrideMainImageUrl, setOverrideMainImageUrl] = useState<
    string | null
  >(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [addedProduct, setAddedProduct] = useState<any>(null);

  // دالة لتحديد أفضل صورة للمشاركة
  const getBestShareImage = (
    product: Product,
    galleryImages: GalleryImage[]
  ): string => {
    // أولاً: صورة المنتج الرئيسية
    if (product?.ImageURL && product?.ImageURL.trim() !== "") {
      // التأكد من أن الصورة URL مطلقة
      const imageUrl = product?.ImageURL.startsWith("http")
        ? product?.ImageURL
        : `${typeof window !== "undefined" ? window.location.origin : ""}${
            product?.ImageURL
          }`;
      console.log("Using main product image:", imageUrl);
      return imageUrl;
    }

    // ثانياً: أول صورة من الجاليري
    if (galleryImages.length > 0 && galleryImages[0].url) {
      // التأكد من أن الصورة URL مطلقة
      const imageUrl = galleryImages[0].url.startsWith("http")
        ? galleryImages[0].url
        : `${typeof window !== "undefined" ? window.location.origin : ""}${
            galleryImages[0].url
          }`;
      console.log("Using gallery image:", imageUrl);
      return imageUrl;
    }

    // أخيراً: لوجو الموقع كبديل
    const fallbackUrl = `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/maka-star-logo.png`;
    console.log("Using fallback logo:", fallbackUrl);
    return fallbackUrl;
  };

  // دالة لاختبار صحة الصورة
  const testImageUrl = async (url: string): Promise<boolean> => {
    if (!url) return false;

    try {
      // إنشاء cache busted URL مرة واحدة
      const cacheBustedUrl = url.includes("?")
        ? `${url}&cb=${Date.now()}`
        : `${url}?cb=${Date.now()}`;

      // استخدام fetch لاختبار الصورة
      const response = await fetch(cacheBustedUrl, { method: "HEAD" });
      const isValid =
        response.ok &&
        response.headers.get("content-type")?.startsWith("image/");
      console.log(
        isValid ? "✅ Image URL is valid:" : "❌ Image URL is invalid:",
        url
      );
      return isValid || false;
    } catch (error) {
      console.log(
        "❌ Error testing image URL with fetch, trying fallback:",
        url,
        error
      );

      // fallback: استخدام Image constructor بطريقة آمنة
      try {
        if (
          typeof window !== "undefined" &&
          typeof window.Image !== "undefined"
        ) {
          const cacheBustedUrl = url.includes("?")
            ? `${url}&cb=${Date.now()}`
            : `${url}?cb=${Date.now()}`;
          return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
              console.log("✅ Image loaded successfully (fallback):", url);
              resolve(true);
            };
            img.onerror = () => {
              console.log("❌ Image failed to load (fallback):", url);
              resolve(false);
            };
            img.src = cacheBustedUrl;
          });
        }
      } catch (fallbackError) {
        console.log("❌ Fallback also failed:", fallbackError);
      }

      return false;
    }
  };

  // دالة ذكية لتحويل أي رابط فيديو إلى embed URL
  const getSmartVideoEmbedUrl = (url: string): string => {
    if (!url) return "";

    // YouTube Links
    if (url.includes("youtube.com/watch")) {
      const videoId = url.match(/v=([^&]+)/)?.[1];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (url.includes("youtube.com/shorts/")) {
      const videoId = url.match(/shorts\/([^?]+)/)?.[1];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (url.includes("youtube.com/embed")) {
      return url;
    }

    // TikTok Links - معالجة خاصة
    if (url.includes("tiktok.com/") || url.includes("vt.tiktok.com/")) {
      // TikTok المختصر يحتاج إلى معالجة خاصة
      if (url.includes("vt.tiktok.com/")) {
        // نستخدم TikTok oEmbed API بدلاً من iframe مباشر
        return `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      }

      // TikTok العادي
      if (url.includes("tiktok.com/")) {
        // استخراج معرف الفيديو من الرابط
        const videoId =
          url.match(/video\/(\d+)/)?.[1] || url.match(/\/(\d+)/)?.[1];
        if (videoId) {
          return `https://www.tiktok.com/embed/${videoId}`;
        }

        // إذا كان الرابط يحتوي على معرف الفيديو مباشرة
        if (url.includes("/embed/")) {
          return url;
        }

        // محاولة استخراج المعرف من نهاية الرابط
        const lastPart = url.split("/").pop();
        if (lastPart && /^\d+$/.test(lastPart)) {
          return `https://www.tiktok.com/embed/${lastPart}`;
        }
      }
    }

    // Vimeo Links
    if (url.includes("vimeo.com/")) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    // إذا كان الرابط بالفعل embed URL
    if (url.includes("embed") || url.includes("player")) {
      return url;
    }

    // إذا لم نتمكن من تحديد النوع، نعيد الرابط كما هو
    return url;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        // جلب المنتج
        const productsCollection = collection(db, "Def_ProductStructure");
        const productQuery = query(
          productsCollection,
          where("ID", "==", parseInt(productId))
        );
        const productSnapshot = await getDocs(productQuery);

        if (!productSnapshot.empty) {
          const productData = productSnapshot.docs[0].data() as Product;
          const fullProduct = {
            ...productData,
            IsShopUnavailable: productData.IsShopUnavailable ?? false,
          } as Product;
          setProduct(fullProduct);
          // تجميع الخيارات: أولوية لتجميعها من Variants ثم الحقول النصية
          try {
            const variantsCol = collection(
              db,
              "Def_ProductStructure",
              String(productData.ID),
              "Variants"
            );
            const variantsSnap = await getDocs(variantsCol);
            const colorsSet = new Set<string>();
            const sizesSet = new Set<string>();
            const sizeFit: Record<string, string> = {};
            const colorSizeFit: Record<string, string> = {};
            const colorSizePrice: Record<string, number> = {};
            const colorImageMap: Record<string, string> = {};
            for (const d of variantsSnap.docs) {
              const v: any = d.data();
              if (v?.Color?.Name) colorsSet.add(String(v.Color.Name));
              if (v?.Size?.Name) sizesSet.add(String(v.Size.Name));
              const sName = String(v?.Size?.Name || "").trim();
              const cName = String(v?.Color?.Name || "").trim();
              const fit = String(v?.Fitting || "").trim();
              if (sName && fit && !sizeFit[sName]) sizeFit[sName] = fit;
              if (sName && cName && fit)
                colorSizeFit[`${cName}__${sName}`] = fit;
              const priceNum = Number(v?.Price) || 0;
              if (sName && cName && priceNum > 0)
                colorSizePrice[`${cName}__${sName}`] = priceNum;
              if (cName && v?.ImageURL) {
                colorImageMap[cName] = v.ImageURL;
              } else if (cName && v?.ImageName) {
                try {
                  const fileRef = ref(
                    storage,
                    `Application/Def_ProductStructure/${productData.ID}/variants/${v.ImageName}`
                  );
                  const url = await getDownloadURL(fileRef);
                  colorImageMap[cName] = url;
                } catch (e) {}
              }
            }
            let colors = Array.from(colorsSet);
            let sizes = Array.from(sizesSet);
            if (colors.length === 0) {
              colors = (productData.ShopColors || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            }
            if (sizes.length === 0) {
              sizes = (productData.ShopSizes || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            }
            setAvailableColors(colors);
            setAvailableSizes(sizes);
            setSizeToFitting(sizeFit);
            setColorSizeToFitting(colorSizeFit);
            setColorSizeToPrice(colorSizePrice);
            setColorToVariantImage(colorImageMap);
            if (colors.length && !selectedColor) {
              setSelectedColor(colors[0]);
              const firstColorUrl = colorImageMap[colors[0]];
              if (firstColorUrl) {
                setOverrideMainImageUrl(firstColorUrl);
                setCurrentImageIndex(0);
              }
            }
            if (sizes.length && !selectedSize) setSelectedSize(sizes[0]);
          } catch {
            const colors = (productData.ShopColors || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            const sizes = (productData.ShopSizes || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            setAvailableColors(colors);
            setAvailableSizes(sizes);
            if (colors.length && !selectedColor) setSelectedColor(colors[0]);
            if (sizes.length && !selectedSize) setSelectedSize(sizes[0]);
          }

          // إعادة تعيين التبويب النشط إلى الصور عند تغيير المنتج
          setActiveTab("images");

          // جلب التصنيف
          if (productData.IDCategory) {
            const categoriesCollection = collection(db, "Def_Categories");
            const categoryQuery = query(
              categoriesCollection,
              where("ID", "==", productData.IDCategory)
            );
            const categorySnapshot = await getDocs(categoryQuery);

            if (!categorySnapshot.empty) {
              const categoryData = categorySnapshot.docs[0].data() as Category;
              setCategory({
                ...categoryData,
              } as Category);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // تحميل تعريفات الألوان للحصول على الأكواد اللونية إن وجدت
  useEffect(() => {
    const loadColorDefs = async () => {
      try {
        const colorsCol = collection(db, "Def_Colors");
        const snap = await getDocs(colorsCol);
        const map: Record<string, string> = {};
        snap.docs.forEach((d) => {
          const data: any = d.data();
          if (data?.Name) {
            if (data.ColorHex) map[data.Name] = data.ColorHex;
          }
        });
        setColorHexByName(map);
      } catch {}
    };
    loadColorDefs();
  }, []);

  // التأكد من أن الصفحة تبدأ من الأعلى عند تحميل المنتج
  useEffect(() => {
    if (product) {
      window.scrollTo(0, 0);
    }
  }, [product]);

  // تحديث صورة المشاركة عند تحميل المنتج والجاليري
  useEffect(() => {
    if (product) {
      console.log("🔍 Product Data Debug:", {
        ID: product?.ID,
        Name: product?.Name,
        ImageURL: product?.ImageURL,
        ImageName: product.ImageName,
        ImageFolderPath: product.ImageFolderPath,
        ShopShortDiscription: product?.ShopShortDiscription,
      });

      console.log("🖼️ Gallery Images:", galleryImages);

      const bestImage = getBestShareImage(product, galleryImages);
      setShareImage(bestImage);

      console.log("✅ Selected Share Image:", bestImage);

      // تحديث meta tags ديناميكياً
      updateMetaTags(product, bestImage);
    }
  }, [product, galleryImages]);

  // دالة لتحديث meta tags ديناميكياً
  const updateMetaTags = async (product: Product, imageUrl: string) => {
    if (typeof window === "undefined") return;

    try {
      // اختبار صحة الصورة أولاً
      const isValidImage = await testImageUrl(imageUrl);
      const finalImageUrl = isValidImage ? imageUrl : "/maka-star-logo.png";

      console.log(
        "Updating meta tags with image:",
        finalImageUrl,
        "Valid:",
        isValidImage
      );

      // تحديث title
      document.title = `${product?.Name} - شركة مكة ستار`;

      // دالة مساعدة لإنشاء أو تحديث meta tag
      const setMetaTag = (
        selector: string,
        attribute: string,
        content: string
      ) => {
        let element = document.querySelector(selector);
        if (!element) {
          element = document.createElement("meta");
          element.setAttribute(
            attribute,
            selector.includes("property") ? "property" : "name"
          );
          element.setAttribute("content", "");
          document.head.appendChild(element);
        }
        element.setAttribute("content", content);
      };

      // تحديث meta description
      setMetaTag(
        'meta[name="description"]',
        "name",
        product?.ShopShortDiscription ||
          `اكتشف ${product?.Name} في متجر مكة ستار`
      );

      // تحديث Open Graph tags
      setMetaTag('meta[property="og:title"]', "property", product?.Name);
      setMetaTag(
        'meta[property="og:description"]',
        "property",
        product?.ShopShortDiscription ||
          `اكتشف ${product?.Name} في متجر مكة ستار`
      );
      setMetaTag('meta[property="og:image"]', "property", finalImageUrl);
      setMetaTag(
        'meta[property="og:url"]',
        "property",
        `${window.location.origin}/store/product/${product?.ID}`
      );
      setMetaTag('meta[property="og:type"]', "property", "product");
      setMetaTag('meta[property="og:site_name"]', "property", "شركة مكة ستار");
      setMetaTag('meta[property="og:locale"]', "property", "ar_EG");
      setMetaTag(
        'meta[property="og:image:secure_url"]',
        "property",
        finalImageUrl
      );
      setMetaTag('meta[property="og:image:width"]', "property", "1200");
      setMetaTag('meta[property="og:image:height"]', "property", "630");
      setMetaTag('meta[property="og:image:alt"]', "property", product?.Name);
      setMetaTag('meta[property="og:image:type"]', "property", "image/jpeg");

      // تحديث Twitter Card tags
      setMetaTag('meta[name="twitter:card"]', "name", "summary_large_image");
      setMetaTag('meta[name="twitter:title"]', "name", product?.Name);
      setMetaTag(
        'meta[name="twitter:description"]',
        "name",
        product?.ShopShortDiscription ||
          `اكتشف ${product?.Name} في متجر مكة ستار`
      );
      setMetaTag('meta[name="twitter:image"]', "name", finalImageUrl);
      setMetaTag('meta[name="twitter:site"]', "name", "@makastar");
      setMetaTag('meta[name="twitter:creator"]', "name", "@makastar");

      // تحديث article tags
      setMetaTag(
        'meta[property="article:author"]',
        "property",
        "شركة مكة ستار"
      );
      setMetaTag('meta[property="article:section"]', "property", "منتجات");
      setMetaTag('meta[property="article:tag"]', "property", product?.Name);

      console.log("✅ Meta tags updated successfully");
    } catch (error) {
      console.error("❌ Error updating meta tags:", error);
    }
  };

  // تحميل صور الجاليري تلقائياً عند تحميل المنتج
  useEffect(() => {
    if (product && product?.ID) {
      loadGalleryImages();
    }
  }, [product]);

  // جلب صور الجاليري من Firebase
  const loadGalleryImages = async () => {
    if (!product?.ID) {
      console.log("❌ No product ID found");
      return;
    }

    try {
      setLoadingGallery(true);
      const folderPath = `Application/Def_ProductStructure/${product?.ID}`;
      const folderRef = ref(storage, folderPath);

      console.log("📁 Searching in folder:", folderPath);

      try {
        const result = await listAll(folderRef);
        console.log(
          `📸 Found ${result.items.length} images in folder: ${folderPath}`
        );

        // جلب جميع الصور ما عدا الصورة الرئيسية
        const imageName =
          product.ImageName ||
          product?.ImageURL?.split("/").pop()?.split("?")[0];
        console.log("🖼️ Main image name:", imageName);

        const galleryItems = result.items.filter(
          (item: any) => item.name !== imageName
        );

        console.log(
          `🎨 Filtered ${galleryItems.length} gallery images (excluding main image)`
        );

        const urls = await Promise.all(
          galleryItems.map(async (item: any) => {
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

  // تحميل صور الجاليري عند تحميل المنتج
  useEffect(() => {
    if (product) {
      loadGalleryImages();
    }
  }, [product]);

  // إنشاء مصفوفة الصور (الصورة الرئيسية + صور الجاليري)
  const mainUrl = overrideMainImageUrl || product?.ImageURL || "";
  const productImages = [
    ...(mainUrl ? [{ id: "main", name: "الصورة الرئيسية", url: mainUrl }] : []),
    ...galleryImages,
  ];

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

  // السعر الحالي مع مراعاة اختيار اللون/المقاس
  const currentPrice = (() => {
    if (product && selectedColor && selectedSize) {
      const key = `${selectedColor}__${selectedSize}`;
      const p = colorSizeToPrice[key];
      if (p && p > 0) return p;
    }
    return product ? getDisplayPrice(product) : 0;
  })();

  const handleAddToCart = async (product: Product) => {
    // إذا كان يوجد ألوان ومقاسات، تأكد من الاختيار قبل الإضافة
    const hasOptions = availableColors.length > 0 || availableSizes.length > 0;
    if (hasOptions) {
      if (availableColors.length > 0 && !selectedColor) {
        alert("يرجى اختيار اللون");
        return;
      }
      if (availableSizes.length > 0 && !selectedSize) {
        alert("يرجى اختيار المقاس");
        return;
      }
    }
    // تجهيز أسعار السلة من الصفحة الحالية وليس من بيانات المنتج الأصلية
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
      SelectedImageURL: overrideMainImageUrl || product?.ImageURL || "",
      selectedColorHex: selectedColor
        ? colorHexByName[selectedColor] || ""
        : "",
    };
    if (!clientSession) {
      setPendingAction(() => () => addToCartWithDialog(product));
      setShowLoginDialog(true);
      return;
    }

    try {
      setLoading(true);
      await addToCart(cartPayload, 1);

      // تنظيف البيانات بعد الإضافة
      setSelectedColor("");
      setSelectedSize("");
      setOverrideMainImageUrl("");

      // إظهار رسالة النجاح
      setAddedProduct(cartPayload);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error adding product to cart:", error);
      alert("فشل في إضافة المنتج للسلة");
    } finally {
      setLoading(false);
    }
  };

  // دالة فتح ديالوج المنتج
  const openProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDialog(true);
  };

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

  // تم نقل وظيفة المشاركة إلى مكون منفصل
  const shareProduct = async (product: Product) => {
    if (isSharing) return;
    setIsSharing(true);

    const url = `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/store/product/${product?.ID}`;
    const productText =
      product?.ShopShortDiscription ||
      `اكتشف ${product?.Name} في متجر مكة ستار`;
    const price = getDisplayPrice(product);
    const priceText = price > 0 ? ` - السعر: ${formatCurrencyEGP(price)}` : "";

    try {
      // محاولة استخدام Web Share API مع الصور (للموبايل)
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        const shareData: ShareData = {
          title: product?.Name,
          text: `${productText}${priceText}`,
          url,
        };

        // إضافة الصور إذا كانت متاحة (يدعمها بعض المتصفحات)
        if (product?.ImageURL && "files" in navigator.share) {
          try {
            // تحويل الصورة إلى ملف
            const response = await fetch(product?.ImageURL);
            const blob = await response.blob();
            const file = new File([blob], `${product?.Name}.jpg`, {
              type: "image/jpeg",
            });

            const shareDataWithImage = {
              ...shareData,
              files: [file],
            };

            await navigator.share(shareDataWithImage as any);
            return;
          } catch (imageError) {
            console.log("لا يمكن مشاركة الصورة، سيتم المشاركة بدونها");
          }
        }

        await navigator.share(shareData);
        return;
      }

      // للكمبيوتر: فتح نافذة مشاركة مع صور المنتج
      const shareWindow = window.open("", "_blank", "width=500,height=600");

      if (shareWindow) {
        shareWindow.document.write(`
          <html dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <head><title>مشاركة المنتج</title></head>
            <body>
              <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="text-align: center; color: #333; margin-bottom: 20px;">🛍️ مشاركة المنتج</h2>
                
                ${
                  product?.ImageURL
                    ? `
                  <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${product?.ImageURL}" alt="${product?.Name}" style="max-width: 200px; max-height: 200px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  </div>
                `
                    : ""
                }
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${
                    product?.Name
                  }</h3>
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${productText}</p>
                  ${
                    price > 0
                      ? `<p style="margin: 0; color: #28a745; font-weight: bold; font-size: 16px;">${formatCurrencyEGP(
                          price
                        )}</p>`
                      : ""
                  }
                </div>
                
                <input type="text" value="${url}" readonly style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px; direction: ltr; font-size: 12px;">
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <button onclick="copyUrl()" style="padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    📋 نسخ رابط المنتج
                  </button>
                  
                  <a href="https://wa.me/?text=${encodeURIComponent(
                    `🛍️ ${product?.Name}${priceText}\n\n${productText}\n\n${url}`
                  )}" target="_blank" style="padding: 12px; background: #25D366; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
                    📱 واتساب
                  </a>
                  
                  <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    url
                  )}" target="_blank" style="padding: 12px; background: #1877F2; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
                    📘 فيسبوك
                  </a>
                  
                  <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `🛍️ ${product?.Name}${priceText} - ${productText}`
                  )}&url=${encodeURIComponent(
          url
        )}" target="_blank" style="padding: 12px; background: #1DA1F2; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
                    🐦 تويتر
                  </a>
                  
                  <a href="https://t.me/share/url?url=${encodeURIComponent(
                    url
                  )}&text=${encodeURIComponent(
          `🛍️ ${product?.Name}${priceText}\n\n${productText}`
        )}" target="_blank" style="padding: 12px; background: #0088cc; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
                    ✈️ تليجرام
                  </a>
                </div>
                
                <div id="success" style="display: none; background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin-top: 15px; text-align: center;">
                  تم نسخ رابط المنتج بنجاح! ✅
                </div>
              </div>
              
              <script>
                function copyUrl() {
                  const input = document.querySelector('input');
                  input.select();
                  document.execCommand('copy');
                  document.getElementById('success').style.display = 'block';
                  setTimeout(() => {
                    document.getElementById('success').style.display = 'none';
                  }, 3000);
                }
              </script>
            </body>
          </html>
        `);
        shareWindow.document.close();
      } else {
        // إذا فشل فتح النافذة، نسخ الرابط مباشرة
        await navigator.clipboard.writeText(url);
        alert(`تم نسخ رابط المنتج للحافظة!\n\nالرابط: ${url}`);
      }
    } catch (error: any) {
      if (
        error &&
        (error.name === "AbortError" || error.message?.includes("AbortError"))
      ) {
        return;
      }
      console.error("Error sharing:", error);

      // محاولة أخيرة: نسخ الرابط
      try {
        await navigator.clipboard.writeText(url);
        alert(`تم نسخ رابط المنتج للحافظة!\n\nالرابط: ${url}`);
      } catch (clipboardError) {
        console.error("Error copying to clipboard:", clipboardError);
        alert(`حدث خطأ في المشاركة. يرجى نسخ الرابط يدوياً:\n\n${url}`);
      }
    } finally {
      setTimeout(() => setIsSharing(false), 1000);
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

  const cartItem = getCartItem(
    product?.ID || 0,
    selectedColor || undefined,
    selectedSize || undefined
  );
  const isProductInCart = isInCart(
    product?.ID || 0,
    selectedColor || undefined,
    selectedSize || undefined
  );

  // مكون المنتجات المشابهة
  const SimilarProducts = ({
    currentProductId,
    categoryId,
    currentProductName,
  }: {
    currentProductId: number;
    categoryId: number;
    currentProductName: string;
  }) => {
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);

    useEffect(() => {
      const fetchSimilarProducts = async () => {
        if (!categoryId) return;

        try {
          setLoadingSimilar(true);
          const productsCollection = collection(db, "Def_ProductStructure");
          const similarQuery = query(
            productsCollection,
            where("IDCategory", "==", categoryId),
            where("IsShop", "==", true),
            where("IsActive", "==", true)
          );
          const similarSnapshot = await getDocs(similarQuery);

          if (!similarSnapshot.empty) {
            const products = similarSnapshot.docs
              .map((doc) => doc.data() as Product)
              .filter((p) => p.ID !== currentProductId) // استبعاد المنتج الحالي
              .sort(() => Math.random() - 0.5) // ترتيب عشوائي
              .slice(0, 15); // عرض 15 منتج كحد أقصى
            setSimilarProducts(products);
          }
        } catch (error) {
          console.error("Error fetching similar products:", error);
        } finally {
          setLoadingSimilar(false);
        }
      };

      fetchSimilarProducts();
    }, [categoryId, currentProductId]);

    if (loadingSimilar) {
      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 bg-white rounded-lg p-4 animate-pulse"
            >
              <div className="bg-gray-200 h-32 rounded-lg mb-3"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-3 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    if (similarProducts.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد منتجات مشابهة متاحة</p>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
          {similarProducts.map((product) => (
            <div
              key={product?.ID}
              className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/store/product/${product?.ID}`)}
            >
              <div className="relative w-full h-48 sm:h-52 md:h-56 lg:h-64 overflow-hidden bg-gray-100 rounded-t-lg">
                {product?.ImageURL && (
                  <Image
                    src={product?.ImageURL}
                    alt={product?.Name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                )}
                <div className="absolute top-2 left-2">
                  <Badge
                    className={
                      product.IsShopUnavailable
                        ? "bg-red-100 text-red-800 text-xs"
                        : "bg-green-100 text-green-800 text-xs"
                    }
                  >
                    {product.IsShopUnavailable ? "غير متوفر" : "متوفر"}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                    00
                  </Badge>
                </div>
                <div className="absolute top-8 left-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(product?.ID)}
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isFavorite(product?.ID)
                          ? "text-red-600 fill-current"
                          : "text-gray-600"
                      }`}
                    />
                  </Button>
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm mb-1 text-right line-clamp-2">
                  {product?.Name}
                </h3>
                <p className="text-gray-500 text-xs mb-2 text-right">
                  {product?.ShopShortDiscription || "لا يوجد وصف"}
                </p>

                <div className="flex items-center justify-between mb-3">
                  {product.ShopDiscountPercent > 0 && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      خصم {product.ShopDiscountPercent}%
                    </Badge>
                  )}
                  <div className="text-left">
                    {product.ShopPriceBeforDiscount >
                      getDisplayPrice(product) && (
                      <span className="text-gray-400 text-xs line-through">
                        {formatCurrencyEGP(getOriginalPrice(product))}
                      </span>
                    )}
                    <div className="font-bold text-green-600">
                      {formatCurrencyEGP(getDisplayPrice(product))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ProductShareButton
                    product={product}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                    size="sm"
                    variant="ghost"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openProductDialog(product); }}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2"
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4 ml-1" />
                    إضافة
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* مؤشرات التمرير */}
        {similarProducts.length > 4 && (
          <div className="flex justify-center mt-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // دالة مشتركة لحساب المبيعات للمنتجات
  const calculateProductSales = async () => {
    try {
      console.log("بدء حساب المبيعات للمنتجات...");
      const shopOrdersCollection = collection(db, "Shop_Orders");
      const shopOrdersSnapshot = await getDocs(shopOrdersCollection);
      console.log("عدد طلبات المتجر المستلمة:", shopOrdersSnapshot.size);

      // تجميع بيانات المبيعات لكل منتج
      const productSales: { [productId: number]: number } = {};

      // جلب تفاصيل الطلبات من Shop_OrdersDetails
      for (const orderDoc of shopOrdersSnapshot.docs) {
        const orderData = orderDoc.data();

        // التحقق من حالة الطلب (فقط الطلبات المؤكدة)
        const orderStatus = orderData.Status || orderData.status || "";

        // تجاهل الطلبات الملغية أو المرفوضة
        if (
          orderStatus === "ملغي" ||
          orderStatus === "مرفوض" ||
          orderStatus === "cancelled" ||
          orderStatus === "rejected"
        ) {
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

          if (orderDetailsSnapshot.size > 0) {
            orderDetailsSnapshot.docs.forEach((detailDoc) => {
              const detailData = detailDoc.data();

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

              if (
                productId &&
                !isNaN(Number(productId)) &&
                Number(productId) > 0 &&
                quantity > 0
              ) {
                const numericProductId = Number(productId);
                productSales[numericProductId] =
                  (productSales[numericProductId] || 0) + quantity;
              }
            });
          } else {
            // محاولة بديلة: البحث في البيانات المباشرة للطلب
            if (orderData.Products && Array.isArray(orderData.Products)) {
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
                }
              });
            }
          }
        } catch (error) {
          console.error(`خطأ في جلب تفاصيل الطلب ${orderDoc.id}:`, error);
        }
      }

      console.log("إجمالي المبيعات لكل منتج:", productSales);
      return productSales;
    } catch (error) {
      console.error("Error calculating product sales:", error);
      return {};
    }
  };

  // مكون الأكثر مبيعاً
  const BestSellingProducts = () => {
    const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>(
      []
    );
    const [loadingBestSelling, setLoadingBestSelling] = useState(false);

    useEffect(() => {
      const fetchBestSellingProducts = async () => {
        try {
          setLoadingBestSelling(true);

          // حساب المبيعات أولاً
          const productSales = await calculateProductSales();

          const productsCollection = collection(db, "Def_ProductStructure");
          const bestSellingQuery = query(
            productsCollection,
            where("IsShop", "==", true),
            where("IsActive", "==", true)
          );
          const bestSellingSnapshot = await getDocs(bestSellingQuery);

          if (!bestSellingSnapshot.empty) {
            const products = bestSellingSnapshot.docs
              .map((doc) => {
                const data = doc.data() as Product;
                return {
                  ...data,
                  totalSold: productSales[data.ID] || 0,
                };
              })
              .filter((p) => p.ID !== product?.ID) // استبعاد المنتج الحالي
              .filter((p) => p.totalSold > 0) // فقط المنتجات التي لديها مبيعات
              .sort((a, b) => {
                // ترتيب حسب الكمية المباعة (الأعلى أولاً)
                return (b.totalSold || 0) - (a.totalSold || 0);
              })
              .slice(0, 15); // عرض 15 منتج كحد أقصى
            setBestSellingProducts(products);
          }
        } catch (error) {
          console.error("Error fetching best selling products:", error);
        } finally {
          setLoadingBestSelling(false);
        }
      };

      fetchBestSellingProducts();
    }, [product?.ID]);

    if (loadingBestSelling) {
      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 bg-white rounded-lg p-4 animate-pulse"
            >
              <div className="bg-gray-200 h-32 rounded-lg mb-3"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-3 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    if (bestSellingProducts.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            لا توجد منتجات من الأكثر مبيعاً متاحة حالياً
          </p>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
          {bestSellingProducts.map((product) => (
            <div
              key={product?.ID}
              className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/store/product/${product?.ID}`)}
            >
              <div className="relative w-full h-48 sm:h-52 md:h-56 lg:h-64 overflow-hidden bg-gray-100 rounded-t-lg">
                {product?.ImageURL && (
                  <Image
                    src={product?.ImageURL}
                    alt={product?.Name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                )}
                <div className="absolute top-2 left-2">
                  <Badge
                    className={
                      product.IsShopUnavailable
                        ? "bg-red-100 text-red-800 text-xs"
                        : "bg-green-100 text-green-800 text-xs"
                    }
                  >
                    {product.IsShopUnavailable ? "غير متوفر" : "متوفر"}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  {product.totalSold && product.totalSold > 0 ? (
                    <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                      <span className="hidden sm:inline">الأكثر مبيعاً</span>
                      <span className="sm:hidden">🔥</span>
                      <span className="text-[10px] opacity-90">
                        ({product.totalSold})
                      </span>
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                      00
                    </Badge>
                  )}
                </div>
                <div className="absolute top-8 left-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(product?.ID)}
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isFavorite(product?.ID)
                          ? "text-red-600 fill-current"
                          : "text-gray-600"
                      }`}
                    />
                  </Button>
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm mb-1 text-right line-clamp-2">
                  {product?.Name}
                </h3>
                <p className="text-gray-500 text-xs mb-2 text-right">
                  {product?.ShopShortDiscription || "لا يوجد وصف"}
                </p>

                <div className="flex items-center justify-between mb-3">
                  {product.ShopDiscountPercent > 0 && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      خصم {product.ShopDiscountPercent}%
                    </Badge>
                  )}
                  <div className="text-left">
                    {product.ShopPriceBeforDiscount >
                      getDisplayPrice(product) && (
                      <span className="text-gray-400 text-xs line-through">
                        {formatCurrencyEGP(getOriginalPrice(product))}
                      </span>
                    )}
                    <div className="font-bold text-green-600">
                      {formatCurrencyEGP(getDisplayPrice(product))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ProductShareButton
                    product={product}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                    size="sm"
                    variant="ghost"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openProductDialog(product); }}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2"
                    size="lg"
                  >
                    <ShoppingCart className="w-4 h-4 ml-1" />
                    إضافة
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* مؤشرات التمرير */}
        {bestSellingProducts.length > 4 && (
          <div className="flex justify-center mt-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            المنتج غير موجود
          </h3>
          <Link href="/store">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للمتجر
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        {product && (
          <>
            <title>{product?.Name} - شركة مكة ستار</title>
            <meta
              name="description"
              content={
                product?.ShopShortDiscription ||
                `اكتشف ${product?.Name} في متجر مكة ستار`
              }
            />

            {/* Debug Info - مخفي للنسخة النهائية - يمكن إظهاره لاحقاً */}
            {false && (
              <>
                <meta
                  name="debug-image-url"
                  content={product?.ImageURL || "NO_IMAGE"}
                />
                <meta
                  name="debug-share-image"
                  content={shareImage || "NO_SHARE_IMAGE"}
                />
              </>
            )}

            {/* Open Graph meta tags */}
            <meta property="og:title" content={product?.Name} />
            <meta
              property="og:description"
              content={
                product?.ShopShortDiscription ||
                `اكتشف ${product?.Name} في متجر مكة ستار`
              }
            />
            <meta
              property="og:image"
              content={shareImage || product?.ImageURL || "/maka-star-logo.png"}
            />
            <meta
              property="og:image:secure_url"
              content={shareImage || product?.ImageURL || "/maka-star-logo.png"}
            />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={product?.Name} />
            <meta property="og:image:type" content="image/jpeg" />
            <meta
              property="og:url"
              content={`${
                typeof window !== "undefined" ? window.location.origin : ""
              }/store/product/${product?.ID}`}
            />
            <meta property="og:type" content="product" />
            <meta property="og:site_name" content="مكة ستار" />
            <meta property="og:locale" content="ar_EG" />

            {/* Additional meta tags for better sharing */}
            <meta name="twitter:site" content="@makastar" />
            <meta name="twitter:creator" content="@makastar" />

            {/* Additional Open Graph tags for better sharing */}
            <meta property="article:author" content="مكة ستار" />
            <meta property="article:section" content="منتجات" />
            <meta property="article:tag" content={product?.Name} />

            {/* Twitter Card meta tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={product?.Name} />
            <meta
              name="twitter:description"
              content={
                product?.ShopShortDiscription ||
                `اكتشف ${product?.Name} في متجر مكة ستار`
              }
            />
            <meta
              name="twitter:image"
              content={shareImage || product?.ImageURL || "/maka-star-logo.png"}
            />
            <meta name="twitter:image:alt" content={product?.Name} />

            {/* Additional meta tags */}
            <meta
              property="product:price:amount"
              content={getDisplayPrice(product).toString()}
            />
            <meta property="product:price:currency" content="EGP" />
            <meta
              property="product:availability"
              content={product.IsActive ? "in stock" : "out of stock"}
            />
            <meta property="product:brand" content="شركة مكة ستار" />
            <meta property="product:category" content="منتجات" />
          </>
        )}
      </Head>
      <style jsx global>
        {customStyles}
      </style>
      <div className="min-h-screen bg-gray-50">
        {/* Product Content */}
        <div className="container mx-auto px-4 py-6">
          {/* Debug Panel - مخفي للنسخة النهائية - يمكن إظهاره لاحقاً */}
          {false && product && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-bold text-yellow-800 mb-2">
                🔍 Debug Info (يمكن حذفها لاحقاً)
              </h3>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>
                  <strong>Product ID:</strong> {product?.ID}
                </div>
                <div>
                  <strong>ImageURL:</strong> {product?.ImageURL || "NO_IMAGE"}
                </div>
                <div>
                  <strong>ImageName:</strong>{" "}
                  {product?.ImageName || "NO_IMAGE_NAME"}
                </div>
                <div>
                  <strong>Share Image:</strong> {shareImage || "NO_SHARE_IMAGE"}
                </div>
                <div>
                  <strong>Gallery Count:</strong> {galleryImages.length}
                </div>
                {product?.ImageURL && (
                  <div className="mt-2">
                    <img
                      src={product?.ImageURL}
                      alt="Product Image Test"
                      className="w-20 h-20 object-cover border rounded"
                      onLoad={() =>
                        console.log("✅ Product image loaded successfully")
                      }
                      onError={() =>
                        console.log("❌ Product image failed to load")
                      }
                    />
                  </div>
                )}
                <div className="mt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        console.log("🧪 Testing share with product:", product);
                        console.log("🧪 Share image URL:", shareImage);
                        console.log("🧪 Product ImageURL:", product?.ImageURL);
                        console.log("🧪 Gallery images:", galleryImages);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      🧪 Test Share Debug
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log("🚀 Testing actual share...");
                          const url = `${window.location.origin}/store/product/${product?.ID}`;
                          const shareData = {
                            title: product?.Name,
                            text:
                              product?.ShopShortDiscription ||
                              `اكتشف ${product?.Name} في متجر مكة ستار`,
                            url,
                          };
                          console.log("🚀 Share data:", shareData);
                          console.log("🚀 Share image URL:", shareImage);

                          if (navigator.share) {
                            await navigator.share(shareData);
                            console.log("✅ Share successful!");
                          } else {
                            console.log("❌ Web Share API not supported");
                            await navigator.clipboard.writeText(url);
                            alert("تم نسخ الرابط: " + url);
                          }
                        } catch (error) {
                          console.error("❌ Share error:", error);
                        }
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      🚀 Test Actual Share
                    </button>
                    <button
                      onClick={() => {
                        // محاكاة ما تراه التطبيقات عند مشاركة الرابط
                        const url = `${window.location.origin}/store/product/${product?.ID}`;
                        const ogImage = document
                          .querySelector('meta[property="og:image"]')
                          ?.getAttribute("content");
                        const ogTitle = document
                          .querySelector('meta[property="og:title"]')
                          ?.getAttribute("content");
                        const ogDescription = document
                          .querySelector('meta[property="og:description"]')
                          ?.getAttribute("content");

                        const preview = `
🔍 Preview of what apps will see:

📱 WhatsApp/Telegram Preview:
Title: ${ogTitle || "NO TITLE"}
Description: ${ogDescription || "NO DESCRIPTION"}
Image: ${ogImage ? "✅ Image URL found" : "❌ No image"}
URL: ${url}

📋 Meta Tags Status:
og:title: ${ogTitle ? "✅" : "❌"}
og:description: ${ogDescription ? "✅" : "❌"}
og:image: ${ogImage ? "✅" : "❌"}

${ogImage ? `🖼️ Image Preview: ${ogImage}` : ""}
                      `;

                        console.log(preview);
                        alert(preview);
                      }}
                      className="px-3 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600"
                    >
                      👁️ Preview Share
                    </button>
                    <button
                      onClick={() => {
                        // إرشادات لاستخدام ngrok
                        const instructions = `
🚀 لاختبار المشاركة الحقيقية:

1️⃣ تثبيت ngrok:
   npm install -g ngrok

2️⃣ تشغيل ngrok:
   ngrok http 3001

3️⃣ استخدام URL الجديد:
   https://xxxxx.ngrok.io/store/product/${product?.ID}

4️⃣ اختبار Facebook Debugger:
   https://developers.facebook.com/tools/debug/

5️⃣ اختبار المشاركة:
   شارك الرابط في واتساب/تليجرام

📝 ملاحظة: ngrok يعطي URL عام مؤقت
                      `;
                        alert(instructions);
                      }}
                      className="px-3 py-1 bg-pink-500 text-white text-xs rounded hover:bg-pink-600"
                    >
                      🚀 ngrok Guide
                    </button>
                    <button
                      onClick={async () => {
                        if (product && shareImage) {
                          console.log("🔄 Manually updating meta tags...");
                          await updateMetaTags(product, shareImage);
                          alert(
                            '✅ Meta tags updated! Try "Test OG Tags" again.'
                          );
                        } else {
                          alert("❌ No product or share image available");
                        }
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                    >
                      🔄 Update Meta Tags
                    </button>
                    <button
                      onClick={() => {
                        // اختبار URL الصورة مع cache busting
                        const testUrl = shareImage.includes("?")
                          ? `${shareImage}&test=${Date.now()}`
                          : `${shareImage}?test=${Date.now()}`;
                        console.log(
                          "🔗 Testing image URL with cache busting:",
                          testUrl
                        );
                        window.open(testUrl, "_blank");
                      }}
                      className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                    >
                      🔗 Test Image URL
                    </button>
                    <button
                      onClick={() => {
                        // اختبار Open Graph meta tags محلياً
                        const ogImage = document.querySelector(
                          'meta[property="og:image"]'
                        );
                        const ogTitle = document.querySelector(
                          'meta[property="og:title"]'
                        );
                        const ogDescription = document.querySelector(
                          'meta[property="og:description"]'
                        );
                        const ogUrl = document.querySelector(
                          'meta[property="og:url"]'
                        );
                        const ogType = document.querySelector(
                          'meta[property="og:type"]'
                        );

                        console.log("📋 Open Graph Meta Tags:");
                        console.log(
                          "og:title:",
                          ogTitle?.getAttribute("content")
                        );
                        console.log(
                          "og:description:",
                          ogDescription?.getAttribute("content")
                        );
                        console.log(
                          "og:image:",
                          ogImage?.getAttribute("content")
                        );
                        console.log("og:url:", ogUrl?.getAttribute("content"));
                        console.log(
                          "og:type:",
                          ogType?.getAttribute("content")
                        );

                        // عرض النتائج في alert
                        const results = `
Open Graph Meta Tags:
Title: ${ogTitle?.getAttribute("content") || "NOT FOUND"}
Description: ${ogDescription?.getAttribute("content") || "NOT FOUND"}
Image: ${ogImage?.getAttribute("content") || "NOT FOUND"}
URL: ${ogUrl?.getAttribute("content") || "NOT FOUND"}
Type: ${ogType?.getAttribute("content") || "NOT FOUND"}
                      `;
                        alert(results);

                        // تحذير حول localhost
                        if (
                          window.location.hostname === "localhost" ||
                          window.location.hostname === "127.0.0.1"
                        ) {
                          alert(
                            "⚠️ تحذير: Facebook Debugger لا يعمل مع localhost\n\nلاختبار المشاركة الحقيقية:\n1. ارفع الموقع على Vercel/Netlify\n2. أو استخدم ngrok لإنشاء URL عام\n3. ثم جرب Facebook Debugger"
                          );
                        } else {
                          // اختبار Facebook Debugger فقط إذا كان URL عام
                          const url = `${window.location.origin}/store/product/${product?.ID}`;
                          const facebookDebugger = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(
                            url
                          )}`;
                          console.log(
                            "🔍 Facebook Debugger URL:",
                            facebookDebugger
                          );
                          window.open(facebookDebugger, "_blank");
                        }
                      }}
                      className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                    >
                      📋 Test OG Tags
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* معرض الصور والفيديو */}
            <div className="bg-gray-50 p-2 sm:p-4 flex flex-col">
              {/* التبويبات */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab("images")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "images"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    الصور
                  </div>
                </button>

                {product.ShopVideoEmbed && (
                  <button
                    onClick={() => setActiveTab("video")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "video"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      الفيديو
                    </div>
                  </button>
                )}
              </div>

              {/* محتوى التبويبات */}
              {activeTab === "images" && (
                <div className="flex flex-col ">
                  {/* تخطيط الصور - الصورة الرئيسية في الأعلى والصور المصغرة تحتها */}
                  <div className="flex flex-col gap-4 h-full">
                    {/* الصورة الرئيسية (تصغير الارتفاع للحفاظ على جمالية الصفحة) */}
                    <div className="w-full relative bg-white rounded-lg overflow-hidden">
                      {productImages.length > 0 ? (
                        <div className="relative w-full h-[360px] sm:h-[420px] md:h-[500px] lg:h-[560px]">
                          <img
                            src={productImages[currentImageIndex].url}
                            alt={product?.Name}
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
                        <div className="w-full h-[360px] sm:h-[420px] md:h-[500px] lg:h-[560px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex flex-col items-center justify-center">
                          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4" />
                          <span className="text-gray-500 text-center text-sm sm:text-base">
                            صورة المنتج غير متوفرة
                          </span>
                        </div>
                      )}
                    </div>

                    {/* مصغرات الصور - تحت الصورة الرئيسية مع scroll أفقي */}
                    {productImages.length > 1 && (
                      <div className="w-full">
                        {loadingGallery ? (
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            جاري تحميل الصور...
                          </div>
                        ) : (
                          <div className="relative">
                            {/* عنوان قسم الصور المصغرة */}
                            <div className="mb-2">
                              <h4 className="text-sm font-medium text-gray-700 text-right">
                                صور المنتج
                              </h4>
                            </div>

                            {/* حاوية الصور المصغرة مع scroll أفقي */}
                            <div className="w-full overflow-x-auto custom-scrollbar">
                              <div className="flex gap-2 pb-2 min-w-max">
                                {productImages.map(
                                  (image: GalleryImage, index: number) => (
                                    <div
                                      key={image.id}
                                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:border-blue-300 ${
                                        index === currentImageIndex
                                          ? "border-blue-500 ring-2 ring-blue-200"
                                          : "border-gray-200"
                                      }`}
                                      onClick={() => handleImageClick(index)}
                                    >
                                      <img
                                        src={image.url}
                                        alt={`صورة ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                      />
                                    </div>
                                  )
                                )}
                              </div>
                            </div>

                            {/* مؤشرات scroll */}
                            {productImages.length > 3 && (
                              <div className="flex justify-center mt-2">
                                <div className="flex gap-1">
                                  {Array.from({
                                    length: Math.ceil(productImages.length / 3),
                                  }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${
                                        Math.floor(currentImageIndex / 3) === i
                                          ? "bg-blue-500"
                                          : "bg-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* تبويب الفيديو */}
              {activeTab === "video" && product.ShopVideoEmbed && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 bg-white rounded-lg overflow-hidden shadow-lg">
                    <div className="w-full h-full min-h-[250px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px]">
                      {/* عرض الفيديو حسب نوع الرابط */}
                      {product.ShopVideoEmbed.includes("vt.tiktok.com/") ? (
                        // TikTok المختصر - نعرض رابط مباشر مع زر المشاهدة
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                          <div className="text-center">
                            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">
                              فيديو TikTok
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm">
                              هذا الفيديو متاح على TikTok. اضغط على الزر أدناه
                              لمشاهدته
                            </p>
                            <Button
                              onClick={() =>
                                window.open(product.ShopVideoEmbed, "_blank")
                              }
                              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium"
                            >
                              مشاهدة الفيديو على TikTok
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // YouTube أو TikTok العادي - نستخدم iframe
                        <iframe
                          src={getSmartVideoEmbedUrl(product.ShopVideoEmbed)}
                          title={`فيديو ${product?.Name}`}
                          className="w-full h-full min-h-[250px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] border-0"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      )}
                    </div>
                  </div>

                  {/* معلومات الفيديو */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Video className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">فيديو توضيحي للمنتج</p>
                        <p className="text-blue-600">
                          {product.ShopVideoEmbed.includes("vt.tiktok.com/")
                            ? "اضغط على الزر أعلاه لمشاهدة الفيديو على TikTok"
                            : "يمكنك مشاهدة الفيديو أعلاه لمعرفة المزيد عن هذا المنتج"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* تفاصيل المنتج */}
            <div className="p-4 flex flex-col">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {/* Navigation and Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <Link href="/store">
                        <Button variant="ghost" size="sm">
                          <ArrowLeft className="w-4 h-4 ml-2" />
                          العودة للمتجر
                        </Button>
                      </Link>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(product?.ID)}
                          className={
                            isFavorite(product?.ID)
                              ? "text-red-600"
                              : "text-gray-600"
                          }
                          title={
                            isFavorite(product?.ID)
                              ? "إزالة من المفضلة"
                              : "إضافة للمفضلة"
                          }
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFavorite(product?.ID) ? "fill-current" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareProduct(product)}
                          title="مشاركة"
                          disabled={isSharing}
                        >
                          <Share2
                            className={`w-4 h-4 ${
                              isSharing ? "animate-pulse" : ""
                            }`}
                          />
                        </Button>
                      </div>
                    </div>

                    {/* 
                  <Button 
                    variant={isFavorite(product?.ID) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleFavorite(product?.ID)}
                    className={isFavorite(product?.ID) ? "text-red-600 bg-red-50 hover:bg-red-100" : ""}
                    title={isFavorite(product?.ID) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(product?.ID) ? "fill-current" : ""}`} />
                  </Button> */}
                  </div>
                  <div className="text-right">
                    {product.BarCode && (
                      <Badge className="bg-gray-100 text-gray-800 mb-2">
                        #{product.BarCode}
                      </Badge>
                    )}
                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                      {product?.Name}
                    </h1>
                    <div className="flex items-center gap-2">
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
                      <Badge className="bg-blue-100 text-blue-800">
                        فئة {product?.IDCategory}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* اختيار اللون والمقاس (بدون رصيد) */}
                {(availableColors.length > 0 || availableSizes.length > 0) && (
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">
                      الخيارات
                    </h3>
                    {/* الألوان */}
                    {availableColors.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-2 text-right">
                          اللون
                        </div>
                        <div className="flex flex-wrap gap-2 justify-start">
                          {availableColors.map((name) => {
                            const isActive = selectedColor === name;
                            const hex = colorHexByName[name] || "#000";
                            return (
                              <button
                                key={name}
                                onClick={() => {
                                  setSelectedColor(name);
                                  // تبديل الصورة الرئيسية وفقًا لصورة اللون
                                  const url = colorToVariantImage[name];
                                  if (url && typeof url === "string") {
                                    setOverrideMainImageUrl(url);
                                    setCurrentImageIndex(0);
                                  } else {
                                    setOverrideMainImageUrl(null);
                                  }
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition ${
                                  isActive
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white hover:bg-gray-50"
                                }`}
                                title={name}
                              >
                                <span
                                  className="inline-block w-5 h-5 sm:w-6 sm:h-6 rounded-full border"
                                  style={{ backgroundColor: hex }}
                                />
                                <span className="text-sm">{name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* المقاسات */}
                    {availableSizes.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-600 mb-2 text-right">
                          المقاس
                        </div>
                        <div className="flex flex-wrap gap-2 justify-start">
                          {availableSizes.map((size) => {
                            const isActive = selectedSize === size;
                            const fitKey = selectedColor
                              ? `${selectedColor}__${size}`
                              : "";
                            const fit =
                              colorSizeToFitting[fitKey] ||
                              sizeToFitting[size] ||
                              "";
                            return (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`px-3 py-1.5 rounded-md border text-sm transition ${
                                  isActive
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white hover:bg-gray-50"
                                }`}
                              >
                                ({size}) {fit}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* الوصف */}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">
                    الوصف
                  </h3>
                  <p className="text-gray-600 text-right leading-relaxed text-sm">
                    {product?.ShopShortDiscription || "منتج عالي الجودة"}
                  </p>
                </div>

                {/* الأسعار */}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">
                    الأسعار
                  </h3>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-700 font-semibold text-sm">
                        السعر الحالي:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrencyEGP(currentPrice)}
                      </span>
                    </div>

                    {product.ShopPriceBeforDiscount > currentPrice && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-700 text-sm">
                          السعر قبل الخصم:
                        </span>
                        <span className="font-semibold text-gray-500 line-through text-sm">
                          {formatCurrencyEGP(getOriginalPrice(product))}
                        </span>
                      </div>
                    )}

                    {getOriginalPrice(product) - currentPrice > 0 && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-700 text-sm">
                          قيمة الخصم:
                        </span>
                        <span className="font-semibold text-green-600 text-sm">
                          {formatCurrencyEGP(
                            Math.max(
                              0,
                              getOriginalPrice(product) - currentPrice
                            )
                          )}
                        </span>
                      </div>
                    )}

                    {getOriginalPrice(product) - currentPrice > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-green-700 text-sm">
                          نسبة الخصم:
                        </span>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {Math.round(
                            ((getOriginalPrice(product) - currentPrice) /
                              Math.max(1, getOriginalPrice(product))) *
                              100
                          )}
                          %
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

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
                        {product?.IDProductionCompany || "غير محدد"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">الوحدة:</div>
                      <div className="font-semibold text-sm">
                        {product.UnitCountOf || "غير محدد"}
                      </div>
                    </div>
                    {product.ShopColors && (
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">
                          الألوان المتوفرة:
                        </div>
                        <div className="font-semibold text-sm">
                          {product.ShopColors}
                        </div>
                      </div>
                    )}
                    {product.ShopSizes && (
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">
                          المقاسات المتوفرة:
                        </div>
                        <div className="font-semibold text-sm">
                          {product.ShopSizes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* الوصف التفصيلي */}
                {product.ShopLongDiscription && (
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">
                      وصف تفصيلي
                    </h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 text-right leading-relaxed text-sm">
                        {product.ShopLongDiscription}
                      </p>
                    </div>
                  </div>
                )}

                {/* روابط المنتج */}
                {(product.ShopLink1 ||
                  product.ShopLink2 ||
                  product.ShopLink3 ||
                  product.ShopLink4 ||
                  product.ShopLink5) && (
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">
                      روابط المنتج
                    </h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="space-y-2">
                        {product.ShopLink1 && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <a
                              href={product.ShopLink1}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1 text-right"
                            >
                              {product.ShopLink1}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(product.ShopLink1, "_blank")
                              }
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {product.ShopLink2 && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <a
                              href={product.ShopLink2}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1 text-right"
                            >
                              {product.ShopLink2}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(product.ShopLink2, "_blank")
                              }
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {product.ShopLink3 && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <a
                              href={product.ShopLink3}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1 text-right"
                            >
                              {product.ShopLink3}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(product.ShopLink3, "_blank")
                              }
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {product.ShopLink4 && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <a
                              href={product.ShopLink4}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1 text-right"
                            >
                              {product.ShopLink4}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(product.ShopLink4, "_blank")
                              }
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {product.ShopLink5 && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <a
                              href={product.ShopLink5}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1 text-right"
                            >
                              {product.ShopLink5}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(product.ShopLink5, "_blank")
                              }
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* أزرار الإجراءات */}
              <div className="border-t pt-3 mt-auto">
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2"
                    size="lg"
                    disabled={
                      loading || isProductInCart || product.IsShopUnavailable
                    }
                  >
                    <ShoppingCart className="w-4 h-4 ml-2" />
                    {loading
                      ? "جاري الإضافة..."
                      : isProductInCart
                      ? "المنتج موجود في السلة"
                      : product.IsShopUnavailable
                      ? "غير متوفر"
                      : "إضافة للسلة"}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="px-4"
                    onClick={() => shareProduct(product)}
                    disabled={isSharing}
                  >
                    <Share2
                      className={`w-4 h-4 ml-2 ${
                        isSharing ? "animate-pulse" : ""
                      }`}
                    />
                    {isSharing ? "جاري المشاركة..." : "مشاركة"}
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
        </div>

        {/* المنتجات المشابهة والأكثر مبيعاً */}
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* المنتجات المشابهة */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-right">
                منتجات مشابهة
              </h2>
              <SimilarProducts
                currentProductId={product?.ID}
                categoryId={product?.IDCategory}
                currentProductName={product?.Name}
              />
            </div>

            {/* الأكثر مبيعاً */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-right">
                الأكثر مبيعاً
              </h2>
              <BestSellingProducts />
            </div>
          </div>
        </div>

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

        {/* Cart Summary Dialog */}
        <CartSummaryDialog
          isOpen={showSuccessDialog}
          onClose={() => {
            setShowSuccessDialog(false);
            setAddedProduct(null);
          }}
          showSuccessMessage={true}
        />

        {/* Product Gallery Dialog */}
        <ProductGalleryDialog
          isOpen={showProductDialog}
          onClose={() => setShowProductDialog(false)}
          product={selectedProduct}
        />
      </div>
    </>
  );
}
