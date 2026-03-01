"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, deleteDoc, doc, DocumentData, QueryDocumentSnapshot, setDoc, deleteField } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Filter,
  Folder,
} from "lucide-react"
import Image from "next/image"

import PageHeader from "@/components/page-header"
import { useScreenSettings } from "@/lib/hooks/use-screen-settings"
import { useSearchParams } from "next/navigation"
import { notify } from "@/lib/notifications"
import { formatCurrencyEGP } from "@/lib/utils"

type Product = {
  ID: number
  BarCode: number
  Name: string
  IDCategory: number
  IDProductionCompany: number
  UnitBig_ID: number
  UnitBig_PurchasePrice: number
  UnitBig_Sales1: number
  UnitBig_Sales2: number
  UnitBig_Sales3: number
  UnitBig_Sales4: number
  UnitBig_Sales5: number
  UnitCountOf: number
  UnitSmall_ID: number
  UnitSmall_PurchasePrice: number
  UnitSmall_Sales1: number
  UnitSmall_Sales2: number
  UnitSmall_Sales3: number
  UnitSmall_Sales4: number
  UnitSmall_Sales5: number
  LimitedQty: number
  IsActive: boolean
  IsPOS: boolean
  IsShop: boolean
  IsUpdated: boolean
  ImageName: string
  ImageURL: string
  ImageFolderPath: string
  ShopPriceBeforDiscount: number
  ShopDiscountValue: number
  ShopDiscountPercent: number
  ShopPrice: number
  ShopColors: string
  ShopSizes: string
  ShopShortDiscription: string
  ShopLongDiscription: string
  IsFavoritClientTemp: boolean
  SalesComission_PurchasePrice: number
  SalesComission_Sales1: number
  SalesComission_Sales2: number
  SalesComission_Sales3: number
  SalesComission_Sales4: number
  SalesComission_Sales5: number
  AdminComission_PurchasePrice: number
  AdminComission_Sales1: number
  AdminComission_Sales2: number
  AdminComission_Sales3: number
  AdminComission_Sales4: number
  AdminComission_Sales5: number
  DefaultSalesCommission: number
}

type Category = {
  ID: number
  Code: number
  Name: string
}

