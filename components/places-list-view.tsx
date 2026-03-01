"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, MapPin, X } from "lucide-react"

interface Place {
  id: string
  ID?: number
  Name: string
  PlaceType?: string
  Address?: string
  Latitude?: number
  Longitude?: number
  LocationLink?: string
  Phone?: string
  Notes?: string
  ImageLink?: string
  ImageName?: string
  IDAreas?: number
  FullAddressText?: string
  // Access Methods
  Method1?: string
  Method1TotalTime?: number
  Method1Notes?: string
  Method1Step1Data?: string
  Method1Step1TimeMinutes?: number
  Method1Step2Data?: string
  Method1Step2TimeMinutes?: number
  Method1Step3Data?: string
  Method1Step3TimeMinutes?: number
  Method1Step4Data?: string
  Method1Step4TimeMinutes?: number
  Method1Step5Data?: string
  Method1Step5TimeMinutes?: number
  Method2?: string
  Method2TotalTime?: number
  Method2Notes?: string
  Method2Step1Data?: string
  Method2Step1TimeMinutes?: number
  Method2Step2Data?: string
  Method2Step2TimeMinutes?: number
  Method2Step3Data?: string
  Method2Step3TimeMinutes?: number
  Method2Step4Data?: string
  Method2Step4TimeMinutes?: number
  Method2Step5Data?: string
  Method2Step5TimeMinutes?: number
  Method3?: string
  Method3TotalTime?: number
  Method3Notes?: string
  Method3Step1Data?: string
  Method3Step1TimeMinutes?: number
  Method3Step2Data?: string
  Method3Step2TimeMinutes?: number
  Method3Step3Data?: string
  Method3Step3TimeMinutes?: number
  Method3Step4Data?: string
  Method3Step4TimeMinutes?: number
  Method3Step5Data?: string
  Method3Step5TimeMinutes?: number
  Method4?: string
  Method4TotalTime?: number
  Method4Notes?: string
  Method4Step1Data?: string
  Method4Step1TimeMinutes?: number
  Method4Step2Data?: string
  Method4Step2TimeMinutes?: number
  Method4Step3Data?: string
  Method4Step3TimeMinutes?: number
  Method4Step4Data?: string
  Method4Step4TimeMinutes?: number
  Method4Step5Data?: string
  Method4Step5TimeMinutes?: number
}

interface Area {
  id: string
  ID?: number
  Name: string
  IDVillage?: number
  IDCity?: number
}

interface Village {
  id: string
  ID?: number
  Name: string
  IDCity?: number
}

interface City {
  id: string
  ID?: number
  Name: string
  IDGovernorate?: number
}

interface Government {
  id: string
  ID?: number
  Name: string
}

interface PlaceWithHierarchy extends Place {
  governmentName?: string
  cityName?: string
  villageName?: string
  areaName?: string
  governmentId?: string
  cityId?: string
  villageId?: string
  areaId?: string
}

interface PlacesListViewProps {
  onPlaceView: (place: PlaceWithHierarchy) => void
}

