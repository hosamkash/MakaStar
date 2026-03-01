"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X, Save, Upload, Download, Trash } from "lucide-react"
import Image from "next/image"
import PageHeader from "@/components/page-header"

type Category = {
  ID: number
  Code: number
  Name: string
  IsActive: boolean
  IsSalesCategory: boolean
  IsViewAllProducts: boolean
  IsBindShop: boolean
  IsBindShopMaster: boolean
  ImageName: string
  ImageURL: string
  ShortName: string
  IsSelected: boolean
}

export default function CategoryFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const data = searchParams.get("data")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState<Category>({
    ID: 0,
    Code: 0,
    Name: "",
    IsActive: true,
    IsSalesCategory: false,
    IsViewAllProducts: false,
    IsBindShop: false,
    IsBindShopMaster: false,
    ImageName: "",
    ImageURL: "",
    ShortName: "",
    IsSelected: false
  })

  useEffect(() => {
    const initializeForm = async () => {
      if (id && data) {
        // Edit mode - use passed data
        const parsedData = JSON.parse(data)
        console.log("Editing category with data:", parsedData)
        
        // التأكد من وجود جميع الحقول المطلوبة
        const categoryData: Category = {
          ID: Number(parsedData.ID) || parseInt(id),
          Code: Number(parsedData.Code) || 0,
          Name: parsedData.Name || "",
          IsActive: parsedData.IsActive ?? true,
          IsSalesCategory: parsedData.IsSalesCategory ?? false,
          IsViewAllProducts: parsedData.IsViewAllProducts ?? false,
          IsBindShop: parsedData.IsBindShop ?? false,
          IsBindShopMaster: parsedData.IsBindShopMaster ?? false,
          ImageName: parsedData.ImageName || "",
          ImageURL: parsedData.ImageURL || "",
          ShortName: parsedData.ShortName || "",
          IsSelected: parsedData.IsSelected ?? false
        }
        
        setFormData(categoryData)
        if (categoryData.ImageURL) {
          setImagePreview(categoryData.ImageURL)
        }
      } else {
        // Add mode - get next ID and Code
        try {
          const categoriesCollection = collection(db, "Def_Categories")
          const categoriesSnapshot = await getDocs(categoriesCollection)
          
          let maxId = 0
          let maxCode = 0
          
          categoriesSnapshot.docs.forEach(doc => {
            const docId = parseInt(doc.id)
            const data = doc.data()
            // التحقق من ID في البيانات أيضاً - تأكيد أنها أرقام
            const dataId = Number(data.ID) || docId
            const dataCode = Number(data.Code) || 0
            
            if (dataId > maxId) maxId = dataId
            if (dataCode > maxCode) maxCode = dataCode
          })

          console.log("Max ID found:", maxId, "Max Code found:", maxCode)

          setFormData(prev => ({
            ...prev,
            ID: maxId + 1,
            Code: maxCode + 1
          }))
        } catch (error) {
          console.error("Error getting max ID/Code:", error)
          alert("حدث خطأ أثناء تحضير النموذج. الرجاء المحاولة مرة أخرى.")
        }
      }
    }

    initializeForm()
  }, [id, data])

  const handleImageSelect = (file: File) => {
    setSelectedFile(file)
    const imageUrl = URL.createObjectURL(file)
    setImagePreview(imageUrl)
  }

  const handleImageDelete = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setFormData(prev => ({
      ...prev,
      ImageName: "",
      ImageURL: ""
    }))
  }

  const uploadImage = async () => {
    if (!selectedFile || !storage) return null

    try {
      setIsUploading(true)
      
      // Generate unique filename
      const timestamp = Date.now()
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')
      const uniqueFileName = `${timestamp}_${safeFileName}`
      
      // Create storage reference and upload
      // Place image under category ID folder to match storage rules
      const filePath = `Application/Def_Categories/${Number(formData.ID) || parseInt(String(formData.ID))}/${uniqueFileName}`
      console.log("Uploading to path:", filePath)
      
      const storageRef = ref(storage, filePath)
      console.log("Storage reference created")
      
      const uploadResult = await uploadBytes(storageRef, selectedFile)
      console.log("Upload successful")
      
      const downloadURL = await getDownloadURL(uploadResult.ref)
      console.log("Got download URL:", downloadURL)
      
      return {
        name: uniqueFileName,
        url: downloadURL
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.Name || formData.Name.trim() === '') {
        alert("يرجى إدخال اسم التصنيف")
        return
      }
      
      // التأكد من أن ID و Code أرقام صحيحة
      const categoryId = Number(formData.ID)
      const categoryCode = Number(formData.Code)
      
      if (isNaN(categoryId) || categoryId <= 0) {
        alert("خطأ في معرف التصنيف - يجب أن يكون رقماً صحيحاً أكبر من صفر")
        return
      }
      
      if (isNaN(categoryCode) || categoryCode <= 0) {
        alert("يرجى إدخال كود صحيح للتصنيف - يجب أن يكون رقماً صحيحاً أكبر من صفر")
        return
      }

      // التحقق من عدم تكرار الكود
      const categoriesCollection = collection(db, "Def_Categories")
      const categoriesSnapshot = await getDocs(categoriesCollection)
      
      const existingCategory = categoriesSnapshot.docs.find(doc => {
        const data = doc.data()
        return Number(data.Code) === categoryCode && doc.id !== String(categoryId)
      })
      
      if (existingCategory) {
        alert("الكود مستخدم بالفعل. يرجى اختيار كود آخر")
        return
      }

      let imageData = null
      
      if (selectedFile) {
        try {
          imageData = await uploadImage()
        } catch (error) {
          alert("حدث خطأ أثناء رفع الصورة. هل تريد المتابعة بدون صورة؟")
          if (!confirm("حفظ بدون صورة؟")) {
            return
          }
        }
      }

      const docRef = doc(db, "Def_Categories", String(categoryId))
      await setDoc(docRef, {
        ID: categoryId,
        Code: categoryCode,
        Name: formData.Name,
        IsActive: formData.IsActive,
        IsSalesCategory: formData.IsSalesCategory,
        IsViewAllProducts: formData.IsViewAllProducts,
        IsBindShop: formData.IsBindShop,
        IsBindShopMaster: formData.IsBindShopMaster,
        ImageName: imageData ? imageData.name : formData.ImageName,
        ImageURL: imageData ? imageData.url : formData.ImageURL,
        ShortName: formData.ShortName,
        IsSelected: formData.IsSelected
      })

      console.log("Saving category with data:", {
        ID: categoryId,
        Code: categoryCode,
        Name: formData.Name,
        IsActive: formData.IsActive,
        IsSalesCategory: formData.IsSalesCategory,
        IsViewAllProducts: formData.IsViewAllProducts,
        IsBindShop: formData.IsBindShop,
        IsBindShopMaster: formData.IsBindShopMaster,
        ImageName: imageData ? imageData.name : formData.ImageName,
        ImageURL: imageData ? imageData.url : formData.ImageURL,
        ShortName: formData.ShortName,
        IsSelected: formData.IsSelected
      })

      alert(id ? "تم تحديث التصنيف بنجاح" : "تم إضافة التصنيف بنجاح")
      router.push("/admin/definitions/categories")
      router.refresh()
    } catch (error) {
      console.error("Error saving category:", error)
      alert("حدث خطأ أثناء حفظ التصنيف. الرجاء المحاولة مرة أخرى.")
    }
  }

  const actionButtons = [
    { 
      label: "حفظ", 
      icon: Save, 
      onClick: handleSubmit 
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
        title={id ? "تعديل تصنيف" : "إضافة تصنيف جديد"} 
        actionButtons={actionButtons} 
      />
      <form onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}>
      <Card>
          <CardHeader className="p-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id">المعرف</Label>
                  <Input
                    id="id"
                    type="number"
                    value={formData.ID}
                    disabled
                  />
            </div>
                <div>
                  <Label htmlFor="code">الكود</Label>
                  <Input
                    id="code"
                    type="number"
                    value={formData.Code}
                    onChange={(e) => setFormData({ ...formData, Code: Number(e.target.value) })}
                    required
                  />
            </div>
            </div>
              <div>
                <Label htmlFor="name">الإسم</Label>
                <Input
                  id="name"
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  required
                />
            </div>
              <div>
                <Label htmlFor="shortName">الإسم المختصر</Label>
                <Input
                  id="shortName"
                  value={formData.ShortName}
                  onChange={(e) => setFormData({ ...formData, ShortName: e.target.value })}
                />
          </div>

              <div className="border rounded-lg p-4">
                <Label className="mb-4 block">صورة التصنيف</Label>
                <div className="flex flex-col items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-48 h-48">
                      <Image
                        src={imagePreview}
                        alt="Category preview"
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">لا توجد صورة</span>
            </div>
                  )}
                  
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
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      اختيار صورة
                    </Button>
                    
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleImageDelete}
                      >
                        <Trash className="h-4 w-4 ml-2" />
                        حذف
                      </Button>
                    )}
            </div>
            </div>
          </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isActive"
                    checked={formData.IsActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsActive: checked as boolean })}
                  />
                  <Label htmlFor="isActive">نشط</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isSalesCategory"
                    checked={formData.IsSalesCategory}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsSalesCategory: checked as boolean })}
                  />
                  <Label htmlFor="isSalesCategory">يعرض في المبيعات</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isViewAllProducts"
                    checked={formData.IsViewAllProducts}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsViewAllProducts: checked as boolean })}
                  />
                  <Label htmlFor="isViewAllProducts">عرض كل المنتجات</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isBindShop"
                    checked={formData.IsBindShop}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsBindShop: checked as boolean })}
                  />
                  <Label htmlFor="isBindShop">مرتبط بمتجر</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isBindShopMaster"
                    checked={formData.IsBindShopMaster}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsBindShopMaster: checked as boolean })}
                  />
                  <Label htmlFor="isBindShopMaster">التصنيف الرئيسي للمتجر</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isSelected"
                    checked={formData.IsSelected}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsSelected: checked as boolean })}
                  />
                  <Label htmlFor="isSelected">محدد</Label>
                </div>
          </div>
          </div>
          </CardHeader>
      </Card>
      </form>
    </div>
  )
}
