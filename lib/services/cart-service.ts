import { db, getCollectionName } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { CartItem } from "@/lib/contexts/cart-context";

const CART_COLLECTION = "Mak.Shop_Bascet";

export interface FirebaseCartItem extends CartItem {
  id?: string;
}

export class CartService {
  // إنشاء document ID فريد للمنتج والمستخدم واللون والمقاس
  private static createDocumentID(
    userID: string,
    productID: number,
    selectedColor?: string,
    selectedSize?: string
  ): string {
    let documentID = productID.toString();

    // إضافة اللون والمقاس للـ document ID إذا كانا محددين
    if (selectedColor) {
      documentID += `_color_${selectedColor.replace(/\s+/g, "_")}`;
    }
    if (selectedSize) {
      documentID += `_size_${selectedSize.replace(/\s+/g, "_")}`;
    }

    return documentID;
  }

  // تنظيف البيانات قبل الحفظ في Firebase
  private static cleanCartItemData(cartItem: CartItem): any {
    const cleanedData: any = {};

    // نسخ جميع الحقول مع التحقق من القيم
    Object.keys(cartItem).forEach((key) => {
      const value = (cartItem as any)[key];
      // تنظيف القيم الفارغة والخاطئة
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "null" &&
        value !== "undefined"
      ) {
        cleanedData[key] = value;
      }
    });

    // التأكد من أن الحقول الأساسية موجودة
    if (!cleanedData.SelectedColor) cleanedData.SelectedColor = "";
    if (!cleanedData.SelectedSize) cleanedData.SelectedSize = "";
    if (!cleanedData.SelectedFitting) cleanedData.SelectedFitting = "";
    if (!cleanedData.SelectedImageURL) cleanedData.SelectedImageURL = "";
    if (!cleanedData.SelectedColorID) cleanedData.SelectedColorID = "";
    if (!cleanedData.SelectedSizeID) cleanedData.SelectedSizeID = "";
    if (!cleanedData.SelectedColorHex) cleanedData.SelectedColorHex = "";

