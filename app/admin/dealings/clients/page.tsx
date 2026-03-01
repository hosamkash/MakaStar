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

type Client = {
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
  EMail: string
  Note: string
  IDPriceType: number
  CreditLimit: number
  LocationLink: string
  LocationLatitude: number
  LocationLongitude: number
  LocationImage: string
  IsClientShopOnly: boolean
  UserName: string
  Password: string
  CreatedDate?: string
  CreatedTime?: string
  CreatedDateTime?: string
  PersonalSponsorID?: number
}

type Employee = {
  ID: number
  Code: number
  Name: string
}

type SortConfig = {
  key: keyof Client | null
  direction: "ascending" | "descending"
}

export default function ClientsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refresh = searchParams.get("refresh") === "true"
  const { settings, loading: loadingSettings, updateItemsPerPage, updateLastSelectedItem } = useScreenSettings("/admin/dealings/clients")
  
  const [items, setItems] = useState<Client[]>([])
  const [branches, setBranches] = useState<{ID: number, Name: string}[]>([])
  const [priceTypes, setPriceTypes] = useState<{ID: number, Name: string}[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
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
        
        // Fetch clients
        const itemsCollection = collection(db, "Dealing_Clients")
        const querySnapshot = await getDocs(itemsCollection)
        const itemsData = querySnapshot.docs.map(doc => ({
          ID: parseInt(doc.id),
          ...doc.data()
        })) as Client[]
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

         // Fetch price types from Fix_PriceType
         const priceTypesCollection = collection(db, "Fix_PriceType")
         const priceTypesSnapshot = await getDocs(priceTypesCollection)
         const priceTypesData = priceTypesSnapshot.docs.map((doc, index) => {
           const data = doc.data()
           const docId = parseInt(doc.id)
           return {
             ID: docId || (index + 2000), // Use index + 2000 to avoid conflicts
             Name: data.Name || ''
           }
         }).sort((a, b) => a.ID - b.ID)
         // Remove duplicates based on ID and ensure unique keys
         const uniquePriceTypes = priceTypesData.filter((priceType, index, self) => 
           index === self.findIndex(p => p.ID === priceType.ID)
         ).map((priceType, index) => ({
           ...priceType,
           ID: priceType.ID || (index + 2000) // Ensure no 0 values
         }))
         setPriceTypes(uniquePriceTypes)

         // Fetch employees from Dealing_Employees
         const employeesCollection = collection(db, "Dealing_Employees")
         const employeesSnapshot = await getDocs(employeesCollection)
         const employeesData = employeesSnapshot.docs.map((doc, index) => {
           const data = doc.data()
           return {
             ID: data.ID || (index + 3000),
             Code: data.Code || 0,
             Name: data.Name || ''
           }
         }).sort((a, b) => a.ID - b.ID)
         setEmployees(employeesData)

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
    const filteredClients = items.filter((client) =>
      Object.values(client).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (sortConfig.key) {
      filteredClients.sort((a, b) => {
        const aValue = a[sortConfig.key!] || ""
        const bValue = b[sortConfig.key!] || ""
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }

    return filteredClients
  }, [items, searchTerm, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key: keyof Client) => {
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
    columnKey: keyof Client
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
      await deleteDoc(doc(db, "Dealing_Clients", id))
      setItems(prev => prev.filter(client => String(client.ID) !== id))
      setCurrentPage(1) // Reset page to 1 after deletion
      await updateLastSelectedItem(null) // Clear last selected item
      notify.success('تم حذف العميل بنجاح')
    } catch (error) {
      console.error("Error deleting client:", error)
      notify.error('حدث خطأ أثناء حذف العميل')
    }
  }

  const handleEdit = async (item: Client) => {
    await updateLastSelectedItem(item.ID)
    router.push(`/admin/dealings/clients/form?id=${item.ID}`)
  }

  const actionButtons = [
    { 
      label: "جديد", 
      icon: Plus, 
      onClick: () => router.push("/admin/dealings/clients/form")
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
        if (settings?.LastSelectedItem && confirm('هل أنت متأكد من حذف هذا العميل؟')) {
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
    <div className="w-full min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <PageHeader
          title="العملاء"
          actionButtons={actionButtons}
        />
        <Card className="mx-auto shadow-lg">
        <CardHeader className="p-2 sm:p-4">
          <div className="flex items-center justify-start">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن عميل..."
                className="pr-10 text-sm"
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
            <div className="min-w-full">
              <Table className="w-full min-w-[900px]">
                             <TableHeader>
                 <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                   <TableHead className="w-[80px] text-center sticky right-0 bg-gray-50 z-10"></TableHead>
                   <SortableHeader columnKey="Name" className="min-w-[120px] text-center">الإسم</SortableHeader>
                   <SortableHeader columnKey="IDBranch" className="hidden md:table-cell min-w-[80px] text-center">الفرع</SortableHeader>
                   <TableHead className="w-[120px] text-center hidden lg:table-cell">الراعي الشخصي</TableHead>
                   <TableHead className="w-[60px] text-center hidden lg:table-cell">نشط</TableHead>
                   <SortableHeader columnKey="Address" className="hidden min-w-[200px] text-center">العنوان</SortableHeader>
                   <SortableHeader columnKey="Phone" className="hidden md:table-cell min-w-[80px] text-center">الهاتف</SortableHeader>
                   <SortableHeader columnKey="Mobile" className="min-w-[100px] text-center">الموبيل</SortableHeader>
                   <SortableHeader columnKey="CreatedDate" className="hidden xl:table-cell min-w-[100px] text-center">تاريخ الإنشاء</SortableHeader>
                 </TableRow>
               </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                                     <TableRow 
                     key={item.ID}
                     className={item.ID === settings?.LastSelectedItem ? "bg-muted/50" : ""}
                     onDoubleClick={() => handleEdit(item)}
                   >
                     <TableCell className="flex gap-1 justify-center sticky right-0 bg-white z-10">
                       <Button 
                         variant="ghost" 
                         size="icon"
                         onClick={(e) => {
                           e.stopPropagation()
                           handleEdit(item)
                         }}
                         className="h-6 w-6"
                       >
                         <Edit className="h-3 w-3 text-blue-500" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon"
                         onClick={(e) => {
                           e.stopPropagation()
                           if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
                             handleDelete(String(item.ID))
                           }
                         }}
                         className="h-6 w-6"
                       >
                         <Trash2 className="h-3 w-3 text-red-500" />
                       </Button>
                     </TableCell>

                     <TableCell className="font-medium whitespace-normal min-w-[120px] text-center">
                       <div>
                         <div className="font-semibold text-sm">{item.Name}</div>
                         <div className="text-xs text-blue-600 font-medium">
                           كود: {item.Code}
                         </div>
                         <div className="text-xs text-gray-500 md:hidden">
                           {branches.find(b => b.ID === item.IDBranch)?.Name || item.IDBranch}
                         </div>
                         <div className="text-xs text-gray-500 lg:hidden">
                           {item.Mobile || '-'}
                         </div>
                       </div>
                     </TableCell>
                     <TableCell className="text-center hidden md:table-cell min-w-[80px]">
                        <div className="text-sm">{branches.find(b => b.ID === item.IDBranch)?.Name || item.IDBranch}</div>
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell w-[120px]">
                        <div className="text-sm">
                          {item.PersonalSponsorID ? (
                            employees.find(emp => emp.ID === item.PersonalSponsorID)?.Name || 'غير محدد'
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell w-[60px]">
                        <Checkbox checked={item.IsActive} disabled />
                      </TableCell>
                     
                      <TableCell className="font-medium whitespace-normal min-w-[200px] hidden text-center">{item.Address || '-'}</TableCell>
                      <TableCell className="text-center hidden md:table-cell min-w-[80px]">
                        <div className="text-sm">{item.Phone || '-'}</div>
                      </TableCell>
                      <TableCell className="text-center min-w-[100px]">
                        <div>
                          <div className="font-medium text-sm">{item.Mobile || '-'}</div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            كود: {item.Code}
                          </div>
                        </div>
                      </TableCell>
                       <TableCell className="text-center hidden xl:table-cell min-w-[100px]">
                         {item.CreatedDate ? (
                           <div className="text-xs">
                             <div className="font-medium">{item.CreatedDate}</div>
                             {item.CreatedTime && (
                               <div className="text-gray-500 text-xs">{item.CreatedTime}</div>
                             )}
                           </div>
                         ) : (
                           <span className="text-gray-400">-</span>
                         )}
                       </TableCell>
                   </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">عدد العناصر في الصفحة</span>
            <span className="sm:hidden">عناصر</span>
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
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">الصفحة {currentPage} من {totalPages}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
        </Card>
      </div>
    </div>
  )
}
