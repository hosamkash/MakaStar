import { Receipt } from "lucide-react"
export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Receipt className="w-16 h-16 mb-4 text-blue-500" />
      <h1 className="text-2xl font-bold">سندات الصرف</h1>
    </div>
  )
}
