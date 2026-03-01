"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/contexts/cart-context";
import { useCartAddDialog } from "@/lib/contexts/cart-add-dialog-context";
import CartSummaryDialog from "./cart-summary-dialog";

export default function CartAddManager() {
  const { state: cartState } = useCart();
  const { isDialogOpen, addedProduct, hideAddSuccessDialog } =
    useCartAddDialog();

  // مراقبة التغييرات في السلة لإظهار الديالوج
  useEffect(() => {
    // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
  }, [cartState.items]);

  return (
    <CartSummaryDialog
      isOpen={isDialogOpen}
      onClose={hideAddSuccessDialog}
      showSuccessMessage={true}
    />
  );
}
