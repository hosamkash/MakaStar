"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { validateCodeWithMessage, DEFINITION_COLLECTIONS } from '@/lib/utils/code-validation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { notify } from "@/lib/notifications"
import PageHeader from "@/components/page-header"

import {
  Government,
  City,
  Area,
  Village,
  Place,
  GeoFormData,
  GEO_COLLECTIONS,
  PARENT_COLLECTIONS
} from "@/lib/types/geographic-locations"

export default function GeographicLocationFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const data = searchParams.get("data")
  const type = searchParams.get("type") as GeoFormData['Type'] || 'government'

  const [formData, setFormData] = useState<GeoFormData>({
    Code: "",
    Name: "",
    IsActive: true,
    ParentId: "",
    Type: type
  })

  const [parents, setParents] = useState<Array<Government | City | Area | Village>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initializeForm = async () => {
      if (id && data) {
        try {
          const parsedData = JSON.parse(data)
          setFormData({
            ...formData,
            ...parsedData
          })
        } catch (error) {
          console.error("Error parsing data:", error)
          notify.error("حدث خطأ في تحميل البيانات")
        }
      }
    }

    const fetchParents = async () => {
      if (type === 'government') return // Governments don't have parents

      try {
        setLoading(true)
        const parentCollection = type === 'city' ? 'DefGeo_Government' :
                               type === 'area' ? 'DefGeo_Cities' :
                               type === 'village' ? 'DefGeo_Areas' :
                               'DefGeo_Villages'

        const snapshot = await getDocs(collection(db, parentCollection))
        if (!snapshot.empty) {
          const parentData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setParents(parentData)
        }
      } catch (error) {
        console.error("Error fetching parents:", error)
        notify.error("حدث خطأ في تحميل البيانات")
      } finally {
        setLoading(false)
      }
    }

    initializeForm()
    fetchParents()
  }, [id, data, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // التحقق من صحة البيانات
      if (!formData.Name || formData.Name.trim() === '') {
        alert("يرجى إدخال الاسم")
        return
      }
      
      if (!formData.Code || formData.Code.trim() === '') {
        alert("يرجى إدخال الكود")
        return
      }

      const collectionName = GEO_COLLECTIONS[formData.Type]
      
      // التحقق من عدم تكرار الكود
      const isCodeValid = await validateCodeWithMessage(
        collectionName,
        formData.Code,
        id || undefined
      )
      
      if (!isCodeValid) {
        return
      }
      
      const docRef = id ? doc(db, collectionName, id) : doc(collection(db, collectionName))
      
      const saveData = {
        Code: formData.Code,
        Name: formData.Name,
        IsActive: formData.IsActive,
        ...(formData.Type !== 'government' && { ParentId: formData.ParentId })
      }

      if (id) {
        await updateDoc(docRef, saveData)
        alert("تم تحديث البيانات بنجاح")
      } else {
        await setDoc(docRef, saveData)
        alert("تم إضافة البيانات بنجاح")
      }

      router.push("/admin/definitions/geographic-locations?refresh=true")
    } catch (error) {
      console.error("Error saving data:", error)
      alert("حدث خطأ أثناء حفظ البيانات")
    } finally {
      setLoading(false)
    }
  }

  const getParentLabel = () => {
    switch (formData.Type) {
      case 'city': return 'المحافظة'
      case 'area': return 'المدينة'
      case 'village': return 'المنطقة'
      case 'place': return 'القرية'
      default: return ''
    }
  }

  const getTypeLabel = () => {
    switch (formData.Type) {
      case 'government': return 'محافظة'
      case 'city': return 'مدينة'
      case 'area': return 'منطقة'
      case 'village': return 'قرية'
      case 'place': return 'مكان'
      default: return ''
    }
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title={`${id ? 'تعديل' : 'إضافة'} ${getTypeLabel()}`}
        actionButtons={[]}
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{id ? 'تعديل' : 'إضافة'} {getTypeLabel()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">الكود</Label>
                <Input
                  id="code"
                  value={formData.Code}
                  onChange={(e) => setFormData({ ...formData, Code: e.target.value })}
                  placeholder="أدخل الكود"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  placeholder="أدخل الاسم"
                  required
                />
              </div>

              {formData.Type !== 'government' && (
                <div className="space-y-2">
                  <Label htmlFor="parent">{getParentLabel()}</Label>
                  <Select
                    value={formData.ParentId}
                    onValueChange={(value) => setFormData({ ...formData, ParentId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`اختر ${getParentLabel()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="isActive">الحالة</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.IsActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsActive: checked })}
                  />
                  <span>{formData.IsActive ? 'نشط' : 'غير نشط'}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
