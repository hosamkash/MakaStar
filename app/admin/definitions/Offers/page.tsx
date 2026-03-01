"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, getDocs, deleteDoc, doc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Edit,
  Trash2,
  Printer,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
} from "lucide-react"
import Image from "next/image"
import PageHeader from "@/components/page-header"
import { useScreenSettings } from "@/lib/hooks/use-screen-settings"
import { notify } from "@/lib/notifications"
import { formatCurrencyEGP } from "@/lib/utils"

type Offer = {
  id: string
  ID: string
  Code: string
  Name: string
  IsActive: boolean
  IsSalesOffer: boolean
  IsBindShop: boolean
  IsBindShopMaster: boolean
  ImageName: string
  ImageURL: string
  DiscountValue: number
  DiscountPercent: number
  ShortName: string
  DescreptionShort: string
  DescreptionLong: string
  contconditionToApplayOffer: number
}

type SortConfig = {
  key: keyof Offer | null
  direction: "ascending" | "descending"
}

export default function OffersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/Offers")
  
  const [items, setItems] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(settings?.ItemsPerPage || 10)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "Code", direction: "ascending" })
  const [selectedItem, setSelectedItem] = useState<Offer | null>(null)

  useEffect(() => {
    if (settings?.ItemsPerPage) {
      setItemsPerPage(settings.ItemsPerPage)
    }
  }, [settings])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        const itemsCollection = collection(db, "Def_Offers")
        const itemsSnapshot = await getDocs(itemsCollection)
        
        if (itemsSnapshot.empty) {
          setItems([])
          return
        }
        
        const itemsData = itemsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID?.toString() || '',
            Code: data.Code?.toString() || '',
            Name: data.Name || '',
            IsActive: data.IsActive || false,
            IsSalesOffer: data.IsSalesOffer || false,
            IsBindShop: data.IsBindShop || false,
            IsBindShopMaster: data.IsBindShopMaster || false,
            ImageName: data.ImageName || '',
            ImageURL: data.ImageURL || '',
            DiscountValue: data.DiscountValue || 0,
            DiscountPercent: data.DiscountPercent || 0,
            ShortName: data.ShortName || '',
            DescreptionShort: data.DescreptionShort || '',
            DescreptionLong: data.DescreptionLong || '',
            contconditionToApplayOffer: data.contconditionToApplayOffer || 0
          }
        })

        const sortedData = itemsData.sort((a, b) => {
          const codeA = parseInt(a.Code) || 0
          const codeB = parseInt(b.Code) || 0
          return codeA - codeB
        })
        
        setItems(sortedData)

        if (settings?.LastSelectedItem) {
          const selectedItem = sortedData.find(item => Number(item.ID) === settings.LastSelectedItem)
          if (selectedItem) {
            const itemIndex = sortedData.indexOf(selectedItem)
            const pageNumber = Math.floor(itemIndex / itemsPerPage) + 1
            setCurrentPage(pageNumber)
            setSelectedItem(selectedItem)
          }
        }
      } catch (error) {
        console.error("Error fetching offers:", error)
        notify.error("حدث خطأ أثناء جلب بيانات العروض")
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [refresh])

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "Def_Offers", id))
      setItems((prevItems) => prevItems.filter((item) => item.id !== id))
      setSelectedItem(null)
      notify.success("تم حذف العرض بنجاح")
    } catch (error) {
      console.error("Error deleting offer:", error)
      notify.error("حدث خطأ أثناء حذف العرض")
    }
  }

  const handleEdit = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (item) {
      await updateLastSelectedItem(Number(item.ID))
    }
    router.push(`/admin/definitions/Offers/form?id=${id}`)
  }

  const requestSort = (key: keyof Offer) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ columnKey, children, className }: { columnKey: keyof Offer; children: React.ReactNode; className?: string }) => (
    <TableHead className={`font-bold ${className || ''}`}>
      <Button variant="ghost" onClick={() => requestSort(columnKey)} className="px-2 py-1 text-base">
        {children}
        {sortConfig.key === columnKey && (
          <span className="mr-2">
            {sortConfig.direction === "ascending" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </span>
        )}
      </Button>
    </TableHead>
  )

  const processedData = useMemo(() => {
    const filteredItems = items.filter((item) =>
      Object.values(item).some((value) => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )

    if (sortConfig.key) {
      filteredItems.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filteredItems
  }, [items, searchTerm, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const actionButtons = [
    { label: "جديد", icon: Plus, href: "/admin/definitions/Offers/form" },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => selectedItem && handleEdit(selectedItem.id), 
      disabled: !selectedItem 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => selectedItem && handleDelete(selectedItem.id), 
      disabled: !selectedItem, 
      variant: "destructive" as const 
    },
    { label: "طباعة", icon: Printer, onClick: () => {} },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="عرض العروض" actionButtons={actionButtons} />
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن عرض..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableHead className="w-[50px] text-center">الإجراءات</TableHead>
                  <TableHead className="w-[60px] text-center">الصورة</TableHead>
                  <SortableHeader columnKey="Code" className="text-center">الكود</SortableHeader>
                  <SortableHeader columnKey="Name" className="text-center">الاسم</SortableHeader>
                  <SortableHeader columnKey="ShortName" className="text-center">الاسم المختصر</SortableHeader>
                  <SortableHeader columnKey="DiscountValue" className="text-center">قيمة الخصم</SortableHeader>
                  <SortableHeader columnKey="DiscountPercent" className="text-center">نسبة الخصم</SortableHeader>
                  <TableHead className="text-center font-bold text-base">نشط</TableHead>
                  <TableHead className="text-center font-bold text-base">عرض مبيعات</TableHead>
                  <TableHead className="text-center font-bold text-base">مرتبط بمتجر</TableHead>
                  <TableHead className="text-center font-bold text-base">متجر رئيسي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    onDoubleClick={() => handleEdit(item.id)}
                    className={`cursor-pointer ${selectedItem?.id === item.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    <TableCell className="flex gap-2 justify-center">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(item.id)
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
                            handleDelete(item.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="w-10 h-10 mx-auto bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.ImageURL ? (
                          <Image
                            src={item.ImageURL}
                            alt={item.Name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{item.Code}</TableCell>
                    <TableCell className="font-medium text-center">{item.Name}</TableCell>
                    <TableCell className="text-center">{item.ShortName}</TableCell>
                    <TableCell className="text-center">{formatCurrencyEGP(item.DiscountValue)}</TableCell>
                    <TableCell className="text-center">{item.DiscountPercent.toLocaleString('ar-EG')}%</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={item.IsActive} disabled />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={item.IsSalesOffer} disabled />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={item.IsBindShop} disabled />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={item.IsBindShopMaster} disabled />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>عدد العناصر في الصفحة</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={async (value) => {
                const newValue = Number(value)
                setItemsPerPage(newValue)
                setCurrentPage(1)
                await updateItemsPerPage(newValue)
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            صفحة {currentPage} من {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}