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

type Unit = {
  id: string
  ID: string
  Name: string
  IsActive: boolean
}

type SortConfig = {
  key: keyof Unit | null
  direction: "ascending" | "descending"
}

export default function UnitsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/units")
  
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true)
        console.log("Fetching units data...")
        
        const unitsCollection = collection(db, "Def_Units")
        const unitsSnapshot = await getDocs(unitsCollection)
        
        if (unitsSnapshot.empty) {
          console.log("No units found in database")
          setUnits([])
          return
        }

        console.log(`Found ${unitsSnapshot.docs.length} units`)
        
        const unitsData = unitsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          console.log(`Processing unit: ${doc.id}`, data)
          return {
            id: doc.id,
            ID: data.ID || doc.id,
            Name: data.Name || '',
            IsActive: data.IsActive || false
          }
        })

        // Sort data by ID
        const sortedData = unitsData.sort((a, b) => {
          const idA = parseInt(a.ID) || 0
          const idB = parseInt(b.ID) || 0
          return idA - idB
        })
        
        console.log("Sorted units data:", sortedData)
        setUnits(sortedData)

        // إذا كان هناك عنصر محدد سابقاً، قم بتمييزه
        if (settings?.LastSelectedItem) {
          const selectedUnit = sortedData.find(unit => Number(unit.ID) === settings.LastSelectedItem)
          if (selectedUnit) {
            const unitIndex = sortedData.indexOf(selectedUnit)
            const pageNumber = Math.floor(unitIndex / itemsPerPage) + 1
            setCurrentPage(pageNumber)
            setSelectedUnit(selectedUnit)
          }
        }
      } catch (error) {
        console.error("Error fetching units:", error)
        notify.error("حدث خطأ أثناء جلب بيانات الوحدات. الرجاء المحاولة مرة أخرى.")
      } finally {
        setLoading(false)
      }
    }

    fetchUnits()
  }, [])

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
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
    const filteredUnits = units.filter((unit) =>
      Object.values(unit).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (sortConfig.key) {
      filteredUnits.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filteredUnits
  }, [units, searchTerm, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: keyof Unit) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ columnKey, children }: { columnKey: keyof Unit; children: React.ReactNode }) => (
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
      await deleteDoc(doc(db, "Def_Units", id))
      setUnits(prev => prev.filter(unit => String(unit.ID) !== id))
      setSelectedUnit(null)
      notify.success("تم حذف الوحدة بنجاح")
    } catch (error) {
      console.error("Error deleting unit:", error)
      notify.error("حدث خطأ أثناء حذف الوحدة")
    }
  }

  const handleEdit = async (unit: Unit) => {
    await updateLastSelectedItem(Number(unit.ID))
    const params = new URLSearchParams({
      id: String(unit.ID),
      data: JSON.stringify(unit)
    })
    router.push(`/admin/definitions/units/form?${params.toString()}`)
  }

  const actionButtons = [
    { label: "جديد", icon: Plus, href: "/admin/definitions/units/form" },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => selectedUnit && handleEdit(selectedUnit), 
      disabled: !selectedUnit 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => selectedUnit && handleDelete(selectedUnit.id), 
      disabled: !selectedUnit, 
      variant: "destructive" as const 
    },
    { label: "طباعة", icon: Printer, onClick: () => {} },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="عرض الوحدات" actionButtons={actionButtons} />
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن وحدة..."
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((unit) => (
                  <TableRow
                    key={unit.ID}
                    onClick={() => setSelectedUnit(unit)}
                    onDoubleClick={() => handleEdit(unit)}
                    className={`cursor-pointer ${selectedUnit?.ID === unit.ID ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    <TableCell className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(unit)
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
                            handleDelete(String(unit.ID))
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell>{unit.ID}</TableCell>
                    <TableCell className="font-medium">{unit.Name}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={unit.IsActive} disabled />
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