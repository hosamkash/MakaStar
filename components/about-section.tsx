import Image from "next/image"

export default function AboutSection() {
  return (
    <section className="py-16 bg-white dark:bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="lg:order-2 text-center lg:text-right">
            <h2 className="text-4xl font-bold text-primary-dark dark:text-foreground mb-6">
              من نحن <span className="text-primary">شركة مكة ستار</span>
            </h2>
            <p className="text-neutral-medium dark:text-muted-foreground mb-4 leading-relaxed">
              في شركة مكة ستار، نؤمن بأن الموضة هي تعبير عن الذات. منذ تأسيسنا، نسعى لتقديم أحدث وأجود الملابس التي تلهم
              الثقة والأناقة في كل خطوة. مجموعاتنا المختارة بعناية تجمع بين التصميم العصري والجودة الفائقة، لتناسب جميع
              الأذواق والمناسبات.
            </p>
            <p className="text-neutral-medium dark:text-muted-foreground leading-relaxed">
              نحن ملتزمون بتقديم تجربة تسوق استثنائية، من خلال خدمة عملاء ممتازة وتوصيل سريع. انضم إلى عائلة شركة مكة
              ستار واكتشف عالمًا من الأناقة والتميز.
            </p>
          </div>
          <div className="lg:order-1 flex justify-center">
            <Image
              src="/placeholder.svg?height=500&width=500&text=About+Us"
              alt="About Us"
              width={500}
              height={500}
              className="rounded-lg shadow-lg object-cover border border-neutral-200 dark:border-primary-dark"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
