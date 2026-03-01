import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlayCircle, ArrowLeft, Star } from "lucide-react"

export default function HomeHeroSection() {
  return (
    <section className="relative bg-primary-dark text-white py-24 md:py-36 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/placeholder.svg?height=800&width=1600&text=Elegant+Background+Pattern"
          alt="Elegant Background Pattern"
          layout="fill"
          objectFit="cover"
          className="opacity-10"
        />
      </div>
      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Right Content - Text and Buttons */}
        <div className="text-center lg:text-right order-1 lg:order-2 animate-in fade-in-0 slide-in-from-right-8 duration-1000">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            <span className="block">مكة ستار للملابس الجاهزة</span>
            <span className="block text-accent-gold mt-2">أناقة لا مثيل لها</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto lg:mx-0 text-neutral-200 font-light">
            وجهتك الأولى لأحدث صيحات الموضة العصرية والجودة العالية التي تعكس شخصيتك الفريدة.
          </p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-end gap-5">
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-7 text-xl font-semibold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              <Link href="/store">
                {" "}
                {/* Link to Store Page */}
                <PlayCircle className="h-7 w-7" />
                <span>شاهد الفيديو</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 py-7 text-xl font-semibold rounded-full shadow-lg bg-transparent transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              <Link href="/store">
                {" "}
                {/* Link to Store Page */}
                <ArrowLeft className="h-7 w-7" />
                <span>اكتشف منتجاتنا</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Left Content - Image Placeholder */}
        <div className="flex justify-center lg:justify-start order-2 lg:order-1 animate-in fade-in-0 slide-in-from-left-8 duration-1000 delay-200">
          <div className="relative w-full max-w-lg h-[450px] bg-neutral-300 rounded-xl shadow-2xl overflow-hidden flex items-center justify-center">
            <Image
              src="/placeholder.svg?height=500&width=500&text=Premium+Product+Showcase"
              alt="Premium Product Showcase"
              width={500}
              height={500}
              className="object-cover w-full h-full"
            />
            {/* Customer Rating Badge */}
            <div className="absolute top-6 right-6 bg-primary text-primary-foreground px-4 py-2 rounded-full flex items-center gap-2 text-base font-bold shadow-md">
              <Star className="h-5 w-5 fill-current" />
              <span>5</span>
              <span className="mr-1">تقييم العملاء</span>
            </div>
            {/* Satisfied Customers Badge */}
            <div className="absolute bottom-6 left-6 bg-white text-primary-dark px-4 py-2 rounded-full flex items-center gap-2 text-base font-bold shadow-md">
              <span>+1000</span>
              <span className="mr-1">عميل راض</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