type SortConfig = {
  key: keyof Product | null
  direction: "ascending" | "descending"
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/products")
  
  const [items, setItems] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: "ID", 
    direction: "ascending"
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [categorySelectionDialogOpen, setCategorySelectionDialogOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [productCategoriesDialogOpen, setProductCategoriesDialogOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [productSelectedCategories, setProductSelectedCategories] = useState<number[]>([])

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
            Name: data.Name || ""
          }
        })
        setCategories(categoriesData)

        // تحميل المنتجات
        const productsCollection = collection(db, "Def_ProductStructure")
        const productsSnapshot = await getDocs(productsCollection)
        const productsData = productsSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            ID: parseInt(doc.id) || 0,
            BarCode: data.BarCode || 0,
            Name: data.Name || "",
            IDCategory: data.IDCategory || 0,
            IDProductionCompany: data.IDProductionCompany || 0,
            UnitBig_ID: data.UnitBig_ID || 0,
            UnitBig_PurchasePrice: data.UnitBig_PurchasePrice || 0,
            UnitBig_Sales1: data.UnitBig_Sales1 || 0,
            UnitBig_Sales2: data.UnitBig_Sales2 || 0,
            UnitBig_Sales3: data.UnitBig_Sales3 || 0,
            UnitBig_Sales4: data.UnitBig_Sales4 || 0,
            UnitBig_Sales5: data.UnitBig_Sales5 || 0,
            UnitCountOf: data.UnitCountOf || 0,
            UnitSmall_ID: data.UnitSmall_ID || 0,
            UnitSmall_PurchasePrice: data.UnitSmall_PurchasePrice || 0,
            UnitSmall_Sales1: data.UnitSmall_Sales1 || 0,
            UnitSmall_Sales2: data.UnitSmall_Sales2 || 0,
            UnitSmall_Sales3: data.UnitSmall_Sales3 || 0,
            UnitSmall_Sales4: data.UnitSmall_Sales4 || 0,
            UnitSmall_Sales5: data.UnitSmall_Sales5 || 0,
            LimitedQty: data.LimitedQty || 0,
            IsActive: data.IsActive || false,
            IsPOS: data.IsPOS || false,
            IsShop: data.IsShop || false,
            IsUpdated: data.IsUpdated || false,
            ImageName: data.ImageName || "",
            ImageURL: data.ImageURL || "",
            ImageFolderPath: data.ImageFolderPath || "",
            ShopPriceBeforDiscount: data.ShopPriceBeforDiscount || 0,
            ShopDiscountValue: data.ShopDiscountValue || 0,
            ShopDiscountPercent: data.ShopDiscountPercent || 0,
            ShopPrice: data.ShopPrice || 0,
            ShopColors: data.ShopColors || "",
            ShopSizes: data.ShopSizes || "",
            ShopShortDiscription: data.ShopShortDiscription || "",
            ShopLongDiscription: data.ShopLongDiscription || "",
            IsFavoritClientTemp: data.IsFavoritClientTemp || false,
            SalesComission_PurchasePrice: data.SalesComission_PurchasePrice || 0,
            SalesComission_Sales1: data.SalesComission_Sales1 || 0,
            SalesComission_Sales2: data.SalesComission_Sales2 || 0,
            SalesComission_Sales3: data.SalesComission_Sales3 || 0,
            SalesComission_Sales4: data.SalesComission_Sales4 || 0,
            SalesComission_Sales5: data.SalesComission_Sales5 || 0,
            AdminComission_PurchasePrice: data.AdminComission_PurchasePrice || 0,
            AdminComission_Sales1: data.AdminComission_Sales1 || 0,
            AdminComission_Sales2: data.AdminComission_Sales2 || 0,
            AdminComission_Sales3: data.AdminComission_Sales3 || 0,
            AdminComission_Sales4: data.AdminComission_Sales4 || 0,
            AdminComission_Sales5: data.AdminComission_Sales5 || 0,
            DefaultSalesCommission: data.DefaultSalesCommission || 0
          }
        })
        setItems(productsData)
      } catch (error) {
        console.error("Error loading data:", error)
        notify.error("حدث خطأ في تحميل البيانات")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [refresh])

  // فلترة البيانات
  const filteredData = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.BarCode.toString().includes(searchTerm)
      const matchesCategory = selectedCategory === "all" || 
                             item.IDCategory.toString() === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [items, searchTerm, selectedCategory])

  // ترتيب البيانات
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]
      
      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  // pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedData.slice(startIndex, endIndex)

  // دالة الترتيب
  const requestSort = (key: keyof Product) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // دالة التعديل
  const handleEdit = (item: Product) => {
    updateLastSelectedItem(item.ID)
    router.push(`/admin/definitions/products/form?id=${item.ID}`)
  }

  // دالة الحذف
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "Def_ProductStructure", id))
      setItems(prev => prev.filter(item => item.ID.toString() !== id))
      notify.success("تم حذف الصنف بنجاح")
    } catch (error) {
      console.error("Error deleting item:", error)
      notify.error("حدث خطأ في حذف الصنف")
    }
  }

  // دالة تغيير عدد العناصر في الصفحة
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    updateItemsPerPage(newItemsPerPage)
  }

  // دالة اختيار التصنيفات الفرعية
  const handleCategorySelection = () => {
    setCategorySelectionDialogOpen(true)
  }

  // دالة حفظ التصنيفات المختارة
  const handleSaveCategories = () => {
    setCategorySelectionDialogOpen(false)
    notify.success("تم حفظ التصنيفات المختارة")
  }

  // دالة فتح تصنيفات المنتج
  const handleProductCategories = (product: Product) => {
    setCurrentProduct(product)
    setProductSelectedCategories([])
    setProductCategoriesDialogOpen(true)
  }

  // دالة حفظ تصنيفات المنتج
  const handleSaveProductCategories = () => {
    setProductCategoriesDialogOpen(false)
    notify.success("تم حفظ تصنيفات المنتج")
  }

  // دالة تبديل اختيار التصنيف
  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // دالة تبديل اختيار تصنيف المنتج
  const handleProductCategoryToggle = (categoryId: number) => {
    setProductSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // SortableHeader component
  const SortableHeader = ({ 
    columnKey, 
    children, 
    className 
  }: { 
    columnKey: keyof Product
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

  // action buttons
  const actionButtons = [
    { 
      label: "جديد", 
      icon: Plus, 
      href: "/admin/definitions/products/form" 
    },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => {
        if (settings?.LastSelectedItem) {
          handleEdit(items.find(item => item.ID === settings.LastSelectedItem)!)
        }
      }, 
      disabled: !settings?.LastSelectedItem 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => {
        if (settings?.LastSelectedItem && confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
          handleDelete(String(settings.LastSelectedItem))
        }
      },  
      disabled: !settings?.LastSelectedItem, 
      variant: "destructive" as const 
    },
    { 
      label: "تصنيفات فرعية", 
      icon: Filter, 
      onClick: handleCategorySelection
    },
    { 
      label: "طباعة", 
      icon: Printer, 
      onClick: () => {},
      disabled: true
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 max-w-7xl">
        <PageHeader
          title="عرض الأصناف"
          actionButtons={actionButtons}
        />
        <Card className="shadow-lg">
          <CardHeader className="p-6 bg-white dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن صنف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="كل التصنيفات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.ID} value={category.ID.toString()}>
                      {category.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white dark:bg-gray-800">
          <div className="w-full overflow-x-auto rounded-lg border">
            <Table className="w-full min-w-[600px] max-w-full">
              <TableHeader>
                 <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                   <TableHead className="w-[60px] sticky right-0 bg-gray-50 z-10 border-l hidden xs:table-cell text-center">الإجراءات</TableHead>
                   <TableHead className="w-[50px] text-center hidden xs:table-cell">الصورة</TableHead>
                   <SortableHeader columnKey="BarCode" className="w-[80px] hidden xs:table-cell text-center">الباركود</SortableHeader>
                   <SortableHeader columnKey="Name" className="w-[200px] hidden xs:table-cell text-center">الإسم</SortableHeader>
                   <TableHead className="text-center w-[50px] hidden xs:table-cell">نشط</TableHead>
                   <TableHead className="text-center w-[60px] hidden xs:table-cell">نقاط البيع</TableHead>
                   <TableHead className="text-center w-[50px] hidden xs:table-cell">المتجر</TableHead>
                 
                 </TableRow>
                
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow 
                    key={item.ID}
                    className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border-b ${item.ID === settings?.LastSelectedItem ? "bg-blue-100 dark:bg-blue-900/30" : "bg-white dark:bg-gray-800"}`}
                    onDoubleClick={() => handleEdit(item)}
                    title="انقر نقرتين للتعديل"
                  >
                    <TableCell className="flex gap-1 sticky right-0 bg-white dark:bg-gray-800 z-10 border-l hidden xs:table-cell">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(item)
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 hover:bg-green-100 dark:hover:bg-green-900/30"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProductCategories(item)
                        }}
                      >
                        <Folder className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
                            handleDelete(String(item.ID))
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center hidden xs:table-cell">
                      <div className="w-8 h-8 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                        {item.ImageURL ? (
                          <Image
                            src={item.ImageURL}
                            alt={item.Name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </TableCell>                                    
                     <TableCell className="text-sm font-mono hidden xs:table-cell text-center">{item.BarCode}</TableCell>
                     <TableCell className="font-semibold text-sm truncate hidden xs:table-cell text-center" title={item.Name}>{item.Name}</TableCell>
                    <TableCell className="text-center hidden xs:table-cell">
                      <Checkbox checked={item.IsActive} disabled className="h-3 w-3" />
                    </TableCell>
                    <TableCell className="text-center hidden xs:table-cell">
                      <Checkbox checked={item.IsPOS} disabled className="h-3 w-3" />
                    </TableCell>
                    <TableCell className="text-center hidden xs:table-cell">
                      <Checkbox checked={item.IsShop} disabled className="h-3 w-3" />
                    </TableCell>
                    
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 border-t">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">عدد العناصر في الصفحة</span>
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
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">الصفحة {currentPage} من {totalPages}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* ديالوج اختيار التصنيفات الفرعية */}
      <Dialog open={categorySelectionDialogOpen} onOpenChange={setCategorySelectionDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-right text-xl font-bold text-gray-800 dark:text-gray-200">اختيار التصنيفات الفرعية</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في التصنيفات..."
                className="pr-10"
              />
            </div>

            {/* جدول التصنيفات */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[50px] text-center">اختيار</TableHead>
                    <TableHead className="w-[60px] text-center">الصورة</TableHead>
                    <TableHead className="text-right">المعرف</TableHead>
                    <TableHead className="text-right">الكود</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الاسم المختصر</TableHead>
                    <TableHead className="text-center">نشط</TableHead>
                    <TableHead className="text-center">فئة مبيعات</TableHead>
                    <TableHead className="text-center">عرض المنتجات</TableHead>
                    <TableHead className="text-center">مرتبط بمتجر</TableHead>
                    <TableHead className="text-center">متجر رئيسي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.ID} className="hover:bg-gray-50">
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedCategories.includes(category.ID)}
                          onCheckedChange={() => handleCategoryToggle(category.ID)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="w-8 h-8 mx-auto bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{category.ID}</TableCell>
                      <TableCell className="text-right">{category.Code}</TableCell>
                      <TableCell className="text-right font-medium">{category.Name}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">-</TableCell>
                      <TableCell className="text-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto"></div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto"></div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto"></div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="w-3 h-3 bg-gray-300 rounded-full mx-auto"></div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="w-3 h-3 bg-gray-300 rounded-full mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setCategorySelectionDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveCategories}
              disabled={selectedCategories.length === 0}
            >
              حفظ التصنيفات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ديالوج تصنيفات المنتج */}
      <Dialog open={productCategoriesDialogOpen} onOpenChange={setProductCategoriesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">تصنيفات المنتج: {currentProduct?.Name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div key={category.ID} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    checked={productSelectedCategories.includes(category.ID)}
                    onCheckedChange={() => handleProductCategoryToggle(category.ID)}
                  />
                  <label className="text-sm font-medium">{category.Name}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setProductCategoriesDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveProductCategories}
              disabled={productSelectedCategories.length === 0}
            >
              حفظ التصنيفات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
