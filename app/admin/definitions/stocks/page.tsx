"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, getDocs, deleteDoc, doc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

type Stock = {
  id: string
  ID: string
  Code: string
  Name: string
  IsActive: boolean
  IsBindBranch: boolean
  IDBranch: string
  IsBindShop: boolean
}

type SortConfig = {
  key: keyof Stock | null
  direction: "ascending" | "descending"
}

export default function WarehousesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/stocks")
  
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true)
        console.log("Fetching warehouses data...")
        
        const stocksCollection = collection(db, "Def_Stocks")
        const stocksSnapshot = await getDocs(stocksCollection)
        
        if (stocksSnapshot.empty) {
          console.log("No warehouses found in database")
          setStocks([])
          return
        }

        console.log(`Found ${stocksSnapshot.docs.length} warehouses`)
        
        const stocksData = stocksSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          console.log(`Processing warehouse: ${doc.id}`, data)
          return {
            id: doc.id,
            ID: data.ID || doc.id,
            Code: data.Code || '',
            Name: data.Name || '',
            IsActive: data.IsActive || false,
            IsBindBranch: data.IsBindBranch || false,
            IDBranch: data.IDBranch || '',
            IsBindShop: data.IsBindShop || false
          }
        })

        // Sort data by Code
        const sortedData = stocksData.sort((a, b) => {
          const codeA = parseInt(a.Code) || 0
          const codeB = parseInt(b.Code) || 0
          return codeA - codeB
        })
        
        console.log("Sorted warehouses data:", sortedData)
        setStocks(sortedData)

        // إذا كان هناك عنصر محدد سابقاً، قم بتمييزه
        if (settings?.LastSelectedItem) {
          const selectedStock = sortedData.find(stock => Number(stock.ID) === settings.LastSelectedItem)
          if (selectedStock) {
            const stockIndex = sortedData.indexOf(selectedStock)
            const pageNumber = Math.floor(stockIndex / itemsPerPage) + 1
            setCurrentPage(pageNumber)
            setSelectedStock(selectedStock)
          }
        }
      } catch (error) {
        console.error("Error fetching warehouses:", error)
        notify.error("حدث خطأ أثناء جلب بيانات المخازن. الرجاء المحاولة مرة أخرى.")
      } finally {
        setLoading(false)
      }
    }

    fetchStocks()
  }, [])

  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "ID", direction: "ascending" })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(settings?.ItemsPerPage || 10)

  // تحديث عدد العناصر في الصفحة عند تحميل الإعدادات
  useEffect(() => {
    if (settings?.ItemsPerPage) {
      setItemsPerPage(settings.ItemsPerPage)
    }
  }, [settings])

  const processedData = useMemo(() => {
    const filteredStocks = stocks.filter((stock) =>
      Object.values(stock).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (sortConfig.key) {
      filteredStocks.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filteredStocks
  }, [stocks, searchTerm, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: keyof Stock) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ columnKey, children }: { columnKey: keyof Stock; children: React.ReactNode }) => (
    <TableHead className="font-bold">
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

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "Def_Stocks", id))
      setStocks(prev => prev.filter(stock => String(stock.ID) !== id))
      setSelectedStock(null)
      notify.success("تم حذف المخزن بنجاح")
    } catch (error) {
      console.error("Error deleting warehouse:", error)
      notify.error("حدث خطأ أثناء حذف المخزن")
    }
  }

  const handleEdit = async (stock: Stock) => {
    await updateLastSelectedItem(Number(stock.ID))
    const params = new URLSearchParams({
      id: String(stock.ID),
      data: JSON.stringify(stock)
    })
    router.push(`/admin/definitions/stocks/form?${params.toString()}`)
  }

  const actionButtons = [
    { label: "جديد", icon: Plus, href: "/admin/definitions/stocks/form" },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => selectedStock && handleEdit(selectedStock), 
      disabled: !selectedStock 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => selectedStock && handleDelete(String(selectedStock.ID)), 
      disabled: !selectedStock, 
      variant: "destructive" as const 
    },
    { label: "طباعة", icon: Printer, onClick: () => {} },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="عرض المخازن" actionButtons={actionButtons} />
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مخزن..."
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
                  <TableHead className="w-[50px]"></TableHead>
                  <SortableHeader columnKey="ID">المعرف</SortableHeader>
                  <SortableHeader columnKey="Code">الكود</SortableHeader>
                  <SortableHeader columnKey="Name">الإسم</SortableHeader>
                  <SortableHeader columnKey="IDBranch">الفرع</SortableHeader>
                  <TableHead className="text-center font-bold text-base">نشط</TableHead>
                  <TableHead className="text-center font-bold text-base">مرتبط بفرع</TableHead>
                  <TableHead className="text-center font-bold text-base">مرتبط بمتجر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((stock) => (
                  <TableRow
                    key={stock.ID}
                    onClick={() => setSelectedStock(stock)}
                    onDoubleClick={() => handleEdit(stock)}
                    className={`cursor-pointer ${selectedStock?.ID === stock.ID ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    <TableCell className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(stock)
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('هل أنت متأكد من حذف هذا المخزن؟')) {
                            handleDelete(String(stock.ID))
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell>{stock.ID}</TableCell>
                    <TableCell>{stock.Code}</TableCell>
                    <TableCell className="font-medium">{stock.Name}</TableCell>
                    <TableCell>{stock.IDBranch}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={stock.IsActive} disabled />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={stock.IsBindBranch} disabled />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={stock.IsBindShop} disabled />
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
                {[5, 10, 20, 50].map((size) => (
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
