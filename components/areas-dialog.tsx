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

interface Village {
  id: string
  ID?: number
  Name: string
  IDCity: number
}

interface Area {
  id: string
  ID?: number
  Name: string
  IDCity: number
  IDVillage: number
}

interface AreasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataChanged: () => void
  selectedGovernmentId?: string // المحافظة المختارة من الشاشة الرئيسية
  selectedCityId?: string // المدينة المختارة من الشاشة الرئيسية
  selectedVillageId?: string // القرية المختارة من الشاشة الرئيسية
}

export default function AreasDialog({ open, onOpenChange, onDataChanged, selectedGovernmentId, selectedCityId, selectedVillageId }: AreasDialogProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [governments, setGovernments] = useState<Government[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [allCities, setAllCities] = useState<City[]>([]) // لحفظ جميع المدن
  const [allVillages, setAllVillages] = useState<Village[]>([]) // لحفظ جميع القرى
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    Name: "",
    IDCity: "",
    IDVillage: ""
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
            ID: data.ID || parseInt(doc.id) || 0,
            Name: data.Name || '',
          }
        })

        const sortedData = governmentsData.sort((a, b) => {
          const idA = a.ID || 0
          const idB = b.ID || 0
          return idA - idB
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
      const villagesCollection = collection(db, "DefGeo_Villages")
      const villagesSnapshot = await getDocs(villagesCollection)
      
      if (!villagesSnapshot.empty) {
        const villagesData = villagesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || 0,
            Name: data.Name || '',
            IDCity: data.IDCity || 0,
          }
        })

        setAllVillages(villagesData) // حفظ جميع القرى

        // فلترة القرى حسب المدينة المختارة إذا كانت موجودة
        if (selectedCityId) {
          const filteredVillages = villagesData.filter(village => village.IDCity.toString() === selectedCityId)
          setVillages(filteredVillages)
        } else {
          setVillages(villagesData)
        }
      }
    } catch (error) {
      console.error("Error fetching villages:", error)
      notify.error("حدث خطأ أثناء جلب بيانات القرى")
    }
  }

  const fetchAreas = async () => {
    try {
      setLoading(true)
      const areasCollection = collection(db, "DefGeo_Areas")
      const areasSnapshot = await getDocs(areasCollection)
      
      if (!areasSnapshot.empty) {
        let areasData = areasSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || 0,
            Name: data.Name || '',
            IDCity: data.IDCity || 0,
            IDVillage: data.IDVillage || 0,
          }
        })

        // إذا كانت هناك قرية مختارة، اعرض أحياءها فقط
        if (selectedVillageId) {
          areasData = areasData.filter(area => area.IDVillage.toString() === selectedVillageId)
        }

        setAreas(areasData)
      }
    } catch (error) {
      console.error("Error fetching areas:", error)
      notify.error("حدث خطأ أثناء جلب بيانات الأحياء")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchGovernments()
      fetchCities()
      fetchVillages()
      fetchAreas()
    }
  }, [open, selectedGovernmentId, selectedCityId, selectedVillageId])

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ 
      Name: "", 
      IDCity: selectedCityId || "",
      IDVillage: selectedVillageId || "" // تعيين القرية المختارة افتراضياً
    })
  }

  const handleEdit = (area: Area) => {
    setEditingId(area.id)
    setIsAdding(false)
    setFormData({
      Name: area.Name,
      IDCity: area.IDCity.toString(),
      IDVillage: area.IDVillage.toString()
    })
  }

  const handleSave = async () => {
    if (!formData.Name.trim() || !formData.IDCity || !formData.IDVillage) {
      notify.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    try {
      setLoading(true)
      
      if (isAdding) {
        // العثور على أكبر ID موجود وإضافة 1
        const areasCollection = collection(db, "DefGeo_Areas")
        const areasSnapshot = await getDocs(areasCollection)
        
        let maxId = 0
        if (!areasSnapshot.empty) {
          areasSnapshot.docs.forEach((doc) => {
            const data = doc.data()
            const currentId = data.ID || parseInt(doc.id) || 0
            if (currentId > maxId) {
              maxId = currentId
            }
          })
        }
        
        const newId = maxId + 1
        const docId = newId.toString()
        
        await setDoc(doc(db, "DefGeo_Areas", docId), {
          ID: newId,
          Name: formData.Name,
          IDCity: parseInt(formData.IDCity),
          IDVillage: parseInt(formData.IDVillage)
        })
        notify.success("تم إضافة الحي بنجاح")
      } else if (editingId) {
        await updateDoc(doc(db, "DefGeo_Areas", editingId), {
          ID: parseInt(editingId) || 0,
          Name: formData.Name,
          IDCity: parseInt(formData.IDCity),
          IDVillage: parseInt(formData.IDVillage)
        })
        notify.success("تم تحديث الحي بنجاح")
      }

      setIsAdding(false)
      setEditingId(null)
      setFormData({ Name: "", IDCity: "", IDVillage: "" })
      await fetchAreas()
      onDataChanged()
    } catch (error) {
      console.error("Error saving area:", error)
      notify.error("حدث خطأ أثناء حفظ البيانات")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ Name: "", IDCity: "", IDVillage: "" })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الحي؟")) return

    try {
      setLoading(true)
      await deleteDoc(doc(db, "DefGeo_Areas", id))
      notify.success("تم حذف الحي بنجاح")
      await fetchAreas()
      onDataChanged()
    } catch (error) {
      console.error("Error deleting area:", error)
      notify.error("حدث خطأ أثناء حذف الحي")
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

  const getVillageName = (idVillage: number) => {
    const village = allVillages.find(village => village.id === idVillage.toString())
    return village ? village.Name : "غير محدد"
  }

  const getSelectedVillageName = () => {
    if (selectedVillageId) {
      const village = allVillages.find(village => village.id === selectedVillageId)
      return village ? village.Name : ""
    }
    return ""
  }

  // فلترة القرى حسب المدينة المختارة في النموذج
  const getVillagesForCity = (cityId: string) => {
    return allVillages.filter(village => village.IDCity.toString() === cityId)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            إدارة الأحياء
            {selectedVillageId && (
              <span className="text-blue-600 mr-2">
                - {getSelectedVillageName()}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            إضافة وتعديل وحذف الأحياء
            {selectedVillageId && " للقرية المختارة"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form for Add/Edit */}
          {(isAdding || editingId) && (
            <Card>
              <CardHeader>
                <CardTitle>{isAdding ? "إضافة حي جديد" : "تعديل الحي"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      value={formData.Name}
                      onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                      placeholder="أدخل اسم الحي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Select
                      value={formData.IDCity}
                      onValueChange={(value) => {
                        setFormData({ ...formData, IDCity: value, IDVillage: "" })
                      }}
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
                  <div className="space-y-2">
                    <Label htmlFor="village">القرية/المنطقة</Label>
                    <Select
                      value={formData.IDVillage}
                      onValueChange={(value) => setFormData({ ...formData, IDVillage: value })}
                      disabled={!formData.IDCity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!formData.IDCity ? "اختر المدينة أولاً" : "اختر القرية/المنطقة"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getVillagesForCity(formData.IDCity).map((village) => (
                          <SelectItem key={village.id} value={village.id}>
                            {village.Name}
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
              إضافة حي جديد
            </Button>
          )}

          {/* Areas Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة الأحياء</CardTitle>
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
                      <TableHead>القرية/المنطقة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          لا توجد أحياء
                        </TableCell>
                      </TableRow>
                    ) : (
                      areas.map((area) => (
                        <TableRow key={area.id}>
                          <TableCell>{area.Name}</TableCell>
                          <TableCell>{getCityName(area.IDCity)}</TableCell>
                          <TableCell>{getVillageName(area.IDVillage)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(area)}
                                disabled={loading || isAdding || editingId !== null}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(area.id)}
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