export default function PlacesListView({ onPlaceView }: PlacesListViewProps) {
  const [places, setPlaces] = useState<PlaceWithHierarchy[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<PlaceWithHierarchy[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch all related data
  const fetchAllData = async () => {
    try {
      setLoading(true)

      // Fetch governments
      const governmentsCollection = collection(db, "DefGeo_Government")
      const governmentsSnapshot = await getDocs(governmentsCollection)
      const governmentsData = governmentsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ID: doc.data().ID || parseInt(doc.id) || 0,
        Name: doc.data().Name || ''
      }))

      // Fetch cities
      const citiesCollection = collection(db, "DefGeo_Cities")
      const citiesSnapshot = await getDocs(citiesCollection)
      const citiesData = citiesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ID: doc.data().ID || parseInt(doc.id) || 0,
        Name: doc.data().Name || '',
        IDGovernorate: doc.data().IDGovernorate || 0
      }))

      // Fetch villages
      const villagesCollection = collection(db, "DefGeo_Villages")
      const villagesSnapshot = await getDocs(villagesCollection)
      const villagesData = villagesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ID: doc.data().ID || parseInt(doc.id) || 0,
        Name: doc.data().Name || '',
        IDCity: doc.data().IDCity || 0
      }))

      // Fetch areas
      const areasCollection = collection(db, "DefGeo_Areas")
      const areasSnapshot = await getDocs(areasCollection)
      const areasData = areasSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ID: doc.data().ID || parseInt(doc.id) || 0,
        Name: doc.data().Name || '',
        IDCity: doc.data().IDCity || 0,
        IDVillage: doc.data().IDVillage || 0
      }))

      // Fetch places
      const placesCollection = collection(db, "DefGeo_Places")
      const placesSnapshot = await getDocs(placesCollection)
      
      if (!placesSnapshot.empty) {
        const placesData = placesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          const place: Place = {
            id: doc.id,
            ID: data.ID || 0,
            Name: data.Name || '',
            PlaceType: data.PlaceType || '',
            Address: data.Address || '',
            Latitude: data.Latitude || undefined,
            Longitude: data.Longitude || undefined,
            LocationLink: data.LocationLink || '',
            Phone: data.Phone || '',
            Notes: data.Notes || '',
            ImageLink: data.ImageLink || '',
            ImageName: data.ImageName || '',
            IDAreas: data.IDAreas || 0,
            FullAddressText: data.FullAddressText || '',
            // Method 1
            Method1: data.Method1 || '',
            Method1TotalTime: data.Method1TotalTime || undefined,
            Method1Notes: data.Method1Notes || '',
            Method1Step1Data: data.Method1Step1Data || '',
            Method1Step1TimeMinutes: data.Method1Step1TimeMinutes || undefined,
            Method1Step2Data: data.Method1Step2Data || '',
            Method1Step2TimeMinutes: data.Method1Step2TimeMinutes || undefined,
            Method1Step3Data: data.Method1Step3Data || '',
            Method1Step3TimeMinutes: data.Method1Step3TimeMinutes || undefined,
            Method1Step4Data: data.Method1Step4Data || '',
            Method1Step4TimeMinutes: data.Method1Step4TimeMinutes || undefined,
            Method1Step5Data: data.Method1Step5Data || '',
            Method1Step5TimeMinutes: data.Method1Step5TimeMinutes || undefined,
            // Method 2
            Method2: data.Method2 || '',
            Method2TotalTime: data.Method2TotalTime || undefined,
            Method2Notes: data.Method2Notes || '',
            Method2Step1Data: data.Method2Step1Data || '',
            Method2Step1TimeMinutes: data.Method2Step1TimeMinutes || undefined,
            Method2Step2Data: data.Method2Step2Data || '',
            Method2Step2TimeMinutes: data.Method2Step2TimeMinutes || undefined,
            Method2Step3Data: data.Method2Step3Data || '',
            Method2Step3TimeMinutes: data.Method2Step3TimeMinutes || undefined,
            Method2Step4Data: data.Method2Step4Data || '',
            Method2Step4TimeMinutes: data.Method2Step4TimeMinutes || undefined,
            Method2Step5Data: data.Method2Step5Data || '',
            Method2Step5TimeMinutes: data.Method2Step5TimeMinutes || undefined,
            // Method 3
            Method3: data.Method3 || '',
            Method3TotalTime: data.Method3TotalTime || undefined,
            Method3Notes: data.Method3Notes || '',
            Method3Step1Data: data.Method3Step1Data || '',
            Method3Step1TimeMinutes: data.Method3Step1TimeMinutes || undefined,
            Method3Step2Data: data.Method3Step2Data || '',
            Method3Step2TimeMinutes: data.Method3Step2TimeMinutes || undefined,
            Method3Step3Data: data.Method3Step3Data || '',
            Method3Step3TimeMinutes: data.Method3Step3TimeMinutes || undefined,
            Method3Step4Data: data.Method3Step4Data || '',
            Method3Step4TimeMinutes: data.Method3Step4TimeMinutes || undefined,
            Method3Step5Data: data.Method3Step5Data || '',
            Method3Step5TimeMinutes: data.Method3Step5TimeMinutes || undefined,
            // Method 4
            Method4: data.Method4 || '',
            Method4TotalTime: data.Method4TotalTime || undefined,
            Method4Notes: data.Method4Notes || '',
            Method4Step1Data: data.Method4Step1Data || '',
            Method4Step1TimeMinutes: data.Method4Step1TimeMinutes || undefined,
            Method4Step2Data: data.Method4Step2Data || '',
            Method4Step2TimeMinutes: data.Method4Step2TimeMinutes || undefined,
            Method4Step3Data: data.Method4Step3Data || '',
            Method4Step3TimeMinutes: data.Method4Step3TimeMinutes || undefined,
            Method4Step4Data: data.Method4Step4Data || '',
            Method4Step4TimeMinutes: data.Method4Step4TimeMinutes || undefined,
            Method4Step5Data: data.Method4Step5Data || '',
            Method4Step5TimeMinutes: data.Method4Step5TimeMinutes || undefined,
          }

          // Find hierarchy
          const area = areasData.find(a => a.ID?.toString() === place.IDAreas?.toString())
          const village = area ? villagesData.find(v => v.ID?.toString() === area.IDVillage?.toString()) : undefined
          const city = village ? citiesData.find(c => c.ID?.toString() === village.IDCity?.toString()) : undefined
          const government = city ? governmentsData.find(g => g.ID?.toString() === city.IDGovernorate?.toString()) : undefined

          const placeWithHierarchy: PlaceWithHierarchy = {
            ...place,
            governmentName: government?.Name,
            cityName: city?.Name,
            villageName: village?.Name,
            areaName: area?.Name,
            governmentId: government?.id,
            cityId: city?.id,
            villageId: village?.id,
            areaId: area?.id
          }

          return placeWithHierarchy
        })

        setPlaces(placesData)
        setFilteredPlaces(placesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // Filter places based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPlaces(places)
    } else {
      const filtered = places.filter(place => 
        place.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.PlaceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.Address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.governmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.cityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.villageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.areaName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.FullAddressText?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPlaces(filtered)
    }
  }, [searchTerm, places])

  const clearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث في المصالح ..."
          className="pr-10 pl-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="mr-3 text-gray-600">جاري تحميل المصالح...</span>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <div className="max-h-[500px] overflow-y-auto pr-2">
          <div className="space-y-3">
            {filteredPlaces.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>لا توجد مصالح مطابقة للبحث</p>
                {searchTerm && (
                  <p className="text-sm mt-1">جرب كلمات بحث أخرى</p>
                )}
              </div>
            ) : (
              filteredPlaces.map((place) => (
                <Card 
                  key={place.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:bg-gray-50"
                  onDoubleClick={() => onPlaceView(place)}
                >
                  <CardContent className="p-4">
                    <div className="w-full">
                      {/* Place Name and Type */}
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-lg text-gray-800">
                          {place.Name}
                        </h3>
                        {place.PlaceType && (
                          <Badge variant="secondary" className="text-xs">
                            {place.PlaceType}
                          </Badge>
                        )}
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {/* Hierarchy Address */}
                        <div className="text-gray-600">
                          <span className="font-medium text-gray-700">العنوان:</span>
                          <div className="mt-1">
                            {place.governmentName && (
                              <span>{place.governmentName}</span>
                            )}
                            {place.cityName && (
                              <span> - {place.cityName}</span>
                            )}
                            {place.villageName && (
                              <span> - {place.villageName}</span>
                            )}
                            {place.areaName && (
                              <span> - {place.areaName}</span>
                            )}
                          </div>
                        </div>

                        {/* Phone */}
                        {place.Phone && (
                          <div className="text-gray-600">
                            <span className="font-medium text-gray-700">الهاتف:</span>
                            <div className="mt-1">{place.Phone}</div>
                          </div>
                        )}

                        {/* Additional Address */}
                        {place.Address && (
                          <div className="text-gray-600">
                            <span className="font-medium text-gray-700">تفاصيل العنوان:</span>
                            <div className="mt-1">{place.Address}</div>
                          </div>
                        )}

                        {/* Notes */}
                        {place.Notes && (
                          <div className="text-gray-600">
                            <span className="font-medium text-gray-700">ملاحظات:</span>
                            <div className="mt-1">{place.Notes}</div>
                          </div>
                        )}

                        {/* Location Link */}
                        {place.LocationLink && (
                          <div className="text-gray-600">
                            <span className="font-medium text-gray-700">الموقع:</span>
                            <div className="mt-1">
                              <a 
                                href={place.LocationLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                عرض على الخريطة
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Full Address */}
                        {place.FullAddressText && (
                          <div className="md:col-span-2 text-gray-600">
                            <span className="font-medium text-gray-700">العنوان الكامل:</span>
                            <div className="mt-1">{place.FullAddressText}</div>
                          </div>
                        )}
                      </div>


                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredPlaces.length > 0 && (
        <div className="text-center text-sm text-gray-500 border-t pt-3">
          {searchTerm ? (
            <span>تم العثور على {filteredPlaces.length} مصلحة مطابقة</span>
          ) : (
            <span>إجمالي المصالح: {filteredPlaces.length} مصلحة</span>
          )}
        </div>
      )}
    </div>
  )
}
