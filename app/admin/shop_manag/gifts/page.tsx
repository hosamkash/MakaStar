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
import { 
  Plus, 
  Search, 
  Gift, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  DollarSign,
  Package
} from "lucide-react"
import { notify } from "@/lib/notifications"

type Gift = {
  id?: string
  ID: number
  Name: string
  Description: string
  Value: number
  IsActive: boolean
  CreatedDate: string
  ExpiryDate: string
  Quantity: number
  UsedQuantity: number
}

export default function GiftsManagementPage() {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [formData, setFormData] = useState<Partial<Gift>>({
    Name: "",
    Description: "",
    Value: 0,
    IsActive: true,
    Quantity: 0,
    UsedQuantity: 0
  })

  useEffect(() => {
    loadGifts()
  }, [])

  const loadGifts = async () => {
    try {
      setLoading(true)
      const giftsCollection = collection(db, "Shop_Gifts")
      const giftsSnapshot = await getDocs(giftsCollection)
      
      const giftsData = giftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Gift[]
      
      setGifts(giftsData)
    } catch (error) {
      console.error("Error loading gifts:", error)
      notify.error("حدث خطأ أثناء تحميل الهدايا")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editingGift) {
        // تحديث هدية موجودة
        const giftRef = doc(db, "Shop_Gifts", editingGift.id!)
        await updateDoc(giftRef, {
          ...formData,
          ModifiedDate: new Date().toISOString()
        })
        notify.success("تم تحديث الهدية بنجاح")
      } else {
        // إضافة هدية جديدة
        const newGift = {
          ...formData,
          ID: Date.now(),
          CreatedDate: new Date().toISOString(),
          UsedQuantity: 0
        }
        await addDoc(collection(db, "Shop_Gifts"), newGift)
        notify.success("تم إضافة الهدية بنجاح")
      }
      
      setShowAddDialog(false)
      setEditingGift(null)
      setFormData({
        Name: "",
        Description: "",
        Value: 0,
        IsActive: true,
        Quantity: 0,
        UsedQuantity: 0
      })
      loadGifts()
    } catch (error) {
      console.error("Error saving gift:", error)
      notify.error("حدث خطأ أثناء حفظ الهدية")
    }
  }

  const handleDelete = async (giftId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الهدية؟")) {
      try {
        await deleteDoc(doc(db, "Shop_Gifts", giftId))
        notify.success("تم حذف الهدية بنجاح")
        loadGifts()
      } catch (error) {
        console.error("Error deleting gift:", error)
        notify.error("حدث خطأ أثناء حذف الهدية")
      }
    }
  }

  const handleEdit = (gift: Gift) => {
    setEditingGift(gift)
    setFormData({
      Name: gift.Name,
      Description: gift.Description,
      Value: gift.Value,
      IsActive: gift.IsActive,
      Quantity: gift.Quantity,
      UsedQuantity: gift.UsedQuantity
    })
    setShowAddDialog(true)
  }

  const filteredGifts = gifts.filter(gift =>
    gift.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gift.Description.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الهدايا</h1>
        <p className="text-gray-600">إدارة هدايا المتجر والعروض الترويجية</p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-purple-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">إجمالي الهدايا</p>
                <p className="text-2xl font-bold">{gifts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">إجمالي القيمة</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(gifts.reduce((sum, gift) => sum + gift.Value, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">الكمية المتاحة</p>
                <p className="text-2xl font-bold">
                  {gifts.reduce((sum, gift) => sum + (gift.Quantity - gift.UsedQuantity), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="mr-3">
                <p className="text-sm text-gray-600">الهدايا النشطة</p>
                <p className="text-2xl font-bold">
                  {gifts.filter(gift => gift.IsActive).length}
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
                  placeholder="البحث في الهدايا..."
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
                  إضافة هدية
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingGift ? "تعديل الهدية" : "إضافة هدية جديدة"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">اسم الهدية</Label>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="value">القيمة</Label>
                      <Input
                        id="value"
                        type="number"
                        value={formData.Value}
                        onChange={(e) => setFormData({ ...formData, Value: Number(e.target.value) })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="quantity">الكمية</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.Quantity}
                        onChange={(e) => setFormData({ ...formData, Quantity: Number(e.target.value) })}
                      />
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
                      {editingGift ? "تحديث" : "إضافة"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false)
                        setEditingGift(null)
                        setFormData({
                          Name: "",
                          Description: "",
                          Value: 0,
                          IsActive: true,
                          Quantity: 0,
                          UsedQuantity: 0
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

      {/* قائمة الهدايا */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الهدايا</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل الهدايا...</p>
            </div>
          ) : filteredGifts.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد هدايا</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGifts.map((gift) => (
                <Card key={gift.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg">{gift.Name}</h3>
                      <Badge className={gift.IsActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {gift.IsActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {gift.Description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">القيمة:</span>
                        <span className="font-medium">{formatCurrency(gift.Value)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">الكمية المتاحة:</span>
                        <span className="font-medium">{gift.Quantity - gift.UsedQuantity}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">تاريخ الإنشاء:</span>
                        <span className="font-medium">{formatDate(gift.CreatedDate)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(gift)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600"
                        onClick={() => handleDelete(gift.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
