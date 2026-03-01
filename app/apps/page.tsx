"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Calculator, 
  Package, 
  Users, 
  UserCheck, 
  ShoppingBag, 
  MessageCircle,
  Smartphone,
  Apple,
  Download,
  Star,
  CheckCircle,
  Sparkles
} from "lucide-react"

export default function AppsPage() {
  const apps = [
    {
      id: 1,
      title: "النظام المحاسبي المتكامل",
      description: "نظام محاسبي شامل ومتكامل لإدارة جميع العمليات المالية بكفاءة ودقة متناهية",
      icon: Calculator,
      color: "blue",
      features: ["الحسابات العامة", "التقارير المالية", "الميزانيات", "التكامل السحابي"],
      androidLink: "#",
      iosLink: "#",
      isNew: true
    },
    {
      id: 2,
      title: "نظام المخازن والأصناف",
      description: "إدارة متكاملة للمخازن والمواد مع تتبع المخزون والحركات اليومية بدقة",
      icon: Package,
      color: "green",
      features: ["إدارة المخزون", "تتبع الأصناف", "تقارير الحركة", "الجرد الدوري"],
      androidLink: "#",
      iosLink: "#",
      isNew: false
    },
    {
      id: 3,
      title: "نظام شئون العاملين",
      description: "نظام شامل لإدارة الموارد البشرية والرواتب والحضور والانصراف",
      icon: Users,
      color: "purple",
      features: ["إدارة الموظفين", "حساب الرواتب", "تتبع الحضور", "التقييمات"],
      androidLink: "#",
      iosLink: "#",
      isNew: false
    },
    {
      id: 4,
      title: "نظام المندوبين",
      description: "تطبيق مخصص للمندوبين لإدارة الطلبات والعملاء والمبيعات الخارجية",
      icon: UserCheck,
      color: "orange",
      features: ["إدارة العملاء", "تسجيل الطلبات", "تتبع المبيعات", "التقارير اليومية"],
      androidLink: "#",
      iosLink: "#",
      isNew: true
    },
    {
      id: 5,
      title: "المتجر الإلكتروني",
      description: "متجر شامل لعرض وبيع الملابس الجاهزة مع تجربة تسوق سلسة ومتميزة",
      icon: ShoppingBag,
      color: "red",
      features: ["تصفح المنتجات", "سلة التسوق", "الدفع الآمن", "تتبع الطلبات"],
      androidLink: "#",
      iosLink: "#",
      isNew: false
    },
    {
      id: 6,
      title: "الشات والرسائل",
      description: "نظام تواصل متطور للدعم الفني والتواصل مع العملاء والفرق الداخلية",
      icon: MessageCircle,
      color: "yellow",
      features: ["الدردشة الفورية", "الرسائل الجماعية", "الإشعارات", "مشاركة الملفات"],
      androidLink: "#",
      iosLink: "#",
      isNew: true
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        gradient: "from-blue-500 to-blue-600",
        bg: "from-blue-50 to-blue-100",
        text: "text-blue-600",
        border: "border-blue-200"
      },
      green: {
        gradient: "from-green-500 to-green-600", 
        bg: "from-green-50 to-green-100",
        text: "text-green-600",
        border: "border-green-200"
      },
      purple: {
        gradient: "from-purple-500 to-purple-600",
        bg: "from-purple-50 to-purple-100", 
        text: "text-purple-600",
        border: "border-purple-200"
      },
      orange: {
        gradient: "from-orange-500 to-orange-600",
        bg: "from-orange-50 to-orange-100",
        text: "text-orange-600", 
        border: "border-orange-200"
      },
      red: {
        gradient: "from-red-500 to-red-600",
        bg: "from-red-50 to-red-100",
        text: "text-red-600",
        border: "border-red-200"
      },
      yellow: {
        gradient: "from-yellow-500 to-yellow-600",
        bg: "from-yellow-50 to-yellow-100",
        text: "text-yellow-600",
        border: "border-yellow-200"
      }
    }
    return colors[color as keyof typeof colors]
  }

  return (
    <div className="w-full overflow-x-hidden bg-white">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 to-blue-50 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-purple-500 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-500 rounded-full"></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <img 
              src="/maka-star-logo.png" 
              alt="مكه ستار" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">تطبيقاتنا المتطورة</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            <span className="block">مجموعة تطبيقاتنا</span>
            <span className="block text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              المتكاملة والمتطورة
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            اكتشف مجموعتنا الشاملة من التطبيقات المصممة خصيصاً لتلبية احتياجاتك التجارية والإدارية بكفاءة عالية
          </p>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">متاح على الأندرويد</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">متاح على iOS</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-700">تقييم عالي</span>
            </div>
          </div>
        </div>
      </section>

      {/* Apps Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {apps.map((app) => {
              const colorClasses = getColorClasses(app.color)
              return (
                <Card key={app.id} className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-gradient-to-br ${colorClasses.bg} group`}>
                  {app.isNew && (
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
                      جديد
                    </Badge>
                  )}
                  
                  <div className="p-8">
                    <div className="flex items-start gap-6 mb-6">
                      <div className={`bg-gradient-to-r ${colorClasses.gradient} w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <app.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{app.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{app.description}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">المميزات الرئيسية:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {app.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Download Buttons */}
                    <div className="flex gap-4">
                      <Button
                        asChild
                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-6"
                      >
                        <Link href={app.androidLink} className="flex items-center justify-center gap-2">
                          <Smartphone className="w-5 h-5" />
                          <div className="text-right">
                            <div className="text-xs opacity-80">تحميل من</div>
                            <div className="font-semibold">جوجل بلاي</div>
                          </div>
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className={`flex-1 border-2 ${colorClasses.border} hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-xl py-6`}
                      >
                        <Link href={app.iosLink} className="flex items-center justify-center gap-2">
                          <Apple className="w-5 h-5" />
                          <div className="text-right">
                            <div className="text-xs opacity-80">تحميل من</div>
                            <div className="font-semibold">آب ستور</div>
                          </div>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">تحتاج مساعدة؟</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            فريق الدعم الفني جاهز لمساعدتك في تثبيت واستخدام التطبيقات
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8"
            >
              <Link href="#" className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span>تواصل مع الدعم</span>
              </Link>
            </Button>
            
            <Button 
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl px-8"
            >
              <Link href="#" className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span>دليل الاستخدام</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}