"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LiveUsersService } from "@/lib/services/live-users-service";
import { useSessionSync } from "./use-session-sync";

interface ClientSession {
  id: number;
  username: string;
  name: string;
  email: string;
  mobile: string;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
  loginTime: string;
  expiresAt?: string; // إضافة انتهاء الصلاحية
}

export function useClientSession() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshSessionExpiry } = useSessionSync();

  const checkSession = () => {
    try {
      const sessionData = localStorage.getItem("client_session");
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData) as ClientSession;

        // التحقق من انتهاء الصلاحية
        if (parsedSession.expiresAt) {
          const now = new Date().getTime();
          const expiresAt = new Date(parsedSession.expiresAt).getTime();

          if (now > expiresAt) {
            // انتهت صلاحية الجلسة
            setSession(null);
            localStorage.removeItem("client_session");
            localStorage.removeItem("client_username");
            localStorage.removeItem("client_remember_me");
            setIsLoading(false);
            return;
          }
        }

        if (parsedSession && parsedSession.id && parsedSession.username) {
          // تحميل البيانات الكاملة من Firebase
          loadFullClientData(parsedSession);

          // تحديث آخر نشاط
          LiveUsersService.updateUserActivity();
        } else {
          setSession(null);
          localStorage.removeItem("client_session");
          setIsLoading(false);
        }
      } else {
        setSession(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Session check error:", error);
      setSession(null);
      localStorage.removeItem("client_session");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // إضافة مستمع لتغييرات localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "client_session") {
        checkSession();
      }
    };

    // إضافة مستمع لتغييرات localStorage في نفس النافذة
    const handleStorageChangeSameWindow = () => {
      checkSession();
    };

    // مستمعات للأحداث المخصصة
    const handleSessionExpired = () => {
      setSession(null);
      setIsLoading(false);
    };

    const handleSessionLoggedOut = () => {
      setSession(null);
      setIsLoading(false);
    };

    const handleSessionLoggedIn = () => {
      checkSession();
    };

    // استماع للتغييرات من نوافذ أخرى
    window.addEventListener("storage", handleStorageChange);

    // استماع للتغييرات في نفس النافذة
    window.addEventListener(
      "localStorageChange",
      handleStorageChangeSameWindow
    );

    // استماع للأحداث المخصصة
    window.addEventListener("sessionExpired", handleSessionExpired);
    window.addEventListener("sessionLoggedOut", handleSessionLoggedOut);
    window.addEventListener("sessionLoggedIn", handleSessionLoggedIn);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleStorageChangeSameWindow
      );
      window.removeEventListener("sessionExpired", handleSessionExpired);
      window.removeEventListener("sessionLoggedOut", handleSessionLoggedOut);
      window.removeEventListener("sessionLoggedIn", handleSessionLoggedIn);
    };
  }, []);

  const loadFullClientData = async (basicSession: ClientSession) => {
    try {
      const clientsRef = collection(db, "Dealing_Clients");
      const q = query(
        clientsRef,
        where("UserName", "==", basicSession.username),
        where("IsActive", "==", true)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const clientData = querySnapshot.docs[0].data();

        // تحديث الجلسة بالبيانات الكاملة
        const fullSession: ClientSession = {
          ...basicSession,
          name: clientData.Name || basicSession.name,
          email: clientData.EMail || basicSession.email,
          mobile: clientData.Mobile || basicSession.mobile,
          phone: clientData.Phone || "",
          address: clientData.Address || "",
          latitude: clientData.Latitude?.toString() || "",
          longitude: clientData.Longitude?.toString() || "",
        };

        setSession(fullSession);
        // تحديث الجلسة في localStorage
        localStorage.setItem("client_session", JSON.stringify(fullSession));
      } else {
        setSession(basicSession);
      }
    } catch (error) {
      console.error("Error loading full client data:", error);
      setSession(basicSession);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (sessionData: ClientSession) => {
    // إضافة انتهاء الصلاحية (24 ساعة من الآن)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const sessionWithExpiry = {
      ...sessionData,
      expiresAt: expiresAt.toISOString(),
    };

    localStorage.setItem("client_session", JSON.stringify(sessionWithExpiry));
    setSession(sessionWithExpiry);

    // إرسال إشعار بالتغيير لجميع التابات
    window.dispatchEvent(new Event("localStorageChange"));

    // تحديث حالة تسجيل الدخول للمستخدم النشط
    try {
      await LiveUsersService.updateLoginStatus({
        clientId: sessionData.id,
        username: sessionData.username,
        name: sessionData.name,
      });
    } catch (error) {
      console.error("Error updating login status:", error);
    }
  };

  const logout = async () => {
    // إعادة تعيين المستخدم إلى حالة مجهول
    try {
      await LiveUsersService.resetToAnonymous();
    } catch (error) {
      console.error("Error resetting to anonymous:", error);
    }

    localStorage.removeItem("client_session");
    localStorage.removeItem("client_username");
    localStorage.removeItem("client_remember_me");
    setSession(null);

    // إرسال إشعار بالتغيير لجميع التابات
    window.dispatchEvent(new Event("localStorageChange"));
  };

  const isAuthenticated = !!session;

  // دالة لتحديث انتهاء الصلاحية عند النشاط
  const refreshSession = () => {
    if (session) {
      refreshSessionExpiry();
    }
  };

  return {
    session,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshSession,
  };
}
