"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, doc, getDocs, getDoc, setDoc, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Save, Printer, ArrowLeft } from "lucide-react"
import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"

type Vendor = {
  ID: number
  IDBranch: number
  Code: number
  Name: string
  IsActive: boolean
  CurrentBalance: number
  BalanceType: number
  Mobile: string
  Phone: string
  Address: string
  Note: string
  UserName: string
  Password: string
}

type Branch = {
  ID: number
  Name: string
}

type BalanceType = {
  ID: number
  Name: string
}

export default function VendorFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [formData, setFormData] = useState<Vendor>({
    ID: 0,
    IDBranch: 0,
    Code: 0,
    Name: "",
    IsActive: true,
    CurrentBalance: 0,
    BalanceType: 0,
    Mobile: "",
    Phone: "",
    Address: "",
    Note: "",
    UserName: "",
    Password: ""
  })

  const [branches, setBranches] = useState<Branch[]>([])
  const [balanceTypes, setBalanceTypes] = useState<BalanceType[]>([])
  const [loading, setLoading] = useState(true)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let finalValue: string | number = value

    // التعامل مع الحقول الرقمية
    if (['Code', 'CurrentBalance'].includes(name)) {
      finalValue = parseFloat(value) || 0
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleSave = async () => {
    try {
      const docRef = doc(db, "Dealing_Vendors", String(formData.ID))
      await setDoc(docRef, formData)
      notify.success("تم حفظ بيانات المورد بنجاح")
      router.push("/admin/dealings/vendors?refresh=true")
    } catch (error) {
      console.error("Error saving vendor:", error)
      notify.error("حدث خطأ أثناء حفظ بيانات المورد")
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch branches from Def_CompanyStructure
        const branchesCollection = collection(db, "Def_CompanyStructure")
        const branchesSnapshot = await getDocs(branchesCollection)
        const branchesData = branchesSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ID: data.ID || 0,
            Name: data.Name || ''
          }
        }).filter(branch => branch.ID > 0 && branch.Name) // Filter out invalid entries
        .sort((a, b) => a.ID - b.ID)
        setBranches(branchesData)

        // Fetch balance types from Fix_BalanceType
        const balanceTypesCollection = collection(db, "Fix_BalanceType")
        const balanceTypesSnapshot = await getDocs(balanceTypesCollection)
        const balanceTypesData = balanceTypesSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ID: data.ID || 0,
            Name: data.Name || ''
          }
        }).filter(balanceType => balanceType.ID > 0 && balanceType.Name) // Filter out invalid entries
        .sort((a, b) => a.ID - b.ID)
        setBalanceTypes(balanceTypesData)

        // If editing, fetch vendor data
        if (id) {
          const vendorDoc = await getDoc(doc(db, "Dealing_Vendors", id))
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data() as Vendor
            setFormData(vendorData)
          }
        } else {
          // If new vendor, get max ID
          const vendorsRef = collection(db, "Dealing_Vendors")
          const q = query(vendorsRef, orderBy("ID", "desc"), limit(1))
          const querySnapshot = await getDocs(q)
          const maxId = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().ID
          setFormData(prev => ({ ...prev, ID: maxId + 1, Code: maxId + 1 }))
        }

      } catch (error) {
        console.error("Error fetching data:", error)
        notify.error("حدث خطأ أثناء تحميل البيانات")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const actionButtons = [
    { 
      label: "حفظ", 
      icon: Save, 
      onClick: handleSave 
    },
    { label: "طباعة", icon: Printer, onClick: () => {} },
    { 
      label: "إغلاق", 
      icon: ArrowLeft, 
      onClick: () => router.push("/admin/dealings/vendors"),
      variant: "destructive" as const 
    },
  ]

  if (loading) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-[80%]">
      <PageHeader title="بيانات المورد" actionButtons={actionButtons} />
      
      {/* معلومات المورد الأساسية */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="IDBranch">الفرع</Label>
              <Select 
                value={String(formData.IDBranch)} 
                onValueChange={(value) => handleSelectChange("IDBranch", value)}
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
            
            <div className="space-y-2">
              <Label htmlFor="Code">الكود</Label>
              <Input 
                id="Code"
                name="Code"
                type="number"
                value={formData.Code || ""}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox 
                  id="IsActive"
                  checked={formData.IsActive}
                  onCheckedChange={(checked) => handleCheckboxChange("IsActive", checked === true)}
                />
                <Label htmlFor="IsActive">نشط</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات المورد الشخصية */}
      <Card className="mb-6">
        <CardContent className="p-6 space-y-6">
          {/* الإسم */}
          <div className="space-y-2">
            <Label htmlFor="Name">الإسم</Label>
            <Input 
              id="Name"
              name="Name"
              value={formData.Name}
              onChange={handleInputChange}
            />
          </div>

          {/* معلومات الاتصال */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Mobile">الموبيل</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">📱</span>
                <Input 
                  id="Mobile"
                  name="Mobile"
                  value={formData.Mobile}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Phone">الهاتف</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">📞</span>
                <Input 
                  id="Phone"
                  name="Phone"
                  value={formData.Phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* العنوان */}
          <div className="space-y-2">
            <Label htmlFor="Address">العنوان</Label>
            <Textarea 
              id="Address"
              name="Address"
              value={formData.Address}
              onChange={handleInputChange}
              rows={3}
              placeholder="أدخل العنوان التفصيلي"
            />
          </div>

          {/* التفاصيل المالية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="CurrentBalance">الرصيد الحالي</Label>
              <Input 
                id="CurrentBalance"
                name="CurrentBalance"
                type="number"
                value={formData.CurrentBalance || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="BalanceType">حالة الرصيد</Label>
              <Select 
                value={String(formData.BalanceType)} 
                onValueChange={(value) => handleSelectChange("BalanceType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة الرصيد" />
                </SelectTrigger>
                <SelectContent>
                  {balanceTypes.map((balanceType) => (
                    <SelectItem key={balanceType.ID} value={String(balanceType.ID)}>
                      {balanceType.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الملاحظات */}
          <div className="space-y-2">
            <Label htmlFor="Note">ملاحظات</Label>
            <Textarea 
              id="Note"
              name="Note"
              value={formData.Note}
              onChange={handleInputChange}
              rows={3}
              placeholder="أدخل الملاحظات (اختياري)"
            />
          </div>
        </CardContent>
      </Card>

      {/* معلومات تسجيل الدخول */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>تسجيل الدخول</Label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="UserName">الموبيل (إجباري)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📱</span>
                    <Input 
                      id="UserName"
                      name="UserName"
                      value={formData.UserName}
                      onChange={handleInputChange}
                      placeholder="الموبيل (إجباري)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="Password">كلمة السر</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🔒</span>
                    <Input 
                      id="Password"
                      name="Password"
                      type="password"
                      value={formData.Password}
                      onChange={handleInputChange}
                      placeholder="كلمة السر"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
