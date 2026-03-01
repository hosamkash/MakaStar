"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Printer, X, Phone } from "lucide-react"
import PageHeader from "@/components/page-header"

import { useSearchParams, useRouter } from 'next/navigation'
import { collection, doc, getDoc, getDocs, DocumentData, QueryDocumentSnapshot, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useState, useEffect } from 'react'
import { validateCodeWithMessage, DEFINITION_COLLECTIONS } from '@/lib/utils/code-validation'

export default function BranchFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [formData, setFormData] = useState({
    ID: 0,
    Code: 0,
    Name: '',
    DateCreate: new Date().toISOString().split('T')[0],
    Adress: '',
    Phone: '',
    Mobile: '',
    Logo: '',
    isActive: true,
    isOwner: true,
    defaultStock: '',
    defaultTreasure: '',
    defaultEmployee: '',
    IsBindShop: false
  })

  // جلب أعلى كود وID عند فتح نموذج جديد
  useEffect(() => {
    const fetchMaxValues = async () => {
      if (!id) { // فقط في حالة إضافة جديدة
        try {
          const branchesCollection = collection(db, 'Def_CompanyStructure')
          const branchesSnapshot = await getDocs(branchesCollection)
          let maxCode = 0
          let maxID = 0
          
          branchesSnapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data()
            maxCode = Math.max(maxCode, parseInt(data.Code) || 0)
            maxID = Math.max(maxID, parseInt(data.ID) || 0)
          })

          setFormData(prev => ({
            ...prev,
            Code: maxCode + 1,
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
          console.error('Error parsing branch data:', error)
        }
      }
    }
  }, [id, searchParams])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      if (!formData.ID || formData.ID <= 0) {
        alert('يجب إدخال رقم معرف صحيح')
        return
      }

      if (!formData.Code || formData.Code <= 0) {
        alert('يجب إدخال رقم كود صحيح')
        return
      }

      if (!formData.Name || formData.Name.trim() === '') {
        alert('يرجى إدخال اسم الفرع')
        return
      }

      // التحقق من عدم تكرار الكود
      const isCodeValid = await validateCodeWithMessage(
        DEFINITION_COLLECTIONS.companyData,
        formData.Code,
        id || undefined
      )
      
      if (!isCodeValid) {
        return
      }

      if (id) {
        // تحديث
        await updateDoc(doc(db, 'Def_CompanyStructure', id), formData)
        alert('تم تحديث الفرع بنجاح')
      } else {
        // إضافة جديد - استخدام Document ID رقمي
        await setDoc(doc(db, 'Def_CompanyStructure', String(formData.ID)), formData)
        alert('تم إضافة الفرع بنجاح')
      }
      router.back()
    } catch (error) {
      console.error('Error saving branch:', error)
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
      <PageHeader title="بيانات الفرع" actionButtons={actionButtons} />
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-end gap-8">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="is-store" 
                checked={formData.IsBindShop}
                onCheckedChange={(checked) => handleInputChange('IsBindShop', checked)}
              />
              <Label htmlFor="is-store">رئيسي للمتجر</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="is-main" 
                checked={formData.isOwner}
                onCheckedChange={(checked) => handleInputChange('isOwner', checked)}
              />
              <Label htmlFor="is-main">رئيسي</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="is-active" 
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="is-active">نشط</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="id">المعرف</Label>
              <Input 
                id="id" 
                type="number"
                value={formData.ID}
                onChange={(e) => handleInputChange('ID', parseInt(e.target.value) || 0)}
                readOnly={!id} // للقراءة فقط في حالة الإضافة الجديدة
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">الكود</Label>
              <Input 
                id="code" 
                type="number"
                value={formData.Code}
                onChange={(e) => handleInputChange('Code', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input 
                id="date" 
                type="date" 
                value={formData.DateCreate}
                onChange={(e) => handleInputChange('DateCreate', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">الإسم</Label>
              <Input 
                id="name" 
                value={formData.Name}
                onChange={(e) => handleInputChange('Name', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">العنوان</Label>
              <Input 
                id="address" 
                value={formData.Adress}
                onChange={(e) => handleInputChange('Adress', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">الهاتف</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="phone" 
                  type="tel" 
                                  value={formData.Phone}
                onChange={(e) => handleInputChange('Phone', e.target.value)}
                  className="pl-10" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">الموبايل</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="mobile" 
                  type="tel" 
                                  value={formData.Mobile}
                onChange={(e) => handleInputChange('Mobile', e.target.value)}
                  className="pl-10" 
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-center mb-4">الإعدادات الإفتراضية</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="default-stock">المخزن الإفتراضي</Label>
                <Input 
                  id="default-stock" 
                  placeholder="ادخل المخزن الإفتراضي" 
                  value={formData.defaultStock}
                  onChange={(e) => handleInputChange('defaultStock', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-treasury">الخزينة الإفتراضية</Label>
                <Input 
                  id="default-treasury" 
                  placeholder="ادخل الخزينة الإفتراضية" 
                  value={formData.defaultTreasure}
                  onChange={(e) => handleInputChange('defaultTreasure', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-employee">الموظف الإفتراضي</Label>
                <Input 
                  id="default-employee" 
                  placeholder="ادخل الموظف الإفتراضي" 
                  value={formData.defaultEmployee}
                  onChange={(e) => handleInputChange('defaultEmployee', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t flex justify-end">
          <div className="flex items-center gap-2">
            <Button variant="outline">
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
