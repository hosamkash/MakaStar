"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { validateCodeWithMessage, DEFINITION_COLLECTIONS } from '@/lib/utils/code-validation'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Save, Printer } from "lucide-react"
import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"

type Treasury = {
  id: string
  ID: string
  Code: string
  Name: string
  IsActive: boolean
  IsBindBranch: boolean
  IDBranch: string
  Balance: number
  IsBindShop: boolean
}

type Branch = {
  ID: string
  Name: string
}

export default function TreasuryFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [formData, setFormData] = useState<Treasury>({
    id: "",
    ID: "",
    Code: "",
    Name: "",
    IsActive: true,
    IsBindBranch: false,
    IDBranch: "",
    Balance: 0,
    IsBindShop: false
  })

  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(true)

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true)
        const branchesCollection = collection(db, "Def_CompanyStructure")
        const branchesSnapshot = await getDocs(branchesCollection)
        
        if (!branchesSnapshot.empty) {
          const branchesData = branchesSnapshot.docs.map(doc => {
            const data = doc.data()
            return {
              ID: doc.id,
              Name: data.Name || ''
            }
          }).sort((a, b) => {
            const idA = parseInt(a.ID) || 0
            const idB = parseInt(b.ID) || 0
            return idA - idB
          })
          
          setBranches(branchesData)
        }
      } catch (error) {
        console.error("Error fetching branches:", error)
        notify.error("حدث خطأ أثناء جلب بيانات الفروع")
      } finally {
        setLoadingBranches(false)
      }
    }

    fetchBranches()
  }, [])

  useEffect(() => {
    const initializeForm = async () => {
      if (id) {
        // وضع التعديل
        try {
          const docRef = doc(db, "Def_Treasures", id)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            const data = docSnap.data()
            setFormData({
              id: docSnap.id,
              ID: data.ID?.toString() || '',
              Code: data.Code?.toString() || '',
              Name: data.Name || '',
              IsActive: data.IsActive || false,
              IsBindBranch: data.IsBindBranch || false,
              IDBranch: data.IDBranch?.toString() || '',
              Balance: data.Balance || 0,
              IsBindShop: data.IsBindShop || false
            })
          }
        } catch (error) {
          console.error("Error fetching treasury:", error)
          notify.error("حدث خطأ أثناء جلب بيانات الخزينة")
        }
      } else {
        // وضع الإضافة - توليد المعرف والكود التالي
        try {
          const itemsCollection = collection(db, "Def_Treasures")
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

  const handleSubmit = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.Name || formData.Name.trim() === '') {
        alert("يرجى إدخال اسم الخزينة")
        return
      }
      
      if (!formData.Code || formData.Code.trim() === '') {
        alert("يرجى إدخال كود الخزينة")
        return
      }

      // التحقق من عدم تكرار الكود
      const isCodeValid = await validateCodeWithMessage(
        DEFINITION_COLLECTIONS.treasuries,
        formData.Code,
        id || undefined
      )
      
      if (!isCodeValid) {
        return
      }

      const docRef = doc(db, "Def_Treasures", formData.id)
      await setDoc(docRef, {
        ID: parseInt(formData.ID),
        Code: parseInt(formData.Code),
        Name: formData.Name,
        IsActive: formData.IsActive,
        IsBindBranch: formData.IsBindBranch,
        IDBranch: formData.IDBranch ? parseInt(formData.IDBranch) : null,
        Balance: formData.Balance,
        IsBindShop: formData.IsBindShop
      })

      alert(id ? "تم تحديث الخزينة بنجاح" : "تم إضافة الخزينة بنجاح")
      router.push("/admin/definitions/treasuries?refresh=true")
    } catch (error) {
      console.error("Error saving treasury:", error)
      alert("حدث خطأ أثناء حفظ الخزينة. الرجاء المحاولة مرة أخرى.")
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
        title="بيانات الخزينة"
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
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isBindBranch"
                    checked={formData.IsBindBranch}
                    onCheckedChange={(checked) => {
                      setFormData({ 
                        ...formData, 
                        IsBindBranch: checked as boolean,
                        IDBranch: checked ? formData.IDBranch || (branches[0]?.ID || "") : ""
                      })
                    }}
                  />
                  <Label htmlFor="isBindBranch">مرتبط بفرع</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isBindShop"
                    checked={formData.IsBindShop}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsBindShop: checked as boolean })}
                  />
                  <Label htmlFor="isBindShop">مرتبط بمتجر</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {formData.IsBindBranch && (
                <div>
                  <Label>الفرع</Label>
                  <Select
                    value={formData.IDBranch}
                    onValueChange={(value) => setFormData({ ...formData, IDBranch: value })}
                    disabled={loadingBranches}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.ID} value={branch.ID}>
                          {branch.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="balance">الرصيد</Label>
                <Input
                  id="balance"
                  type="number"
                  value={formData.Balance}
                  onChange={(e) => setFormData({ ...formData, Balance: Number(e.target.value) })}
                />
              </div>
            </div>
          </CardHeader>
        </Card>
      </form>
    </div>
  )
}