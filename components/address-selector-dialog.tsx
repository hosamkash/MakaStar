'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin,
  Building2,
  Home,
  Search,
  X,
  Check
} from 'lucide-react'
import { notify } from '@/lib/notifications'

interface Government {
  id: string
  ID: number
  Name: string
}

interface City {
  id: string
  ID: number
  Name: string
  IDGovernorate: number
}

interface Village {
  id: string
  ID: number
  Name: string
  IDCity: number
}

interface Area {
  id: string
  ID: number
  Name: string
  IDCity: number
  IDVillage: number
}

interface AddressSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddressSelect: (address: string) => void
}

export default function AddressSelectorDialog({
  open,
  onOpenChange,
  onAddressSelect
}: AddressSelectorDialogProps) {
  // State for data
  const [governments, setGovernments] = useState<Government[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  
  // State for selections
  const [selectedGovernment, setSelectedGovernment] = useState<string>("")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedVillage, setSelectedVillage] = useState<string>("")
  const [selectedArea, setSelectedArea] = useState<string>("")
  
  const [loading, setLoading] = useState(true)

  // Fetch governments on component mount
  useEffect(() => {
    const fetchGovernments = async () => {
      try {
        setLoading(true)
        const governmentsCollection = collection(db, "DefGeo_Government")
        const governmentsSnapshot = await getDocs(governmentsCollection)
        
        if (!governmentsSnapshot.empty) {
          const governmentsData = governmentsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data()
            return {
              id: doc.id,
              ID: data.ID || parseInt(doc.id) || 0,
              Name: data.Name || '',
            }
          })
          
          // Sort by ID
          const sortedData = governmentsData.sort((a, b) => {
            const idA = a.ID || 0
            const idB = b.ID || 0
            return idA - idB
          })
          
          setGovernments(sortedData)
        }
      } catch (error) {
        console.error("Error fetching governments:", error)
        notify.error("حدث خطأ أثناء جلب بيانات المحافظات")
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchGovernments()
    }
  }, [open])

  // Fetch cities when government is selected
  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedGovernment) {
        setCities([])
        setSelectedCity("")
        return
      }

      try {
        const citiesCollection = collection(db, "DefGeo_Cities")
        const citiesSnapshot = await getDocs(citiesCollection)
        
        if (!citiesSnapshot.empty) {
          const citiesData = citiesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data()
            return {
              id: doc.id,
              ID: data.ID || 0,
              Name: data.Name || '',
              IDGovernorate: data.IDGovernorate || 0,
            }
          }).filter(city => city.IDGovernorate.toString() === selectedGovernment)
          
          setCities(citiesData)
        }
      } catch (error) {
        console.error("Error fetching cities:", error)
        notify.error("حدث خطأ أثناء جلب بيانات المدن")
      }
    }

    fetchCities()
  }, [selectedGovernment])

  // Fetch villages when city is selected
  useEffect(() => {
    const fetchVillages = async () => {
      if (!selectedCity) {
        setVillages([])
        setSelectedVillage("")
        return
      }

      try {
        const villagesCollection = collection(db, "DefGeo_Villages")
        const villagesSnapshot = await getDocs(villagesCollection)
        
        if (!villagesSnapshot.empty) {
          const villagesData = villagesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data()
            return {
              id: doc.id,
              ID: data.ID || 0,
              Name: data.Name || '',
              IDCity: data.IDCity || 0,
            }
          }).filter(village => village.IDCity.toString() === selectedCity)
          
          setVillages(villagesData)
        }
      } catch (error) {
        console.error("Error fetching villages:", error)
        notify.error("حدث خطأ أثناء جلب بيانات القرى/المناطق")
      }
    }

    fetchVillages()
  }, [selectedCity])

  // Fetch areas when village is selected
  useEffect(() => {
    const fetchAreas = async () => {
      if (!selectedVillage) {
        setAreas([])
        setSelectedArea("")
        return
      }

      try {
        const areasCollection = collection(db, "DefGeo_Areas")
        const areasSnapshot = await getDocs(areasCollection)
        
        if (!areasSnapshot.empty) {
          const areasData = areasSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data()
            return {
              id: doc.id,
              ID: data.ID || 0,
              Name: data.Name || '',
              IDCity: data.IDCity || 0,
              IDVillage: data.IDVillage || 0,
            }
          }).filter(area => {
            const selectedVillageData = villages.find(village => village.id === selectedVillage)
            return selectedVillageData && area.IDVillage === selectedVillageData.ID
          })
          
          setAreas(areasData)
        }
      } catch (error) {
        console.error("Error fetching areas:", error)
        notify.error("حدث خطأ أثناء جلب بيانات الأحياء")
      }
    }

    fetchAreas()
  }, [selectedVillage, villages])

  const handleClearData = () => {
    setSelectedGovernment("")
    setSelectedCity("")
    setSelectedArea("")
    setSelectedVillage("")
    setCities([])
    setAreas([])
    setVillages([])
  }

  const handleConfirmSelection = () => {
    if (!selectedGovernment) {
      notify.error("يرجى اختيار المحافظة على الأقل")
      return
    }

    // Build address string with available selections only
    const addressParts = []
    
    if (selectedArea) {
      const areaName = areas.find(a => a.id === selectedArea)?.Name || ''
      if (areaName) addressParts.push(areaName)
    }
    
    if (selectedVillage) {
      const villageName = villages.find(v => v.id === selectedVillage)?.Name || ''
      if (villageName) addressParts.push(villageName)
    }
    
    if (selectedCity) {
      const cityName = cities.find(c => c.id === selectedCity)?.Name || ''
      if (cityName) addressParts.push(cityName)
    }
    
    if (selectedGovernment) {
      const governmentName = governments.find(g => g.id === selectedGovernment)?.Name || ''
      if (governmentName) addressParts.push(governmentName)
    }

    const fullAddress = addressParts.join('، ')
    
    onAddressSelect(fullAddress)
    onOpenChange(false)
    handleClearData()
    notify.success("تم اختيار العنوان بنجاح")
  }

  const handleCancel = () => {
    onOpenChange(false)
    handleClearData()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-gray-100 p-1"
              onClick={handleCancel}
            >
              <X className="w-5 h-5" />
            </Button>
            <DialogTitle className="text-blue-600 font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              اختيار العنوان
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* رسالة توضيحية */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700 text-center">
              يمكنك اختيار المحافظة فقط، أو إضافة المزيد من التفاصيل حسب الحاجة
            </p>
          </div>

          {/* المحافظة */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Select
                value={selectedGovernment}
                onValueChange={(value) => {
                  setSelectedGovernment(value)
                  setSelectedCity("")
                  setSelectedArea("")
                  setSelectedVillage("")
                }}
                disabled={loading}
              >
                <SelectTrigger className="w-full h-12 text-right [&>svg]:order-first [&>svg]:ml-0 [&>svg]:mr-2">
                  <SelectValue placeholder={loading ? "جاري التحميل..." : "اختر المحافظة"} />
                </SelectTrigger>
                <SelectContent>
                  {governments.map((gov) => (
                    <SelectItem key={gov.id} value={gov.id}>
                      {gov.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3 mr-3">
                <label className="text-sm font-medium text-gray-700">المحافظة</label>
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* المدينة */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Select
                value={selectedCity}
                onValueChange={(value) => {
                  setSelectedCity(value)
                  setSelectedArea("")
                  setSelectedVillage("")
                }}
                disabled={!selectedGovernment || cities.length === 0}
              >
                <SelectTrigger className="w-full h-12 text-right [&>svg]:order-first [&>svg]:ml-0 [&>svg]:mr-2">
                  <SelectValue placeholder={!selectedGovernment ? "اختر المحافظة أولاً" : "اختر المدينة"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3 mr-3">
                <label className="text-sm font-medium text-gray-700">المدينة</label>
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* القرية/المنطقة */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Select
                value={selectedVillage}
                onValueChange={(value) => {
                  setSelectedVillage(value)
                  setSelectedArea("")
                }}
                disabled={!selectedCity || villages.length === 0}
              >
                <SelectTrigger className="w-full h-12 text-right [&>svg]:order-first [&>svg]:ml-0 [&>svg]:mr-2">
                  <SelectValue placeholder={!selectedCity ? "اختر المدينة أولاً" : "اختر القرية/المنطقة"} />
                </SelectTrigger>
                <SelectContent>
                  {villages.map((village) => (
                    <SelectItem key={village.id} value={village.id}>
                      {village.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3 mr-3">
                <label className="text-sm font-medium text-gray-700">القرية/المنطقة</label>
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* الحي */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Select
                value={selectedArea}
                onValueChange={setSelectedArea}
                disabled={!selectedVillage || areas.length === 0}
              >
                <SelectTrigger className="w-full h-12 text-right [&>svg]:order-first [&>svg]:ml-0 [&>svg]:mr-2">
                  <SelectValue placeholder={!selectedVillage ? "اختر القرية/المنطقة أولاً" : "اختر الحي"} />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3 mr-3">
                <label className="text-sm font-medium text-gray-700">الحي</label>
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <Home className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={handleConfirmSelection}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2"
              disabled={!selectedGovernment}
            >
              <Check className="w-5 h-5" />
              تأكيد اختيار العنوان
            </Button>
            
            <Button 
              onClick={handleClearData}
              variant="outline"
              className="w-full h-12 border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              مسح البيانات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
