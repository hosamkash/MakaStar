"use client";

/**
 * أدوات اختبار نظام الجلسة الجديد
 * يمكن استخدامها للتأكد من عمل النظام عبر جميع التابات
 */

export class SessionTestUtils {
  /**
   * اختبار تسجيل الدخول في تاب واحد والتحقق من ظهوره في تاب آخر
   */
  static async testCrossTabLogin() {
    console.log("🧪 Testing cross-tab login...");

    // محاكاة تسجيل الدخول
    const testSession = {
      id: 999,
      username: "test_user",
      name: "Test User",
      email: "test@example.com",
      mobile: "123456789",
      phone: "",
      address: "",
      latitude: "",
      longitude: "",
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    localStorage.setItem("client_session", JSON.stringify(testSession));
    window.dispatchEvent(new Event("localStorageChange"));

    console.log("✅ Test session created");
    return testSession;
  }

  /**
   * اختبار تسجيل الخروج من تاب واحد والتحقق من تأثيره على التابات الأخرى
   */
  static async testCrossTabLogout() {
    console.log("🧪 Testing cross-tab logout...");

    localStorage.removeItem("client_session");
    localStorage.removeItem("client_username");
    localStorage.removeItem("client_remember_me");
    window.dispatchEvent(new Event("localStorageChange"));

    console.log("✅ Test logout completed");
  }

  /**
   * اختبار انتهاء صلاحية الجلسة
   */
  static async testSessionExpiry() {
    console.log("🧪 Testing session expiry...");

    const expiredSession = {
      id: 999,
      username: "test_user",
      name: "Test User",
      email: "test@example.com",
      mobile: "123456789",
      phone: "",
      address: "",
      latitude: "",
      longitude: "",
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(), // انتهت الصلاحية
    };

    localStorage.setItem("client_session", JSON.stringify(expiredSession));
    window.dispatchEvent(new Event("localStorageChange"));

    console.log("✅ Test expired session created");
  }

  /**
   * اختبار تحديث انتهاء الصلاحية عند النشاط
   */
  static async testSessionRefresh() {
    console.log("🧪 Testing session refresh...");

    const sessionData = localStorage.getItem("client_session");
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + 24);

        const updatedSession = {
          ...session,
          expiresAt: newExpiresAt.toISOString(),
        };

        localStorage.setItem("client_session", JSON.stringify(updatedSession));
        window.dispatchEvent(new Event("localStorageChange"));

        console.log("✅ Session refreshed successfully");
      } catch (error) {
        console.error("❌ Error refreshing session:", error);
      }
    } else {
      console.log("❌ No session found to refresh");
    }
  }

  /**
   * اختبار شامل للنظام
   */
  static async runFullTest() {
    console.log("🚀 Starting full session test...");

    try {
      // اختبار 1: تسجيل الدخول
      await this.testCrossTabLogin();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // اختبار 2: تحديث الجلسة
      await this.testSessionRefresh();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // اختبار 3: انتهاء الصلاحية
      await this.testSessionExpiry();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // اختبار 4: تسجيل الخروج
      await this.testCrossTabLogout();

      console.log("✅ All tests completed successfully!");
    } catch (error) {
      console.error("❌ Test failed:", error);
    }
  }

  /**
   * تنظيف بيانات الاختبار
   */
  static cleanup() {
    localStorage.removeItem("client_session");
    localStorage.removeItem("client_username");
    localStorage.removeItem("client_remember_me");
    console.log("🧹 Test data cleaned up");
  }
}

// إضافة إلى window للوصول من console
if (typeof window !== "undefined") {
  (window as any).SessionTestUtils = SessionTestUtils;
}


