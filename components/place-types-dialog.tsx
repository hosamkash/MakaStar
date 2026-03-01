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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { notify } from "@/lib/notifications"

interface PlaceType {
  id: string
  ID?: number
  Name: string
}

interface PlaceTypesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataChanged: () => void
}

export default function PlaceTypesDialog({ open, onOpenChange, onDataChanged }: PlaceTypesDialogProps) {
  const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    Name: ""
  })

  const fetchPlaceTypes = async () => {
    try {
      setLoading(true)
      const placeTypesCollection = collection(db, "DefGeo_PlaceTypes")
      const placeTypesSnapshot = await getDocs(placeTypesCollection)
      
      if (!placeTypesSnapshot.empty) {
        const placeTypesData = placeTypesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || parseInt(doc.id) || 0,
            Name: data.Name || '',
          }
        })

        // Sort by ID
        const sortedData = placeTypesData.sort((a, b) => {
          const idA = a.ID || 0
          const idB = b.ID || 0
          return idA - idB
        })
        
        setPlaceTypes(sortedData)
      }
    } catch (error) {
      console.error("Error fetching place types:", error)
      notify.error("حدث خطأ أثناء جلب بيانات أنواع المصالح")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPlaceTypes()
    }
  }, [open])

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ Name: "" })
  }

  const handleEdit = (placeType: PlaceType) => {
    setEditingId(placeType.id)
    setIsAdding(false)
    setFormData({
      Name: placeType.Name
    })
  }

  const handleSave = async () => {
    if (!formData.Name.trim()) {
      notify.error("يرجى ملء اسم نوع المصلحة")
      return
    }

    try {
      setLoading(true)
      
      if (isAdding) {
        // العثور على أكبر ID موجود وإضافة 1
        const placeTypesCollection = collection(db, "DefGeo_PlaceTypes")
        const placeTypesSnapshot = await getDocs(placeTypesCollection)
        
        let maxId = 0
        if (!placeTypesSnapshot.empty) {
          placeTypesSnapshot.docs.forEach((doc) => {
            const data = doc.data()
            const currentId = data.ID || parseInt(doc.id) || 0
            if (currentId > maxId) {
              maxId = currentId
            }
          })
        }
        
        const newId = maxId + 1
        const docId = newId.toString()
        
        await setDoc(doc(db, "DefGeo_PlaceTypes", docId), {
          ID: newId,
          Name: formData.Name
        })
        notify.success("تم إضافة نوع المصلحة بنجاح")
      } else if (editingId) {
        await updateDoc(doc(db, "DefGeo_PlaceTypes", editingId), {
          ID: parseInt(editingId) || 0,
          Name: formData.Name
        })
        notify.success("تم تحديث نوع المصلحة بنجاح")
      }

      setIsAdding(false)
      setEditingId(null)
      setFormData({ Name: "" })
      await fetchPlaceTypes()
      onDataChanged()
    } catch (error) {
      console.error("Error saving place type:", error)
      notify.error("حدث خطأ أثناء حفظ البيانات")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ Name: "" })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف نوع المصلحة؟")) return

    try {
      setLoading(true)
      await deleteDoc(doc(db, "DefGeo_PlaceTypes", id))
      notify.success("تم حذف نوع المصلحة بنجاح")
      await fetchPlaceTypes()
      onDataChanged()
    } catch (error) {
      console.error("Error deleting place type:", error)
      notify.error("حدث خطأ أثناء حذف نوع المصلحة")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    handleCancel()
    onOpenChange(false)
  }

  // Function to add default place types
  const addDefaultPlaceTypes = async () => {
    const defaultTypes = [
      'مدرسة', 'مستشفى', 'مركز شرطة', 'وحدة صحية', 'مكتب بريد', 'مجلس مدينة/محلي',
      'مركز شباب', 'محطة قطار/مواصلات', 'نقطة إسعاف', 'مكتب تموين', 'مكتب سجل مدني',
      'مكتب شهر عقاري', 'وحدة بيطرية', 'مركز زراعة/إرشاد زراعي', 'مركز خدمة مواطنين',
      'محكمة', 'مسجد حكومي', 'كنيسة حكومية', 'صيدلية', 'سوبرماركت', 'مطعم', 'مكتبة',
      'محل ملابس', 'محل أدوات منزلية', 'محل موبايلات', 'محل كمبيوتر', 'محل عطارة',
      'محل أدوات كهربائية', 'محل أحذية', 'محل عطور', 'محل أدوات مكتبية', 'محل أدوات رياضية',
      'محل بقالة', 'محل حلويات', 'محل عصائر', 'محل ألبان', 'محل دواجن', 'محل لحوم',
      'محل أسماك', 'محل خضار وفاكهة', 'محل أدوات بناء', 'محل دهانات', 'محل زهور',
      'محل مفروشات', 'محل ساعات', 'محل نظارات', 'محل مجوهرات', 'محل أجهزة منزلية',
      'محل أجهزة كهربائية', 'محل أجهزة إلكترونية', 'محل أدوات صحية', 'محل أدوات سباكة',
      'محل أدوات كهربائية سيارات', 'محل قطع غيار سيارات', 'محل زيوت سيارات', 'محل كوافير',
      'محل حلاقة', 'محل ملابس أطفال', 'محل ملابس رجالي', 'محل ملابس حريمي', 'محل أحذية أطفال',
      'محل أحذية رجالي', 'محل أحذية حريمي', 'محل شنط', 'محل ألعاب أطفال', 'محل هدايا',
      'محل أدوات تجميل', 'محل منظفات', 'محل أدوات مكتبية ومدرسية', 'محل أدوات رسم',
      'محل أدوات موسيقية', 'محل أدوات رياضية', 'محل أدوات صيد', 'محل أدوات خياطة',
      'محل أدوات مطبخ', 'محل أدوات كهربائية منزلية', 'محل أدوات كهربائية صناعية',
      'محل أدوات كهربائية سيارات', 'محل أدوات كهربائية إلكترونية', 'محل أدوات كهربائية إضاءة',
      'محل أدوات كهربائية صوتية', 'محل أدوات كهربائية فيديو', 'محل أدوات كهربائية كمبيوتر',
      'محل أدوات كهربائية تكييف', 'محل أدوات كهربائية تدفئة', 'محل أدوات كهربائية تبريد',
      'محل أدوات كهربائية طاقة شمسية', 'محل أدوات كهربائية طاقة بديلة', 'محل أدوات كهربائية طاقة متجددة',
      'محل أدوات كهربائية طاقة نووية', 'محل أدوات كهربائية طاقة حرارية', 'محل أدوات كهربائية طاقة كهربائية',
      'محل أدوات كهربائية طاقة ميكانيكية', 'محل أدوات كهربائية طاقة كيميائية', 'محل أدوات كهربائية طاقة فيزيائية',
      'محل أدوات كهربائية طاقة مغناطيسية', 'محل أدوات كهربائية طاقة ضوئية', 'محل أدوات كهربائية طاقة صوتية',
      'محل أخرى'
    ]

    try {
      setLoading(true)
      
      for (let i = 0; i < defaultTypes.length; i++) {
        const typeName = defaultTypes[i]
        const newId = i + 1
        const docId = newId.toString()
        
        await setDoc(doc(db, "DefGeo_PlaceTypes", docId), {
          ID: newId,
          Name: typeName
        })
      }
      
      notify.success("تم إضافة جميع أنواع المصالح الافتراضية بنجاح")
      await fetchPlaceTypes()
      onDataChanged()
    } catch (error) {
      console.error("Error adding default place types:", error)
      notify.error("حدث خطأ أثناء إضافة الأنواع الافتراضية")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إدارة أنواع المصالح</DialogTitle>
          <DialogDescription>
            إضافة وتعديل وحذف أنواع المصالح
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form for Add/Edit */}
          {(isAdding || editingId) && (
            <Card>
              <CardHeader>
                <CardTitle>{isAdding ? "إضافة نوع مصلحة جديد" : "تعديل نوع المصلحة"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم نوع المصلحة</Label>
                  <Input
                    id="name"
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    placeholder="أدخل اسم نوع المصلحة"
                  />
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

          {/* Control Buttons */}
          {!isAdding && !editingId && (
            <div className="flex gap-2">
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة نوع جديد
              </Button>
              <Button 
                variant="outline" 
                onClick={addDefaultPlaceTypes}
                disabled={loading}
                className="bg-green-50 hover:bg-green-100"
              >
                إضافة الأنواع الافتراضية
              </Button>
            </div>
          )}

          {/* Place Types Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة أنواع المصالح</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الرقم التعريفي</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {placeTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          لا توجد أنواع مصالح
                        </TableCell>
                      </TableRow>
                    ) : (
                      placeTypes.map((placeType) => (
                        <TableRow key={placeType.id}>
                          <TableCell>{placeType.ID}</TableCell>
                          <TableCell>{placeType.Name}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(placeType)}
                                disabled={loading || isAdding || editingId !== null}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(placeType.id)}
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
