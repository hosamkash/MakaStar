"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from "react";
import { notify } from "@/lib/notifications";
import { CartService } from "@/lib/services/cart-service";

// تعريف نوع عنصر السلة
export interface CartItem {
  ID?: number;
  BarCode?: number;
  IDProduct?: number;
  Name?: string;
  IDCategory?: number;
  IDProductionCompany?: number;
  UnitID?: number;
  PurchasePrice?: number;
  Qty: number;
  PriceBeforDiscount?: number;
  DiscountValue?: number;
  DiscountPercent?: number;
  SalesPrice?: number;
  TotalPriceBeforDiscount?: number;
  TotalDiscountValue?: number;
  TotalSalesPrice?: number;
  ProfitValue?: number;
  TotalProfitValue?: number;
  ShopColors?: string;
  ShopSizes?: string;
  ShopShortDiscription?: string;
  ShopLongDiscription?: string;
  ImageName?: string;
  ImageURL?: string;
  ImageFolderPath?: string;
  Notes?: string; // ملاحظات عامة (لن نستخدمها لعرض اللون/المقاس بعد الآن)
  // اختيارات المتجر
  SelectedColor?: string;
  SelectedSize?: string;
  SelectedFitting?: string;
  SelectedImageURL?: string;
  SelectedColorID?: string;
  SelectedSizeID?: string;
  SelectedColorHex?: string;
  UserID?: number;
  UID?: string;
  DefaultSalesCommission?: number;
  TotalSalesCommission?: number; // إجمالي عمولة المندوب (DefaultSalesCommission * Qty)
  // حقول الراعي الشخصي
  PersonalSponsorID?: string; // معرف الراعي الشخصي
  PersonalSponsorCode?: string; // كود الراعي الشخصي
  PersonalSponsorName?: string; // اسم الراعي الشخصي
  PersonalSponsorMobile?: string; // موبايل الراعي الشخصي
  // حقول خاصة بالعروض
  isOffer?: boolean; // هل هذا عنصر عرض؟
  offerId?: number; // معرف العرض
  offerName?: string; // اسم العرض
  offerProductsCount?: number; // عدد المنتجات في العرض
  offerDescription?: string; // وصف العرض
  // حقول التاريخ والوقت
  AddedDate?: string; // تاريخ الإضافة
  AddedTime?: string; // وقت الإضافة
  AddedDateTime?: string; // التاريخ والوقت الكامل
  LastUpdatedDate?: string; // تاريخ آخر تحديث
  LastUpdatedTime?: string; // وقت آخر تحديث
  LastUpdatedDateTime?: string; // التاريخ والوقت الكامل لآخر تحديث
}

// تعريف نوع العروض
export interface Offer {
  ID: number;
  Name: string;
  DiscountType: "fixed" | "percentage"; // نوع الخصم: ثابت أو نسبة
  DiscountValue: number; // قيمة الخصم
  MinOrderValue?: number; // الحد الأدنى لقيمة الطلب
  MaxDiscountValue?: number; // الحد الأقصى لقيمة الخصم
  IsActive: boolean;
}

// تعريف حالة السلة
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalDiscount: number;
  totalAfterDiscount: number;
  shipping: number; // الشحن والتوصيل
  appliedOffer: Offer | null; // العرض المطبق
  offerDiscount: number; // خصم العرض
  productOffersDiscount: number; // خصم عروض المنتجات
  finalTotal: number; // الإجمالي النهائي بعد الشحن والخصم
}

// تعريف إجراءات السلة
type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { IDProduct: number } }
  | { type: "UPDATE_QUANTITY"; payload: { IDProduct: number; qty: number } }
  | { type: "UPDATE_ITEM_NOTES"; payload: { IDProduct: number; notes: string } }
  | { type: "UPDATE_PERSONAL_SPONSOR"; payload: any }
  | { type: "APPLY_OFFER"; payload: Offer | null }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] };

// الحالة الأولية
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  totalDiscount: 0,
  totalAfterDiscount: 0,
  shipping: 50, // الشحن والتوصيل ثابت 50 جنية
  appliedOffer: null,
  offerDiscount: 0,
  productOffersDiscount: 0, // خصم عروض المنتجات
  finalTotal: 0,
};

