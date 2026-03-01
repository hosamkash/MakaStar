"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useCart } from "@/lib/contexts/cart-context"

interface ProductCardSimpleProps {
  product: {
    id: string
    name: string
    category: string
    price: string
    image: string
  }
}

export default function ProductCardSimple({ product }: ProductCardSimpleProps) {
  const { addToCart, isInCart } = useCart()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="relative flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group h-full max-w-sm mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-48 sm:h-52 md:h-56 lg:h-64 overflow-hidden bg-gray-100">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className={cn(
            "object-contain transition-transform duration-300",
            isHovered ? "scale-105" : "scale-100",
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <Badge className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-primary text-primary-foreground rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium">
          {product.category}
        </Badge>
      </div>
      <CardHeader className="p-3 sm:p-4 pb-2">
        <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-primary-dark dark:text-foreground truncate">
          {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 flex-grow flex flex-col justify-between">
        <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary mb-3 sm:mb-4">{product.price}</span>
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 sm:py-2.5 rounded-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors"
          onClick={() => addToCart(product)}
          disabled={isInCart(product.id)}
        >
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          {isInCart(product.id) ? "مضاف للسلة" : "أضف إلى السلة"}
        </Button>
      </CardContent>
    </Card>
  )
}
