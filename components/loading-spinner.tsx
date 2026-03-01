import { Loader2 } from "lucide-react"

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center text-primary">
      <Loader2 className="h-16 w-16 animate-spin mb-4" />
      <h2 className="text-2xl font-bold text-primary-dark dark:text-foreground">جاري تحميل المتجر...</h2>
      <p className="text-neutral-medium dark:text-muted-foreground mt-2">الرجاء الانتظار لحظة</p>
    </div>
  )
}
