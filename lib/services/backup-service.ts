import { db, storage } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  writeBatch,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore'
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage'

// تعريف أنواع البيانات
export interface BackupMetadata {
  id: string
  name: string
  description?: string
  createdAt: Date
  size: number
  collections: string[]
  storageFiles: number
  version: string
}

export interface BackupData {
  metadata: BackupMetadata
  collections: Record<string, any[]>
  storageFiles: Record<string, string> // path -> downloadURL
}

// قائمة المجموعات المهمة للنسخ الاحتياطي
const IMPORTANT_COLLECTIONS = [
  'Mak.Def_Colors',
  'Mak.Def_Sizes', 
  'Mak.Def_ProductStructure',
  'Mak.Def_ProductStructureCategoty',
  'Mak.Def_Categories',
  'Mak.Def_Offers',
  'Mak.Def_OffersByProducts',
  'Mak.Def_ShopBanner',
  'Mak.DefGeo_Government',
  'Mak.DefGeo_Cities',
  'Mak.DefGeo_Areas',
  'Mak.DefGeo_Villages',
  'Mak.DefGeo_Places',
  'Mak.Shop_Orders',
  'Mak.Shop_OrdersDetails',
  'Mak.Shop_Bascet',
  'Mak.Orders',
  'Mak.Dealing_Employees',
  'Mak.Dealing_Clients',
  'Mak.Dealing_Vendors',
  'Mak.App_ScreenSettings'
]

export class BackupService {
  private static readonly BACKUP_COLLECTION = 'Mak.System_Backups'
  private static readonly STORAGE_BACKUP_PATH = 'Application/SystemBackups'

