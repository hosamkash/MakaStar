import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Users, Settings } from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="w-full max-w-3xl rounded-2xl bg-white p-10 text-center shadow-lg">
        <CardContent className="flex flex-col items-center justify-center gap-6">
          <LayoutGrid className="h-20 w-20 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-800">مرحباً بك في لوحة التحكم!</h1>
          <p className="text-md text-gray-500 max-w-md">من هنا يمكنك إدارة جميع جوانب موقع وتطبيقات مكة ستار.</p>
          <div className="mt-4 grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
            <Button
              asChild
              size="lg"
              className="h-auto bg-green-50 p-4 text-base font-semibold text-green-800 shadow-sm hover:bg-green-100"
            >
              <Link href="/admin/parties/customers" className="flex items-center justify-center gap-3">
                <Users className="h-6 w-6" />
                <span>راجع بيانات العملاء والموردين.</span>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-auto bg-blue-50 p-4 text-base font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
            >
              <Link href="/admin/settings/website" className="flex items-center justify-center gap-3">
                <Settings className="h-6 w-6" />
                <span>ابدأ بتحديث إعدادات الموقع.</span>
              </Link>
            </Button>
          </div>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-blue-600 px-10 py-3 text-lg font-bold text-white hover:bg-blue-700"
          >
            <Link href="#">ابدأ الإدارة</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
