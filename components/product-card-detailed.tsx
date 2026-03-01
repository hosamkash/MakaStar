"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, ShoppingCart, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ProductCardDetailedProps {
  product: {
    id: string
    name: string
    category: string
    rating: number
    reviews: number
    description: string
    price: string
    availability: "متوفر" | "غير متوفر"
    tags: string[]
    image: string
  }
}

export default function ProductCardDetailed({ product }: ProductCardDetailedProps) {
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
        <Badge className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-primary text-primary-foreground rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium">
          {product.category}
        </Badge>
        <div
          className={cn(
            "absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center gap-2 sm:gap-3 transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <Button variant="secondary" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">إعجاب</span>
          </Button>
          <Button variant="secondary" className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            عرض التفاصيل
          </Button>
        </div>
      </div>
      <CardHeader className="p-3 sm:p-4 pb-2">
        <CardTitle className="text-base sm:text-lg font-semibold text-primary-dark dark:text-foreground truncate">
          {product.name}
        </CardTitle>
        <div className="flex items-center gap-1 text-xs sm:text-sm text-neutral-medium dark:text-muted-foreground">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn("h-3 w-3 sm:h-4 sm:w-4", i < product.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300")}
            />
          ))}
          <span className="ml-1">({product.rating.toFixed(1)})</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 flex-grow flex flex-col justify-between">
        <CardDescription className="text-xs sm:text-sm text-neutral-medium dark:text-muted-foreground mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
          {product.description}
        </CardDescription>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{product.price}</span>
          <Badge
            className={cn(
              "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium",
              product.availability === "متوفر" ? "bg-green-500 text-white" : "bg-red-500 text-white",
            )}
          >
            {product.availability}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
          {product.tags.slice(0, 3).map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs text-neutral-medium dark:text-muted-foreground border-neutral-300 dark:border-primary-dark px-2 py-0.5"
            >
              {tag}
            </Badge>
          ))}
          {product.tags.length > 3 && (
            <Badge
              variant="outline"
              className="text-xs text-neutral-medium dark:text-muted-foreground border-neutral-300 dark:border-primary-dark px-2 py-0.5"
            >
              +{product.tags.length - 3}
            </Badge>
          )}
        </div>
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 sm:py-2.5 rounded-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors">
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          استفسر عن المنتج
        </Button>
      </CardContent>
    </Card>
  )
}
