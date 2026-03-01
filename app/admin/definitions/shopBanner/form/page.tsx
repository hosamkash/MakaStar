"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { validateCodeWithMessage, DEFINITION_COLLECTIONS } from '@/lib/utils/code-validation'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Save, Upload, Download, Trash, ArrowLeft, Plus, Image as ImageIcon, Printer } from "lucide-react"
import Image from "next/image"
import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"

type ShopBanner = {
  ID: number
  Code: number
  Name: string
  IsActive: boolean
  ShortDescription: string
  LongDescription: string
  ImageFolderPath: string
}

type GalleryImage = {
  name: string
  url: string
  file?: File
}

export default function ShopBannerFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const data = searchParams.get("data")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [existingImages, setExistingImages] = useState<GalleryImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingImages, setIsLoadingImages] = useState(false)

  const [formData, setFormData] = useState<ShopBanner>({
    ID: 0,
    Code: 0,
    Name: "",
    IsActive: true,
    ShortDescription: "",
    LongDescription: "",
    ImageFolderPath: ""
  })

  useEffect(() => {
    const initializeForm = async () => {
      if (id && data) {
        // Edit mode - use passed data
        const parsedData = JSON.parse(data)
        setFormData(parsedData)
        
        // Load existing images from Firebase Storage
        if (parsedData.ImageFolderPath) {
          await loadExistingImages(parsedData.ImageFolderPath)
        }
      } else {
        // Add mode - get next ID and Code
        try {
          const bannersCollection = collection(db, "Def_ShopBanner")
          const bannersSnapshot = await getDocs(bannersCollection)
          
          let maxId = 0
          let maxCode = 0
          
          bannersSnapshot.docs.forEach(doc => {
            const docId = parseInt(doc.id)
            const data = doc.data()
            if (docId > maxId) maxId = docId
            if (data.Code && data.Code > maxCode) maxCode = data.Code
          })

          setFormData(prev => ({
            ...prev,
            ID: maxId + 1,
            Code: maxCode + 1
          }))
        } catch (error) {
          console.error("Error getting max ID/Code:", error)
          notify.error("حدث خطأ أثناء تحضير النموذج. الرجاء المحاولة مرة أخرى.")
        }
      }
    }

    initializeForm()
  }, [id, data])

  const loadExistingImages = async (folderPath: string) => {
    if (!storage) return
    
    try {
      setIsLoadingImages(true)
      console.log("Loading images from:", folderPath)
      
      const folderRef = ref(storage, folderPath)
      const result = await listAll(folderRef)
      
      const images = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item)
          return {
            name: item.name,
            url: url
          }
        })
      )
      
      setExistingImages(images)
      console.log("Loaded existing images:", images)
    } catch (error) {
      console.error("Error loading existing images:", error)
      notify.error("حدث خطأ أثناء تحميل الصور الموجودة")
    } finally {
      setIsLoadingImages(false)
    }
  }

  const handleInputChange = (field: keyof ShopBanner, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return

    const newImages: GalleryImage[] = []
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file)
        newImages.push({
          name: file.name,
          url: imageUrl,
          file: file
        })
      }
    })

    setGalleryImages(prev => [...prev, ...newImages])
  }

  const handleImageDelete = (index: number) => {
    setGalleryImages(prev => {
      const newImages = [...prev]
      const deletedImage = newImages.splice(index, 1)[0]
      
      // Revoke object URL to free memory
      if (deletedImage.url.startsWith('blob:')) {
        URL.revokeObjectURL(deletedImage.url)
      }
      
      return newImages
    })
  }

  const handleExistingImageDelete = async (imageName: string) => {
    if (!storage || !formData.ImageFolderPath) return

    try {
      const imageRef = ref(storage, `${formData.ImageFolderPath}/${imageName}`)
      await deleteObject(imageRef)

      setExistingImages(prev => prev.filter(img => img.name !== imageName))
      notify.success("تم حذف الصورة بنجاح")
    } catch (error) {
      console.error("Error deleting image:", error)
        notify.error("حدث خطأ أثناء حذف الصورة")
    }
  }

  const uploadImages = async () => {
    if (galleryImages.length === 0) return []

    try {
      setIsUploading(true)
      const folderPath = `Application/Def_ShopBanner/${formData.ID}`
      const uploadedImages: GalleryImage[] = []

      for (const image of galleryImages) {
        if (!image.file || !storage) continue

        // Generate unique filename
        const timestamp = Date.now()
        const safeFileName = image.file.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const uniqueFileName = `${timestamp}_${safeFileName}`
        
        const filePath = `${folderPath}/${uniqueFileName}`
        console.log("Uploading to path:", filePath)
        
        const storageRef = ref(storage, filePath)
        const uploadResult = await uploadBytes(storageRef, image.file)
        const downloadURL = await getDownloadURL(uploadResult.ref)
        
        uploadedImages.push({
          name: uniqueFileName,
          url: downloadURL
        })
        
        console.log("Uploaded:", uniqueFileName)
      }

      return uploadedImages
    } catch (error) {
      console.error("Error uploading images:", error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSaving(true)

      // Validate required fields
      if (!formData.Name.trim()) {
        alert("يرجى إدخال اسم البانر")
        return
      }

      if (!formData.ShortDescription.trim()) {
        alert("يرجى إدخال الوصف القصير")
        return
      }

      if (!formData.Code || formData.Code <= 0) {
        alert("يرجى إدخال كود صحيح للبانر")
        return
      }

      // التحقق من صحة المعرف
      if (!formData.ID || formData.ID <= 0) {
        alert("يرجى إدخال معرف صحيح للبانر")
        return
      }

      // التحقق من عدم تكرار الكود
      const isCodeValid = await validateCodeWithMessage(
        DEFINITION_COLLECTIONS.shopBanner,
        formData.Code,
        id || undefined
      )
      
      if (!isCodeValid) {
        return
      }

      // Upload new images if any
      const folderPath = `Application/Def_ShopBanner/${formData.ID}`
      if (galleryImages.length > 0) {
        await uploadImages()
      }

      // Prepare data for saving
      const bannerData = {
        ID: formData.ID,
        Code: formData.Code,
        Name: formData.Name.trim(),
        IsActive: formData.IsActive,
        ShortDescription: formData.ShortDescription.trim(),
        LongDescription: formData.LongDescription.trim(),
        ImageFolderPath: folderPath
      }

      // Save to Firestore
      const docRef = doc(db, "Def_ShopBanner", String(formData.ID))
      
      if (id) {
        // تحديث
        await updateDoc(docRef, bannerData)
        notify.success("تم تحديث البانر بنجاح")
      } else {
        // إضافة جديدة
        await setDoc(docRef, bannerData)
        notify.success("تم إضافة البانر بنجاح")
      }
      router.push("/admin/definitions/shopBanner?refresh=true")

    } catch (error) {
      console.error("Error saving banner:", error)
      notify.error("حدث خطأ أثناء حفظ البانر. الرجاء المحاولة مرة أخرى.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Clean up object URLs
    galleryImages.forEach(image => {
      if (image.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url)
      }
    })
    router.push("/admin/definitions/shopBanner")
  }

  const totalImages = existingImages.length + galleryImages.length

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
        title="بيانات البانر"
        actionButtons={actionButtons} 
      />
      <form onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}>
        <Card>
          <CardHeader className="p-4">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isActive"
                    checked={formData.IsActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsActive: checked as boolean })}
                  />
                  <Label htmlFor="isActive">نشط</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">الكود</Label>
                  <Input
                    id="code"
                    type="number"
                    value={formData.Code}
                    onChange={(e) => setFormData({ ...formData, Code: parseInt(e.target.value) || 0 })}
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shortDescription">الوصف القصير</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.ShortDescription}
                    onChange={(e) => setFormData({ ...formData, ShortDescription: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="longDescription">الوصف الطويل</Label>
                  <Textarea
                    id="longDescription"
                    value={formData.LongDescription}
                    onChange={(e) => setFormData({ ...formData, LongDescription: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Gallery Upload Section */}
              <div>
                <Label className="text-sm font-medium">جاليري الصور</Label>
                <div className="mt-2 space-y-4">
                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">الصور الموجودة</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {existingImages.map((image, index) => (
                          <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={image.url}
                              alt={image.name}
                              fill
                              className="object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 w-6 h-6"
                              onClick={() => handleExistingImageDelete(image.name)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images */}
                  {galleryImages.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">الصور الجديدة</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {galleryImages.map((image, index) => (
                          <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={image.url}
                              alt={image.name}
                              fill
                              className="object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 w-6 h-6"
                              onClick={() => handleImageDelete(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isLoadingImages}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
                        جاري الرفع...
                      </>
                    ) : isLoadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
                        جاري التحميل...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة صور
                      </>
                    )}
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageSelect(e.target.files)}
                    className="hidden"
                  />

                  {/* Gallery Info */}
                  {formData.ImageFolderPath && (
                    <div className="text-sm text-gray-600">
                      <p>مسار المجلد: {formData.ImageFolderPath}</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {totalImages === 0 && !isLoadingImages && (
                    <div className="text-center text-gray-500 py-8">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>لا توجد صور</p>
                      <p className="text-xs">اضغط على "إضافة صور" لرفع صور البانر</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </form>
    </div>
  )
}