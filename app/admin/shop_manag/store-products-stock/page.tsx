"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, doc, getDocs, query, where, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Save, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notify } from "@/lib/notifications"

type VariantDoc = {
  IDProductStructure: number
  Color: { ID: number; Name: string; ColorHex?: string }
  Size: { ID: number; Name: string }
  Qty: number
  Price: number
  Fitting?: string
  ImageName?: string
  ImageURL?: string
}

type Product = {
  ID: number
  BarCode: number
  Name: string
}

export default function StoreProductsStockPage() {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Record<string, VariantDoc>>({})
  const [edited, setEdited] = useState<Record<string, { Qty: number; Price: number; Fitting?: string }>>({})
  const [loading, setLoading] = useState(false)
  const [bulkQty, setBulkQty] = useState<string>("")
  const [bulkPrice, setBulkPrice] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const snap = await getDocs(collection(db, "Def_ProductStructure"))
        const list = snap.docs.map(d => ({ ID: Number(d.id), ...(d.data() as any) })) as Product[]
        setProducts(list)
      } catch (e) {
        console.error(e)
        notify.error("تعذر تحميل الأصناف")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products.slice(0, 20)
    const isDigits = /^\d+$/.test(term)
    return products.filter(p => {
      const byName = (p.Name || "").toLowerCase().includes(term)
      if (isDigits) return byName || String(p.BarCode || "").includes(term)
      return byName
    }).slice(0, 50)
  }, [products, search])

  const loadVariants = async (productId: number) => {
    try {
      setLoading(true)
      const col = collection(db, "Def_ProductStructure", String(productId), "Variants")
      const snap = await getDocs(col)
      const map: Record<string, VariantDoc> = {}
      snap.docs.forEach(d => { map[d.id] = d.data() as VariantDoc })
      setVariants(map)
      setEdited({})
    } catch (e) {
      console.error(e)
      notify.error("تعذر تحميل التوليفات")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProduct = async (p: Product) => {
    setSelectedProduct(p)
    await loadVariants(p.ID)
  }

  const handleChange = (key: string, field: "Qty" | "Price" | "Fitting", value: string) => {
    const num = parseFloat(value) || 0
    if (field === "Fitting") {
      setEdited(prev => ({ ...prev, [key]: { Qty: prev[key]?.Qty ?? variants[key]?.Qty ?? 0, Price: prev[key]?.Price ?? variants[key]?.Price ?? 0, Fitting: value } }))
    } else {
      setEdited(prev => ({ ...prev, [key]: { Qty: field === "Qty" ? num : (prev[key]?.Qty ?? variants[key]?.Qty ?? 0), Price: field === "Price" ? num : (prev[key]?.Price ?? variants[key]?.Price ?? 0), Fitting: prev[key]?.Fitting ?? variants[key]?.Fitting } }))
    }
  }

  const handleSave = async () => {
    if (!selectedProduct) return
    try {
      setLoading(true)
      const col = collection(db, "Def_ProductStructure", String(selectedProduct.ID), "Variants")
      const updates = Object.entries(edited)
      if (updates.length === 0) {
        notify.info("لا توجد تعديلات للحفظ")
        return
      }
      await Promise.all(updates.map(([key, val]) => setDoc(doc(col, key), { ...variants[key], Qty: Number(val.Qty) || 0, Price: Number(val.Price) || 0, Fitting: (val.Fitting ?? variants[key]?.Fitting) || "" }, { merge: true })))
      notify.success("تم حفظ التغييرات")
      await loadVariants(selectedProduct.ID)
    } catch (e) {
      console.error(e)
      notify.error("فشل حفظ التغييرات")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">رصيد منتجات المتجر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث بالباركود أو الاسم" className="pr-10" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="border rounded-md max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الصنف</TableHead>
                      <TableHead className="w-28 text-center">الباركود</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(p => (
                      <TableRow key={p.ID} className={`cursor-pointer hover:bg-gray-50 ${selectedProduct?.ID === p.ID ? 'bg-blue-50' : ''}`} onClick={() => handleSelectProduct(p)}>
                        <TableCell className="text-right">{p.Name}</TableCell>
                        <TableCell className="text-center">{p.BarCode}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-right font-medium">{selectedProduct ? selectedProduct.Name : "اختر صنفاً من القائمة"}</div>
                  {selectedProduct && (
                    <>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/store/product/${selectedProduct.ID}`} target="_blank" rel="noopener noreferrer">المتجر</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/definitions/products/form?id=${selectedProduct.ID}`} target="_blank" rel="noopener noreferrer">الأدمن</Link>
                      </Button>
                    </>
                  )}
                </div>
                <Button onClick={handleSave} disabled={!selectedProduct || loading} className="gap-2">
                  <Save className="w-4 h-4" /> حفظ التغييرات
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">تعيين كمية عامة</span>
                    <Input className="h-8 w-28 text-center" value={bulkQty} onChange={(e) => setBulkQty(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">تعيين سعر عام</span>
                    <Input className="h-8 w-28 text-center" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const applyQty = bulkQty.trim() !== "" ? (parseFloat(bulkQty) || 0) : undefined
                      const applyPrice = bulkPrice.trim() !== "" ? (parseFloat(bulkPrice) || 0) : undefined
                      if (applyQty === undefined && applyPrice === undefined) return
                      setEdited(prev => {
                        const next: Record<string, { Qty: number; Price: number }> = { ...prev }
                        Object.entries(variants).forEach(([key, v]) => {
                          next[key] = {
                            Qty: applyQty !== undefined ? applyQty : (next[key]?.Qty ?? v.Qty ?? 0),
                            Price: applyPrice !== undefined ? applyPrice : (next[key]?.Price ?? v.Price ?? 0),
                          }
                        })
                        return next
                      })
                    }}
                  >
                    تطبيق على كل التوليفات
                  </Button>
                </div>

                <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] min-w-[60px] text-center">الصورة</TableHead>
                      <TableHead className="text-center">اللون</TableHead>
                      <TableHead className="text-center">المقاس</TableHead>
                      <TableHead className="text-center w-40">الكمية</TableHead>
                      <TableHead className="text-center w-40">السعر</TableHead>
                      <TableHead className="text-center w-48">التلبيس</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(variants).map(([key, v]) => (
                      <TableRow key={key}>
                        <TableCell className="text-center">
                          <div className="w-8 h-8 mx-auto bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            {v.ImageURL ? (
                              <Image
                                src={v.ImageURL}
                                alt={v.Color?.Name || ""}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <span className="inline-block w-4 h-4 rounded border" style={{ backgroundColor: v.Color?.ColorHex || '#000' }} />
                            <span>{v.Color?.Name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{v.Size?.Name}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            className="h-8 text-center"
                            value={(edited[key]?.Qty ?? v.Qty ?? 0).toString()}
                            onChange={e => handleChange(key, "Qty", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            className="h-8 text-center"
                            value={(edited[key]?.Price ?? v.Price ?? 0).toString()}
                            onChange={e => handleChange(key, "Price", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            className="h-8 text-center"
                            value={(edited[key]?.Fitting ?? v.Fitting ?? "").toString()}
                            onChange={e => handleChange(key, "Fitting", e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


