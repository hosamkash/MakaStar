"use client";

import { useCartAddDialog } from "@/lib/contexts/cart-add-dialog-context";
import CartSummaryDialog from "./cart-summary-dialog";

export default function CartAddDialogWrapper() {
  const { isDialogOpen, addedProduct, hideAddSuccessDialog } =
    useCartAddDialog();

  return (
    <CartSummaryDialog
      isOpen={isDialogOpen}
      onClose={hideAddSuccessDialog}
      showSuccessMessage={true}
    />
  );
}
