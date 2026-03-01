"use client"

import React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import CodeEditor from "@/components/code-editor"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

type FileKey = "firestore" | "storage" | "firebaseConfig" | "firebaserc"

const fileTabs: { key: FileKey; label: string; path: string }[] = [
  { key: "firebaseConfig", label: "lib/firebase.ts", path: "lib/firebase.ts" },
  { key: "firestore", label: "firestore.rules", path: "firestore.rules" },
  { key: "storage", label: "storage.rules", path: "storage.rules" },
  { key: "firebaserc", label: ".firebaserc", path: ".firebaserc" },
]

export default function FirebaseSettingsPage() {
  const { toast } = useToast()
  const [active, setActive] = React.useState<FileKey>("firebaseConfig")
  const [contents, setContents] = React.useState<Record<FileKey, string>>({
    firestore: "",
    storage: "",
    firebaseConfig: "",
    firebaserc: "",
  })
  const [loading, setLoading] = React.useState<Record<FileKey, boolean>>({
    firestore: false,
    storage: false,
    firebaseConfig: false,
    firebaserc: false,
  })
  const [saving, setSaving] = React.useState<Record<FileKey, boolean>>({
    firestore: false,
    storage: false,
    firebaseConfig: false,
    firebaserc: false,
  })

  const loadFile = React.useCallback(async (key: FileKey) => {
    setLoading((s) => ({ ...s, [key]: true }))
    try {
      const res = await fetch(`/admin/settings/firebase/api?file=${key}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "خطأ في القراءة")
      setContents((c) => ({ ...c, [key]: String(data.content ?? "") }))
    } catch (e: any) {
      toast({ title: "خطأ", description: e?.message || "تعذر قراءة الملف" })
    } finally {
      setLoading((s) => ({ ...s, [key]: false }))
    }
  }, [toast])

  const saveFile = React.useCallback(async (key: FileKey) => {
    setSaving((s) => ({ ...s, [key]: true }))
    try {
      const res = await fetch(`/admin/settings/firebase/api`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, content: contents[key] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "خطأ في الحفظ")
      toast({ title: "تم الحفظ", description: `تم حفظ ${key} بنجاح` })
    } catch (e: any) {
      toast({ title: "خطأ", description: e?.message || "تعذر حفظ الملف" })
    } finally {
      setSaving((s) => ({ ...s, [key]: false }))
    }
  }, [contents, toast])

  React.useEffect(() => {
    // load first visible on mount
    loadFile(active)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onTabChange = (value: string) => {
    const key = value as FileKey
    setActive(key)
    if (!contents[key] && !loading[key]) {
      loadFile(key)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">إعدادات الفايربيز (قاعدة البيانات)</h1>
      <Tabs value={active} onValueChange={onTabChange}>
        <TabsList className="flex flex-wrap gap-2 p-2">
          {fileTabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="cli">Firebase CLI</TabsTrigger>
        </TabsList>

        {fileTabs.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{t.path}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => loadFile(t.key)} disabled={loading[t.key]}>
                  {loading[t.key] ? "جاري التحديث..." : "إعادة تحميل"}
                </Button>
                <Button onClick={() => saveFile(t.key)} disabled={saving[t.key]}>
                  {saving[t.key] ? "جارٍ الحفظ..." : "حفظ"}
                </Button>
              </div>
            </div>
            <div className="mt-3">
              <CodeEditor
                value={contents[t.key]}
                onChange={(val) => setContents((c) => ({ ...c, [t.key]: val }))}
                language={
                  t.key === "firebaseConfig" ? "typescript" :
                  t.key === "firebaserc" ? "json" :
                  "plaintext"
                }
                theme="vs-dark"
                height="70vh"
              />
            </div>
          </TabsContent>
        ))}

        <TabsContent value="cli">
          <FirebaseCliHelp />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FirebaseCliHelp() {
  const { toast } = useToast()
  const commands: { title: string; cmd: string }[] = [
    { title: "تثبيت أدوات Firebase", cmd: "npm i -g firebase-tools" },
    { title: "تسجيل الدخول", cmd: "firebase login" },
    { title: "تحديد المشروع", cmd: "firebase use --add" },
    { title: "نشر القواعد (Firestore)", cmd: "firebase deploy --only firestore:rules" },
    { title: "نشر قواعد التخزين", cmd: "firebase deploy --only storage" },
    { title: "نشر الاستضافة", cmd: "firebase deploy --only hosting" },
    { title: "نشر الكل", cmd: "firebase deploy" },
    { title: "محاكاة محليًا", cmd: "firebase emulators:start" },
    { title: "عرض المشاريع", cmd: "firebase projects:list" },
  ]

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title: "تم النسخ", description: text })
  }

  return (
    <div className="space-y-3">
      <p className="text-gray-600">أوامر مفيدة لـ Firebase CLI (انسخ ونفّذ في الطرفية):</p>
      <div className="space-y-2">
        {commands.map((c, i) => (
          <div key={i} className="flex items-center justify-between rounded border p-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{c.title}</div>
              <pre className="text-xs mt-1 overflow-x-auto"><code>{c.cmd}</code></pre>
            </div>
            <Button variant="outline" onClick={() => copy(c.cmd)}>نسخ</Button>
          </div>
        ))}
      </div>
    </div>
  )
}


