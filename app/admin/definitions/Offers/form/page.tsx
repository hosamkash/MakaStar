"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { validateCodeWithMessage, DEFINITION_COLLECTIONS } from '@/lib/utils/code-validation'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Save, Printer, Upload, Trash, Image as ImageIcon } from "lucide-react"
import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"

type Offer = {
  id: string
  ID: string
  Code: string
  Name: string
  IsActive: boolean
  IsSalesOffer: boolean
  IsBindShop: boolean
  IsBindShopMaster: boolean
  ImageName: string
  ImageURL: string
  DiscountValue: number
  DiscountPercent: number
  ShortName: string
  DescreptionShort: string
  DescreptionLong: string
  contconditionToApplayOffer: number
}

export default function OfferFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<Offer>({
    id: "",
    ID: "",
    Code: "",
    Name: "",
    IsActive: true,
    IsSalesOffer: false,
    IsBindShop: false,
    IsBindShopMaster: false,
    ImageName: "",
    ImageURL: "",
    DiscountValue: 0,
    DiscountPercent: 0,
    ShortName: "",
    DescreptionShort: "",
    DescreptionLong: "",
    contconditionToApplayOffer: 0
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  useEffect(() => {
    const initializeForm = async () => {
      if (id) {
        // وضع التعديل
        try {
          const docRef = doc(db, "Def_Offers", id)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            const data = docSnap.data()
            const formattedData = {
              id: docSnap.id,
              ID: data.ID?.toString() || '',
              Code: data.Code?.toString() || '',
              Name: data.Name || '',
              IsActive: data.IsActive || false,
              IsSalesOffer: data.IsSalesOffer || false,
              IsBindShop: data.IsBindShop || false,
              IsBindShopMaster: data.IsBindShopMaster || false,
              ImageName: data.ImageName || '',
              ImageURL: data.ImageURL || '',
              DiscountValue: data.DiscountValue || 0,
              DiscountPercent: data.DiscountPercent || 0,
              ShortName: data.ShortName || '',
              DescreptionShort: data.DescreptionShort || '',
              DescreptionLong: data.DescreptionLong || '',
              contconditionToApplayOffer: data.contconditionToApplayOffer || 0
            }
            setFormData(formattedData)
            if (formattedData.ImageURL) {
              setImagePreview(formattedData.ImageURL)
            }
          }
        } catch (error) {
          console.error("Error fetching offer:", error)
          notify.error("حدث خطأ أثناء جلب بيانات العرض")
        }
      } else {
        // وضع الإضافة - توليد المعرف والكود التالي
        try {
          const itemsCollection = collection(db, "Def_Offers")
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
      // حذف الصورة القديمة إذا وجدت
      if (formData.ImageName) {
        try {
          const oldImageRef = ref(storage, `Application/Def_Offers/${offerId}/${formData.ImageName}`)
          await deleteObject(oldImageRef)
        } catch (error) {
          console.log("No old image to delete or error:", error)
        }
      }

      // إنشاء اسم فريد للملف
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${timestamp}.${fileExtension}`
      
      // رفع الصورة الجديدة
      const storageRef = ref(storage, `Application/Def_Offers/${offerId}/${uniqueFileName}`)
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
        DEFINITION_COLLECTIONS.offers,
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

      // رفع الصورة إذا تم اختيار صورة جديدة
      if (selectedImage) {
        imageData = await uploadImage(selectedImage, formData.id)
      }

      const docRef = doc(db, "Def_Offers", formData.id)
      const dataToSave = {
        ID: parseInt(formData.ID),
        Code: numericCode,
        Name: formData.Name.trim(),
        IsActive: formData.IsActive,
        IsSalesOffer: formData.IsSalesOffer,
        IsBindShop: formData.IsBindShop,
        IsBindShopMaster: formData.IsBindShopMaster,
        ImageName: imageData.imageName,
        ImageURL: imageData.imageURL,
        DiscountValue: Number(formData.DiscountValue),
        DiscountPercent: Number(formData.DiscountPercent),
        ShortName: formData.ShortName.trim(),
        DescreptionShort: formData.DescreptionShort.trim(),
        DescreptionLong: formData.DescreptionLong.trim(),
        contconditionToApplayOffer: Number(formData.contconditionToApplayOffer)
      }

      if (id) {
        // تحديث
        await updateDoc(docRef, dataToSave)
        notify.success("تم تحديث العرض بنجاح")
      } else {
        // إضافة جديدة
        await setDoc(docRef, dataToSave)
        notify.success("تم إضافة العرض بنجاح")
      }
      router.push("/admin/definitions/Offers?refresh=true")
    } catch (error) {
      console.error("Error saving offer:", error)
      alert("حدث خطأ أثناء حفظ العرض. الرجاء المحاولة مرة أخرى.")
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
        title="بيانات العرض"
        actionButtons={actionButtons} 
      />
      <form onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}>
        <Card>
          <CardHeader className="p-4">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 flex-wrap">
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
                    id="isSalesOffer"
                    checked={formData.IsSalesOffer}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsSalesOffer: checked as boolean })}
                  />
                  <Label htmlFor="isSalesOffer">عرض مبيعات</Label>
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
                  <Label htmlFor="isBindShopMaster">متجر رئيسي</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="code">الكود</Label>
                  <Input
                    id="code"
                    value={formData.Code}
                    onChange={(e) => setFormData({ ...formData, Code: e.target.value })}
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
                <div>
                  <Label htmlFor="shortName">الاسم المختصر</Label>
                  <Input
                    id="shortName"
                    value={formData.ShortName}
                    onChange={(e) => setFormData({ ...formData, ShortName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discountValue">قيمة الخصم</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.DiscountValue}
                    onChange={(e) => setFormData({ ...formData, DiscountValue: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="discountPercent">نسبة الخصم</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    value={formData.DiscountPercent}
                    onChange={(e) => setFormData({ ...formData, DiscountPercent: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="contconditionToApplayOffer">شرط تطبيق العرض</Label>
                  <Input
                    id="contconditionToApplayOffer"
                    type="number"
                    value={formData.contconditionToApplayOffer}
                    onChange={(e) => setFormData({ ...formData, contconditionToApplayOffer: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="descreptionShort">الوصف المختصر</Label>
                  <Textarea
                    id="descreptionShort"
                    value={formData.DescreptionShort}
                    onChange={(e) => setFormData({ ...formData, DescreptionShort: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="descreptionLong">الوصف المطول</Label>
                  <Textarea
                    id="descreptionLong"
                    value={formData.DescreptionLong}
                    onChange={(e) => setFormData({ ...formData, DescreptionLong: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>صورة العرض</Label>
                <div className="mt-2 flex flex-col items-center gap-6">
                  <div className="relative w-full max-w-md aspect-square">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Offer preview"
                        fill
                        className="object-contain rounded-lg border"
                      />
                    ) : (
                      <div className="w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <ImageIcon className="h-20 w-20" />
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

                  <div className="flex gap-4">
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
          </CardHeader>
        </Card>
      </form>
    </div>
  )
}