import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تنسيق العملة بالجنيه المصري
 * @param amount المبلغ
 * @param showCurrency إظهار رمز العملة
 * @returns النص المنسق
 */
export function formatCurrency(amount: number, showCurrency: boolean = true): string {
  const formattedAmount = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  
  return showCurrency ? `${formattedAmount} ج.م` : formattedAmount
}

/**
 * تنسيق العملة بالجنيه المصري مع إمكانية إخفاء الكسور العشرية
 * @param amount المبلغ
 * @param showDecimals إظهار الكسور العشرية
 * @param showCurrency إظهار رمز العملة
 * @returns النص المنسق
 */
export function formatCurrencyEGP(amount: number, showDecimals: boolean = true, showCurrency: boolean = true): string {
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }
  
  const formattedAmount = new Intl.NumberFormat('ar-EG', options).format(amount)
  
  return showCurrency ? `${formattedAmount} ج.م` : formattedAmount
}
