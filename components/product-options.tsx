"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { formatCurrencyEGP } from "@/lib/utils"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ProductOptionsProps {
  product: any
  className?: string
  onChange?: (state: {
    selectedColor: string | null
    selectedSize: string | null
    currentPrice: number
    notes: string
    imageOverrideUrl: string | null
    selectedColorHex: string
  }) => void
}

export default function ProductOptions({ product, className = "", onChange }: ProductOptionsProps) {
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [colorHexByName, setColorHexByName] = useState<Record<string, string>>({})
  const [colorToVariantImage, setColorToVariantImage] = useState<Record<string, string>>({})
  const [colorSizeToPrice, setColorSizeToPrice] = useState<Record<string, number>>({})
  const [imageOverrideUrl, setImageOverrideUrl] = useState<string | null>(null)
  const [sizeToFitting, setSizeToFitting] = useState<Record<string, string>>({})
  const [colorSizeToFitting, setColorSizeToFitting] = useState<Record<string, string>>({})

  const getDisplayPrice = (p: any) => {
    if (!p) return 0
    if (p.ShopPrice && p.ShopPrice > 0) return p.ShopPrice
    if (p.UnitSmall_Sales1 && p.UnitSmall_Sales1 > 0) return p.UnitSmall_Sales1
    if (p.UnitBig_Sales1 && p.UnitBig_Sales1 > 0) return p.UnitBig_Sales1
    return p.SalesPrice || 0
  }

  const getOriginalPrice = (p: any) => {
    if (!p) return 0
    if (p.ShopPriceBeforDiscount && p.ShopPriceBeforDiscount > 0) return p.ShopPriceBeforDiscount
    return getDisplayPrice(p)
  }

  const currentPrice = useMemo(() => {
    if (product && selectedColor && selectedSize) {
      const key = `${selectedColor}__${selectedSize}`
      const price = colorSizeToPrice[key]
      if (price && price > 0) return price
    }
    return getDisplayPrice(product)
  }, [product, selectedColor, selectedSize, colorSizeToPrice])

  const originalPrice = useMemo(() => getOriginalPrice(product), [product])

  const notes = useMemo(() => {
    const parts: string[] = []
    if (selectedColor) parts.push(`اللون: ${selectedColor}`)
    if (selectedSize) parts.push(`المقاس: ${selectedSize}`)
    return parts.join(" | ")
  }, [selectedColor, selectedSize])

  useEffect(() => {
    const load = async () => {
      try {
        const productID = product?.ID || product?.IDProduct
        let colors: string[] = []
        let sizes: string[] = []
        const priceMap: Record<string, number> = {}
        const colorImageMap: Record<string, string> = {}
        const sizeFit: Record<string, string> = {}
        const colorSizeFit: Record<string, string> = {}

        if (productID) {
          const variantsCol = collection(db, "Def_ProductStructure", String(productID), "Variants")
          const snap = await getDocs(variantsCol)
          const colorsSet = new Set<string>()
          const sizesSet = new Set<string>()
          snap.docs.forEach(d => {
            const v: any = d.data()
            const c = String(v?.Color?.Name || '').trim()
            const s = String(v?.Size?.Name || '').trim()
            if (c) colorsSet.add(c)
            if (s) sizesSet.add(s)
            const priceNum = Number(v?.Price) || 0
            if (c && s && priceNum > 0) priceMap[`${c}__${s}`] = priceNum
            if (c && v?.ImageURL) colorImageMap[c] = v.ImageURL
            const fit = String(v?.Fitting || '').trim()
            if (s && fit && !sizeFit[s]) sizeFit[s] = fit
            if (c && s && fit) colorSizeFit[`${c}__${s}`] = fit
          })
          colors = Array.from(colorsSet)
          sizes = Array.from(sizesSet)
        }

        if (colors.length === 0) {
          colors = String(product?.ShopColors || '').split(',').map((s: string) => s.trim()).filter(Boolean)
        }
        if (sizes.length === 0) {
          sizes = String(product?.ShopSizes || '').split(',').map((s: string) => s.trim()).filter(Boolean)
        }

        setAvailableColors(colors)
        setAvailableSizes(sizes)
        setColorSizeToPrice(priceMap)
        setColorToVariantImage(colorImageMap)
        setSizeToFitting(sizeFit)
        setColorSizeToFitting(colorSizeFit)

        // اختيار افتراضي متناسق مع الصورة
        if (colors.length && !selectedColor) {
          setSelectedColor(colors[0])
          const firstColorUrl = colorImageMap[colors[0]]
          if (firstColorUrl) setImageOverrideUrl(firstColorUrl)
        }
        if (sizes.length && !selectedSize) setSelectedSize(sizes[0])
      } catch {}
    }
    load()
  }, [product])

  useEffect(() => {
    const loadColorDefs = async () => {
      try {
        const colorsCol = collection(db, "Def_Colors")
        const snap = await getDocs(colorsCol)
        const map: Record<string, string> = {}
        snap.docs.forEach(d => {
          const data: any = d.data()
          if (data?.Name && data?.ColorHex) map[data.Name] = data.ColorHex
        })
        setColorHexByName(map)
      } catch {}
    }
    loadColorDefs()
  }, [])

  useEffect(() => {
    if (onChange) {
      onChange({
        selectedColor,
        selectedSize,
        currentPrice,
        notes,
        imageOverrideUrl,
        selectedColorHex: selectedColor ? (colorHexByName[selectedColor] || '') : ''
      })
    }
  }, [selectedColor, selectedSize, currentPrice, notes, imageOverrideUrl, onChange])

  return (
    <div className={className}>
      {(availableColors.length > 0 || availableSizes.length > 0) && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">الخيارات</h3>
          {availableColors.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-2 text-right">اللون</div>
              <div className="flex flex-wrap gap-2 justify-start">
                {availableColors.map((name) => {
                  const isActive = selectedColor === name
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        setSelectedColor(name)
                        const url = colorToVariantImage[name]
                        if (url && typeof url === 'string') {
                          setImageOverrideUrl(url)
                        } else {
                          setImageOverrideUrl(null)
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                      title={name}
                    >
                      <span className="inline-block w-5 h-5 rounded-full border" style={{ backgroundColor: colorHexByName[name] || '#e5e7eb' }} />
                      <span className="text-sm">{name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {availableSizes.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-2 text-right">المقاس</div>
              <div className="flex flex-wrap gap-2 justify-start">
                {availableSizes.map((size) => {
                  const isActive = selectedSize === size
                  const fitKey = selectedColor ? `${selectedColor}__${size}` : ''
                  const fit = colorSizeToFitting[fitKey] || sizeToFitting[size] || ''
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-md border text-sm transition ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                    >
                      ({size}) {fit}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2 text-right">الأسعار</h3>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700 font-semibold text-sm">السعر الحالي:</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrencyEGP(currentPrice)}
            </span>
          </div>

          {originalPrice > currentPrice && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 text-sm">السعر قبل الخصم:</span>
              <span className="font-semibold text-gray-500 line-through text-sm">
                {formatCurrencyEGP(originalPrice)}
              </span>
            </div>
          )}

          {(originalPrice - currentPrice) > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 text-sm">قيمة الخصم:</span>
              <span className="font-semibold text-green-600 text-sm">
                {formatCurrencyEGP(Math.max(0, originalPrice - currentPrice))}
              </span>
            </div>
          )}

          {(originalPrice - currentPrice) > 0 && (
            <div className="flex items-center justify_between">
              <span className="text-green-700 text-sm">نسبة الخصم:</span>
              <Badge className="bg-green-100 text-green-800 text-xs">
                {Math.round(((originalPrice - currentPrice) / Math.max(1, originalPrice)) * 100)}%
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


