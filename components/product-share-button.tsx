"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { formatCurrencyEGP } from "@/lib/utils"

interface Product {
  ID: number
  Name: string
  ImageURL: string
  ShopShortDiscription?: string
  ShopPrice?: number
  UnitBig_Sales1?: number
  UnitSmall_Sales1?: number
  UnitCountOf?: number
}

interface ProductShareButtonProps {
  product: Product
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
  showText?: boolean
}

export default function ProductShareButton({ 
  product, 
  className = "", 
  size = "sm",
  variant = "outline",
  showText = false 
}: ProductShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)

  const getDisplayPrice = (product: Product): number => {
    if (product.ShopPrice && product.ShopPrice > 0) {
      return product.ShopPrice
    }
    
    if (product.UnitBig_Sales1 && product.UnitBig_Sales1 > 0) {
      return product.UnitBig_Sales1
    }
    
    if (product.UnitSmall_Sales1 && product.UnitSmall_Sales1 > 0) {
      const count = product.UnitCountOf || 1
      return product.UnitSmall_Sales1 * count
    }
    
    return 0
  }

  const shareProduct = async () => {
    if (isSharing) return
    setIsSharing(true)

    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/store/product/${product.ID}`
    const productText = product.ShopShortDiscription || `اكتشف ${product.Name} في متجر مكة ستار`
    const price = getDisplayPrice(product)
    const priceText = price > 0 ? ` - السعر: ${formatCurrencyEGP(price)}` : ''
    
    console.log('Sharing product:', product.Name, 'Image:', product.ImageURL, 'URL:', url)
    
    try {
      // للموبايل: استخدام Web Share API مع URL فقط (الصور ستظهر من Open Graph)
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        const shareData: ShareData = {
          title: product.Name,
          text: `${productText}${priceText}`,
          url
        }
        
        console.log('Using Web Share API with data:', shareData)
        await navigator.share(shareData)
        return
      }
      
      // للكمبيوتر: فتح نافذة مشاركة مع صور المنتج
      const shareWindow = window.open('', '_blank', 'width=500,height=600')
      
      if (shareWindow) {
        shareWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>مشاركة ${product.Name}</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
              }
              .container { 
                background: white; 
                color: #333; 
                padding: 30px; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                max-width: 400px;
                margin: 0 auto;
              }
              .product-image { 
                width: 200px; 
                height: 200px; 
                object-fit: cover; 
                border-radius: 10px; 
                margin-bottom: 20px;
                border: 3px solid #f0f0f0;
              }
              .product-name { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px; 
                color: #2d3748;
              }
              .product-description { 
                font-size: 16px; 
                color: #666; 
                margin-bottom: 15px; 
                line-height: 1.5;
              }
              .product-price { 
                font-size: 20px; 
                font-weight: bold; 
                color: #e53e3e; 
                margin-bottom: 20px;
              }
              .share-buttons { 
                display: flex; 
                gap: 10px; 
                justify-content: center; 
                flex-wrap: wrap;
              }
              .share-btn { 
                padding: 10px 20px; 
                border: none; 
                border-radius: 25px; 
                cursor: pointer; 
                font-weight: bold; 
                text-decoration: none; 
                display: inline-block;
                transition: all 0.3s ease;
              }
              .whatsapp { background: #25D366; color: white; }
              .facebook { background: #1877F2; color: white; }
              .twitter { background: #1DA1F2; color: white; }
              .telegram { background: #0088cc; color: white; }
              .copy-link { background: #6B7280; color: white; }
              .share-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
              .url-input { 
                width: 100%; 
                padding: 10px; 
                border: 2px solid #e2e8f0; 
                border-radius: 8px; 
                margin-bottom: 20px; 
                font-size: 14px;
              }
              .brand { 
                margin-top: 20px; 
                font-size: 14px; 
                color: #888; 
                border-top: 1px solid #e2e8f0; 
                padding-top: 15px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              ${product.ImageURL ? `<img src="${product.ImageURL}" alt="${product.Name}" class="product-image" />` : ''}
              <div class="product-name">${product.Name}</div>
              <div class="product-description">${productText}</div>
              ${price > 0 ? `<div class="product-price">${formatCurrencyEGP(price)}</div>` : ''}
              
              <input type="text" value="${url}" class="url-input" readonly />
              
              <div class="share-buttons">
                <a href="https://wa.me/?text=${encodeURIComponent(`${product.Name} - ${productText}${priceText}\\n\\n${url}`)}" target="_blank" class="share-btn whatsapp">واتساب</a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="share-btn facebook">فيسبوك</a>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`${product.Name} - ${productText}${priceText}`)}&url=${encodeURIComponent(url)}" target="_blank" class="share-btn twitter">تويتر</a>
                <a href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${product.Name} - ${productText}${priceText}`)}" target="_blank" class="share-btn telegram">تيليجرام</a>
                <button onclick="navigator.clipboard.writeText('${url}').then(() => alert('تم نسخ الرابط!'))" class="share-btn copy-link">نسخ الرابط</button>
              </div>
              
              <div class="brand">مكة ستار - اكتشف الأناقة العصرية</div>
            </div>
          </body>
          </html>
        `)
        shareWindow.document.close()
        return
      }
      
      // نسخ الرابط كخطة بديلة
      await navigator.clipboard.writeText(url)
      alert('تم نسخ رابط المنتج للحافظة')
    } catch (error: any) {
      // إلغاء المستخدم لا يُعد خطأ
      if (error && (error.name === 'AbortError' || error.message?.includes('AbortError'))) {
        return
      }
      console.error('Error sharing:', error)
      try {
        await navigator.clipboard.writeText(url)
        alert('تم نسخ رابط المنتج للحافظة')
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError)
        alert('حدث خطأ في المشاركة')
      }
    } finally {
      setTimeout(() => setIsSharing(false), 800)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={shareProduct}
      disabled={isSharing}
      className={`${className} ${isSharing ? 'animate-pulse' : ''}`}
      title="مشاركة المنتج"
    >
      <Share2 className={`w-3 h-3 md:w-4 md:h-4 ${isSharing ? 'animate-pulse' : ''}`} />
      {showText && <span className="mr-2">مشاركة</span>}
    </Button>
  )
}
