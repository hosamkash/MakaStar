"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, updateDoc, deleteDoc, doc, DocumentData, QueryDocumentSnapshot, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Filter,
  FolderOpen,
  Folder,
  Star,
} from "lucide-react"

import PageHeader from "@/components/page-header"
import { useScreenSettings } from "@/lib/hooks/use-screen-settings"
import { useSearchParams } from "next/navigation"
import { notify } from "@/lib/notifications"

type Category = {
  ID: number
  Code: number
  Name: string
  IsActive: boolean
  IsSalesCategory: boolean
  IsViewAllProducts: boolean
  IsBindShop: boolean
  IsBindShopMaster: boolean
  ImageName: string
  ImageURL: string
  ShortName: string
}

type ShopCategory = {
  id: string
  mainCategoryId: number
  mainCategoryName: string
  subCategories: number[]
  subCategoriesNames: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type SortConfig = {
  key: keyof ShopCategory | null
  direction: "ascending" | "descending"
}

export default function ShopCategoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/shop-categories")
  
  const [categories, setCategories] = useState<Category[]>([])
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: "mainCategoryName", 
    direction: "ascending"
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedItem, setSelectedItem] = useState<ShopCategory | null>(null)


  // تحميل البيانات
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // تحميل التصنيفات
        const categoriesCollection = collection(db, "Def_Categories")
        const categoriesSnapshot = await getDocs(categoriesCollection)
        const categoriesData = categoriesSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            ID: parseInt(doc.id) || 0,
            Code: data.Code || 0,
            Name: data.Name || '',
            IsActive: data.IsActive || false,
            IsSalesCategory: data.IsSalesCategory || false,
            IsViewAllProducts: data.IsViewAllProducts || false,
            IsBindShop: data.IsBindShop || false,
            IsBindShopMaster: data.IsBindShopMaster || false,
            ImageName: data.ImageName || '',
            ImageURL: data.ImageURL || '',
            ShortName: data.ShortName || ''
          }
        }).sort((a, b) => a.ID - b.ID)
        setCategories(categoriesData)
        
        // تحميل تصنيفات المتجر
        const shopCategoriesCollection = collection(db, "Def_ShopCategories")
        const shopCategoriesSnapshot = await getDocs(shopCategoriesCollection)
        const shopCategoriesData = shopCategoriesSnapshot.docs.map(doc => {
          const data = doc.data()
          const mainCategory = categoriesData.find(cat => cat.ID === data.mainCategoryId)
          const subCategoriesNames = data.subCategories?.map((subId: number) => {
            const subCategory = categoriesData.find(cat => cat.ID === subId)
            return subCategory?.Name || 'غير محدد'
          }) || []
          
          return {
            id: doc.id,
            mainCategoryId: data.mainCategoryId || 0,
            mainCategoryName: mainCategory?.Name || 'غير محدد',
            subCategories: data.subCategories || [],
            subCategoriesNames: subCategoriesNames,
            isActive: data.isActive || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          }
        })
        setShopCategories(shopCategoriesData)

        // إذا كان هناك عنصر محدد سابقاً، قم بتمييزه
        if (settings?.LastSelectedItem && settings.LastSelectedItem !== 0) {
          const selectedItem = shopCategoriesData.find(item => item.id === settings.LastSelectedItem!.toString())
          if (selectedItem) {
            const itemIndex = shopCategoriesData.indexOf(selectedItem)
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
    let filteredData = shopCategories

    // فلترة بالبحث
    filteredData = filteredData.filter((item) =>
      item.mainCategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subCategoriesNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // الترتيب
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filteredData
  }, [shopCategories, searchTerm, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: keyof ShopCategory) => {
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
    columnKey: keyof ShopCategory
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
      await deleteDoc(doc(db, "Def_ShopCategories", id))
      setShopCategories(prev => prev.filter(item => item.id !== id))
      setCurrentPage(1)
      // إزالة العنصر المحدد من الإعدادات إذا كان هو نفسه المحذوف
      if (settings?.LastSelectedItem?.toString() === id) {
        await updateLastSelectedItem(null)
      }
      notify.success('تم حذف تصنيف المتجر بنجاح')
    } catch (error) {
      console.error("Error deleting shop category:", error)
      notify.error('حدث خطأ أثناء حذف تصنيف المتجر')
    }
  }

  const handleEdit = async (item: ShopCategory) => {
    await updateLastSelectedItem(parseInt(item.id) || null)
    router.push(`/admin/definitions/shop-categories/form?id=${item.id}`)
  }

  // تم نقل منطق الحفظ والتحرير إلى صفحة النموذج المنفصلة

  const toggleSubCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      subCategories: prev.subCategories.includes(categoryId)
        ? prev.subCategories.filter(id => id !== categoryId)
        : [...prev.subCategories, categoryId]
    }))
  }

  const actionButtons = [
    { 
      label: "جديد", 
      icon: Plus, 
      onClick: () => router.push('/admin/definitions/shop-categories/form')
    },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => {
        if (settings?.LastSelectedItem) {
          const selectedItem = shopCategories.find(item => item.id === settings.LastSelectedItem!.toString())
          if (selectedItem) {
            router.push(`/admin/definitions/shop-categories/form?id=${selectedItem.id}`)
          }
        }
      }, 
      disabled: !settings?.LastSelectedItem 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => {
        if (settings?.LastSelectedItem && typeof window !== 'undefined' && confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
          handleDelete(settings.LastSelectedItem.toString())
        }
      },  
      disabled: !settings?.LastSelectedItem, 
      variant: "destructive" as const
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تصنيفات المتجر...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="عرض فئات المتجر" actionButtons={actionButtons} />
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن فئة..."
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
                  <TableHead className="text-center font-bold text-base">نشط</TableHead>
                  <SortableHeader columnKey="mainCategoryName" className="text-center">التصنيف الرئيسي</SortableHeader>
                  <TableHead className="text-center">التصنيفات الفرعية</TableHead>
                  <TableHead className="text-center font-bold text-base">عدد التصنيفات الفرعية</TableHead>
                  <TableHead className="text-center font-bold text-base">تاريخ الإنشاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    onDoubleClick={() => handleEdit(item)}
                    className={`cursor-pointer ${selectedItem?.id === item.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    <TableCell className="flex gap-2 justify-center">
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
                          if (confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
                            handleDelete(item.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={item.isActive} disabled />
                    </TableCell>
                    <TableCell className="font-medium text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {item.mainCategoryName}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {item.subCategoriesNames.map((name, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.subCategories.length}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.createdAt.toLocaleDateString('ar-EG')}
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
