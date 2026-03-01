"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Gift, MessageCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ChatDialog from "@/components/chat-dialog" // Import ChatDialog

export default function OtherServicesSection() {
  return (
    <section className="py-20 bg-neutral-light dark:bg-background">
      <div className="container mx-auto px-6 text-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-gray-500 text-white rounded-full p-5 mb-4 shadow-md">
                <Settings className="w-12 h-12" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">
                خدمات أخرى
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between w-full">
              <p className="text-neutral-medium dark:text-muted-foreground mb-6 leading-relaxed">
                المزيد من الخدمات والحلول المتكاملة لتلبية احتياجاتك المتنوعة بكفاءة.
              </p>
              <Link
                href="/services" // Link to Services Page
                className="text-primary hover:underline flex items-center justify-center gap-2 font-medium"
              >
                اعرف المزيد <ArrowLeft className="h-5 w-5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-red-500 text-white rounded-full p-5 mb-4 shadow-md">
                <Gift className="w-12 h-12" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">العروض</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between w-full">
              <p className="text-neutral-medium dark:text-muted-foreground mb-6 leading-relaxed">
                اكتشف أحدث العروض والخصومات الحصرية على منتجاتنا، ولا تفوت فرصة التوفير.
              </p>
              <Link
                href="/offers" // Link to Offers Page
                className="text-primary hover:underline flex items-center justify-center gap-2 font-medium"
              >
                اعرف المزيد <ArrowLeft className="h-5 w-5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-yellow-500 text-white rounded-full p-5 mb-4 shadow-md">
                <MessageCircle className="w-12 h-12" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">
                الدعم المباشر
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between w-full">
              <p className="text-neutral-medium dark:text-muted-foreground mb-6 leading-relaxed">
                تواصل معنا مباشرة عبر الدردشة للحصول على المساعدة الفورية من فريق الدعم.
              </p>
              <ChatDialog>
                <Button
                  variant="link"
                  className="text-primary hover:underline flex items-center justify-center gap-2 font-medium p-0 h-auto"
                >
                  اعرف المزيد <ArrowLeft className="h-5 w-5" />
                </Button>
              </ChatDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
