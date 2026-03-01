import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shirt, Truck, Star } from "lucide-react"

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-neutral-light dark:bg-background">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-primary-dark dark:text-foreground mb-12">
          لماذا تختار <span className="text-primary">شركة مكة ستار</span>؟
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-8 shadow-md border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
            <CardHeader className="pb-6">
              <Shirt className="w-20 h-20 text-primary mb-4" />
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">
                جودة لا تضاهى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-medium dark:text-muted-foreground">
                نقدم لك ملابس مصنوعة من أجود الخامات لضمان الراحة والمتانة والأناقة في كل قطعة.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 shadow-md border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
            <CardHeader className="pb-6">
              <Truck className="w-20 h-20 text-primary mb-4" />
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">
                توصيل سريع وموثوق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-medium dark:text-muted-foreground">
                استمتع بتجربة تسوق خالية من المتاعب مع خدمة توصيل سريعة وموثوقة إلى باب منزلك.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 shadow-md border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
            <CardHeader className="pb-6">
              <Star className="w-20 h-20 text-primary mb-4" />
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">
                تصميمات فريدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-medium dark:text-muted-foreground">
                مجموعاتنا مصممة بعناية لتواكب أحدث صيحات الموضة العالمية وتلبي جميع الأذواق.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
