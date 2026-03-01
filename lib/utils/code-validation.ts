import { collection, getDocs } from 'firebase/firestore'
import { db, getCollectionName } from '@/lib/firebase'

/**
 * Validates that a code is unique within a specific collection
 * @param collectionName - The Firestore collection name
 * @param code - The code to validate
 * @param currentId - The current document ID (for edit mode, to exclude self from validation)
 * @returns Promise<boolean> - true if code is unique, false if duplicate
 */
export async function validateCodeUniqueness(
  collectionName: string, 
  code: string | number, 
  currentId?: string
): Promise<boolean> {
  try {
    const collectionRef = collection(db, getCollectionName(collectionName))
    const snapshot = await getDocs(collectionRef)
    
    const numericCode = typeof code === 'string' ? parseInt(code) : code
    
    // Check if code already exists (excluding current document in edit mode)
    const existingDoc = snapshot.docs.find(doc => {
      const data = doc.data()
      // Check for 'Code', 'BarCode', or 'ID' fields
      let docCode = null
      if (data.Code !== undefined) {
        docCode = typeof data.Code === 'string' ? parseInt(data.Code) : data.Code
      } else if (data.BarCode !== undefined) {
        docCode = typeof data.BarCode === 'string' ? parseInt(data.BarCode) : data.BarCode
      } else if (data.ID !== undefined) {
        docCode = typeof data.ID === 'string' ? parseInt(data.ID) : data.ID
      }
      return docCode === numericCode && doc.id !== currentId
    })
    
    return !existingDoc // Return true if no duplicate found
  } catch (error) {
    console.error('Error validating code uniqueness:', error)
    return false // Return false on error to prevent saving
  }
}

/**
 * Validates code uniqueness and shows appropriate error message
 * @param collectionName - The Firestore collection name
 * @param code - The code to validate
 * @param currentId - The current document ID (for edit mode)
 * @returns Promise<boolean> - true if validation passes, false if fails
 */
export async function validateCodeWithMessage(
  collectionName: string,
  code: string | number,
  currentId?: string
): Promise<boolean> {
  const isValid = await validateCodeUniqueness(collectionName, code, currentId)
  
  if (!isValid) {
    // رسالة مختلفة حسب نوع المجموعة
    const message = collectionName === 'Mak.Def_ProductStructure' || collectionName === 'Def_ProductStructure' ? 
      "الباركود مستخدم بالفعل. يرجى اختيار باركود آخر" :
      "الكود مستخدم بالفعل. يرجى اختيار كود آخر"
    alert(message)
    return false
  }
  
  return true
}

/**
 * Collection names mapping for different definition types
 */
export const DEFINITION_COLLECTIONS = {
  categories: 'Mak.Def_Categories',
  colors: 'Mak.Def_Colors',
  financialClauses: 'Mak.Def_FinancialCluses', 
  stocks: 'Mak.Def_Stocks',
  treasuries: 'Mak.Def_Treasures',
  companyData: 'Mak.Def_CompanyStructure',
  geographicLocations: {
    government: 'Mak.DefGeo_Government',
    city: 'Mak.DefGeo_Cities', 
    area: 'Mak.DefGeo_Areas',
    village: 'Mak.DefGeo_Villages',
    place: 'Mak.DefGeo_Places'
  },
  jobs: 'Mak.Def_Jobs',
  offers: 'Mak.Def_Offers',
  offersByProducts: 'Mak.Def_OffersByProducts',
  productionCom: 'Mak.Def_ProductionCom',
  products: 'Mak.Def_ProductStructure',
  sections: 'Mak.Def_Sections',
  shopCategories: 'Mak.Def_ShopCategories',
  shopBanner: 'Mak.Def_ShopBanner',
  sizes: 'Mak.Def_Sizes',
  units: 'Mak.Def_Units'
} as const
