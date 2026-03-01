import { Fingerprint } from "lucide-react"
export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Fingerprint className="w-16 h-16 mb-4 text-blue-500" />
      <h1 className="text-2xl font-bold">البصمات</h1>
    </div>
  )
}
