"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ChatDialog from "@/components/chat-dialog"
import { 
  Users, 
  Star, 
  Package, 
  Award,
  MessageCircle,
  Phone,
  Mail,
  MapPin
} from "lucide-react"

export default function QuickStatsSection() {
  const stats = [
    {
      icon: Users,
      number: "+1000",
      label: "عميل راض",
      color: "blue"
    },
    {
      icon: Star,
      number: "5.0",
      label: "تقييم العملاء",
      color: "yellow"
    },
    {
      icon: Package,
      number: "+500",
      label: "منتج متاح",
      color: "green"
    },
    {
      icon: Award,
      number: "15+",
      label: "سنة خبرة",
      color: "purple"
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      yellow: "from-yellow-500 to-yellow-600",
      green: "from-green-500 to-green-600", 
      purple: "from-purple-500 to-purple-600"
    }
    return colors[color as keyof typeof colors]
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 bg-gray-50">
              <div className={`bg-gradient-to-r ${getColorClasses(stat.color)} w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">تواصل معنا</h3>
              <p className="text-gray-600 mb-6">نحن هنا لمساعدتك! تواصل معنا بأي طريقة تناسبك</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 w-10 h-10 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700">+966 50 123 4567</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 w-10 h-10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700">info@makastar.com</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700">مكة المكرمة، السعودية</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <ChatDialog>
                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-6"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  <span>الدعم المباشر</span>
                </Button>
              </ChatDialog>
              
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl py-6"
              >
                <Link href="/store">
                  <Package className="w-5 h-5 mr-2" />
                  <span>تصفح المنتجات</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


