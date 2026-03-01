"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { validateCodeUniqueness, DEFINITION_COLLECTIONS } from "@/lib/utils/code-validation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PageHeader from "@/components/page-header"
import { Save, X, Edit, Plus, ArrowLeft } from "lucide-react"
import { notify } from "@/lib/notifications"

type Category = {
  ID: number
  Code: number
  Name: string
  IsActive: boolean
}

export default function ShopCategoryFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    mainCategoryId: "",
    subCategories: [] as number[],
    isActive: true,
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const categoriesSnapshot = await getDocs(collection(db, "Def_Categories"))
        const categoriesData = categoriesSnapshot.docs
          .map(d => ({
            ID: parseInt(d.id) || 0,
            Code: d.data().Code || 0,
            Name: d.data().Name || "",
            IsActive: d.data().IsActive || false,
          }))
          .sort((a, b) => a.ID - b.ID)
        setCategories(categoriesData)

        if (id) {
          const docRef = doc(db, "Def_ShopCategories", id)
          const snap = await getDoc(docRef)
          const data = snap.data()
          if (data) {
            setFormData({
              mainCategoryId: String(data.mainCategoryId || ""),
              subCategories: (data.subCategories as number[]) || [],
              isActive: Boolean(data.isActive),
            })
          }
        }
      } catch (e) {
        console.error(e)
        notify.error("حدث خطأ أثناء تحميل البيانات")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const toggleSubCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      subCategories: prev.subCategories.includes(categoryId)
        ? prev.subCategories.filter(x => x !== categoryId)
        : [...prev.subCategories, categoryId],
    }))
  }

  const getMaxId = async (): Promise<number> => {
    const snapshot = await getDocs(collection(db, "Def_ShopCategories"))
    let maxId = 0
    snapshot.docs.forEach(d => {
      const n = parseInt(d.id)
      if (!isNaN(n) && n > maxId) maxId = n
    })
    return maxId
  }

  const handleSave = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.mainCategoryId || formData.mainCategoryId.trim() === '') {
        alert("يرجى اختيار التصنيف الرئيسي")
        return
      }

      const mainCategory = categories.find(c => c.ID === parseInt(formData.mainCategoryId))
      if (!mainCategory) {
        alert("يرجى اختيار تصنيف رئيسي صحيح")
        return
      }

      const numericId = parseInt(formData.mainCategoryId)
      if (isNaN(numericId) || numericId <= 0) {
        alert("يرجى اختيار تصنيف رئيسي صحيح")
        return
      }

      // التحقق من عدم تكرار التصنيف الرئيسي
      const isCodeValid = await validateCodeUniqueness(
        DEFINITION_COLLECTIONS.shopCategories,
        numericId,
        id || undefined
      )
      
      if (!isCodeValid) {
        alert("هذا التصنيف الرئيسي مستخدم بالفعل. يرجى اختيار تصنيف آخر")
        return
      }

      const payload = {
        mainCategoryId: numericId,
        subCategories: formData.subCategories,
        isActive: formData.isActive,
        updatedAt: new Date(),
      }

      if (id) {
        await updateDoc(doc(db, "Def_ShopCategories", id), payload)
        notify.success("تم تحديث تصنيف المتجر بنجاح")
      } else {
        const newId = (await getMaxId()) + 1
        await setDoc(doc(db, "Def_ShopCategories", String(newId)), {
          ...payload,
          createdAt: new Date(),
        })
        notify.success("تم إضافة تصنيف المتجر بنجاح")
      }

      router.push("/admin/definitions/shop-categories?refresh=true")
    } catch (e) {
      console.error(e)
      notify.error("حدث خطأ أثناء الحفظ")
    }
  }

  const actionButtons = [
    {
      label: "عودة",
      icon: ArrowLeft,
      onClick: () => router.push("/admin/definitions/shop-categories"),
    },
  ]

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-full">
      <PageHeader
        title={id ? "تعديل تصنيف المتجر" : "إضافة تصنيف متجر جديد"}
        actionButtons={actionButtons}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {id ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {id ? "تعديل تصنيف المتجر" : "إضافة تصنيف متجر جديد"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">التصنيف الرئيسي *</label>
              <Select
                value={formData.mainCategoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mainCategoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف الرئيسي" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.IsActive).map(category => (
                    <SelectItem key={category.ID} value={String(category.ID)}>
                      {category.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <label htmlFor="isActive" className="text-sm font-medium">نشط</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">التصنيفات الفرعية</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
              {categories
                .filter(cat => cat.IsActive && cat.ID !== parseInt(formData.mainCategoryId))
                .map((category) => (
                  <div key={category.ID} className="flex items-center gap-2">
                    <Checkbox
                      id={`sub-${category.ID}`}
                      checked={formData.subCategories.includes(category.ID)}
                      onCheckedChange={() => toggleSubCategory(category.ID)}
                    />
                    <label htmlFor={`sub-${category.ID}`} className="text-sm">
                      {category.Name}
                    </label>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/definitions/shop-categories')}>
            <X className="w-4 h-4 ml-2" />
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 ml-2" />
            {id ? "تحديث" : "حفظ"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


