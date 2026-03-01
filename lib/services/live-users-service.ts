import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'

const LIVE_USERS_COLLECTION = 'LiveUsers'

export interface LiveUser {
  id: string
  sessionId: string
  userAgent: string
  ipAddress?: string
  pageUrl: string
  lastActivity: any
  isActive: boolean
  loginStatus: 'anonymous' | 'logged_in'
  clientId?: number
  username?: string
  name?: string
}

export class LiveUsersService {
  // تهيئة الجلسة للمستخدم
  static initializeSession(): string {
    // إنشاء معرف فريد لكل متصفح/تبويب
    const browserId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const sessionId = `session_${browserId}`
    
    // حفظ معرف الجلسة في localStorage للتعرف عليه لاحقاً
    localStorage.setItem('live_user_session_id', sessionId)
    
    return sessionId
  }

    // تسجيل مستخدم نشط جديد
  static async registerLiveUser(userData?: {
    clientId?: number
    username?: string
    name?: string
  }): Promise<void> {
    try {
      // التحقق من وجود جلسة موجودة أولاً
      let sessionId = this.getSessionId()
      
      // إذا لم تكن هناك جلسة موجودة، قم بإنشاء واحدة جديدة
      if (!sessionId) {
        sessionId = this.initializeSession()
      }
      
      // إنشاء معرف فريد لكل مستخدم في كل متصفح
      const userId = `${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      const userRef = doc(db, LIVE_USERS_COLLECTION, userId)
      
      const user: LiveUser = {
        id: userId,
        sessionId: sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        lastActivity: serverTimestamp(),
        isActive: true,
        loginStatus: userData ? 'logged_in' : 'anonymous',
        ...(userData?.clientId && { clientId: userData.clientId }),
        ...(userData?.username && { username: userData.username }),
        ...(userData?.name && { name: userData.name })
      }
      
      await setDoc(userRef, user)
    } catch (error) {
      console.error('Error registering live user:', error)
    }
  }

  // تحديث نشاط المستخدم
  static async updateUserActivity(): Promise<void> {
    try {
      const sessionId = this.getSessionId()
      if (!sessionId) return

      const usersRef = collection(db, LIVE_USERS_COLLECTION)
      const q = query(
        usersRef,
        where('sessionId', '==', sessionId),
        where('isActive', '==', true)
      )
      
      const querySnapshot = await getDocs(q)
      
      // تحديث جميع المستخدمين في نفس الجلسة (نفس المتصفح)
      const updatePromises = querySnapshot.docs.map(doc => 
        setDoc(doc.ref, {
          lastActivity: serverTimestamp(),
          pageUrl: typeof window !== 'undefined' ? window.location.href : ''
        }, { merge: true })
      )
      
      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error updating user activity:', error)
    }
  }

  // إلغاء تسجيل المستخدم (عند إغلاق المتصفح أو تغيير الصفحة)
  static async unregisterLiveUser(): Promise<void> {
    try {
      const sessionId = this.getSessionId()
      if (!sessionId) return

      const usersRef = collection(db, LIVE_USERS_COLLECTION)
      const q = query(
        usersRef,
        where('sessionId', '==', sessionId),
        where('isActive', '==', true)
      )
      
      const querySnapshot = await getDocs(q)
      
      // حذف جميع المستخدمين في نفس الجلسة
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      // حذف معرف الجلسة من localStorage
      localStorage.removeItem('live_user_session_id')
    } catch (error) {
      console.error('Error unregistering live user:', error)
    }
  }

    // تحديث حالة تسجيل الدخول للمستخدم
  static async updateLoginStatus(userData: {
    clientId: number
    username: string
    name: string
  }): Promise<void> {
    try {
      const sessionId = this.getSessionId()
      if (!sessionId) return

      const usersRef = collection(db, LIVE_USERS_COLLECTION)
      const q = query(
        usersRef,
        where('sessionId', '==', sessionId),
        where('isActive', '==', true)
      )
      
      const querySnapshot = await getDocs(q)
      
      // تحديث جميع المستخدمين في نفس الجلسة
      const updatePromises = querySnapshot.docs.map(doc => {
        const updateData: Partial<LiveUser> = {
          loginStatus: 'logged_in',
          lastActivity: serverTimestamp()
        }
        
        if (userData.clientId) updateData.clientId = userData.clientId
        if (userData.username) updateData.username = userData.username
        if (userData.name) updateData.name = userData.name
        
        return setDoc(doc.ref, updateData, { merge: true })
      })
      
      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error updating login status:', error)
    }
  }

  // إعادة تعيين المستخدم إلى حالة مجهول
  static async resetToAnonymous(): Promise<void> {
    try {
      const sessionId = this.getSessionId()
      if (!sessionId) return

      const usersRef = collection(db, LIVE_USERS_COLLECTION)
      const q = query(
        usersRef,
        where('sessionId', '==', sessionId),
        where('isActive', '==', true)
      )
      
      const querySnapshot = await getDocs(q)
      
      // إعادة تعيين جميع المستخدمين في نفس الجلسة
      const updatePromises = querySnapshot.docs.map(doc => 
        setDoc(doc.ref, {
          loginStatus: 'anonymous',
          lastActivity: serverTimestamp()
        }, { merge: true })
      )
      
      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error resetting to anonymous:', error)
    }
  }

  // جلب عدد المستخدمين النشطين
  static async getLiveUsersCount(): Promise<number> {
    try {
      const usersRef = collection(db, LIVE_USERS_COLLECTION)
      const q = query(usersRef, where('isActive', '==', true))
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.size
    } catch (error) {
      console.error('Error getting live users count:', error)
      return 0
    }
  }

  // جلب جميع المستخدمين النشطين
  static async getLiveUsers(): Promise<LiveUser[]> {
    try {
      const usersRef = collection(db, LIVE_USERS_COLLECTION)
      const q = query(usersRef, where('isActive', '==', true))
      
      const querySnapshot = await getDocs(q)
      const users: LiveUser[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          id: data.id,
          sessionId: data.sessionId,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          pageUrl: data.pageUrl,
          lastActivity: data.lastActivity,
          isActive: data.isActive,
          loginStatus: data.loginStatus,
          clientId: data.clientId,
          username: data.username,
          name: data.name
        })
      })
      
      return users
    } catch (error) {
      console.error('Error getting live users:', error)
      return []
    }
  }

  // جلب إحصائيات مفصلة عن المستخدمين النشطين
  static async getLiveUsersStats(): Promise<{
    totalUsers: number
    loggedInUsers: number
    anonymousUsers: number
    uniqueSessions: number
  }> {
    try {
      const users = await this.getLiveUsers()
      
      // حساب عدد الجلسات الفريدة (عدد المتصفحات المختلفة)
      const uniqueSessions = new Set(users.map(user => user.sessionId)).size
      
      // حساب المستخدمين المسجلين دخول والمجهولين
      const loggedInUsers = users.filter(user => user.loginStatus === 'logged_in').length
      const anonymousUsers = users.filter(user => user.loginStatus === 'anonymous').length
      
      return {
        totalUsers: users.length,
        loggedInUsers,
        anonymousUsers,
        uniqueSessions
      }
    } catch (error) {
      console.error('Error getting live users stats:', error)
      return {
        totalUsers: 0,
        loggedInUsers: 0,
        anonymousUsers: 0,
        uniqueSessions: 0
      }
    }
  }

  // تنظيف المستخدمين غير النشطين (أكثر من 5 دقائق)
  static async cleanupInactiveUsers(maxInactiveMinutes: number = 5): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - (maxInactiveMinutes * 60 * 1000))
      const usersRef = collection(db, LIVE_USERS_COLLECTION)
      const q = query(usersRef, where('isActive', '==', true))
      
      const querySnapshot = await getDocs(q)
      
      const deletePromises = querySnapshot.docs
        .filter(doc => {
          const data = doc.data()
          const lastActivity = data.lastActivity?.toDate?.() || new Date(data.lastActivity)
          return lastActivity < cutoffTime
        })
        .map(doc => deleteDoc(doc.ref))
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises)
        console.log(`Cleaned up ${deletePromises.length} inactive users`)
      }
    } catch (error) {
      console.error('Error cleaning up inactive users:', error)
    }
  }

  // الاستماع للتغييرات في المستخدمين النشطين
  static subscribeToLiveUsers(
    callback: (users: LiveUser[]) => void
  ): () => void {
    const usersRef = collection(db, LIVE_USERS_COLLECTION)
    const q = query(usersRef, where('isActive', '==', true))
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users: LiveUser[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          id: data.id,
          sessionId: data.sessionId,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          pageUrl: data.pageUrl,
          lastActivity: data.lastActivity,
          isActive: data.isActive,
          loginStatus: data.loginStatus,
          clientId: data.clientId,
          username: data.username,
          name: data.name
        })
      })
      
      callback(users)
    })
    
    return unsubscribe
  }

  // الحصول على معرف الجلسة
  private static getSessionId(): string | null {
    // محاولة استرجاع من localStorage
    const savedSessionId = localStorage.getItem('live_user_session_id')
    return savedSessionId || null
  }

  // بدء مراقبة النشاط
  static startActivityMonitoring(): void {
    // تنظيف الجلسات القديمة عند بدء التشغيل
    this.cleanupOldSessions()
    
    // تحديث النشاط كل 30 ثانية
    const activityInterval = setInterval(async () => {
      await this.updateUserActivity()
    }, 30000)

    // تنظيف المستخدمين غير النشطين كل دقيقة
    const cleanupInterval = setInterval(async () => {
      await this.cleanupInactiveUsers()
    }, 60000)

    // حفظ المراجع للتنظيف لاحقاً
    window.addEventListener('beforeunload', () => {
      this.unregisterLiveUser()
    })

    // تنظيف عند تغيير الصفحة
    window.addEventListener('pagehide', () => {
      this.unregisterLiveUser()
    })

    // إضافة مراجع للتنظيف
    if (typeof window !== 'undefined') {
      (window as any).__liveUsersCleanup = () => {
        clearInterval(activityInterval)
        clearInterval(cleanupInterval)
      }
    }
  }

  // تنظيف الجلسات القديمة
  private static cleanupOldSessions(): void {
    try {
      // حذف الجلسات القديمة من localStorage (أكثر من ساعة)
      const currentTime = Date.now()
      const oneHourAgo = currentTime - (60 * 60 * 1000)
      
      // حذف الجلسة الحالية إذا كانت قديمة
      const sessionId = this.getSessionId()
      if (sessionId) {
        const sessionTime = parseInt(sessionId.split('_')[1])
        if (sessionTime && sessionTime < oneHourAgo) {
          localStorage.removeItem('live_user_session_id')
        }
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error)
    }
  }

  // إيقاف مراقبة النشاط
  static stopActivityMonitoring(): void {
    if (typeof window !== 'undefined' && (window as any).__liveUsersCleanup) {
      (window as any).__liveUsersCleanup()
    }
  }

  // دالة اختبار للنظام (للتطوير فقط)
  static async debugLiveUsers(): Promise<void> {
    try {
      const stats = await this.getLiveUsersStats()
      const users = await this.getLiveUsers()
      const currentSessionId = this.getSessionId()
      
      console.log('=== Live Users Debug Info ===')
      console.log('Current Session ID:', currentSessionId)
      console.log('Stats:', stats)
      console.log('All Users:', users)
      console.log('============================')
    } catch (error) {
      console.error('Error in debug:', error)
    }
  }
}
