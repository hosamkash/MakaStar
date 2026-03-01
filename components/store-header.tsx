import { Badge } from "@/components/ui/badge"

export default function StoreHeader() {
  return (
    <div className="text-center mb-8 sm:mb-10 lg:mb-12 px-4">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-primary-dark dark:text-foreground mb-3 sm:mb-4 lg:mb-6 leading-tight">
        متجر شركة مكة ستار
      </h1>
      <p className="text-neutral-medium dark:text-muted-foreground text-sm sm:text-base lg:text-lg max-w-sm sm:max-w-lg lg:max-w-2xl mx-auto mb-4 sm:mb-6 leading-relaxed">
        اكتشف مجموعتنا الواسعة من الملابس العصرية والجاهزة التي تناسب جميع الأذواق والمناسبات.
      </p>
      <Badge
        variant="outline"
        className="bg-yellow-50 border-yellow-300 text-yellow-800 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base font-medium rounded-md shadow-sm max-w-full break-words"
      >
        <span className="hidden sm:inline">📋 ملاحظة: هذا المتجر للعرض فقط. للمشتريات، يرجى الاتصال بنا مباشرة.</span>
        <span className="sm:hidden">📋 للمشتريات اتصل بنا مباشرة</span>
      </Badge>
    </div>
  )
}
