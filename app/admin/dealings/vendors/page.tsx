"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Users,
} from "lucide-react"

import PageHeader from "@/components/page-header"
import { useScreenSettings } from "@/lib/hooks/use-screen-settings"
import { useSearchParams } from "next/navigation"
import { notify } from "@/lib/notifications"
import { formatCurrencyEGP } from "@/lib/utils"

type Vendor = {
  ID: number
  IDBranch: number
  Code: number
  Name: string
  IsActive: boolean
  CurrentBalance: number
  BalanceType: number
  Mobile: string
  Phone: string
  Address: string
  Note: string
  UserName: string
  Password: string
}

type SortConfig = {
  key: keyof Vendor | null
  direction: "ascending" | "descending"
}

export default function VendorsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/dealings/vendors")
  
  const [items, setItems] = useState<Vendor[]>([])
  const [branches, setBranches] = useState<{ID: number, Name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: "ID", 
    direction: "ascending"
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // تحميل البيانات
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Fetch vendors
        const itemsCollection = collection(db, "Dealing_Vendors")
        const querySnapshot = await getDocs(itemsCollection)
        const itemsData = querySnapshot.docs.map(doc => ({
          ID: parseInt(doc.id),
          ...doc.data()
        })) as Vendor[]
        setItems(itemsData)

        // Fetch branches from Def_CompanyStructure
        const branchesCollection = collection(db, "Def_CompanyStructure")
        const branchesSnapshot = await getDocs(branchesCollection)
        const branchesData = branchesSnapshot.docs.map((doc, index) => {
          const data = doc.data()
          const docId = parseInt(doc.id)
          return {
            ID: docId || (index + 1000), // Use index + 1000 to avoid conflicts with 0
            Name: data.Name || ''
          }
        }).sort((a, b) => a.ID - b.ID)
        // Remove duplicates based on ID and ensure unique keys
        const uniqueBranches = branchesData.filter((branch, index, self) => 
          index === self.findIndex(b => b.ID === branch.ID)
        ).map((branch, index) => ({
          ...branch,
          ID: branch.ID || (index + 1000) // Ensure no 0 values
        }))
        setBranches(uniqueBranches)

        // إذا كان هناك عنصر محدد سابقاً، قم بتمييزه
        if (settings?.LastSelectedItem) {
          const selectedItem = itemsData.find(item => item.ID === settings.LastSelectedItem)
          if (selectedItem) {
            const itemIndex = itemsData.indexOf(selectedItem)
            const pageNumber = Math.floor(itemIndex / itemsPerPage) + 1
            setCurrentPage(pageNumber)
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
        notify.error("حدث خطأ أثناء تحميل البيانات")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [refresh, settings?.LastSelectedItem, itemsPerPage])

  // تحديث عدد العناصر في الصفحة
  useEffect(() => {
    if (settings?.ItemsPerPage) {
      setItemsPerPage(settings.ItemsPerPage)
    }
  }, [settings])

  const handleItemsPerPageChange = async (value: string) => {
    const newValue = parseInt(value)
    setItemsPerPage(newValue)
    setCurrentPage(1)
    await updateItemsPerPage(newValue)
  }

  const processedData = useMemo(() => {
    const filteredVendors = items.filter((vendor) =>
      Object.values(vendor).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (sortConfig.key) {
      filteredVendors.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filteredVendors
  }, [items, searchTerm, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: keyof Vendor) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ 
    columnKey, 
    children,
    className 
  }: { 
    columnKey: keyof Vendor
    children: React.ReactNode
    className?: string
  }) => (
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

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "Dealing_Vendors", id))
      setItems(prev => prev.filter(vendor => String(vendor.ID) !== id))
      setCurrentPage(1) // Reset page to 1 after deletion
      await updateLastSelectedItem(null) // Clear last selected item
      notify.success('تم حذف المورد بنجاح')
    } catch (error) {
      console.error("Error deleting vendor:", error)
      notify.error('حدث خطأ أثناء حذف المورد')
    }
  }

  const handleEdit = async (item: Vendor) => {
    await updateLastSelectedItem(item.ID)
    router.push(`/admin/dealings/vendors/form?id=${item.ID}`)
  }

  const actionButtons = [
    { 
      label: "جديد", 
      icon: Plus, 
      onClick: () => router.push("/admin/dealings/vendors/form")
    },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => settings?.LastSelectedItem && handleEdit(items.find(item => item.ID === settings.LastSelectedItem)!), 
      disabled: !settings?.LastSelectedItem 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => {
        if (settings?.LastSelectedItem && confirm('هل أنت متأكد من حذف هذا المورد؟')) {
          handleDelete(String(settings.LastSelectedItem))
        }
      },  
      disabled: !settings?.LastSelectedItem, 
      variant: "destructive" as const 
    },
    { 
      label: "طباعة", 
      icon: Printer, 
      onClick: () => {},
      disabled: true
    },
  ]

  return (
    <div className="container p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="الموردين"
        actionButtons={actionButtons}
      />
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مورد..."
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
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableHead className="w-[100px]"></TableHead>
                  <SortableHeader columnKey="Name">الإسم</SortableHeader>
                  <SortableHeader columnKey="IDBranch">الفرع</SortableHeader>
                  <TableHead className="w-[80px] text-center">نشط</TableHead>
                  <SortableHeader columnKey="CurrentBalance">الرصيد الحالي</SortableHeader>
                  <SortableHeader columnKey="BalanceType">حالة الرصيد</SortableHeader>
                  <SortableHeader columnKey="Address">العنوان</SortableHeader>
                  <SortableHeader columnKey="Phone">الهاتف</SortableHeader>
                  <SortableHeader columnKey="Mobile">الموبيل</SortableHeader>
                  <SortableHeader columnKey="Code">الكود</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow 
                    key={item.ID}
                    className={item.ID === settings?.LastSelectedItem ? "bg-muted/50" : ""}
                    onDoubleClick={() => handleEdit(item)}
                  >
                    <TableCell className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(item)
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
                            handleDelete(String(item.ID))
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium whitespace-normal min-w-[150px]">{item.Name}</TableCell>
                    <TableCell className="text-left">
                      {branches.find(b => b.ID === item.IDBranch)?.Name || item.IDBranch}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={item.IsActive} disabled />
                    </TableCell>
                    <TableCell className="text-left">{formatCurrencyEGP(item.CurrentBalance)}</TableCell>
                    <TableCell className="text-left">
                      {item.BalanceType === 1 ? "مدين (عليه)" : item.BalanceType === 2 ? "دائن (له)" : "-"}
                    </TableCell>
                    <TableCell className="font-medium whitespace-normal min-w-[200px]">{item.Address || '-'}</TableCell>
                    <TableCell className="text-left">{item.Phone || '-'}</TableCell>
                    <TableCell className="text-left">{item.Mobile || '-'}</TableCell>
                    <TableCell>{item.Code}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>عدد العناصر في الصفحة</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={String(itemsPerPage)} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">الصفحة {currentPage} من {totalPages}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
