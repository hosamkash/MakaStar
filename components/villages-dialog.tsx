"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { notify } from "@/lib/notifications"

interface Government {
  id: string
  Code: string
  Name: string
  IsActive: boolean
}

interface City {
  id: string
  ID?: number
  Name: string
  IDGovernorate: number
}

interface Village {
  id: string
  ID?: number
  Name: string
  IDCity: number
}

interface VillagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataChanged: () => void
  selectedGovernmentId?: string // المحافظة المختارة من الشاشة الرئيسية
  selectedCityId?: string // المدينة المختارة من الشاشة الرئيسية
}

export default function VillagesDialog({ open, onOpenChange, onDataChanged, selectedGovernmentId, selectedCityId }: VillagesDialogProps) {
  const [villages, setVillages] = useState<Village[]>([])
  const [governments, setGovernments] = useState<Government[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [allCities, setAllCities] = useState<City[]>([]) // لحفظ جميع المدن
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    Name: "",
    IDCity: ""
  })

  const fetchGovernments = async () => {
    try {
      const governmentsCollection = collection(db, "DefGeo_Government")
      const governmentsSnapshot = await getDocs(governmentsCollection)
      
      if (!governmentsSnapshot.empty) {
        const governmentsData = governmentsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            Code: data.Code || '',
            Name: data.Name || '',
            IsActive: data.IsActive || false,
          }
        }).filter(gov => gov.IsActive)

        const sortedData = governmentsData.sort((a, b) => {
          const codeA = parseInt(a.Code) || 0
          const codeB = parseInt(b.Code) || 0
          return codeA - codeB
        })
        
        setGovernments(sortedData)
      }
    } catch (error) {
      console.error("Error fetching governments:", error)
      notify.error("حدث خطأ أثناء جلب بيانات المحافظات")
    }
  }

  const fetchCities = async () => {
    try {
      const citiesCollection = collection(db, "DefGeo_Cities")
      const citiesSnapshot = await getDocs(citiesCollection)
      
      if (!citiesSnapshot.empty) {
        const citiesData = citiesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || 0,
            Name: data.Name || '',
            IDGovernorate: data.IDGovernorate || 0,
          }
        })

        setAllCities(citiesData) // حفظ جميع المدن

        // فلترة المدن حسب المحافظة المختارة إذا كانت موجودة
        if (selectedGovernmentId) {
          const filteredCities = citiesData.filter(city => city.IDGovernorate.toString() === selectedGovernmentId)
          setCities(filteredCities)
        } else {
          setCities(citiesData)
        }
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
      notify.error("حدث خطأ أثناء جلب بيانات المدن")
    }
  }

  const fetchVillages = async () => {
    try {
      setLoading(true)
      const villagesCollection = collection(db, "DefGeo_Villages")
      const villagesSnapshot = await getDocs(villagesCollection)
      
      if (!villagesSnapshot.empty) {
        let villagesData = villagesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || 0,
            Name: data.Name || '',
            IDCity: data.IDCity || 0,
          }
        })

        // إذا كانت هناك مدينة مختارة، اعرض قراها فقط
        if (selectedCityId) {
          villagesData = villagesData.filter(village => village.IDCity.toString() === selectedCityId)
        }

        setVillages(villagesData)
      }
    } catch (error) {
      console.error("Error fetching villages:", error)
      notify.error("حدث خطأ أثناء جلب بيانات القرى")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchGovernments()
      fetchCities()
      fetchVillages()
    }
  }, [open, selectedGovernmentId, selectedCityId])

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ 
      Name: "", 
      IDCity: selectedCityId || "" // تعيين المدينة المختارة افتراضياً
    })
  }

  const handleEdit = (village: Village) => {
    setEditingId(village.id)
    setIsAdding(false)
    setFormData({
      Name: village.Name,
      IDCity: village.IDCity.toString()
    })
  }

  const handleSave = async () => {
    if (!formData.Name.trim() || !formData.IDCity) {
      notify.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    try {
      setLoading(true)
      
      if (isAdding) {
        // العثور على أكبر ID موجود وإضافة 1
        const villagesCollection = collection(db, "DefGeo_Villages")
        const villagesSnapshot = await getDocs(villagesCollection)
        
        let maxId = 0
        if (!villagesSnapshot.empty) {
          villagesSnapshot.docs.forEach((doc) => {
            const data = doc.data()
            const currentId = data.ID || parseInt(doc.id) || 0
            if (currentId > maxId) {
              maxId = currentId
            }
          })
        }
        
        const newId = maxId + 1
        const docId = newId.toString()
        
        await setDoc(doc(db, "DefGeo_Villages", docId), {
          ID: newId,
          Name: formData.Name,
          IDCity: parseInt(formData.IDCity)
        })
        notify.success("تم إضافة القرية بنجاح")
      } else if (editingId) {
        await updateDoc(doc(db, "DefGeo_Villages", editingId), {
          ID: parseInt(editingId) || 0,
          Name: formData.Name,
          IDCity: parseInt(formData.IDCity)
        })
        notify.success("تم تحديث القرية بنجاح")
      }

      setIsAdding(false)
      setEditingId(null)
      setFormData({ Name: "", IDCity: "" })
      await fetchVillages()
      onDataChanged()
    } catch (error) {
      console.error("Error saving village:", error)
      notify.error("حدث خطأ أثناء حفظ البيانات")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ Name: "", IDCity: "" })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه القرية؟")) return

    try {
      setLoading(true)
      await deleteDoc(doc(db, "DefGeo_Villages", id))
      notify.success("تم حذف القرية بنجاح")
      await fetchVillages()
      onDataChanged()
    } catch (error) {
      console.error("Error deleting village:", error)
      notify.error("حدث خطأ أثناء حذف القرية")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    handleCancel()
    onOpenChange(false)
  }

  const getCityName = (idCity: number) => {
    const city = allCities.find(city => city.id === idCity.toString())
    return city ? city.Name : "غير محدد"
  }

  const getSelectedCityName = () => {
    if (selectedCityId) {
      const city = allCities.find(city => city.id === selectedCityId)
      return city ? city.Name : ""
    }
    return ""
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            إدارة القرى/المناطق
            {selectedCityId && (
              <span className="text-blue-600 mr-2">
                - {getSelectedCityName()}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            إضافة وتعديل وحذف القرى والمناطق
            {selectedCityId && " للمدينة المختارة"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form for Add/Edit */}
          {(isAdding || editingId) && (
            <Card>
              <CardHeader>
                <CardTitle>{isAdding ? "إضافة قرية/منطقة جديدة" : "تعديل القرية/المنطقة"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      value={formData.Name}
                      onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                      placeholder="أدخل اسم القرية/المنطقة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Select
                      value={formData.IDCity}
                      onValueChange={(value) => setFormData({ ...formData, IDCity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 ml-2" />
                    حفظ
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 ml-2" />
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Button */}
          {!isAdding && !editingId && (
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة قرية/منطقة جديدة
            </Button>
          )}

          {/* Villages Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة القرى/المناطق</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {villages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          لا توجد قرى/مناطق
                        </TableCell>
                      </TableRow>
                    ) : (
                      villages.map((village) => (
                        <TableRow key={village.id}>
                          <TableCell>{village.Name}</TableCell>
                          <TableCell>{getCityName(village.IDCity)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(village)}
                                disabled={loading || isAdding || editingId !== null}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(village.id)}
                                disabled={loading || isAdding || editingId !== null}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
