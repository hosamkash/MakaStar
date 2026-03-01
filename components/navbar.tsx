"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Menu,
  X,
  ShoppingCart,
  LogOut,
  Settings,
  Heart,
  CreditCard,
  Package,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Share2,
  TestTube,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/lib/contexts/cart-context";
import { useClientSession } from "@/lib/hooks/use-client-session";
import { useClientData } from "@/lib/hooks/use-client-data";
import { useFavorites } from "@/lib/hooks/use-favorites";
import ShopBannerSlider from "./shop-banner-slider";
import {
  ClientProfileTab,
  ClientOrdersTab,
  ClientCartTab,
  ClientFavoritesTab,
  ClientPaymentMethodsTab,
  ClientTransactionsTab,
} from "@/components/account-client";
import SessionTestPanel from "./session-test-panel";

export default function Navbar() {
  const pathname = usePathname();
  const { state: cartState } = useCart();
  const {
    session: clientSession,
    logout: clientLogout,
    refreshSession,
  } = useClientSession();
  const { favorites, removeFromFavorites } = useFavorites();

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
    refreshData,
  } = useClientData();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [, forceUpdate] = useState({});
  const [isSharing, setIsSharing] = useState(false);
  const [showSessionTest, setShowSessionTest] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // التحقق من أن الصفحة الحالية هي صفحة المتجر الرئيسية فقط
  const shouldShowShopBanner = pathname === "/store";

  // إضافة مراقب للتغييرات في الجلسة
  useEffect(() => {
    const handleSessionChange = () => {
      forceUpdate({});
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "client_session") {
        forceUpdate({});
      }
    };

    // تحديث انتهاء الصلاحية عند النشاط
    const handleUserActivity = () => {
      if (clientSession) {
        refreshSession();
      }
    };

    // إضافة مستمعات النشاط
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // مراقبة التغييرات كل ثانية للتأكد من التحديث
    const interval = setInterval(() => {
      forceUpdate({});
    }, 1000);

    window.addEventListener("sessionStorageChange", handleSessionChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("sessionStorageChange", handleSessionChange);
      window.removeEventListener("storage", handleStorageChange);

      // إزالة مستمعات النشاط
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, []);

  // تنظيف التركيز عند إغلاق الديالوج
  useEffect(() => {
    if (!activeDialog) {
      // إزالة التركيز من أي عنصر عند إغلاق الديالوج
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // إعادة تعيين مؤشر الماوس
      document.body.style.cursor = "default";

      // تنظيف أي حالة تركيز متبقية
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        document.body.style.cursor = "default";
      }, 100);
    }
  }, [activeDialog]);

  const navLinks = useMemo(
    () => [
      { href: "/", label: "الرئيسية" },
      { href: "/about", label: "من نحن" },
      // { href: "/apps", label: "التطبيقات" }, // مخفي مؤقتاً من المنيو
      { href: "/store", label: "المتجر" },
      { href: "/offers", label: "العروض" },
      { href: "/admin", label: "لوحة التحكم" },
    ],
    []
  );

  const openDialog = useCallback((dialogType: string) => {
    setActiveDialog(dialogType);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
  }, []);

  // دالة مشاركة الموقع - مبسطة
  const shareWebsite = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);

    const url = typeof window !== "undefined" ? window.location.origin : "";
    const shareText = "اكتشف منتجاتنا المتنوعة في متجر مكة ستار الإلكتروني";

    try {
      // محاولة استخدام Web Share API على الموبايل
      if (navigator.share) {
        await navigator.share({
          title: "شركة مكة ستار - متجر إلكتروني متكامل",
          text: shareText,
          url: url,
        });
      } else {
        // للكمبيوتر: فتح نافذة مشاركة بسيطة
        const shareWindow = window.open("", "_blank", "width=400,height=500");

        if (shareWindow) {
          shareWindow.document.write(`
            <html dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
              <head><title>مشاركة الموقع</title></head>
              <body>
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h2 style="text-align: center; color: #333; margin-bottom: 20px;">🌟 مشاركة موقع مكة ستار</h2>
                  
                  <input type="text" value="${url}" readonly style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px; direction: ltr;">
                  
                  <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button onclick="copyUrl()" style="padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                      📋 نسخ الرابط
                    </button>
                    
                    <a href="https://wa.me/?text=${encodeURIComponent(
                      shareText + " " + url
                    )}" target="_blank" style="padding: 12px; background: #25D366; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
                      📱 واتساب
                    </a>
                    
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      url
                    )}" target="_blank" style="padding: 12px; background: #1877F2; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
                      📘 فيسبوك
                    </a>
                    
                    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      shareText
                    )}&url=${encodeURIComponent(
            url
          )}" target="_blank" style="padding: 12px; background: #1DA1F2; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
                      🐦 تويتر
                    </a>
                  </div>
                  
                  <div id="success" style="display: none; background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin-top: 15px; text-align: center;">
                    تم نسخ الرابط بنجاح! ✅
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
          alert(`تم نسخ رابط الموقع للحافظة!\n\nالرابط: ${url}`);
        }
      }
    } catch (error) {
      console.error("خطأ في المشاركة:", error);
      // محاولة أخيرة: نسخ الرابط
      try {
        await navigator.clipboard.writeText(url);
        alert(`تم نسخ رابط الموقع للحافظة!\n\nالرابط: ${url}`);
      } catch {
        alert(`حدث خطأ في المشاركة. يرجى نسخ الرابط يدوياً:\n\n${url}`);
      }
    } finally {
      setTimeout(() => setIsSharing(false), 1000);
    }
  }, [isSharing]);

  // إضافة مستمع لمفتاح ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeDialog) {
        closeDialog();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDialog, closeDialog]);

  // التحقق من إمكانية التمرير
  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  // التمرير لليسار
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  }, []);

  // التمرير لليمين
  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  }, []);

  // إضافة مستمع للتمرير
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);
      checkScrollButtons(); // التحقق الأولي

      return () => {
        scrollContainer.removeEventListener("scroll", checkScrollButtons);
        window.removeEventListener("resize", checkScrollButtons);
      };
    }
  }, [checkScrollButtons]);

  return (
    <>
      <nav className="bg-primary-dark text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo/Company Name */}
            <Link
              href="/"
              className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-bold text-accent-gold truncate flex-shrink-0"
            >
              <img
                src="/maka-star-logo.png"
                alt="مكه ستار"
                className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 object-contain"
              />
              <span className="hidden sm:inline">مكة ستار</span>
              <span className="sm:hidden">مكة ستار</span>
            </Link>

            {/* Desktop Navigation Links - Large Screens */}
            <div
              className="hidden xl:flex items-center text-base lg:text-lg"
              dir="rtl"
            >
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`hover:text-primary transition-colors duration-200 whitespace-nowrap ${
                    index < navLinks.length - 1 ? "ml-8 xl:ml-10" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Scrollable Navigation - Medium Screens */}
            <div className="hidden lg:flex xl:hidden items-center flex-1 mx-4 relative">
              {/* Left Scroll Button */}
              {canScrollLeft && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 z-10 bg-primary-dark/90 hover:bg-primary-dark text-white rounded-full h-8 w-8 flex-shrink-0 scroll-button"
                  onClick={scrollLeft}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              {/* Scrollable Container */}
              <div
                ref={scrollContainerRef}
                className="flex items-center gap-6 px-8 overflow-x-auto scrollbar-hide scroll-smooth"
                dir="rtl"
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="hover:text-primary transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm nav-link-scrollable"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Right Scroll Button */}
              {canScrollRight && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 z-10 bg-primary-dark/90 hover:bg-primary-dark text-white rounded-full h-8 w-8 flex-shrink-0 scroll-button"
                  onClick={scrollRight}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Desktop Icons */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 hover:text-accent-gold transition-colors"
                onClick={shareWebsite}
                disabled={isSharing}
                title="مشاركة الموقع"
              >
                <Share2
                  className={`h-4 w-4 lg:h-5 lg:w-5 ${
                    isSharing ? "animate-pulse" : ""
                  }`}
                />
                <span className="sr-only">مشاركة الموقع</span>
              </Button>

              {/* Session Test Button - Development Only */}
              {process.env.NODE_ENV === "development" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 hover:text-accent-gold transition-colors"
                  onClick={() => setShowSessionTest(true)}
                  title="Session Test Panel"
                >
                  <TestTube className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="sr-only">Session Test Panel</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 hover:text-accent-gold transition-colors relative"
                asChild
              >
                <Link href="/cart">
                  <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5" />
                  {cartState.totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartState.totalItems}
                    </span>
                  )}
                  <span className="sr-only">سلة التسوق</span>
                </Link>
              </Button>
              {clientSession ? (
                <DropdownMenu
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 hover:text-accent-gold transition-colors"
                      title="حسابي"
                    >
                      <User className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span className="sr-only">حسابي</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-center font-bold text-primary-dark">
                      <Link
                        href="/account_client"
                        className="text-accent-gold hover:text-accent-gold/80 transition-colors cursor-pointer block py-2 px-3 rounded-md hover:bg-gray-50"
                        title="عرض الحساب الكامل"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        {clientSession.name}
                        <span className="block text-xs text-gray-500 mt-1">
                          اضغط لعرض الحساب الكامل
                        </span>
                      </Link>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        openDialog("profile");
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="h-4 w-4" />
                      الملف الشخصي
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        openDialog("orders");
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="h-4 w-4" />
                      طلباتي الحالية
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        openDialog("cart");
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      سلة المشتريات
                      {cartState.totalItems > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center ml-auto"
                        >
                          {cartState.totalItems}
                        </Badge>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        openDialog("favorites");
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Heart className="h-4 w-4" />
                      منتجاتي المفضلة
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        openDialog("payment-methods");
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      طرق الدفع
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        openDialog("transactions");
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="h-4 w-4" />
                      مشترياتي السابقة
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        clientLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 hover:text-accent-gold transition-colors flex items-center gap-2 px-3 py-2 rounded-md"
                  asChild
                >
                  <Link href="/account_client/client-login">
                    <User className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="text-sm lg:text-base font-medium">
                      تسجيل دخول
                    </span>
                  </Link>
                </Button>
              )}
            </div>

            {/* Mobile Icons - Small Screens */}
            <div className="flex lg:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 hover:text-accent-gold transition-colors"
                onClick={shareWebsite}
                disabled={isSharing}
                title="مشاركة الموقع"
              >
                <Share2
                  className={`h-5 w-5 ${isSharing ? "animate-pulse" : ""}`}
                />
                <span className="sr-only">مشاركة الموقع</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 hover:text-accent-gold transition-colors relative"
                asChild
              >
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartState.totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartState.totalItems}
                    </span>
                  )}
                  <span className="sr-only">سلة التسوق</span>
                </Link>
              </Button>

              {/* Mobile Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 hover:text-accent-gold"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">فتح القائمة</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[280px] sm:w-[350px] bg-white text-primary-dark overflow-y-auto"
                  dir="rtl"
                >
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-lg font-bold text-accent-gold text-right">
                      <img
                        src="/maka-star-logo.png"
                        alt="مكه ستار"
                        className="h-8 w-8 object-contain"
                      />
                      <span>مكة ستار</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-end pb-4 border-b">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="text-primary-dark hover:bg-gray-100"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <nav className="flex flex-col py-6 flex-1 overflow-y-auto">
                      {/* زر تسجيل الدخول أول القائمة عند عدم تسجيل الدخول */}
                      {!clientSession && (
                        <Button
                          className="w-full mb-4"
                          variant="outline"
                          asChild
                        >
                          <Link
                            href="/account_client/client-login"
                            onClick={() => setIsOpen(false)}
                          >
                            <User className="h-4 w-4 ml-2" />
                            تسجيل دخول
                          </Link>
                        </Button>
                      )}
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-lg font-medium hover:text-primary transition-colors py-3 px-4 rounded-md hover:bg-gray-50 mb-2"
                          onClick={() => setIsOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}

                      {/* زر السلة في القائمة المحمولة */}
                      <Link
                        href="/cart"
                        className="flex items-center gap-2 justify-start text-lg font-medium py-3 px-4 rounded-md hover:bg-gray-50 mb-2 border border-gray-200"
                        onClick={() => setIsOpen(false)}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        سلة التسوق
                        {cartState.totalItems > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                          >
                            {cartState.totalItems}
                          </Badge>
                        )}
                      </Link>

                      {/* زر المشاركة في القائمة المحمولة */}
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 justify-start text-lg font-medium py-3 px-4 rounded-md hover:bg-gray-50 mb-2 border border-gray-200 w-full"
                        onClick={() => {
                          shareWebsite();
                          setIsOpen(false);
                        }}
                        disabled={isSharing}
                      >
                        <Share2
                          className={`w-5 h-5 ${
                            isSharing ? "animate-pulse" : ""
                          }`}
                        />
                        {isSharing ? "جاري المشاركة..." : "مشاركة الموقع"}
                      </Button>
                    </nav>
                    <div className="border-t pt-4">
                      {clientSession ? (
                        <div className="space-y-2">
                          <div className="text-center text-sm text-gray-600 mb-2">
                            مرحباً،{" "}
                            <Link
                              href="/account_client"
                              className="text-accent-gold hover:text-accent-gold/80 transition-colors cursor-pointer font-semibold"
                              title="عرض الحساب الكامل"
                              onClick={() => setIsOpen(false)}
                            >
                              {clientSession.name}
                            </Link>
                            <span className="block text-xs text-gray-500 mt-1">
                              اضغط على الاسم لعرض الحساب الكامل
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 justify-start text-lg font-medium py-3 px-4 rounded-md hover:bg-gray-50 mb-2 border border-gray-200 w-full"
                            onClick={() => {
                              openDialog("profile");
                              setIsOpen(false);
                            }}
                          >
                            <UserCheck className="w-5 h-5" />
                            الملف الشخصي
                          </Button>

                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 justify-start text-lg font-medium py-3 px-4 rounded-md hover:bg-gray-50 mb-2 border border-gray-200 w-full"
                            onClick={() => {
                              openDialog("orders");
                              setIsOpen(false);
                            }}
                          >
                            <Package className="w-5 h-5" />
                            طلباتي الحالية
                          </Button>

                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 justify-start text-lg font-medium py-3 px-4 rounded-md hover:bg-gray-50 mb-2 border border-gray-200 w-full"
                            onClick={() => {
                              openDialog("favorites");
                              setIsOpen(false);
                            }}
                          >
                            <Heart className="w-5 h-5" />
                            منتجاتي المفضلة
                          </Button>

                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 justify-start text-lg font-medium py-3 px-4 rounded-md hover:bg-gray-50 mb-2 border border-gray-200 w-full"
                            onClick={() => {
                              openDialog("payment-methods");
                              setIsOpen(false);
                            }}
                          >
                            <CreditCard className="w-5 h-5" />
                            طرق الدفع
                          </Button>

                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 justify-start text-lg font-medium py-3 px-4 rounded-md hover:bg-gray-50 mb-2 border border-gray-200 w-full"
                            onClick={() => {
                              openDialog("transactions");
                              setIsOpen(false);
                            }}
                          >
                            <Package className="w-5 h-5" />
                            مشترياتي السابقة
                          </Button>

                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => {
                              clientLogout();
                              setIsOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4 ml-2" />
                            تسجيل الخروج
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* بنر المتجر - يظهر فقط في صفحة المتجر الرئيسية */}
      {shouldShowShopBanner && (
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 py-2">
            <ShopBannerSlider
              className="w-full"
              autoPlay={true}
              autoPlayInterval={4000}
              showControls={true}
              showIndicators={true}
              showArrows={true}
            />
          </div>
        </div>
      )}

      {/* Dialogs for Client Components */}

      {/* Profile Dialog */}
      {activeDialog === "profile" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => closeDialog()}
          />
          <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-right">الملف الشخصي</h2>
              <button
                onClick={() => closeDialog()}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {isLoadingData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-3 text-gray-600">
                    جاري تحميل البيانات...
                  </span>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Dialog */}
      {activeDialog === "orders" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => closeDialog()}
          />
          <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-right">
                طلباتي الحالية
              </h2>
              <button
                onClick={() => closeDialog()}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ClientOrdersTab
                orders={orders}
                isLoadingOrders={isLoadingOrders}
                onRefresh={refreshData}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cart Dialog */}
      {activeDialog === "cart" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => closeDialog()}
          />
          <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-right">
                سلة المشتريات
              </h2>
              <button
                onClick={() => closeDialog()}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ClientCartTab cartState={cartState} />
            </div>
          </div>
        </div>
      )}

      {/* Favorites Dialog */}
      {activeDialog === "favorites" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => closeDialog()}
          />
          <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-right">
                منتجاتي المفضلة
              </h2>
              <button
                onClick={() => closeDialog()}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ClientFavoritesTab
                favorites={favorites}
                onRemoveFromFavorites={removeFromFavorites}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Dialog */}
      {activeDialog === "payment-methods" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => closeDialog()}
          />
          <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-right">طرق الدفع</h2>
              <button
                onClick={() => closeDialog()}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ClientPaymentMethodsTab />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Dialog */}
      {activeDialog === "transactions" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => closeDialog()}
          />
          <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-right">
                مشترياتي السابقة
              </h2>
              <button
                onClick={() => closeDialog()}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ClientTransactionsTab
                orders={orders}
                isLoadingOrders={isLoadingOrders}
              />
            </div>
          </div>
        </div>
      )}

      {/* Session Test Panel */}
      <SessionTestPanel
        isOpen={showSessionTest}
        onClose={() => setShowSessionTest(false)}
      />
    </>
  );
}
