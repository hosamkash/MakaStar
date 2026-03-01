"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { validateCodeWithMessage, DEFINITION_COLLECTIONS } from '@/lib/utils/code-validation'
import { Card, CardContent } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, Save, Printer, Upload, Trash, Image as ImageIcon, Check, ChevronsUpDown, Edit } from "lucide-react"
import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"

// تحويل الأرقام من العربي للإنجليزي
const convertToArabicNumbers = (value: number | string): string => {
  const str = String(value)
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return str.replace(/[0-9]/g, match => arabicNumbers[parseInt(match)])
}

const convertToEnglishNumbers = (value: string) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return value.replace(/[٠-٩]/g, match => String(arabicNumbers.indexOf(match)))
}

type OfferByProducts = {
  id: string
  ID: string
  Code: string
  Name: string
  ShortDiscription: string
  LongDescription: string
  IsActive: boolean
  IsBindShop: boolean
  IsBindShopMaster: boolean
  ImageName: string
  ImageURL: string
  TotalValue: number
  TotalValueAfterOffer: number
  ProductsCount: number
  DefaultSalesCommission: number
}

type Product = {
  id: string
  BarCode: string
  Name: string
  Category: string
  CategoryName: string
  UnitName: string
  PurchasePrice: number
  SalesPrice1: number
  SalesPrice2: number
  SalesPrice3: number
  SalesPrice4: number
  SalesPrice5: number
}

type OfferProductDetail = {
  id: string
  ID: number
  IDOfferByProducts: number
  IDProduct: number
  Barcode: number
  IDClassefication: number
  UnitID: number
  Qty: number
  Price: number
  TotalPrice: number
  PriceType: number
  // إضافة حقول إضافية للعرض
  ProductName: string
  CategoryName: string
  // حقول اختيار اللون والمقاس (جديدة)
  SelectedColor?: string
  SelectedSize?: string
  SelectedFitting?: string
  SelectedImageURL?: string
}

