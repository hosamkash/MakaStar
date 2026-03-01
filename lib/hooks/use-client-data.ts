'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useClientSession } from './use-client-session'

export interface ClientData {
  code: string
  name: string
  mobile: string
  phone: string
  username: string
  email: string
  notes: string
  createdDate: string
  createdTime: string
  personalSponsorID: string
  personalSponsorName: string
  personalSponsorCode: string
  personalSponsorMobile: string
}

export interface LocationData {
  latitude: string
  longitude: string
  address: string
}

export function useClientData() {
  const { session: clientSession } = useClientSession()
  const [clientData, setClientData] = useState<ClientData>({
    code: '',
    name: '',
    mobile: '',
    phone: '',
    username: '',
    email: '',
    notes: '',
    createdDate: '',
    createdTime: '',
    personalSponsorID: '',
    personalSponsorName: '',
    personalSponsorCode: '',
    personalSponsorMobile: ''
  })
  
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: '',
    longitude: '',
    address: ''
  })
  
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  // Load client data when session is available
  useEffect(() => {
    if (clientSession) {
      loadClientData()
      loadOrders()
    }
  }, [clientSession])

  // تحديث البيانات كل 30 ثانية
  useEffect(() => {
    if (!clientSession) return

    const interval = setInterval(() => {
      loadOrders() // تحديث الطلبات فقط كل 30 ثانية
    }, 30000)

    return () => clearInterval(interval)
  }, [clientSession])

  // إضافة دالة لتحديث البيانات يدوياً
  const refreshData = async () => {
    if (clientSession) {
      await loadClientData()
      await loadOrders()
    }
  }

  const loadClientData = async () => {
    try {
      setIsLoadingData(true)
      const clientsRef = collection(db, "Dealing_Clients")
      const q = query(
        clientsRef,
        where("UserName", "==", clientSession?.username),
        where("IsActive", "==", true)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0].data()
        
        // تحميل بيانات الراعي الشخصي إذا كان موجوداً
        let personalSponsorName = ''
        let personalSponsorCode = ''
        let personalSponsorMobile = ''
        if (clientDoc.PersonalSponsorID) {
          try {
            const employeesRef = collection(db, "Dealing_Employees")
            const empQuery = query(employeesRef, where("ID", "==", clientDoc.PersonalSponsorID))
            const empSnapshot = await getDocs(empQuery)
            if (!empSnapshot.empty) {
              const empData = empSnapshot.docs[0].data()
              personalSponsorName = empData.Name || ''
              personalSponsorCode = empData.Code?.toString() || ''
              personalSponsorMobile = empData.Mobile || ''
            }
          } catch (error) {
            console.error('Error loading personal sponsor:', error)
          }
        }
        
        setClientData({
          code: clientDoc.Code?.toString() || '',
          name: clientDoc.Name || '',
          mobile: clientDoc.Mobile || '',
          phone: clientDoc.Phone || '',
          username: clientDoc.UserName || '',
          email: clientDoc.EMail || '',
          notes: clientDoc.Note || '',
          createdDate: clientDoc.CreatedDate || '',
          createdTime: clientDoc.CreatedTime || '',
          personalSponsorID: clientDoc.PersonalSponsorID?.toString() || '',
          personalSponsorName: personalSponsorName,
          personalSponsorCode: personalSponsorCode,
          personalSponsorMobile: personalSponsorMobile
        })
        setLocationData({
          latitude: clientDoc.Latitude?.toString() || '',
          longitude: clientDoc.Longitude?.toString() || '',
          address: clientDoc.Address || ''
        })
      }
    } catch (error) {
      console.error('Error loading client data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true)
      const { OrdersService } = await import('@/lib/services/orders-service')
      const clientOrders = await OrdersService.getClientOrders(clientSession?.id || 0)
      setOrders(clientOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      // البحث عن العميل في Firebase
      const clientsRef = collection(db, "Dealing_Clients")
      const q = query(
        clientsRef,
        where("UserName", "==", clientSession?.username),
        where("IsActive", "==", true)
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        alert('لم يتم العثور على بيانات العميل')
        return
      }

      // تحديث البيانات في Firebase
      const clientDoc = querySnapshot.docs[0]
      const clientRef = doc(db, "Dealing_Clients", clientDoc.id)
      
      await updateDoc(clientRef, {
        Code: parseInt(clientData.code) || 1,
        Name: clientData.name,
        Mobile: clientData.mobile,
        Phone: clientData.phone,
        UserName: clientData.username,
        EMail: clientData.email,
        Address: locationData.address,
        Note: clientData.notes,
        Latitude: parseFloat(locationData.latitude) || 0,
        Longitude: parseFloat(locationData.longitude) || 0
      })

      alert('تم حفظ البيانات بنجاح')

    } catch (error) {
      console.error('Error saving data:', error)
      alert('حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى')
    }
  }

  const handleGetLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocationData({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: locationData.address // Keep existing address
          })
          alert('تم الحصول على الموقع بنجاح')
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('فشل في الحصول على الموقع. يرجى التأكد من السماح بالوصول للموقع')
        }
      )
    } else {
      alert('المتصفح لا يدعم تحديد الموقع')
    }
  }

  const handleClearLocation = () => {
    setLocationData({
      latitude: '',
      longitude: '',
      address: ''
    })
    alert('تم مسح بيانات الموقع')
  }

  const handleOpenMap = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${locationData.latitude},${locationData.longitude}`
    window.open(url, '_blank')
  }

  const handleGetAddressFromLocation = async () => {
    if (!locationData.latitude || !locationData.longitude) {
      alert('يرجى الحصول على الموقع أولاً')
      return
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${locationData.latitude},${locationData.longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`
      )
      const data = await response.json()
      
      if (data.results && data.results[0]) {
        const address = data.results[0].formatted_address
        setLocationData(prev => ({
          ...prev,
          address: address
        }))
        alert('تم جلب العنوان بنجاح')
      } else {
        alert('لم يتم العثور على عنوان لهذا الموقع')
      }
    } catch (error) {
      console.error('Error getting address:', error)
      alert('حدث خطأ أثناء جلب العنوان')
    }
  }

  return {
    clientData,
    setClientData,
    locationData,
    setLocationData,
    isLoadingData,
    orders,
    isLoadingOrders,
    handleSaveChanges,
    handleGetLocation,
    handleClearLocation,
    handleOpenMap,
    handleGetAddressFromLocation,
    loadClientData,
    loadOrders,
    refreshData
  }
}
