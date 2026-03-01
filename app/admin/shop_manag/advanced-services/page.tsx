"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Settings, 
  DollarSign, 
  Edit, 
  Trash2, 
  Eye,
  Zap,
  Shield,
  Clock,
  Users
} from "lucide-react"
import { notify } from "@/lib/notifications"

type AdvancedService = {
  id?: string
  ID: number
  Name: string
  Description: string
  ServiceType: number // 1: خدمة سريعة, 2: خدمة متميزة, 3: خدمة خاصة
  Price: number
  Duration: number // بالدقائق
  IsActive: boolean
  CreatedDate: string
  MaxUsers: number
  Features: string[]
}

export default function AdvancedServicesPage() {
  const [services, setServices] = useState<AdvancedService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingService, setEditingService] = useState<AdvancedService | null>(null)
  const [formData, setFormData] = useState<Partial<AdvancedService>>({
    Name: "",
    Description: "",
    ServiceType: 1,
    Price: 0,
    Duration: 60,
    IsActive: true,
    MaxUsers: 1,
    Features: []
  })
  const [newFeature, setNewFeature] = useState("")

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const servicesCollection = collection(db, "Shop_AdvancedServices")
      const servicesSnapshot = await getDocs(servicesCollection)
      
      const servicesData = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdvancedService[]
      
      setServices(servicesData)
    } catch (error) {
      console.error("Error loading services:", error)
      notify.error("حدث خطأ أثناء تحميل الخدمات")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editingService) {
        // تحديث خدمة موجودة
        const serviceRef = doc(db, "Shop_AdvancedServices", editingService.id!)
        await updateDoc(serviceRef, {
          ...formData,
          ModifiedDate: new Date().toISOString()
        })
        notify.success("تم تحديث الخدمة بنجاح")
      } else {
        // إضافة خدمة جديدة
        const newService = {
          ...formData,
          ID: Date.now(),
          CreatedDate: new Date().toISOString()
        }
        await addDoc(collection(db, "Shop_AdvancedServices"), newService)
        notify.success("تم إضافة الخدمة بنجاح")
      }
      
      setShowAddDialog(false)
      setEditingService(null)
      setFormData({
        Name: "",
        Description: "",
        ServiceType: 1,
        Price: 0,
        Duration: 60,
        IsActive: true,
        MaxUsers: 1,
        Features: []
      })
      loadServices()
    } catch (error) {
      console.error("Error saving service:", error)
      notify.error("حدث خطأ أثناء حفظ الخدمة")
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الخدمة؟")) {
      try {
        await deleteDoc(doc(db, "Shop_AdvancedServices", serviceId))
        notify.success("تم حذف الخدمة بنجاح")
        loadServices()
      } catch (error) {
        console.error("Error deleting service:", error)
        notify.error("حدث خطأ أثناء حذف الخدمة")
      }
    }
  }

  const handleEdit = (service: AdvancedService) => {
    setEditingService(service)
    setFormData({
      Name: service.Name,
      Description: service.Description,
      ServiceType: service.ServiceType,
      Price: service.Price,
      Duration: service.Duration,
      IsActive: service.IsActive,
      MaxUsers: service.MaxUsers,
      Features: service.Features || []
    })
    setShowAddDialog(true)
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        Features: [...(formData.Features || []), newFeature.trim()]
      })
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    const updatedFeatures = formData.Features?.filter((_, i) => i !== index) || []
    setFormData({
      ...formData,
      Features: updatedFeatures
    })
  }

  const filteredServices = services.filter(service =>
    service.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.Description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير محدد"
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG')
  }

  const getServiceTypeInfo = (type: number) => {
    switch (type) {
      case 1:
        return { text: "خدمة سريعة", color: "bg-green-100 text-green-800", icon: Zap }
      case 2:
        return { text: "خدمة متميزة", color: "bg-blue-100 text-blue-800", icon: Shield }
      case 3:
        return { text: "خدمة خاصة", color: "bg-purple-100 text-purple-800", icon: Users }
      default:
        return { text: "غير محدد", color: "bg-gray-100 text-gray-800", icon: Settings }
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} دقيقة`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours} ساعة و ${remainingMinutes} دقيقة` : `${hours} ساعة`
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">الخدمات المتقدمة</h1>
        <p className="text-gray-600">إدارة الخدمات المتقدمة والمميزة للمتجر</p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">إجمالي الخدمات</p>
                <p className="text-2xl font-bold">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">متوسط السعر</p>
                <p className="text-2xl font-bold">
                  {services.length > 0 
                    ? formatCurrency(services.reduce((sum, service) => sum + service.Price, 0) / services.length)
                    : "0 ج.م"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">متوسط المدة</p>
                <p className="text-2xl font-bold">
                  {services.length > 0 
                    ? formatDuration(Math.round(services.reduce((sum, service) => sum + service.Duration, 0) / services.length))
                    : "0 دقيقة"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-orange-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">الخدمات النشطة</p>
                <p className="text-2xl font-bold">
                  {services.filter(service => service.IsActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والإضافة */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الخدمات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة خدمة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">اسم الخدمة</Label>
                    <Input
                      id="name"
                      value={formData.Name}
                      onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.Description}
                      onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="serviceType">نوع الخدمة</Label>
                    <Select
                      value={formData.ServiceType?.toString()}
                      onValueChange={(value) => setFormData({ ...formData, ServiceType: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الخدمة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">خدمة سريعة</SelectItem>
                        <SelectItem value="2">خدمة متميزة</SelectItem>
                        <SelectItem value="3">خدمة خاصة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">السعر</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.Price}
                        onChange={(e) => setFormData({ ...formData, Price: Number(e.target.value) })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="duration">المدة (دقيقة)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.Duration}
                        onChange={(e) => setFormData({ ...formData, Duration: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="maxUsers">الحد الأقصى للمستخدمين</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={formData.MaxUsers}
                      onChange={(e) => setFormData({ ...formData, MaxUsers: Number(e.target.value) })}
                    />
                  </div>
                  
                  <div>
                    <Label>المميزات</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="أضف ميزة جديدة"
                          onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                        />
                        <Button type="button" onClick={addFeature} size="sm">
                          إضافة
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        {formData.Features?.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <span className="flex-1 text-sm">{feature}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFeature(index)}
                              className="text-red-600"
                            >
                              حذف
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.IsActive}
                      onChange={(e) => setFormData({ ...formData, IsActive: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isActive">نشط</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1">
                      {editingService ? "تحديث" : "إضافة"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false)
                        setEditingService(null)
                        setFormData({
                          Name: "",
                          Description: "",
                          ServiceType: 1,
                          Price: 0,
                          Duration: 60,
                          IsActive: true,
                          MaxUsers: 1,
                          Features: []
                        })
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الخدمات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الخدمات المتقدمة</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل الخدمات...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد خدمات</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => {
                const serviceTypeInfo = getServiceTypeInfo(service.ServiceType)
                const ServiceIcon = serviceTypeInfo.icon
                
                return (
                  <Card key={service.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ServiceIcon className="h-5 w-5 text-gray-600" />
                          <h3 className="font-semibold text-lg">{service.Name}</h3>
                        </div>
                        <Badge className={serviceTypeInfo.color}>
                          {serviceTypeInfo.text}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {service.Description}
                      </p>
                      
                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">السعر:</span>
                          <span className="font-medium">{formatCurrency(service.Price)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-500">المدة:</span>
                          <span className="font-medium">{formatDuration(service.Duration)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-500">الحد الأقصى:</span>
                          <span className="font-medium">{service.MaxUsers} مستخدم</span>
                        </div>
                      </div>
                      
                      {service.Features && service.Features.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">المميزات:</p>
                          <div className="space-y-1">
                            {service.Features.slice(0, 2).map((feature, index) => (
                              <div key={index} className="text-xs bg-gray-100 p-1 rounded">
                                • {feature}
                              </div>
                            ))}
                            {service.Features.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{service.Features.length - 2} ميزات أخرى
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600"
                          onClick={() => handleDelete(service.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
