"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Printer, X } from "lucide-react"
import PageHeader from "@/components/page-header"

import { useSearchParams, useRouter } from 'next/navigation'
import { collection, doc, getDoc, getDocs, DocumentData, QueryDocumentSnapshot, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useState, useEffect } from 'react'

export default function ProductionCompanyFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [formData, setFormData] = useState({
    ID: 0,
    Name: '',
    IsActive: true,
    IsSalesCategory: false
  })

  // جلب أعلى ID عند فتح نموذج جديد
  useEffect(() => {
    const fetchMaxValues = async () => {
      if (!id) { // فقط في حالة إضافة جديدة
        try {
          const companiesCollection = collection(db, 'Def_ProductionCompanies')
          const companiesSnapshot = await getDocs(companiesCollection)
          let maxID = 0
          
          companiesSnapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data()
            maxID = Math.max(maxID, parseInt(data.ID) || 0)
          })

          setFormData(prev => ({
            ...prev,
            ID: maxID + 1
          }))
        } catch (error) {
          console.error('Error fetching max values:', error)
        }
      }
    }
    fetchMaxValues()
  }, [id])

  useEffect(() => {
    if (id) {
      const data = searchParams.get('data')
      if (data) {
        try {
          const parsedData = JSON.parse(data)
          setFormData(parsedData)
        } catch (error) {
          console.error('Error parsing company data:', error)
        }
      }
    }
  }, [id, searchParams])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      if (!formData.ID) {
        alert('يجب إدخال رقم المعرف')
        return
      }

      if (!formData.Name.trim()) {
        alert('يجب إدخال اسم الشركة المنتجة')
        return
      }

      // التحقق من وجود سجل بنفس ID في قاعدة البيانات
      const docRef = doc(db, 'Def_ProductionCompanies', String(formData.ID))
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        // السجل موجود - تحديث
        if (id && id === String(formData.ID)) {
          // نفس السجل - تحديث عادي
          await updateDoc(docRef, formData)
          alert('تم تحديث الشركة المنتجة بنجاح')
        } else {
          // ID موجود لسجل آخر - خطأ
          alert('المعرف مستخدم بالفعل. يرجى اختيار معرف آخر')
          return
        }
      } else {
        // السجل غير موجود - إضافة جديدة
        await setDoc(docRef, formData)
        alert('تم إضافة الشركة المنتجة بنجاح')
      }
      
      router.back()
    } catch (error) {
      console.error('Error saving company:', error)
      alert('حدث خطأ أثناء الحفظ')
    }
  }

  const actionButtons = [
    { label: "حفظ", icon: Save, onClick: handleSave },
    { label: "طباعة", icon: Printer, onClick: () => {} },
    { label: "إغلاق", icon: X, onClick: () => router.back(), variant: "destructive" as const },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title={id ? "تعديل الشركة المنتجة" : "إضافة شركة منتجة جديدة"} actionButtons={actionButtons} />
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-end gap-8">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="is-sales-category" 
                checked={formData.IsSalesCategory}
                onCheckedChange={(checked) => handleInputChange('IsSalesCategory', checked)}
              />
              <Label htmlFor="is-sales-category">فئة مبيعات</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="is-active" 
                checked={formData.IsActive}
                onCheckedChange={(checked) => handleInputChange('IsActive', checked)}
              />
              <Label htmlFor="is-active">نشط</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="id">المعرف</Label>
              <Input 
                id="id" 
                type="number"
                value={formData.ID}
                onChange={(e) => handleInputChange('ID', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">الإسم</Label>
              <Input 
                id="name" 
                value={formData.Name}
                onChange={(e) => handleInputChange('Name', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t flex justify-end">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
            <Button variant="destructive" onClick={() => router.back()}>
              <X className="h-4 w-4 ml-2" />
              إغلاق
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}