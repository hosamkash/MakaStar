"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, doc, getDocs, getDoc, setDoc, query, orderBy, limit, runTransaction } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Save, Printer, ArrowLeft, MapPin, X } from "lucide-react"
import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"

type Employee = {
  ID: number
  IDBranch: number
  Code: number
  Name: string
  IsActive: boolean
  IsBindShop: boolean
  Phone: string
  Mobile: string
  Address: string
  NationalID: string
  BirthDate: string
  Age: number
  IDMaritalStatus: number
  ChildrenCount: number
  IDReligions: number
  IDGender: number
  IDMilitaryStatus: number
  Qualification: string
  IDJob: number
  IDDepartment: number
  DateHiring: string
  TimeWorkFrom: string
  TimeWorkTo: string
  TimeTotalWorkHour: number
  MonthlyVacationDays: number
  ExpiryDateJob: string
  LeavingReson: string
  SalaryMonthValue: number
  SalaryWeekValue: number
  SalaryDayValue: number
  SalaryHourValue: number
  MonthlyTarget: number
  MonthlyCommissionExecute: number
  MonthlyCommissionNotExecute: number
  DailyTarget: number
  DailyCommissionExecute: number
  DailyCommissionNotExecute: number
  CommissionSales1: number
  CommissionSalesReturned1: number
  CommissionSales2: number
  CommissionSalesReturned2: number
  CommissionSales3: number
  CommissionSalesReturned3: number
  CommissionSales4: number
  CommissionSalesReturned4: number
  CommissionSales5: number
  CommissionSalesReturned5: number
  RelativeName1: string
  RelativeMobile1: string
  RelativeType1: string
  RelativeName2: string
  RelativeMobile2: string
  RelativeType2: string
  RelativeName3: string
  RelativeMobile3: string
  RelativeType3: string
  RelativeName4: string
  RelativeMobile4: string
  RelativeType4: string
  ImageName: string
  ImageURL: string
  UserName: string
  Password: string
  LoginIsAdmin: boolean
}

type Branch = {
  ID: number
  Name: string
}

