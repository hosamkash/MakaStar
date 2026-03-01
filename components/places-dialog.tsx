"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Save, X, Settings, Upload, MapPin, ExternalLink, Camera } from "lucide-react"
import { notify } from "@/lib/notifications"
import PlaceTypesDialog from "@/components/place-types-dialog"
import PlaceTypeSelectorDialog from "@/components/place-type-selector-dialog"

interface Government {
  id: string
  ID?: number
  Name: string
}

interface City {
  id: string
  ID?: number
  Name: string
  IDGovernorate: number
}

interface Village {
  id: string
  ID?: number
  Name: string
  IDCity: number
}

interface Area {
  id: string
  ID?: number
  Name: string
  IDCity: number
  IDVillage: number
}

interface PlaceType {
  id: string
  ID?: number
  Name: string
}

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
  AddedBy?: string
  DateAdded?: string
  IDAreas?: number
  FullAddressText?: string
}

interface PlacesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataChanged: () => void
  selectedGovernmentId?: string
  selectedCityId?: string
  selectedVillageId?: string
  selectedAreaId?: string
}

export default function PlacesDialog({ 
  open, 
  onOpenChange, 
  onDataChanged, 
  selectedGovernmentId, 
  selectedCityId, 
  selectedVillageId, 
  selectedAreaId 
}: PlacesDialogProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const [governments, setGovernments] = useState<Government[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([])
  const [allCities, setAllCities] = useState<City[]>([])
  const [allVillages, setAllVillages] = useState<Village[]>([])
  const [allAreas, setAllAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [placeTypesDialogOpen, setPlaceTypesDialogOpen] = useState(false)
  const [placeTypeSelectorOpen, setPlaceTypeSelectorOpen] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [formData, setFormData] = useState({
    Name: "",
    PlaceType: "",
    Address: "",
    Latitude: undefined as number | undefined,
    Longitude: undefined as number | undefined,
    LocationLink: "",
    Phone: "",
    Notes: "",
    ImageLink: "",
    ImageName: "",
    AddedBy: "",
    IDAreas: "",
    FullAddressText: ""
  })

  const fetchGovernments = async () => {
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
    }
  }

  const fetchCities = async () => {
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
        })

        setAllCities(citiesData)

        if (selectedGovernmentId) {
          const filteredCities = citiesData.filter(city => city.IDGovernorate.toString() === selectedGovernmentId)
          setCities(filteredCities)
        } else {
          setCities(citiesData)
        }
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
      notify.error("حدث خطأ أثناء جلب بيانات المدن")
    }
  }

  const fetchVillages = async () => {
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
        })

        setAllVillages(villagesData)

        if (selectedCityId) {
          const filteredVillages = villagesData.filter(village => village.IDCity.toString() === selectedCityId)
          setVillages(filteredVillages)
        } else {
          setVillages(villagesData)
        }
      }
    } catch (error) {
      console.error("Error fetching villages:", error)
      notify.error("حدث خطأ أثناء جلب بيانات القرى")
    }
  }

  const fetchAreas = async () => {
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
        })

        setAllAreas(areasData)

        if (selectedVillageId) {
          const filteredAreas = areasData.filter(area => area.IDVillage.toString() === selectedVillageId)
          setAreas(filteredAreas)
        } else {
          setAreas(areasData)
        }
      }
    } catch (error) {
      console.error("Error fetching areas:", error)
      notify.error("حدث خطأ أثناء جلب بيانات الأحياء")
    }
  }

  const fetchPlaceTypes = async () => {
    try {
      const placeTypesCollection = collection(db, "DefGeo_PlaceTypes")
      const placeTypesSnapshot = await getDocs(placeTypesCollection)
      
      if (!placeTypesSnapshot.empty) {
        const placeTypesData = placeTypesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
            ID: data.ID || 0,
            Name: data.Name || '',
          }
        })

        // Sort by ID
        const sortedData = placeTypesData.sort((a, b) => {
          const idA = a.ID || 0
          const idB = b.ID || 0
          return idA - idB
        })
        
        setPlaceTypes(sortedData)
      }
    } catch (error) {
      console.error("Error fetching place types:", error)
      notify.error("حدث خطأ أثناء جلب بيانات أنواع المصالح")
    }
  }

  const fetchPlaces = async () => {
    try {
      setLoading(true)
      const placesCollection = collection(db, "DefGeo_Places")
      const placesSnapshot = await getDocs(placesCollection)
      
      if (!placesSnapshot.empty) {
        let placesData = placesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
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
        })

        // إذا كان هناك حي مختار، اعرض مصالحه فقط
        if (selectedAreaId) {
          placesData = placesData.filter(place => place.IDAreas?.toString() === selectedAreaId)
        }

        setPlaces(placesData)
      }
    } catch (error) {
      console.error("Error fetching places:", error)
      notify.error("حدث خطأ أثناء جلب بيانات المصالح")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchGovernments()
      fetchCities()
      fetchVillages()
      fetchAreas()
      fetchPlaceTypes()
      fetchPlaces()
    }
  }, [open, selectedGovernmentId, selectedCityId, selectedVillageId, selectedAreaId])

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    
    // Build initial full address from hierarchy
    const initialFullAddress = buildHierarchyAddress()
    
    setFormData({ 
      Name: "",
      PlaceType: "",
      Address: "",
      Latitude: undefined,
      Longitude: undefined,
      LocationLink: "",
      Phone: "",
      Notes: "",
      ImageLink: "",
      ImageName: "",
      AddedBy: "",
      IDAreas: selectedAreaId || "",
      FullAddressText: initialFullAddress,
      Method1: "",
      Method1TotalTime: undefined,
      Method1Notes: "",
      Method1Step1Data: "",
      Method1Step1TimeMinutes: undefined,
      Method1Step2Data: "",
      Method1Step2TimeMinutes: undefined,
      Method1Step3Data: "",
      Method1Step3TimeMinutes: undefined,
      Method1Step4Data: "",
      Method1Step4TimeMinutes: undefined,
      Method1Step5Data: "",
      Method1Step5TimeMinutes: undefined,
      Method2: "",
      Method2TotalTime: undefined,
      Method2Notes: "",
      Method2Step1Data: "",
      Method2Step1TimeMinutes: undefined,
      Method2Step2Data: "",
      Method2Step2TimeMinutes: undefined,
      Method2Step3Data: "",
      Method2Step3TimeMinutes: undefined,
      Method2Step4Data: "",
      Method2Step4TimeMinutes: undefined,
      Method2Step5Data: "",
      Method2Step5TimeMinutes: undefined,
      Method3: "",
      Method3TotalTime: undefined,
      Method3Notes: "",
      Method3Step1Data: "",
      Method3Step1TimeMinutes: undefined,
      Method3Step2Data: "",
      Method3Step2TimeMinutes: undefined,
      Method3Step3Data: "",
      Method3Step3TimeMinutes: undefined,
      Method3Step4Data: "",
      Method3Step4TimeMinutes: undefined,
      Method3Step5Data: "",
      Method3Step5TimeMinutes: undefined,
      Method4: "",
      Method4TotalTime: undefined,
      Method4Notes: "",
      Method4Step1Data: "",
      Method4Step1TimeMinutes: undefined,
      Method4Step2Data: "",
      Method4Step2TimeMinutes: undefined,
      Method4Step3Data: "",
      Method4Step3TimeMinutes: undefined,
      Method4Step4Data: "",
      Method4Step4TimeMinutes: undefined,
      Method4Step5Data: "",
      Method4Step5TimeMinutes: undefined
    })
  }

  const handleEdit = (place: Place) => {
    setEditingId(place.id)
    setIsAdding(false)
    setFormData({
      Name: place.Name,
      PlaceType: place.PlaceType || "",
      Address: place.Address || "",
      Latitude: place.Latitude,
      Longitude: place.Longitude,
      LocationLink: place.LocationLink || "",
      Phone: place.Phone || "",
      Notes: place.Notes || "",
      ImageLink: place.ImageLink || "",
      ImageName: place.ImageName || "",
      AddedBy: place.AddedBy || "",
      IDAreas: place.IDAreas?.toString() || "",
      FullAddressText: place.FullAddressText || "",
      // Method 1
      Method1: place.Method1 || "",
      Method1TotalTime: place.Method1TotalTime,
      Method1Notes: place.Method1Notes || "",
      Method1Step1Data: place.Method1Step1Data || "",
      Method1Step1TimeMinutes: place.Method1Step1TimeMinutes,
      Method1Step2Data: place.Method1Step2Data || "",
      Method1Step2TimeMinutes: place.Method1Step2TimeMinutes,
      Method1Step3Data: place.Method1Step3Data || "",
      Method1Step3TimeMinutes: place.Method1Step3TimeMinutes,
      Method1Step4Data: place.Method1Step4Data || "",
      Method1Step4TimeMinutes: place.Method1Step4TimeMinutes,
      Method1Step5Data: place.Method1Step5Data || "",
      Method1Step5TimeMinutes: place.Method1Step5TimeMinutes,
      // Method 2
      Method2: place.Method2 || "",
      Method2TotalTime: place.Method2TotalTime,
      Method2Notes: place.Method2Notes || "",
      Method2Step1Data: place.Method2Step1Data || "",
      Method2Step1TimeMinutes: place.Method2Step1TimeMinutes,
      Method2Step2Data: place.Method2Step2Data || "",
      Method2Step2TimeMinutes: place.Method2Step2TimeMinutes,
      Method2Step3Data: place.Method2Step3Data || "",
      Method2Step3TimeMinutes: place.Method2Step3TimeMinutes,
      Method2Step4Data: place.Method2Step4Data || "",
      Method2Step4TimeMinutes: place.Method2Step4TimeMinutes,
      Method2Step5Data: place.Method2Step5Data || "",
      Method2Step5TimeMinutes: place.Method2Step5TimeMinutes,
      // Method 3
      Method3: place.Method3 || "",
      Method3TotalTime: place.Method3TotalTime,
      Method3Notes: place.Method3Notes || "",
      Method3Step1Data: place.Method3Step1Data || "",
      Method3Step1TimeMinutes: place.Method3Step1TimeMinutes,
      Method3Step2Data: place.Method3Step2Data || "",
      Method3Step2TimeMinutes: place.Method3Step2TimeMinutes,
      Method3Step3Data: place.Method3Step3Data || "",
      Method3Step3TimeMinutes: place.Method3Step3TimeMinutes,
      Method3Step4Data: place.Method3Step4Data || "",
      Method3Step4TimeMinutes: place.Method3Step4TimeMinutes,
      Method3Step5Data: place.Method3Step5Data || "",
      Method3Step5TimeMinutes: place.Method3Step5TimeMinutes,
      // Method 4
      Method4: place.Method4 || "",
      Method4TotalTime: place.Method4TotalTime,
      Method4Notes: place.Method4Notes || "",
      Method4Step1Data: place.Method4Step1Data || "",
      Method4Step1TimeMinutes: place.Method4Step1TimeMinutes,
      Method4Step2Data: place.Method4Step2Data || "",
      Method4Step2TimeMinutes: place.Method4Step2TimeMinutes,
      Method4Step3Data: place.Method4Step3Data || "",
      Method4Step3TimeMinutes: place.Method4Step3TimeMinutes,
      Method4Step4Data: place.Method4Step4Data || "",
      Method4Step4TimeMinutes: place.Method4Step4TimeMinutes,
      Method4Step5Data: place.Method4Step5Data || "",
      Method4Step5TimeMinutes: place.Method4Step5TimeMinutes
    })
  }

  // Function to refresh place types data when dialog closes
  const handlePlaceTypesDataChanged = () => {
    fetchPlaceTypes()
  }

  // Function to handle place type selection
  const handlePlaceTypeSelect = (typeName: string) => {
    setFormData({ ...formData, PlaceType: typeName })
  }

  // Helper function to build hierarchy address
  const buildHierarchyAddress = () => {
    const hierarchy = []
    const government = governments.find(g => g.id === selectedGovernmentId)
    const city = allCities.find(c => c.id === selectedCityId)
    const village = allVillages.find(v => v.id === selectedVillageId)
    const area = allAreas.find(a => a.id === selectedAreaId)
    
    if (government) hierarchy.push(government.Name)
    if (city) hierarchy.push(city.Name)
    if (village) hierarchy.push(village.Name)
    if (area) hierarchy.push(area.Name)
    
    return hierarchy.join(" - ")
  }

  // Function to get full hierarchy for dialog title
  const getFullHierarchyForTitle = () => {
    return buildHierarchyAddress()
  }

  // Function to handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      setImageUploading(true)
      
      // Create storage reference
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const storageRef = ref(storage, `Application/DefGeo_Places/${fileName}`)
      
      // Upload file
      await uploadBytes(storageRef, file)
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)
      
      // Update form data
      setFormData({
        ...formData,
        ImageLink: downloadURL,
        ImageName: fileName
      })
      
      notify.success("تم رفع الصورة بنجاح")
    } catch (error) {
      console.error("Error uploading image:", error)
      notify.error("حدث خطأ أثناء رفع الصورة")
    } finally {
      setImageUploading(false)
    }
  }

  // Function to get current location
  const getCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          setFormData({
            ...formData,
            Latitude: lat,
            Longitude: lng,
            LocationLink: `https://www.google.com/maps?q=${lat},${lng}`
          })
          
          notify.success("تم الحصول على الموقع الحالي")
        },
        (error) => {
          console.error("Error getting location:", error)
          notify.error("لا يمكن الحصول على الموقع الحالي")
        }
      )
    } else {
      notify.error("المتصفح لا يدعم خدمة تحديد الموقع")
    }
  }

  // Function to update full address automatically
  const updateFullAddress = () => {
    const autoAddress = buildHierarchyAddress()
    
    // Only update if we have a valid hierarchy
    if (!autoAddress) return
    
    // If this is during edit and we have existing custom details, preserve them
    if (editingId && formData.FullAddressText) {
      // Extract custom part by removing the standard hierarchy pattern
      const existingAddress = formData.FullAddressText
      const hierarchy = autoAddress.split(" - ")
      const hierarchyPattern = new RegExp(`^${hierarchy.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(' - ')}(?:\\s*-\\s*)?`)
      const customPart = existingAddress.replace(hierarchyPattern, '').trim()
      
      const fullAddress = autoAddress + (customPart ? " - " + customPart : "")
      setFormData({ ...formData, FullAddressText: fullAddress })
    } else {
      // For new records, just set the hierarchy
      setFormData({ ...formData, FullAddressText: autoAddress })
    }
  }

  // Update full address when hierarchy changes (only for new records)
  useEffect(() => {
    if (selectedGovernmentId && selectedCityId && selectedVillageId && selectedAreaId) {
      // Only auto-update for new records, not during editing
      if (isAdding && !editingId) {
        updateFullAddress()
      }
    }
  }, [selectedGovernmentId, selectedCityId, selectedVillageId, selectedAreaId, governments, allCities, allVillages, allAreas, isAdding, editingId])

  // Auto-update full address when opening a new form (only for new records)
  useEffect(() => {
    if (isAdding && !editingId && selectedGovernmentId && selectedCityId && selectedVillageId && selectedAreaId) {
      const autoAddress = buildHierarchyAddress()
      if (autoAddress && formData.FullAddressText !== autoAddress) {
        setFormData(prev => ({ ...prev, FullAddressText: autoAddress }))
      }
    }
  }, [isAdding, editingId, selectedGovernmentId, selectedCityId, selectedVillageId, selectedAreaId])

  const handleSave = async () => {
    if (!formData.Name.trim() || !formData.IDAreas) {
      notify.error("يرجى ملء الحقول المطلوبة على الأقل (الاسم والحي)")
      return
    }

    try {
      setLoading(true)
      
      if (isAdding) {
        // العثور على أكبر ID موجود وإضافة 1
        const placesCollection = collection(db, "DefGeo_Places")
        const placesSnapshot = await getDocs(placesCollection)
        
        let maxId = 0
        if (!placesSnapshot.empty) {
          placesSnapshot.docs.forEach((doc) => {
            const data = doc.data()
            const currentId = data.ID || parseInt(doc.id) || 0
            if (currentId > maxId) {
              maxId = currentId
            }
          })
        }
        
        const newId = maxId + 1
        const docId = newId.toString()
        
        await setDoc(doc(db, "DefGeo_Places", docId), {
          ID: newId,
          Name: formData.Name,
          PlaceType: formData.PlaceType || null,
          Address: formData.Address || null,
          Latitude: formData.Latitude || null,
          Longitude: formData.Longitude || null,
          LocationLink: formData.LocationLink || null,
          Phone: formData.Phone || null,
          Notes: formData.Notes || null,
          ImageLink: formData.ImageLink || null,
          ImageName: formData.ImageName || null,
          AddedBy: formData.AddedBy || null,
          DateAdded: new Date().toISOString(),
          IDAreas: parseInt(formData.IDAreas),
          FullAddressText: formData.FullAddressText || null,
          // Method 1
          Method1: formData.Method1 || null,
          Method1TotalTime: formData.Method1TotalTime || null,
          Method1Notes: formData.Method1Notes || null,
          Method1Step1Data: formData.Method1Step1Data || null,
          Method1Step1TimeMinutes: formData.Method1Step1TimeMinutes || null,
          Method1Step2Data: formData.Method1Step2Data || null,
          Method1Step2TimeMinutes: formData.Method1Step2TimeMinutes || null,
          Method1Step3Data: formData.Method1Step3Data || null,
          Method1Step3TimeMinutes: formData.Method1Step3TimeMinutes || null,
          Method1Step4Data: formData.Method1Step4Data || null,
          Method1Step4TimeMinutes: formData.Method1Step4TimeMinutes || null,
          Method1Step5Data: formData.Method1Step5Data || null,
          Method1Step5TimeMinutes: formData.Method1Step5TimeMinutes || null,
          // Method 2
          Method2: formData.Method2 || null,
          Method2TotalTime: formData.Method2TotalTime || null,
          Method2Notes: formData.Method2Notes || null,
          Method2Step1Data: formData.Method2Step1Data || null,
          Method2Step1TimeMinutes: formData.Method2Step1TimeMinutes || null,
          Method2Step2Data: formData.Method2Step2Data || null,
          Method2Step2TimeMinutes: formData.Method2Step2TimeMinutes || null,
          Method2Step3Data: formData.Method2Step3Data || null,
          Method2Step3TimeMinutes: formData.Method2Step3TimeMinutes || null,
          Method2Step4Data: formData.Method2Step4Data || null,
          Method2Step4TimeMinutes: formData.Method2Step4TimeMinutes || null,
          Method2Step5Data: formData.Method2Step5Data || null,
          Method2Step5TimeMinutes: formData.Method2Step5TimeMinutes || null,
          // Method 3
          Method3: formData.Method3 || null,
          Method3TotalTime: formData.Method3TotalTime || null,
          Method3Notes: formData.Method3Notes || null,
          Method3Step1Data: formData.Method3Step1Data || null,
          Method3Step1TimeMinutes: formData.Method3Step1TimeMinutes || null,
          Method3Step2Data: formData.Method3Step2Data || null,
          Method3Step2TimeMinutes: formData.Method3Step2TimeMinutes || null,
          Method3Step3Data: formData.Method3Step3Data || null,
          Method3Step3TimeMinutes: formData.Method3Step3TimeMinutes || null,
          Method3Step4Data: formData.Method3Step4Data || null,
          Method3Step4TimeMinutes: formData.Method3Step4TimeMinutes || null,
          Method3Step5Data: formData.Method3Step5Data || null,
          Method3Step5TimeMinutes: formData.Method3Step5TimeMinutes || null,
          // Method 4
          Method4: formData.Method4 || null,
          Method4TotalTime: formData.Method4TotalTime || null,
          Method4Notes: formData.Method4Notes || null,
          Method4Step1Data: formData.Method4Step1Data || null,
          Method4Step1TimeMinutes: formData.Method4Step1TimeMinutes || null,
          Method4Step2Data: formData.Method4Step2Data || null,
          Method4Step2TimeMinutes: formData.Method4Step2TimeMinutes || null,
          Method4Step3Data: formData.Method4Step3Data || null,
          Method4Step3TimeMinutes: formData.Method4Step3TimeMinutes || null,
          Method4Step4Data: formData.Method4Step4Data || null,
          Method4Step4TimeMinutes: formData.Method4Step4TimeMinutes || null,
          Method4Step5Data: formData.Method4Step5Data || null,
          Method4Step5TimeMinutes: formData.Method4Step5TimeMinutes || null
        })
        notify.success("تم إضافة المصلحة بنجاح")
      } else if (editingId) {
        await updateDoc(doc(db, "DefGeo_Places", editingId), {
          ID: parseInt(editingId) || 0,
          Name: formData.Name,
          PlaceType: formData.PlaceType || null,
          Address: formData.Address || null,
          Latitude: formData.Latitude || null,
          Longitude: formData.Longitude || null,
          LocationLink: formData.LocationLink || null,
          Phone: formData.Phone || null,
          Notes: formData.Notes || null,
          ImageLink: formData.ImageLink || null,
          ImageName: formData.ImageName || null,
          AddedBy: formData.AddedBy || null,
          IDAreas: parseInt(formData.IDAreas),
          FullAddressText: formData.FullAddressText || null,
          // Method 1
          Method1: formData.Method1 || null,
          Method1TotalTime: formData.Method1TotalTime || null,
          Method1Notes: formData.Method1Notes || null,
          Method1Step1Data: formData.Method1Step1Data || null,
          Method1Step1TimeMinutes: formData.Method1Step1TimeMinutes || null,
          Method1Step2Data: formData.Method1Step2Data || null,
          Method1Step2TimeMinutes: formData.Method1Step2TimeMinutes || null,
          Method1Step3Data: formData.Method1Step3Data || null,
          Method1Step3TimeMinutes: formData.Method1Step3TimeMinutes || null,
          Method1Step4Data: formData.Method1Step4Data || null,
          Method1Step4TimeMinutes: formData.Method1Step4TimeMinutes || null,
          Method1Step5Data: formData.Method1Step5Data || null,
          Method1Step5TimeMinutes: formData.Method1Step5TimeMinutes || null,
          // Method 2
          Method2: formData.Method2 || null,
          Method2TotalTime: formData.Method2TotalTime || null,
          Method2Notes: formData.Method2Notes || null,
          Method2Step1Data: formData.Method2Step1Data || null,
          Method2Step1TimeMinutes: formData.Method2Step1TimeMinutes || null,
          Method2Step2Data: formData.Method2Step2Data || null,
          Method2Step2TimeMinutes: formData.Method2Step2TimeMinutes || null,
          Method2Step3Data: formData.Method2Step3Data || null,
          Method2Step3TimeMinutes: formData.Method2Step3TimeMinutes || null,
          Method2Step4Data: formData.Method2Step4Data || null,
          Method2Step4TimeMinutes: formData.Method2Step4TimeMinutes || null,
          Method2Step5Data: formData.Method2Step5Data || null,
          Method2Step5TimeMinutes: formData.Method2Step5TimeMinutes || null,
          // Method 3
          Method3: formData.Method3 || null,
          Method3TotalTime: formData.Method3TotalTime || null,
          Method3Notes: formData.Method3Notes || null,
          Method3Step1Data: formData.Method3Step1Data || null,
          Method3Step1TimeMinutes: formData.Method3Step1TimeMinutes || null,
          Method3Step2Data: formData.Method3Step2Data || null,
          Method3Step2TimeMinutes: formData.Method3Step2TimeMinutes || null,
          Method3Step3Data: formData.Method3Step3Data || null,
          Method3Step3TimeMinutes: formData.Method3Step3TimeMinutes || null,
          Method3Step4Data: formData.Method3Step4Data || null,
          Method3Step4TimeMinutes: formData.Method3Step4TimeMinutes || null,
          Method3Step5Data: formData.Method3Step5Data || null,
          Method3Step5TimeMinutes: formData.Method3Step5TimeMinutes || null,
          // Method 4
          Method4: formData.Method4 || null,
          Method4TotalTime: formData.Method4TotalTime || null,
          Method4Notes: formData.Method4Notes || null,
          Method4Step1Data: formData.Method4Step1Data || null,
          Method4Step1TimeMinutes: formData.Method4Step1TimeMinutes || null,
          Method4Step2Data: formData.Method4Step2Data || null,
          Method4Step2TimeMinutes: formData.Method4Step2TimeMinutes || null,
          Method4Step3Data: formData.Method4Step3Data || null,
          Method4Step3TimeMinutes: formData.Method4Step3TimeMinutes || null,
          Method4Step4Data: formData.Method4Step4Data || null,
          Method4Step4TimeMinutes: formData.Method4Step4TimeMinutes || null,
          Method4Step5Data: formData.Method4Step5Data || null,
          Method4Step5TimeMinutes: formData.Method4Step5TimeMinutes || null
        })
        notify.success("تم تحديث المصلحة بنجاح")
      }

      setIsAdding(false)
      setEditingId(null)
      setFormData({ 
        Name: "",
        PlaceType: "",
        Address: "",
        Latitude: undefined,
        Longitude: undefined,
        LocationLink: "",
        Phone: "",
        Notes: "",
        ImageLink: "",
        ImageName: "",
        AddedBy: "",
        IDAreas: "",
        FullAddressText: "",
        Method1: "",
        Method1TotalTime: undefined,
        Method1Notes: "",
        Method1Step1Data: "",
        Method1Step1TimeMinutes: undefined,
        Method1Step2Data: "",
        Method1Step2TimeMinutes: undefined,
        Method1Step3Data: "",
        Method1Step3TimeMinutes: undefined,
        Method1Step4Data: "",
        Method1Step4TimeMinutes: undefined,
        Method1Step5Data: "",
        Method1Step5TimeMinutes: undefined,
        Method2: "",
        Method2TotalTime: undefined,
        Method2Notes: "",
        Method2Step1Data: "",
        Method2Step1TimeMinutes: undefined,
        Method2Step2Data: "",
        Method2Step2TimeMinutes: undefined,
        Method2Step3Data: "",
        Method2Step3TimeMinutes: undefined,
        Method2Step4Data: "",
        Method2Step4TimeMinutes: undefined,
        Method2Step5Data: "",
        Method2Step5TimeMinutes: undefined,
        Method3: "",
        Method3TotalTime: undefined,
        Method3Notes: "",
        Method3Step1Data: "",
        Method3Step1TimeMinutes: undefined,
        Method3Step2Data: "",
        Method3Step2TimeMinutes: undefined,
        Method3Step3Data: "",
        Method3Step3TimeMinutes: undefined,
        Method3Step4Data: "",
        Method3Step4TimeMinutes: undefined,
        Method3Step5Data: "",
        Method3Step5TimeMinutes: undefined,
        Method4: "",
        Method4TotalTime: undefined,
        Method4Notes: "",
        Method4Step1Data: "",
        Method4Step1TimeMinutes: undefined,
        Method4Step2Data: "",
        Method4Step2TimeMinutes: undefined,
        Method4Step3Data: "",
        Method4Step3TimeMinutes: undefined,
        Method4Step4Data: "",
        Method4Step4TimeMinutes: undefined,
        Method4Step5Data: "",
        Method4Step5TimeMinutes: undefined
      })
      await fetchPlaces()
      onDataChanged()
    } catch (error) {
      console.error("Error saving place:", error)
      notify.error("حدث خطأ أثناء حفظ البيانات")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ 
      Name: "",
      PlaceType: "",
      Address: "",
      Latitude: undefined,
      Longitude: undefined,
      LocationLink: "",
      Phone: "",
      Notes: "",
      ImageLink: "",
      ImageName: "",
      AddedBy: "",
      IDAreas: "",
      FullAddressText: "",
      Method1: "",
      Method1TotalTime: undefined,
      Method1Notes: "",
      Method1Step1Data: "",
      Method1Step1TimeMinutes: undefined,
      Method1Step2Data: "",
      Method1Step2TimeMinutes: undefined,
      Method1Step3Data: "",
      Method1Step3TimeMinutes: undefined,
      Method1Step4Data: "",
      Method1Step4TimeMinutes: undefined,
      Method1Step5Data: "",
      Method1Step5TimeMinutes: undefined,
      Method2: "",
      Method2TotalTime: undefined,
      Method2Notes: "",
      Method2Step1Data: "",
      Method2Step1TimeMinutes: undefined,
      Method2Step2Data: "",
      Method2Step2TimeMinutes: undefined,
      Method2Step3Data: "",
      Method2Step3TimeMinutes: undefined,
      Method2Step4Data: "",
      Method2Step4TimeMinutes: undefined,
      Method2Step5Data: "",
      Method2Step5TimeMinutes: undefined,
      Method3: "",
      Method3TotalTime: undefined,
      Method3Notes: "",
      Method3Step1Data: "",
      Method3Step1TimeMinutes: undefined,
      Method3Step2Data: "",
      Method3Step2TimeMinutes: undefined,
      Method3Step3Data: "",
      Method3Step3TimeMinutes: undefined,
      Method3Step4Data: "",
      Method3Step4TimeMinutes: undefined,
      Method3Step5Data: "",
      Method3Step5TimeMinutes: undefined,
      Method4: "",
      Method4TotalTime: undefined,
      Method4Notes: "",
      Method4Step1Data: "",
      Method4Step1TimeMinutes: undefined,
      Method4Step2Data: "",
      Method4Step2TimeMinutes: undefined,
      Method4Step3Data: "",
      Method4Step3TimeMinutes: undefined,
      Method4Step4Data: "",
      Method4Step4TimeMinutes: undefined,
      Method4Step5Data: "",
      Method4Step5TimeMinutes: undefined
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المصلحة؟")) return

    try {
      setLoading(true)
      await deleteDoc(doc(db, "DefGeo_Places", id))
      notify.success("تم حذف المصلحة بنجاح")
      await fetchPlaces()
      onDataChanged()
    } catch (error) {
      console.error("Error deleting place:", error)
      notify.error("حدث خطأ أثناء حذف المصلحة")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    handleCancel()
    onOpenChange(false)
  }

  // Helper functions to get names
  const getGovernmentName = (idGovernorate: number) => {
    const government = governments.find(gov => gov.id === idGovernorate.toString())
    return government ? government.Name : "غير محدد"
  }

  const getCityName = (idCity: number) => {
    const city = allCities.find(city => city.id === idCity.toString())
    return city ? city.Name : "غير محدد"
  }

  const getVillageName = (idVillage: number) => {
    const village = allVillages.find(village => village.id === idVillage.toString())
    return village ? village.Name : "غير محدد"
  }

  const getAreaName = (idArea: number) => {
    const area = allAreas.find(area => area.id === idArea.toString())
    return area ? area.Name : "غير محدد"
  }

  const getSelectedAreaName = () => {
    if (selectedAreaId) {
      const area = allAreas.find(area => area.id === selectedAreaId)
      return area ? area.Name : ""
    }
    return ""
  }

  // Function to get full address hierarchy for a place
  const getFullHierarchy = (place: Place) => {
    if (!place.IDAreas) return "غير محدد"
    
    const area = allAreas.find(area => area.id === place.IDAreas?.toString())
    if (!area) return "غير محدد"
    
    const village = allVillages.find(village => village.id === area.IDVillage.toString())
    const city = allCities.find(city => city.id === area.IDCity.toString())
    const government = governments.find(gov => gov.id === city?.IDGovernorate.toString())
    
    return `${government?.Name || "غير محدد"} - ${city?.Name || "غير محدد"} - ${village?.Name || "غير محدد"} - ${area.Name}`
  }

  return (
         <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="max-w-[85vw] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            إدارة المصالح
            {selectedAreaId && (
              <span className="text-blue-600 mr-2">
                - {getFullHierarchyForTitle()}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            إضافة وتعديل وحذف المصالح
            {selectedAreaId && " للحي المختار"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form for Add/Edit */}
          {(isAdding || editingId) && (
            <Card>
              <CardHeader>
                <CardTitle>{isAdding ? "إضافة مصلحة جديدة" : "تعديل المصلحة"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                    <TabsTrigger value="location">الموقع والعنوان</TabsTrigger>
                    <TabsTrigger value="access">طريقة الوصول</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    {/* Image Upload Section */}
                    <div className="space-y-2">
                      <Label>صورة المصلحة</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                          {formData.ImageLink ? (
                            <img 
                              src={formData.ImageLink} 
                              alt="صورة المصلحة" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Camera className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file)
                              }
                            }}
                            className="hidden"
                            id="image-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('image-upload')?.click()}
                            disabled={imageUploading}
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {imageUploading ? "جارٍ الرفع..." : "اختيار صورة"}
                          </Button>
                          {formData.ImageLink && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setFormData({ ...formData, ImageLink: "", ImageName: "" })}
                              className="flex items-center gap-2 text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                              حذف الصورة
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم *</Label>
                        <Input
                          id="name"
                          value={formData.Name}
                          onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                          placeholder="أدخل اسم المصلحة"
                        />
                      </div>
                                            <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="placeType">نوع المصلحة</Label>
                          <button
                            onClick={() => setPlaceTypesDialogOpen(true)}
                            className="w-6 h-6 bg-green-500 hover:bg-green-600 rounded flex items-center justify-center transition-colors cursor-pointer"
                            title="إدارة أنواع المصالح"
                            type="button"
                          >
                            <Settings className="w-3 h-3 text-white" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="placeType"
                            placeholder="اختر نوع المصلحة..."
                            value={formData.PlaceType}
                            readOnly
                            className="cursor-pointer text-right"
                            onClick={() => setPlaceTypeSelectorOpen(true)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPlaceTypeSelectorOpen(true)}
                            className="shrink-0"
                          >
                            اختيار
                          </Button>
                          {formData.PlaceType && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setFormData({ ...formData, PlaceType: "" })}
                              className="shrink-0 text-red-600 hover:text-red-700"
                            >
                              مسح
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">الهاتف</Label>
                        <Input
                          id="phone"
                          value={formData.Phone}
                          onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                          placeholder="أدخل رقم الهاتف"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">الحي *</Label>
                        <Select
                          value={formData.IDAreas}
                          onValueChange={(value) => setFormData({ ...formData, IDAreas: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحي" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas.map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.Name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
                        value={formData.Notes}
                        onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                        placeholder="أدخل أي ملاحظات إضافية"
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="space-y-4">
                    {/* Location Controls */}
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                      <Button
                        type="button"
                        onClick={getCurrentLocation}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        الحصول على الموقع الحالي
                      </Button>
                      {formData.LocationLink && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => window.open(formData.LocationLink, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          عرض على الخريطة
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">خط العرض</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          value={formData.Latitude || ""}
                          onChange={(e) => setFormData({ ...formData, Latitude: parseFloat(e.target.value) || undefined })}
                          placeholder="مثال: 30.0444"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">خط الطول</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          value={formData.Longitude || ""}
                          onChange={(e) => setFormData({ ...formData, Longitude: parseFloat(e.target.value) || undefined })}
                          placeholder="مثال: 31.2357"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="locationLink">رابط الموقع</Label>
                      <Input
                        id="locationLink"
                        value={formData.LocationLink}
                        onChange={(e) => setFormData({ ...formData, LocationLink: e.target.value })}
                        placeholder="رابط خريطة جوجل"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">العنوان (من خريطة جوجل)</Label>
                      <Textarea
                        id="address"
                        value={formData.Address}
                        onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                        placeholder="اسم العنوان المحدد في خريطة جوجل"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullAddress">العنوان الكامل</Label>
                      <div className="flex gap-2">
                        <Textarea
                          id="fullAddress"
                          value={formData.FullAddressText}
                          onChange={(e) => setFormData({ ...formData, FullAddressText: e.target.value })}
                          placeholder="العنوان الكامل (يتم تجميعه تلقائياً)"
                          rows={3}
                          className="flex-1"
                        />
                        {editingId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const autoAddress = buildHierarchyAddress()
                              if (autoAddress) {
                                setFormData(prev => ({ ...prev, FullAddressText: autoAddress }))
                                notify.success("تم تحديث العنوان الكامل")
                              }
                            }}
                            className="h-fit"
                          >
                            تحديث
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        ✨ يتم تجميع العنوان تلقائياً من: المحافظة - المدينة - القرية/المنطقة - الحي
                        <br />
                        📝 يمكنك إضافة تفاصيل أكثر مثل: رقم المبنى، اسم الشارع، معالم مميزة، إلخ
                        {editingId && (
                          <>
                            <br />
                            🔄 اضغط "تحديث" لإعادة تجميع العنوان من البيانات المختارة
                          </>
                        )}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="access" className="space-y-4">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">طرق الوصول للمصلحة</h3>
                        <p className="text-sm text-gray-600">أضف طرق مختلفة للوصول للمصلحة مع الخطوات التفصيلية</p>
                      </div>

                      {/* Methods Tabs */}
                      <Tabs defaultValue="method1" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="method1" className="text-sm">طريقة 1</TabsTrigger>
                          <TabsTrigger value="method2" className="text-sm">طريقة 2</TabsTrigger>
                          <TabsTrigger value="method3" className="text-sm">طريقة 3</TabsTrigger>
                          <TabsTrigger value="method4" className="text-sm">طريقة 4</TabsTrigger>
                        </TabsList>

                        {/* Method 1 */}
                        <TabsContent value="method1" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="method1">اسم الطريقة الأولى</Label>
                            <Textarea
                              id="method1"
                              value={formData.Method1 || ""}
                              onChange={(e) => setFormData({ ...formData, Method1: e.target.value })}
                              placeholder="مثال: بالمترو والأتوبيس"
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="method1TotalTime">إجمالي الوقت (بالدقائق)</Label>
                              <Input
                                id="method1TotalTime"
                                type="number"
                                value={formData.Method1TotalTime || ""}
                                onChange={(e) => setFormData({ ...formData, Method1TotalTime: parseInt(e.target.value) || undefined })}
                                placeholder="45"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="method1Notes">ملاحظات عامة</Label>
                              <Textarea
                                id="method1Notes"
                                value={formData.Method1Notes || ""}
                                onChange={(e) => setFormData({ ...formData, Method1Notes: e.target.value })}
                                placeholder="ملاحظات مهمة"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-700 border-b pb-2">خطوات الوصول:</h4>
                            
                            {/* Steps for Method 1 */}
                            {[1, 2, 3, 4, 5].map((stepNum) => (
                              <div key={stepNum} className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-1 text-center">
                                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                    {stepNum}
                                  </div>
                                </div>
                                <div className="col-span-8">
                                  <Label className="text-sm">خطوة {stepNum}</Label>
                                  <Input
                                    value={formData[`Method1Step${stepNum}Data` as keyof typeof formData] as string || ""}
                                    onChange={(e) => setFormData({ 
                                      ...formData, 
                                      [`Method1Step${stepNum}Data`]: e.target.value 
                                    })}
                                    placeholder={`وصف الخطوة ${stepNum}`}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Label className="text-sm">الوقت (دقائق)</Label>
                                  <Input
                                    type="number"
                                    value={formData[`Method1Step${stepNum}TimeMinutes` as keyof typeof formData] as number || ""}
                                    onChange={(e) => setFormData({ 
                                      ...formData, 
                                      [`Method1Step${stepNum}TimeMinutes`]: parseInt(e.target.value) || undefined 
                                    })}
                                    placeholder="10"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        {/* Method 2 */}
                        <TabsContent value="method2" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="method2">اسم الطريقة الثانية</Label>
                            <Textarea
                              id="method2"
                              value={formData.Method2 || ""}
                              onChange={(e) => setFormData({ ...formData, Method2: e.target.value })}
                              placeholder="مثال: بالتاكسي أو الأوبر"
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="method2TotalTime">إجمالي الوقت (بالدقائق)</Label>
                              <Input
                                id="method2TotalTime"
                                type="number"
                                value={formData.Method2TotalTime || ""}
                                onChange={(e) => setFormData({ ...formData, Method2TotalTime: parseInt(e.target.value) || undefined })}
                                placeholder="25"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="method2Notes">ملاحظات عامة</Label>
                              <Textarea
                                id="method2Notes"
                                value={formData.Method2Notes || ""}
                                onChange={(e) => setFormData({ ...formData, Method2Notes: e.target.value })}
                                placeholder="ملاحظات مهمة"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-700 border-b pb-2">خطوات الوصول:</h4>
                            
                            {/* Steps for Method 2 */}
                            {[1, 2, 3, 4, 5].map((stepNum) => (
                              <div key={stepNum} className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-1 text-center">
                                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                                    {stepNum}
                                  </div>
                                </div>
                                <div className="col-span-8">
                                  <Label className="text-sm">خطوة {stepNum}</Label>
                                  <Input
                                    value={formData[`Method2Step${stepNum}Data` as keyof typeof formData] as string || ""}
                                    onChange={(e) => setFormData({ 
                                      ...formData, 
                                      [`Method2Step${stepNum}Data`]: e.target.value 
                                    })}
                                    placeholder={`وصف الخطوة ${stepNum}`}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Label className="text-sm">الوقت (دقائق)</Label>
                                  <Input
                                    type="number"
                                    value={formData[`Method2Step${stepNum}TimeMinutes` as keyof typeof formData] as number || ""}
                                    onChange={(e) => setFormData({ 
                                      ...formData, 
                                      [`Method2Step${stepNum}TimeMinutes`]: parseInt(e.target.value) || undefined 
                                    })}
                                    placeholder="5"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        {/* Method 3 */}
                        <TabsContent value="method3" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="method3">اسم الطريقة الثالثة</Label>
                            <Textarea
                              id="method3"
                              value={formData.Method3 || ""}
                              onChange={(e) => setFormData({ ...formData, Method3: e.target.value })}
                              placeholder="مثال: بالسيارة الخاصة"
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="method3TotalTime">إجمالي الوقت (بالدقائق)</Label>
                              <Input
                                id="method3TotalTime"
                                type="number"
                                value={formData.Method3TotalTime || ""}
                                onChange={(e) => setFormData({ ...formData, Method3TotalTime: parseInt(e.target.value) || undefined })}
                                placeholder="20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="method3Notes">ملاحظات عامة</Label>
                              <Textarea
                                id="method3Notes"
                                value={formData.Method3Notes || ""}
                                onChange={(e) => setFormData({ ...formData, Method3Notes: e.target.value })}
                                placeholder="ملاحظات مهمة"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-700 border-b pb-2">خطوات الوصول:</h4>
                            
                            {/* Steps for Method 3 */}
                            {[1, 2, 3, 4, 5].map((stepNum) => (
                              <div key={stepNum} className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-1 text-center">
                                  <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium">
                                    {stepNum}
                                  </div>
                                </div>
                                <div className="col-span-8">
                                  <Label className="text-sm">خطوة {stepNum}</Label>
                                  <Input
                                    value={formData[`Method3Step${stepNum}Data` as keyof typeof formData] as string || ""}
                                    onChange={(e) => setFormData({ 
                                      ...formData, 
                                      [`Method3Step${stepNum}Data`]: e.target.value 
                                    })}
                                    placeholder={`وصف الخطوة ${stepNum}`}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Label className="text-sm">الوقت (دقائق)</Label>
                                  <Input
                                    type="number"
                                    value={formData[`Method3Step${stepNum}TimeMinutes` as keyof typeof formData] as number || ""}
                                    onChange={(e) => setFormData({ 
                                      ...formData, 
                                      [`Method3Step${stepNum}TimeMinutes`]: parseInt(e.target.value) || undefined 
                                    })}
                                    placeholder="3"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        {/* Method 4 */}
                        <TabsContent value="method4" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="method4">اسم الطريقة الرابعة</Label>
                            <Textarea
                              id="method4"
                              value={formData.Method4 || ""}
                              onChange={(e) => setFormData({ ...formData, Method4: e.target.value })}
                              placeholder="مثال: بالدراجة أو المشي"
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="method4TotalTime">إجمالي الوقت (بالدقائق)</Label>
                              <Input
                                id="method4TotalTime"
                                type="number"
                                value={formData.Method4TotalTime || ""}
                                onChange={(e) => setFormData({ ...formData, Method4TotalTime: parseInt(e.target.value) || undefined })}
                                placeholder="30"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="method4Notes">ملاحظات عامة</Label>
                              <Textarea
                                id="method4Notes"
                                value={formData.Method4Notes || ""}
                                onChange={(e) => setFormData({ ...formData, Method4Notes: e.target.value })}
                                placeholder="ملاحظات مهمة"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-700 border-b pb-2">خطوات الوصول:</h4>
                            
                            {/* Steps for Method 4 */}
                            {[1, 2, 3, 4, 5].map((stepNum) => (
                              <div key={stepNum} className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-1 text-center">
                                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                                    {stepNum}
                                  </div>
                                </div>
                                <div className="col-span-8">
                                  <Label className="text-sm">خطوة {stepNum}</Label>
                                  <Input
                                    value={formData[`Method4Step${stepNum}Data` as keyof typeof formData] as string || ""}
                                    onChange={(e) => setFormData({ 
                                      ...formData, 
                                      [`Method4Step${stepNum}Data`]: e.target.value 
                                    })}
                                    placeholder={`وصف الخطوة ${stepNum}`}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Label className="text-sm">الوقت (دقائق)</Label>
                                  <Input
                                    type="number"
                                    value={formData[`Method4Step${stepNum}TimeMinutes` as keyof typeof formData] as number || ""}
                                    onChange={(e) => setFormData({ 
                                      ...formData, 
                                      [`Method4Step${stepNum}TimeMinutes`]: parseInt(e.target.value) || undefined 
                                    })}
                                    placeholder="6"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </TabsContent>

                </Tabs>
                
                <div className="flex gap-2 mt-6">
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 ml-2" />
                    حفظ
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 ml-2" />
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Button */}
          {!isAdding && !editingId && (
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مصلحة جديدة
            </Button>
          )}

          {/* Places Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة المصالح</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>الموقع الكامل</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {places.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          لا توجد مصالح
                        </TableCell>
                      </TableRow>
                    ) : (
                      places.map((place) => (
                        <TableRow key={place.id}>
                          <TableCell className="font-medium">{place.Name}</TableCell>
                          <TableCell>{place.PlaceType || "-"}</TableCell>
                          <TableCell>{place.Phone || "-"}</TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm text-gray-600 truncate" title={getFullHierarchy(place)}>
                              {getFullHierarchy(place)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(place)}
                                disabled={loading || isAdding || editingId !== null}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(place.id)}
                                disabled={loading || isAdding || editingId !== null}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Place Types Management Dialog */}
        <PlaceTypesDialog
          open={placeTypesDialogOpen}
          onOpenChange={setPlaceTypesDialogOpen}
          onDataChanged={handlePlaceTypesDataChanged}
        />

        {/* Place Type Selector Dialog */}
        <PlaceTypeSelectorDialog
          open={placeTypeSelectorOpen}
          onOpenChange={setPlaceTypeSelectorOpen}
          selectedValue={formData.PlaceType}
          onValueSelect={handlePlaceTypeSelect}
        />
      </DialogContent>
    </Dialog>
  )
}
