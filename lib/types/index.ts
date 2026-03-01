// Product interface
export interface Product {
  id?: string
  ID?: number
  BarCode?: number
  IDProduct?: number
  Name?: string
  IDCategory?: number
  IDProductionCompany?: number
  UnitID?: number
  PurchasePrice?: number
  Qty?: number
  PriceBeforDiscount?: number
  DiscountValue?: number
  DiscountPercent?: number
  SalesPrice?: number
  SalesPrice1?: number
  SalesPrice2?: number
  ShopSalesPrice?: number
  ShopPriceBeforDiscount?: number
  ShopDiscountPercent?: number
  TotalPriceBeforDiscount?: number
  TotalDiscountValue?: number
  TotalSalesPrice?: number
  ProfitValue?: number
  TotalProfitValue?: number
  ShopColors?: string
  ShopSizes?: string
  ShopShortDiscription?: string
  ShopLongDiscription?: string
  ImageName?: string
  ImageURL?: string
  ImageFolderPath?: string
  Notes?: string
  UserID?: number
  UID?: string
  DefaultSalesCommission?: number
  IsActive?: boolean
  IsFavoritClientTemp?: boolean
}

// Category interface
export interface Category {
  id?: string
  ID?: number
  Name?: string
  IsActive?: boolean
}

// Re-export other types
export * from './offers'
export * from './screen-settings'
export * from './geographic-locations'
