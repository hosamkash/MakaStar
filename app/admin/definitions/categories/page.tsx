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
  Package,
} from "lucide-react"
import Image from "next/image"

import PageHeader from "@/components/page-header"
import { useScreenSettings } from "@/lib/hooks/use-screen-settings"
import { notify } from "@/lib/notifications"

type Category = {
  id: string
  ID: string
  Code: string
  Name: string
  IsActive: boolean
  IsSalesCategory: boolean
  IsViewAllProducts: boolean
  IsBindShop: boolean
  IsBindShopMaster: boolean
  ImageName: string
  ImageURL: string
  ShortName: string
  IsSelected: boolean
}

type SortConfig = {
  key: keyof Category | null
  direction: "ascending" | "descending"
}

export default function CategoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/categories")
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        console.log("Fetching categories data...")
        
        const categoriesCollection = collection(db, "Def_Categories")
        const categoriesSnapshot = await getDocs(categoriesCollection)
        
        if (categoriesSnapshot.empty) {
          console.log("No categories found in database")
          setCategories([])
          return
        }

        console.log(`Found ${categoriesSnapshot.docs.length} categories`)
        
        const categoriesData = categoriesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          console.log(`Processing category: ${doc.id}`, data)
          return {
            id: doc.id,
            ID: data.ID || doc.id,
            Code: data.Code || '',
            Name: data.Name || '',
            IsActive: data.IsActive || false,
            IsSalesCategory: data.IsSalesCategory || false,
            IsViewAllProducts: data.IsViewAllProducts || false,
            IsBindShop: data.IsBindShop || false,
            IsBindShopMaster: data.IsBindShopMaster || false,
            ImageName: data.ImageName || '',
            ImageURL: data.ImageURL || '',
            ShortName: data.ShortName || '',
            IsSelected: data.IsSelected || false
          }
        })

        // Sort data by Code
        const sortedData = categoriesData.sort((a, b) => {
          const codeA = parseInt(a.Code) || 0
          const codeB = parseInt(b.Code) || 0
          return codeA - codeB
        })
        
        console.log("Sorted categories data:", sortedData)
        setCategories(sortedData)

        // إذا كان هناك عنصر محدد سابقاً، قم بتمييزه
        if (settings?.LastSelectedItem) {
          const selectedCategory = sortedData.find(category => Number(category.ID) === settings.LastSelectedItem)
          if (selectedCategory) {
            const categoryIndex = sortedData.indexOf(selectedCategory)
            const pageNumber = Math.floor(categoryIndex / itemsPerPage) + 1
            setCurrentPage(pageNumber)
            setSelectedCategory(selectedCategory)
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        notify.error("حدث خطأ أثناء جلب بيانات التصنيفات. الرجاء المحاولة مرة أخرى.")
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
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
    const filteredCategories = categories.filter((category) =>
      Object.values(category).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (sortConfig.key) {
      filteredCategories.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filteredCategories
  }, [categories, searchTerm, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: keyof Category) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ columnKey, children }: { columnKey: keyof Category; children: React.ReactNode }) => (
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
      await deleteDoc(doc(db, "Def_Categories", id))
      setCategories(prev => prev.filter(category => String(category.ID) !== id))
      setSelectedCategory(null)
      notify.success("تم حذف التصنيف بنجاح")
    } catch (error) {
      console.error("Error deleting category:", error)
      notify.error("حدث خطأ أثناء حذف التصنيف")
    }
  }

  const handleEdit = async (category: Category) => {
    await updateLastSelectedItem(Number(category.ID))
    const params = new URLSearchParams({
      id: String(category.ID),
      data: JSON.stringify(category)
    })
    router.push(`/admin/definitions/categories/form?${params.toString()}`)
  }

  const actionButtons = [
    { label: "جديد", icon: Plus, href: "/admin/definitions/categories/form" },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => selectedCategory && handleEdit(selectedCategory), 
      disabled: !selectedCategory 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => selectedCategory && handleDelete(String(selectedCategory.ID)), 
      disabled: !selectedCategory, 
      variant: "destructive" as const 
    },
    { label: "طباعة", icon: Printer, onClick: () => {} },
  ]

  return (
    <div className="w-full max-w-full">
      <PageHeader title="عرض التصنيفات" actionButtons={actionButtons} />
      <Card className="w-full">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative w-full sm:max-w-xs lg:max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن تصنيف..."
                className="pr-10 text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              إجمالي النتائج: {processedData.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="responsive-table">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableHead className="w-[60px] sm:w-[80px] sticky right-0 bg-gray-50 dark:bg-gray-800 z-10">إجراءات</TableHead>
                  <TableHead className="w-[60px] text-center">الصورة</TableHead>
                  <SortableHeader columnKey="ID">المعرف</SortableHeader>
                  <SortableHeader columnKey="Code">الكود</SortableHeader>
                  <SortableHeader columnKey="Name">الإسم</SortableHeader>
                  <TableHead className="hide-mobile">الإسم المختصر</TableHead>
                  <TableHead className="text-center font-bold text-xs sm:text-sm min-w-[60px]">نشط</TableHead>
                  <TableHead className="text-center font-bold text-xs sm:text-sm min-w-[80px] hide-tablet">فئة مبيعات</TableHead>
                  <TableHead className="text-center font-bold text-xs sm:text-sm min-w-[100px] hide-mobile">عرض المنتجات</TableHead>
                  <TableHead className="text-center font-bold text-xs sm:text-sm min-w-[80px] hide-mobile">مرتبط بمتجر</TableHead>
                  <TableHead className="text-center font-bold text-xs sm:text-sm min-w-[80px] hide-mobile">متجر رئيسي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((category) => (
                  <TableRow
                    key={category.ID}
                    onClick={() => setSelectedCategory(category)}
                    onDoubleClick={() => handleEdit(category)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedCategory?.ID === category.ID ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <TableCell className="sticky right-0 bg-white dark:bg-gray-900 z-10">
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(category)
                          }}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
                              handleDelete(String(category.ID))
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="w-10 h-10 mx-auto bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {category.ImageURL ? (
                          <Image
                            src={category.ImageURL}
                            alt={category.Name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{category.ID}</TableCell>
                    <TableCell className="text-sm">{category.Code}</TableCell>
                    <TableCell className="font-medium text-sm max-w-[120px] sm:max-w-none truncate">
                      {category.Name}
                    </TableCell>
                    <TableCell className="hide-mobile text-sm">{category.ShortName}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={category.IsActive} disabled className="scale-75 sm:scale-100" />
                    </TableCell>
                    <TableCell className="text-center hide-tablet">
                      <Checkbox checked={category.IsSalesCategory} disabled className="scale-75 sm:scale-100" />
                    </TableCell>
                    <TableCell className="text-center hide-mobile">
                      <Checkbox checked={category.IsViewAllProducts} disabled className="scale-75 sm:scale-100" />
                    </TableCell>
                    <TableCell className="text-center hide-mobile">
                      <Checkbox checked={category.IsBindShop} disabled className="scale-75 sm:scale-100" />
                    </TableCell>
                    <TableCell className="text-center hide-mobile">
                      <Checkbox checked={category.IsBindShopMaster} disabled className="scale-75 sm:scale-100" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="p-3 sm:p-4 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="whitespace-nowrap">عدد العناصر في الصفحة</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={async (value) => {
                const newValue = Number(value)
                setItemsPerPage(newValue)
                setCurrentPage(1)
                await updateItemsPerPage(newValue)
              }}
            >
              <SelectTrigger className="w-16 sm:w-20 h-8">
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
          <div className="text-xs sm:text-sm text-muted-foreground">
            صفحة {currentPage} من {totalPages} ({processedData.length} عنصر)
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
