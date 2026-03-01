'use client'

import { useState, useEffect } from 'react'
import { collection, doc, updateDoc, query, where, getDocs, setDoc, deleteDoc, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useClientSession } from './use-client-session'

export interface FavoriteProduct {
  id: string
  productId: number
  productName: string
  productPrice: number
  productImage: string
  isFavorite: boolean
}

export function useFavorites() {
  const { session: clientSession, isLoading: sessionLoading } = useClientSession()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [favoriteStatuses, setFavoriteStatuses] = useState<Record<number, boolean>>({})
  const [nextDocumentId, setNextDocumentId] = useState<number>(1)

  // دالة للحصول على أكبر رقم موجود في المفضلة
  const getNextDocumentId = async (): Promise<number> => {
    try {
      // إذا كان لدينا رقم محفوظ، استخدمه
      if (nextDocumentId > 1) {
        const newId = nextDocumentId
        setNextDocumentId(newId + 1)
        return newId
      }
      
      const favoritesRef = collection(db, "Shop_ProductsFavorits")
      const querySnapshot = await getDocs(favoritesRef)
      
      if (querySnapshot.empty) {
        setNextDocumentId(2)
        return 1
      }
      
      let maxId = 0
      
      for (const docSnapshot of querySnapshot.docs) {
        const docId = docSnapshot.id
        const numericId = parseInt(docId)
        
        if (!isNaN(numericId) && numericId > maxId) {
          maxId = numericId
        }
      }
      
      const nextId = maxId + 1
      setNextDocumentId(nextId + 1)
      return nextId
    } catch (error) {
      console.error('Error getting next document ID:', error)
      return 1
    }
  }

  // دالة للبحث عن document ID للمنتج المحدد
  const findFavoriteDocumentId = async (productId: number): Promise<string | null> => {
    if (!clientSession?.id) return null

    try {
      const favoritesRef = collection(db, "Shop_ProductsFavorits")
      const q = query(
        favoritesRef,
        where("IDProduct", "==", productId),
        where("IDClient", "==", clientSession.id),
        where("IsFavorit", "==", true)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id
        
        // إذا كان الـ document ID معقد (مثل "123_456")، احذفه وأنشئ واحد جديد
        if (docId.includes('_') || isNaN(parseInt(docId))) {
          console.log('Found complex document ID, will recreate with numeric ID:', docId)
          await deleteDoc(doc(db, "Shop_ProductsFavorits", docId))
          return null
        }
        
        return docId
      }
      
      return null
    } catch (error) {
      console.error('Error finding favorite document ID:', error)
      return null
    }
  }

  // جلب المفضلة
  const loadFavorites = async () => {
    if (!clientSession?.id) return

    try {
      setLoading(true)
      const favoritesRef = collection(db, "Shop_ProductsFavorits")
      const q = query(
        favoritesRef,
        where("IDClient", "==", clientSession.id),
        where("IsFavorit", "==", true)
      )
      const querySnapshot = await getDocs(q)
      
      const favoritesData: FavoriteProduct[] = []
      const statuses: Record<number, boolean> = {}
      const productsToRecreate: number[] = []
      
      for (const docSnapshot of querySnapshot.docs) {
        const favoriteData = docSnapshot.data()
        const docId = docSnapshot.id
        
        // تنظيف المستندات القديمة تلقائياً
        if (docId.includes('_') || isNaN(parseInt(docId))) {
          console.log('Cleaning up old document ID:', docId)
          await deleteDoc(doc(db, "Shop_ProductsFavorits", docId))
          productsToRecreate.push(favoriteData.IDProduct)
          continue
        }
        
        // جلب بيانات المنتج
        const productsRef = collection(db, "Def_ProductStructure")
        const productQuery = query(
          productsRef,
          where("ID", "==", favoriteData.IDProduct),
          where("IsActive", "==", true)
        )
        const productSnapshot = await getDocs(productQuery)
        
        if (!productSnapshot.empty) {
          const productData = productSnapshot.docs[0].data()
          const favoriteProduct: FavoriteProduct = {
            id: docSnapshot.id,
            productId: favoriteData.IDProduct,
            productName: productData.Name || '',
            productPrice: productData.ShopPrice || productData.UnitSmall_Sales1 || 0,
            productImage: productData.ImageURL || '',
            isFavorite: favoriteData.IsFavorit
          }
          favoritesData.push(favoriteProduct)
          statuses[favoriteData.IDProduct] = true
        }
      }
      
      // إعادة إنشاء المنتجات المفضلة بأرقام متسلسلة
      for (const productId of productsToRecreate) {
        try {
          await addToFavorites(productId)
        } catch (error) {
          console.error(`Error recreating favorite for product ${productId}:`, error)
        }
      }
      
      setFavorites(favoritesData)
      setFavoriteStatuses(statuses)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  // إضافة للمفضلة
  const addToFavorites = async (productId: number) => {
    // انتظار حتى يتم تحميل الجلسة
    if (sessionLoading) {
      throw new Error('جاري تحميل بيانات الجلسة...')
    }

    if (!clientSession?.id) {
      throw new Error('يجب تسجيل الدخول لإضافة المنتج للمفضلة')
    }

    try {
      // التحقق من وجود المنتج في المفضلة
      const existingDocId = await findFavoriteDocumentId(productId)
      if (existingDocId) {
        throw new Error('المنتج موجود بالفعل في المفضلة')
      }
      
      // الحصول على الرقم التالي للمستند
      const nextId = await getNextDocumentId()
      
      console.log(`Adding favorite with numeric ID: ${nextId} for product: ${productId}`)
      
      // إضافة المنتج للمفضلة باستخدام رقم متسلسل
      await setDoc(doc(db, "Shop_ProductsFavorits", nextId.toString()), {
        IDProduct: productId,
        IDClient: clientSession.id,
        IsFavorit: true
      })
      
      // تحديث الحالة المحلية
      setFavoriteStatuses(prev => ({ ...prev, [productId]: true }))
      
      // إعادة تحميل المفضلة
      await loadFavorites()
      
      return true
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  // إزالة من المفضلة
  const removeFromFavorites = async (productId: number) => {
    // انتظار حتى يتم تحميل الجلسة
    if (sessionLoading) {
      throw new Error('جاري تحميل بيانات الجلسة...')
    }

    if (!clientSession?.id) {
      throw new Error('يجب تسجيل الدخول لإزالة المنتج من المفضلة')
    }

    try {
      // البحث عن document ID للمنتج
      const documentId = await findFavoriteDocumentId(productId)
      
      if (!documentId) {
        throw new Error('المنتج غير موجود في المفضلة')
      }
      
      console.log(`Removing favorite with ID: ${documentId} for product: ${productId}`)
      
      // حذف المنتج من المفضلة باستخدام document ID
      await deleteDoc(doc(db, "Shop_ProductsFavorits", documentId))
      
      // تحديث الحالة المحلية
      setFavoriteStatuses(prev => ({ ...prev, [productId]: false }))
      
      // إعادة تحميل المفضلة
      await loadFavorites()
      
      return true
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  // تبديل حالة المفضلة
  const toggleFavorite = async (productId: number) => {
    try {
      if (!clientSession?.id) {
        throw new Error('يجب تسجيل الدخول لإدارة المفضلة')
      }
      if (favoriteStatuses[productId]) {
        await removeFromFavorites(productId)
      } else {
        await addToFavorites(productId)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  // التحقق من حالة المفضلة
  const isFavorite = (productId: number): boolean => {
    return favoriteStatuses[productId] || false
  }

  // تحميل المفضلة عند تغيير الجلسة
  useEffect(() => {
    if (clientSession?.id && !sessionLoading) {
      // تنظيف المستندات القديمة أولاً ثم تحميل المفضلة
      cleanupAllOldDocuments().then(() => {
        loadFavorites()
      })
    } else if (!clientSession && !sessionLoading) {
      setFavorites([])
      setFavoriteStatuses({})
      setNextDocumentId(1)
    }
  }, [clientSession?.id, sessionLoading])

  // دالة مساعدة لتنظيف جميع المستندات القديمة
  const cleanupAllOldDocuments = async () => {
    if (!clientSession?.id) return

    try {
      console.log('Starting full cleanup of old favorite documents...')
      const favoritesRef = collection(db, "Shop_ProductsFavorits")
      const q = query(
        favoritesRef,
        where("IDClient", "==", clientSession.id),
        where("IsFavorit", "==", true)
      )
      const querySnapshot = await getDocs(q)
      
      let cleanedCount = 0
      const productsToRecreate: number[] = []
      
      for (const docSnapshot of querySnapshot.docs) {
        const docId = docSnapshot.id
        const data = docSnapshot.data()
        
        // إذا كان الـ document ID معقد (ليس رقماً)
        if (docId.includes('_') || isNaN(parseInt(docId))) {
          console.log(`Cleaning up complex document ID: ${docId}`)
          await deleteDoc(doc(db, "Shop_ProductsFavorits", docId))
          productsToRecreate.push(data.IDProduct)
          cleanedCount++
        }
      }
      
      // إعادة إنشاء المنتجات المفضلة بأرقام متسلسلة
      for (const productId of productsToRecreate) {
        try {
          // استخدام رقم متسلسل مباشرة بدون استدعاء addToFavorites لتجنب التكرار
          const nextId = await getNextDocumentId()
          await setDoc(doc(db, "Shop_ProductsFavorits", nextId.toString()), {
            IDProduct: productId,
            IDClient: clientSession.id,
            IsFavorit: true
          })
          console.log(`Recreated favorite with ID: ${nextId} for product: ${productId}`)
        } catch (error) {
          console.error(`Error recreating favorite for product ${productId}:`, error)
        }
      }
      
      console.log(`Full cleanup completed: ${cleanedCount} documents cleaned, ${productsToRecreate.length} recreated`)
    } catch (error) {
      console.error('Error during full cleanup:', error)
    }
  }

  return {
    favorites,
    loading,
    favoriteStatuses,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    loadFavorites,
    cleanupAllOldDocuments
  }
}
