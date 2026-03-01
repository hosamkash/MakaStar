"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  Heart, 
  Eye, 
  Target,
  ArrowLeft,
  CheckCircle
} from "lucide-react"

export default function CompactServicesSection() {
  const values = [
    {
      icon: Shield,
      title: "خدمتنا",
      description: "+15 عام خبرة في الأزياء",
      color: "blue"
    },
    {
      icon: Heart,
      title: "قيمنا", 
      description: "الجودة والأمانة والابتكار",
      color: "red"
    },
    {
      icon: Eye,
      title: "رؤيتنا",
      description: "الريادة في الملابس الجاهزة",
      color: "green"
    },
    {
      icon: Target,
      title: "رسالتنا",
      description: "أفضل الملابس بأسعار تنافسية",
      color: "purple"
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      red: "from-red-500 to-red-600", 
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600"
    }
    return colors[color as keyof typeof colors]
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            لماذا نحن الخيار الأفضل؟
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            نحن نؤمن بأن الموضة هي تعبير عن الذات، ونسعى لتقديم الأفضل دائمًا
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {values.map((value, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white group">
              <div className={`bg-gradient-to-r ${getColorClasses(value.color)} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <value.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{value.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">مميزات خاصة</h3>
              <div className="space-y-4">
                {[
                  "جودة عالية مضمونة",
                  "أسعار تنافسية ومناسبة",
                  "خدمة عملاء متميزة",
                  "تشكيلة واسعة ومتنوعة",
                  "ضمان الرضا التام"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center lg:text-left">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <h4 className="text-xl font-bold text-gray-900 mb-4">هل تريد معرفة المزيد؟</h4>
                <p className="text-gray-600 mb-6">تواصل معنا للحصول على معلومات مفصلة حول خدماتنا ومنتجاتنا</p>
                <Button 
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                >
                  <Link href="/about" className="flex items-center gap-2">
                    <span>اكتشف المزيد</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


