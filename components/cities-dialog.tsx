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
  ID?: number
  Name: string
}

interface City {
  id: string
  ID?: number
  Name: string
  IDGovernorate: number
}

interface CitiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataChanged: () => void
  selectedGovernmentId?: string // المحافظة المختارة من الشاشة الرئيسية
}

export default function CitiesDialog({ open, onOpenChange, onDataChanged, selectedGovernmentId }: CitiesDialogProps) {
  const [cities, setCities] = useState<City[]>([])
  const [governments, setGovernments] = useState<Government[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    Name: "",
    IDGovernorate: ""
  })

  const fetchGovernments = async () => {
    try {
      console.log("=== START: Fetching governments from DefGeo_Government ===")
      const governmentsCollection = collection(db, "DefGeo_Government")
      const governmentsSnapshot = await getDocs(governmentsCollection)
      
      console.log("Governments snapshot size:", governmentsSnapshot.size)
      
      if (!governmentsSnapshot.empty) {
        const governmentsData = governmentsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          const government = {
            id: doc.id,
            ID: data.ID || parseInt(doc.id) || 0,
            Name: data.Name || '',
          }
          console.log(`Government ${doc.id}:`, government)
          return government
        })

        console.log("=== ALL GOVERNMENTS DATA ===")
        console.log(governmentsData)

        // Show all governments
        console.log("=== ALL GOVERNMENTS ===")
        governmentsData.forEach((gov, index) => {
          console.log(`${index + 1}. ID: ${gov.id}, Name: ${gov.Name}`)
        })

        // Sort by ID
        const sortedData = governmentsData.sort((a, b) => {
          return a.ID - b.ID
        })
        
        console.log("=== FINAL SORTED GOVERNMENTS ===")
        sortedData.forEach((gov, index) => {
          console.log(`${index + 1}. ID: ${gov.id}, Name: ${gov.Name}`)
        })
        
        setGovernments(sortedData)
        console.log("=== END: Governments set to state ===")
      } else {
        console.log("No governments found in collection")
        setGovernments([])
      }
    } catch (error) {
      console.error("Error fetching governments:", error)
      notify.error("حدث خطأ أثناء جلب بيانات المحافظات")
      setGovernments([])
    }
  }

  const fetchCities = async () => {
    try {
      setLoading(true)
      const citiesCollection = collection(db, "DefGeo_Cities")
      const citiesSnapshot = await getDocs(citiesCollection)
      
      if (!citiesSnapshot.empty) {
        let citiesData = citiesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || 0,
            Name: data.Name || '',
            IDGovernorate: data.IDGovernorate || 0,
          }
        })

        // إذا كانت هناك محافظة مختارة، اعرض مدنها فقط
        if (selectedGovernmentId) {
          citiesData = citiesData.filter(city => city.IDGovernorate.toString() === selectedGovernmentId)
        }

        setCities(citiesData)
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
      notify.error("حدث خطأ أثناء جلب بيانات المدن")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchGovernments()
      fetchCities()
    }
  }, [open, selectedGovernmentId])

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ 
      Name: "", 
      IDGovernorate: selectedGovernmentId || "" // تعيين المحافظة المختارة افتراضياً
    })
  }

  const handleEdit = (city: City) => {
    setEditingId(city.id)
    setIsAdding(false)
    setFormData({
      Name: city.Name,
      IDGovernorate: city.IDGovernorate.toString()
    })
  }

  const handleSave = async () => {
    if (!formData.Name.trim() || !formData.IDGovernorate) {
      notify.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    try {
      setLoading(true)
      
      if (isAdding) {
        // العثور على أكبر ID موجود وإضافة 1
        const citiesCollection = collection(db, "DefGeo_Cities")
        const citiesSnapshot = await getDocs(citiesCollection)
        
        let maxId = 0
        if (!citiesSnapshot.empty) {
          citiesSnapshot.docs.forEach((doc) => {
            const data = doc.data()
            const currentId = data.ID || parseInt(doc.id) || 0
            if (currentId > maxId) {
              maxId = currentId
            }
          })
        }
        
        const newId = maxId + 1
        const docId = newId.toString()
        
        await setDoc(doc(db, "DefGeo_Cities", docId), {
          ID: newId,
          Name: formData.Name,
          IDGovernorate: parseInt(formData.IDGovernorate)
        })
        notify.success("تم إضافة المدينة بنجاح")
      } else if (editingId) {
        await updateDoc(doc(db, "DefGeo_Cities", editingId), {
          ID: parseInt(editingId) || Date.now(), // التأكد من وجود ID
          Name: formData.Name,
          IDGovernorate: parseInt(formData.IDGovernorate)
        })
        notify.success("تم تحديث المدينة بنجاح")
      }

      setIsAdding(false)
      setEditingId(null)
      setFormData({ Name: "", IDGovernorate: "" })
      await fetchCities()
      onDataChanged()
    } catch (error) {
      console.error("Error saving city:", error)
      notify.error("حدث خطأ أثناء حفظ البيانات")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ Name: "", IDGovernorate: "" })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المدينة؟")) return

    try {
      setLoading(true)
      await deleteDoc(doc(db, "DefGeo_Cities", id))
      notify.success("تم حذف المدينة بنجاح")
      await fetchCities()
      onDataChanged()
    } catch (error) {
      console.error("Error deleting city:", error)
      notify.error("حدث خطأ أثناء حذف المدينة")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    handleCancel()
    onOpenChange(false)
  }

  const getGovernmentName = (idGovernorate: number) => {
    const government = governments.find(gov => parseInt(gov.id) === idGovernorate)
    return government ? government.Name : "غير محدد"
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            إدارة المدن
            <span className="text-sm text-gray-500 mr-2">
              (عدد المحافظات: {governments.length})
            </span>
            {selectedGovernmentId && (
              <span className="text-blue-600 mr-2">
                - {governments.find(gov => gov.id === selectedGovernmentId)?.Name}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            إضافة وتعديل وحذف المدن
            {selectedGovernmentId && " للمحافظة المختارة"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form for Add/Edit */}
          {(isAdding || editingId) && (
            <Card>
              <CardHeader>
                <CardTitle>{isAdding ? "إضافة مدينة جديدة" : "تعديل المدينة"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      value={formData.Name}
                      onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                      placeholder="أدخل اسم المدينة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="governorate">المحافظة</Label>
                    <Select
                      value={formData.IDGovernorate}
                      onValueChange={(value) => setFormData({ ...formData, IDGovernorate: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المحافظة" />
                      </SelectTrigger>
                                             <SelectContent>
                         {governments.length === 0 ? (
                           <SelectItem value="" disabled>
                             لا توجد محافظات متاحة
                           </SelectItem>
                         ) : (
                                                       governments.map((gov) => (
                              <SelectItem key={gov.id} value={gov.id}>
                                {gov.Name} (ID: {gov.ID})
                              </SelectItem>
                            ))
                         )}
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

          {/* Add Button and Refresh */}
          {!isAdding && !editingId && (
            <div className="flex gap-2">
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة مدينة جديدة
              </Button>
              <Button variant="outline" onClick={() => { fetchGovernments(); fetchCities(); }}>
                تحديث البيانات
              </Button>
            </div>
          )}

          {/* Cities Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة المدن</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>المحافظة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          لا توجد مدن
                        </TableCell>
                      </TableRow>
                    ) : (
                      cities.map((city) => (
                        <TableRow key={city.id}>
                          <TableCell>{city.Name}</TableCell>
                          <TableCell>{getGovernmentName(city.IDGovernorate)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(city)}
                                disabled={loading || isAdding || editingId !== null}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(city.id)}
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
