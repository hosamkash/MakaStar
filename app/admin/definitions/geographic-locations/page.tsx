"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, getDocs, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Building2,
  Home,
  Map,
  Landmark,
  Search
} from "lucide-react"

import PageHeader from "@/components/page-header"
import { notify } from "@/lib/notifications"
import GovernmentsDialog from "@/components/governments-dialog"
import CitiesDialog from "@/components/cities-dialog"
import VillagesDialog from "@/components/villages-dialog"
import AreasDialog from "@/components/areas-dialog"
import PlacesDialog from "@/components/places-dialog"
import PlaceSearchDialog from "@/components/place-search-dialog"
import PlacesListView from "@/components/places-list-view"
import PlaceDetailsDialog from "@/components/place-details-dialog"

import { Government, City, Area, Village, Place } from "@/lib/types/geographic-locations"

export default function GeographicLocationsPage() {
  // State for governments data
  const [governments, setGovernments] = useState<Government[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  
  // State for form selections
  const [selectedGovernment, setSelectedGovernment] = useState<string>("")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedArea, setSelectedArea] = useState<string>("")
  const [selectedVillage, setSelectedVillage] = useState<string>("")
  const [selectedPlace, setSelectedPlace] = useState<string>("")
  
  const [loading, setLoading] = useState(true)
  const [governmentsDialogOpen, setGovernmentsDialogOpen] = useState(false)
  const [citiesDialogOpen, setCitiesDialogOpen] = useState(false)
  const [villagesDialogOpen, setVillagesDialogOpen] = useState(false)
  const [areasDialogOpen, setAreasDialogOpen] = useState(false)
  const [placesDialogOpen, setPlacesDialogOpen] = useState(false)
  const [placeSearchDialogOpen, setPlaceSearchDialogOpen] = useState(false)
  const [placeDetailsDialogOpen, setPlaceDetailsDialogOpen] = useState(false)
  const [selectedPlaceForView, setSelectedPlaceForView] = useState<any>(null)

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

    fetchGovernments()
  }, [])

  // Function to refresh governments data when dialog closes
  const handleGovernmentsDataChanged = () => {
    const fetchUpdatedGovernments = async () => {
      try {
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
        console.error("Error fetching updated governments:", error)
        notify.error("حدث خطأ أثناء تحديث بيانات المحافظات")
      }
    }

    fetchUpdatedGovernments()
  }

  // Function to refresh cities data when dialog closes
  const handleCitiesDataChanged = () => {
    const fetchUpdatedCities = async () => {
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
        console.error("Error fetching updated cities:", error)
        notify.error("حدث خطأ أثناء تحديث بيانات المدن")
      }
    }

    if (selectedGovernment) {
      fetchUpdatedCities()
    }
  }

  // Function to refresh villages data when dialog closes
  const handleVillagesDataChanged = () => {
    const fetchUpdatedVillages = async () => {
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
        console.error("Error fetching updated villages:", error)
        notify.error("حدث خطأ أثناء تحديث بيانات القرى")
      }
    }

    if (selectedCity) {
      fetchUpdatedVillages()
    }
  }

  // Function to refresh areas data when dialog closes
  const handleAreasDataChanged = () => {
    const fetchUpdatedAreas = async () => {
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
          }).filter(area => area.IDVillage.toString() === selectedVillage)
          
          setAreas(areasData)
        }
      } catch (error) {
        console.error("Error fetching updated areas:", error)
        notify.error("حدث خطأ أثناء تحديث بيانات الأحياء")
      }
    }

    if (selectedVillage) {
      fetchUpdatedAreas()
    }
  }

  // Function to refresh places data when dialog closes
  const handlePlacesDataChanged = () => {
    const fetchUpdatedPlaces = async () => {
      try {
        const placesCollection = collection(db, "DefGeo_Places")
        const placesSnapshot = await getDocs(placesCollection)
        
        if (!placesSnapshot.empty) {
          const placesData = placesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data()
            return {
              id: doc.id,
              ID: data.ID || 0,
              Name: data.Name || '',
              PlaceType: data.PlaceType || '',
              Address: data.Address || '',
              Latitude: data.Latitude || 0,
              Longitude: data.Longitude || 0,
              LocationLink: data.LocationLink || '',
              Phone: data.Phone || '',
              Notes: data.Notes || '',
              ImageLink: data.ImageLink || '',
              ImageName: data.ImageName || '',
              AddedBy: data.AddedBy || '',
              DateAdded: data.DateAdded || '',
              IDAreas: data.IDAreas || 0,
              FullAddressText: data.FullAddressText || '',
            }
          }).filter(place => place.IDAreas?.toString() === selectedArea)
          
          setPlaces(placesData)
        }
      } catch (error) {
        console.error("Error fetching updated places:", error)
        notify.error("حدث خطأ أثناء تحديث بيانات المصالح")
      }
    }

    if (selectedArea) {
      fetchUpdatedPlaces()
    }
  }

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

  // Fetch villages when city is selected (DefGeo_Villages has IDCity) - القرية/المنطقة
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

  // Fetch areas when village is selected (DefGeo_Areas - الحي)
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

  // Fetch places when area is selected (DefGeo_Places has IDAreas) - المصالح
  useEffect(() => {
    const fetchPlaces = async () => {
      if (!selectedArea) {
        setPlaces([])
        setSelectedPlace("")
        return
      }

      try {
        const placesCollection = collection(db, "DefGeo_Places")
        const placesSnapshot = await getDocs(placesCollection)
        
        if (!placesSnapshot.empty) {
          const placesData = placesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data()
            return {
              id: doc.id,
              ID: data.ID || 0,
              Name: data.Name || '',
              PlaceType: data.PlaceType || '',
              Address: data.Address || '',
              Latitude: data.Latitude || 0,
              Longitude: data.Longitude || 0,
              LocationLink: data.LocationLink || '',
              Phone: data.Phone || '',
              Notes: data.Notes || '',
              ImageLink: data.ImageLink || '',
              ImageName: data.ImageName || '',
              AddedBy: data.AddedBy || '',
              DateAdded: data.DateAdded || '',
              IDAreas: data.IDAreas || 0,
              FullAddressText: data.FullAddressText || '',
            }
          }).filter(place => {
            const selectedAreaData = areas.find(area => area.id === selectedArea)
            return selectedAreaData && place.IDAreas === selectedAreaData.ID
          })
          
          setPlaces(placesData)
        }
      } catch (error) {
        console.error("Error fetching places:", error)
        notify.error("حدث خطأ أثناء جلب بيانات المصالح")
      }
    }

    fetchPlaces()
  }, [selectedArea, areas])

  const handleClearData = () => {
    setSelectedGovernment("")
    setSelectedCity("")
    setSelectedArea("")
    setSelectedVillage("")
    setSelectedPlace("")
    setCities([])
    setAreas([])
    setVillages([])
    setPlaces([])
  }

  // Standalone fetch functions for place selection
  const fetchCities = async (governmentId: string) => {
    try {
      const citiesCollection = collection(db, "DefGeo_Cities")
      const citiesSnapshot = await getDocs(citiesCollection)
      
      if (!citiesSnapshot.empty) {
        const citiesData = citiesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || parseInt(doc.id) || 0,
            Name: data.Name || '',
            IDGovernorate: data.IDGovernorate || 0,
          }
        }).filter(city => city.IDGovernorate.toString() === governmentId)
        
        setCities(citiesData.sort((a, b) => (a.ID || 0) - (b.ID || 0)))
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
    }
  }

  const fetchVillages = async (cityId: string) => {
    try {
      const villagesCollection = collection(db, "DefGeo_Villages")
      const villagesSnapshot = await getDocs(villagesCollection)
      
      if (!villagesSnapshot.empty) {
        const villagesData = villagesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || parseInt(doc.id) || 0,
            Name: data.Name || '',
            IDCity: data.IDCity || 0,
          }
        }).filter(village => village.IDCity.toString() === cityId)
        
        setVillages(villagesData.sort((a, b) => (a.ID || 0) - (b.ID || 0)))
      }
    } catch (error) {
      console.error("Error fetching villages:", error)
    }
  }

  const fetchAreas = async (villageId: string) => {
    try {
      const areasCollection = collection(db, "DefGeo_Areas")
      const areasSnapshot = await getDocs(areasCollection)
      
      if (!areasSnapshot.empty) {
        const areasData = areasSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || parseInt(doc.id) || 0,
            Name: data.Name || '',
            IDCity: data.IDCity || 0,
            IDVillage: data.IDVillage || 0,
          }
        }).filter(area => area.IDVillage.toString() === villageId)
        
        setAreas(areasData.sort((a, b) => (a.ID || 0) - (b.ID || 0)))
      }
    } catch (error) {
      console.error("Error fetching areas:", error)
    }
  }

  const fetchPlaces = async (areaId: string) => {
    try {
      const placesCollection = collection(db, "DefGeo_Places")
      const placesSnapshot = await getDocs(placesCollection)
      
      if (!placesSnapshot.empty) {
        const placesData = placesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || parseInt(doc.id) || 0,
            Name: data.Name || '',
            PlaceType: data.PlaceType || '',
            Address: data.Address || '',
            IDAreas: data.IDAreas || 0,
          }
        }).filter(place => place.IDAreas?.toString() === areaId)
        
        setPlaces(placesData.sort((a, b) => (a.ID || 0) - (b.ID || 0)))
      }
    } catch (error) {
      console.error("Error fetching places:", error)
    }
  }

  // Handle place selection from search dialog
  const handlePlaceSelection = async (place: any) => {
    try {
      // Clear all data first
      handleClearData()

      // Step by step population with proper sequencing
      if (place.governmentId) {
        // Step 1: Set government and fetch cities
        setSelectedGovernment(place.governmentId)
        await fetchCities(place.governmentId)
        
        if (place.cityId) {
          // Step 2: Set city and fetch villages
          setSelectedCity(place.cityId)
          await fetchVillages(place.cityId)
          
          if (place.villageId) {
            // Step 3: Set village and fetch areas
            setSelectedVillage(place.villageId)
            await fetchAreas(place.villageId)
            
            if (place.areaId) {
              // Step 4: Set area and fetch places
              setSelectedArea(place.areaId)
              await fetchPlaces(place.areaId)
              
              // Step 5: Set the selected place
              // Use a small delay to ensure the places list is populated
              await new Promise(resolve => setTimeout(resolve, 100))
              setSelectedPlace(place.id)
            }
          }
        }
      }
      
      notify.success(`تم اختيار المصلحة: ${place.Name}`)
    } catch (error) {
      console.error("Error selecting place:", error)
      notify.error("حدث خطأ أثناء اختيار المصلحة")
    }
  }

  // Handle place view details
  const handlePlaceView = (place: any) => {
    setSelectedPlaceForView(place)
    setPlaceDetailsDialogOpen(true)
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="إدارة المواقع الجغرافية"
        actionButtons={[]}
      />

      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <Card>
            <CardContent className="p-6">
          <Tabs defaultValue="basic" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="basic">التعريف الأساسي</TabsTrigger>
              <TabsTrigger value="search">البحث العام</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
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
                      setSelectedPlace("")
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
                    <button 
                      onClick={() => setGovernmentsDialogOpen(true)}
                      className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded flex items-center justify-center transition-colors cursor-pointer"
                      title="إدارة المحافظات"
                    >
                      <Building2 className="w-4 h-4 text-white" />
                    </button>
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
                      setSelectedPlace("")
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
                    <button 
                      onClick={() => setCitiesDialogOpen(true)}
                      className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded flex items-center justify-center transition-colors cursor-pointer"
                      title="إدارة المدن"
                    >
                      <Building2 className="w-4 h-4 text-white" />
                    </button>
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
                      setSelectedPlace("")
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
                    <button 
                      onClick={() => setVillagesDialogOpen(true)}
                      className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded flex items-center justify-center transition-colors cursor-pointer"
                      title="إدارة القرى/المناطق"
                    >
                      <MapPin className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* الحي */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Select
                    value={selectedArea}
                    onValueChange={(value) => {
                      setSelectedArea(value)
                      setSelectedPlace("")
                    }}
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
                    <button 
                      onClick={() => setAreasDialogOpen(true)}
                      className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded flex items-center justify-center transition-colors cursor-pointer"
                      title="إدارة الأحياء"
                    >
                      <Home className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* قائمة المصالح */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Select
                    value={selectedPlace}
                    onValueChange={setSelectedPlace}
                    disabled={!selectedArea || places.length === 0}
                  >
                    <SelectTrigger className="w-full h-12 text-right [&>svg]:order-first [&>svg]:ml-0 [&>svg]:mr-2">
                      <SelectValue placeholder={!selectedArea ? "اختر الحي أولاً" : "اختر المصلحة"} />
                    </SelectTrigger>
                    <SelectContent>
                      {places.map((place) => (
                        <SelectItem key={place.id} value={place.id}>
                          {place.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-3 mr-3">
                    <label className="text-sm font-medium text-gray-700">قائمة المصالح</label>
                    <button 
                      onClick={() => setPlacesDialogOpen(true)}
                      className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded flex items-center justify-center transition-colors cursor-pointer"
                      title="إدارة المصالح"
                    >
                      <Landmark className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* الأزرار */}
              <div className="flex flex-col gap-4 mt-8">
                <Button
                  onClick={() => setPlaceSearchDialogOpen(true)}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  البحث عن مكان (مصلحة)
                </Button>
                
                <Button 
                  onClick={handleClearData}
                  variant="destructive"
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-medium"
                >
                  مسح البيانات
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="search" className="space-y-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">جميع المصالح</h3>
                  <p className="text-gray-500">تصفح جميع المصالح المسجلة في النظام</p>
                </div>
                
                <PlacesListView onPlaceView={handlePlaceView} />
              </div>
            </TabsContent>
          </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Governments Management Dialog */}
      <GovernmentsDialog
        open={governmentsDialogOpen}
        onOpenChange={setGovernmentsDialogOpen}
        onDataChanged={handleGovernmentsDataChanged}
      />

      {/* Cities Management Dialog */}
      <CitiesDialog
        open={citiesDialogOpen}
        onOpenChange={setCitiesDialogOpen}
        onDataChanged={handleCitiesDataChanged}
        selectedGovernmentId={selectedGovernment}
      />

      {/* Villages Management Dialog */}
      <VillagesDialog
        open={villagesDialogOpen}
        onOpenChange={setVillagesDialogOpen}
        onDataChanged={handleVillagesDataChanged}
        selectedGovernmentId={selectedGovernment}
        selectedCityId={selectedCity}
      />

      {/* Areas Management Dialog */}
      <AreasDialog
        open={areasDialogOpen}
        onOpenChange={setAreasDialogOpen}
        onDataChanged={handleAreasDataChanged}
        selectedGovernmentId={selectedGovernment}
        selectedCityId={selectedCity}
        selectedVillageId={selectedVillage}
      />

      {/* Places Management Dialog */}
      <PlacesDialog
        open={placesDialogOpen}
        onOpenChange={setPlacesDialogOpen}
        onDataChanged={handlePlacesDataChanged}
        selectedGovernmentId={selectedGovernment}
        selectedCityId={selectedCity}
        selectedVillageId={selectedVillage}
        selectedAreaId={selectedArea}
      />

      {/* Place Search Dialog */}
      <PlaceSearchDialog
        open={placeSearchDialogOpen}
        onOpenChange={setPlaceSearchDialogOpen}
        onPlaceSelect={handlePlaceSelection}
      />

      {/* Place Details Dialog */}
      <PlaceDetailsDialog
        open={placeDetailsDialogOpen}
        onOpenChange={setPlaceDetailsDialogOpen}
        place={selectedPlaceForView}
      />
    </div>
  )
}
