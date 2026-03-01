import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[650px] xl:h-[700px] flex items-center justify-center text-center text-white overflow-hidden bg-primary-dark">
      <Image
        src="/placeholder.svg?height=600&width=1200&text=Hero+Background"
        alt="Hero Background"
        fill
        className="object-cover opacity-10 z-0"
        priority
      />
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 w-full max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-3 sm:mb-4 lg:mb-6 leading-tight">
          اكتشف الأناقة العصرية مع{" "}
          <span className="text-accent-gold block sm:inline mt-2 sm:mt-0">شركة مكة ستار</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto text-neutral-100 leading-relaxed">
          وجهتك الأولى لأحدث صيحات الموضة والملابس العصرية التي تعكس شخصيتك الفريدة.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-2xl mx-auto">
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 text-sm sm:text-base lg:text-lg font-semibold rounded-full shadow-lg w-full sm:w-auto transition-all duration-200"
          >
            <Link href="/store">تسوق الآن</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-2 border-primary text-white hover:bg-primary hover:text-primary-foreground px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 text-sm sm:text-base lg:text-lg font-semibold rounded-full shadow-lg bg-transparent w-full sm:w-auto transition-all duration-200"
          >
            <Link href="/offers">اكتشف العروض</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-2 border-primary text-white hover:bg-primary hover:text-primary-foreground px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 text-sm sm:text-base lg:text-lg font-semibold rounded-full shadow-lg bg-transparent w-full sm:w-auto transition-all duration-200 hidden sm:flex"
          >
            <Link href="/apps">تطبيقاتنا</Link>
          </Button>
        </div>
        {/* Mobile-only third button */}
        <div className="mt-3 sm:hidden">
          <Button
            asChild
            variant="outline"
            className="border-2 border-primary text-white hover:bg-primary hover:text-primary-foreground px-4 py-3 text-sm font-semibold rounded-full shadow-lg bg-transparent w-full transition-all duration-200"
          >
            <Link href="/apps">تطبيقاتنا</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}


