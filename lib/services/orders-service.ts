import { db } from '@/lib/firebase'
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
  orderBy,
  limit,
  writeBatch 
} from 'firebase/firestore'

const ORDERS_COLLECTION = 'Orders'
const SHOP_ORDERS_COLLECTION = 'Shop_Orders'
const ORDER_DETAILS_COLLECTION = 'Shop_OrdersDetails'

export interface OrderItem {
  ID: number
  BarCode: string
  IDProduct: number
  Name: string
  IDCategory: number
  Qty: number
  SalesPrice: number
  TotalSalesPrice: number
  ImageURL?: string
}

export interface Order {
  ID?: string
  customerID: number
  customerName: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string
  items: OrderItem[]
  totalValue: number
  totalItems: number
  orderDate: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  source: 'cart_conversion' | 'direct' | 'phone' | 'website'
  notes?: string
  paymentMethod?: string
  shippingAddress?: string
  createdAt?: any
  updatedAt?: any
}

export class OrdersService {
  // إنشاء طلب جديد
  static async createOrder(orderData: Order): Promise<string> {
    try {
      const orderRef = await addDoc(collection(db, ORDERS_COLLECTION), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      console.log('تم إنشاء الطلب بنجاح:', orderRef.id)
      return orderRef.id
    } catch (error) {
      console.error('خطأ في إنشاء الطلب:', error)
      throw new Error('فشل في إنشاء الطلب')
    }
  }

  // إنشاء طلب من صفحة الدفع (السلة الحالية للعميل)
  static async createOrderFromCart(
    customerID: number,
    customerName: string,
    customerPhone: string,
    customerEmail: string,
    customerAddress: string,
    cartItems: any[],
    paymentMethod: string,
    notes?: string,
    appliedOffer?: any,
    cartState?: any,
    personalSponsor?: any
  ): Promise<string> {
    try {
      // بيانات الوقت
      const now = new Date()
      const createdDateISO = now.toISOString()
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

      // توليد معرف الطلب الجديد (رقم صحيح يبدأ من 1)
      const ordersQuery = query(
        collection(db, SHOP_ORDERS_COLLECTION),
        orderBy('ID', 'desc'),
        limit(1)
      )
      const querySnapshot = await getDocs(ordersQuery)
      const nextOrderID = querySnapshot.empty
        ? 1
        : ((querySnapshot.docs[0].data() as any).ID || 0) + 1

      // تحويل العناصر وتحصيل القيم
      const orderItems: OrderItem[] = (cartItems || []).map((item: any) => ({
        ID: item?.ID ?? item?.IDProduct ?? 0,
        BarCode: String(item?.BarCode ?? ''),
        IDProduct: item?.IDProduct ?? 0,
        Name: item?.Name ?? '',
        IDCategory: item?.IDCategory ?? 0,
        Qty: item?.Qty ?? 0,
        SalesPrice: item?.SalesPrice ?? 0,
        TotalSalesPrice: item?.TotalSalesPrice ?? 0,
        ImageURL: item?.ImageURL ?? ''
      }))

      const totalItems = cartState?.totalItems ?? orderItems.reduce((sum, it) => sum + (it.Qty || 0), 0)
      const priceBeforeDiscount = cartState?.totalPrice ?? (cartItems || []).reduce((sum: number, it: any) => sum + (it?.TotalPriceBeforDiscount || 0), 0)
      const itemsTotalAfterDiscount = (cartItems || []).reduce((sum: number, it: any) => sum + (it?.TotalSalesPrice || 0), 0)
      const productOffersDiscount = cartState?.productOffersDiscount ?? (cartItems || []).filter((it: any) => it?.isOffer).reduce((sum: number, it: any) => sum + (it?.TotalDiscountValue || 0), 0)
      const regularItemsDiscount = cartState?.totalDiscount ?? (cartItems || []).filter((it: any) => !it?.isOffer).reduce((sum: number, it: any) => sum + (it?.TotalDiscountValue || 0), 0)
      const offerDiscount = cartState?.offerDiscount ?? 0
      const shipping = cartState?.shipping ?? 0
      const netValue = cartState?.finalTotal ?? (itemsTotalAfterDiscount - offerDiscount + shipping)
      const totalValue = netValue

      const appliedOfferName = appliedOffer?.Name || cartState?.appliedOffer?.Name || ''
      const appliedPackageOffersNames = (cartItems || [])
        .filter((it: any) => it?.isOffer && it?.offerName)
        .map((it: any) => it.offerName)

      const defaultSalesCommission = (cartItems || []).reduce(
        (sum: number, it: any) => sum + ((it?.DefaultSalesCommission || 0) * (it?.Qty || 0)),
        0
      )
      
      // تشخيص العمولة
      console.log('حساب عمولة المندوب:', {
        cartItems: cartItems?.length || 0,
        commissionDetails: (cartItems || []).map((it: any) => ({
          productName: it.Name,
          qty: it.Qty,
          commission: it.DefaultSalesCommission,
          totalCommission: (it.DefaultSalesCommission || 0) * (it.Qty || 0)
        })),
        totalCommission: defaultSalesCommission
      })
      
      // تشخيص الراعي الشخصي
      console.log('بيانات الراعي الشخصي المرسلة:', {
        personalSponsor: personalSponsor,
        hasPersonalSponsor: !!personalSponsor,
        sponsorID: personalSponsor?.id,
        sponsorName: personalSponsor?.name,
        sponsorCode: personalSponsor?.code,
        sponsorMobile: personalSponsor?.mobile
      })
      
      if (personalSponsor) {
        console.log('✅ سيتم حفظ الراعي الشخصي في الطلب:', {
          PersonalSponsorID: personalSponsor.id,
          PersonalSponsorCode: personalSponsor.code,
          PersonalSponsorName: personalSponsor.name,
          PersonalSponsorMobile: personalSponsor.mobile
        })
      } else {
        console.log('❌ لا يوجد راعي شخصي ليتم حفظه في الطلب')
      }

      const shopOrder = {
        ID: nextOrderID,
        Code: nextOrderID,
        OrderNo: `ORD-${nextOrderID}`,
        IDClient: customerID,
        CustomerName: customerName,
        Mobile: customerPhone,
        EMail: customerEmail,
        Address: customerAddress,
        ProductsCount: totalItems,
        PriceBeforDiscount: priceBeforeDiscount,
        Discount: regularItemsDiscount, // خصم الأصناف العادية
        ProductOffersDiscount: productOffersDiscount,
        OfferDiscount: offerDiscount,
        Shipping: shipping,
        TotalValue: totalValue,
        NetValue: netValue,
        IDRequestStatus: 1,
        IsActive: true,
        CreatedDate: createdDateISO,
        OrderDate: createdDateISO,
        Time: timeString,
        AppliedOfferName: appliedOfferName,
        AppliedPackageOffersNames: appliedPackageOffersNames,
        DefaultSalesCommission: defaultSalesCommission,
        IsCommissionCalculated: false,
        Notes: notes || '',
        // إضافة بيانات الراعي الشخصي إذا كان موجوداً
        ...(personalSponsor && {
          PersonalSponsorID: personalSponsor.id,
          PersonalSponsorCode: personalSponsor.code,
          PersonalSponsorName: personalSponsor.name,
          PersonalSponsorMobile: personalSponsor.mobile
        })
      }

      // كتابة الطلب والتفاصيل كعملية واحدة
      const batch = writeBatch(db)
      const orderRef = doc(db, SHOP_ORDERS_COLLECTION, nextOrderID.toString())
      batch.set(orderRef, shopOrder)

      // تفاصيل الطلب كمجموعة فرعية
      for (let i = 0; i < orderItems.length; i++) {
        const it = orderItems[i]
        const detailID = i + 1
        const detailDocRef = doc(
          db,
          SHOP_ORDERS_COLLECTION,
          nextOrderID.toString(),
          ORDER_DETAILS_COLLECTION,
          detailID.toString()
        )
        // البحث عن DefaultSalesCommission للمنتج من عناصر السلة
        const cartItem = cartItems.find((item: any) => item.IDProduct === it.IDProduct)
        const productCommission = cartItem?.DefaultSalesCommission || 0
        
        const orderDetail = {
          ID: detailID,
          IDOrder: nextOrderID,
          IDProduct: it.IDProduct,
          Name: it.Name,
          Qty: it.Qty,
          SalesPrice: it.SalesPrice,
          TotalSalesPrice: it.TotalSalesPrice,
          ImageURL: it.ImageURL,
          BarCode: it.BarCode,
          DefaultSalesCommission: productCommission
        }
        batch.set(detailDocRef, orderDetail)
      }

      await batch.commit()
      
      // تشخيص بعد الحفظ
      console.log('✅ تم حفظ الطلب بنجاح:', {
        orderID: nextOrderID,
        hasPersonalSponsor: !!personalSponsor,
        personalSponsorData: personalSponsor ? {
          PersonalSponsorID: personalSponsor.id,
          PersonalSponsorCode: personalSponsor.code,
          PersonalSponsorName: personalSponsor.name,
          PersonalSponsorMobile: personalSponsor.mobile
        } : null
      })
      
      return nextOrderID.toString()
    } catch (error) {
      console.error('خطأ في إنشاء الطلب من السلة:', error)
      throw new Error('فشل في إنشاء الطلب من السلة')
    }
  }

  // تحويل السلة إلى طلب (يحفظ في Shop_Orders)
  static async convertCartToOrder(cartCustomer: any): Promise<string> {
    try {
      const orderId = await this.createOrderFromCart(
        cartCustomer.userID,
        cartCustomer.customerName,
        cartCustomer.customerPhone || '',
        cartCustomer.customerEmail || '',
        cartCustomer.customerAddress || '',
        cartCustomer.cartItems || [],
        'cash',
        `تم تحويل الطلب من السلة - تاريخ التحويل: ${new Date().toLocaleString('ar-EG')}`,
        undefined,
        {
          totalItems: cartCustomer.totalItems,
          totalPrice: (cartCustomer.cartItems || []).reduce((s: number, it: any) => s + (it.TotalPriceBeforDiscount || 0), 0),
          totalDiscount: (cartCustomer.cartItems || [])
            .filter((it: any) => !it.isOffer)
            .reduce((s: number, it: any) => s + (it.TotalDiscountValue || 0), 0),
          productOffersDiscount: (cartCustomer.cartItems || [])
            .filter((it: any) => it.isOffer)
            .reduce((s: number, it: any) => s + (it.TotalDiscountValue || 0), 0),
          shipping: 0,
          offerDiscount: 0,
          finalTotal: cartCustomer.totalValue
        }
      )
      return orderId
    } catch (error) {
      console.error('خطأ في تحويل السلة إلى طلب:', error)
      throw new Error('فشل في تحويل السلة إلى طلب')
    }
  }

  // تحديث كمية منتج في الطلب وتحديث العمولة
  static async updateOrderItemQuantity(orderID: string, productID: number, newQuantity: number): Promise<void> {
    try {
      // جلب تفاصيل الطلب الحالية
      const orderDetailsRef = collection(db, SHOP_ORDERS_COLLECTION, orderID, ORDER_DETAILS_COLLECTION)
      const orderDetailsSnapshot = await getDocs(orderDetailsRef)
      
      let targetDetail: any = null
      const allDetails: any[] = []
      
      orderDetailsSnapshot.forEach(doc => {
        const detail = { ID: parseInt(doc.id), ...doc.data() }
        allDetails.push(detail)
        if (detail.IDProduct === productID) {
          targetDetail = detail
        }
      })
      
      if (!targetDetail) {
        throw new Error('المنتج غير موجود في الطلب')
      }
      
      // تحديث الكمية والعمولة للمنتج المحدد
      targetDetail.Qty = newQuantity
      targetDetail.TotalSalesPrice = (targetDetail.SalesPrice || 0) * newQuantity
      
      // تحديث تفاصيل الطلب
      const detailRef = doc(db, SHOP_ORDERS_COLLECTION, orderID, ORDER_DETAILS_COLLECTION, targetDetail.ID.toString())
      await updateDoc(detailRef, {
        Qty: newQuantity,
        TotalSalesPrice: targetDetail.TotalSalesPrice
      })
      
      // تحديث العمولة الإجمالية
      await this.updateOrderCommission(orderID, allDetails)
      
      console.log('تم تحديث كمية المنتج في الطلب:', {
        orderID,
        productID,
        newQuantity,
        productName: targetDetail.Name,
        targetDetail: targetDetail,
        allDetails: allDetails
      })
    } catch (error) {
      console.error('خطأ في تحديث كمية المنتج:', error)
      throw new Error('فشل في تحديث كمية المنتج')
    }
  }

  // تحديث عمولة المندوب في الطلب عند تعديل الكمية
  static async updateOrderCommission(orderID: string, orderDetails: any[]): Promise<void> {
    try {
      // حساب إجمالي العمولة الجديد
      const totalCommission = orderDetails.reduce(
        (sum: number, detail: any) => sum + ((detail.DefaultSalesCommission || 0) * (detail.Qty || 0)),
        0
      )
      
      // تحديث Shop_Orders
      const orderRef = doc(db, SHOP_ORDERS_COLLECTION, orderID)
      await updateDoc(orderRef, {
        DefaultSalesCommission: totalCommission,
        updatedAt: serverTimestamp()
      })
      
      // تحديث Shop_OrdersDetails
      const batch = writeBatch(db)
      for (const detail of orderDetails) {
        const detailRef = doc(
          db,
          SHOP_ORDERS_COLLECTION,
          orderID,
          ORDER_DETAILS_COLLECTION,
          detail.ID.toString()
        )
        batch.update(detailRef, {
          DefaultSalesCommission: detail.DefaultSalesCommission,
          Qty: detail.Qty
        })
      }
      await batch.commit()
      
      console.log('تم تحديث عمولة المندوب في الطلب:', {
        orderID,
        totalCommission,
        detailsCount: orderDetails.length,
        commissionDetails: orderDetails.map(detail => ({
          productName: detail.Name,
          qty: detail.Qty,
          commission: detail.DefaultSalesCommission,
          totalCommission: (detail.DefaultSalesCommission || 0) * (detail.Qty || 0)
        }))
      })
    } catch (error) {
      console.error('خطأ في تحديث عمولة المندوب:', error)
      throw new Error('فشل في تحديث عمولة المندوب')
    }
  }

  // جلب طلبات العميل من Shop_Orders مع التفاصيل
  static async getClientOrders(clientID: number): Promise<any[]> {
    try {
      const q = query(
        collection(db, SHOP_ORDERS_COLLECTION),
        where('IDClient', '==', clientID)
      )
      const snap = await getDocs(q)
      const results: any[] = []
      for (const docSnap of snap.docs) {
        const idString = docSnap.id
        const raw = docSnap.data() as any
        const normalized = {
          ...raw,
          OrderNo: raw?.OrderNo || `ORD-${raw?.Code || raw?.ID || idString}`,
          ProductsDiscount: raw?.ProductsDiscount ?? raw?.ProductOffersDiscount ?? 0,
          OffersDiscount: raw?.OffersDiscount ?? raw?.OfferDiscount ?? 0,
          CreatedDate: raw?.CreatedDate || raw?.OrderDate || new Date().toISOString(),
          Time: raw?.Time || ''
        }
        // جلب التفاصيل
        const detailsColRef = collection(db, SHOP_ORDERS_COLLECTION, idString, ORDER_DETAILS_COLLECTION)
        const detailsSnap = await getDocs(detailsColRef)
        const details: any[] = []
        detailsSnap.forEach(d => details.push({ id: d.id, ...d.data() }))
        results.push({ order: { ID: idString, ...normalized }, details })
      }
      // ترتيب تنازلياً حسب CreatedDate إن وجد
      return results.sort((a, b) => new Date(b.order?.CreatedDate || b.order?.OrderDate || 0).getTime() - new Date(a.order?.CreatedDate || a.order?.OrderDate || 0).getTime())
    } catch (error) {
      console.error('خطأ في جلب طلبات العميل:', error)
      return []
    }
  }

  // جلب جميع الطلبات
  static async getAllOrders(): Promise<Order[]> {
    try {
      const q = query(collection(db, ORDERS_COLLECTION))
      const querySnapshot = await getDocs(q)
      const orders: Order[] = []
      
      querySnapshot.forEach((doc) => {
        orders.push({
          ID: doc.id,
          ...doc.data()
        } as Order)
      })
      
      return orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    } catch (error) {
      console.error('خطأ في جلب جميع الطلبات:', error)
      return []
    }
  }

  // تحديث حالة الطلب
  static async updateOrderStatus(orderID: string, status: Order['status']): Promise<void> {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderID)
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
      })
      
      console.log('تم تحديث حالة الطلب بنجاح')
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error)
      throw new Error('فشل في تحديث حالة الطلب')
    }
  }

  // حذف طلب
  static async deleteOrder(orderID: string): Promise<void> {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderID)
      await deleteDoc(orderRef)
      
      console.log('تم حذف الطلب بنجاح')
    } catch (error) {
      console.error('خطأ في حذف الطلب:', error)
      throw new Error('فشل في حذف الطلب')
    }
  }

  // جلب طلب محدد من Shop_Orders مع التفاصيل
  static async getOrder(orderID: number | string): Promise<any | null> {
    try {
      const idString = String(orderID)
      const orderRef = doc(db, SHOP_ORDERS_COLLECTION, idString)
      const orderSnap = await getDoc(orderRef)
      
      if (!orderSnap.exists()) {
        return null
      }
      const raw = orderSnap.data() as any
      const normalized = {
        ...raw,
        OrderNo: raw?.OrderNo || `ORD-${raw?.Code || raw?.ID || idString}`,
        ProductsDiscount: raw?.ProductsDiscount ?? raw?.ProductOffersDiscount ?? 0,
        OffersDiscount: raw?.OffersDiscount ?? raw?.OfferDiscount ?? 0,
        CreatedDate: raw?.CreatedDate || raw?.OrderDate || new Date().toISOString(),
        Time: raw?.Time || ''
      }

      // جلب التفاصيل من المجموعة الفرعية
      const detailsColRef = collection(db, SHOP_ORDERS_COLLECTION, idString, ORDER_DETAILS_COLLECTION)
      const detailsSnap = await getDocs(detailsColRef)
      const details: any[] = []
      detailsSnap.forEach(d => details.push({ id: d.id, ...d.data() }))

      return {
        order: { ID: orderSnap.id, ...normalized },
        details
      }
    } catch (error) {
      console.error('خطأ في جلب الطلب:', error)
      return null
    }
  }
}