    return cleanedData;
  }

  // تنظيف البيانات العامة قبل الحفظ في Firebase
  private static cleanData(data: any): any {
    const cleanedData: any = {};

    // نسخ جميع الحقول مع التحقق من القيم
    Object.keys(data).forEach((key) => {
      const value = data[key];
      // تنظيف القيم الفارغة والخاطئة
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "null" &&
        value !== "undefined"
      ) {
        cleanedData[key] = value;
      }
    });

    return cleanedData;
  }

  // إضافة منتج للسلة في Firebase
  static async addToCart(userID: string, cartItem: CartItem): Promise<void> {
    try {
      const now = new Date();
      const cartData: FirebaseCartItem = {
        ...this.cleanCartItemData(cartItem),
        UserID: parseInt(userID) || 0,
        // إضافة التاريخ والوقت
        AddedDate: now.toISOString().split("T")[0], // التاريخ بصيغة YYYY-MM-DD
        AddedTime: now.toTimeString().split(" ")[0], // الوقت بصيغة HH:MM:SS
        AddedDateTime: now.toISOString(), // التاريخ والوقت الكامل
      };

      // إضافة TotalSalesCommission إذا لم يكن موجوداً
      if (!cartData.TotalSalesCommission) {
        cartData.TotalSalesCommission =
          (cartItem.DefaultSalesCommission || 0) * (cartItem.Qty || 0);
      }

      // تشخيص عمولة المندوب
      console.log("حفظ عمولة المندوب في السلة:", {
        productName: cartItem.Name,
        productID: cartItem.IDProduct,
        commission: cartItem.DefaultSalesCommission,
        qty: cartItem.Qty,
        totalCommission: cartData.TotalSalesCommission,
      });

      // تشخيص اللون والمقاس
      console.log("حفظ اللون والمقاس في السلة:", {
        productName: cartItem.Name,
        productID: cartItem.IDProduct,
        selectedColor: cartData.SelectedColor,
        selectedSize: cartData.SelectedSize,
        selectedFitting: cartData.SelectedFitting,
        selectedImageURL: cartData.SelectedImageURL,
        selectedColorID: cartData.SelectedColorID,
        selectedSizeID: cartData.SelectedSizeID,
        selectedColorHex: cartData.SelectedColorHex,
      });

      // استخدام ID كـ document ID مع اللون والمقاس
      const documentID = this.createDocumentID(
        userID,
        cartItem.ID!,
        cartItem.SelectedColor,
        cartItem.SelectedSize
      );
      const docRef = doc(db, CART_COLLECTION, documentID);

      // التحقق من وجود المنتج في السلة بنفس اللون والمقاس
      const existingItem = await this.getCartItem(
        userID,
        cartItem.ID!,
        cartItem.SelectedColor,
        cartItem.SelectedSize
      );

      if (existingItem) {
        // تحديث الكمية إذا كان المنتج موجود بنفس اللون والمقاس
        const newQuantity = existingItem.Qty + cartItem.Qty;
        await this.updateCartItemQuantity(
          userID,
          cartItem.ID!,
          newQuantity,
          cartItem.SelectedColor,
          cartItem.SelectedSize
        );
      } else {
        // إضافة منتج جديد (منتج مختلف أو لون/مقاس مختلف)
        await setDoc(docRef, cartData);
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      throw new Error("فشل في إضافة المنتج للسلة");
    }
  }

  // الحصول على جميع منتجات السلة للمستخدم
  static async getCartItems(userID: string): Promise<CartItem[]> {
    try {
      const q = query(
        collection(db, CART_COLLECTION),
        where("UserID", "==", parseInt(userID) || 1)
      );

      const querySnapshot = await getDocs(q);
      const cartItems: CartItem[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseCartItem;

        // تشخيص البيانات المقروءة من Firebase
        console.log("قراءة بيانات السلة من Firebase:", {
          productID: data.IDProduct,
          productName: data.Name,
          selectedColor: data.SelectedColor,
          selectedSize: data.SelectedSize,
          selectedFitting: data.SelectedFitting,
          selectedImageURL: data.SelectedImageURL,
          selectedColorID: data.SelectedColorID,
          selectedSizeID: data.SelectedSizeID,
          selectedColorHex: data.SelectedColorHex,
        });

        cartItems.push({
          ID: data.ID,
          BarCode: data.BarCode,
          IDProduct: data.IDProduct,
          Name: data.Name,
          IDCategory: data.IDCategory,
          IDProductionCompany: data.IDProductionCompany,
          UnitID: data.UnitID,
          PurchasePrice: data.PurchasePrice,
          Qty: data.Qty,
          PriceBeforDiscount: data.PriceBeforDiscount,
          DiscountValue: data.DiscountValue,
          DiscountPercent: data.DiscountPercent,
          SalesPrice: data.SalesPrice,
          TotalPriceBeforDiscount: data.TotalPriceBeforDiscount,
          TotalDiscountValue: data.TotalDiscountValue,
          TotalSalesPrice: data.TotalSalesPrice,
          ProfitValue: data.ProfitValue,
          TotalProfitValue: data.TotalProfitValue,
          ShopColors: data.ShopColors,
          ShopSizes: data.ShopSizes,
          ShopShortDiscription: data.ShopShortDiscription,
          ShopLongDiscription: data.ShopLongDiscription,
          ImageName: data.ImageName,
          ImageURL: data.ImageURL,
          ImageFolderPath: data.ImageFolderPath,
          Notes: data.Notes,
          UserID: data.UserID,
          UID: data.UID,
          DefaultSalesCommission: data.DefaultSalesCommission,
          // حقول التاريخ والوقت
          AddedDate: data.AddedDate || "",
          AddedTime: data.AddedTime || "",
          AddedDateTime: data.AddedDateTime || "",
          LastUpdatedDate: data.LastUpdatedDate || "",
          LastUpdatedTime: data.LastUpdatedTime || "",
          LastUpdatedDateTime: data.LastUpdatedDateTime || "",
          // حقول خاصة بالعروض
          isOffer: data.isOffer || false,
          offerId: data.offerId || undefined,
          offerName: data.offerName || "",
          offerProductsCount: data.offerProductsCount || 0,
          offerDescription: data.offerDescription || "",
          // حقول اللون والمقاس المختارين
          SelectedColor: data.SelectedColor || "",
          SelectedSize: data.SelectedSize || "",
          SelectedFitting: data.SelectedFitting || "",
          SelectedImageURL: data.SelectedImageURL || "",
          SelectedColorID: data.SelectedColorID || "",
          SelectedSizeID: data.SelectedSizeID || "",
          SelectedColorHex: data.SelectedColorHex || "",
        });
      });

      return cartItems;
    } catch (error) {
      console.error("Error getting cart items:", error);
      throw new Error("فشل في تحميل منتجات السلة");
    }
  }

  // الحصول على منتج محدد من السلة
  static async getCartItem(
    userID: string,
    productID: number,
    selectedColor?: string,
    selectedSize?: string
  ): Promise<FirebaseCartItem | null> {
    try {
      // استخدام productID كـ document ID مع اللون والمقاس
      const documentID = this.createDocumentID(
        userID,
        productID,
        selectedColor,
        selectedSize
      );
      const docRef = doc(db, CART_COLLECTION, documentID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as FirebaseCartItem;
        // التحقق من أن المنتج ينتمي للمستخدم
        if (data.UserID === (parseInt(userID) || 0)) {
          return { id: docSnap.id, ...data } as FirebaseCartItem;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting cart item:", error);
      return null;
    }
  }

  // تحديث كمية منتج في السلة
  static async updateCartItemQuantity(
    userID: string,
    productID: number,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ): Promise<void> {
    try {
      const cartItem = await this.getCartItem(
        userID,
        productID,
        selectedColor,
        selectedSize
      );

      if (!cartItem) {
        throw new Error("المنتج غير موجود في السلة");
      }

      // استخدام productID كـ document ID مع اللون والمقاس
      const documentID = this.createDocumentID(
        userID,
        productID,
        selectedColor,
        selectedSize
      );
      const docRef = doc(db, CART_COLLECTION, documentID);

      const now = new Date();
      const updateData = {
        Qty: quantity,
        TotalPriceBeforDiscount: (cartItem.PriceBeforDiscount || 0) * quantity,
        TotalSalesPrice: (cartItem.SalesPrice || 0) * quantity,
        TotalDiscountValue: (cartItem.DiscountValue || 0) * quantity,
        TotalProfitValue: (cartItem.ProfitValue || 0) * quantity,
        // تحديث عمولة المندوب بناءً على الكمية الجديدة
        TotalSalesCommission: (cartItem.DefaultSalesCommission || 0) * quantity,
        // تحديث التاريخ والوقت
        LastUpdatedDate: now.toISOString().split("T")[0], // التاريخ بصيغة YYYY-MM-DD
        LastUpdatedTime: now.toTimeString().split(" ")[0], // الوقت بصيغة HH:MM:SS
        LastUpdatedDateTime: now.toISOString(), // التاريخ والوقت الكامل
      };

      // تشخيص تحديث العمولة
      console.log("تحديث عمولة المندوب في السلة:", {
        productName: cartItem.Name,
        productID: cartItem.IDProduct,
        oldQty: cartItem.Qty,
        newQty: quantity,
        commissionPerUnit: cartItem.DefaultSalesCommission,
        oldTotalCommission:
          (cartItem.DefaultSalesCommission || 0) * (cartItem.Qty || 0),
        newTotalCommission: (cartItem.DefaultSalesCommission || 0) * quantity,
        updateData: updateData,
      });

      // تشخيص إضافي - التحقق من البيانات قبل التحديث
      console.log("البيانات قبل التحديث:", {
        documentID,
        existingItem: cartItem,
        updateData: updateData,
      });

      // تنظيف البيانات قبل التحديث
      const cleanedUpdateData = this.cleanData(updateData);
      console.log("البيانات المنظفة قبل التحديث:", cleanedUpdateData);

      await updateDoc(docRef, cleanedUpdateData);

      // تشخيص بعد التحديث
      console.log("تم تحديث السلة بنجاح:", {
        productID,
        newQuantity: quantity,
        totalSalesCommission: cleanedUpdateData.TotalSalesCommission,
      });
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      throw new Error("فشل في تحديث كمية المنتج");
    }
  }

  // تحديث ملاحظات منتج في السلة
  static async updateCartItemNotes(
    userID: string,
    productID: number,
    notes: string,
    selectedColor?: string,
    selectedSize?: string
  ): Promise<void> {
    try {
      const cartItem = await this.getCartItem(
        userID,
        productID,
        selectedColor,
        selectedSize
      );

      if (!cartItem) {
        throw new Error("المنتج غير موجود في السلة");
      }

      // استخدام productID كـ document ID مع اللون والمقاس
      const documentID = this.createDocumentID(
        userID,
        productID,
        selectedColor,
        selectedSize
      );
      const docRef = doc(db, CART_COLLECTION, documentID);

      const updateData = { Notes: notes };
      const cleanedUpdateData = this.cleanData(updateData);
      await updateDoc(docRef, cleanedUpdateData);
    } catch (error) {
      console.error("Error updating cart item notes:", error);
      throw new Error("فشل في تحديث ملاحظات المنتج");
    }
  }

  // تحديث الراعي الشخصي لجميع عناصر السلة
  static async updateCartPersonalSponsor(
    userID: string,
    sponsorData: any
  ): Promise<void> {
    try {
      console.log("=== بدء تحديث الراعي الشخصي في CartService ===");
      console.log("userID:", userID);
      console.log("sponsorData:", sponsorData);

      // جلب جميع عناصر السلة للمستخدم
      const cartItems = await this.getCartItems(userID);
      console.log("عناصر السلة الموجودة:", cartItems.length);

      if (cartItems.length === 0) {
        console.log("لا توجد عناصر في السلة لتحديثها");
        return;
      }

      // تحديث كل عنصر في السلة
      for (const item of cartItems) {
        const documentID = this.createDocumentID(userID, item.ID!);
        const docRef = doc(db, CART_COLLECTION, documentID);

        const updateData = {
          PersonalSponsorID: sponsorData.id,
          PersonalSponsorCode: sponsorData.code,
          PersonalSponsorName: sponsorData.name,
          PersonalSponsorMobile: sponsorData.mobile,
          // تحديث التاريخ والوقت
          LastUpdatedDate: new Date().toISOString().split("T")[0],
          LastUpdatedTime: new Date().toTimeString().split(" ")[0],
          LastUpdatedDateTime: new Date().toISOString(),
        };

        console.log("تحديث عنصر السلة:", {
          documentID,
          productName: item.Name,
          updateData,
        });

        const cleanedUpdateData = this.cleanData(updateData);
        await updateDoc(docRef, cleanedUpdateData);
        console.log("تم تحديث عنصر السلة بنجاح:", item.Name);
      }

      console.log("✅ تم تحديث الراعي الشخصي لجميع عناصر السلة:", {
        userID,
        sponsorData,
        itemsCount: cartItems.length,
      });
    } catch (error) {
      console.error("❌ خطأ في تحديث الراعي الشخصي:", error);
      throw new Error("فشل في تحديث الراعي الشخصي");
    }
  }

  // إزالة منتج من السلة
  static async removeFromCart(
    userID: string,
    productID: number,
    selectedColor?: string,
    selectedSize?: string
  ): Promise<void> {
    try {
      const cartItem = await this.getCartItem(
        userID,
        productID,
        selectedColor,
        selectedSize
      );

      if (!cartItem) {
        console.warn("Product not found in cart for deletion:", {
          userID,
          productID,
          selectedColor,
          selectedSize,
        });
        return; // لا نريد إلقاء خطأ إذا كان المنتج غير موجود
      }

      // استخدام productID كـ document ID مع اللون والمقاس
      const documentID = this.createDocumentID(
        userID,
        productID,
        selectedColor,
        selectedSize
      );
      const docRef = doc(db, CART_COLLECTION, documentID);

      console.log("Deleting cart item:", { documentID, userID, productID });
      await deleteDoc(docRef);
      console.log("Successfully deleted cart item:", {
        documentID,
        userID,
        productID,
      });
    } catch (error) {
      console.error("Error removing item from cart:", error);
      throw new Error("فشل في إزالة المنتج من السلة");
    }
  }

  // تفريغ السلة
  static async clearCart(userID: string): Promise<void> {
    try {
      console.log("Starting to clear cart for user:", userID);
      const cartItems = await this.getCartItems(userID);
      console.log("Found cart items to delete:", cartItems.length);

      if (cartItems.length === 0) {
        console.log("No items to delete from cart");
        return;
      }

      const deletePromises = cartItems.map(async (item) => {
        // استخدام ID كـ document ID مع اللون والمقاس
        const documentID = this.createDocumentID(
          userID,
          item.ID!,
          item.SelectedColor,
          item.SelectedSize
        );
        const docRef = doc(db, CART_COLLECTION, documentID);
        console.log("Deleting cart item:", {
          documentID,
          productID: item.ID,
          selectedColor: item.SelectedColor,
          selectedSize: item.SelectedSize,
        });
        return deleteDoc(docRef);
      });

      await Promise.all(deletePromises);
      console.log("Successfully cleared cart for user:", userID);
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw new Error("فشل في تفريغ السلة");
    }
  }

  // مزامنة السلة المحلية مع Firebase
  static async syncCartWithFirebase(
    userID: string,
    localCartItems: CartItem[]
  ): Promise<void> {
    try {
      console.log("Starting cart sync for user:", userID);
      // تفريغ السلة في Firebase أولاً
      await this.clearCart(userID);

      // إضافة جميع المنتجات من السلة المحلية
      const addPromises = localCartItems.map((item) =>
        this.addToCart(userID, item)
      );

      await Promise.all(addPromises);
      console.log("Successfully synced cart for user:", userID);
    } catch (error) {
      console.error("Error syncing cart with Firebase:", error);
      throw new Error("فشل في مزامنة السلة");
    }
  }

  // الحصول على معرف المستخدم (يمكن تعديله حسب نظام المصادقة)
  static getCurrentUserID(): string {
    // 1) حاول استخدام جلسة العميل (مسجل دخول)
    try {
      const clientSession = localStorage.getItem("client_session");
      if (clientSession) {
        const session = JSON.parse(clientSession);
        if (session?.id && Number(session.id) > 0) {
          return String(session.id);
        }
      }
    } catch {}

    // 2) إذا لم يكن مسجل دخول: منع استخدام معرف ضيف لأن المتطلب يمنع الإضافة بدون دخول
    return "0";
  }

  // دالة تشخيص لفحص جميع البيانات في جدول Shop_Bascet
  static async diagnoseCartData(): Promise<void> {
    try {
      console.log("=== تشخيص بيانات جدول Shop_Bascet ===");

      // جلب جميع البيانات من الجدول
      const q = query(collection(db, CART_COLLECTION));
      const querySnapshot = await getDocs(q);

      console.log("إجمالي عدد العناصر في الجدول:", querySnapshot.size);

      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n--- عنصر ${index + 1} (Document ID: ${doc.id}) ---`);
        console.log("ID:", data.ID);
        console.log("IDProduct:", data.IDProduct);
        console.log("Name:", data.Name);
        console.log("Qty:", data.Qty);
        console.log("UserID:", data.UserID);
        console.log("PriceBeforDiscount:", data.PriceBeforDiscount);
        console.log("SalesPrice:", data.SalesPrice);
        console.log("TotalSalesPrice:", data.TotalSalesPrice);
        console.log("Notes:", data.Notes);
      });
    } catch (error) {
      console.error("خطأ في تشخيص بيانات السلة:", error);
    }
  }

  // دالة فحص عنصر محدد في الجدول
  static async inspectCartItem(documentID: string): Promise<any> {
    try {
      const docRef = doc(db, CART_COLLECTION, documentID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("بيانات العنصر:", data);
        return data;
      } else {
        console.log("العنصر غير موجود");
        return null;
      }
    } catch (error) {
      console.error("خطأ في فحص العنصر:", error);
      return null;
    }
  }

  // دالة جلب جميع العناصر من Firebase (بدون فلتر)
  static async getAllCartItems(): Promise<FirebaseCartItem[]> {
    try {
      const q = query(collection(db, CART_COLLECTION));
      const querySnapshot = await getDocs(q);
      const cartItems: FirebaseCartItem[] = [];

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data() as FirebaseCartItem;
        cartItems.push({
          ...data,
          id: doc.id,
        });
      });

      return cartItems;
    } catch (error) {
      console.error("Error getting all cart items:", error);
      return [];
    }
  }

  // دالة إصلاح معرف المستخدم للعناصر
  static async fixUserIDForItems(
    itemsToFix: FirebaseCartItem[],
    newUserID: string
  ): Promise<void> {
    try {
      for (const item of itemsToFix) {
        try {
          const docRef = doc(
            db,
            CART_COLLECTION,
            item.id || item.ID?.toString() || ""
          );
          await updateDoc(docRef, {
            UserID: parseInt(newUserID) || 0,
          });
          console.log(`تم إصلاح العنصر: ${item.Name}`);
        } catch (error) {
          console.error(`خطأ في إصلاح العنصر ${item.Name}:`, error);
        }
      }
    } catch (error) {
      console.error("خطأ في إصلاح معرف المستخدم:", error);
      throw error;
    }
  }

  // دالة هجرة البيانات القديمة إلى النظام الجديد
  static async migrateOldCartData(): Promise<void> {
    try {
      console.log("بدء هجرة بيانات السلة القديمة...");

      // جلب جميع البيانات من الجدول
      const q = query(collection(db, CART_COLLECTION));
      const querySnapshot = await getDocs(q);

      console.log(`تم العثور على ${querySnapshot.size} عنصر للهجرة`);

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const oldDocumentID = docSnapshot.id;

        // التحقق من أن Document ID لا يحتوي على معرف المستخدم
        if (!oldDocumentID.includes("_")) {
          const userID = data.UserID || 1;
          const productID = data.IDProduct || data.ID;

          if (productID) {
            // إنشاء Document ID جديد
            const newDocumentID = this.createDocumentID(
              userID.toString(),
              productID
            );

            // إنشاء document جديد بالـ ID الجديد
            const newDocRef = doc(db, CART_COLLECTION, newDocumentID);

            try {
              // حفظ البيانات في document جديد
              await setDoc(newDocRef, data);
              console.log(
                `تم هجرة العنصر: ${data.Name} من ${oldDocumentID} إلى ${newDocumentID}`
              );

              // حذف document القديم
              await deleteDoc(docSnapshot.ref);
              console.log(`تم حذف العنصر القديم: ${oldDocumentID}`);
            } catch (error) {
              console.error(`خطأ في هجرة العنصر ${data.Name}:`, error);
            }
          }
        }
      }

      console.log("تم الانتهاء من هجرة بيانات السلة");
    } catch (error) {
      console.error("خطأ في هجرة بيانات السلة:", error);
      throw error;
    }
  }

  // دالة تنظيف البيانات المكررة
  static async cleanDuplicateCartData(): Promise<void> {
    try {
      console.log("بدء تنظيف البيانات المكررة...");

      const q = query(collection(db, CART_COLLECTION));
      const querySnapshot = await getDocs(q);

      const itemsByUserAndProduct = new Map<string, FirebaseCartItem[]>();

      // تجميع العناصر حسب المستخدم والمنتج
      querySnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data() as FirebaseCartItem;
        const userID = data.UserID || 1;
        const productID = data.IDProduct || data.ID;
        const key = `${userID}_${productID}`;

        if (!itemsByUserAndProduct.has(key)) {
          itemsByUserAndProduct.set(key, []);
        }

        itemsByUserAndProduct.get(key)!.push({
          ...data,
          id: docSnapshot.id,
        });
      });

      // حذف العناصر المكررة
      for (const [key, items] of itemsByUserAndProduct) {
        if (items.length > 1) {
          console.log(`العثور على ${items.length} نسخة من العنصر: ${key}`);

          // الاحتفاظ بالعنصر الأحدث
          const sortedItems = items.sort((a, b) => {
            const dateA = new Date(a.AddedDateTime || 0);
            const dateB = new Date(b.AddedDateTime || 0);
            return dateB.getTime() - dateA.getTime();
          });

          // حذف العناصر القديمة
          for (let i = 1; i < sortedItems.length; i++) {
            const oldItem = sortedItems[i];
            const docRef = doc(db, CART_COLLECTION, oldItem.id!);
            await deleteDoc(docRef);
            console.log(`تم حذف العنصر المكرر: ${oldItem.id}`);
          }
        }
      }

      console.log("تم الانتهاء من تنظيف البيانات المكررة");
    } catch (error) {
      console.error("خطأ في تنظيف البيانات المكررة:", error);
      throw error;
    }
  }

  // دالة تشخيص معرف المستخدم
  static diagnoseUserID(): void {
    try {
      console.log("=== تشخيص معرف المستخدم ===");

      const clientSession = localStorage.getItem("client_session");
      console.log("client_session from sessionStorage:", clientSession);

      if (clientSession) {
        try {
          const session = JSON.parse(clientSession);
          console.log("Parsed session:", session);
          console.log("Session ID:", session.id);
          console.log("Session ID type:", typeof session.id);
        } catch (error) {
          console.error("Error parsing client-session:", error);
        }
      } else {
        console.log("No client-session found in localStorage");
      }

      const currentUserID = this.getCurrentUserID();
      console.log("getCurrentUserID() result:", currentUserID);
      console.log("getCurrentUserID() type:", typeof currentUserID);

      const parsedUserID = parseInt(currentUserID) || 0;
      console.log("Parsed user ID:", parsedUserID);
      console.log("Parsed user ID type:", typeof parsedUserID);
    } catch (error) {
      console.error("Error in diagnoseUserID:", error);
    }
  }

  // دالة اختبار عملية الحذف
  static async testCartDeletion(productID: number): Promise<void> {
    try {
      console.log("=== اختبار عملية الحذف ===");

      const userID = this.getCurrentUserID();
      console.log("معرف المستخدم:", userID);
      console.log("معرف المنتج:", productID);

      // فحص وجود المنتج قبل الحذف
      const cartItemBefore = await this.getCartItem(userID, productID);
      if (cartItemBefore) {
        console.log("✅ المنتج موجود في السلة قبل الحذف");
        console.log("بيانات المنتج:", cartItemBefore);
      } else {
        console.log("❌ المنتج غير موجود في السلة قبل الحذف");
        return;
      }

      // محاولة الحذف
      console.log("بدء عملية الحذف...");
      await this.removeFromCart(userID, productID);
      console.log("✅ تم تنفيذ عملية الحذف");

      // فحص وجود المنتج بعد الحذف
      const cartItemAfter = await this.getCartItem(userID, productID);
      if (cartItemAfter) {
        console.log("❌ المنتج لا يزال موجود في السلة بعد الحذف");
        console.log("بيانات المنتج بعد الحذف:", cartItemAfter);
      } else {
        console.log("✅ المنتج تم حذفه بنجاح");
      }
    } catch (error) {
      console.error("خطأ في اختبار الحذف:", error);
    }
  }

  // دالة اختبار تفريغ السلة
  static async testCartClear(): Promise<void> {
    try {
      console.log("=== اختبار تفريغ السلة ===");

      const userID = this.getCurrentUserID();
      console.log("معرف المستخدم:", userID);

      // فحص المنتجات قبل التفريغ
      const cartItemsBefore = await this.getCartItems(userID);
      console.log("عدد المنتجات قبل التفريغ:", cartItemsBefore.length);

      if (cartItemsBefore.length === 0) {
        console.log("السلة فارغة بالفعل");
        return;
      }

      cartItemsBefore.forEach((item, index) => {
        console.log(`منتج ${index + 1}: ${item.Name} (ID: ${item.ID})`);
      });

      // محاولة التفريغ
      console.log("بدء عملية تفريغ السلة...");
      await this.clearCart(userID);
      console.log("✅ تم تنفيذ عملية تفريغ السلة");

      // فحص المنتجات بعد التفريغ
      const cartItemsAfter = await this.getCartItems(userID);
      console.log("عدد المنتجات بعد التفريغ:", cartItemsAfter.length);

      if (cartItemsAfter.length === 0) {
        console.log("✅ تم تفريغ السلة بنجاح");
      } else {
        console.log("❌ السلة لم يتم تفريغها بالكامل");
        cartItemsAfter.forEach((item, index) => {
          console.log(`منتج متبقي ${index + 1}: ${item.Name} (ID: ${item.ID})`);
        });
      }
    } catch (error) {
      console.error("خطأ في اختبار تفريغ السلة:", error);
    }
  }

  // دالة تنظيف البيانات القديمة في Firebase
  static async cleanOldCartData(): Promise<void> {
    try {
      console.log("=== تنظيف البيانات القديمة في Firebase ===");

      const userID = this.getCurrentUserID();
      console.log("معرف المستخدم الحالي:", userID);

      // جلب جميع البيانات من Firebase
      const allItems = await this.getAllCartItems();
      console.log("إجمالي عدد المستندات في Firebase:", allItems.length);

      let deletedCount = 0;

      for (const item of allItems) {
        try {
          // حذف المستندات التي لا تنتمي للمستخدم الحالي
          if (item.UserID !== (parseInt(userID) || 0)) {
            const docRef = doc(db, CART_COLLECTION, item.id!);
            await deleteDoc(docRef);
            console.log(
              `تم حذف مستند لا ينتمي للمستخدم: ${item.Name} (ID: ${item.ID})`
            );
            deletedCount++;
          }
        } catch (error) {
          console.error(`خطأ في حذف المستند ${item.id}:`, error);
        }
      }

      console.log(`تم حذف ${deletedCount} مستند قديم`);

      // فحص البيانات بعد التنظيف
      const remainingItems = await this.getAllCartItems();
      console.log("عدد المستندات المتبقية بعد التنظيف:", remainingItems.length);
    } catch (error) {
      console.error("خطأ في تنظيف البيانات القديمة:", error);
    }
  }

  // دالة إعادة مزامنة السلة المحلية مع Firebase
  static async resyncLocalCartWithFirebase(): Promise<CartItem[]> {
    try {
      console.log("=== إعادة مزامنة السلة المحلية مع Firebase ===");

      const userID = this.getCurrentUserID();
      console.log("معرف المستخدم:", userID);

      // جلب البيانات من Firebase
      const firebaseItems = await this.getCartItems(userID);
      console.log("عدد المنتجات في Firebase:", firebaseItems.length);

      // جلب البيانات من localStorage
      const localCartData = localStorage.getItem("shopping-cart");
      let localItems: CartItem[] = [];

      if (localCartData) {
        try {
          localItems = JSON.parse(localCartData);
          console.log("عدد المنتجات في localStorage:", localItems.length);
        } catch (error) {
          console.error("خطأ في قراءة localStorage:", error);
        }
      }

      // مقارنة البيانات
      console.log("\n=== مقارنة البيانات ===");
      console.log("المنتجات في Firebase:");
      firebaseItems.forEach((item) => {
        console.log(`- ${item.Name} (ID: ${item.ID}, Qty: ${item.Qty})`);
      });

      console.log("\nالمنتجات في localStorage:");
      localItems.forEach((item) => {
        console.log(`- ${item.Name} (ID: ${item.ID}, Qty: ${item.Qty})`);
      });

      // إعادة مزامنة Firebase مع localStorage
      console.log("\n=== إعادة مزامنة Firebase مع localStorage ===");
      await this.syncCartWithFirebase(userID, localItems);

      // جلب البيانات المحدثة من Firebase
      const updatedFirebaseItems = await this.getCartItems(userID);
      console.log(
        "عدد المنتجات في Firebase بعد المزامنة:",
        updatedFirebaseItems.length
      );

      return updatedFirebaseItems;
    } catch (error) {
      console.error("خطأ في إعادة المزامنة:", error);
      return [];
    }
  }

  // دالة تشخيص لفحص مشكلة حذف المنتجات
  static async diagnoseCartDeletionIssue(): Promise<void> {
    try {
      console.log("=== تشخيص مشكلة حذف المنتجات من السلة ===");

      const userID = this.getCurrentUserID();
      console.log("معرف المستخدم الحالي:", userID);

      // فحص جميع المنتجات في السلة
      const cartItems = await this.getCartItems(userID);
      console.log("عدد المنتجات في السلة:", cartItems.length);

      cartItems.forEach((item, index) => {
        console.log(`\n--- منتج ${index + 1} ---`);
        console.log("ID:", item.ID);
        console.log("IDProduct:", item.IDProduct);
        console.log("Name:", item.Name);
        console.log("Qty:", item.Qty);
        console.log("UserID:", item.UserID);

        // حساب Document ID المتوقع
        const expectedDocumentID = this.createDocumentID(userID, item.ID!);
        console.log("Document ID المتوقع:", expectedDocumentID);

        // فحص وجود المستند في Firebase
        this.inspectCartItem(expectedDocumentID).then((data) => {
          if (data) {
            console.log("✅ المستند موجود في Firebase");
          } else {
            console.log("❌ المستند غير موجود في Firebase");
          }
        });
      });

      // فحص جميع المستندات في Firebase
      console.log("\n=== جميع المستندات في Firebase ===");
      const allItems = await this.getAllCartItems();
      console.log("إجمالي عدد المستندات:", allItems.length);

      allItems.forEach((item, index) => {
        console.log(`\n--- مستند ${index + 1} ---`);
        console.log("Document ID:", item.id);
        console.log("ID:", item.ID);
        console.log("IDProduct:", item.IDProduct);
        console.log("Name:", item.Name);
        console.log("UserID:", item.UserID);
        console.log("Qty:", item.Qty);
      });
    } catch (error) {
      console.error("خطأ في تشخيص مشكلة الحذف:", error);
    }
  }

  // دالة فحص جلسة العميل
  static checkClientSession(): any {
    try {
      console.log("=== فحص جلسة العميل ===");

      const clientSession = localStorage.getItem("client_session");
      console.log("client_session raw:", clientSession);

      if (!clientSession) {
        console.log("❌ لا توجد جلسة عميل في localStorage");
        return null;
      }

      try {
        const session = JSON.parse(clientSession);
        console.log("✅ تم تحليل جلسة العميل بنجاح");
        console.log("Session data:", session);
        console.log("Session ID:", session.id);
        console.log("Session ID type:", typeof session.id);

        return session;
      } catch (error) {
        console.error("❌ خطأ في تحليل جلسة العميل:", error);
        return null;
      }
    } catch (error) {
      console.error("خطأ في فحص جلسة العميل:", error);
      return null;
    }
  }

  // دالة فحص جلسة العميل من useClientSession hook
  static checkClientSessionFromHook(): any {
    try {
      console.log("=== فحص جلسة العميل من useClientSession hook ===");

      // محاولة الوصول إلى جلسة العميل من sessionStorage
      const clientSession = localStorage.getItem("client_session");
      console.log("client_session from sessionStorage:", clientSession);

      if (!clientSession) {
        console.log("❌ لا توجد جلسة عميل في sessionStorage");
        return null;
      }

      try {
        const session = JSON.parse(clientSession);
        console.log("✅ تم تحليل جلسة العميل بنجاح");
        console.log("Session data:", session);
        console.log("Session ID:", session.id);
        console.log("Session ID type:", typeof session.id);
        console.log("Session username:", session.username);
        console.log("Session name:", session.name);

        return session;
      } catch (error) {
        console.error("❌ خطأ في تحليل جلسة العميل:", error);
        return null;
      }
    } catch (error) {
      console.error("خطأ في فحص جلسة العميل من hook:", error);
      return null;
    }
  }

  // دالة فحص جميع مصادر معرف المستخدم
  static diagnoseAllUserIDSources(): void {
    try {
      console.log("=== فحص جميع مصادر معرف المستخدم ===");

      // 1. فحص sessionStorage
      console.log("\n1. فحص sessionStorage:");
      const sessionStorageData = localStorage.getItem("client_session");
      console.log("client_session from sessionStorage:", sessionStorageData);

      if (sessionStorageData) {
        try {
          const session = JSON.parse(sessionStorageData);
          console.log("✅ تم تحليل جلسة العميل من sessionStorage");
          console.log("Session ID:", session.id);
          console.log("Session ID type:", typeof session.id);
          console.log("Session username:", session.username);
          console.log("Session name:", session.name);
        } catch (error) {
          console.error(
            "❌ خطأ في تحليل جلسة العميل من sessionStorage:",
            error
          );
        }
      } else {
        console.log("❌ لا توجد جلسة عميل في sessionStorage");
      }

      // 2. فحص localStorage
      console.log("\n2. فحص localStorage:");
      const localStorageData = localStorage.getItem("client-session");
      console.log("client-session from localStorage:", localStorageData);

      if (localStorageData) {
        try {
          const session = JSON.parse(localStorageData);
          console.log("✅ تم تحليل جلسة العميل من localStorage");
          console.log("Session ID:", session.id);
          console.log("Session ID type:", typeof session.id);
        } catch (error) {
          console.error("❌ خطأ في تحليل جلسة العميل من localStorage:", error);
        }
      } else {
        console.log("❌ لا توجد جلسة عميل في localStorage");
      }

      // 3. فحص user-id القديم
      console.log("\n3. فحص user-id القديم:");
      const oldUserID = localStorage.getItem("user-id");
      console.log("user-id from localStorage:", oldUserID);

      // 4. فحص getCurrentUserID()
      console.log("\n4. فحص getCurrentUserID():");
      const currentUserID = this.getCurrentUserID();
      console.log("getCurrentUserID() result:", currentUserID);
      console.log("getCurrentUserID() type:", typeof currentUserID);

      // 5. فحص التحويل
      console.log("\n5. فحص التحويل:");
      const parsedUserID = parseInt(currentUserID) || 0;
      console.log("Parsed user ID:", parsedUserID);
      console.log("Parsed user ID type:", typeof parsedUserID);
    } catch (error) {
      console.error("خطأ في فحص جميع مصادر معرف المستخدم:", error);
    }
  }

  // دالة جلب بيانات العميل من جدول Dealing_Clients
  static async getClientData(userID: number): Promise<any> {
    try {
      const clientsRef = collection(db, getCollectionName("Dealing_Clients"));
      const q = query(
        clientsRef,
        where("ID", "==", userID),
        where("IsActive", "==", true)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const clientData = querySnapshot.docs[0].data();
        return {
          ID: clientData.ID,
          Name: clientData.Name,
          Mobile: clientData.Mobile || "",
          Phone: clientData.Phone || "",
          EMail: clientData.EMail || "",
          Address: clientData.Address || "",
          Code: clientData.Code,
          IsActive: clientData.IsActive,
          CurrentBalance: clientData.CurrentBalance || 0,
          UserName: clientData.UserName || "",
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting client data:", error);
      return null;
    }
  }

  // دالة جلب بيانات جميع العملاء مع معلوماتهم الكاملة
  static async getCartCustomersWithDetails(): Promise<any[]> {
    try {
      // جلب جميع عناصر السلة
      const allCartItems = await this.getAllCartItems();

      // تجميع العناصر حسب المستخدم
      const customersMap = new Map<number, any>();

      for (const item of allCartItems) {
        const userID = item.UserID || 0;

        if (!customersMap.has(userID)) {
          // جلب بيانات العميل من جدول Dealing_Clients
          const clientData = await this.getClientData(userID);

          // حساب الوقت المنقضي
          const addedDate = item.AddedDate || "";
          const addedTime = item.AddedTime || "";
          const addedDateTime = new Date(`${addedDate}T${addedTime}`);
          const now = new Date();
          const timeDiff = now.getTime() - addedDateTime.getTime();
          const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hoursDiff = Math.floor(
            (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );

          customersMap.set(userID, {
            userID,
            customerName: clientData?.Name || `عميل ${userID}`,
            customerPhone: clientData?.Mobile || clientData?.Phone || "",
            customerEmail: clientData?.EMail || "",
            customerAddress: clientData?.Address || "",
            customerCode: clientData?.Code || "",
            customerBalance: clientData?.CurrentBalance || 0,
            customerUsername: clientData?.UserName || "",
            cartItems: [],
            totalItems: 0,
            totalValue: 0,
            addedDate,
            addedTime,
            daysSinceAdded: daysDiff,
            hoursSinceAdded: hoursDiff,
            lastActivity: `${addedDate} ${addedTime}`,
          });
        }

        const customer = customersMap.get(userID)!;
        customer.cartItems.push(item);
        customer.totalItems += item.Qty || 0;
        customer.totalValue += item.TotalSalesPrice || 0;
      }

      return Array.from(customersMap.values());
    } catch (error) {
      console.error("Error getting cart customers with details:", error);
      return [];
    }
  }
}
