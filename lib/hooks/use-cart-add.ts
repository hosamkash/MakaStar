"use client"

import { useCart } from '@/lib/contexts/cart-context'
import { useCartAddDialog } from '@/lib/contexts/cart-add-dialog-context'

export function useCartAdd() {
  const { addToCart } = useCart()
  const { showAddSuccessDialog } = useCartAddDialog()

  const addToCartWithDialog = async (product: any, quantity: number = 1) => {
    try {
      // إضافة المنتج للسلة
      await addToCart(product, quantity)
      
      // إظهار ديالوج النجاح
      showAddSuccessDialog(product)
    } catch (error) {
      console.error('Error adding to cart with dialog:', error)
      throw error
    }
  }

  return {
    addToCartWithDialog
  }
}
