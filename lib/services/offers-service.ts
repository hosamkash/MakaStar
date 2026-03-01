import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { Offer, OfferProduct, OfferWithProducts } from '@/lib/types/offers'

const OFFERS_COLLECTION = 'Def_OffersByProducts'
const OFFER_PRODUCTS_COLLECTION = 'Def_OffersByProductsDetails'
const DISCOUNT_OFFERS_COLLECTION = 'Def_Offers'

export class OffersService {
  // جلب جميع العروض النشطة
  static async getActiveOffers(): Promise<Offer[]> {
    try {
      // استخدام استعلام أبسط بدون orderBy لتجنب مشكلة الفهرس
      const q = query(
        collection(db, OFFERS_COLLECTION),
        where('IsActive', '==', true),
        where('IsBindShop', '==', true)
      )
      
      const querySnapshot = await getDocs(q)
      const offers: Offer[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        offers.push({
          ID: data.ID || 0,
          Code: data.Code || 0,
          Name: data.Name || '',
          ShortDiscription: data.ShortDiscription || '',
          LongDescription: data.LongDescription || '',
          IsActive: data.IsActive || false,
          IsBindShop: data.IsBindShop || false,
          IsBindShopMaster: data.IsBindShopMaster || false,
          ImageName: data.ImageName || '',
          ImageURL: data.ImageURL || '',
          TotalValue: data.TotalValue || 0,
          TotalValueAfterOffer: data.TotalValueAfterOffer || 0,
          ProductsCount: data.ProductsCount || 0,
          DefaultSalesCommission: data.DefaultSalesCommission || 0
        })
      })
      
      // ترتيب النتائج في الذاكرة بدلاً من قاعدة البيانات
      return offers.sort((a, b) => (a.Code || 0) - (b.Code || 0))
    } catch (error) {
      console.error('Error getting active offers:', error)
      throw new Error('فشل في جلب العروض النشطة')
    }
  }

  // جلب العروض النشطة من جدول Def_Offers (خصومات)
  static async getActiveDiscountOffers(): Promise<any[]> {
    try {
      const q = query(
        collection(db, DISCOUNT_OFFERS_COLLECTION),
        where('IsActive', '==', true),
        where('IsBindShop', '==', true)
      )
      
      const querySnapshot = await getDocs(q)
      const offers: any[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        offers.push({
          ID: parseInt(doc.id) || 0,
          Name: data.Name || '',
          DiscountType: data.DiscountType || 'fixed', // fixed أو percentage
          DiscountValue: data.DiscountValue || 0,
          MinOrderValue: data.MinOrderValue || 0,
          MaxDiscountValue: data.MaxDiscountValue || 0,
          IsActive: data.IsActive || false,
          IsBindShop: data.IsBindShop || false,
          contconditionToApplayOffer: data.contconditionToApplayOffer || 0,
          Description: data.Description || '',
          Code: data.Code || 0
        })
      })
      
      console.log('العروض المجلوبة من Firebase:', offers)
      return offers.sort((a, b) => (a.Code || 0) - (b.Code || 0))
    } catch (error) {
      console.error('Error getting discount offers:', error)
      throw new Error('فشل في جلب عروض الخصم')
    }
  }

  // جلب عرض محدد
  static async getOffer(offerId: number): Promise<Offer | null> {
    try {
      const offerDoc = await getDoc(doc(db, OFFERS_COLLECTION, offerId.toString()))
      
      if (!offerDoc.exists()) {
        return null
      }
      
      const data = offerDoc.data()
      return {
        ID: data.ID || 0,
        Code: data.Code || 0,
        Name: data.Name || '',
        ShortDiscription: data.ShortDiscription || '',
        LongDescription: data.LongDescription || '',
        IsActive: data.IsActive || false,
        IsBindShop: data.IsBindShop || false,
        IsBindShopMaster: data.IsBindShopMaster || false,
        ImageName: data.ImageName || '',
        ImageURL: data.ImageURL || '',
        TotalValue: data.TotalValue || 0,
        TotalValueAfterOffer: data.TotalValueAfterOffer || 0,
        ProductsCount: data.ProductsCount || 0,
        DefaultSalesCommission: data.DefaultSalesCommission || 0
      }
    } catch (error) {
      console.error('Error getting offer:', error)
      throw new Error('فشل في جلب العرض')
    }
  }

  // جلب منتجات العرض
  static async getOfferProducts(offerId: number): Promise<OfferProduct[]> {
    try {
      const q = query(
        collection(db, OFFERS_COLLECTION, offerId.toString(), OFFER_PRODUCTS_COLLECTION)
      )
      
      const querySnapshot = await getDocs(q)
      const products: OfferProduct[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        products.push({
          ID: parseInt(doc.id) || 0,
          IDOffer: data.IDOffer || 0,
          IDProduct: data.IDProduct || 0,
          Name: data.Name || '',
          Qty: data.Qty || 0,
          Price: data.Price || 0,
          TotalPrice: data.TotalPrice || 0,
          ImageURL: data.ImageURL || '',
          Description: data.Description || ''
        })
      })
      
      return products
    } catch (error) {
      console.error('Error getting offer products:', error)
      throw new Error('فشل في جلب منتجات العرض')
    }
  }

  // جلب عرض مع منتجاته
  static async getOfferWithProducts(offerId: number): Promise<OfferWithProducts | null> {
    try {
      const offer = await this.getOffer(offerId)
      if (!offer) return null
      
      const products = await this.getOfferProducts(offerId)
      
      return {
        offer,
        products
      }
    } catch (error) {
      console.error('Error getting offer with products:', error)
      throw new Error('فشل في جلب العرض مع منتجاته')
    }
  }

  // إنشاء عرض جديد
  static async createOffer(offerData: Partial<Offer>): Promise<Offer> {
    try {
      const docRef = await addDoc(collection(db, OFFERS_COLLECTION), {
        ...offerData,
        CreatedDate: serverTimestamp(),
        ModifiedDate: serverTimestamp()
      })
      
      return {
        ID: parseInt(docRef.id),
        ...offerData
      } as Offer
    } catch (error) {
      console.error('Error creating offer:', error)
      throw new Error('فشل في إنشاء العرض')
    }
  }

  // تحديث عرض
  static async updateOffer(offerId: number, updateData: Partial<Offer>): Promise<void> {
    try {
      const offerRef = doc(db, OFFERS_COLLECTION, offerId.toString())
      await updateDoc(offerRef, {
        ...updateData,
        ModifiedDate: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating offer:', error)
      throw new Error('فشل في تحديث العرض')
    }
  }

  // حذف عرض
  static async deleteOffer(offerId: number): Promise<void> {
    try {
      await deleteDoc(doc(db, OFFERS_COLLECTION, offerId.toString()))
    } catch (error) {
      console.error('Error deleting offer:', error)
      throw new Error('فشل في حذف العرض')
    }
  }

  // إضافة منتج للعرض
  static async addProductToOffer(offerId: number, productData: Partial<OfferProduct>): Promise<OfferProduct> {
    try {
      const docRef = await addDoc(
        collection(db, OFFERS_COLLECTION, offerId.toString(), OFFER_PRODUCTS_COLLECTION),
        {
          ...productData,
          IDOffer: offerId,
          CreatedDate: serverTimestamp()
        }
      )
      
      return {
        ID: parseInt(docRef.id),
        IDOffer: offerId,
        ...productData
      } as OfferProduct
    } catch (error) {
      console.error('Error adding product to offer:', error)
      throw new Error('فشل في إضافة المنتج للعرض')
    }
  }

  // حذف منتج من العرض
  static async removeProductFromOffer(offerId: number, productId: number): Promise<void> {
    try {
      await deleteDoc(
        doc(db, OFFERS_COLLECTION, offerId.toString(), OFFER_PRODUCTS_COLLECTION, productId.toString())
      )
    } catch (error) {
      console.error('Error removing product from offer:', error)
      throw new Error('فشل في حذف المنتج من العرض')
    }
  }
}
