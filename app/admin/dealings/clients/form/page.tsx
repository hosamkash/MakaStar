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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Save, Printer, ArrowLeft, MapPin, X, Search, User } from "lucide-react"
import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"
import CartPersonalSponsor from "@/components/cart-personal-sponsor"
import AdminOrdersList from "@/components/admin-orders-list"

type Client = {
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
  EMail: string
  Note: string
  IDPriceType: number
  CreditLimit: number
  LocationLink: string
  LocationLatitude: number
  LocationLongitude: number
  LocationImage: string
  IsClientShopOnly: boolean
  UserName: string
  Password: string
  CreatedDate?: string
  CreatedTime?: string
  CreatedDateTime?: string
  PersonalSponsorID?: number
}

type Branch = {
  ID: number
  Name: string
}

type PriceType = {
  ID: number
  Name: string
}

type BalanceType = {
  ID: number
  Name: string
}

type Employee = {
  ID: number
  Code: number
  Name: string
}

export default function ClientFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [formData, setFormData] = useState<Client>({
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
    EMail: "",
    Note: "",
    IDPriceType: 0,
    CreditLimit: 0,
    LocationLink: "",
    LocationLatitude: 0,
    LocationLongitude: 0,
    LocationImage: "",
    IsClientShopOnly: false,
    UserName: "",
    Password: ""
  })

  const [branches, setBranches] = useState<Branch[]>([])
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([])
  const [balanceTypes, setBalanceTypes] = useState<BalanceType[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let finalValue: string | number = value

    // التعامل مع الحقول الرقمية
    if (['Code', 'CreditLimit', 'CurrentBalance', 'LocationLatitude', 'LocationLongitude'].includes(name)) {
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

  // دالة تحميل المندوبين
  const loadEmployees = async () => {
    try {
      const employeesQuery = query(collection(db, "Dealing_Employees"), orderBy("Name"))
      const querySnapshot = await getDocs(employeesQuery)
      const employeesData = querySnapshot.docs.map(doc => ({
        ID: doc.data().ID,
        Code: doc.data().Code,
        Name: doc.data().Name
      }))
      setEmployees(employeesData)
      setFilteredEmployees(employeesData)
    } catch (error) {
      console.error("Error loading employees:", error)
      notify.error("حدث خطأ في تحميل بيانات المندوبين")
    }
  }

  // دالة البحث في المندوبين
  const handleEmployeeSearch = (searchTerm: string) => {
    setEmployeeSearchTerm(searchTerm)
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees)
    } else {
      const filtered = employees.filter(employee =>
        employee.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.Code.toString().includes(searchTerm)
      )
      setFilteredEmployees(filtered)
    }
  }

  // دالة اختيار المندوب
  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData(prev => ({
      ...prev,
      PersonalSponsorID: employee.ID
    }))
    setEmployeeSearchTerm(employee.Name)
    setFilteredEmployees(employees)
  }

  // دالة إلغاء اختيار المندوب
  const handleClearEmployee = () => {
    setSelectedEmployee(null)
    setFormData(prev => ({
      ...prev,
      PersonalSponsorID: undefined
    }))
    setEmployeeSearchTerm("")
    setFilteredEmployees(employees)
  }

  const handleSave = async () => {
    try {
      const now = new Date()
      const dataToSave = {
        ...formData,
        // إضافة تاريخ ووقت الإنشاء للعميل الجديد فقط
        ...(id ? {} : {
          CreatedDate: now.toISOString().split('T')[0], // التاريخ بصيغة YYYY-MM-DD
          CreatedTime: now.toTimeString().split(' ')[0], // الوقت بصيغة HH:MM:SS
          CreatedDateTime: now.toISOString() // التاريخ والوقت الكامل
        })
      }
      
      console.log("بيانات الحفظ:", dataToSave)
      console.log("الراعي الشخصي:", dataToSave.PersonalSponsorID)
      
      const docRef = doc(db, "Dealing_Clients", String(formData.ID))
      await setDoc(docRef, dataToSave)
      notify.success("تم حفظ بيانات العميل بنجاح")
      router.push("/admin/dealings/clients?refresh=true")
    } catch (error) {
      console.error("Error saving client:", error)
      notify.error("حدث خطأ أثناء حفظ بيانات العميل")
    }
  }

  const getLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            LocationLatitude: position.coords.latitude,
            LocationLongitude: position.coords.longitude,
            LocationLink: `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
          }))
          notify.success("تم الحصول على الموقع بنجاح")
        },
        (error) => {
          console.error("Error getting location:", error)
          notify.error("حدث خطأ أثناء الحصول على الموقع")
        }
      )
    } else {
      notify.error("المتصفح لا يدعم تحديد الموقع")
    }
  }

  const clearLocation = () => {
    setFormData(prev => ({
      ...prev,
      LocationLatitude: 0,
      LocationLongitude: 0,
      LocationLink: ""
    }))
  }

  const openMap = () => {
    if (formData.LocationLink) {
      window.open(formData.LocationLink, '_blank')
    }
  }

  const fetchAddressFromLocation = async () => {
    if (formData.LocationLatitude && formData.LocationLongitude) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${formData.LocationLatitude},${formData.LocationLongitude}&key=YOUR_GOOGLE_MAPS_API_KEY`
        )
        const data = await response.json()
        if (data.results && data.results[0]) {
          setFormData(prev => ({
            ...prev,
            Address: data.results[0].formatted_address
          }))
          notify.success("تم جلب العنوان من الموقع")
        }
      } catch (error) {
        console.error("Error fetching address:", error)
        notify.error("حدث خطأ أثناء جلب العنوان")
      }
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
            Name: data.Name || '',
            IsActive: data.IsActive || false,
            IsBindShop: data.IsBindShop || false
          }
        }).filter(branch => branch.ID > 0 && branch.Name) // Filter out invalid entries
        .sort((a, b) => a.ID - b.ID)
        
        setBranches(branchesData)

        // Fetch price types from Fix_PriceType
        const priceTypesCollection = collection(db, "Fix_PriceType")
        const priceTypesSnapshot = await getDocs(priceTypesCollection)
        const priceTypesData = priceTypesSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ID: data.ID || 0,
            Name: data.Name || ''
          }
        }).filter(priceType => priceType.ID > 0 && priceType.Name) // Filter out invalid entries
        .sort((a, b) => a.ID - b.ID)
        
        setPriceTypes(priceTypesData)

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

        // تحميل المندوبين
        await loadEmployees()

        // If editing, fetch client data
        if (id) {
          const clientDoc = await getDoc(doc(db, "Dealing_Clients", id))
          if (clientDoc.exists()) {
            const clientData = clientDoc.data() as Client
            setFormData(clientData)
            
            console.log("بيانات العميل المحملة:", clientData)
            console.log("الراعي الشخصي المحفوظ:", clientData.PersonalSponsorID)
            
            // تحميل بيانات المندوب المختار إذا كان موجوداً (بعد تحميل المندوبين)
            if (clientData.PersonalSponsorID) {
              // البحث في المندوبين المحملين
              const selectedEmp = employees.find((emp: Employee) => emp.ID === clientData.PersonalSponsorID)
              if (selectedEmp) {
                console.log("تم العثور على المندوب المختار:", selectedEmp)
                setSelectedEmployee(selectedEmp)
                setEmployeeSearchTerm(selectedEmp.Name)
              } else {
                console.log("لم يتم العثور على المندوب المختار")
              }
            }
          }
        } else {
          // If new client, get max ID
          const clientsRef = collection(db, "Dealing_Clients")
          const q = query(clientsRef, orderBy("ID", "desc"), limit(1))
          const querySnapshot = await getDocs(q)
          const maxId = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().ID
          setFormData(prev => ({ 
            ...prev, 
            ID: maxId + 1, 
            Code: maxId + 1
          }))
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

  // useEffect لتحميل المندوب المختار بعد تحميل المندوبين
  useEffect(() => {
    if (employees.length > 0 && formData.PersonalSponsorID && !selectedEmployee) {
      console.log("البحث عن المندوب المختار:", formData.PersonalSponsorID)
      console.log("قائمة المندوبين:", employees)
      const selectedEmp = employees.find(emp => emp.ID === formData.PersonalSponsorID)
      if (selectedEmp) {
        console.log("تم العثور على المندوب في useEffect:", selectedEmp)
        setSelectedEmployee(selectedEmp)
        setEmployeeSearchTerm(selectedEmp.Name)
      } else {
        console.log("لم يتم العثور على المندوب في useEffect")
      }
    }
  }, [employees, formData.PersonalSponsorID, selectedEmployee])

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
      onClick: () => router.push("/admin/dealings/clients"),
      variant: "destructive" as const 
    },
  ]

  if (loading) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-[80%]">
      <PageHeader title="بيانات العميل" actionButtons={actionButtons} />
      
      {/* معلومات العميل الأساسية */}
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
              <Label htmlFor="Name">الإسم</Label>
              <Input 
                id="Name"
                name="Name"
                value={formData.Name}
                onChange={handleInputChange}
              />
            </div>
            
            
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-6 mb-4">
          <TabsTrigger value="personal">الشخصية</TabsTrigger>
          <TabsTrigger value="address">العنوان</TabsTrigger>
          <TabsTrigger value="location">اللوكيشن</TabsTrigger>
          <TabsTrigger value="user">المستخدم</TabsTrigger>
          <TabsTrigger value="sponsor">الراعي الشخصي</TabsTrigger>
          <TabsTrigger value="orders">قائمة الطلبات</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* تمت إزالة كومبو الراعي الشخصي من هذه التابة. استخدم تابة "الراعي الشخصي" لإدارته. */}

              {/* الكود والنشاط */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="IsActive"
                      checked={formData.IsActive}
                      onCheckedChange={(checked) => handleCheckboxChange("IsActive", checked as boolean)}
                    />
                    <Label htmlFor="IsActive">نشط</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                <Checkbox
                  id="IsClientShopOnly"
                  checked={formData.IsClientShopOnly}
                  onCheckedChange={(checked) => handleCheckboxChange("IsClientShopOnly", checked as boolean)}
                />
                <Label htmlFor="IsClientShopOnly">عميل متجر</Label>
              </div>
              
                </div>
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

              {/* نوع السعر */}
              <div className="space-y-2">
                <Label htmlFor="IDPriceType">نوع السعر</Label>
                <Select 
                  value={String(formData.IDPriceType)} 
                  onValueChange={(value) => handleSelectChange("IDPriceType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع السعر" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceTypes.map((priceType) => (
                      <SelectItem key={priceType.ID} value={String(priceType.ID)}>
                        {priceType.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              {/* التفاصيل المالية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="CreditLimit">الحد الإئتماني</Label>
                  <Input 
                    id="CreditLimit"
                    name="CreditLimit"
                    type="number"
                    value={formData.CreditLimit || ""}
                    onChange={handleInputChange}
                  />
                </div>
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
                  <Label htmlFor="BalanceType">نوع الرصيد</Label>
                  <Select 
                    value={String(formData.BalanceType)} 
                    onValueChange={(value) => handleSelectChange("BalanceType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الرصيد" />
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

              {/* الإيميل والملاحظات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="EMail">الإيميل</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">✉️</span>
                    <Input 
                      id="EMail"
                      name="EMail"
                      type="email"
                      value={formData.EMail}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="Note">ملاحظات</Label>
                  <Textarea 
                    id="Note"
                    name="Note"
                    value={formData.Note}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>

              {/* تاريخ الإنشاء */}
              {formData.CreatedDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">📅</span>
                    معلومات إنشاء الحساب
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-700">تاريخ الإنشاء</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">📅</span>
                        <Input 
                          value={formData.CreatedDate}
                          readOnly
                          className="bg-white border-blue-200 text-blue-800 font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-700">وقت الإنشاء</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">🕐</span>
                        <Input 
                          value={formData.CreatedTime}
                          readOnly
                          className="bg-white border-blue-200 text-blue-800 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                  {formData.CreatedDateTime && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-xs text-blue-600">
                        <span className="font-medium">التاريخ والوقت الكامل:</span> {formData.CreatedDateTime}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsor">
          <Card>
            <CardContent className="p-4">
              <CartPersonalSponsor
                className="shadow-none border-0"
                mode="admin"
                clientId={formData.ID}
                initialSponsorID={formData.PersonalSponsorID}
                onSponsorChange={(s) => {
                  setFormData(prev => ({ ...prev, PersonalSponsorID: s ? Number(s.id) || 0 : undefined }))
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <AdminOrdersList 
            clientId={formData.ID} 
            title={`طلبات العميل: ${formData.Name}`}
          />
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="Address">العنوان</Label>
                <Textarea 
                  id="Address"
                  name="Address"
                  value={formData.Address}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="أدخل العنوان التفصيلي"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* زر الحصول على الموقع */}
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getLocation}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  الحصول على اللوكيشن
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearLocation}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* إحداثيات الموقع */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="LocationLongitude">خط الطول</Label>
                  <Input 
                    id="LocationLongitude"
                    name="LocationLongitude"
                    type="number"
                    step="any"
                    value={formData.LocationLongitude || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="LocationLatitude">خط العرض</Label>
                  <Input 
                    id="LocationLatitude"
                    name="LocationLatitude"
                    type="number"
                    step="any"
                    value={formData.LocationLatitude || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* رابط الموقع */}
              <div className="space-y-2">
                <Label htmlFor="LocationLink">اللوكيشن</Label>
                <Textarea 
                  id="LocationLink"
                  name="LocationLink"
                  value={formData.LocationLink}
                  onChange={handleInputChange}
                  rows={2}
                  readOnly
                />
              </div>

              {/* أزرار إضافية */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openMap}
                  disabled={!formData.LocationLink}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  فتح الخريطة
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchAddressFromLocation}
                  disabled={!formData.LocationLatitude || !formData.LocationLongitude}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  جلب العنوان من اللوكيشن
                </Button>
              </div>

              {/* العنوان التفصيلي من الخريطة */}
              <div className="space-y-2">
                <Label htmlFor="DetailedAddress">العنوان تفصيلي من الخريطة</Label>
                <Textarea 
                  id="DetailedAddress"
                  name="DetailedAddress"
                  rows={4}
                  placeholder="سيتم ملء هذا الحقل تلقائياً عند جلب العنوان من الخريطة"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user">
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
                      <div className="relative flex items-center gap-2">
                        <span className="text-gray-500">🔒</span>
                        <Input 
                          id="Password"
                          name="Password"
                          type={showPassword ? "text" : "password"}
                          value={formData.Password}
                          onChange={handleInputChange}
                          placeholder="كلمة السر"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute left-2 text-gray-500 hover:text-gray-700 text-sm"
                          title={showPassword ? "إخفاء" : "إظهار"}
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
