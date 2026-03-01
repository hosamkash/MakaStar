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

type ProductionCompany = {
  id: string
  ID: string
  Name: string
  IsActive: boolean
  IsSalesCategory: boolean
}

type SortConfig = {
  key: keyof ProductionCompany | null
  direction: "ascending" | "descending"
}

export default function ProductionCompaniesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/productionCom")
  
  const [companies, setCompanies] = useState<ProductionCompany[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        console.log("Fetching production companies data...")
        
        const companiesCollection = collection(db, "Def_ProductionCompanies")
        const companiesSnapshot = await getDocs(companiesCollection)
        
        if (companiesSnapshot.empty) {
          console.log("No production companies found in database")
          setCompanies([])
          return
        }

        console.log(`Found ${companiesSnapshot.docs.length} companies`)
        
        const companiesData = companiesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          console.log(`Processing company: ${doc.id}`, data)
          return {
            id: doc.id,
            ID: data.ID || doc.id,
            Name: data.Name || '',
            IsActive: data.IsActive || false,
            IsSalesCategory: data.IsSalesCategory || false
          }
        })

        // Sort data by ID
        const sortedData = companiesData.sort((a, b) => {
          const idA = parseInt(a.ID) || 0
          const idB = parseInt(b.ID) || 0
          return idA - idB
        })
        
        console.log("Sorted companies data:", sortedData)
        setCompanies(sortedData)

        // إذا كان هناك عنصر محدد سابقاً، قم بتمييزه
        if (settings?.LastSelectedItem) {
          const selectedCompany = sortedData.find(company => Number(company.ID) === settings.LastSelectedItem)
          if (selectedCompany) {
            const companyIndex = sortedData.indexOf(selectedCompany)
            const pageNumber = Math.floor(companyIndex / itemsPerPage) + 1
            setCurrentPage(pageNumber)
            setSelectedCompany(selectedCompany)
          }
        }
      } catch (error) {
        console.error("Error fetching companies:", error)
        notify.error("حدث خطأ أثناء جلب بيانات الشركات المنتجة. الرجاء المحاولة مرة أخرى.")
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  const [selectedCompany, setSelectedCompany] = useState<ProductionCompany | null>(null)
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
    const filteredCompanies = companies.filter((company) =>
      Object.values(company).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (sortConfig.key) {
      filteredCompanies.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filteredCompanies
  }, [companies, searchTerm, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: keyof ProductionCompany) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ columnKey, children }: { columnKey: keyof ProductionCompany; children: React.ReactNode }) => (
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
      await deleteDoc(doc(db, "Def_ProductionCompanies", id))
      setCompanies(prev => prev.filter(company => String(company.ID) !== id))
      setSelectedCompany(null)
      notify.success("تم حذف الشركة المنتجة بنجاح")
    } catch (error) {
      console.error("Error deleting company:", error)
      notify.error("حدث خطأ أثناء حذف الشركة المنتجة")
    }
  }

  const handleEdit = async (company: ProductionCompany) => {
    await updateLastSelectedItem(Number(company.ID))
    const params = new URLSearchParams({
      id: String(company.ID),
      data: JSON.stringify(company)
    })
    router.push(`/admin/definitions/productionCom/form?${params.toString()}`)
  }

  const actionButtons = [
    { label: "جديد", icon: Plus, href: "/admin/definitions/productionCom/form" },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => selectedCompany && handleEdit(selectedCompany), 
      disabled: !selectedCompany 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => selectedCompany && handleDelete(String(selectedCompany.ID)), 
      disabled: !selectedCompany, 
      variant: "destructive" as const 
    },
    { label: "طباعة", icon: Printer, onClick: () => {} },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="عرض الشركات المنتجة" actionButtons={actionButtons} />
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن شركة منتجة..."
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
                  <SortableHeader columnKey="Name">الإسم</SortableHeader>
                  <TableHead className="text-center font-bold text-base">نشط</TableHead>
                  <TableHead className="text-center font-bold text-base">فئة مبيعات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((company) => (
                  <TableRow
                    key={company.ID}
                    onClick={() => setSelectedCompany(company)}
                    onDoubleClick={() => handleEdit(company)}
                    className={`cursor-pointer ${selectedCompany?.ID === company.ID ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    <TableCell className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(company)
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('هل أنت متأكد من حذف هذه الشركة المنتجة؟')) {
                            handleDelete(String(company.ID))
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell>{company.ID}</TableCell>
                    <TableCell className="font-medium">{company.Name}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={company.IsActive} disabled />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={company.IsSalesCategory} disabled />
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