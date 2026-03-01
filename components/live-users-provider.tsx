"use client"

import { useEffect } from "react"
import { useLiveUsers } from "@/lib/hooks/use-live-users"

export default function LiveUsersProvider() {
  const { isInitialized } = useLiveUsers()

  // هذا المكون لا يعرض أي شيء، فقط يدير المستخدمين النشطين
  return null
}
