import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Folder, Smartphone, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ServicesProductsSection() {
  return (
    <section className="py-20 bg-white dark:bg-background">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-primary-dark dark:text-foreground mb-4">خدماتنا ومنتجاتنا</h2>
        <p className="text-neutral-medium dark:text-muted-foreground text-xl max-w-3xl mx-auto mb-16">
          نقدم مجموعة شاملة من الخدمات والحلول التقنية لتلبية جميع احتياجاتك بأسلوب عصري ومبتكر.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-purple-500 text-white rounded-full p-5 mb-4 shadow-md">
                <Calculator className="w-12 h-12" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">
                البرنامج المحاسبي
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between w-full">
              <p className="text-neutral-medium dark:text-muted-foreground mb-6 leading-relaxed">
                نظام محاسبي شامل ومتكامل لإدارة أعمالك بكفاءة ودقة متناهية، مصمم لتبسيط عملياتك.
              </p>
              {/* Removed link to /services */}
              <Link
                href="#"
                className="text-primary hover:underline flex items-center justify-center gap-2 font-medium"
              >
                اعرف المزيد <ArrowLeft className="h-5 w-5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-green-500 text-white rounded-full p-5 mb-4 shadow-md">
                <Folder className="w-12 h-12" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">المتجر</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between w-full">
              <p className="text-neutral-medium dark:text-muted-foreground mb-6 leading-relaxed">
                تصفح مجموعتنا الواسعة من الملابس العصرية والجاهزة، واختر ما يناسب ذوقك الرفيع.
              </p>
              <Link
                href="/store" // Link to Store Page
                className="text-primary hover:underline flex items-center justify-center gap-2 font-medium"
              >
                اعرف المزيد <ArrowLeft className="h-5 w-5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-blue-500 text-white rounded-full p-5 mb-4 shadow-md">
                <Smartphone className="w-12 h-12" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">التطبيقات</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between w-full">
              <p className="text-neutral-medium dark:text-muted-foreground mb-6 leading-relaxed">
                حمل تطبيقاتنا المتطورة لتجربة تسوق أفضل وأكثر سهولة، في متناول يدك دائمًا.
              </p>
              <Link
                href="/apps" // Link to Apps Page
                className="text-primary hover:underline flex items-center justify-center gap-2 font-medium"
              >
                اعرف المزيد <ArrowLeft className="h-5 w-5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
