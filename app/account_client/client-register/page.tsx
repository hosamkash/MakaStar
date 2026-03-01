"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Building2,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Save
} from "lucide-react"
import { collection, doc, setDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { notify } from "@/lib/notifications"

interface Client {
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
}

interface Branch {
  ID: number
  Name: string
}

interface PriceType {
  ID: number
  Name: string
}

interface BalanceType {
  ID: number
  Name: string
}

export default function ClientRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [branches, setBranches] = useState<Branch[]>([])
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([])
  const [balanceTypes, setBalanceTypes] = useState<BalanceType[]>([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState("")

  const [formData, setFormData] = useState({
    Name: "",
    UserName: "", // سيتم ملؤه تلقائياً برقم الموبايل
    Password: "", // سيتم ملؤه تلقائياً برقم الموبايل
    ConfirmPassword: "", // سيتم ملؤه تلقائياً برقم الموبايل
    EMail: "",
    Mobile: "",
    Phone: "",
    Address: "",
    Note: "",
    IDBranch: 0,
    IDPriceType: 2, // القيمة الافتراضية 2
    BalanceType: 0, // القيمة الافتراضية 0
    CreditLimit: 0,
    IsActive: true, // القيمة الافتراضية true
    IsClientShopOnly: true, // القيمة الافتراضية true
    LocationLatitude: 0,
    LocationLongitude: 0,
    LocationLink: ""
  })

  // تحميل البيانات المرجعية
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        // تحميل الفروع النشطة فقط
        const branchesCollection = collection(db, "Def_CompanyStructure")
        const branchesSnapshot = await getDocs(branchesCollection)
        console.log("Total branches found:", branchesSnapshot.docs.length)
        
        const branchesData = branchesSnapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("Branch data:", data)
          return {
            ID: data.ID || 0,
            Name: data.Name || '',
            IsActive: data.IsActive || false,
            IsBindShop: data.IsBindShop || false
          }
        })
        
        console.log("Branches before filter:", branchesData)
        
        const filteredBranches = branchesData.filter(branch => branch.ID > 0 && branch.Name)
        console.log("Branches after filter:", filteredBranches)
        
        const sortedBranches = filteredBranches.sort((a, b) => a.ID - b.ID)
        console.log("Final branches:", sortedBranches)
        
        setBranches(sortedBranches)
        
        // إضافة بيانات تجريبية إذا لم توجد فروع
        if (sortedBranches.length === 0) {
          console.log("No branches found, adding test data")
          const testBranches = [
            { ID: 1, Name: "الفرع الرئيسي" },
            { ID: 2, Name: "فرع فرعي" }
          ]
          setBranches(testBranches)
          setFormData(prev => ({
            ...prev,
            IDBranch: 1
          }))
        }

        // تعيين أول فرع متاح
        if (sortedBranches.length > 0) {
          console.log("Setting default branch to:", sortedBranches[0])
          setFormData(prev => ({
            ...prev,
            IDBranch: sortedBranches[0].ID
          }))
        } else {
          console.log("No branches available, keeping IDBranch as 0")
        }

        // تحميل أنواع الأسعار
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

        // تحميل أنواع الرصيد
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

        // تعيين نوع الرصيد الافتراضي (مدين عليه)
        const defaultBalanceType = balanceTypesData.find(balanceType => 
          balanceType.Name === "مدين (عليه)" || balanceType.Name.includes("مدين")
        )
        
        if (defaultBalanceType) {
          console.log("Setting default balance type to:", defaultBalanceType)
          setFormData(prev => ({
            ...prev,
            BalanceType: defaultBalanceType.ID
          }))
        } else if (balanceTypesData.length > 0) {
          // إذا لم يجد "مدين (عليه)"، استخدم أول نوع متاح
          console.log("Setting first available balance type to:", balanceTypesData[0])
          setFormData(prev => ({
            ...prev,
            BalanceType: balanceTypesData[0].ID
          }))
        } else {
          console.log("No balance types available, keeping BalanceType as 0")
        }
      } catch (error) {
        console.error("Error loading reference data:", error)
        setError("حدث خطأ في تحميل البيانات المرجعية")
      }
    }

    loadReferenceData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let finalValue: string | number = value

    // التعامل مع الحقول الرقمية
    if (['CreditLimit'].includes(name)) {
      finalValue = parseFloat(value) || 0
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    // تجنب القيم الفارغة أو غير الصحيحة
    if (value && value !== "" && !isNaN(Number(value))) {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }))
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  // قراءة عنوان مقروء من الإحداثيات (Reverse Geocoding) عبر خدمة مفتوحة
  const reverseGeocodeAddress = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=ar`
      const res = await fetch(url, { headers: { Accept: "application/json" } })
      if (!res.ok) return ""
      const data = await res.json()
      return data?.display_name || ""
    } catch {
      return ""
    }
  }

  // الحصول على موقع المستخدم وملء الإحداثيات والرابط والعنوان المقروء
  const getCurrentLocation = async () => {
    setLocationError("")
    setLocationLoading(true)
    try {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setLocationError("المتصفح لا يدعم تحديد الموقع")
        return
      }
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords
            const link = `https://www.google.com/maps?q=${latitude},${longitude}`
            const readable = await reverseGeocodeAddress(latitude, longitude)
            setFormData(prev => ({
              ...prev,
              LocationLatitude: latitude,
              LocationLongitude: longitude,
              LocationLink: link,
              Address: prev.Address?.trim() ? prev.Address : (readable || prev.Address)
            }))
            resolve()
          },
          (err) => {
            setLocationError("تعذر تحديد الموقع: " + (err?.message || ""))
            reject(err)
          },
          { enableHighAccuracy: true, timeout: 15000 }
        )
      })
    } finally {
      setLocationLoading(false)
    }
  }

  const generateClientCode = async (): Promise<number> => {
    try {
      const clientsRef = collection(db, "Dealing_Clients")
      const q = query(clientsRef, orderBy("Code", "desc"), limit(1))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return 1 // أول عميل يبدأ من 1
      }
      
      const lastClient = querySnapshot.docs[0].data()
      return (lastClient.Code || 0) + 1
    } catch (error) {
      console.error("Error generating client code:", error)
      return Date.now() // استخدام timestamp كبديل
    }
  }

  const generateClientID = async (): Promise<number> => {
    try {
      const clientsRef = collection(db, "Dealing_Clients")
      const q = query(clientsRef, orderBy("ID", "desc"), limit(1))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return 1 // أول عميل يبدأ من 1
      }
      
      const lastClient = querySnapshot.docs[0].data()
      return (lastClient.ID || 0) + 1
    } catch (error) {
      console.error("Error generating client ID:", error)
      return Date.now() // استخدام timestamp كبديل
    }
  }

  const validateForm = (): boolean => {
    // التحقق من الحقول المطلوبة
    if (!formData.Name.trim()) {
      setError("يرجى إدخال اسم العميل")
      return false
    }

    if (!formData.Mobile.trim()) {
      setError("يرجى إدخال رقم الجوال")
      return false
    }

    // التحقق من أن رقم الموبايل يحتوي على أرقام فقط
    const mobileRegex = /^\d+$/
    if (!mobileRegex.test(formData.Mobile.trim())) {
      setError("رقم الموبايل يجب أن يحتوي على أرقام فقط")
      return false
    }

    if (!formData.IDBranch || formData.IDBranch <= 0) {
      setError("يرجى اختيار الفرع")
      return false
    }

    return true
  }

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const clientsRef = collection(db, "Dealing_Clients")
      const q = query(clientsRef, where("UserName", "==", username.trim()))
      const querySnapshot = await getDocs(q)
      return !querySnapshot.empty
    } catch (error) {
      console.error("Error checking username:", error)
      return false
    }
  }

  const checkMobileExists = async (mobile: string): Promise<boolean> => {
    try {
      const clientsRef = collection(db, "Dealing_Clients")
      
      // التحقق من وجود الرقم في عمود Mobile
      const mobileQuery = query(clientsRef, where("Mobile", "==", mobile.trim()))
      const mobileSnapshot = await getDocs(mobileQuery)
      if (!mobileSnapshot.empty) {
        return true
      }
      
      // التحقق من وجود الرقم في عمود Phone
      const phoneQuery = query(clientsRef, where("Phone", "==", mobile.trim()))
      const phoneSnapshot = await getDocs(phoneQuery)
      if (!phoneSnapshot.empty) {
        return true
      }
      
      return false
    } catch (error) {
      console.error("Error checking mobile:", error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // التحقق من صحة النموذج
      if (!validateForm()) {
        return
      }

      // التحقق من عدم تكرار رقم الموبايل
      const mobileExists = await checkMobileExists(formData.Mobile)
      if (mobileExists) {
        setError("رقم الموبايل مسجل بالفعل، يرجى استخدام رقم آخر")
        return
      }

      // تعبئة UserName و Password برقم الموبايل تلقائياً
      const mobileNumber = formData.Mobile.trim()
      const autoUsername = mobileNumber
      const autoPassword = mobileNumber

      // التحقق من عدم تكرار اسم المستخدم (رقم الموبايل)
      const usernameExists = await checkUsernameExists(autoUsername)
      if (usernameExists) {
        setError("رقم الموبايل مسجل كاسم مستخدم، يرجى استخدام رقم آخر")
        return
      }

      // إنشاء بيانات العميل
      const clientID = await generateClientID()
      const clientCode = await generateClientCode()
      const now = new Date()

      const newClient: Client = {
        ID: clientID,
        IDBranch: formData.IDBranch || 1,
        Code: clientCode,
        Name: formData.Name.trim(),
        IsActive: true, // القيمة الافتراضية
        CurrentBalance: 0,
        BalanceType: formData.BalanceType,
        Mobile: formData.Mobile.trim(),
        Phone: formData.Phone.trim(),
        Address: formData.Address.trim(),
        EMail: formData.EMail.trim(),
        Note: formData.Note.trim(),
        IDPriceType: 2, // القيمة الافتراضية
        CreditLimit: formData.CreditLimit,
        LocationLink: formData.LocationLink || "",
        LocationLatitude: Number(formData.LocationLatitude) || 0,
        LocationLongitude: Number(formData.LocationLongitude) || 0,
        LocationImage: "",
        IsClientShopOnly: true, // القيمة الافتراضية
        UserName: autoUsername, // رقم الموبايل تلقائياً
        Password: autoPassword, // رقم الموبايل تلقائياً
        CreatedDate: now.toISOString().split('T')[0], // التاريخ بصيغة YYYY-MM-DD
        CreatedTime: now.toTimeString().split(' ')[0], // الوقت بصيغة HH:MM:SS
        CreatedDateTime: now.toISOString() // التاريخ والوقت الكامل
      }

             // حفظ العميل في Firebase مع Document ID رقمي
       const clientDocRef = doc(db, "Dealing_Clients", String(clientID))
       await setDoc(clientDocRef, newClient)

      setSuccess(`تم إنشاء حساب العميل بنجاح! 
      بيانات تسجيل الدخول:
      اسم المستخدم: ${autoUsername}
      كلمة المرور: ${autoPassword}
      يمكنك الآن تسجيل الدخول وتغيير كلمة المرور لاحقاً`)
      
             // إعادة تعيين النموذج مع الحفاظ على القيم الافتراضية
       setFormData({
         Name: "",
         UserName: "",
         Password: "",
         ConfirmPassword: "",
         EMail: "",
         Mobile: "",
         Phone: "",
         Address: "",
         Note: "",
         IDBranch: formData.IDBranch, // الحفاظ على الفرع الافتراضي
         IDPriceType: 2, // القيمة الافتراضية
         BalanceType: formData.BalanceType, // الحفاظ على نوع الرصيد الافتراضي (مدين عليه)
         CreditLimit: 0,
         IsActive: true, // القيمة الافتراضية
         IsClientShopOnly: true, // القيمة الافتراضية
         LocationLatitude: 0,
         LocationLongitude: 0,
         LocationLink: ""
       })

      // الانتقال إلى صفحة تسجيل الدخول بعد ثانيتين
      setTimeout(() => {
        router.push("/account_client/client-login")
      }, 2000)

    } catch (error) {
      console.error("Registration error:", error)
      setError("حدث خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى")
    } finally {
      setLoading(false)
    }
  }

  console.log("Current branches state:", branches)
  console.log("Current formData.IDBranch:", formData.IDBranch)
  console.log("Selected branch exists:", branches.find(b => b.ID === formData.IDBranch))
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/maka-star-logo.png" 
              alt="مكه ستار" 
              className="w-16 h-16 object-contain mr-3"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">مكة ستار</h1>
              <p className="text-gray-600">إنشاء حساب عميل جديد</p>
            </div>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-1" />
            انضم إلينا واستمتع بخدماتنا المميزة
          </div>
        </div>

        {/* Registration Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              إنشاء حساب جديد
            </CardTitle>
            <p className="text-gray-600">
              أدخل بياناتك لإنشاء حساب عميل جديد
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Checkboxes مخفية - القيم الافتراضية */}
              <div className="hidden">
                <Checkbox
                  id="IsActive"
                  checked={true}
                  onCheckedChange={() => {}}
                />
                <Checkbox
                  id="IsClientShopOnly"
                  checked={true}
                  onCheckedChange={() => {}}
                />
              </div>
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="Name" className="text-sm font-medium text-gray-700">
                    اسم العميل *
                  </Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="Name"
                      name="Name"
                      type="text"
                      placeholder="أدخل الاسم الكامل"
                      value={formData.Name}
                      onChange={handleInputChange}
                      className="pr-10 text-right"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="EMail" className="text-sm font-medium text-gray-700">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="EMail"
                      name="EMail"
                      type="email"
                      //placeholder="أدخل البريد الإلكتروني"
                      value={formData.EMail}
                      onChange={handleInputChange}
                      className="pr-10 text-right"
                      disabled={loading}
                     //required
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <Label htmlFor="Mobile" className="text-sm font-medium text-gray-700">
                    رقم الجوال *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="Mobile"
                      name="Mobile"
                      type="tel"
                      placeholder="أدخل رقم الجوال"
                      value={formData.Mobile}
                      onChange={handleInputChange}
                      className="pr-10 text-right"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="Phone" className="text-sm font-medium text-gray-700">
                    رقم الهاتف
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="Phone"
                      name="Phone"
                      type="tel"
                      placeholder="أدخل رقم الهاتف"
                      value={formData.Phone}
                      onChange={handleInputChange}
                      className="pr-10 text-right"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="Address" className="text-sm font-medium text-gray-700">
                  العنوان
                </Label>
                <div className="space-y-2">
                  <div className="relative">
                    <MapPin className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
                    <Textarea
                      id="Address"
                      name="Address"
                      placeholder="أدخل العنوان الكامل"
                      value={formData.Address}
                      onChange={handleInputChange}
                      className="pr-10 text-right"
                      disabled={loading}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button type="button" onClick={getCurrentLocation} disabled={loading || locationLoading}>
                      {locationLoading ? 'جارِ تحديد الموقع...' : 'تحديد موقعي تلقائياً'}
                    </Button>
                    <Input
                      value={formData.LocationLatitude ? String(formData.LocationLatitude) : ''}
                      onChange={(e) => setFormData(p => ({ ...p, LocationLatitude: Number(e.target.value) || 0 }))}
                      placeholder="Latitude"
                      className="text-center"
                      disabled={loading}
                    />
                    <Input
                      value={formData.LocationLongitude ? String(formData.LocationLongitude) : ''}
                      onChange={(e) => setFormData(p => ({ ...p, LocationLongitude: Number(e.target.value) || 0 }))}
                      placeholder="Longitude"
                      className="text-center"
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      value={formData.LocationLink}
                      onChange={(e) => setFormData(p => ({ ...p, LocationLink: e.target.value }))}
                      placeholder="رابط الخريطة (Google Maps)"
                      className="md:col-span-2"
                      disabled={loading}
                    />
                    {formData.LocationLink && (
                      <Button type="button" variant="outline" asChild>
                        <a href={formData.LocationLink} target="_blank" rel="noopener noreferrer">فتح على الخريطة</a>
                      </Button>
                    )}
                  </div>

                  {locationError && (
                    <Alert variant="destructive">
                      <AlertDescription>{locationError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Login Information - مخفية تلقائياً */}
              <div className="hidden">
                {/* Username - سيتم ملؤه تلقائياً برقم الموبايل */}
                <div className="space-y-2">
                  <Label htmlFor="UserName" className="text-sm font-medium text-gray-700">
                    اسم المستخدم (سيتم ملؤه تلقائياً)
                  </Label>
                  <Input
                    id="UserName"
                    name="UserName"
                    type="text"
                    value="سيتم ملؤه تلقائياً برقم الموبايل"
                    className="bg-gray-100 text-gray-600"
                    readOnly
                  />
                </div>

                {/* Password - سيتم ملؤه تلقائياً برقم الموبايل */}
                <div className="space-y-2">
                  <Label htmlFor="Password" className="text-sm font-medium text-gray-700">
                    كلمة المرور (سيتم ملؤها تلقائياً)
                  </Label>
                  <Input
                    id="Password"
                    name="Password"
                    type="text"
                    value="سيتم ملؤها تلقائياً برقم الموبايل"
                    className="bg-gray-100 text-gray-600"
                    readOnly
                  />
                </div>

                {/* Confirm Password - سيتم ملؤه تلقائياً برقم الموبايل */}
                <div className="space-y-2">
                  <Label htmlFor="ConfirmPassword" className="text-sm font-medium text-gray-700">
                    تأكيد كلمة المرور (سيتم ملؤه تلقائياً)
                  </Label>
                  <Input
                    id="ConfirmPassword"
                    name="ConfirmPassword"
                    type="text"
                    value="سيتم ملؤه تلقائياً برقم الموبايل"
                    className="bg-gray-400 text-gray-600"
                    readOnly
                  />
                </div>
              </div>

              {/* ملاحظة حول بيانات تسجيل الدخول */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">ملاحظة مهمة:</p>
                    <p>سيتم إنشاء اسم المستخدم وكلمة المرور تلقائياً برقم الموبايل المدخل.</p>
                    <p className="mt-1">يمكن للعميل تغيير كلمة المرور لاحقاً من صفحة الملف الشخصي.</p>
                  </div>
                </div>
              </div>

            
              {/* Additional Information */}
              <div className="space-y-2">
                <Label htmlFor="Note" className="text-sm font-medium text-gray-700">
                  ملاحظات
                </Label>
                <Textarea
                  id="Note"
                  name="Note"
                  placeholder="أدخل أي ملاحظات إضافية"
                  value={formData.Note}
                  onChange={handleInputChange}
                  className="text-right"
                  disabled={loading}
                  rows={3}
                />
              </div>

              {/* حقول للقراءة فقط - القيم الافتراضية */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">الفرع * ({branches.length} فرع)</Label>
                                     <Select 
                     value={formData.IDBranch > 0 ? String(formData.IDBranch) : ""} 
                     onValueChange={(value) => handleSelectChange("IDBranch", value)}
                     disabled={loading}
                   >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder={`اختر الفرع (${branches.length} متاح)`} />
                    </SelectTrigger>
                                         <SelectContent>
                       {branches.length === 0 ? (
                         <SelectItem value="no-branches" disabled>
                           لا توجد فروع متاحة
                         </SelectItem>
                       ) : (
                         branches.map((branch) => (
                           <SelectItem key={branch.ID} value={String(branch.ID)}>
                             {branch.Name}
                           </SelectItem>
                         ))
                       )}
                     </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">نوع الرصيد</Label>
                                     <Select 
                     value={formData.BalanceType > 0 ? String(formData.BalanceType) : ""} 
                     onValueChange={(value) => handleSelectChange("BalanceType", value)}
                     disabled={loading}
                   >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر نوع الرصيد" />
                    </SelectTrigger>
                                         <SelectContent>
                       {balanceTypes.length === 0 ? (
                         <SelectItem value="no-balance-types" disabled>
                           لا توجد أنواع رصيد متاحة
                         </SelectItem>
                       ) : (
                         balanceTypes.map((balanceType) => (
                           <SelectItem key={balanceType.ID} value={String(balanceType.ID)}>
                             {balanceType.Name}
                           </SelectItem>
                         ))
                       )}
                     </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">نوع السعر</Label>
                  <Input
                    value="سعر 2"
                    readOnly
                    className="bg-gray-100 text-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">حالة النشاط</Label>
                  <Input
                    value="نشط"
                    readOnly
                    className="bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
 
              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري إنشاء الحساب...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    إنشاء الحساب
                  </div>
                )}
              </Button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                <p>بإنشاء الحساب، أنت توافق على شروط الاستخدام وسياسة الخصوصية</p>
                <p className="mt-1">للمساعدة، تواصل مع خدمة العملاء</p>
              </div>
            </div>

            {/* Back to Login */}
            <div className="mt-4">
              <Button variant="outline" asChild className="w-full">
                              <Link href="/account_client/client-login">
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة لتسجيل الدخول
              </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 مكة ستار. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  )
}