export default function OfferByProductsFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<OfferByProducts>({
    id: "",
    ID: "",
    Code: "",
    Name: "",
    ShortDiscription: "",
    LongDescription: "",
    IsActive: false,
    IsBindShop: false,
    IsBindShopMaster: false,
    ImageName: "",
    ImageURL: "",
    TotalValue: 0,
    TotalValueAfterOffer: 0,
    ProductsCount: 0,
    DefaultSalesCommission: 0
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const [productDetails, setProductDetails] = useState<OfferProductDetail[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedPriceType, setSelectedPriceType] = useState<number>(1)
  const [quantity, setQuantity] = useState<number>(1)
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [maxDetailId, setMaxDetailId] = useState<number>(0)
  const [editingDetail, setEditingDetail] = useState<OfferProductDetail | null>(null)
  const [editQty, setEditQty] = useState<string>("")
  const [editPrice, setEditPrice] = useState<string>("")
  const [editPriceType, setEditPriceType] = useState<string>("1")
  const [defaultBranch, setDefaultBranch] = useState<any>(null)
  // حالات الألوان والمقاسات وأسعار المتغيرات
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [colorSizeToPrice, setColorSizeToPrice] = useState<Record<string, number>>({})
  const [loadingVariants, setLoadingVariants] = useState(false)
  // كاش لبدائل كل منتج داخل الجدول
  const [variantsCache, setVariantsCache] = useState<Record<number, { colors: string[]; sizes: string[]; priceMap: Record<string, number> }>>({})
  // إجمالي عدد الوحدات من كميات الصفوف
  const productsCountComputed = productDetails.reduce((sum, d) => sum + (Number(d.Qty) || 0), 0)

  // جلب الفرع الافتراضي (IsBindShop = true)
  useEffect(() => {
    const fetchDefaultBranch = async () => {
      try {
        const branchesCollection = collection(db, "Def_CompanyStructure")
        const branchesQuery = query(branchesCollection, where("IsBindShop", "==", true))
        const branchesSnapshot = await getDocs(branchesQuery)
        
        if (!branchesSnapshot.empty) {
          const branchData = branchesSnapshot.docs[0].data()
          setDefaultBranch({
            id: branchesSnapshot.docs[0].id,
            ID: branchData.ID || branchesSnapshot.docs[0].id,
            Name: branchData.Name || '',
            Code: branchData.Code || ''
          })
        }
      } catch (error) {
        console.error("Error fetching default branch:", error)
      }
    }

    fetchDefaultBranch()
  }, [])

  // تحميل الأصناف
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "Def_ProductStructure")
        const productsSnapshot = await getDocs(productsCollection)
        
        if (!productsSnapshot.empty) {
          const productsData = productsSnapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              BarCode: data.BarCode?.toString() || '',
              Name: data.Name || '',
              Category: data.IDCategory?.toString() || '',
              CategoryName: data.CategoryName || '',
              UnitName: data.UnitName || '',
              PurchasePrice: data.UnitSmall_PurchasePrice || 0,
              SalesPrice1: data.UnitSmall_Sales1 || 0,
              SalesPrice2: data.UnitSmall_Sales2 || 0,
              SalesPrice3: data.UnitSmall_Sales3 || 0,
              SalesPrice4: data.UnitSmall_Sales4 || 0,
              SalesPrice5: data.UnitSmall_Sales5 || 0
            }
          })
          setAllProducts(productsData)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        notify.error("حدث خطأ أثناء تحميل الأصناف")
      }
    }

    fetchProducts()
  }, [])

  // تحميل الألوان والمقاسات وأسعار المتغيرات عند اختيار صنف
  useEffect(() => {
    const loadVariants = async () => {
      if (!selectedProduct) return
      try {
        setLoadingVariants(true)
        setAvailableColors([])
        setAvailableSizes([])
        setSelectedColor("")
        setSelectedSize("")
        setColorSizeToPrice({})

        const variantsCol = collection(db, "Def_ProductStructure", String(selectedProduct.id), "Variants")
        const snap = await getDocs(variantsCol)
        const colorsSet = new Set<string>()
        const sizesSet = new Set<string>()
        const priceMap: Record<string, number> = {}

        snap.docs.forEach(d => {
          const v: any = d.data()
          const c = String(v?.Color?.Name || '').trim()
          const s = String(v?.Size?.Name || '').trim()
          if (c) colorsSet.add(c)
          if (s) sizesSet.add(s)
          const priceNum = Number(v?.Price) || 0
          if (c && s && priceNum > 0) priceMap[`${c}__${s}`] = priceNum
        })

        const colors = Array.from(colorsSet)
        const sizes = Array.from(sizesSet)

        setAvailableColors(colors)
        setAvailableSizes(sizes)
        setColorSizeToPrice(priceMap)
        if (colors.length) setSelectedColor(colors[0])
        if (sizes.length) setSelectedSize(sizes[0])
      } catch (e) {
        // في حال عدم وجود Variants نترك القوائم فارغة (سيتعامل مع الأسعار الافتراضية)
      } finally {
        setLoadingVariants(false)
      }
    }

    loadVariants()
  }, [selectedProduct])

  // تحميل بدائل المنتجات الظاهرة بالجدول (كاش)
  useEffect(() => {
    const loadMissingVariants = async () => {
      const uniqueProductIds = Array.from(new Set(productDetails.map(d => d.IDProduct)))
      const missing = uniqueProductIds.filter(pid => !variantsCache[pid])
      if (missing.length === 0) return
      const newCache: Record<number, { colors: string[]; sizes: string[]; priceMap: Record<string, number> }> = {}
      await Promise.all(missing.map(async (pid) => {
        try {
          const variantsCol = collection(db, "Def_ProductStructure", String(pid), "Variants")
          const snap = await getDocs(variantsCol)
          const colorsSet = new Set<string>()
          const sizesSet = new Set<string>()
          const priceMap: Record<string, number> = {}
          snap.docs.forEach(d => {
            const v: any = d.data()
            const c = String(v?.Color?.Name || '').trim()
            const s = String(v?.Size?.Name || '').trim()
            if (c) colorsSet.add(c)
            if (s) sizesSet.add(s)
            const priceNum = Number(v?.Price) || 0
            if (c && s && priceNum > 0) priceMap[`${c}__${s}`] = priceNum
          })
          newCache[pid] = { colors: Array.from(colorsSet), sizes: Array.from(sizesSet), priceMap }
        } catch {}
      }))
      if (Object.keys(newCache).length > 0) setVariantsCache(prev => ({ ...prev, ...newCache }))
    }
    loadMissingVariants()
  }, [productDetails])

  const handleDetailVariantChange = (detail: OfferProductDetail, newColor?: string, newSize?: string) => {
    const color = newColor !== undefined ? newColor : (detail.SelectedColor || '')
    const size = newSize !== undefined ? newSize : (detail.SelectedSize || '')
    let price = detail.Price
    const cache = variantsCache[detail.IDProduct]
    if (cache && color && size) {
      const key = `${color}__${size}`
      const variantPrice = cache.priceMap[key]
      if (variantPrice && variantPrice > 0) price = variantPrice
    }
    const updatedDetail: OfferProductDetail = {
      ...detail,
      SelectedColor: color || undefined,
      SelectedSize: size || undefined,
      Price: price,
      PriceType: (cache && cache.priceMap && Object.keys(cache.priceMap).length > 0) ? 0 : (detail.PriceType || 1),
      TotalPrice: price * detail.Qty,
    }
    const newDetails = productDetails.map(d => d.id === detail.id ? updatedDetail : d)
    setProductDetails(newDetails)
    const totalValue = newDetails.reduce((sum, p) => sum + p.TotalPrice, 0)
    // تحديث ProductsCount تلقائياً من مجموع الكميات
    const newProductsCount = newDetails.reduce((sum, p) => sum + (Number(p.Qty) || 0), 0)
    setFormData(prev => ({ ...prev, TotalValue: totalValue, TotalValueAfterOffer: totalValue, ProductsCount: newProductsCount }))
  }

  const handleDetailQtyChange = (detail: OfferProductDetail, qtyValue: string) => {
    const qtyNum = Math.max(0, Number(convertToEnglishNumbers(qtyValue)) || 0)
    const price = detail.Price || 0
    const updatedDetail: OfferProductDetail = {
      ...detail,
      Qty: qtyNum,
      TotalPrice: price * qtyNum,
    }
    const newDetails = productDetails.map(d => d.id === detail.id ? updatedDetail : d)
    setProductDetails(newDetails)
    const totalValue = newDetails.reduce((sum, p) => sum + p.TotalPrice, 0)
    setFormData(prev => ({ ...prev, TotalValue: totalValue, TotalValueAfterOffer: totalValue }))
  }

  const handleAddProduct = async () => {
    if (!selectedProduct) return

    try {
      // جلب بيانات الصنف المحدثة
      const productDoc = await getDoc(doc(collection(db, "Def_ProductStructure"), selectedProduct.id))
      const productData = productDoc.data()

      // تحديد السعر: إذا وُجد سعر للون/المقاس المختار نستخدمه، وإلا نستخدم سعر 1 الافتراضي
      let price = selectedProduct.SalesPrice1 || 0
      if (selectedColor && selectedSize) {
        const key = `${selectedColor}__${selectedSize}`
        const variantPrice = colorSizeToPrice[key]
        if (variantPrice && variantPrice > 0) price = variantPrice
      }
      const newDetail: OfferProductDetail = {
        id: Date.now().toString(),
        ID: maxDetailId + 1,
        IDOfferByProducts: parseInt(formData.ID),
        IDProduct: parseInt(selectedProduct.id),
        Barcode: parseInt(selectedProduct.BarCode),
        IDClassefication: parseInt(selectedProduct.Category),
        UnitID: 1, // يمكن تحديثه لاحقاً حسب احتياجات العمل
        Qty: quantity,
        Price: price,
        TotalPrice: price * quantity,
        PriceType: (selectedColor && selectedSize && colorSizeToPrice && Object.keys(colorSizeToPrice).length > 0) ? 0 : 1,
        ProductName: productData?.Name || selectedProduct.Name,
        CategoryName: productData?.CategoryName || selectedProduct.CategoryName,
        SelectedColor: selectedColor || undefined,
        SelectedSize: selectedSize || undefined
      }

      setProductDetails(prev => [...prev, newDetail])
      setMaxDetailId(prev => prev + 1)
      setSelectedProduct(null)
      setAvailableColors([])
      setAvailableSizes([])
      setSelectedColor("")
      setSelectedSize("")
      setQuantity(1)
      setOpen(false)

      // تحديث إجماليات العرض
      const totalValue = productDetails.reduce((sum, p) => sum + p.TotalPrice, 0) + newDetail.TotalPrice
      const totalValueAfterOffer = totalValue // يمكن تعديله حسب آلية احتساب الخصم
      const newProductsCount = productDetails.reduce((sum, p) => sum + (Number(p.Qty) || 0), 0) + newDetail.Qty

      setFormData(prev => ({
        ...prev,
        TotalValue: totalValue,
        TotalValueAfterOffer: totalValueAfterOffer,
        ProductsCount: newProductsCount
      }))
    } catch (error) {
      console.error("Error adding product:", error)
      notify.error("حدث خطأ أثناء إضافة الصنف")
    }
  }

  const handleEditDetail = (detail: OfferProductDetail) => {
    setEditingDetail(detail)
    setEditQty(detail.Qty.toString())
    setEditPriceType(detail.PriceType.toString())
    setEditPrice(detail.Price.toString())
  }

  const handlePriceTypeChange = async (value: string, detail: OfferProductDetail) => {
    try {
      const productDoc = await getDoc(doc(collection(db, "Def_ProductStructure"), detail.IDProduct.toString()))
      const productData = productDoc.data()
      if (productData) {
        const newPrice = productData[`UnitSmall_Sales${value}`] || 0
        const qty = detail.Qty
        const totalPrice = qty * newPrice

        const updatedDetail: OfferProductDetail = {
          ...detail,
          Price: newPrice,
          PriceType: parseInt(value),
          TotalPrice: totalPrice
        }

        setProductDetails(prev => prev.map(p => 
          p.id === detail.id ? updatedDetail : p
        ))

        // تحديث إجماليات العرض
        const totalValue = productDetails
          .map(p => p.id === detail.id ? updatedDetail : p)
          .reduce((sum, p) => sum + p.TotalPrice, 0)
        
        setFormData(prev => ({
          ...prev,
          TotalValue: totalValue,
          TotalValueAfterOffer: totalValue
        }))

        setEditPriceType(value)
      }
    } catch (error) {
      console.error("Error fetching product price:", error)
      notify.error("حدث خطأ أثناء جلب سعر الصنف")
    }
  }

  const handleSaveEdit = () => {
    if (!editingDetail) return

    const qty = Number(convertToEnglishNumbers(editQty))
    const price = Number(convertToEnglishNumbers(editPrice))

    const updatedDetail: OfferProductDetail = {
      ...editingDetail,
      Qty: qty,
      Price: price,
      PriceType: parseInt(editPriceType),
      TotalPrice: qty * price
    }

    setProductDetails(prev => prev.map(p => 
      p.id === editingDetail.id ? updatedDetail : p
    ))

    // تحديث إجماليات العرض
    const totalValue = productDetails
      .map(p => p.id === editingDetail.id ? updatedDetail : p)
      .reduce((sum, p) => sum + p.TotalPrice, 0)
    
    setFormData(prev => ({
      ...prev,
      TotalValue: totalValue,
      TotalValueAfterOffer: totalValue // يمكن تعديله حسب آلية احتساب الخصم
    }))

    setEditingDetail(null)
    setEditQty("")
    setEditPrice("")
    setEditPriceType("1")
  }

  const handleRemoveProduct = (productId: string) => {
    const detailToRemove = productDetails.find(p => p.id === productId)
    if (!detailToRemove) return

    setProductDetails(prev => prev.filter(p => p.id !== productId))

    // تحديث إجماليات العرض
    const remainingDetails = productDetails.filter(p => p.id !== productId)
    const totalValue = remainingDetails.reduce((sum, p) => sum + p.TotalPrice, 0)
    const totalValueAfterOffer = totalValue // يمكن تعديله حسب آلية احتساب الخصم
    const newProductsCount = remainingDetails.reduce((sum, p) => sum + (Number(p.Qty) || 0), 0)

    setFormData(prev => ({
      ...prev,
      TotalValue: totalValue,
      TotalValueAfterOffer: totalValueAfterOffer,
      ProductsCount: newProductsCount
    }))
  }

  useEffect(() => {
    const initializeForm = async () => {
      if (id) {
        try {
          const docRef = doc(db, "Def_OffersByProducts", id)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            const data = docSnap.data()
            const formattedData = {
              id: docSnap.id,
              ID: data.ID?.toString() || '',
              Code: data.Code?.toString() || '',
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
            setFormData(formattedData)
            if (formattedData.ImageURL) {
              setImagePreview(formattedData.ImageURL)
            }

                        // تحميل تفاصيل المنتجات من الـ subcollection
      const offerDoc = doc(db, "Def_OffersByProducts", id)
      const detailsCollection = collection(offerDoc, "Def_OffersByProductsDetails")
      const detailsSnapshot = await getDocs(detailsCollection)

      if (!detailsSnapshot.empty) {
        // تحميل بيانات الأصناف
        const productsCollection = collection(db, "Def_ProductStructure")
        const details = await Promise.all(detailsSnapshot.docs.map(async docSnapshot => {
          const data = docSnapshot.data()
          
          // جلب بيانات الصنف
          const productDoc = await getDoc(doc(productsCollection, data.IDProduct.toString()))
          const productData = productDoc.data()
          
          return {
            id: data.ID.toString(),
            ID: data.ID,
            IDOfferByProducts: data.IDOfferByProducts,
            IDProduct: data.IDProduct,
            Barcode: data.Barcode,
            IDClassefication: data.IDClassefication,
            UnitID: data.UnitID,
            Qty: data.Qty,
            Price: data.Price,
            TotalPrice: data.TotalPrice,
            PriceType: data.PriceType,
            ProductName: productData?.Name || '',
            CategoryName: productData?.CategoryName || '',
            SelectedColor: data.SelectedColor || '',
            SelectedSize: data.SelectedSize || ''
          }
        }))
              setProductDetails(details)
              setMaxDetailId(Math.max(...details.map(d => d.ID)))
            }
          }
        } catch (error) {
          console.error("Error fetching offer:", error)
          notify.error("حدث خطأ أثناء جلب بيانات العرض")
        }
      } else {
        try {
          const itemsCollection = collection(db, "Def_OffersByProducts")
          const itemsSnapshot = await getDocs(itemsCollection)
          
          let maxId = 0
          let maxCode = 0
          
          itemsSnapshot.docs.forEach(doc => {
            const data = doc.data()
            const docId = parseInt(doc.id)
            const code = parseInt(data.Code) || 0
            if (docId > maxId) maxId = docId
            if (code > maxCode) maxCode = code
          })

          setFormData(prev => ({
            ...prev,
            id: String(maxId + 1),
            ID: String(maxId + 1),
            Code: String(maxCode + 1)
          }))
        } catch (error) {
          console.error("Error getting max ID/Code:", error)
          notify.error("حدث خطأ أثناء تحضير النموذج")
        }
      }
    }

    initializeForm()
  }, [id])

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageDelete = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setFormData(prev => ({
      ...prev,
      ImageName: "",
      ImageURL: ""
    }))
  }

  const uploadImage = async (file: File, offerId: string) => {
    try {
      if (formData.ImageName) {
        try {
          const oldImageRef = ref(storage, `Application/Def_OffersByProducts/${offerId}/${formData.ImageName}`)
          await deleteObject(oldImageRef)
        } catch (error) {
          console.log("No old image to delete or error:", error)
        }
      }

      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${timestamp}.${fileExtension}`
      
      const storageRef = ref(storage, `Application/Def_OffersByProducts/${offerId}/${uniqueFileName}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      return {
        imageName: uniqueFileName,
        imageURL: downloadURL
      }
    } catch (error) {
      throw error
    }
  }

  const handleSubmit = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.Name || formData.Name.trim() === '') {
        alert("يرجى إدخال اسم العرض")
        return
      }
      
      if (!formData.Code || formData.Code.trim() === '') {
        alert("يرجى إدخال كود العرض")
        return
      }

      const numericCode = parseInt(formData.Code)
      if (isNaN(numericCode) || numericCode <= 0) {
        alert("يرجى إدخال كود صحيح (رقم أكبر من صفر)")
        return
      }

      // التحقق من عدم تكرار الكود
      const isCodeValid = await validateCodeWithMessage(
        DEFINITION_COLLECTIONS.offersByProducts,
        numericCode,
        id || undefined
      )
      
      if (!isCodeValid) {
        return
      }

      setIsUploading(true)
      let imageData = {
        imageName: formData.ImageName,
        imageURL: formData.ImageURL
      }

      if (selectedImage) {
        imageData = await uploadImage(selectedImage, formData.id)
      }

      const docRef = doc(db, "Def_OffersByProducts", formData.id)
      const dataToSave = {
        ID: parseInt(formData.ID),
        Code: numericCode,
        Name: formData.Name.trim(),
        ShortDiscription: formData.ShortDiscription.trim(),
        LongDescription: formData.LongDescription.trim(),
        ImageName: imageData.imageName,
        ImageURL: imageData.imageURL,
        TotalValue: Number(formData.TotalValue),
        TotalValueAfterOffer: Number(formData.TotalValueAfterOffer),
        ProductsCount: Number(formData.ProductsCount),
        DefaultSalesCommission: Number(formData.DefaultSalesCommission),
        IsActive: formData.IsActive,
        IsBindShop: formData.IsBindShop,
        IsBindShopMaster: formData.IsBindShopMaster,
        IDBranch: defaultBranch?.ID || ''
      }

      // استخدام batch لكتابة المستند الرئيسي والتفاصيل بشكل ذري
      const batch = writeBatch(db)

      if (id) {
        // تحديث
        batch.update(docRef, dataToSave)
      } else {
        // إضافة جديدة
        batch.set(docRef, dataToSave)
      }

      // حفظ تفاصيل المنتجات كـ subcollection
      const offerDoc = doc(db, "Def_OffersByProducts", formData.id)
      const detailsCollection = collection(offerDoc, "Def_OffersByProductsDetails")

      // حذف التفاصيل القديمة إذا كان تحديثاً
      if (id) {
        const oldDetailsSnapshot = await getDocs(detailsCollection)
        for (const d of oldDetailsSnapshot.docs) {
          batch.delete(d.ref)
        }
      }

      // إضافة التفاصيل الجديدة
      const offerNumericId = parseInt(formData.ID)
      for (const detail of productDetails) {
        const detailDocRef = doc(detailsCollection, detail.ID.toString())
        batch.set(detailDocRef, {
          ID: detail.ID,
          IDOfferByProducts: offerNumericId,
          IDProduct: detail.IDProduct,
          Barcode: detail.Barcode,
          IDClassefication: detail.IDClassefication,
          UnitID: detail.UnitID,
          Qty: detail.Qty,
          Price: detail.Price,
          TotalPrice: detail.TotalPrice,
          PriceType: detail.PriceType,
          SelectedColor: detail.SelectedColor || '',
          SelectedSize: detail.SelectedSize || ''
        })
      }

      await batch.commit()

      notify.success(id ? "تم تحديث العرض بنجاح" : "تم إضافة العرض بنجاح")
      router.push("/admin/definitions/OffersByProducts?refresh=true")
    } catch (error) {
      console.error("Error saving offer:", error)
      notify.error("حدث خطأ أثناء حفظ العرض")
    } finally {
      setIsUploading(false)
    }
  }

  const actionButtons = [
    { 
      label: "حفظ", 
      icon: Save, 
      onClick: handleSubmit 
    },
    { 
      label: "طباعة", 
      icon: Printer, 
      onClick: () => {},
      variant: "outline" as const
    },
    { 
      label: "إغلاق", 
      icon: X, 
      onClick: () => router.back(),
      variant: "outline" as const
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader 
        title="بيانات عرض المنتجات"
        actionButtons={actionButtons} 
      />
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              {/* تم نقل التشيكات أسفل الاسم */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="code">الكود</Label>
                    <Input
                      id="code"
                      value={formData.Code}
                      onChange={(e) => setFormData({ ...formData, Code: e.target.value })}
                      className="w-40"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      value={formData.Name}
                      onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isActive"
                        checked={formData.IsActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, IsActive: checked as boolean })}
                      />
                      <Label htmlFor="isActive">نشط</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isBindShop"
                        checked={formData.IsBindShop}
                        onCheckedChange={(checked) => setFormData({ ...formData, IsBindShop: checked as boolean })}
                      />
                      <Label htmlFor="isBindShop">مرتبط بمتجر</Label>
                    </div>
                  </div>
                </div>

                

                

                {/* الوصف والصورة جنباً إلى جنب */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shortDiscription">الوصف المختصر</Label>
                      <Textarea
                        id="shortDiscription"
                        value={formData.ShortDiscription}
                        onChange={(e) => setFormData({ ...formData, ShortDiscription: e.target.value })}
                        rows={3}
                        className="max-w-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longDescription">الوصف التفصيلي</Label>
                      <Textarea
                        id="longDescription"
                        value={formData.LongDescription}
                        onChange={(e) => setFormData({ ...formData, LongDescription: e.target.value })}
                        rows={3}
                        className="max-w-md"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>صورة العرض</Label>
                    <div className="mt-2 flex flex-col items-center gap-4">
                      <div className="relative w-56 h-56">
                        {imagePreview ? (
                          <Image
                            src={imagePreview}
                            alt="Offer preview"
                            fill
                            className="object-contain rounded-lg border"
                          />
                        ) : (
                          <div className="w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <ImageIcon className="h-16 w-16" />
                            <p>لا توجد صورة</p>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageSelect(file)
                          }
                        }}
                      />

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <Upload className="h-4 w-4 ml-2" />
                          اختيار صورة
                        </Button>

                        {imagePreview && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={handleImageDelete}
                            disabled={isUploading}
                          >
                            <Trash className="h-4 w-4 ml-2" />
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">


                <div className="flex gap-4">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[300px] justify-between"
                      >
                        {selectedProduct ? `${selectedProduct.BarCode} - ${selectedProduct.Name}` : "اختر الصنف..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="ابحث عن صنف..." value={searchValue} onValueChange={setSearchValue} />
                        <CommandEmpty>لا توجد نتائج</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {allProducts.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={`${product.BarCode}-${product.Name}`}
                              onSelect={() => {
                                setSelectedProduct(product)
                                setOpen(false)
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"}`}
                              />
                              <span dir="ltr">{product.BarCode}</span>
                              <span className="mx-1">-</span>
                              <span>{product.Name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {selectedProduct && (
                    <>
                      {loadingVariants ? (
                        <div className="px-2 py-2 text-sm text-muted-foreground">جاري تحميل ألوان/مقاسات الصنف...</div>
                      ) : (
                        <>
                          {availableColors.length > 0 && (
                            <Select value={selectedColor} onValueChange={setSelectedColor}>
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="اللون" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableColors.map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {availableSizes.length > 0 && (
                            <Select value={selectedSize} onValueChange={setSelectedSize}>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="المقاس" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSizes.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      )}

                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-[100px]"
                        min={1}
                        placeholder="الكمية"
                      />

                      <Button onClick={handleAddProduct}>
                        إضافة
                      </Button>
                    </>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px] text-center">حذف</TableHead>
                        <TableHead className="text-center">الباركود</TableHead>
                        <TableHead className="text-right">الصنف</TableHead>
                        <TableHead className="text-center">اللون</TableHead>
                        <TableHead className="text-center">المقاس</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-left">السعر</TableHead>
                        <TableHead className="text-left">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productDetails.map((detail) => (
                        <TableRow key={detail.id}>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveProduct(detail.id)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-center" dir="ltr">{detail.Barcode}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col">
                              <span>{detail.ProductName}</span>
                              <span className="text-xs text-muted-foreground" dir="ltr">{detail.Barcode}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {variantsCache[detail.IDProduct]?.colors?.length ? (
                              <Select value={detail.SelectedColor || ''} onValueChange={(val) => handleDetailVariantChange(detail, val, undefined)}>
                                <SelectTrigger className="w-[130px] mx-auto">
                                  <SelectValue placeholder="اللون" />
                                </SelectTrigger>
                                <SelectContent>
                                  {variantsCache[detail.IDProduct].colors.map(c => (
                                    <SelectItem key={`${detail.ID}-${c}`} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {variantsCache[detail.IDProduct]?.sizes?.length ? (
                              <Select value={detail.SelectedSize || ''} onValueChange={(val) => handleDetailVariantChange(detail, undefined, val)}>
                                <SelectTrigger className="w-[120px] mx-auto">
                                  <SelectValue placeholder="المقاس" />
                                </SelectTrigger>
                                <SelectContent>
                                  {variantsCache[detail.IDProduct].sizes.map(s => (
                                    <SelectItem key={`${detail.ID}-${s}`} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              value={detail.Qty}
                              onChange={(e) => handleDetailQtyChange(detail, e.target.value)}
                              className="w-20 text-center mx-auto"
                              min={0}
                            />
                          </TableCell>
                          
                          <TableCell className="text-left" dir="ltr">
                            {editingDetail?.id === detail.id ? (
                              <Input
                                type="text"
                                value={Number(editPrice)}
                                readOnly
                                className="w-24 text-left bg-muted"
                                dir="ltr"
                              />
                            ) : (
                              <Input
                                type="text"
                                value={(detail.Price ?? (detail.TotalPrice / Math.max(1, detail.Qty))) as number}
                                readOnly
                                className="w-24 text-left bg-muted"
                                dir="ltr"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-left" dir="ltr">
                            {detail.TotalPrice}
                          </TableCell>
                        </TableRow>
                      ))}
                      {productDetails.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            لا توجد أصناف مضافة للعرض
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                  <div className="text-sm text-muted-foreground">
                    العدد: {productsCountComputed}
                  </div>
                  <div>
                    <Label htmlFor="productsCount">عدد المنتجات</Label>
                    <Input
                      id="productsCount"
                      type="text"
                      value={productsCountComputed}
                      readOnly
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label>الإجمالي قبل العرض</Label>
                    <Input
                      type="text"
                      value={formData.TotalValue}
                      readOnly
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalValueAfterOffer">الإجمالي بعد العرض</Label>
                    <Input
                      id="totalValueAfterOffer"
                      type="number"
                      value={formData.TotalValueAfterOffer}
                      onChange={(e) => setFormData({ ...formData, TotalValueAfterOffer: Number(e.target.value) })}
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultSalesCommission">عمولة المندوب</Label>
                    <Input
                      id="defaultSalesCommission"
                      type="number"
                      value={formData.DefaultSalesCommission}
                      onChange={(e) => setFormData({ ...formData, DefaultSalesCommission: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}