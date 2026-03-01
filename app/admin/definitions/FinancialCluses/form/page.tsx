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
import { validateCodeWithMessage, DEFINITION_COLLECTIONS } from '@/lib/utils/code-validation'

export default function FinancialClauseFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [formData, setFormData] = useState({
    ID: '',
    Code: '',
    Name: '',
    IsActive: true
  })

  useEffect(() => {
    const fetchHighestValues = async () => {
      if (!id) {
        try {
          const querySnapshot = await getDocs(collection(db, "Def_FinancialCluses"))
          let maxCode = 0
          let maxID = 0

          querySnapshot.forEach((doc) => {
            const data = doc.data()
            const currentCode = parseInt(data.Code) || 0
            const currentID = parseInt(data.ID) || 0
            maxCode = Math.max(maxCode, currentCode)
            maxID = Math.max(maxID, currentID)
          })

          setFormData(prev => ({
            ...prev,
            Code: (maxCode + 1).toString(),
            ID: (maxID + 1).toString()
          }))
        } catch (error) {
          console.error("Error fetching highest values:", error)
        }
      }
    }

    fetchHighestValues()
  }, [id])

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const docRef = doc(db, "Def_FinancialCluses", id)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()
            setFormData({
              ID: data.ID?.toString() || '',
              Code: data.Code?.toString() || '',
              Name: data.Name || '',
              IsActive: data.IsActive || false
            })
          }
        } catch (error) {
          console.error("Error fetching financial clause:", error)
        }
      }
    }

    fetchData()
  }, [id])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.Name || formData.Name.trim() === '') {
        alert("يرجى إدخال اسم البند المالي")
        return
      }
      
      if (!formData.Code || formData.Code.trim() === '') {
        alert("يرجى إدخال كود البند المالي")
        return
      }

      // التحقق من عدم تكرار الكود
      const isCodeValid = await validateCodeWithMessage(
        DEFINITION_COLLECTIONS.financialClauses,
        formData.Code,
        id || undefined
      )
      
      if (!isCodeValid) {
        return
      }

      const data = {
        ...formData,
        ID: parseInt(formData.ID),
        Code: parseInt(formData.Code)
      }

      if (id) {
        await updateDoc(doc(db, "Def_FinancialCluses", id), data)
      } else {
        await setDoc(doc(collection(db, "Def_FinancialCluses")), data)
      }

      alert(id ? "تم تحديث البند المالي بنجاح" : "تم إضافة البند المالي بنجاح")
      router.push("/admin/definitions/FinancialCluses")
      router.refresh()
    } catch (error) {
      console.error("Error saving financial clause:", error)
      alert("حدث خطأ أثناء حفظ البند المالي. الرجاء المحاولة مرة أخرى.")
    }
  }

  const actionButtons = [
    { label: "حفظ", icon: Save, onClick: handleSubmit },
    { label: "طباعة", icon: Printer, onClick: () => {} },
    { label: "إغلاق", icon: X, onClick: () => router.back(), variant: "destructive" as const },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title="بيانات بند المالية" actionButtons={actionButtons} />
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-end gap-8">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="is-active" 
                checked={formData.IsActive}
                onCheckedChange={(checked) => handleInputChange('IsActive', checked)}
              />
              <Label htmlFor="is-active">نشط</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="code">الكود</Label>
              <Input 
                id="code" 
                value={formData.Code}
                onChange={(e) => handleInputChange('Code', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id">المعرف</Label>
              <Input 
                id="id" 
                value={formData.ID}
                onChange={(e) => handleInputChange('ID', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">الاسم</Label>
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
            <Button variant="outline" onClick={handleSubmit}>
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