"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { validateCodeUniqueness, DEFINITION_COLLECTIONS } from "@/lib/utils/code-validation"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X, Save, Printer } from "lucide-react"
import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"

type ColorItem = {
  id: string
  ID: string
  Name: string
  IsActive: boolean
  ColorHex?: string
}

export default function ColorFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [formData, setFormData] = useState<ColorItem>({
    id: "",
    ID: "",
    Name: "",
    IsActive: true,
    ColorHex: "#000000"
  })

  // ألوان جاهزة للاختيار السريع
  const presetColors = [
    "#000000","#111827","#374151","#6B7280","#9CA3AF","#D1D5DB","#F3F4F6","#FFFFFF",
    "#991B1B","#DC2626","#EF4444","#F87171","#FCA5A5",
    "#92400E","#D97706","#F59E0B","#FBBF24","#FCD34D",
    "#065F46","#059669","#10B981","#34D399","#6EE7B7",
    "#1E3A8A","#2563EB","#3B82F6","#60A5FA","#93C5FD",
    "#6D28D9","#7C3AED","#8B5CF6","#A78BFA","#C4B5FD",
    "#9D174D","#BE185D","#DB2777","#F472B6","#F9A8D4"
  ]

  // مزامنة HEX مع مدخلات RGB المتقدمة
  const hexToRgb = (hex: string) => {
    try {
      const value = hex.replace('#','')
      const bigint = parseInt(value, 16)
      if (value.length === 6 && !Number.isNaN(bigint)) {
        return {
          r: (bigint >> 16) & 255,
          g: (bigint >> 8) & 255,
          b: bigint & 255,
        }
      }
    } catch {}
    return { r: 0, g: 0, b: 0 }
  }

  const rgbToHex = (r: number, g: number, b: number) => {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
    const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  useEffect(() => {
    const initializeForm = async () => {
      if (id) {
        // وضع التعديل
        try {
          const docRef = doc(db, "Def_Colors", id)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            const data = docSnap.data()
            setFormData({
              id: docSnap.id,
              ID: data.ID?.toString() || '',
              Name: data.Name || '',
              IsActive: data.IsActive || false,
              ColorHex: data.ColorHex || "#000000"
            })
          }
        } catch (error) {
          console.error("Error fetching color:", error)
          notify.error("حدث خطأ أثناء جلب بيانات اللون")
        }
      } else {
        // وضع الإضافة - توليد المعرف التالي
        try {
          const itemsCollection = collection(db, "Def_Colors")
          const itemsSnapshot = await getDocs(itemsCollection)
          
          let maxId = 0
          
          itemsSnapshot.docs.forEach(docItem => {
            const data = docItem.data()
            const docId = parseInt(docItem.id)
            if (docId > maxId) maxId = docId
          })

          setFormData(prev => ({
            ...prev,
            id: String(maxId + 1),
            ID: String(maxId + 1),
            ColorHex: "#000000"
          }))
        } catch (error) {
          console.error("Error getting max ID:", error)
          notify.error("حدث خطأ أثناء تحضير النموذج")
        }
      }
    }

    initializeForm()
  }, [id])

  const handleSubmit = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.Name || formData.Name.trim() === '') {
        alert("يرجى إدخال اسم اللون")
        return
      }

      if (!formData.ID || formData.ID.trim() === '') {
        alert("يرجى إدخال معرف اللون")
        return
      }

      const numericId = parseInt(formData.ID)
      if (isNaN(numericId) || numericId <= 0) {
        alert("يرجى إدخال معرف صحيح (رقم أكبر من صفر)")
        return
      }

      // التحقق من صحة اللون
      if (!formData.ColorHex || !/^#[0-9A-Fa-f]{6}$/.test(formData.ColorHex)) {
        alert("يرجى إدخال لون صحيح (مثل #FF0000)")
        return
      }

      // التحقق من عدم تكرار الكود
      const isCodeValid = await validateCodeUniqueness(
        DEFINITION_COLLECTIONS.colors,
        numericId,
        id || undefined
      )
      
      if (!isCodeValid) {
        alert("المعرف مستخدم بالفعل. يرجى اختيار معرف آخر")
        return
      }

      const docRef = doc(db, "Def_Colors", formData.id)
      
      if (id) {
        // تحديث
        await updateDoc(docRef, {
          ID: numericId,
          Name: formData.Name.trim(),
          IsActive: formData.IsActive,
          ColorHex: formData.ColorHex
        })
        notify.success("تم تحديث اللون بنجاح")
      } else {
        // إضافة جديدة
        await setDoc(docRef, {
          ID: numericId,
          Name: formData.Name.trim(),
          IsActive: formData.IsActive,
          ColorHex: formData.ColorHex
        })
        notify.success("تم إضافة اللون بنجاح")
      }

      router.push("/admin/definitions/colors?refresh=true")
    } catch (error) {
      console.error("Error saving color:", error)
      notify.error("حدث خطأ أثناء حفظ اللون")
    }
  }

  const actionButtons = [
    { 
      label: "حفظ", 
      icon: Save, 
      onClick: handleSubmit 
    },
    { 
      label: "طباعة", 
      icon: Printer, 
      onClick: () => {},
      variant: "outline" as const
    },
    { 
      label: "إغلاق", 
      icon: X, 
      onClick: () => router.back(),
      variant: "outline" as const
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader 
        title="بيانات اللون"
        actionButtons={actionButtons} 
      />
      <form onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}>
        <Card>
          <CardHeader className="p-4">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="isActive"
                    checked={formData.IsActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, IsActive: checked as boolean })}
                  />
                  <Label htmlFor="isActive">نشط</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id">المعرف</Label>
                  <Input
                    id="id"
                    value={formData.ID}
                    onChange={(e) => setFormData({ ...formData, ID: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="colorHex">اللون</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="colorHex"
                      type="color"
                      value={formData.ColorHex || "#000000"}
                      onChange={(e) => setFormData({ ...formData, ColorHex: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.ColorHex || "#000000"}
                      onChange={(e) => setFormData({ ...formData, ColorHex: e.target.value })}
                      className="font-mono"
                    />
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: formData.ColorHex || "#000000" }}
                      title={formData.ColorHex}
                    />
                  </div>
                  {/* لوحة ألوان جاهزة */}
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">ألوان سريعة</div>
                    <div className="grid grid-cols-10 gap-2">
                      {presetColors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`h-6 rounded border ${formData.ColorHex?.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-blue-500' : ''}`}
                          style={{ backgroundColor: c }}
                          title={c}
                          onClick={() => setFormData({ ...formData, ColorHex: c })}
                        />
                      ))}
                    </div>
                  </div>

                  {/* مُحدد متقدم RGB */}
                  <div className="mt-4 p-3 rounded-lg border bg-gray-50">
                    <div className="text-xs text-gray-600 mb-2">اختيار متقدم (RGB)</div>
                    {(() => {
                      const { r, g, b } = hexToRgb(formData.ColorHex || '#000000')
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[{k:'r',v:r,label:'R'},{k:'g',v:g,label:'G'},{k:'b',v:b,label:'B'}].map((ch) => (
                            <div key={ch.k} className="flex items-center gap-2">
                              <span className="w-4 text-xs text-gray-500">{ch.label}</span>
                              <input
                                type="range"
                                min={0}
                                max={255}
                                defaultValue={ch.v}
                                onChange={(e) => {
                                  const nv = Number(e.target.value)
                                  const next = { r, g, b, [ch.k]: nv } as any
                                  setFormData({ ...formData, ColorHex: rgbToHex(next.r, next.g, next.b) })
                                }}
                                className="flex-1"
                              />
                              <Input
                                value={ch.v}
                                onChange={(e) => {
                                  const nv = Number(e.target.value || 0)
                                  const next = { r, g, b, [ch.k]: nv } as any
                                  setFormData({ ...formData, ColorHex: rgbToHex(next.r, next.g, next.b) })
                                }}
                                className="w-16 text-center"
                              />
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </form>
    </div>
  )
}


