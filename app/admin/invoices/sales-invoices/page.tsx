import { FileText } from "lucide-react"
export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <FileText className="w-16 h-16 mb-4 text-blue-500" />
      <h1 className="text-2xl font-bold">فواتير المبيعات</h1>
    </div>
  )
}
