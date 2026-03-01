"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { validateCodeUniqueness, DEFINITION_COLLECTIONS } from "@/lib/utils/code-validation"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X, Save, Printer } from "lucide-react"
import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"

type Job = {
  id: string
  ID: string
  Name: string
  IsActive: boolean
}

export default function JobFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [formData, setFormData] = useState<Job>({
    id: "",
    ID: "",
    Name: "",
    IsActive: true
  })

  useEffect(() => {
    const initializeForm = async () => {
      if (id) {
        // وضع التعديل
        try {
          const docRef = doc(db, "Def_Jobs", id)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            const data = docSnap.data()
            setFormData({
              id: docSnap.id,
              ID: data.ID?.toString() || '',
              Name: data.Name || '',
              IsActive: data.IsActive || false
            })
          }
        } catch (error) {
          console.error("Error fetching job:", error)
          notify.error("حدث خطأ أثناء جلب بيانات الوظيفة")
        }
      } else {
        // وضع الإضافة - توليد المعرف التالي
        try {
          const itemsCollection = collection(db, "Def_Jobs")
          const itemsSnapshot = await getDocs(itemsCollection)
          
          let maxId = 0
          
          itemsSnapshot.docs.forEach(doc => {
            const data = doc.data()
            const docId = parseInt(doc.id)
            if (docId > maxId) maxId = docId
          })

          setFormData(prev => ({
            ...prev,
            id: String(maxId + 1),
            ID: String(maxId + 1)
          }))
        } catch (error) {
          console.error("Error getting max ID:", error)
          notify.error("حدث خطأ أثناء تحضير النموذج")
        }
      }
    }

    initializeForm()
  }, [id])

  const handleSubmit = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.Name || formData.Name.trim() === '') {
        alert("يرجى إدخال اسم الوظيفة")
        return
      }

      if (!formData.ID || formData.ID.trim() === '') {
        alert("يرجى إدخال معرف الوظيفة")
        return
      }

      const numericId = parseInt(formData.ID)
      if (isNaN(numericId) || numericId <= 0) {
        alert("يرجى إدخال معرف صحيح (رقم أكبر من صفر)")
        return
      }

      // التحقق من عدم تكرار الكود
      const isCodeValid = await validateCodeUniqueness(
        DEFINITION_COLLECTIONS.jobs,
        numericId,
        id || undefined
      )
      
      if (!isCodeValid) {
        alert("المعرف مستخدم بالفعل. يرجى اختيار معرف آخر")
        return
      }

      const docRef = doc(db, "Def_Jobs", formData.id)
      
      if (id) {
        // تحديث
        await updateDoc(docRef, {
          ID: numericId,
          Name: formData.Name.trim(),
          IsActive: formData.IsActive
        })
        notify.success("تم تحديث الوظيفة بنجاح")
      } else {
        // إضافة جديدة
        await setDoc(docRef, {
          ID: numericId,
          Name: formData.Name.trim(),
          IsActive: formData.IsActive
        })
        notify.success("تم إضافة الوظيفة بنجاح")
      }

      router.push("/admin/definitions/jobs?refresh=true")
    } catch (error) {
      console.error("Error saving job:", error)
      notify.error("حدث خطأ أثناء حفظ الوظيفة")
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
        title="بيانات الوظيفة"
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
                  <Label htmlFor="id">المعرف</Label>
                  <Input
                    id="id"
                    value={formData.ID}
                    onChange={(e) => setFormData({ ...formData, ID: e.target.value })}
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
            </div>
          </CardHeader>
        </Card>
      </form>
    </div>
  )
}