// دالة حساب الإجماليات
const calculateTotals = (
  items: CartItem[],
  appliedOffer: Offer | null = null
) => {
  const totalItems = items.reduce((sum, item) => sum + item.Qty, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.TotalPriceBeforDiscount || 0),
    0
  );

  // حساب خصم عروض المنتجات (العروض المضافة كباكدج)
  const productOffersDiscount = items
    .filter((item) => item.isOffer)
    .reduce((sum, item) => sum + (item.TotalDiscountValue || 0), 0);

  // حساب خصم الأصناف العادية (غير العروض)
  const regularItemsDiscount = items
    .filter((item) => !item.isOffer)
    .reduce((sum, item) => sum + (item.TotalDiscountValue || 0), 0);

  // إجمالي الخصم = خصم الأصناف العادية + خصم عروض المنتجات
  const totalDiscount = regularItemsDiscount + productOffersDiscount;

  const totalAfterDiscount = items.reduce(
    (sum, item) => sum + (item.TotalSalesPrice || 0),
    0
  );
  const shipping = 50; // الشحن والتوصيل ثابت 50 جنية

  // حساب خصم العرض
  let offerDiscount = 0;
  if (appliedOffer && appliedOffer.IsActive) {
    if (totalAfterDiscount >= (appliedOffer.MinOrderValue || 0)) {
      if (appliedOffer.DiscountType === "fixed") {
        offerDiscount = appliedOffer.DiscountValue;
      } else if (appliedOffer.DiscountType === "percentage") {
        offerDiscount = (totalAfterDiscount * appliedOffer.DiscountValue) / 100;
        // تطبيق الحد الأقصى للخصم إذا كان محدداً
        if (
          appliedOffer.MaxDiscountValue &&
          offerDiscount > appliedOffer.MaxDiscountValue
        ) {
          offerDiscount = appliedOffer.MaxDiscountValue;
        }
      }
    }
  }

  const finalTotal = totalAfterDiscount - offerDiscount + shipping;

  return {
    totalItems,
    totalPrice,
    totalDiscount: regularItemsDiscount, // خصم الأصناف العادية فقط
    totalAfterDiscount,
    shipping,
    offerDiscount,
    productOffersDiscount,
    finalTotal,
  };
};

// Reducer للسلة
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      // البحث عن منتج مطابق باللون والمقاس
      const existingItemIndex = state.items.findIndex((item) => {
        if (item.IDProduct !== action.payload.IDProduct) return false;

        // التحقق من اللون والمقاس
        const colorMatch =
          item.SelectedColor === (action.payload as any).SelectedColor;
        const sizeMatch =
          item.SelectedSize === (action.payload as any).SelectedSize;

        return colorMatch && sizeMatch;
      });

      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // تحديث الكمية إذا كان المنتج موجود بنفس اللون والمقاس
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                Qty: item.Qty + action.payload.Qty,
                TotalPriceBeforDiscount:
                  (item.PriceBeforDiscount || 0) *
                  (item.Qty + action.payload.Qty),
                TotalSalesPrice:
                  (item.SalesPrice || 0) * (item.Qty + action.payload.Qty),
                TotalDiscountValue:
                  (item.DiscountValue || 0) * (item.Qty + action.payload.Qty),
              }
            : item
        );
      } else {
        // إضافة منتج جديد (منتج مختلف أو لون/مقاس مختلف)
        newItems = [...state.items, action.payload];
      }

      const totals = calculateTotals(newItems, state.appliedOffer);
      return { ...state, items: newItems, ...totals };
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => {
        if (item.IDProduct !== action.payload.IDProduct) return true;

        // التحقق من اللون والمقاس إذا كان المنتج مطابق
        const colorMatch =
          item.SelectedColor === (action.payload as any).SelectedColor;
        const sizeMatch =
          item.SelectedSize === (action.payload as any).SelectedSize;

        // نحتفظ بالمنتج إذا كان مختلف في اللون أو المقاس
        return !(colorMatch && sizeMatch);
      });
      const totals = calculateTotals(newItems, state.appliedOffer);
      return { ...state, items: newItems, ...totals };
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items.map((item) => {
        // التحقق من المنتج واللون والمقاس
        const isProductMatch = item.IDProduct === action.payload.IDProduct;
        const colorMatch =
          item.SelectedColor === (action.payload as any).SelectedColor;
        const sizeMatch =
          item.SelectedSize === (action.payload as any).SelectedSize;

        if (isProductMatch && colorMatch && sizeMatch) {
          return {
            ...item,
            Qty: action.payload.qty,
            TotalPriceBeforDiscount:
              (item.PriceBeforDiscount || 0) * action.payload.qty,
            TotalSalesPrice: (item.SalesPrice || 0) * action.payload.qty,
            TotalDiscountValue: (item.DiscountValue || 0) * action.payload.qty,
          };
        }
        return item;
      });
      const totals = calculateTotals(newItems, state.appliedOffer);
      return { ...state, items: newItems, ...totals };
    }

    case "UPDATE_ITEM_NOTES": {
      const newItems = state.items.map((item) => {
        // التحقق من المنتج واللون والمقاس
        const isProductMatch = item.IDProduct === action.payload.IDProduct;
        const colorMatch =
          item.SelectedColor === (action.payload as any).SelectedColor;
        const sizeMatch =
          item.SelectedSize === (action.payload as any).SelectedSize;

        if (isProductMatch && colorMatch && sizeMatch) {
          return { ...item, Notes: action.payload.notes };
        }
        return item;
      });
      return { ...state, items: newItems };
    }

    case "UPDATE_PERSONAL_SPONSOR": {
      const sponsorData = action.payload;
      const newItems = state.items.map((item) => ({
        ...item,
        PersonalSponsorID: sponsorData.id,
        PersonalSponsorCode: sponsorData.code,
        PersonalSponsorName: sponsorData.name,
        PersonalSponsorMobile: sponsorData.mobile,
      }));
      return { ...state, items: newItems };
    }

    case "APPLY_OFFER": {
      const totals = calculateTotals(state.items, action.payload);
      return {
        ...state,
        appliedOffer: action.payload,
        ...totals,
      };
    }

    case "CLEAR_CART":
      return initialState;

    case "LOAD_CART":
      const totals = calculateTotals(action.payload, state.appliedOffer);
      return { ...state, items: action.payload, ...totals };

    default:
      return state;
  }
};