export default function EmployeeFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [formData, setFormData] = useState<Employee>({
    ID: 0,
    IDBranch: 0,
    Code: 0,
    Name: "",
    IsActive: true,
    IsBindShop: false,
    Phone: "",
    Mobile: "",
    Address: "",
    NationalID: "",
    BirthDate: "",
    Age: 0,
    IDMaritalStatus: 0,
    ChildrenCount: 0,
    IDReligions: 0,
    IDGender: 0,
    IDMilitaryStatus: 0,
    Qualification: "",
    IDJob: 0,
    IDDepartment: 0,
    DateHiring: "",
    TimeWorkFrom: "",
    TimeWorkTo: "",
    TimeTotalWorkHour: 0,
    MonthlyVacationDays: 0,
    ExpiryDateJob: "",
    LeavingReson: "",
    SalaryMonthValue: 0,
    SalaryWeekValue: 0,
    SalaryDayValue: 0,
    SalaryHourValue: 0,
    MonthlyTarget: 0,
    MonthlyCommissionExecute: 0,
    MonthlyCommissionNotExecute: 0,
    DailyTarget: 0,
    DailyCommissionExecute: 0,
    DailyCommissionNotExecute: 0,
    CommissionSales1: 0,
    CommissionSalesReturned1: 0,
    CommissionSales2: 0,
    CommissionSalesReturned2: 0,
    CommissionSales3: 0,
    CommissionSalesReturned3: 0,
    CommissionSales4: 0,
    CommissionSalesReturned4: 0,
    CommissionSales5: 0,
    CommissionSalesReturned5: 0,
    RelativeName1: "",
    RelativeMobile1: "",
    RelativeType1: "",
    RelativeName2: "",
    RelativeMobile2: "",
    RelativeType2: "",
    RelativeName3: "",
    RelativeMobile3: "",
    RelativeType3: "",
    RelativeName4: "",
    RelativeMobile4: "",
    RelativeType4: "",
    ImageName: "",
    ImageURL: "",
    UserName: "",
    Password: "",
    LoginIsAdmin: false
  })

  const [branches, setBranches] = useState<Branch[]>([])
  const [jobs, setJobs] = useState<{ID: number, Name: string}[]>([])
  const [departments, setDepartments] = useState<{ID: number, Name: string}[]>([])
  const [maritalStatuses, setMaritalStatuses] = useState<{ID: number, Name: string}[]>([])
  const [religions, setReligions] = useState<{ID: number, Name: string}[]>([])
  const [genders, setGenders] = useState<{ID: number, Name: string}[]>([])
  const [militaryStatuses, setMilitaryStatuses] = useState<{ID: number, Name: string}[]>([])
  const [relativeTypes, setRelativeTypes] = useState<{ID: number, Name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")
  const [attachments, setAttachments] = useState<string[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [profileUrl, setProfileUrl] = useState<string | null>(null)
  const [uploadingProfile, setUploadingProfile] = useState(false)
  const [cameraTargetName, setCameraTargetName] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let finalValue: string | number = value

    // التعامل مع الحقول الرقمية
    if (['Code', 'Age', 'ChildrenCount', 'IDMaritalStatus', 'IDReligions', 'IDGender', 'IDMilitaryStatus', 'IDJob', 'IDDepartment', 'TimeTotalWorkHour', 'MonthlyVacationDays', 'SalaryMonthValue', 'SalaryWeekValue', 'SalaryDayValue', 'SalaryHourValue', 'MonthlyTarget', 'MonthlyCommissionExecute', 'MonthlyCommissionNotExecute', 'DailyTarget', 'DailyCommissionExecute', 'DailyCommissionNotExecute', 'CommissionSales1', 'CommissionSalesReturned1', 'CommissionSales2', 'CommissionSalesReturned2', 'CommissionSales3', 'CommissionSalesReturned3', 'CommissionSales4', 'CommissionSalesReturned4', 'CommissionSales5', 'CommissionSalesReturned5'].includes(name)) {
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
      if (id) {
        const docRef = doc(db, "Dealing_Employees", String(formData.ID))
        await setDoc(docRef, formData)
      } else {
        await runTransaction(db, async (transaction) => {
          const counterRef = doc(db, "Counters", "Dealing_Employees")
          const counterSnap = await transaction.get(counterRef)
          let lastId = 0
          if (counterSnap.exists()) {
            const data = counterSnap.data() as { lastId?: number }
            lastId = data.lastId || 0
          }
          const nextId = lastId + 1
          transaction.set(counterRef, { lastId: nextId }, { merge: true })
          const employeeRef = doc(db, "Dealing_Employees", String(nextId))
          transaction.set(employeeRef, { ...formData, ID: nextId, Code: nextId })
        })
      }
      notify.success("تم حفظ بيانات الموظف بنجاح")
      router.push("/admin/dealings/employees?refresh=true")
    } catch (error) {
      console.error("Error saving employee:", error)
      notify.error("حدث خطأ أثناء حفظ بيانات الموظف")
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch branches from Def_CompanyStructure
        const branchesCollection = collection(db, "Def_CompanyStructure")
        const branchesSnapshot = await getDocs(branchesCollection)
        const branchesData = branchesSnapshot.docs.map((doc, index) => {
          const data = doc.data()
          const docId = parseInt(doc.id)
          return {
            ID: docId || (index + 1000),
            Name: data.Name || ''
          }
        }).sort((a, b) => a.ID - b.ID)
        const uniqueBranches = branchesData.filter((branch, index, self) => 
          index === self.findIndex(b => b.ID === branch.ID)
        ).map((branch, index) => ({
          ...branch,
          ID: branch.ID || (index + 1000)
        }))
        setBranches(uniqueBranches)

        // Fetch jobs from Def_Jobs
        const jobsCollection = collection(db, "Def_Jobs")
        const jobsSnapshot = await getDocs(jobsCollection)
        const jobsData = jobsSnapshot.docs.map((doc, index) => {
          const data = doc.data()
          const docId = parseInt(doc.id)
          return {
            ID: docId || (index + 1000),
            Name: data.Name || ''
          }
        }).sort((a, b) => a.ID - b.ID)
        setJobs(jobsData)

                 // Fetch departments from Def_Sections
         const departmentsCollection = collection(db, "Def_Sections")
         const departmentsSnapshot = await getDocs(departmentsCollection)
         const departmentsData = departmentsSnapshot.docs.map((doc, index) => {
           const data = doc.data()
           const docId = parseInt(doc.id)
           return {
             ID: docId || (index + 1000),
             Name: data.Name || ''
           }
         }).sort((a, b) => a.ID - b.ID)
         setDepartments(departmentsData)

                 // Fetch marital statuses from Fix_MaritalStatus
         const maritalStatusCollection = collection(db, "Fix_MaritalStatus")
         const maritalStatusSnapshot = await getDocs(maritalStatusCollection)
         const maritalStatusData = maritalStatusSnapshot.docs.map((doc, index) => {
           const data = doc.data()
           const docId = parseInt(doc.id)
           return {
             ID: docId || (index + 1000),
             Name: data.Name || ''
           }
         }).sort((a, b) => a.ID - b.ID)
         setMaritalStatuses(maritalStatusData)

        // Fetch religions from Def_Religions
        const religionsCollection = collection(db, "Def_Religions")
        const religionsSnapshot = await getDocs(religionsCollection)
        const religionsData = religionsSnapshot.docs.map((doc, index) => {
          const data = doc.data()
          const docId = parseInt(doc.id)
          return {
            ID: docId || (index + 1000),
            Name: data.Name || ''
          }
        }).sort((a, b) => a.ID - b.ID)
        setReligions(religionsData)

                           // Fetch genders from Fix_Gender
          const gendersCollection = collection(db, "Fix_Gender")
          const gendersSnapshot = await getDocs(gendersCollection)
          const gendersData = gendersSnapshot.docs.map((doc, index) => {
            const data = doc.data()
            const docId = parseInt(doc.id)
            return {
              ID: docId || (index + 1000),
              Name: data.Name || ''
            }
          }).sort((a, b) => a.ID - b.ID)
          setGenders(gendersData)

                   // Fetch military statuses from Fix_MilitaryStatus
          const militaryStatusCollection = collection(db, "Fix_MilitaryStatus")
          const militaryStatusSnapshot = await getDocs(militaryStatusCollection)
          const militaryStatusData = militaryStatusSnapshot.docs.map((doc, index) => {
            const data = doc.data()
            const docId = parseInt(doc.id)
            return {
              ID: docId || (index + 1000),
              Name: data.Name || ''
            }
          }).sort((a, b) => a.ID - b.ID)
          setMilitaryStatuses(militaryStatusData)

         // Fetch relative types from Def_RelativeTypes
         const relativeTypesCollection = collection(db, "Def_RelativeTypes")
         const relativeTypesSnapshot = await getDocs(relativeTypesCollection)
         const relativeTypesData = relativeTypesSnapshot.docs.map((doc, index) => {
           const data = doc.data()
           const docId = parseInt(doc.id)
           return {
             ID: docId || (index + 1000),
             Name: data.Name || ''
           }
         }).sort((a, b) => a.ID - b.ID)
         setRelativeTypes(relativeTypesData)

         // If editing, fetch employee data
        if (id) {
          const employeeDoc = await getDoc(doc(db, "Dealing_Employees", id))
          if (employeeDoc.exists()) {
            const employeeData = employeeDoc.data() as Employee
            setFormData(employeeData)
            setProfileUrl(employeeData.ImageURL || null)
            try {
              await loadAttachments(employeeData.ID)
              await loadProfileImage(employeeData.ID)
            } catch {}
          }
        } else {
          // If new employee, get max ID
          const employeesRef = collection(db, "Dealing_Employees")
          const q = query(employeesRef, orderBy("ID", "desc"), limit(1))
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

  const loadAttachments = async (empId?: number) => {
    const employeeId = empId ?? formData.ID
    if (!employeeId) return
    setLoadingAttachments(true)
    try {
      const folderRef = ref(storage, `Application/Dealing_Employees/${employeeId}`)
      const result = await listAll(folderRef)
      const urls = await Promise.all(result.items.map(getDownloadURL))
      setAttachments(urls)
    } catch {
      setAttachments([])
    } finally {
      setLoadingAttachments(false)
    }
  }

  const loadProfileImage = async (empId?: number) => {
    const employeeId = empId ?? formData.ID
    if (!employeeId) return
    try {
      const fileRef = ref(storage, `Application/Dealing_Employees/${employeeId}/profile.jpg`)
      const url = await getDownloadURL(fileRef)
      setProfileUrl(url)
    } catch (err) {
      setProfileUrl(null)
    }
  }

  // Ensure profile image loads when opening the attachments tab
  useEffect(() => {
    if (activeTab === 'attachments' && formData.ID) {
      // Load only if not already loaded
      if (!profileUrl) {
        loadProfileImage(formData.ID)
      }
      if (attachments.length === 0 && !loadingAttachments) {
        loadAttachments(formData.ID)
      }
    }
  }, [activeTab])

  // Camera helpers
  const openCamera = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      alert('الكاميرا غير مدعومة في هذا الجهاز/المتصفح')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      setCameraStream(stream)
      setShowCamera(true)
    } catch (err) {
      console.error('Error opening camera', err)
      alert('تعذر فتح الكاميرا. يرجى السماح بالأذونات أو استخدام رفع ملف.')
    }
  }

  const closeCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop())
    setCameraStream(null)
    setShowCamera(false)
  }

  const captureAndUpload = async () => {
    if (!cameraStream || !formData.ID) return
    try {
      const video = document.getElementById('employee-camera-video') as HTMLVideoElement | null
      if (!video) return
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.9))
      if (!blob) return
      const folderRef = ref(storage, `Application/Dealing_Employees/${formData.ID}`)
      const fileName = cameraTargetName || `${Date.now()}_camera.jpg`
      const fileRef = ref(folderRef, fileName)
      await uploadBytes(fileRef, blob)
      if (fileName === 'profile.jpg') {
        const url = await getDownloadURL(fileRef)
        try {
          await setDoc(doc(db, 'Dealing_Employees', String(formData.ID)), {
            ImageName: 'profile.jpg',
            ImageURL: url,
          }, { merge: true })
        } catch {}
        setFormData(prev => ({ ...prev, ImageName: 'profile.jpg', ImageURL: url }))
        setProfileUrl(url)
        await loadProfileImage()
      }
      await loadAttachments()
      closeCamera()
    } catch (err) {
      console.error('Error capturing/uploading', err)
      alert('تعذر حفظ الصورة الملتقطة')
    }
  }

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
      onClick: () => router.push("/admin/dealings/employees"),
      variant: "destructive" as const 
    },
  ]

  if (loading) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-[80%]">
      <PageHeader title="بيانات الموظف" actionButtons={actionButtons} />
      

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-6 mb-5">
          <TabsTrigger value="personal">الشخصية</TabsTrigger>
          <TabsTrigger value="job">الوظيفية</TabsTrigger>
          <TabsTrigger value="relatives">الأقارب</TabsTrigger>
          <TabsTrigger value="salary">الراتب</TabsTrigger>
          <TabsTrigger value="user">المستخدم</TabsTrigger>
          <TabsTrigger value="attachments">المرفقات</TabsTrigger>
        </TabsList>

        {/* الشخصية */}
        <TabsContent value="personal">
          <Card>
            <CardContent className="p-6 space-y-6">
              
                {/* القسم الرئيسي - عمودين */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* العمود الأيمن */}
                 <div className="space-y-4">
                   {/* الفرع */}
                   <div className="space-y-2">
                     <Label htmlFor="IDBranch">الفرع</Label>
                     <Select 
                       value={String(formData.IDBranch)} 
                       onValueChange={(value) => handleSelectChange("IDBranch", value)}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="الفرع" />
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

                  {/* نشط */}
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

                   {/* الكود */}
                <div className="space-y-2">
                  <Label htmlFor="Code">الكود</Label>
                  <Input 
                    id="Code"
                    name="Code"
                    type="number" 
                                         value={formData.Code || 0}
                    disabled
                    onChange={handleInputChange}
                  />
                </div>

                   {/* الموبايل */}
                   <div className="space-y-2">
                     <Label htmlFor="Mobile">الموبيل</Label>
                     <div className="relative">
                       <Input 
                         id="Mobile"
                         name="Mobile"
                         value={formData.Mobile}
                         onChange={handleInputChange}
                         className="pr-10"
                       />
                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">📱</span>
                     </div>
                   </div>

                    {/* الحالة الاجتماعية */}
                    <div className="space-y-2">
                      <Label htmlFor="IDMaritalStatus">الحالة الاجتماعية</Label>
                      <Select 
                        value={String(formData.IDMaritalStatus)} 
                        onValueChange={(value) => handleSelectChange("IDMaritalStatus", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة الاجتماعية" />
                        </SelectTrigger>
                        <SelectContent>
                          {maritalStatuses.map((status) => (
                            <SelectItem key={status.ID} value={String(status.ID)}>
                              {status.Name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  {/* تاريخ الميلاد */}
                   <div className="space-y-2">
                     <Label htmlFor="BirthDate">تاريخ الميلاد</Label>
                     <div className="relative">
                       <Input 
                         id="BirthDate"
                         name="BirthDate"
                         type="date"
                         value={formData.BirthDate}
                         onChange={handleInputChange}
                         className="pr-10"
                       />
                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">📅</span>
                     </div>
                   </div>

                     {/* الحالة العسكرية */}
                     <div className="space-y-2">
                       <Label htmlFor="IDMilitaryStatus">الحالة العسكرية</Label>
                       <Select 
                         value={String(formData.IDMilitaryStatus)} 
                         onValueChange={(value) => handleSelectChange("IDMilitaryStatus", value)}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="اختر الحالة العسكرية" />
                         </SelectTrigger>
                         <SelectContent>
                           {militaryStatuses.map((status) => (
                             <SelectItem key={status.ID} value={String(status.ID)}>
                               {status.Name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                 </div>
            
                {/* ========================================================================== */}
               
                 {/* العمود الأيسر */}
                 <div className="space-y-4">
                
                 {/* الإسم */}
                 <div className="space-y-2">
                     <Label htmlFor="Name">الإسم</Label>
                     <Input 
                       id="Name"
                       name="Name"
                       value={formData.Name}
                       onChange={handleInputChange}
                       placeholder="الإسم"
                     />
                   </div>
                
                  {/* الموظف الرئيسي للمتجر */}
                  <div className="space-y-2">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox 
                      id="IsBindShop"
                      checked={formData.IsBindShop}
                      onCheckedChange={(checked) => handleCheckboxChange("IsBindShop", checked === true)}
                    />
                    <Label htmlFor="IsBindShop">الموظف الرئيسي للمتجر</Label>
                  </div>
                </div>

                  {/* الرقم القومي */}
                  <div className="space-y-2">
                     <Label htmlFor="NationalID">الرقم القومي</Label>
                     <Input 
                       id="NationalID"
                       name="NationalID"
                       value={formData.NationalID}
                       onChange={handleInputChange}
                     />
                   </div>

                   {/* الهاتف */}
                   <div className="space-y-2">
                     <Label htmlFor="Phone">الهاتف</Label>
                     <div className="relative">
                       <Input 
                         id="Phone"
                         name="Phone"
                         value={formData.Phone}
                         onChange={handleInputChange}
                         className="pr-10"
                       />
                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">📞</span>
                     </div>
                   </div>

                      {/* عدد الأولاد */}
                      <div className="space-y-2">
                     <Label htmlFor="ChildrenCount">عدد الأولاد</Label>
                     <div className="relative">
                       <Input 
                         id="ChildrenCount"
                         name="ChildrenCount"
                         type="number"
                         value={formData.ChildrenCount || 0}
                         onChange={handleInputChange}
                         className="pr-10"
                       />
                       <button 
                         type="button"
                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                         onClick={() => setFormData(prev => ({ ...prev, ChildrenCount: 0 }))}
                       >
                         ✕
                       </button>
                     </div>
                   </div>

                    {/* العمر - السن */}
                    <div className="space-y-2">
                     <Label htmlFor="Age">العمر - السن</Label>
                     <div className="relative">
                       <Input 
                         id="Age"
                         name="Age"
                         type="number"
                         value={formData.Age || 0}
                         onChange={handleInputChange}
                         className="pr-10"
                       />
                       <button 
                         type="button"
                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                         onClick={() => setFormData(prev => ({ ...prev, Age: 0 }))}
                       >
                         ✕
                       </button>
                     </div>
                   </div>

                  {/* الجنس */}
                 <div className="space-y-2">
                       <Label htmlFor="IDGender">الجنس</Label>
                       <Select 
                         value={String(formData.IDGender)} 
                         onValueChange={(value) => handleSelectChange("IDGender", value)}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="اختر الجنس" />
                         </SelectTrigger>
                         <SelectContent>
                           {genders.map((gender) => (
                             <SelectItem key={gender.ID} value={String(gender.ID)}>
                               {gender.Name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                   
                 </div>
                 
               </div>
                 
  {/* المؤهل العلمي */}
  <div className="space-y-2">
                       <Label htmlFor="Qualification">المؤهل العلمي</Label>
                       <Input 
                         id="Qualification"
                         name="Qualification"
                         value={formData.Qualification}
                         onChange={handleInputChange}
                       />
                     </div>

                  {/* العنوان */}
                  <div className="space-y-2">
                     <Label htmlFor="Address">العنوان</Label>
                     <Input 
                       id="Address"
                       name="Address"
                       value={formData.Address}
                       onChange={handleInputChange}
                     />
                   </div>


            </CardContent>
            
          </Card>
          
        </TabsContent>

        {/* المرفقات */}
        <TabsContent value="attachments">
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* الصورة الشخصية */}
              <div className="flex items-start gap-4">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {profileUrl ? (
                    <img src={profileUrl} alt="صورة الموظف" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">لا توجد صورة</div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="profile-file" className="px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
                      {uploadingProfile ? '...جار الرفع' : 'رفع صورة شخصية'}
                    </label>
                    <button type="button" onClick={() => { setCameraTargetName('profile.jpg'); openCamera() }} className="px-3 py-2 border rounded hover:bg-gray-50">
                      تصوير بالكاميرا
                    </button>
                  </div>
                  <input id="profile-file" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const inputEl = e.currentTarget as HTMLInputElement
                    const file = inputEl.files?.[0]
                    if (!file || !formData.ID) return
                    setUploadingProfile(true)
                    try {
                      const folderRef = ref(storage, `Application/Dealing_Employees/${formData.ID}`)
                      const fileRef = ref(folderRef, 'profile.jpg')
                      await uploadBytes(fileRef, file)
                      const url = await getDownloadURL(fileRef)
                      try {
                        await setDoc(doc(db, 'Dealing_Employees', String(formData.ID)), {
                          ImageName: 'profile.jpg',
                          ImageURL: url,
                        }, { merge: true })
                      } catch {}
                      setFormData(prev => ({ ...prev, ImageName: 'profile.jpg', ImageURL: url }))
                      setProfileUrl(url)
                      await loadProfileImage()
                    } finally {
                      setUploadingProfile(false)
                      if (inputEl) inputEl.value = ""
                    }
                  }} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">رفع صور الموظف إلى Firebase Storage</p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="attachments-file" className="px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
                    رفع من الجهاز
                  </label>
                  <input id="attachments-file" type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                    const inputEl = e.currentTarget as HTMLInputElement
                    const files = inputEl.files
                    if (!files || !formData.ID) return
                    setLoadingAttachments(true)
                    try {
                      const folderRef = ref(storage, `Application/Dealing_Employees/${formData.ID}`)
                      const uploads = Array.from(files).map(async (file) => {
                        const fileRef = ref(folderRef, `${Date.now()}_${file.name}`)
                        await uploadBytes(fileRef, file)
                      })
                      await Promise.all(uploads)
                      await loadAttachments()
                    } finally {
                      setLoadingAttachments(false)
                      if (inputEl) inputEl.value = ""
                    }
                  }} />
                  <button type="button" onClick={openCamera} className="px-3 py-2 border rounded hover:bg-gray-50">
                    فتح الكاميرا
                  </button>
                </div>
              </div>
              <div className="border-t pt-4">
                {loadingAttachments ? (
                  <div className="text-center text-sm text-gray-500">جاري تحميل المرفقات...</div>
                ) : attachments.length === 0 ? (
                  <div className="text-center text-sm text-gray-500">لا توجد مرفقات</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {attachments.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`attachment-${idx}`} className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!formData.ID) return
                            try {
                              const folderPath = `Application/Dealing_Employees/${formData.ID}`
                              const pathPart = decodeURIComponent(url.split('?')[0])
                              const name = pathPart.substring(pathPart.lastIndexOf('/') + 1)
                              if (!name) return
                              await deleteObject(ref(storage, `${folderPath}/${name}`))
                              await loadAttachments()
                            } catch {}
                          }}
                          className="absolute top-2 left-2 bg-white/80 hover:bg-white text-red-600 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {showCamera && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-4 w-[90vw] max-w-xl flex flex-col gap-3">
                    <div className="relative w-full aspect-video bg-black rounded">
                      <video id="employee-camera-video" className="w-full h-full" autoPlay playsInline muted
                        ref={(el) => { if (el && cameraStream) el.srcObject = cameraStream }} />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={closeCamera} className="px-3 py-2 border rounded">إلغاء</button>
                      <button type="button" onClick={captureAndUpload} className="px-3 py-2 bg-blue-600 text-white rounded">التقاط وحفظ</button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

          {/* الوظيفة والقسم */}
        <TabsContent value="job">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* الوظيفة والقسم */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="IDJob">الوظيفة</Label>
                   <Select 
                     value={String(formData.IDJob)} 
                     onValueChange={(value) => handleSelectChange("IDJob", value)}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="اختر الوظيفة" />
                     </SelectTrigger>
                     <SelectContent>
                       {jobs.map((job) => (
                         <SelectItem key={job.ID} value={String(job.ID)}>
                           {job.Name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="IDDepartment">القسم</Label>
                   <Select 
                     value={String(formData.IDDepartment)} 
                     onValueChange={(value) => handleSelectChange("IDDepartment", value)}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="اختر القسم" />
                     </SelectTrigger>
                     <SelectContent>
                       {departments.map((department) => (
                         <SelectItem key={department.ID} value={String(department.ID)}>
                           {department.Name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>

              {/* تاريخ التعيين */}
              <div className="space-y-2">
                <Label htmlFor="DateHiring">تاريخ التعيين</Label>
                <Input 
                  id="DateHiring"
                  name="DateHiring"
                  type="date"
                  value={formData.DateHiring}
                  onChange={handleInputChange}
                />
              </div>

              {/* أوقات العمل */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="TimeWorkFrom">وقت العمل من</Label>
                  <Input 
                    id="TimeWorkFrom"
                    name="TimeWorkFrom"
                    type="time"
                    value={formData.TimeWorkFrom}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="TimeWorkTo">وقت العمل إلى</Label>
                  <Input 
                    id="TimeWorkTo"
                    name="TimeWorkTo"
                    type="time"
                    value={formData.TimeWorkTo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="TimeTotalWorkHour">إجمالي ساعات العمل</Label>
                  <Input 
                    id="TimeTotalWorkHour"
                    name="TimeTotalWorkHour"
                    type="number"
                    step="0.5"
                                         value={formData.TimeTotalWorkHour || 0}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* الإجازات وتاريخ انتهاء الوظيفة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="MonthlyVacationDays">أيام الإجازة الشهرية</Label>
                  <Input 
                    id="MonthlyVacationDays"
                    name="MonthlyVacationDays"
                    type="number"
                                         value={formData.MonthlyVacationDays || 0}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ExpiryDateJob">تاريخ انتهاء الوظيفة</Label>
                  <Input 
                    id="ExpiryDateJob"
                    name="ExpiryDateJob"
                    type="date"
                    value={formData.ExpiryDateJob}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* سبب المغادرة */}
              <div className="space-y-2">
                <Label htmlFor="LeavingReson">سبب المغادرة</Label>
                <Textarea 
                  id="LeavingReson"
                  name="LeavingReson"
                  value={formData.LeavingReson}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الأقارب */}
        <TabsContent value="relatives">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* القريب الأول */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">القريب الأول</h3>
                  <div className="space-y-2">
                    <Label htmlFor="RelativeName1">الاسم</Label>
                    <Input 
                      id="RelativeName1"
                      name="RelativeName1"
                      value={formData.RelativeName1}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="RelativeMobile1">الموبايل</Label>
                    <Input 
                      id="RelativeMobile1"
                      name="RelativeMobile1"
                      value={formData.RelativeMobile1}
                      onChange={handleInputChange}
                    />
                  </div>
                                     <div className="space-y-2">
                     <Label htmlFor="RelativeType1">نوع القرابة</Label>
                     <Input 
                      id="RelativeType1"
                      name="RelativeType1"
                      value={formData.RelativeType1}
                      onChange={handleInputChange}
                    />
                   
                   </div>
                </div>

                {/* القريب الثاني */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">القريب الثاني</h3>
                  <div className="space-y-2">
                    <Label htmlFor="RelativeName2">الاسم</Label>
                    <Input 
                      id="RelativeName2"
                      name="RelativeName2"
                      value={formData.RelativeName2}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="RelativeMobile2">الموبايل</Label>
                    <Input 
                      id="RelativeMobile2"
                      name="RelativeMobile2"
                      value={formData.RelativeMobile2}
                      onChange={handleInputChange}
                    />
                  </div>
                     <div className="space-y-2">
                     <Label htmlFor="RelativeType2">نوع القرابة</Label>
                     <Input 
                      id="RelativeType2"
                      name="RelativeType2"
                      value={formData.RelativeType2}
                      onChange={handleInputChange}
                    />
                   </div>
                </div>

                {/* القريب الثالث */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">القريب الثالث</h3>
                  <div className="space-y-2">
                    <Label htmlFor="RelativeName3">الاسم</Label>
                    <Input 
                      id="RelativeName3"
                      name="RelativeName3"
                      value={formData.RelativeName3}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="RelativeMobile3">الموبايل</Label>
                    <Input 
                      id="RelativeMobile3"
                      name="RelativeMobile3"
                      value={formData.RelativeMobile3}
                      onChange={handleInputChange}
                    />
                  </div>
                                     <div className="space-y-2">
                     <Label htmlFor="RelativeType3">نوع القرابة</Label>
                     <Input 
                      id="RelativeType3"
                      name="RelativeType3"
                      value={formData.RelativeType3}
                      onChange={handleInputChange}
                    />
                   </div>
                </div>

                {/* القريب الرابع */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">القريب الرابع</h3>
                  <div className="space-y-2">
                    <Label htmlFor="RelativeName4">الاسم</Label>
                    <Input 
                      id="RelativeName4"
                      name="RelativeName4"
                      value={formData.RelativeName4}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="RelativeMobile4">الموبايل</Label>
                    <Input 
                      id="RelativeMobile4"
                      name="RelativeMobile4"
                      value={formData.RelativeMobile4}
                      onChange={handleInputChange}
                    />
                  </div>
                                     <div className="space-y-2">
                     <Label htmlFor="RelativeType4">نوع القرابة</Label>
                     <Input 
                      id="RelativeType4"
                      name="RelativeType4"
                      value={formData.RelativeType4}
                      onChange={handleInputChange}
                    />
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

                 {/* الراتب */}
         <TabsContent value="salary">
           <div className="space-y-6">
             {/* قيمة الراتب */}
             <Card>
               <div className="bg-gray-100 px-4 py-2 border-b">
                 <h3 className="text-lg font-semibold text-gray-700">قيمة الراتب</h3>
               </div>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="SalaryMonthValue">راتب الشهر</Label>
                     <Input 
                       id="SalaryMonthValue"
                       name="SalaryMonthValue"
                       type="number"
                       value={formData.SalaryMonthValue || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="SalaryWeekValue">راتب أسبوعي</Label>
                     <Input 
                       id="SalaryWeekValue"
                       name="SalaryWeekValue"
                       type="number"
                       value={formData.SalaryWeekValue || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="SalaryDayValue">راتب يومي</Label>
                     <Input 
                       id="SalaryDayValue"
                       name="SalaryDayValue"
                       type="number"
                       value={formData.SalaryDayValue || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="SalaryHourValue">راتب الساعة</Label>
                     <Input 
                       id="SalaryHourValue"
                       name="SalaryHourValue"
                       type="number"
                       value={formData.SalaryHourValue || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* تارجت المبيعات */}
             <Card>
               <div className="bg-gray-100 px-4 py-2 border-b">
                 <h3 className="text-lg font-semibold text-gray-700">تارجت المبيعات</h3>
               </div>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="MonthlyTarget">التارجت الشهرى</Label>
                     <Input 
                       id="MonthlyTarget"
                       name="MonthlyTarget"
                       type="number"
                       value={formData.MonthlyTarget || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="MonthlyCommissionExecute">عمولة التحقي</Label>
                     <Input 
                       id="MonthlyCommissionExecute"
                       name="MonthlyCommissionExecute"
                       type="number"
                       value={formData.MonthlyCommissionExecute || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="MonthlyCommissionNotExecute">خصم التحقيق</Label>
                     <Input 
                       id="MonthlyCommissionNotExecute"
                       name="MonthlyCommissionNotExecute"
                       type="number"
                       value={formData.MonthlyCommissionNotExecute || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="DailyTarget">التارجت اليوم</Label>
                     <Input 
                       id="DailyTarget"
                       name="DailyTarget"
                       type="number"
                       value={formData.DailyTarget || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="DailyCommissionExecute">عمولة التحقي</Label>
                     <Input 
                       id="DailyCommissionExecute"
                       name="DailyCommissionExecute"
                       type="number"
                       value={formData.DailyCommissionExecute || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="DailyCommissionNotExecute">خصم التحقيق</Label>
                     <Input 
                       id="DailyCommissionNotExecute"
                       name="DailyCommissionNotExecute"
                       type="number"
                       value={formData.DailyCommissionNotExecute || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* العمولة على فئة سعر 1 */}
             <Card>
               <div className="bg-gray-100 px-4 py-2 border-b">
                 <h3 className="text-lg font-semibold text-gray-700">العمولة على فئة سعر 1</h3>
               </div>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSales1">عمولة البيع 1</Label>
                     <Input 
                       id="CommissionSales1"
                       name="CommissionSales1"
                       type="number"
                       value={formData.CommissionSales1 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSalesReturned1">خصم عمولة المرتجع 1</Label>
                     <Input 
                       id="CommissionSalesReturned1"
                       name="CommissionSalesReturned1"
                       type="number"
                       value={formData.CommissionSalesReturned1 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* العمولة على فئة سعر 2 */}
             <Card>
               <div className="bg-gray-100 px-4 py-2 border-b">
                 <h3 className="text-lg font-semibold text-gray-700">العمولة على فئة سعر 2</h3>
               </div>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSales2">عمولة البيع 2</Label>
                     <Input 
                       id="CommissionSales2"
                       name="CommissionSales2"
                       type="number"
                       value={formData.CommissionSales2 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSalesReturned2">خصم عمولة المرتجع 2</Label>
                     <Input 
                       id="CommissionSalesReturned2"
                       name="CommissionSalesReturned2"
                       type="number"
                       value={formData.CommissionSalesReturned2 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* العمولة على فئة سعر 3 */}
             <Card>
               <div className="bg-gray-100 px-4 py-2 border-b">
                 <h3 className="text-lg font-semibold text-gray-700">العمولة على فئة سعر 3</h3>
               </div>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSales3">عمولة البيع 3</Label>
                     <Input 
                       id="CommissionSales3"
                       name="CommissionSales3"
                       type="number"
                       value={formData.CommissionSales3 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSalesReturned3">خصم عمولة المرتجع 3</Label>
                     <Input 
                       id="CommissionSalesReturned3"
                       name="CommissionSalesReturned3"
                       type="number"
                       value={formData.CommissionSalesReturned3 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* العمولة على فئة سعر 4 */}
             <Card>
               <div className="bg-gray-100 px-4 py-2 border-b">
                 <h3 className="text-lg font-semibold text-gray-700">العمولة على فئة سعر 4</h3>
               </div>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSales4">عمولة البيع 4</Label>
                     <Input 
                       id="CommissionSales4"
                       name="CommissionSales4"
                       type="number"
                       value={formData.CommissionSales4 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSalesReturned4">خصم عمولة المرتجع 4</Label>
                     <Input 
                       id="CommissionSalesReturned4"
                       name="CommissionSalesReturned4"
                       type="number"
                       value={formData.CommissionSalesReturned4 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* العمولة على فئة سعر 5 */}
             <Card>
               <div className="bg-gray-100 px-4 py-2 border-b">
                 <h3 className="text-lg font-semibold text-gray-700">العمولة على فئة سعر 5</h3>
               </div>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSales5">عمولة البيع 5</Label>
                     <Input 
                       id="CommissionSales5"
                       name="CommissionSales5"
                       type="number"
                       value={formData.CommissionSales5 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="CommissionSalesReturned5">خصم عمولة المرتجع 5</Label>
                     <Input 
                       id="CommissionSalesReturned5"
                       name="CommissionSalesReturned5"
                       type="number"
                       value={formData.CommissionSalesReturned5 || 0}
                       onChange={handleInputChange}
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>
                        
        {/* المستخدم */}
        <TabsContent value="user">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>تسجيل الدخول</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="UserName">اسم المستخدم</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">👤</span>
                        <Input 
                          id="UserName"
                          name="UserName"
                          value={formData.UserName}
                          onChange={handleInputChange}
                          placeholder="اسم المستخدم"
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
                  <div className="mt-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox 
                        id="LoginIsAdmin"
                        checked={formData.LoginIsAdmin}
                        onCheckedChange={(checked) => handleCheckboxChange("LoginIsAdmin", checked === true)}
                      />
                      <Label htmlFor="LoginIsAdmin">مدير النظام</Label>
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
