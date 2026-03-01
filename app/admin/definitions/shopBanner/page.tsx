"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, getDocs, deleteDoc, doc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { ref, listAll, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
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
  Eye,
  EyeOff,
} from "lucide-react"
import NextImage from "next/image"

import PageHeader from "@/components/page-header"
import { useScreenSettings } from "@/lib/hooks/use-screen-settings"
import { notify } from "@/lib/notifications"

type ShopBanner = {
  id: string
  ID: string
  Code: string
  Name: string
  IsActive: boolean
  ShortDescription: string
  LongDescription: string
  ImageFolderPath: string
  ImageURL: string
}

type SortConfig = {
  key: keyof ShopBanner | null
  direction: "ascending" | "descending"
}

export default function ShopBannerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/definitions/shopBanner")
  
  const [banners, setBanners] = useState<ShopBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBanner, setSelectedBanner] = useState<ShopBanner | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(settings?.ItemsPerPage || 10)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "ascending" })

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        console.log("Fetching shop banners data...")
        
        const bannersCollection = collection(db, "Def_ShopBanner")
        const bannersSnapshot = await getDocs(bannersCollection)
        
        console.log(`Found ${bannersSnapshot.docs.length} total banners`)
        
        // فلترة البانرات المفعلة
        const activeBanners = bannersSnapshot.docs.filter(doc => {
          const data = doc.data()
          return data.IsActive === true
        })
        console.log(`Found ${activeBanners.length} active banners`)
        
        if (bannersSnapshot.empty) {
          console.log("No shop banners found in database")
          setBanners([])
          return
        }

        console.log(`Found ${bannersSnapshot.docs.length} shop banners`)
        
        const bannersData = await Promise.all(
          bannersSnapshot.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data()
            console.log(`Processing banner: ${doc.id}`, data)
            
            const banner = {
              id: doc.id,
              ID: data.ID || doc.id,
              Code: data.Code || '',
              Name: data.Name || '',
              IsActive: data.IsActive || false,
              ShortDescription: data.ShortDescription || '',
              LongDescription: data.LongDescription || '',
              ImageFolderPath: data.ImageFolderPath || '',
              ImageURL: data.ImageURL || ''
            }

            // جلب الصور من Firebase Storage إذا كان هناك مسار
            if (banner.ImageFolderPath && storage) {
              try {
                console.log(`جلب الصور من المسار: ${banner.ImageFolderPath}`)
                const folderRef = ref(storage, banner.ImageFolderPath)
                const result = await listAll(folderRef)
                
                if (result.items.length > 0) {
                  const firstImageUrl = await getDownloadURL(result.items[0])
                  banner.ImageURL = firstImageUrl
                  console.log(`تم جلب الصورة الأولى للبانر ${banner.Name}: ${firstImageUrl}`)
                }
              } catch (error) {
                console.error(`خطأ في جلب الصور للبانر ${banner.Name}:`, error)
              }
            }

            return banner
          })
        )

        // Sort data by Code
        const sortedData = bannersData.sort((a, b) => {
          const codeA = parseInt(a.Code) || 0
          const codeB = parseInt(b.Code) || 0
          return codeA - codeB
        })
        
        console.log("Sorted banners data:", sortedData)
        setBanners(sortedData)

        // إذا كان هناك عنصر محدد سابقاً، قم بتمييزه
        if (settings?.LastSelectedItem) {
          const selectedBanner = sortedData.find(banner => Number(banner.ID) === settings.LastSelectedItem)
          if (selectedBanner) {
            const bannerIndex = sortedData.indexOf(selectedBanner)
            const pageNumber = Math.floor(bannerIndex / itemsPerPage) + 1
            setCurrentPage(pageNumber)
            setSelectedBanner(selectedBanner)
          }
        }
      } catch (error) {
        console.error("Error fetching shop banners:", error)
        notify.error("حدث خطأ أثناء جلب بيانات البانرات. الرجاء المحاولة مرة أخرى.")
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [refresh, settings?.LastSelectedItem, itemsPerPage])

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filteredData = banners

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(banner =>
        banner.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.ShortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.Code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredData = [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue)
          return sortConfig.direction === "ascending" ? comparison : -comparison
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === "ascending" ? aValue - bValue : bValue - aValue
        }
        
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortConfig.direction === "ascending" ? (aValue === bValue ? 0 : aValue ? 1 : -1) : (aValue === bValue ? 0 : aValue ? -1 : 1)
        }
        
        return 0
      })
    }

    return filteredData
  }, [banners, searchTerm, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredAndSortedData.slice(startIndex, endIndex)

  // Sorting function
  const handleSort = (key: keyof ShopBanner) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending"
    }))
  }

  // Delete function
  const handleDelete = async (banner: ShopBanner) => {
    if (!confirm(`هل أنت متأكد من حذف البانر "${banner.Name}"؟`)) return

    try {
      await deleteDoc(doc(db, "Def_ShopBanner", banner.id))
      setBanners(prev => prev.filter(b => b.id !== banner.id))
      notify.success("تم حذف البانر بنجاح")
    } catch (error) {
      console.error("Error deleting banner:", error)
      notify.error("حدث خطأ أثناء حذف البانر")
    }
  }

  // Edit function
  const handleEdit = (banner: ShopBanner) => {
    const data = JSON.stringify(banner)
    router.push(`/admin/definitions/shopBanner/form?id=${banner.id}&data=${encodeURIComponent(data)}`)
  }

  // Add new function
  const handleAdd = () => {
    router.push("/admin/definitions/shopBanner/form")
  }

  // Update items per page
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    updateItemsPerPage(newItemsPerPage)
  }

  // Update last selected item
  const handleRowClick = (banner: ShopBanner) => {
    setSelectedBanner(banner)
    updateLastSelectedItem(Number(banner.ID))
  }

  // SortableHeader component
  const SortableHeader = ({ columnKey, children, className }: { columnKey: keyof ShopBanner; children: React.ReactNode; className?: string }) => (
    <TableHead className={`font-bold ${className || ''}`}>
      <Button variant="ghost" onClick={() => handleSort(columnKey)} className="px-2 py-1 text-base">
        {children}
        {sortConfig.key === columnKey && (
          <span className="mr-2">
            {sortConfig.direction === "ascending" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </span>
        )}
      </Button>
    </TableHead>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البانرات...</p>
        </div>
      </div>
    )
  }

  const actionButtons = [
    { label: "جديد", icon: Plus, href: "/admin/definitions/shopBanner/form" },
    { 
      label: "تعديل", 
      icon: Edit, 
      onClick: () => selectedBanner && handleEdit(selectedBanner), 
      disabled: !selectedBanner 
    },
    { 
      label: "حذف", 
      icon: Trash2, 
      onClick: () => selectedBanner && handleDelete(selectedBanner), 
      disabled: !selectedBanner, 
      variant: "destructive" as const 
    },
    { label: "طباعة", icon: Printer, onClick: () => {} },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="عرض بانرات المتجر" actionButtons={actionButtons} />
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن بانر..."
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
                  <SortableHeader columnKey="Code" className="text-center">الكود</SortableHeader>
                  <SortableHeader columnKey="Name" className="text-center">الاسم</SortableHeader>
                  <TableHead className="text-center">الصورة</TableHead>
                  <TableHead className="text-center">الوصف القصير</TableHead>
                  <TableHead className="text-center font-bold text-base">نشط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((banner) => (
                  <TableRow
                    key={banner.id}
                    onClick={() => handleRowClick(banner)}
                    onDoubleClick={() => handleEdit(banner)}
                    className={`cursor-pointer ${selectedBanner?.id === banner.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  >
                    <TableCell className="flex gap-2 justify-center">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(banner)
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('هل أنت متأكد من حذف هذا البانر؟')) {
                            handleDelete(banner)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">{banner.Code}</TableCell>
                    <TableCell className="font-medium text-center">{banner.Name}</TableCell>
                    <TableCell className="text-center">
                      {banner.ImageURL ? (
                        <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden relative mx-auto">
                          <NextImage
                            src={banner.ImageURL}
                            alt={banner.Name}
                            width={64}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl">
                            جاليري
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                          <Eye className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="max-w-xs truncate text-sm text-gray-600 mx-auto">
                        {banner.ShortDescription || "لا يوجد وصف"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={banner.IsActive} disabled />
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