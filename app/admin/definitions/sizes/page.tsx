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
} from "lucide-react"
import PageHeader from "@/components/page-header"
import { useScreenSettings } from "@/lib/hooks/use-screen-settings"
import { notify } from "@/lib/notifications"

type SizeItem = {
  id: string
  ID: string
  Name: string
  IsActive: boolean
}

type SortConfig = {
  key: keyof SizeItem | null
  direction: "ascending" | "descending"
}

export default function SizesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/sizes")
  
  const [items, setItems] = useState<SizeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(settings?.ItemsPerPage || 10)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "ID", direction: "ascending" })
  const [selectedItem, setSelectedItem] = useState<SizeItem | null>(null)

  useEffect(() => {
    if (settings?.ItemsPerPage) {
      setItemsPerPage(settings.ItemsPerPage)
    }
  }, [settings])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        const itemsCollection = collection(db, "Def_Sizes")
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
            Name: data.Name || '',
            IsActive: data.IsActive || false
          }
        })

        const sortedData = itemsData.sort((a, b) => {
          const idA = parseInt(a.ID) || 0
          const idB = parseInt(b.ID) || 0
          return idA - idB
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
        console.error("Error fetching sizes:", error)
        notify.error("حدث خطأ أثناء جلب بيانات المقاسات")
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [refresh])

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "Def_Sizes", id))
      setItems((prevItems) => prevItems.filter((item) => item.id !== id))
      setSelectedItem(null)
      notify.success("تم حذف المقاس بنجاح")
    } catch (error) {
      console.error("Error deleting size:", error)
      notify.error("حدث خطأ أثناء حذف المقاس")
    }
  }

  const handleEdit = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (item) {
      await updateLastSelectedItem(Number(item.ID))
    }
    router.push(`/admin/definitions/sizes/form?id=${id}`)
  }

  const requestSort = (key: keyof SizeItem) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ columnKey, children, className }: { columnKey: keyof SizeItem; children: React.ReactNode; className?: string }) => (
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
    { label: "جديد", icon: Plus, href: "/admin/definitions/sizes/form" },
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
      <PageHeader title="عرض المقاسات" actionButtons={actionButtons} />
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مقاس..."
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
                  <SortableHeader columnKey="ID" className="text-center">المعرف</SortableHeader>
                  <SortableHeader columnKey="Name" className="text-center">الاسم</SortableHeader>
                  <TableHead className="text-center font-bold text-base">نشط</TableHead>
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
                          if (confirm('هل أنت متأكد من حذف هذا المقاس؟')) {
                            handleDelete(item.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">{item.ID}</TableCell>
                    <TableCell className="font-medium text-center">{item.Name}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={item.IsActive} disabled />
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


