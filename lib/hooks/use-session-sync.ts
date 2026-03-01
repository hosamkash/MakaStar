"use client";

import { useEffect } from "react";
import { useSessionExpiry } from "./use-session-expiry";

/**
 * Hook لإدارة مزامنة الجلسة عبر جميع التابات
 * يضمن أن تسجيل الدخول يبقى نشطاً في جميع التابات المفتوحة
 */
export function useSessionSync() {
  const { refreshExpiry, isSessionExpired } = useSessionExpiry();

  useEffect(() => {
    // دالة للتحقق من صحة الجلسة
    const validateSession = () => {
      if (isSessionExpired()) {
        // انتهت صلاحية الجلسة - إزالة الجلسة من جميع التابات
        localStorage.removeItem("client_session");
        localStorage.removeItem("client_username");
        localStorage.removeItem("client_remember_me");

        // إرسال إشعار لجميع التابات
        window.dispatchEvent(new Event("sessionExpired"));
        return false;
      }
      return true;
    };

    // دالة للتعامل مع تغييرات localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "client_session") {
        if (e.newValue === null) {
          // تم حذف الجلسة - إرسال إشعار تسجيل خروج
          window.dispatchEvent(new Event("sessionLoggedOut"));
        } else {
          // تم تحديث الجلسة - إرسال إشعار تسجيل دخول
          window.dispatchEvent(new Event("sessionLoggedIn"));
        }
      }
    };

    // دالة للتعامل مع التغييرات في نفس النافذة
    const handleLocalStorageChange = () => {
      validateSession();
    };

    // دالة للتعامل مع انتهاء صلاحية الجلسة
    const handleSessionExpired = () => {
      // يمكن إضافة منطق إضافي هنا مثل إعادة التوجيه لصفحة تسجيل الدخول
      console.log("Session expired - redirecting to login");
    };

    // دالة للتعامل مع تسجيل الخروج
    const handleSessionLoggedOut = () => {
      console.log("Session logged out");
    };

    // دالة للتعامل مع تسجيل الدخول
    const handleSessionLoggedIn = () => {
      console.log("Session logged in");
    };

    // التحقق الأولي من صحة الجلسة
    validateSession();

    // إضافة مستمعات الأحداث
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStorageChange", handleLocalStorageChange);
    window.addEventListener("sessionExpired", handleSessionExpired);
    window.addEventListener("sessionLoggedOut", handleSessionLoggedOut);
    window.addEventListener("sessionLoggedIn", handleSessionLoggedIn);

    // تنظيف المستمعات عند إلغاء التحميل
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleLocalStorageChange
      );
      window.removeEventListener("sessionExpired", handleSessionExpired);
      window.removeEventListener("sessionLoggedOut", handleSessionLoggedOut);
      window.removeEventListener("sessionLoggedIn", handleSessionLoggedIn);
    };
  }, []);

  return {
    refreshSessionExpiry: refreshExpiry,
  };
}
