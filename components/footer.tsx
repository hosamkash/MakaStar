import Link from "next/link"
import { Phone, Mail, MapPin, Instagram, Twitter, Facebook } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white py-3 sm:py-4 lg:py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Company Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-right lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white rounded-lg mb-1.5 sm:mb-2 flex items-center justify-center shadow-md overflow-hidden">
              <img 
                src="/maka-star-logo.png" 
                alt="مكه ستار" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            <p className="text-neutral-300 mb-1.5 sm:mb-2 leading-relaxed text-xs sm:text-sm lg:text-base max-w-xs sm:max-w-none">
              شركة مكة ستار للملابس الجاهزة، رائدة في صناعة الأزياء العصرية بجودة عالية وأسعار منافسة.
            </p>
            <div className="flex space-x-1.5 sm:space-x-2 lg:space-x-3">
              <Link href="#" aria-label="Instagram" className="text-white hover:text-primary transition-colors duration-200">
                <Instagram className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </Link>
              <Link href="#" aria-label="Twitter" className="text-white hover:text-primary transition-colors duration-200">
                <Twitter className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </Link>
              <Link href="#" aria-label="Facebook" className="text-white hover:text-primary transition-colors duration-200">
                <Facebook className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-right">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-1.5 sm:mb-2 text-primary">روابط سريعة</h3>
            <ul className="space-y-0.5 sm:space-y-1 text-neutral-300 text-xs sm:text-sm lg:text-base">
              <li>
                <Link href="/" className="hover:text-primary transition-colors duration-200 block py-0.5">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors duration-200 block py-0.5">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/apps" className="hover:text-primary transition-colors duration-200 block py-0.5">
                  التطبيقات
                </Link>
              </li>
              <li>
                <Link href="/store" className="hover:text-primary transition-colors duration-200 block py-0.5">
                  المتجر
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-primary transition-colors duration-200 block py-0.5">
                  العروض
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="text-center sm:text-right">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-1.5 sm:mb-2 text-primary">تواصل معنا</h3>
            <ul className="space-y-1 sm:space-y-1.5 text-neutral-300 text-xs sm:text-sm lg:text-base">
              <li className="flex items-center justify-center sm:justify-end gap-1 sm:gap-1.5">
                <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-primary flex-shrink-0" />
                <span className="break-all sm:break-normal">+201112778800</span>
              </li>
              <li className="flex items-center justify-center sm:justify-end gap-1 sm:gap-1.5">
                <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-primary flex-shrink-0" />
                <span className="break-all sm:break-normal">info@makastar.com</span>
              </li>
              <li className="flex items-center justify-center sm:justify-end gap-1 sm:gap-1.5">
                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-primary flex-shrink-0" />
                <span>جمهورية مصر العربية</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-3 sm:mt-4 lg:mt-6 pt-2 sm:pt-3 text-center text-neutral-400 text-xs sm:text-sm">
          <p>&copy; 2024 شركة مكة ستار للملابس الجاهزة. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  )
}
