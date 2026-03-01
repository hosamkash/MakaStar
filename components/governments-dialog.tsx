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

interface Government {
  id: string
  ID?: number
  Name: string
}

interface GovernmentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataChanged: () => void
}

export default function GovernmentsDialog({ open, onOpenChange, onDataChanged }: GovernmentsDialogProps) {
  const [governments, setGovernments] = useState<Government[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    ID: undefined as number | undefined,
    Name: ""
  })

  const fetchGovernments = async () => {
    try {
      setLoading(true)
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

        // Sort by ID
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchGovernments()
    }
  }, [open])

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ ID: undefined, Name: "" })
  }

  const handleEdit = (government: Government) => {
    setEditingId(government.id)
    setIsAdding(false)
    setFormData({
      ID: government.ID,
      Name: government.Name
    })
  }

  const handleSave = async () => {
    if (!formData.Name.trim()) {
      notify.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    try {
      setLoading(true)
      
      if (isAdding) {
        // العثور على أكبر ID موجود وإضافة 1
        const governmentsCollection = collection(db, "DefGeo_Government")
        const governmentsSnapshot = await getDocs(governmentsCollection)
        
        let maxId = 0
        if (!governmentsSnapshot.empty) {
          governmentsSnapshot.docs.forEach((doc) => {
            const data = doc.data()
            const currentId = data.ID || parseInt(doc.id) || 0
            if (currentId > maxId) {
              maxId = currentId
            }
          })
        }
        
        const newId = maxId + 1
        const docId = newId.toString()
        
        await setDoc(doc(db, "DefGeo_Government", docId), {
          ID: newId,
          Name: formData.Name
        })
        notify.success("تم إضافة المحافظة بنجاح")
      } else if (editingId) {
        await updateDoc(doc(db, "DefGeo_Government", editingId), {
          ID: formData.ID,
          Name: formData.Name
        })
        notify.success("تم تحديث المحافظة بنجاح")
      }

      setIsAdding(false)
      setEditingId(null)
      setFormData({ ID: undefined, Name: "" })
      await fetchGovernments()
      onDataChanged()
    } catch (error) {
      console.error("Error saving government:", error)
      notify.error("حدث خطأ أثناء حفظ البيانات")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ ID: undefined, Name: "" })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المحافظة؟")) return

    try {
      setLoading(true)
      await deleteDoc(doc(db, "DefGeo_Government", id))
      notify.success("تم حذف المحافظة بنجاح")
      await fetchGovernments()
      onDataChanged()
    } catch (error) {
      console.error("Error deleting government:", error)
      notify.error("حدث خطأ أثناء حذف المحافظة")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    handleCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إدارة المحافظات</DialogTitle>
          <DialogDescription>
            إضافة وتعديل وحذف المحافظات
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form for Add/Edit */}
          {(isAdding || editingId) && (
            <Card>
              <CardHeader>
                <CardTitle>{isAdding ? "إضافة محافظة جديدة" : "تعديل المحافظة"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    placeholder="أدخل اسم المحافظة"
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

          {/* Add Button */}
          {!isAdding && !editingId && (
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة محافظة جديدة
            </Button>
          )}

          {/* Governments Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة المحافظات</CardTitle>
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
                    {governments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          لا توجد محافظات
                        </TableCell>
                      </TableRow>
                    ) : (
                      governments.map((government) => (
                        <TableRow key={government.id}>
                          <TableCell>{government.ID}</TableCell>
                          <TableCell>{government.Name}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(government)}
                                disabled={loading || isAdding || editingId !== null}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(government.id)}
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
