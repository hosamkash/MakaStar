import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { CheckCircle } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4 bg-neutral-light dark:bg-background min-h-screen">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <img 
            src="/maka-star-logo.png" 
            alt="مكه ستار" 
            className="w-20 h-20 object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold text-primary-dark dark:text-foreground mb-4">من نحن شركة مكة ستار</h1>
        <p className="text-neutral-medium dark:text-muted-foreground text-lg max-w-2xl mx-auto">
          قصتنا، قيمنا، ورؤيتنا في عالم الموضة والأزياء.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
        {/* About Text Content */}
        <div className="text-center lg:text-right">
          <h2 className="text-3xl font-bold text-primary-dark dark:text-foreground mb-6">
            نحن نصنع الأناقة، نصنع الثقة
          </h2>
          <p className="text-neutral-medium dark:text-muted-foreground mb-6 leading-relaxed text-lg">
            في **شركة مكة ستار للملابس الجاهزة**، نؤمن بأن الموضة ليست مجرد ملابس، بل هي تعبير عن الذات والثقة. منذ
            تأسيسنا، ونحن ملتزمون بتقديم أحدث صيحات الأزياء العصرية التي تجمع بين الجودة الفائقة والتصميم المبتكر. نختار
            بعناية أجود الخامات ونتبع أعلى معايير التصنيع لضمان أن كل قطعة ملابس تصل إليك تعكس التزامنا بالتميز.
          </p>
          <p className="text-neutral-medium dark:text-muted-foreground leading-relaxed text-lg">
            هدفنا هو إلهام عملائنا ليعيشوا حياتهم بأناقة وثقة، من خلال مجموعاتنا المتنوعة التي تناسب جميع الأذواق
            والمناسبات. نحن نفخر بكوننا جزءًا من رحلتك نحو الأناقة.
          </p>
        </div>
        {/* About Image */}
        <div className="flex justify-center lg:justify-start">
          <Image
            src="/placeholder.svg?height=500&width=600&text=About+Us+Team"
            alt="About Us Team"
            width={600}
            height={500}
            className="rounded-xl shadow-lg object-cover border border-neutral-200 dark:border-primary-dark"
          />
        </div>
      </div>

      {/* Our Values Section */}
      <div className="bg-white dark:bg-card p-8 rounded-xl shadow-lg mb-20">
        <h2 className="text-3xl font-bold text-primary-dark dark:text-foreground text-center mb-10">قيمنا الأساسية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="flex items-start gap-4 text-right">
            <CheckCircle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-primary-dark dark:text-foreground mb-2">الجودة الفائقة</h3>
              <p className="text-neutral-medium dark:text-muted-foreground">
                نلتزم بتقديم منتجات مصنوعة من أجود الخامات وبأعلى معايير التصنيع لضمان المتانة والراحة.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 text-right">
            <CheckCircle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-primary-dark dark:text-foreground mb-2">التصميم المبتكر</h3>
              <p className="text-neutral-medium dark:text-muted-foreground">
                نواكب أحدث صيحات الموضة العالمية ونقدم تصميمات فريدة تعكس الأناقة العصرية.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 text-right">
            <CheckCircle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-primary-dark dark:text-foreground mb-2">رضا العملاء</h3>
              <p className="text-neutral-medium dark:text-muted-foreground">
                نضع عملائنا في صميم اهتمامنا ونسعى لتقديم تجربة تسوق استثنائية وخدمة عملاء ممتازة.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 text-right">
            <CheckCircle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-primary-dark dark:text-foreground mb-2">الشفافية والنزاهة</h3>
              <p className="text-neutral-medium dark:text-muted-foreground">
                نعمل بشفافية تامة ونلتزم بأعلى معايير النزاهة في جميع تعاملاتنا.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 text-right">
            <CheckCircle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-primary-dark dark:text-foreground mb-2">
                المسؤولية الاجتماعية
              </h3>
              <p className="text-neutral-medium dark:text-muted-foreground">
                نؤمن بأهمية رد الجميل للمجتمع ونسعى للمساهمة الإيجابية في بيئتنا المحيطة.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Vision & Mission Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark rounded-xl text-center">
          <CardHeader className="pb-4">
            <h3 className="text-3xl font-bold text-primary mb-4">رؤيتنا</h3>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-medium dark:text-muted-foreground text-lg leading-relaxed">
              أن نكون العلامة التجارية الرائدة والمفضلة في مجال الملابس الجاهزة على مستوى المنطقة، معروفين بابتكارنا،
              جودتنا، والتزامنا تجاه عملائنا ومجتمعنا.
            </p>
          </CardContent>
        </Card>
        <Card className="p-8 shadow-lg border border-neutral-200 dark:border-primary-dark rounded-xl text-center">
          <CardHeader className="pb-4">
            <h3 className="text-3xl font-bold text-primary mb-4">رسالتنا</h3>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-medium dark:text-muted-foreground text-lg leading-relaxed">
              تقديم أحدث وأجود الملابس العصرية التي تلهم الثقة والأناقة، مع توفير تجربة تسوق استثنائية وخدمة عملاء
              متميزة، وبناء علاقات طويلة الأمد مبنية على الثقة والتميز.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