  /**
   * إنشاء نسخة احتياطية شاملة
   */
  static async createBackup(name: string, description?: string): Promise<BackupMetadata> {
    try {
      console.log('بدء إنشاء النسخة الاحتياطية...')
      
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const startTime = Date.now()
      
      // 1. نسخ بيانات Firestore
      console.log('نسخ بيانات Firestore...')
      const collections = await this.backupFirestoreCollections()
      
      // 2. نسخ ملفات Storage
      console.log('نسخ ملفات Storage...')
      let storageFiles: Record<string, string> = {}
      try {
        storageFiles = await this.backupStorageFiles()
      } catch (error) {
        console.warn('فشل في نسخ ملفات Storage، سيتم المتابعة بدونها:', error)
      }
      
      // 3. إنشاء البيانات الوصفية
      const metadata: BackupMetadata = {
        id: backupId,
        name,
        description,
        createdAt: new Date(),
        size: this.calculateBackupSize(collections, storageFiles),
        collections: Object.keys(collections),
        storageFiles: Object.keys(storageFiles).length,
        version: '1.0'
      }
      
      // 4. حفظ النسخة الاحتياطية
      const backupData: BackupData = {
        metadata,
        collections,
        storageFiles
      }
      
      // محاولة حفظ في Storage، إذا فشل نحفظ في Firestore
      try {
        await this.saveBackupToStorage(backupData)
        console.log('تم حفظ النسخة الاحتياطية في Storage')
      } catch (error) {
        console.warn('فشل في حفظ النسخة الاحتياطية في Storage:', error)
        // نحفظ البيانات في Firestore كبديل
        await this.saveBackupDataToFirestore(backupData)
        console.log('تم حفظ النسخة الاحتياطية في Firestore')
      }
      
      await this.saveBackupMetadata(metadata)
      
      const duration = Date.now() - startTime
      console.log(`تم إنشاء النسخة الاحتياطية بنجاح في ${duration}ms`)
      
      return metadata
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error)
      throw new Error(`فشل في إنشاء النسخة الاحتياطية: ${error}`)
    }
  }

  /**
   * نسخ مجموعات Firestore
   */
  private static async backupFirestoreCollections(): Promise<Record<string, any[]>> {
    const collections: Record<string, any[]> = {}
    
    for (const collectionName of IMPORTANT_COLLECTIONS) {
      try {
        console.log(`نسخ مجموعة: ${collectionName}`)
        const collectionRef = collection(db, collectionName)
        const snapshot = await getDocs(collectionRef)
        
        const documents: any[] = []
        snapshot.forEach(doc => {
          documents.push({
            id: doc.id,
            data: doc.data(),
            path: doc.ref.path
          })
        })
        
        collections[collectionName] = documents
        console.log(`تم نسخ ${documents.length} مستند من ${collectionName}`)
      } catch (error) {
        console.warn(`خطأ في نسخ مجموعة ${collectionName}:`, error)
        collections[collectionName] = []
      }
    }
    
    return collections
  }

  /**
   * نسخ ملفات Storage
   */
  private static async backupStorageFiles(): Promise<Record<string, string>> {
    const storageFiles: Record<string, string> = {}
    
    try {
      // نسخ ملفات Application folder
      const applicationRef = ref(storage, 'Application')
      const applicationList = await listAll(applicationRef)
      
      for (const folderRef of applicationList.prefixes) {
        try {
          const folderList = await listAll(folderRef)
          
          for (const fileRef of folderList.items) {
            try {
              const downloadURL = await getDownloadURL(fileRef)
              storageFiles[fileRef.fullPath] = downloadURL
            } catch (error) {
              console.warn(`خطأ في نسخ الملف ${fileRef.fullPath}:`, error)
            }
          }
        } catch (error) {
          console.warn(`خطأ في الوصول للمجلد ${folderRef.fullPath}:`, error)
        }
      }
      
      console.log(`تم نسخ ${Object.keys(storageFiles).length} ملف من Storage`)
    } catch (error) {
      console.warn('خطأ في نسخ ملفات Storage:', error)
      // لا نرمي الخطأ، نكمل بدون ملفات Storage
    }
    
    return storageFiles
  }

  /**
   * حفظ النسخة الاحتياطية في Storage
   */
  private static async saveBackupToStorage(backupData: BackupData): Promise<void> {
    const backupRef = ref(storage, `${this.STORAGE_BACKUP_PATH}/${backupData.metadata.id}.json`)
    const jsonData = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    
    await uploadBytes(backupRef, blob)
  }

  /**
   * حفظ البيانات الوصفية للنسخة الاحتياطية
   */
  private static async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const backupRef = doc(db, this.BACKUP_COLLECTION, metadata.id)
    await setDoc(backupRef, metadata)
  }

  /**
   * حفظ بيانات النسخة الاحتياطية في Firestore (بديل للـ Storage)
   */
  private static async saveBackupDataToFirestore(backupData: BackupData): Promise<void> {
    const backupRef = doc(db, this.BACKUP_COLLECTION, `backup_data_${backupData.metadata.id}`)
    await setDoc(backupRef, {
      ...backupData.metadata,
      data: backupData.collections,
      storageFiles: backupData.storageFiles,
      storedIn: 'firestore' // علامة أن البيانات محفوظة في Firestore
    })
  }

  /**
   * حساب حجم النسخة الاحتياطية
   */
  private static calculateBackupSize(collections: Record<string, any[]>, storageFiles: Record<string, string>): number {
    const collectionsSize = JSON.stringify(collections).length
    const storageSize = JSON.stringify(storageFiles).length
    return collectionsSize + storageSize
  }

  /**
   * الحصول على قائمة النسخ الاحتياطية
   */
  static async getBackups(): Promise<BackupMetadata[]> {
    try {
      const backupsRef = collection(db, this.BACKUP_COLLECTION)
      const q = query(backupsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const backups: BackupMetadata[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        // نتجاهل مستندات backup_data ونأخذ فقط البيانات الوصفية
        if (!doc.id.startsWith('backup_data_')) {
          backups.push({
            ...data,
            createdAt: data.createdAt.toDate()
          } as BackupMetadata)
        }
      })
      
      return backups
    } catch (error) {
      console.error('خطأ في جلب النسخ الاحتياطية:', error)
      throw new Error('فشل في جلب النسخ الاحتياطية')
    }
  }

  /**
   * استعادة نسخة احتياطية
   */
  static async restoreBackup(backupId: string): Promise<void> {
    try {
      console.log(`بدء استعادة النسخة الاحتياطية: ${backupId}`)
      
      // 1. تحميل بيانات النسخة الاحتياطية
      const backupData = await this.loadBackupFromStorage(backupId)
      
      // 2. استعادة بيانات Firestore
      await this.restoreFirestoreCollections(backupData.collections)
      
      // 3. استعادة ملفات Storage (اختياري - يمكن تخطيها)
      // await this.restoreStorageFiles(backupData.storageFiles)
      
      console.log('تم استعادة النسخة الاحتياطية بنجاح')
    } catch (error) {
      console.error('خطأ في استعادة النسخة الاحتياطية:', error)
      throw new Error(`فشل في استعادة النسخة الاحتياطية: ${error}`)
    }
  }

  /**
   * تحميل بيانات النسخة الاحتياطية من Storage أو Firestore
   */
  private static async loadBackupFromStorage(backupId: string): Promise<BackupData> {
    // أولاً نحاول تحميل من Firestore
    try {
      const backupRef = doc(db, this.BACKUP_COLLECTION, `backup_data_${backupId}`)
      const backupDoc = await getDoc(backupRef)
      
      if (backupDoc.exists()) {
        const data = backupDoc.data()
        
        // إذا كانت البيانات محفوظة في Firestore
        if (data.storedIn === 'firestore') {
          return {
            metadata: {
              id: data.id,
              name: data.name,
              description: data.description,
              createdAt: data.createdAt.toDate(),
              size: data.size,
              collections: data.collections,
              storageFiles: data.storageFiles,
              version: data.version
            },
            collections: data.data,
            storageFiles: data.storageFiles
          }
        }
      }
    } catch (error) {
      console.warn('فشل في تحميل النسخة الاحتياطية من Firestore:', error)
    }
    
    // إذا فشل، نحاول تحميل من Storage
    try {
      const backupRef = ref(storage, `${this.STORAGE_BACKUP_PATH}/${backupId}.json`)
      const downloadURL = await getDownloadURL(backupRef)
      const response = await fetch(downloadURL)
      const backupData = await response.json()
      return backupData
    } catch (error) {
      throw new Error(`فشل في تحميل النسخة الاحتياطية: ${error}`)
    }
  }

  /**
   * استعادة مجموعات Firestore
   */
  private static async restoreFirestoreCollections(collections: Record<string, any[]>): Promise<void> {
    const batch = writeBatch(db)
    let batchCount = 0
    const BATCH_LIMIT = 500 // حد Firebase للكتابة في الدفعة الواحدة
    
    for (const [collectionName, documents] of Object.entries(collections)) {
      console.log(`استعادة مجموعة: ${collectionName}`)
      
      // تخطي المجموعات التي تحتاج صلاحيات خاصة
      const restrictedCollections = [
        'DefGeo_Government',
        'DefGeo_Cities', 
        'DefGeo_Areas',
        'DefGeo_Villages',
        'DefGeo_Places'
      ]
      
      if (restrictedCollections.includes(collectionName)) {
        console.log(`تخطي مجموعة ${collectionName} - تحتاج صلاحيات خاصة`)
        continue
      }
      
      for (const docData of documents) {
        if (batchCount >= BATCH_LIMIT) {
          try {
            await batch.commit()
            batchCount = 0
          } catch (error) {
            console.warn(`خطأ في حفظ الدفعة: ${error}`)
            // نكمل مع دفعة جديدة
            batchCount = 0
          }
        }
        
        try {
          const docRef = doc(db, collectionName, docData.id)
          batch.set(docRef, docData.data)
          batchCount++
        } catch (error) {
          console.warn(`خطأ في إضافة المستند ${docData.id} إلى الدفعة: ${error}`)
        }
      }
    }
    
    if (batchCount > 0) {
      try {
        await batch.commit()
        console.log('تم حفظ الدفعة الأخيرة بنجاح')
      } catch (error) {
        console.warn(`خطأ في حفظ الدفعة الأخيرة: ${error}`)
      }
    }
    
    console.log('تم استعادة جميع المجموعات بنجاح')
  }

  /**
   * حذف نسخة احتياطية
   */
  static async deleteBackup(backupId: string): Promise<void> {
    try {
      // حذف البيانات الوصفية من Firestore
      const backupMetadataRef = doc(db, this.BACKUP_COLLECTION, backupId)
      await deleteDoc(backupMetadataRef)
      
      // حذف بيانات النسخة الاحتياطية من Firestore
      const backupDataRef = doc(db, this.BACKUP_COLLECTION, `backup_data_${backupId}`)
      await deleteDoc(backupDataRef)
      
      // محاولة حذف ملف النسخة الاحتياطية من Storage (إذا كان موجود)
      try {
        const storageRef = ref(storage, `${this.STORAGE_BACKUP_PATH}/${backupId}.json`)
        await deleteObject(storageRef)
        console.log(`تم حذف ملف النسخة الاحتياطية من Storage: ${backupId}`)
      } catch (error) {
        console.warn(`لم يتم العثور على ملف النسخة الاحتياطية في Storage: ${backupId}`)
      }
      
      console.log(`تم حذف النسخة الاحتياطية: ${backupId}`)
    } catch (error) {
      console.error('خطأ في حذف النسخة الاحتياطية:', error)
      throw new Error(`فشل في حذف النسخة الاحتياطية: ${error}`)
    }
  }

  /**
   * الحصول على إحصائيات النسخ الاحتياطية
   */
  static async getBackupStats(): Promise<{
    totalBackups: number
    totalSize: number
    lastBackup?: Date
  }> {
    try {
      const backups = await this.getBackups()
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)
      const lastBackup = backups.length > 0 ? backups[0].createdAt : undefined
      
      return {
        totalBackups: backups.length,
        totalSize,
        lastBackup
      }
    } catch (error) {
      console.error('خطأ في جلب إحصائيات النسخ الاحتياطية:', error)
      return {
        totalBackups: 0,
        totalSize: 0
      }
    }
  }
}