// إنشاء Context
interface CartContextType {
  state: CartState;
  addToCart: (product: any, quantity?: number) => Promise<void>;
  removeFromCart: (
    IDProduct: number,
    selectedColor?: string,
    selectedSize?: string
  ) => Promise<void>;
  updateQuantity: (
    IDProduct: number,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => Promise<void>;
  updateItemNotes: (
    IDProduct: number,
    notes: string,
    selectedColor?: string,
    selectedSize?: string
  ) => Promise<void>;
  updatePersonalSponsor: (sponsorData: any) => Promise<void>;
  loadDefaultPersonalSponsorIfNeeded: () => Promise<void>;
  applyOffer: (offer: Offer | null) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (
    IDProduct: number,
    selectedColor?: string,
    selectedSize?: string
  ) => boolean;
  getCartItem: (
    IDProduct: number,
    selectedColor?: string,
    selectedSize?: string
  ) => CartItem | undefined;
  syncWithFirebase: () => Promise<void>;
  loadFromFirebase: () => Promise<void>;
  forceUpdate: () => void;
  broadcastCartUpdate: () => void;
  refreshCartState: () => Promise<void>;
  isFirebaseEnabled: boolean;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider للسلة
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isFirebaseEnabled, setIsFirebaseEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // تحميل السلة من localStorage عند بدء التطبيق
  useEffect(() => {
    const loadCartData = async () => {
      try {
        // أولاً: محاولة تحميل من Firebase
        const userID = CartService.getCurrentUserID();
        if (userID) {
          try {
            const firebaseItems = await CartService.getCartItems(userID);
            if (firebaseItems && firebaseItems.length > 0) {
              console.log(
                "Loading cart from Firebase:",
                firebaseItems.length,
                "items"
              );
              dispatch({ type: "LOAD_CART", payload: firebaseItems });
              setIsFirebaseEnabled(true);
              return;
            }
          } catch (error) {
            console.log("Firebase not available, trying localStorage");
          }
        }

        // ثانياً: تحميل من localStorage إذا لم يكن Firebase متاحاً
        const savedCart = localStorage.getItem("shopping-cart");
        if (savedCart) {
          try {
            const cartItems = JSON.parse(savedCart);
            console.log(
              "Loading cart from localStorage:",
              cartItems.length,
              "items"
            );
            dispatch({ type: "LOAD_CART", payload: cartItems });
          } catch (error) {
            console.error("Error loading cart from localStorage:", error);
          }
        }

        // التحقق من إمكانية الاتصال بـ Firebase
        const checkFirebaseConnection = async () => {
          try {
            const userID = CartService.getCurrentUserID();
            if (userID) {
              await CartService.getCartItems(userID);
              setIsFirebaseEnabled(true);
            }
          } catch (error) {
            console.log("Firebase not available, using localStorage only");
            setIsFirebaseEnabled(false);
          }
        };

        checkFirebaseConnection();
      } catch (error) {
        console.error("Error loading cart data:", error);
      }
    };

    loadCartData();
  }, []);

  // حفظ السلة في localStorage عند تغييرها
  useEffect(() => {
    localStorage.setItem("shopping-cart", JSON.stringify(state.items));
  }, [state.items]);

  // مزامنة تلقائية مع Firebase عند تغيير السلة (محسنة)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const syncWithFirebase = async () => {
      if (isFirebaseEnabled && state.items.length > 0) {
        try {
          const userID = CartService.getCurrentUserID();
          if (userID) {
            // مزامنة مع Firebase في الخلفية
            await CartService.syncCartWithFirebase(userID, state.items);
            console.log("Cart synced with Firebase automatically");
          }
        } catch (error) {
          console.error("Error auto-syncing with Firebase:", error);
        }
      }
    };

    // تأخير أطول لتجنب المزامنة المتكررة - فقط عند تغيير فعلي
    if (state.items.length > 0) {
      timeoutId = setTimeout(syncWithFirebase, 5000); // زيادة التأخير
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [state.items.length, isFirebaseEnabled]); // فقط length وليس items كاملة

