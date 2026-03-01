import { Truck } from "lucide-react"

export default function SuppliersPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
      <Truck className="h-24 w-24 text-blue-600 mb-6" />
      <h1 className="text-3xl font-bold text-gray-800">الموردين</h1>
      <p className="text-gray-600 mt-2">هذه هي صفحة إدارة الموردين.</p>
    </div>
  )
}
