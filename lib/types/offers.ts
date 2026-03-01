// أنواع البيانات للعروض
export interface Offer {
  ID?: number
  Code?: number
  Name: string
  ShortDiscription?: string
  LongDescription?: string
  IsActive?: boolean
  IsBindShop?: boolean
  IsBindShopMaster?: boolean
  ImageName?: string
  ImageURL?: string
  TotalValue?: number
  TotalValueAfterOffer?: number
  ProductsCount?: number
  DefaultSalesCommission?: number
}

// نوع بيانات منتج في العرض
export interface OfferProduct {
  ID?: number
  IDOffer: number
  IDProduct: number
  ProductName?: string
  ProductImageURL?: string
  OriginalPrice?: number
  OfferPrice?: number
  Quantity?: number
  IsActive?: boolean
}

// نوع بيانات كامل للعرض مع منتجاته
export interface OfferWithProducts extends Offer {
  products: OfferProduct[]
}