  // مراقبة التغييرات في localStorage من الصفحات الأخرى (محسنة)
  useEffect(() => {
    let isUpdating = false;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "shopping-cart" && e.newValue && !isUpdating) {
        try {
          isUpdating = true;
          const cartItems = JSON.parse(e.newValue);

          // التحقق من أن البيانات مختلفة فعلاً
          const currentItems = state.items;
          if (JSON.stringify(cartItems) !== JSON.stringify(currentItems)) {
            console.log(
              "Cart updated from another tab:",
              cartItems.length,
              "items"
            );
            dispatch({ type: "LOAD_CART", payload: cartItems });
          }
        } catch (error) {
          console.error("Error loading cart from storage event:", error);
        } finally {
          setTimeout(() => {
            isUpdating = false;
          }, 100);
        }
      }
    };

    // مراقبة التغييرات في localStorage فقط
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [state.items]);

  // تحديث الحالة عند التركيز على الصفحة (محسن)
  useEffect(() => {
    let lastFocusTime = 0;

    const handleFocus = () => {
      const now = Date.now();
      // تجنب التحديث المتكرر - مرة واحدة كل 5 ثوانٍ على الأكثر
      if (now - lastFocusTime > 5000) {
        console.log("Page focused, refreshing cart state");
        refreshCartState();
        lastFocusTime = now;
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // دالة تحديث الحالة فوراً
  const forceUpdate = () => {
    const savedCart = localStorage.getItem("shopping-cart");
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: "LOAD_CART", payload: cartItems });
      } catch (error) {
        console.error("Error force updating cart:", error);
      }
    }
  };

  // دالة بث تحديث السلة لجميع الصفحات (مبسطة)
  const broadcastCartUpdate = () => {
    // تحديث localStorage لإشعار الصفحات الأخرى
    localStorage.setItem("shopping-cart", JSON.stringify(state.items));
  };

  // دالة تحديث الحالة فوراً من جميع المصادر (محسنة)
  const refreshCartState = async () => {
    try {
      // أولاً: محاولة تحميل من Firebase
      if (isFirebaseEnabled) {
        const userID = CartService.getCurrentUserID();
        if (userID) {
          const firebaseItems = await CartService.getCartItems(userID);
          if (firebaseItems && firebaseItems.length > 0) {
            // التحقق من أن البيانات مختلفة فعلاً
            const currentItems = state.items;
            if (
              JSON.stringify(firebaseItems) !== JSON.stringify(currentItems)
            ) {
              console.log(
                "Refreshing cart from Firebase:",
                firebaseItems.length,
                "items"
              );
              dispatch({ type: "LOAD_CART", payload: firebaseItems });
            }
            return;
          }
        }
      }

      // ثانياً: تحميل من localStorage
      const savedCart = localStorage.getItem("shopping-cart");
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        // التحقق من أن البيانات مختلفة فعلاً
        const currentItems = state.items;
        if (JSON.stringify(cartItems) !== JSON.stringify(currentItems)) {
          console.log(
            "Refreshing cart from localStorage:",
            cartItems.length,
            "items"
          );
          dispatch({ type: "LOAD_CART", payload: cartItems });
        }
      }
    } catch (error) {
      console.error("Error refreshing cart state:", error);
    }
  };

  // دالة إضافة منتج للسلة
  const addToCart = async (product: any, quantity: number = 1) => {
    // منع الإضافة إذا لم يكن المستخدم مسجلاً الدخول
    const sessionStr = localStorage.getItem("client_session");
    if (!sessionStr) {
      notify.error("يجب تسجيل الدخول لإضافة المنتجات إلى السلة");
      throw new Error("Login required");
    }
    setIsLoading(true);
    try {
      console.log("Adding product to cart:", product.ID, "quantity:", quantity);

      // فحص معرف المستخدم
      const currentUserID = CartService.getCurrentUserID();
      console.log("Current user ID:", currentUserID);
      console.log("Parsed user ID:", parseInt(currentUserID) || -1);

      // تشخيص بيانات المنتج الأصلي
      console.log("بيانات المنتج الأصلي:", {
        productID: product.ID || product.IDProduct,
        productName: product.Name,
        defaultSalesCommission: product.DefaultSalesCommission,
        selectedColor: product.selectedColor || product.SelectedColor,
        selectedSize: product.selectedSize || product.SelectedSize,
        selectedFitting: product.selectedFitting || product.SelectedFitting,
        selectedImageURL: product.SelectedImageURL,
        selectedColorID: product.selectedColorID || product.SelectedColorID,
        selectedSizeID: product.selectedSizeID || product.SelectedSizeID,
        selectedColorHex: product.selectedColorHex || product.SelectedColorHex,
        allProductKeys: Object.keys(product),
      });

      const cartItem: CartItem = {
        ID: product.ID || 0,
        BarCode: product.BarCode || 0,
        IDProduct: product.IDProduct || product.ID || 0,
        Name: product.Name || "",
        IDCategory: product.IDCategory || 0,
        IDProductionCompany: product.IDProductionCompany || 0,
        UnitID: product.UnitID || product.UnitSmall_ID || 1,
        PurchasePrice:
          product.PurchasePrice || product.UnitSmall_PurchasePrice || 0,
        Qty: quantity,
        PriceBeforDiscount:
          product.PriceBeforDiscount ||
          product.ShopPriceBeforDiscount ||
          product.UnitSmall_Sales1 ||
          0,
        DiscountValue: product.DiscountValue || product.ShopDiscountValue || 0,
        DiscountPercent:
          product.DiscountPercent || product.ShopDiscountPercent || 0,
        SalesPrice:
          product.SalesPrice ||
          product.ShopPrice ||
          product.UnitSmall_Sales1 ||
          0,
        TotalPriceBeforDiscount:
          product.TotalPriceBeforDiscount ||
          (product.PriceBeforDiscount ||
            product.ShopPriceBeforDiscount ||
            product.UnitSmall_Sales1 ||
            0) * quantity,
        TotalDiscountValue:
          product.TotalDiscountValue ||
          (product.DiscountValue || product.ShopDiscountValue || 0) * quantity,
        TotalSalesPrice:
          product.TotalSalesPrice ||
          (product.SalesPrice ||
            product.ShopPrice ||
            product.UnitSmall_Sales1 ||
            0) * quantity,
        ProfitValue:
          product.ProfitValue ||
          (product.SalesPrice ||
            product.ShopPrice ||
            product.UnitSmall_Sales1 ||
            0) -
            (product.PurchasePrice || product.UnitSmall_PurchasePrice || 0),
        TotalProfitValue:
          product.TotalProfitValue ||
          ((product.SalesPrice ||
            product.ShopPrice ||
            product.UnitSmall_Sales1 ||
            0) -
            (product.PurchasePrice || product.UnitSmall_PurchasePrice || 0)) *
            quantity,
        ShopColors: product.ShopColors || "",
        ShopSizes: product.ShopSizes || "",
        ShopShortDiscription: product.ShopShortDiscription || "",
        ShopLongDiscription: product.ShopLongDiscription || "",
        ImageName: product.ImageName || "",
        ImageURL: product.SelectedImageURL || product.ImageURL || "",
        ImageFolderPath: product.ImageFolderPath || "",
        Notes: "",
        SelectedColor: product.selectedColor || product.SelectedColor || "",
        SelectedSize: product.selectedSize || product.SelectedSize || "",
        SelectedFitting:
          product.selectedFitting || product.SelectedFitting || "",
        SelectedImageURL: product.SelectedImageURL || "",
        SelectedColorID:
          product.selectedColorID || product.SelectedColorID || "",
        SelectedSizeID: product.selectedSizeID || product.SelectedSizeID || "",
        SelectedColorHex:
          product.selectedColorHex || product.SelectedColorHex || "",
        UserID: parseInt(CartService.getCurrentUserID()) || 1,
        UID: product.UID || "",
        DefaultSalesCommission: product.DefaultSalesCommission || 0,
        TotalSalesCommission: (product.DefaultSalesCommission || 0) * quantity,
        // حقول خاصة بالعروض
        isOffer: product.isOffer || false,
        offerId: product.offerId || undefined,
        offerName: product.offerName || "",
        offerProductsCount: product.offerProductsCount || 0,
        offerDescription: product.offerDescription || "",
      };

      // تشخيص بيانات السلة النهائية
      console.log("بيانات السلة النهائية:", {
        cartItemID: cartItem.IDProduct,
        cartItemName: cartItem.Name,
        defaultSalesCommission: cartItem.DefaultSalesCommission,
        totalSalesCommission: cartItem.TotalSalesCommission,
        selectedColor: cartItem.SelectedColor,
        selectedSize: cartItem.SelectedSize,
        selectedFitting: cartItem.SelectedFitting,
        selectedImageURL: cartItem.SelectedImageURL,
        selectedColorID: cartItem.SelectedColorID,
        selectedSizeID: cartItem.SelectedSizeID,
        selectedColorHex: cartItem.SelectedColorHex,
        qty: cartItem.Qty,
      });

      // التحقق من صحة البيانات قبل الحفظ
      if (
        cartItem.SelectedColor === null ||
        cartItem.SelectedColor === undefined
      ) {
        console.warn("تحذير: اللون المختار فارغ أو غير محدد");
        cartItem.SelectedColor = "";
      }
      if (
        cartItem.SelectedSize === null ||
        cartItem.SelectedSize === undefined
      ) {
        console.warn("تحذير: المقاس المختار فارغ أو غير محدد");
        cartItem.SelectedSize = "";
      }

      // إضافة لـ Firebase أولاً إذا كان متاحاً
      if (isFirebaseEnabled) {
        const userID = CartService.getCurrentUserID();
        console.log("Adding to Firebase for user:", userID);
        await CartService.addToCart(userID, cartItem);
        console.log("Successfully added to Firebase");

        // تحميل الراعي الشخصي الافتراضي إذا لم يكن محفوظاً مسبقاً
        console.log(
          "جاري تحميل الراعي الشخصي الافتراضي بعد إضافة المنتج للسلة"
        );
        await loadDefaultPersonalSponsorIfNeeded();
        console.log("انتهى تحميل الراعي الشخصي الافتراضي");
      }

      // إضافة للسلة المحلية
      dispatch({ type: "ADD_ITEM", payload: cartItem });
      console.log("Added to local cart");

      // إظهار إشعار النجاح
      // notify.success(`تم إضافة ${product.Name} إلى السلة`)
    } catch (error) {
      console.error("Error adding to cart:", error);
      notify.error("فشل في إضافة المنتج للسلة");
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إزالة منتج من السلة
  const removeFromCart = async (
    IDProduct: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    setIsLoading(true);
    try {
      console.log(
        "Removing product from cart:",
        IDProduct,
        "Color:",
        selectedColor,
        "Size:",
        selectedSize
      );

      // إزالة من Firebase أولاً إذا كان متاحاً
      if (isFirebaseEnabled) {
        const userID = CartService.getCurrentUserID();
        console.log("Removing from Firebase for user:", userID);
        await CartService.removeFromCart(
          userID,
          IDProduct,
          selectedColor,
          selectedSize
        );
        console.log("Successfully removed from Firebase");
      }

      // إزالة من السلة المحلية
      dispatch({
        type: "REMOVE_ITEM",
        payload: {
          IDProduct,
          SelectedColor: selectedColor,
          SelectedSize: selectedSize,
        } as any,
      });
      console.log("Removed from local cart");

      notify.success("تم إزالة المنتج من السلة");
    } catch (error) {
      console.error("Error removing from cart:", error);
      notify.error("فشل في إزالة المنتج من السلة");
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تحديث الكمية
  const updateQuantity = async (
    IDProduct: number,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    setIsLoading(true);
    try {
      console.log(
        "Updating quantity for product:",
        IDProduct,
        "to:",
        quantity,
        "Color:",
        selectedColor,
        "Size:",
        selectedSize
      );

      if (quantity <= 0) {
        console.log("Quantity is 0 or less, removing product");
        await removeFromCart(IDProduct, selectedColor, selectedSize);
      } else {
        // تحديث في Firebase أولاً إذا كان متاحاً
        if (isFirebaseEnabled) {
          const userID = CartService.getCurrentUserID();
          console.log("Updating quantity in Firebase for user:", userID);
          await CartService.updateCartItemQuantity(
            userID,
            IDProduct,
            quantity,
            selectedColor,
            selectedSize
          );
          console.log("Successfully updated quantity in Firebase");
        }

        // تحديث في السلة المحلية
        dispatch({
          type: "UPDATE_QUANTITY",
          payload: {
            IDProduct,
            qty: quantity,
            SelectedColor: selectedColor,
            SelectedSize: selectedSize,
          } as any,
        });
        console.log("Updated quantity in local cart");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      notify.error("فشل في تحديث الكمية");
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تحديث ملاحظات الصنف
  const updateItemNotes = async (
    IDProduct: number,
    notes: string,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    setIsLoading(true);
    try {
      console.log(
        "Updating notes for product:",
        IDProduct,
        "notes:",
        notes,
        "Color:",
        selectedColor,
        "Size:",
        selectedSize
      );

      // تحديث في Firebase أولاً إذا كان متاحاً
      if (isFirebaseEnabled) {
        const userID = CartService.getCurrentUserID();
        console.log("Updating notes in Firebase for user:", userID);
        await CartService.updateCartItemNotes(
          userID,
          IDProduct,
          notes,
          selectedColor,
          selectedSize
        );
        console.log("Successfully updated notes in Firebase");
      }

      // تحديث في السلة المحلية
      dispatch({
        type: "UPDATE_ITEM_NOTES",
        payload: {
          IDProduct,
          notes,
          SelectedColor: selectedColor,
          SelectedSize: selectedSize,
        } as any,
      });
      console.log("Updated notes in local cart");

      notify.success("تم تحديث ملاحظات الصنف");
    } catch (error) {
      console.error("Error updating notes:", error);
      notify.error("فشل في تحديث ملاحظات الصنف");
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تحديث الراعي الشخصي لجميع عناصر السلة
  const updatePersonalSponsor = async (sponsorData: any) => {
    try {
      setIsLoading(true);

      // تحديث في Firebase إذا كان متاحاً
      if (isFirebaseEnabled) {
        const userID = CartService.getCurrentUserID();
        await CartService.updateCartPersonalSponsor(userID, sponsorData);
      }

      // تحديث في state المحلي
      dispatch({ type: "UPDATE_PERSONAL_SPONSOR", payload: sponsorData });

      console.log("تم تحديث الراعي الشخصي لجميع عناصر السلة:", sponsorData);
    } catch (error) {
      console.error("Error updating personal sponsor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تحميل الراعي الشخصي الافتراضي إذا لم يكن محفوظاً مسبقاً
  const loadDefaultPersonalSponsorIfNeeded = async () => {
    try {
      console.log("=== بدء تحميل الراعي الشخصي الافتراضي ===");

      // التحقق من وجود راعي محفوظ مسبقاً
      const savedSponsorCode = localStorage.getItem("cartPersonalSponsorCode");
      console.log("الراعي المحفوظ مسبقاً:", savedSponsorCode);
      if (savedSponsorCode) {
        console.log("الراعي الشخصي محفوظ مسبقاً:", savedSponsorCode);
        return;
      }

      // جلب بيانات العميل من localStorage
      const clientSessionStr = localStorage.getItem("client_session");
      console.log("جلسة العميل من localStorage:", clientSessionStr);
      if (!clientSessionStr) {
        console.log("لا يوجد جلسة عميل في localStorage");
        return;
      }

      const clientSession = JSON.parse(clientSessionStr);
      console.log("بيانات جلسة العميل:", clientSession);
      if (!clientSession?.username) {
        console.log("لا يوجد اسم مستخدم في الجلسة");
        return;
      }

      console.log(
        "جاري تحميل الراعي الشخصي الافتراضي للعميل:",
        clientSession.username
      );

      // جلب بيانات العميل من Firebase
      const { collection, query, where, getDocs } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/lib/firebase");

      console.log("جاري البحث عن العميل في Firebase:", clientSession.username);
      const clientsRef = collection(db, "Dealing_Clients");
      const q = query(
        clientsRef,
        where("UserName", "==", clientSession.username),
        where("IsActive", "==", true)
      );
      const querySnapshot = await getDocs(q);

      console.log("نتائج البحث عن العميل:", querySnapshot.size, "نتيجة");
      if (querySnapshot.empty) {
        console.log("لم يتم العثور على بيانات العميل");
        return;
      }

      const clientDoc = querySnapshot.docs[0].data();
      console.log("بيانات العميل من Firebase:", clientDoc);
      console.log("PersonalSponsorID للعميل:", clientDoc.PersonalSponsorID);
      if (!clientDoc.PersonalSponsorID) {
        console.log("لا يوجد راعي شخصي افتراضي للعميل");
        return;
      }

      // جلب بيانات الراعي الشخصي
      console.log(
        "جاري البحث عن الراعي الشخصي في Firebase:",
        clientDoc.PersonalSponsorID
      );
      const employeesRef = collection(db, "Dealing_Employees");
      const empQuery = query(
        employeesRef,
        where("ID", "==", clientDoc.PersonalSponsorID)
      );
      const empSnapshot = await getDocs(empQuery);

      console.log("نتائج البحث عن الراعي الشخصي:", empSnapshot.size, "نتيجة");
      if (empSnapshot.empty) {
        console.log("لم يتم العثور على بيانات الراعي الشخصي");
        return;
      }

      const empData = empSnapshot.docs[0].data();
      console.log("بيانات الراعي الشخصي من Firebase:", empData);
      const defaultSponsor = {
        id: empData.ID?.toString() || "",
        name: empData.Name || "",
        code: empData.Code?.toString() || "",
        mobile: empData.Mobile || "",
      };
      console.log("بيانات الراعي الشخصي المُعدة:", defaultSponsor);

      if (defaultSponsor.name) {
        console.log("جاري حفظ الراعي الشخصي في localStorage و Firebase");

        // حفظ في localStorage
        localStorage.setItem("cartPersonalSponsorCode", defaultSponsor.code);
        localStorage.setItem("cartPersonalSponsorName", defaultSponsor.name);
        localStorage.setItem(
          "cartPersonalSponsorMobile",
          defaultSponsor.mobile
        );
        localStorage.setItem("cartPersonalSponsorID", defaultSponsor.id);
        console.log("تم حفظ الراعي الشخصي في localStorage");

        // تحديث جميع عناصر السلة في Firebase
        const userID = CartService.getCurrentUserID();
        console.log("جاري تحديث عناصر السلة في Firebase للمستخدم:", userID);
        await CartService.updateCartPersonalSponsor(userID, defaultSponsor);
        console.log("تم تحديث عناصر السلة في Firebase");

        // تحديث في state المحلي
        dispatch({ type: "UPDATE_PERSONAL_SPONSOR", payload: defaultSponsor });
        console.log("تم تحديث state المحلي");

        console.log(
          "✅ تم تحميل وحفظ الراعي الشخصي الافتراضي تلقائياً:",
          defaultSponsor.name
        );
      } else {
        console.log("❌ اسم الراعي الشخصي فارغ");
      }
    } catch (error) {
      console.error("خطأ في تحميل الراعي الشخصي الافتراضي:", error);
    }
  };

  // دالة تطبيق العرض
  const applyOffer = async (offer: Offer | null) => {
    setIsLoading(true);
    try {
      console.log("Applying offer:", offer?.Name || "No offer");

      // تطبيق العرض في السلة المحلية
      dispatch({ type: "APPLY_OFFER", payload: offer });
      console.log("Applied offer in local cart");

      if (offer) {
        notify.success(`تم تطبيق عرض: ${offer.Name}`);
      } else {
        notify.success("تم إلغاء العرض");
      }
    } catch (error) {
      console.error("Error applying offer:", error);
      notify.error("فشل في تطبيق العرض");
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تفريغ السلة
  const clearCart = async () => {
    setIsLoading(true);
    try {
      console.log("Starting to clear cart");

      // تفريغ Firebase أولاً إذا كان متاحاً
      if (isFirebaseEnabled) {
        const userID = CartService.getCurrentUserID();
        //  console.log('Clearing Firebase cart for user:', userID)
        await CartService.clearCart(userID);
        // console.log('Successfully cleared Firebase cart')
      }

      // تفريغ السلة المحلية
      dispatch({ type: "CLEAR_CART" });
      console.log("Cleared local cart");

      // notify.success('تم تفريغ السلة')
    } catch (error) {
      console.error("Error clearing cart:", error);
      // notify.error('فشل في تفريغ السلة')
    } finally {
      setIsLoading(false);
    }
  };

  // دالة التحقق من وجود منتج في السلة
  const isInCart = (
    IDProduct: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    return state.items.some((item) => {
      // التحقق من معرف المنتج أولاً
      if (item.IDProduct !== IDProduct) return false;

      // إذا لم يتم تحديد لون أو مقاس، نتحقق من وجود المنتج فقط
      if (!selectedColor && !selectedSize) return true;

      // التحقق من اللون والمقاس إذا تم تحديدهما
      const colorMatch = !selectedColor || item.SelectedColor === selectedColor;
      const sizeMatch = !selectedSize || item.SelectedSize === selectedSize;

      return colorMatch && sizeMatch;
    });
  };

  // دالة الحصول على عنصر من السلة
  const getCartItem = (
    IDProduct: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    return state.items.find((item) => {
      // التحقق من معرف المنتج أولاً
      if (item.IDProduct !== IDProduct) return false;

      // إذا لم يتم تحديد لون أو مقاس، نرجع أول منتج مطابق
      if (!selectedColor && !selectedSize) return true;

      // التحقق من اللون والمقاس إذا تم تحديدهما
      const colorMatch = !selectedColor || item.SelectedColor === selectedColor;
      const sizeMatch = !selectedSize || item.SelectedSize === selectedSize;

      return colorMatch && sizeMatch;
    });
  };

  // دالة مزامنة السلة المحلية مع Firebase
  const syncWithFirebase = async () => {
    if (!isFirebaseEnabled) {
      notify.error("Firebase غير متاح");
      return;
    }

    setIsLoading(true);
    try {
      const userID = CartService.getCurrentUserID();
      await CartService.syncCartWithFirebase(userID, state.items);
      // notify.success('تم مزامنة السلة بنجاح')
    } catch (error) {
      console.error("Error syncing with Firebase:", error);
      // notify.error('فشل في مزامنة السلة')
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تحميل السلة من Firebase
  const loadFromFirebase = async () => {
    if (!isFirebaseEnabled) {
      notify.error("Firebase غير متاح");
      return;
    }

    setIsLoading(true);
    try {
      const userID = CartService.getCurrentUserID();
      const firebaseItems = await CartService.getCartItems(userID);
      dispatch({ type: "LOAD_CART", payload: firebaseItems });
      // notify.success('تم تحميل السلة من Firebase')

      // تحميل الراعي الشخصي الافتراضي إذا لم يكن محفوظاً مسبقاً
      await loadDefaultPersonalSponsorIfNeeded();
    } catch (error) {
      console.error("Error loading from Firebase:", error);
      notify.error("فشل في تحميل السلة من Firebase");
    } finally {
      setIsLoading(false);
    }
  };

  const value: CartContextType = {
    state,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemNotes,
    updatePersonalSponsor,
    loadDefaultPersonalSponsorIfNeeded,
    applyOffer,
    clearCart,
    isInCart,
    getCartItem,
    syncWithFirebase,
    loadFromFirebase,
    forceUpdate,
    broadcastCartUpdate,
    refreshCartState,
    isFirebaseEnabled,
    isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hook لاستخدام السلة
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
