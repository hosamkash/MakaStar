"use client"

import { useState, useEffect } from "react"
import { LiveUsersService } from "@/lib/services/live-users-service"

export function useLiveUsers() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // تسجيل المستخدم النشط عند تحميل الصفحة
    const initializeLiveUser = async () => {
      await LiveUsersService.registerLiveUser()
      LiveUsersService.startActivityMonitoring()
      setIsInitialized(true)
    }

    initializeLiveUser()

    // تنظيف عند إغلاق الصفحة
    return () => {
      LiveUsersService.stopActivityMonitoring()
      LiveUsersService.unregisterLiveUser()
    }
  }, [])

  // تحديث حالة تسجيل الدخول
  const updateLoginStatus = async (userData: {
    clientId: number
    username: string
    name: string
  }) => {
    await LiveUsersService.updateLoginStatus(userData)
  }

  // جلب عدد المستخدمين النشطين
  const getLiveUsersCount = async (): Promise<number> => {
    return await LiveUsersService.getLiveUsersCount()
  }

  // جلب جميع المستخدمين النشطين
  const getLiveUsers = async () => {
    return await LiveUsersService.getLiveUsers()
  }

  // الاستماع للتغييرات في المستخدمين النشطين
  const subscribeToLiveUsers = (callback: (users: any[]) => void) => {
    return LiveUsersService.subscribeToLiveUsers(callback)
  }

  return {
    isInitialized,
    updateLoginStatus,
    getLiveUsersCount,
    getLiveUsers,
    subscribeToLiveUsers
  }
}
