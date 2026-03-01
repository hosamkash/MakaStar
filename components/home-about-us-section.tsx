import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Heart, Eye, Target } from "lucide-react"

export default function HomeAboutUsSection() {
  return (
    <section className="py-20 bg-neutral-light dark:bg-background">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-primary-dark dark:text-foreground mb-4">من نحن</h2>
        <p className="text-neutral-medium dark:text-muted-foreground text-xl max-w-3xl mx-auto mb-16">
          نحن نؤمن بأن الموضة هي تعبير عن الذات، ونسعى لتقديم الأفضل دائمًا.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <Shield className="w-14 h-14 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">خدمتنا</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-medium dark:text-muted-foreground leading-relaxed">
                أكثر من 15 عامًا من الخبرة في صناعة الأزياء والملابس الجاهزة عالية الجودة.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <Heart className="w-14 h-14 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">قيمنا</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-medium dark:text-muted-foreground leading-relaxed">
                الجودة، الأمانة، الابتكار، وخدمة العملاء المتميزة هي جوهر عملنا.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <Eye className="w-14 h-14 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">رؤيتنا</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-medium dark:text-muted-foreground leading-relaxed">
                أن نكون الرائدين والمبتكرين في مجال الملابس الجاهزة على مستوى المنطقة.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center rounded-xl">
            <CardHeader className="pb-6">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <Target className="w-14 h-14 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary-dark dark:text-foreground">رسالتنا</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-medium dark:text-muted-foreground leading-relaxed">
                تقديم أفضل الملابس العصرية بجودة عالية وأسعار تنافسية لجميع أفراد العائلة.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
