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
} from "lucide-react"

import PageHeader from "@/components/page-header"
import { useScreenSettings } from "@/lib/hooks/use-screen-settings"
import { useSearchParams } from "next/navigation"
import { notify } from "@/lib/notifications"

type Branch = {
  id: string
  Code: number
  Name: string
  DateCreate: string
  Adress: string
  Phone: string
  Mobile: string
  Logo: string
  isActive: boolean
  isOwner: boolean
  defaultStock: string
  defaultTreasure: string
  defaultEmployee: string
  IsBindShop: boolean
  ID: number
}

type SortConfig = {
  key: keyof Branch | null
  direction: "ascending" | "descending"
}

export default function CompanyBranchesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/company-data")
  
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true)
        console.log("Fetching branches data...")
        
        const branchesCollection = collection(db, "Def_CompanyStructure")
        const branchesSnapshot = await getDocs(branchesCollection)
        
        if (branchesSnapshot.empty) {
          console.log("No branches found in database")
          setBranches([])
          return
        }

        const branchesData = branchesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            Code: parseInt(data.Code) || 0,
            Name: data.Name || '',
            DateCreate: data.DateCreate || '',
            Adress: data.Adress || '',
            Phone: data.Phone || '',
            Mobile: data.Mobile || '',
            Logo: data.Logo || '',
            isActive: data.isActive || false,
            isOwner: data.isOwner || false,
            defaultStock: data.defaultStock || '',
            defaultTreasure: data.defaultTreasure || '',
            defaultEmployee: data.defaultEmployee || '',
            IsBindShop: data.IsBindShop || false,
            ID: parseInt(data.ID) || 0
          }
        })

        // ترتيب البيانات حسب الكود
        const sortedData = branchesData.sort((a, b) => {
          return a.Code - b.Code
        })
        
        setBranches(sortedData)

        // إذا كان هناك عنصر محدد سابقاً، قم بتمييزه
        if (settings?.LastSelectedItem) {
          const selectedBranch = sortedData.find(branch => branch.id === settings.LastSelectedItem)
          if (selectedBranch) {
            const branchIndex = sortedData.indexOf(selectedBranch)
            const pageNumber = Math.floor(branchIndex / itemsPerPage) + 1
            setCurrentPage(pageNumber)
            setSelectedBranch(selectedBranch)
          }
        }
      } catch (error) {
        console.error("Error fetching branches:", error)
        // إظهار رسالة خطأ للمستخدم
        alert("حدث خطأ أثناء جلب بيانات الفروع. الرجاء المحاولة مرة أخرى.")
      } finally {
        setLoading(false)
      }
    }

    fetchBranches()
  }, [])
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "id", direction: "ascending" })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(settings?.ItemsPerPage || 10)

  // تحديث عدد العناصر في الصفحة عند تحميل الإعدادات
  useEffect(() => {
    if (settings?.ItemsPerPage) {
      setItemsPerPage(settings.ItemsPerPage)
    }
  }, [settings])

  const processedData = useMemo(() => {
    const filteredBranches = branches.filter((branch) =>
      Object.values(branch).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (sortConfig.key) {
      filteredBranches.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filteredBranches
  }, [branches, searchTerm, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: keyof Branch) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ columnKey, children }: { columnKey: keyof Branch; children: React.ReactNode }) => (
    <TableHead className="font-bold">
      <Button variant="ghost" onClick={() => requestSort(columnKey)} className="px-1 py-1 text-xs">
        {children}
        {sortConfig.key === columnKey && (
          <span className="mr-1">
            {sortConfig.direction === "ascending" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          </span>
        )}
      </Button>
    </TableHead>
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "Def_CompanyStructure", id))
      setBranches(prev => prev.filter(branch => branch.id !== id))
      setSelectedBranch(null)
      alert('تم حذف الفرع بنجاح')
    } catch (error) {
      console.error("Error deleting branch:", error)
      alert('حدث خطأ أثناء حذف الفرع')
    }
  }

  const handleEdit = async (branch: Branch) => {
    await updateLastSelectedItem(branch.id)
    const params = new URLSearchParams({
      id: branch.id,
      data: JSON.stringify(branch)
    })
    router.push(`/admin/definitions/company-data/form?${params.toString()}`)
  }

  const actionButtons = [
    { label: "جديد", icon: Plus, href: "/admin/definitions/company-data/form" },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => selectedBranch && handleEdit(selectedBranch), 
      disabled: !selectedBranch 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => selectedBranch && handleDelete(selectedBranch.id), 
      disabled: !selectedBranch, 
      variant: "destructive" as const 
    },
    { label: "طباعة", icon: Printer, onClick: () => {} },
  ]

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <PageHeader title="عرض الفروع" actionButtons={actionButtons} />
      <Card className="w-full">
        <CardHeader className="p-3">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن فرع..."
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
                  <TableHead className="w-[40px] text-xs"></TableHead>
                  <SortableHeader columnKey="Code">الكود</SortableHeader>
                  <SortableHeader columnKey="Name">الإسم</SortableHeader>
                  <SortableHeader columnKey="Phone">الهاتف</SortableHeader>
                  <SortableHeader columnKey="Mobile">الموبايل</SortableHeader>
                  <TableHead className="text-center font-bold text-xs">نشط</TableHead>
                  <TableHead className="text-center font-bold text-xs">مالك</TableHead>
                  <TableHead className="text-center font-bold text-xs">متجر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((branch) => (
                  <TableRow
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch)}
                    onDoubleClick={() => handleEdit(branch)}
                    className={`cursor-pointer ${selectedBranch?.id === branch.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    <TableCell className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(branch)
                        }}
                      >
                        <Edit className="h-3 w-3 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
                            handleDelete(String(branch.id))
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-xs">{branch.Code}</TableCell>
                    <TableCell className="font-medium text-xs max-w-[120px] truncate" title={branch.Name}>{branch.Name}</TableCell>
                    <TableCell dir="ltr" className="text-left text-xs">{branch.Phone}</TableCell>
                    <TableCell dir="ltr" className="text-left text-xs">{branch.Mobile}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={branch.isActive} disabled className="h-3 w-3" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={branch.isOwner} disabled className="h-3 w-3" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={branch.IsBindShop} disabled className="h-3 w-3" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>عدد العناصر:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={async (value) => {
                const newValue = Number(value)
                setItemsPerPage(newValue)
                setCurrentPage(1)
                await updateItemsPerPage(newValue)
              }}
            >
              <SelectTrigger className="w-16 h-8">
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
          <div className="text-xs text-muted-foreground">
            صفحة {currentPage} من {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsRight className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsLeft className="h-3 w-3" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
