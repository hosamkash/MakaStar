"use client"

import React, { createContext, useContext, useState } from 'react'

interface CartAddDialogContextType {
  isDialogOpen: boolean
  addedProduct: any | null
  showAddSuccessDialog: (product: any) => void
  hideAddSuccessDialog: () => void
}

const CartAddDialogContext = createContext<CartAddDialogContextType | undefined>(undefined)

export const CartAddDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [addedProduct, setAddedProduct] = useState<any | null>(null)

  const showAddSuccessDialog = (product: any) => {
    setAddedProduct(product)
    setIsDialogOpen(true)
  }

  const hideAddSuccessDialog = () => {
    setIsDialogOpen(false)
    setAddedProduct(null)
  }

  const value: CartAddDialogContextType = {
    isDialogOpen,
    addedProduct,
    showAddSuccessDialog,
    hideAddSuccessDialog,
  }

  return (
    <CartAddDialogContext.Provider value={value}>
      {children}
    </CartAddDialogContext.Provider>
  )
}

export const useCartAddDialog = () => {
  const context = useContext(CartAddDialogContext)
  if (context === undefined) {
    throw new Error('useCartAddDialog must be used within a CartAddDialogProvider')
  }
  return context
}
