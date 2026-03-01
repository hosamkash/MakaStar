"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  ShoppingBag, 
  Calculator, 
  Smartphone, 
  Gift,
  Star,
  Users,
  ArrowLeft,
  Sparkles
} from "lucide-react"

export default function ModernHeroSection() {
  return (
    <section className="relative bg-white min-h-[85vh] flex items-center py-12 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500 rounded-full"></div>
        <div className="absolute bottom-32 left-1/4 w-28 h-28 bg-green-500 rounded-full"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-orange-500 rounded-full"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Main Content */}
          <div className="text-center lg:text-right space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-200">
              <img 
                src="/maka-star-logo.png" 
                alt="مكه ستار" 
                className="w-5 h-5 object-contain"
              />
              <span className="text-sm font-medium text-blue-800">مرحباً بك في مكة ستار</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
              <span className="block">مكة ستار</span>
              <span className="block text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                للملابس الجاهزة
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              وجهتك الأولى لأحدث صيحات الموضة العصرية والحلول التقنية المتكاملة بجودة عالية وأسعار تنافسية
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-end gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <Link href="/store" className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5" />
                  <span>تصفح المتجر</span>
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300"
              >
                <Link href="/admin" className="flex items-center gap-3">
                  <Calculator className="w-5 h-5" />
                  <span>البرنامج المحاسبي</span>
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center lg:justify-end gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">تقييم 5 نجوم</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">+1000 عميل راض</span>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 bg-gradient-to-br from-blue-50 to-blue-100 group cursor-pointer">
              <Link href="/store" className="block">
                <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">المتجر</h3>
                <p className="text-sm text-gray-600 leading-relaxed">تصفح مجموعتنا الواسعة من الملابس العصرية</p>
              </Link>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 bg-gradient-to-br from-purple-50 to-purple-100 group cursor-pointer">
              <Link href="/admin" className="block">
                <div className="bg-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">المحاسبة</h3>
                <p className="text-sm text-gray-600 leading-relaxed">نظام محاسبي شامل ومتكامل</p>
              </Link>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 bg-gradient-to-br from-green-50 to-green-100 group cursor-pointer">
              <Link href="/apps" className="block">
                <div className="bg-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">التطبيقات</h3>
                <p className="text-sm text-gray-600 leading-relaxed">تطبيقات متطورة لتجربة أفضل</p>
              </Link>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 bg-gradient-to-br from-orange-50 to-orange-100 group cursor-pointer">
              <Link href="/offers" className="block">
                <div className="bg-orange-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">العروض</h3>
                <p className="text-sm text-gray-600 leading-relaxed">أحدث العروض والخصومات الحصرية</p>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}


