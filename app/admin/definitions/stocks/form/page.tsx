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

type Stock = {
  ID: string
  Code: string
  Name: string
  DateCreate: string
  Address: string
  Phone: string
  Mobile: string
  IsActive: boolean
  IsBindBranch: boolean
  IDBranch: string
  IsBindShop: boolean
  DefaultStock: string
  DefaultTreasury: string
  DefaultEmployee: string
}

type Branch = {
  ID: number
  Name: string
}

export default function WarehouseFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const data = searchParams.get("data")

  const [formData, setFormData] = useState<Stock>({
    ID: "",
    Code: "",
    Name: "",
    DateCreate: new Date().toISOString().split('T')[0],
    Address: "",
    Phone: "",
    Mobile: "",
    IsActive: true,
    IsBindBranch: false,
    IDBranch: "",
    IsBindShop: false,
    DefaultStock: "",
    DefaultTreasury: "",
    DefaultEmployee: ""
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
              ID: parseInt(doc.id) || 0,
              Name: data.Name || ''
            }
          }).sort((a, b) => a.ID - b.ID)
          
          setBranches(branchesData)
        }
      } catch (error) {
        console.error("Error fetching branches:", error)
        alert("حدث خطأ أثناء جلب بيانات الفروع")
      } finally {
        setLoadingBranches(false)
      }
    }

    fetchBranches()
  }, [])

  useEffect(() => {
    const initializeForm = async () => {
      if (id && data) {
        // Edit mode - use passed data
        const parsedData = JSON.parse(data)
        setFormData(parsedData)
      } else {
        // Add mode - get next ID and Code
        try {
          const stocksCollection = collection(db, "Def_Stocks")
          const stocksSnapshot = await getDocs(stocksCollection)
          
          let maxId = 0
          let maxCode = 0
          
          stocksSnapshot.docs.forEach(doc => {
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
          alert("حدث خطأ أثناء تحضير النموذج. الرجاء المحاولة مرة أخرى.")
        }
      }
    }

    initializeForm()
  }, [id, data])

  const handleSubmit = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.Name || formData.Name.trim() === '') {
        alert("يرجى إدخال اسم المخزن")
        return
      }
      
      if (!formData.Code || formData.Code.trim() === '') {
        alert("يرجى إدخال كود المخزن")
        return
      }

      // التحقق من عدم تكرار الكود
      const isCodeValid = await validateCodeWithMessage(
        DEFINITION_COLLECTIONS.stocks,
        formData.Code,
        id || undefined
      )
      
      if (!isCodeValid) {
        return
      }

      const docRef = doc(db, "Def_Stocks", String(formData.ID))
      await setDoc(docRef, {
        Code: formData.Code,
        Name: formData.Name,
        DateCreate: formData.DateCreate,
        Address: formData.Address,
        Phone: formData.Phone,
        Mobile: formData.Mobile,
        IsActive: formData.IsActive,
        IsBindBranch: formData.IsBindBranch,
        IDBranch: formData.IDBranch,
        IsBindShop: formData.IsBindShop,
        DefaultStock: formData.DefaultStock,
        DefaultTreasury: formData.DefaultTreasury,
        DefaultEmployee: formData.DefaultEmployee
      })

      alert(id ? "تم تحديث المخزن بنجاح" : "تم إضافة المخزن بنجاح")
      router.push("/admin/definitions/stocks")
      router.refresh()
    } catch (error) {
      console.error("Error saving warehouse:", error)
      alert("حدث خطأ أثناء حفظ المخزن. الرجاء المحاولة مرة أخرى.")
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
        title="بيانات المخزن"
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
                <Label htmlFor="date">التاريخ</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.DateCreate}
                  onChange={(e) => setFormData({ ...formData, DateCreate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">الكود</Label>
                <Input
                  id="code"
                  value={formData.Code}
                  onChange={(e) => setFormData({ ...formData, Code: e.target.value })}
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
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.Address}
                onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">الهاتف</Label>
                <Input
                  id="phone"
                  dir="ltr"
                  value={formData.Phone}
                  onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mobile">الموبايل</Label>
                <Input
                  id="mobile"
                  dir="ltr"
                  value={formData.Mobile}
                  onChange={(e) => setFormData({ ...formData, Mobile: e.target.value })}
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
                      <SelectItem key={branch.ID} value={String(branch.ID)}>
                        {branch.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">الإعدادات الافتراضية</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="defaultStock">المخزن الافتراضي</Label>
                  <Input
                    id="defaultStock"
                    value={formData.DefaultStock}
                    onChange={(e) => setFormData({ ...formData, DefaultStock: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultTreasury">الخزينة الافتراضية</Label>
                  <Input
                    id="defaultTreasury"
                    value={formData.DefaultTreasury}
                    onChange={(e) => setFormData({ ...formData, DefaultTreasury: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultEmployee">الموظف الافتراضي</Label>
                  <Input
                    id="defaultEmployee"
                    value={formData.DefaultEmployee}
                    onChange={(e) => setFormData({ ...formData, DefaultEmployee: e.target.value })}
                  />
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
