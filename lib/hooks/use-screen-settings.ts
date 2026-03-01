import { useState, useEffect, useCallback } from 'react'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ScreenSettings } from '@/lib/types/screen-settings'
import { notify } from '@/lib/notifications'

// تأخير الحفظ لتحسين الأداء
const SAVE_DELAY = 500 // بالمللي ثانية

export const useScreenSettings = (route: string) => {
  const [settings, setSettings] = useState<ScreenSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, 'App_ScreenSettings', route)
        const settingsDoc = await getDoc(settingsRef)
        
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as ScreenSettings)
        } else {
          // إنشاء إعدادات افتراضية
          const defaultSettings: ScreenSettings = {
            ID: Date.now(),
            ScreenNameAr: route,
            ScreenNameEn: route,
            ItemsPerPage: 10,
            Route: route
          }
          await setDoc(settingsRef, defaultSettings)
          setSettings(defaultSettings)
        }
      } catch (error) {
        console.error('Error loading screen settings:', error)
        notify.error('حدث خطأ أثناء تحميل إعدادات الشاشة')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()

    // تنظيف المؤقت عند إلغاء تحميل المكون
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [route])

  const saveToFirestore = useCallback(async (updatedSettings: ScreenSettings) => {
    try {
      const settingsRef = doc(db, 'App_ScreenSettings', route)
      // لا ترسل قيم undefined إلى Firestore
      const sanitized: Record<string, unknown> = {}
      Object.entries(updatedSettings).forEach(([key, value]) => {
        if (value !== undefined) {
          sanitized[key] = value
        }
      })
      await setDoc(settingsRef, sanitized as ScreenSettings)
      return true
    } catch (error) {
      console.error('Error saving screen settings:', error)
      notify.error('حدث خطأ أثناء حفظ إعدادات الشاشة')
      return false
    }
  }, [route])

  const updateSettings = async (newSettings: Partial<ScreenSettings>) => {
    if (!settings) return false

    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    // إلغاء المؤقت السابق إذا وجد
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    // إنشاء مؤقت جديد للحفظ
    const timeoutId = setTimeout(() => {
      saveToFirestore(updatedSettings)
    }, SAVE_DELAY)

    setSaveTimeout(timeoutId)
    return true
  }

  const updateLastSelectedItem = async (itemId: number | null) => {
    // حفظ العنصر المحدد مباشرة بدون تأخير
    return updateSettings({ LastSelectedItem: itemId === null ? null : itemId })
  }

  const updateItemsPerPage = async (count: number) => {
    // تأخير حفظ عدد العناصر في الصفحة
    return updateSettings({ ItemsPerPage: count })
  }

  return {
    settings,
    loading,
    updateSettings,
    updateLastSelectedItem,
    updateItemsPerPage
  }
} 