import { SearchX } from "lucide-react"

export default function NoProductsMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <SearchX className="h-24 w-24 text-neutral-medium dark:text-muted-foreground mb-6" />
      <h3 className="text-3xl font-bold text-primary-dark dark:text-foreground mb-3">لا توجد منتجات مطابقة</h3>
      <p className="text-neutral-medium dark:text-muted-foreground text-lg max-w-md">
        نأسف، لم نجد أي منتجات تتطابق مع معايير البحث الخاصة بك. يرجى محاولة البحث بكلمات مختلفة أو تصفية أقل.
      </p>
    </div>
  )
}
