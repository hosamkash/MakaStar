import { Button } from "@/components/ui/button"
import { Phone, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function StoreContactSection() {
  return (
    <div className="bg-white dark:bg-card p-8 rounded-xl shadow-lg text-center mt-12">
      <h2 className="text-3xl font-bold text-primary-dark dark:text-foreground mb-4">هل أنت مهتم بالشراء؟</h2>
      <p className="text-neutral-medium dark:text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
        لأن هذا المتجر للعرض فقط، يرجى الاتصال بنا مباشرة لإتمام أي عملية شراء أو للاستفسار عن المنتجات.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-lg flex items-center gap-2"
        >
          <Link href="#">
            <MessageCircle className="h-6 w-6" />
            تحدث معنا
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-lg bg-transparent flex items-center gap-2"
        >
          <Link href="#">
            <Phone className="h-6 w-6" />
            اتصل بنا
          </Link>
        </Button>
      </div>
    </div>
  )
}
