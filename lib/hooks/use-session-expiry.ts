"use client";

import { useEffect, useRef } from "react";

/**
 * Hook لإدارة انتهاء صلاحية الجلسة التلقائية
 * يتحقق من انتهاء الصلاحية كل دقيقة ويقوم بتنظيف الجلسة المنتهية الصلاحية
 */
export function useSessionExpiry() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // دالة للتحقق من انتهاء الصلاحية
    const checkSessionExpiry = () => {
      const sessionData = localStorage.getItem("client_session");
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);

          if (session.expiresAt) {
            const now = new Date().getTime();
            const expiresAt = new Date(session.expiresAt).getTime();

            if (now > expiresAt) {
              // انتهت صلاحية الجلسة
              console.log("Session expired, cleaning up...");

              // إزالة الجلسة من localStorage
              localStorage.removeItem("client_session");
              localStorage.removeItem("client_username");
              localStorage.removeItem("client_remember_me");

              // إرسال إشعار لجميع التابات
              window.dispatchEvent(new Event("sessionExpired"));

              return true;
            }
          }
        } catch (error) {
          console.error("Error checking session expiry:", error);
          // إزالة الجلسة التالفة
          localStorage.removeItem("client_session");
          localStorage.removeItem("client_username");
          localStorage.removeItem("client_remember_me");
        }
      }
      return false;
    };

    // التحقق الأولي
    checkSessionExpiry();

    // إعداد فحص دوري كل دقيقة
    intervalRef.current = setInterval(checkSessionExpiry, 60000); // كل 60 ثانية

    // تنظيف عند إلغاء التحميل
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // دالة لتحديث انتهاء الصلاحية عند النشاط
  const refreshExpiry = () => {
    const sessionData = localStorage.getItem("client_session");
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + 24); // 24 ساعة من الآن

        const updatedSession = {
          ...session,
          expiresAt: newExpiresAt.toISOString(),
        };

        localStorage.setItem("client_session", JSON.stringify(updatedSession));
        window.dispatchEvent(new Event("localStorageChange"));

        console.log("Session expiry refreshed");
      } catch (error) {
        console.error("Error refreshing session expiry:", error);
      }
    }
  };

  // دالة للتحقق من انتهاء الصلاحية يدوياً
  const isSessionExpired = () => {
    const sessionData = localStorage.getItem("client_session");
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);

        if (session.expiresAt) {
          const now = new Date().getTime();
          const expiresAt = new Date(session.expiresAt).getTime();
          return now > expiresAt;
        }
      } catch (error) {
        console.error("Error checking session expiry:", error);
      }
    }
    return true;
  };

  return {
    refreshExpiry,
    isSessionExpired,
  };
}


