"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Check, Settings } from "lucide-react"
import { notify } from "@/lib/notifications"
import PlaceTypesDialog from "@/components/place-types-dialog"

interface PlaceType {
  id: string
  ID?: number
  Name: string
}

interface PlaceTypeSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedValue?: string
  onValueSelect: (value: string) => void
}

export default function PlaceTypeSelectorDialog({ 
  open, 
  onOpenChange, 
  selectedValue, 
  onValueSelect 
}: PlaceTypeSelectorDialogProps) {
  const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([])
  const [filteredPlaceTypes, setFilteredPlaceTypes] = useState<PlaceType[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [placeTypesDialogOpen, setPlaceTypesDialogOpen] = useState(false)

  const fetchPlaceTypes = async () => {
    try {
      setLoading(true)
      const placeTypesCollection = collection(db, "DefGeo_PlaceTypes")
      const placeTypesSnapshot = await getDocs(placeTypesCollection)

      const placeTypesData: PlaceType[] = placeTypesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as PlaceType))

      // Sort by ID or Name
      placeTypesData.sort((a, b) => {
        if (a.ID && b.ID) return a.ID - b.ID
        return a.Name.localeCompare(b.Name)
      })

      setPlaceTypes(placeTypesData)
      setFilteredPlaceTypes(placeTypesData)
    } catch (error) {
      console.error("Error fetching place types:", error)
      notify.error("حدث خطأ أثناء تحميل أنواع المصالح")
    } finally {
      setLoading(false)
    }
  }

  // Function to refresh place types data when dialog closes
  const handlePlaceTypesDataChanged = () => {
    fetchPlaceTypes()
  }

  useEffect(() => {
    if (open) {
      fetchPlaceTypes()
      setSearchValue("")
    }
  }, [open])

  // Filter based on search
  useEffect(() => {
    if (searchValue.trim() === "") {
      setFilteredPlaceTypes(placeTypes)
    } else {
      const filtered = placeTypes.filter(type =>
        type.Name.toLowerCase().includes(searchValue.toLowerCase())
      )
      setFilteredPlaceTypes(filtered)
    }
  }, [searchValue, placeTypes])

  const handleSelect = (typeName: string) => {
    onValueSelect(typeName)
    onOpenChange(false)
  }

  const handleClear = () => {
    onValueSelect("")
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>اختيار نوع المصلحة</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlaceTypesDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                إدارة الأنواع
              </Button>
            </div>
            <DialogDescription>
              ابحث عن نوع المصلحة واختر المناسب
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Search Section */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن نوع المصلحة..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSearchValue("")}
                disabled={!searchValue}
              >
                مسح البحث
              </Button>
            </div>

            {/* Current Selection */}
            {selectedValue && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">النوع المختار حالياً</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedValue}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClear}
                    >
                      إزالة الاختيار
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Table */}
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    النتائج ({filteredPlaceTypes.length} من {placeTypes.length})
                  </CardTitle>
                  {loading && <span className="text-sm text-gray-500">جارٍ التحميل...</span>}
                </div>
              </CardHeader>
              <CardContent className="pt-0 overflow-hidden">
                <div className="border rounded-md overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اختيار</TableHead>
                        <TableHead className="text-right">الرقم</TableHead>
                        <TableHead className="text-right">اسم النوع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlaceTypes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                            {loading ? "جارٍ التحميل..." : "لا توجد نتائج مطابقة"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlaceTypes.map((type, index) => (
                          <TableRow 
                            key={type.id}
                            className={`cursor-pointer hover:bg-gray-50 ${
                              selectedValue === type.Name ? "bg-blue-50" : ""
                            }`}
                            onClick={() => handleSelect(type.Name)}
                          >
                            <TableCell className="text-center">
                              <Button
                                variant={selectedValue === type.Name ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelect(type.Name)
                                }}
                              >
                                {selectedValue === type.Name ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  "اختيار"
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              {type.ID || index + 1}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {type.Name}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إغلاق
              </Button>
              {selectedValue && (
                <Button onClick={handleClear}>
                  إزالة الاختيار
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Place Types Management Dialog */}
      <PlaceTypesDialog
        open={placeTypesDialogOpen}
        onOpenChange={setPlaceTypesDialogOpen}
        onDataChanged={handlePlaceTypesDataChanged}
      />
    </>
  )
}
