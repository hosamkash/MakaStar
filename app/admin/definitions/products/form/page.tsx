"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { collection, doc, getDocs, getDoc, setDoc, query, orderBy, limit, where, deleteDoc, addDoc } from "firebase/firestore"
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { validateCodeWithMessage, DEFINITION_COLLECTIONS } from '@/lib/utils/code-validation'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Save, Printer, ArrowLeft, Grid, Upload, Trash, Image as ImageIcon, Wand2, ExternalLink, Video, Info, Search, Youtube, Instagram, Facebook, Twitter, Linkedin, Globe, MessageCircle, Send } from "lucide-react"
import PageHeader from "@/components/page-header"
import ImageAlbumUploader from "@/components/image-album-uploader"
import { notify } from "@/lib/notifications"

type Category = {
  ID: number
  Code: number
  Name: string
}

type Unit = {
  ID: number
  Name: string
}

type Product = {
  ID: number
  BarCode: number
  Name: string
  IDCategory: number
  IDProductionCompany: number
  UnitBig_ID: number
  UnitBig_PurchasePrice: number
  UnitBig_Sales1: number
  UnitBig_Sales2: number
  UnitBig_Sales3: number
  UnitBig_Sales4: number
  UnitBig_Sales5: number
  UnitCountOf: number
  UnitSmall_ID: number
  UnitSmall_PurchasePrice: number
  UnitSmall_Sales1: number
  UnitSmall_Sales2: number
  UnitSmall_Sales3: number
  UnitSmall_Sales4: number
  UnitSmall_Sales5: number
  LimitedQty: number
  IsActive: boolean
  IsPOS: boolean
  IsShop: boolean
  IsShopUnavailable?: boolean
  IsUpdated: boolean
  ImageName: string
  ImageURL: string
  ImageFolderPath: string
  ShopPriceBeforDiscount: number
  ShopDiscountValue: number
  ShopDiscountPercent: number
  ShopPrice: number
  ShopColors: string
  ShopSizes: string
  ShopShortDiscription: string
  ShopLongDiscription: string
  ShopLink1: string
  ShopLink2: string
  ShopLink3: string
  ShopLink4: string
  ShopLink5: string
  ShopVideoEmbed: string
  IsFavoritClientTemp: boolean
  SalesComission_PurchasePrice: number
  SalesComission_Sales1: number
  SalesComission_Sales2: number
  SalesComission_Sales3: number
  SalesComission_Sales4: number
  SalesComission_Sales5: number
  AdminComission_PurchasePrice: number
  AdminComission_Sales1: number
  AdminComission_Sales2: number
  AdminComission_Sales3: number
  AdminComission_Sales4: number
  AdminComission_Sales5: number
  DefaultSalesCommission: number
  LinkPlatforms?: {
    link1: string
    link2: string
    link3: string
    link4: string
    link5: string
    video: string
  }
}

type ColorDef = {
  ID: number
  Name: string
  ColorHex?: string
}

type SizeDef = {
  ID: number
  Name: string
}

type ProductCategory = {
  ID: string
  IDProductStructure: number
  IDCategory: number
  IsChecked: boolean
}

// أضف هذا النوع الجديد في بداية الملف بعد التعريفات الموجودة
type GalleryImage = {
  id: string
  name: string
  url: string
}

const PriceInput = ({ 
  label, 
  name, 
  value, 
  onChange 
}: { 
  label: string
  name: string
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
  <div className="flex items-center gap-1 flex-row-reverse">
    <Label className="text-lg font-medium min-w-16">{label}</Label>
    <Input
      name={name}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value || ""}
      onChange={onChange}
      className="text-center text-lg flex-1"
    />
  </div>
)

const PriceRow = ({ 
  title, 
  prefix,
  formData,
  onChange
}: { 
  title: string
  prefix: string
  formData: Product
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const priceTypes = [
    { name: 'PurchasePrice', label: 'شراء' },
    { name: 'Sales1', label: 'بيع 1' },
    { name: 'Sales2', label: 'بيع 2' },
    { name: 'Sales3', label: 'بيع 3' },
    { name: 'Sales4', label: 'بيع 4' },
    { name: 'Sales5', label: 'بيع 5' }
  ]

  return (
    <div className="border rounded-lg p-2 w-full">
      <h4 className="text-center font-semibold mb-2 text-sm">{title}</h4>
      <div className="grid gap-1">
        {priceTypes.map(type => {
          const value = formData[`${prefix}_${type.name}` as keyof Product]
          return (
            <div key={type.name} className="flex items-center gap-1 flex-row-reverse">
              <Label className="text-xs font-medium min-w-12">{type.label}</Label>
              <Input
                name={`${prefix}_${type.name}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={typeof value === 'number' ? value : 0}
                onChange={onChange}
                className="text-center text-xs h-6 flex-1"
                placeholder="0"
                readOnly={false}
                disabled={false}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const StoreTabContent = ({ formData, onChange, onCheckboxChange }: { formData: Product, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, onCheckboxChange: (name: string, checked: boolean) => void }) => {
  const generateDescription = async () => {
    alert("تم تعطيل توليد الوصف الذكي مؤقتاً")
  }

  return (
    <Card>
      <CardContent className="p-2 sm:p-4 space-y-3">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Checkbox 
            id="IsShopUnavailable"
            checked={!!formData.IsShopUnavailable}
            onCheckedChange={(checked) => onCheckboxChange("IsShopUnavailable", checked === true)}
            className="h-4 w-4"
          />
          <Label htmlFor="IsShopUnavailable" className="text-sm">غير متوفر بالمتجر</Label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="ShopPriceBeforDiscount" className="text-sm">السعر قبل الخصم</Label>
            <Input 
              id="ShopPriceBeforDiscount"
              name="ShopPriceBeforDiscount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.ShopPriceBeforDiscount || ""}
              onChange={onChange}
              className="text-center h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ShopDiscountValue" className="text-sm">قيمة الخصم</Label>
            <Input 
              id="ShopDiscountValue"
              name="ShopDiscountValue"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.ShopDiscountValue || ""}
              onChange={onChange}
              className="text-center h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ShopDiscountPercent" className="text-sm">نسبة الخصم</Label>
            <Input 
              id="ShopDiscountPercent"
              name="ShopDiscountPercent"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.ShopDiscountPercent || ""}
              onChange={onChange}
              className="text-center h-8 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="ShopPrice" className="text-sm">السعر النهائي</Label>
            <Input 
              id="ShopPrice"
              name="ShopPrice"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.ShopPrice || ""}
              onChange={onChange}
              className="text-center h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="DefaultSalesCommission" className="text-sm">عمولة المندوب (افتراضي)</Label>
            <Input 
              id="DefaultSalesCommission"
              name="DefaultSalesCommission"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.DefaultSalesCommission || 0}
              onChange={onChange}
              className="text-center h-8 text-sm"
              placeholder="0"
              readOnly={false}
              disabled={false}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="ShopColors" className="text-sm">الألوان</Label>
            <Input 
              id="ShopColors"
              name="ShopColors"
              value={formData.ShopColors || ""}
              onChange={onChange}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ShopSizes" className="text-sm">المقاسات</Label>
            <Input 
              id="ShopSizes"
              name="ShopSizes"
              value={formData.ShopSizes || ""}
              onChange={onChange}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="ShopShortDiscription" className="text-sm">الوصف المختصر</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={generateDescription}
              className="gap-1 h-7 text-xs"
            >
              <Wand2 className="h-3 w-3" />
              توليد وصف ذكي
            </Button>
          </div>
          <Input 
            id="ShopShortDiscription"
            name="ShopShortDiscription"
            value={formData.ShopShortDiscription || ""}
            onChange={onChange}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="ShopLongDiscription" className="text-sm">الوصف التفصيلي</Label>
          <Textarea 
            id="ShopLongDiscription"
            name="ShopLongDiscription"
            value={formData.ShopLongDiscription || ""}
            onChange={onChange}
            rows={3}
            className="text-sm"
          />
        </div>

        {/* ملاحظة للروابط */}
        <div className="space-y-3">
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="font-medium">روابط المنتج</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              يمكنك إدارة روابط المنتج من tab "الروابط" مع إمكانية اختيار منصة كل رابط
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// تعريف التصنيفات الإضافية
const additionalCategories = [
  { id: "all", label: "كل الاصناف", checked: true },
  { id: "pajamas", label: "بجامات صيفي" },
  { id: "abayas", label: "عبايات صيفي", checked: true },
  { id: "kaftans", label: "كاشات قطن", checked: true },
  { id: "bridal", label: "منتجات عرايس" },
  { id: "lingerie", label: "منتجات داخلية" },
  { id: "girls", label: "بناتي صيفي" },
  { id: "boys", label: "اولادي صيفي" },
  { id: "men", label: "منتجات رجالي" },
]

const CategoriesTabContent = () => (
  <Card>
    <CardContent className="p-4">
      <div className="space-y-2">
        {additionalCategories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2 space-x-reverse">
            <Checkbox id={category.id} defaultChecked={category.checked} className="h-4 w-4" />
            <Label htmlFor={category.id} className="text-sm">
              {category.label}
            </Label>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const ItemCategoriesTabContent = ({ 
  formData,
  categories,
  selectedCategories,
  onCategoryChange 
}: { 
  formData: Product
  categories: Category[]
  selectedCategories: ProductCategory[]
  onCategoryChange: (categoryId: number, isChecked: boolean) => void
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  
  // إضافة التصنيف الرئيسي إلى القائمة إذا لم يكن موجوداً
  const mainCategory = categories.find(cat => cat.ID === formData.IDCategory)
  const isMainCategorySelected = selectedCategories.some(sc => sc.IDCategory === formData.IDCategory)

  // فلترة التصنيفات حسب البحث
  const filteredCategories = categories.filter(cat => 
    cat.ID !== formData.IDCategory && 
    cat.Name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardContent className="p-2 sm:p-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold mb-2">تصنيفات الأصناف</h3>
          
          {/* مربع البحث */}
          <div className="relative">
            <Input
              type="text"
              placeholder="ابحث في التصنيفات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-8 text-sm"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {/* التصنيف الرئيسي - مع تمييز خاص */}
            {mainCategory && (
              <div className="flex items-center space-x-2 rtl:space-x-reverse bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                <Checkbox 
                  id={`cat-main-${mainCategory.ID}`}
                  checked={isMainCategorySelected}
                  onCheckedChange={(checked) => onCategoryChange(mainCategory.ID, checked === true)}
                  className="h-4 w-4"
                />
                <Label htmlFor={`cat-main-${mainCategory.ID}`} className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {mainCategory.Name} (التصنيف الرئيسي)
                </Label>
              </div>
            )}
            
            {/* باقي التصنيفات المفلترة */}
            {filteredCategories.map((category) => {
              const isSelected = selectedCategories.some(sc => sc.IDCategory === category.ID)
              return (
                <div key={category.ID} className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox 
                    id={`cat-${category.ID}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => onCategoryChange(category.ID, checked === true)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`cat-${category.ID}`} className="text-sm">
                    {category.Name}
                  </Label>
                </div>
              )
            })}
            
            {/* رسالة عند عدم وجود نتائج */}
            {searchTerm && filteredCategories.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <p className="text-sm">لا توجد تصنيفات تطابق البحث</p>
              </div>
            )}
          </div>
          
          {/* إحصائيات */}
          <div className="text-xs text-gray-500 border-t pt-2">
            <p>إجمالي التصنيفات: {categories.length}</p>
            <p>المحددة: {selectedCategories.length}</p>
            {searchTerm && <p>نتائج البحث: {filteredCategories.length}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ItemDataForm = ({ 
  formData, 
  categories, 
  units, 
  handleInputChange, 
  handleSelectChange, 
  handleCheckboxChange
}: { 
  formData: Product
  categories: Category[]
  units: Unit[]
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSelectChange: (name: string, value: string) => void
  handleCheckboxChange: (name: string, checked: boolean) => void
}) => (
  <div className="grid gap-3">
    {/* البيانات الأساسية */}
    <div className="grid gap-3">
      {/* الباركود والتصنيف */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="BarCode" className="min-w-20 text-sm">الباركود</Label>
          <div className="flex gap-1 flex-1">
            <Input 
              id="BarCode"
              name="BarCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.BarCode || ""}
              onChange={handleInputChange}
              className="flex-1 h-8 text-sm"
            />
            <Button variant="outline" size="sm" className="h-8 w-8">
              <Grid className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="IDCategory" className="min-w-20 text-sm">التصنيف</Label>
          <div className="flex-1">
            <Select 
              value={String(formData.IDCategory)} 
              onValueChange={(value) => handleSelectChange("IDCategory", value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.ID} value={String(category.ID)}>
                    {category.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* الاسم */}
      <div className="flex items-center gap-2">
        <Label htmlFor="Name" className="min-w-20 text-sm">الإسم</Label>
        <Input 
          id="Name"
          name="Name"
          value={formData.Name}
          onChange={handleInputChange}
          className="flex-1 h-8 text-sm"
        />
      </div>

      {/* الخيارات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Checkbox 
            id="IsActive"
            checked={formData.IsActive}
            onCheckedChange={(checked) => handleCheckboxChange("IsActive", checked === true)}
            className="h-4 w-4"
          />
          <Label htmlFor="IsActive" className="text-sm">نشط</Label>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Checkbox 
            id="IsPOS"
            checked={formData.IsPOS}
            onCheckedChange={(checked) => handleCheckboxChange("IsPOS", checked === true)}
            className="h-4 w-4"
          />
          <Label htmlFor="IsPOS" className="text-sm">يعرض في POS</Label>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Checkbox 
            id="IsShop"
            checked={formData.IsShop}
            onCheckedChange={(checked) => handleCheckboxChange("IsShop", checked === true)}
            className="h-4 w-4"
          />
          <Label htmlFor="IsShop" className="text-sm">مرتبط بالمتجر</Label>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Checkbox 
            id="IsUpdated"
            checked={formData.IsUpdated}
            onCheckedChange={(checked) => handleCheckboxChange("IsUpdated", checked === true)}
            className="h-4 w-4"
          />
          <Label htmlFor="IsUpdated" className="text-sm">تم التعديل</Label>
        </div>
      </div>
    </div>

    {/* الوحدات */}
    <div className="grid gap-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
        <div className="flex items-center gap-2">
          <Label className="min-w-20 text-sm">الوحدة الكبرى</Label>
          <div className="flex-1">
            <Select 
              value={String(formData.UnitBig_ID)}
              onValueChange={(value) => handleSelectChange("UnitBig_ID", value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="اختر الوحدة الكبرى" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.ID} value={String(unit.ID)}>
                    {unit.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <span className="font-bold text-sm">=</span>
          <Input 
            name="UnitCountOf"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.UnitCountOf || ""}
            onChange={handleInputChange}
            className="text-center max-w-[80px] h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="min-w-20 text-sm">الوحدة الصغرى</Label>
          <div className="flex-1">
            <Select 
              value={String(formData.UnitSmall_ID)}
              onValueChange={(value) => handleSelectChange("UnitSmall_ID", value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="اختر الوحدة الصغرى" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.ID} value={String(unit.ID)}>
                    {unit.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* الأسعار */} 
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        <PriceRow 
          title="الوحدة الكبرى"
          prefix="UnitBig"
          formData={formData}
          onChange={handleInputChange}
        />
        <PriceRow 
          title="الوحدة الصغرى"
          prefix="UnitSmall"
          formData={formData}
          onChange={handleInputChange}
        />
        <PriceRow 
          title="عمولة المندوب"
          prefix="SalesComission"
          formData={formData}
          onChange={handleInputChange}
        />
        <PriceRow 
          title="عمولة المدير"
          prefix="AdminComission"
          formData={formData}
          onChange={handleInputChange}
        />
      </div>

      {/* الحد الأدنى */}
      <div className="flex items-center gap-2 max-w-xs mx-auto">
        <Label htmlFor="LimitedQty" className="text-sm">الحد الأدنى للطلب</Label>
        <Input
          id="LimitedQty"
          name="LimitedQty"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formData.LimitedQty || ""}
          onChange={handleInputChange}
          className="text-center h-8 text-sm w-20"
        />
      </div>
    </div>
  </div>
)

export default function ItemFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<Product>({
    ID: 0,
    BarCode: 0,
    Name: "",
    IDCategory: 0,
    IDProductionCompany: 0,
    UnitBig_ID: 0,
    UnitBig_PurchasePrice: 0,
    UnitBig_Sales1: 0,
    UnitBig_Sales2: 0,
    UnitBig_Sales3: 0,
    UnitBig_Sales4: 0,
    UnitBig_Sales5: 0,
    UnitCountOf: 0,
    UnitSmall_ID: 0,
    UnitSmall_PurchasePrice: 0,
    UnitSmall_Sales1: 0,
    UnitSmall_Sales2: 0,
    UnitSmall_Sales3: 0,
    UnitSmall_Sales4: 0,
    UnitSmall_Sales5: 0,
    LimitedQty: 0,
    IsActive: true,
    IsPOS: true,
    IsShop: false,
    IsShopUnavailable: false,
    IsUpdated: false,
    ImageName: "",
    ImageURL: "",
    ImageFolderPath: "",
    ShopPriceBeforDiscount: 0,
    ShopDiscountValue: 0,
    ShopDiscountPercent: 0,
    ShopPrice: 0,
    ShopColors: "",
    ShopSizes: "",
    ShopShortDiscription: "",
    ShopLongDiscription: "",
    ShopLink1: "",
    ShopLink2: "",
    ShopLink3: "",
    ShopLink4: "",
    ShopLink5: "",
    ShopVideoEmbed: "",
    IsFavoritClientTemp: false,
    SalesComission_PurchasePrice: 0,
    SalesComission_Sales1: 0,
    SalesComission_Sales2: 0,
    SalesComission_Sales3: 0,
    SalesComission_Sales4: 0,
    SalesComission_Sales5: 0,
    AdminComission_PurchasePrice: 0,
    AdminComission_Sales1: 0,
    AdminComission_Sales2: 0,
    AdminComission_Sales3: 0,
    AdminComission_Sales4: 0,
    AdminComission_Sales5: 0,
    DefaultSalesCommission: 0
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [colorDefs, setColorDefs] = useState<ColorDef[]>([])
  const [sizeDefs, setSizeDefs] = useState<SizeDef[]>([])
  const [loading, setLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [activeTab, setActiveTab] = useState("data")
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)
  const [defaultsSet, setDefaultsSet] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  
  // Variants (colors & sizes) - تصميم فقط
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([])
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([])
  const [variantValues, setVariantValues] = useState<Record<string, { qty: number; price: number; fitting?: string }>>({})
  const [variantImages, setVariantImages] = useState<Record<string, { url: string; imageName?: string; file?: File; isFromGallery?: boolean }>>({})
  const [excludedPairs, setExcludedPairs] = useState<string[]>([])
  const [isVariantGalleryOpen, setIsVariantGalleryOpen] = useState(false)
  const [activeVariantKeyForGallery, setActiveVariantKeyForGallery] = useState<string | null>(null)
  
  
  // State للقوائم المنسدلة
  const [linkPlatforms, setLinkPlatforms] = useState({
    link1: "youtube",
    link2: "tiktok", 
    link3: "instagram",
    link4: "facebook",
    link5: "twitter",
    video: "youtube"
  })

  // حذف توليفة واحدة مباشرة من فايرستور (مع صورتها إن وجدت)
  const deleteVariantByKey = async (key: string) => {
    try {
      if (!formData.ID) {
        notify.error("يجب حفظ المنتج أولاً")
        return
      }
      const productId = String(formData.ID)
      const variantsCol = collection(db, "Def_ProductStructure", productId, "Variants")
      const variantRef = doc(variantsCol, key)
      let imageNameToRemove = ""
      try {
        const snap = await getDoc(variantRef)
        const data = snap.data() as any
        imageNameToRemove = data?.ImageName || ""
      } catch {}

      await deleteDoc(variantRef)

      // حذف الصورة من التخزين إن وجدت
      if (imageNameToRemove) {
        const filePath = `Application/Def_ProductStructure/${productId}/variants/${imageNameToRemove}`
        try { await deleteObject(ref(storage, filePath)) } catch {}
      }

      // تحديث الحالة المحلية لإخفاء الصف + إعادة تحميل شبكة التوليفات من السحابة لضمان التزامن
      setExcludedPairs(prev => prev.includes(key) ? prev : [...prev, key])
      setVariantImages(prev => { const n = { ...prev }; delete n[key]; return n })
      setVariantValues(prev => { const n: any = { ...prev }; delete n[key]; return n })
      try {
        const variantsColReload = collection(db, "Def_ProductStructure", productId, "Variants")
        const snapReload = await getDocs(variantsColReload)
        // أعد بناء الحالة من الواقع
        const newExcluded: string[] = []
        const newImages: Record<string, { url: string; imageName?: string; isFromGallery?: boolean }> = {}
        const newValues: Record<string, { qty: number; price: number; fitting?: string }> = {}
        snapReload.forEach(d => {
          const v: any = d.data()
          const k = d.id
          newValues[k] = {
            qty: Number(v?.Qty) || 0,
            price: Number(v?.Price) || 0,
            fitting: String(v?.Fitting || '')
          }
          if (v?.ImageURL) newImages[k] = { url: v.ImageURL, imageName: v.ImageName, isFromGallery: true }
        })
        // بعد الحذف: إفراغ الاختيارات والجريد بالكامل
        setSelectedColorIds([])
        setSelectedSizeIds([])
        setExcludedPairs([])
        setVariantImages({})
        setVariantValues({})
      } catch {}
      notify.success("تم حذف التوليفة بنجاح")
    } catch (e) {
      console.error('Delete variant error:', e)
      notify.error("فشل حذف التوليفة")
    }
  }

  // حذف كل التوليفات مباشرة
  const deleteAllVariants = async () => {
    try {
      if (!formData.ID) {
        notify.error("يجب حفظ المنتج أولاً")
        return
      }
      const confirm = window.confirm("هل تريد حذف جميع التوليفات وصورها نهائيًا؟")
      if (!confirm) return
      const productId = String(formData.ID)
      const variantsCol = collection(db, "Def_ProductStructure", productId, "Variants")
      const snap = await getDocs(variantsCol)
      await Promise.all(snap.docs.map(async d => {
        const data = d.data() as any
        try { await deleteDoc(d.ref) } catch {}
        const imageName = data?.ImageName
        if (imageName) {
          const filePath = `Application/Def_ProductStructure/${productId}/variants/${imageName}`
          try { await deleteObject(ref(storage, filePath)) } catch {}
        }
      }))
      // بعد الحذف الجماعي: إفراغ كل الاختيارات والجريد
      setSelectedColorIds([])
      setSelectedSizeIds([])
      setVariantImages({})
      setVariantValues({})
      setExcludedPairs([])
      notify.success("تم حذف جميع التوليفات")
    } catch (e) {
      console.error('Delete all variants error:', e)
      notify.error("فشل حذف جميع التوليفات")
    }
  }

  // حذف كل التوليفات التابعة للون واحد
  const deleteVariantsByColor = async (colorId: number) => {
    try {
      if (!formData.ID) return
      const productId = String(formData.ID)
      const variantsCol = collection(db, "Def_ProductStructure", productId, "Variants")
      const snap = await getDocs(variantsCol)
      const toDelete = snap.docs.filter(d => d.id.startsWith(`${colorId}-`))
      await Promise.all(toDelete.map(async d => {
        const data = d.data() as any
        try { await deleteDoc(d.ref) } catch {}
        const imageName = data?.ImageName
        if (imageName) {
          const filePath = `Application/Def_ProductStructure/${productId}/variants/${imageName}`
          try { await deleteObject(ref(storage, filePath)) } catch {}
        }
      }))
      // حدّث الحالة: أزِل الصفوف المتعلقة بهذا اللون
      setVariantImages(prev => {
        const n: any = { ...prev }
        Object.keys(n).forEach(k => { if (k.startsWith(`${colorId}-`)) delete n[k] })
        return n
      })
      setVariantValues(prev => {
        const n: any = { ...prev }
        Object.keys(n).forEach(k => { if (k.startsWith(`${colorId}-`)) delete n[k] })
        return n
      })
      setExcludedPairs(prev => prev.filter(k => !k.startsWith(`${colorId}-`)))
      notify.success("تم حذف جميع توليفات اللون المختار")
    } catch (e) {
      console.error('Delete variants by color error:', e)
      notify.error("فشل حذف توليفات اللون")
    }
  }

  // تحديث نصوص الألوان والمقاسات لعرضها وحفظها في المتجر تلقائياً
  useEffect(() => {
    try {
      const selectedColorNames = selectedColorIds
        .map(id => colorDefs.find(c => c.ID === id)?.Name)
        .filter((n): n is string => !!n && n.trim().length > 0)
      const selectedSizeNames = selectedSizeIds
        .map(id => sizeDefs.find(s => s.ID === id)?.Name)
        .filter((n): n is string => !!n && n.trim().length > 0)

      const colorsText = selectedColorNames.join(', ')
      const sizesText = selectedSizeNames.join(', ')

      setFormData(prev => ({
        ...prev,
        ShopColors: colorsText,
        ShopSizes: sizesText,
      }))
    } catch {}
  }, [selectedColorIds, selectedSizeIds, colorDefs, sizeDefs])

  // عند إضافة لون/مقاس جديد، عيّن السعر الافتراضي للتوليفة على ShopPrice
  useEffect(() => {
    const allKeys = selectedColorIds
      .flatMap(cid => selectedSizeIds.map(sid => `${cid}-${sid}`))
      .filter(key => !excludedPairs.includes(key))

    setVariantValues(prev => {
      const next = { ...prev }
      for (const key of allKeys) {
        if (!next[key]) {
          next[key] = {
            qty: 0,
            price: Number(formData.ShopPrice) || 0,
            fitting: ''
          }
        }
      }
      return next
    })
  }, [selectedColorIds, selectedSizeIds, excludedPairs, formData.ShopPrice])


  const handlePlatformChange = (linkType: string, platform: string) => {
    setLinkPlatforms(prev => ({
      ...prev,
      [linkType]: platform
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let finalValue: string | number = value

    // إضافة تشخيص لحقول العمولة
    if (name.startsWith('SalesComission') || name.startsWith('AdminComission') || name === 'DefaultSalesCommission') {
      console.log('تحديث حقل العمولة:', name, 'القيمة الجديدة:', value)
      finalValue = parseFloat(value) || 0
    }

    // التعامل مع الحقول الرقمية
    if (name.startsWith('UnitBig_') || name.startsWith('UnitSmall_') || name === 'UnitCountOf') {
      const numValue = parseFloat(value) || 0
      finalValue = numValue

      // حساب القيم المرتبطة
      if (name === 'UnitCountOf' && numValue > 0) {
        const count = numValue
        const priceTypes = ['PurchasePrice', 'Sales1', 'Sales2', 'Sales3', 'Sales4', 'Sales5']
        
        priceTypes.forEach(type => {
          const bigPrice = formData[`UnitBig_${type}` as keyof Product] as number
          setFormData(prev => ({
            ...prev,
            [`UnitSmall_${type}`]: Math.round((bigPrice / count) * 100) / 100
          }))
        })
      } else if (name.startsWith('UnitBig_')) {
        const count = formData.UnitCountOf || 1
        const priceType = name.split('_')[1]
        setFormData(prev => ({
          ...prev,
          [name]: numValue,
          [`UnitSmall_${priceType}`]: Math.round((numValue / count) * 100) / 100
        }))
        return
      } else if (name.startsWith('UnitSmall_')) {
        const count = formData.UnitCountOf || 1
        const priceType = name.split('_')[1]
        setFormData(prev => ({
          ...prev,
          [name]: numValue,
          [`UnitBig_${priceType}`]: Math.round((numValue * count) * 100) / 100
        }))
        return
      }
    }

    // حساب الخصم في المتجر
    if (name === 'ShopPriceBeforDiscount' || name === 'ShopDiscountValue' || name === 'ShopDiscountPercent' || name === 'ShopPrice') {
      const numValue = parseFloat(value) || 0
      finalValue = numValue

      if (name === 'ShopPriceBeforDiscount') {
        // عند تغيير السعر قبل الخصم، إعادة حساب نسبة الخصم والسعر النهائي
        const discountValue = formData.ShopDiscountValue || 0
        const discountPercent = discountValue > 0 ? Math.round((discountValue / numValue) * 100) : 0
        const finalPrice = Math.max(0, numValue - discountValue)
        
        setFormData(prev => ({
          ...prev,
          ShopPriceBeforDiscount: numValue,
          ShopDiscountPercent: discountPercent,
          ShopPrice: finalPrice
        }))
        return
      } else if (name === 'ShopDiscountValue') {
        // عند تغيير قيمة الخصم، إعادة حساب نسبة الخصم والسعر النهائي
        const beforeDiscount = formData.ShopPriceBeforDiscount || 0
        const discountPercent = beforeDiscount > 0 ? Math.round((numValue / beforeDiscount) * 100) : 0
        const finalPrice = Math.max(0, beforeDiscount - numValue)
        
        setFormData(prev => ({
          ...prev,
          ShopDiscountValue: numValue,
          ShopDiscountPercent: discountPercent,
          ShopPrice: finalPrice
        }))
        return
      } else if (name === 'ShopDiscountPercent') {
        // عند تغيير نسبة الخصم، إعادة حساب قيمة الخصم والسعر النهائي
        const beforeDiscount = formData.ShopPriceBeforDiscount || 0
        const discountValue = Math.round((numValue / 100) * beforeDiscount)
        const finalPrice = Math.max(0, beforeDiscount - discountValue)
        
        setFormData(prev => ({
          ...prev,
          ShopDiscountPercent: numValue,
          ShopDiscountValue: discountValue,
          ShopPrice: finalPrice
        }))
        return
      } else if (name === 'ShopPrice') {
        // عند تغيير السعر النهائي، إعادة حساب قيمة الخصم ونسبة الخصم
        const beforeDiscount = formData.ShopPriceBeforDiscount || 0
        const discountValue = Math.max(0, beforeDiscount - numValue)
        const discountPercent = beforeDiscount > 0 ? Math.round((discountValue / beforeDiscount) * 100) : 0
        
        setFormData(prev => ({
          ...prev,
          ShopPrice: numValue,
          ShopDiscountValue: discountValue,
          ShopDiscountPercent: discountPercent
        }))
        return
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  const handleUnitCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value) || 0
    setFormData(prev => ({ ...prev, UnitCountOf: newCount }))

    // إعادة حساب أسعار الوحدة الصغرى
    if (newCount > 0) {
      const priceTypes = ['PurchasePrice', 'Sales1', 'Sales2', 'Sales3', 'Sales4', 'Sales5']
      priceTypes.forEach(type => {
        const bigPrice = formData[`UnitBig_${type}` as keyof Product] as number
        setFormData(prev => ({
          ...prev,
          [`UnitSmall_${type}`]: Math.round((bigPrice / newCount) * 100) / 100
        }))
      })
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // تحميل صور الجاليري عند أول دخول لتبويب الجاليري أو الألوان والمقاسات
    if ((value === 'gallery' || value === 'variants') && !isLoadingGallery && galleryImages.length === 0 && formData.ID) {
      loadGalleryImages()
    }
  }

  const handleSelectChange = async (name: string, value: string) => {
    const newValue = Number(value)
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // إذا كان التغيير في التصنيف الرئيسي، أضفه تلقائياً إلى التصنيفات الإضافية
    if (name === "IDCategory" && newValue > 0) {
      // تحقق من أن التصنيف الجديد غير موجود بالفعل في التصنيفات المحددة
      const isAlreadySelected = selectedCategories.some(sc => sc.IDCategory === newValue)
      
      if (!isAlreadySelected) {
        try {
          // إضافة التصنيف الجديد إلى التصنيفات المحددة
          const newCategory: ProductCategory = {
            ID: String(Date.now()), // مؤقت حتى يتم الحفظ
            IDProductStructure: formData.ID,
            IDCategory: newValue,
            IsChecked: true
          }

          const docRef = await addDoc(collection(db, "Def_ProductStructureCategoty"), newCategory)
          newCategory.ID = docRef.id
          
          setSelectedCategories(prev => [...prev, newCategory])
        } catch (error) {
          console.error("Error adding main category to additional categories:", error)
          notify.error("حدث خطأ أثناء إضافة التصنيف الرئيسي")
        }
      }

      // توليد الباركود الجديد عند تغيير التصنيف (يعمل في جميع الحالات)
      try {
        // البحث عن أكبر باركود في جدول Def_ProductStructure للتصنيف المختار
        const productsRef = collection(db, "Def_ProductStructure")
        const q = query(
          productsRef, 
          where("IDCategory", "==", newValue),
          orderBy("BarCode", "desc"), 
          limit(1)
        )
        const querySnapshot = await getDocs(q)
        
        let newBarCode = 1 // القيمة الافتراضية: 1
        
        if (!querySnapshot.empty) {
          const maxBarCode = querySnapshot.docs[0].data().BarCode || 0
          console.log("Max barcode found for category", newValue, ":", maxBarCode)
          // تحويل الباركود إلى number قبل إضافة 1
          newBarCode = Number(maxBarCode) + 1
        }
        
        console.log("Generated new barcode for category", newValue, ":", newBarCode)
        
        // تحديث الباركود في النموذج (يعمل في جميع الحالات)
        setFormData(prev => ({
          ...prev,
          BarCode: newBarCode
        }))
      } catch (error) {
        console.error("Error generating barcode:", error)
        notify.error("حدث خطأ أثناء توليد الباركود")
      }
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleCategoryChange = async (categoryId: number, isChecked: boolean) => {
    try {
      console.log("handleCategoryChange called:", { categoryId, isChecked })
      console.log("Current selectedCategories:", selectedCategories)

      if (isChecked) {
        // إضافة تصنيف جديد
        const newCategory: ProductCategory = {
          ID: String(Date.now()), // مؤقت حتى يتم الحفظ
          IDProductStructure: formData.ID,
          IDCategory: categoryId,
          IsChecked: true
        }

        const docRef = await addDoc(collection(db, "Def_ProductStructureCategoty"), newCategory)
        newCategory.ID = docRef.id
        
        setSelectedCategories(prev => [...prev, newCategory])
      } else {
        // حذف التصنيف
        const categoryToDelete = selectedCategories.find(sc => sc.IDCategory === categoryId)
        if (categoryToDelete) {
          console.log("Deleting category:", categoryToDelete)
          console.log("Category ID type:", typeof categoryToDelete.ID, "Value:", categoryToDelete.ID)
          
          // التأكد من أن ID هو string
          const docId = String(categoryToDelete.ID)
          await deleteDoc(doc(db, "Def_ProductStructureCategoty", docId))
          setSelectedCategories(prev => prev.filter(sc => sc.ID !== categoryToDelete.ID))
        }
      }
    } catch (error) {
      console.error("Error updating categories:", error)
      notify.error("حدث خطأ أثناء تحديث التصنيفات")
    }
  }

  const handleImageUpload = async (file: File) => {

    try {
      setIsUploading(true)

      // حذف الصورة القديمة إذا وجدت
      if (formData.ImageName && formData.ImageFolderPath) {
        try {
          const oldImageRef = ref(storage, `${formData.ImageFolderPath}/${formData.ImageName}`)
          await deleteObject(oldImageRef)
        } catch (error) {
          console.log("No old image to delete or error:", error)
        }
      }

      // إنشاء اسم فريد للملف
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${timestamp}.${fileExtension}`
      
      // إنشاء مسار المجلد
      const folderPath = `Application/Def_ProductStructure/${formData.ID}`
      const filePath = `${folderPath}/${uniqueFileName}`
      
      // رفع الصورة الجديدة
      const storageRef = ref(storage, filePath)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      // تحديث بيانات النموذج
      const updatedData = {
        ...formData,
        ImageName: uniqueFileName,
        ImageURL: downloadURL,
        ImageFolderPath: folderPath
      }
      
      // حفظ في Firestore
      const docRef = doc(db, "Def_ProductStructure", String(formData.ID))
      await setDoc(docRef, updatedData)
      
      // تحديث الحالة المحلية
      setFormData(updatedData)
      setImagePreview(downloadURL)
      
      notify.success("تم رفع الصورة بنجاح")
    } catch (error) {
      console.error("Error uploading image:", error)
      notify.error("حدث خطأ أثناء رفع الصورة")
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageDelete = async () => {
    if (!formData.ImageName || !formData.ImageFolderPath) return

    try {
      // حذف الصورة من Storage
      const imageRef = ref(storage, `${formData.ImageFolderPath}/${formData.ImageName}`)
      await deleteObject(imageRef)
      
      // تحديث البيانات
      const updatedData = {
        ...formData,
        ImageName: "",
        ImageURL: "",
        ImageFolderPath: ""
      }
      
      // حفظ في Firestore
      const docRef = doc(db, "Def_ProductStructure", String(formData.ID))
      await setDoc(docRef, updatedData)
      
      // تحديث الحالة المحلية
      setFormData(updatedData)
      setImagePreview(null)
      
      notify.success("تم حذف الصورة بنجاح")
    } catch (error) {
      console.error("Error deleting image:", error)
      notify.error("حدث خطأ أثناء حذف الصورة")
    }
  }

  const loadGalleryImages = async () => {
    if (!formData.ID || !id) return // لا تحمل الصور إذا كان منتج جديد

    try {
      setIsLoadingGallery(true)
      const folderPath = `Application/Def_ProductStructure/${formData.ID}`
      const folderRef = ref(storage, folderPath)
      
      try {
        const result = await listAll(folderRef)
        // استثناء الصورة الرئيسية من القائمة
        const galleryItems = result.items.filter((item: any) => item.name !== formData.ImageName)
        const urls = await Promise.all(
          galleryItems.map(async (item: any) => {
            const url = await getDownloadURL(item)
            return {
              id: item.name,
              name: item.name,
              url: url
            }
          })
        )
        setGalleryImages(urls)
      } catch (error) {
        console.log("No gallery images found or error:", error)
        setGalleryImages([])
      }
    } catch (error) {
      console.error("Error loading gallery:", error)
      notify.error("حدث خطأ أثناء تحميل الصور")
    } finally {
      setIsLoadingGallery(false)
    }
  }

  const handleGalleryUpload = async (files: FileList) => {

    try {
      setIsLoadingGallery(true)
      const folderPath = `Application/Def_ProductStructure/${formData.ID}`
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const timestamp = Date.now() + i // إضافة i لضمان عدم تكرار الأسماء
        const fileExtension = file.name.split('.').pop()
        const fileName = `gallery_${timestamp}.${fileExtension}` // إضافة prefix للتمييز عن الصورة الرئيسية
        const filePath = `${folderPath}/${fileName}`
        
        const fileRef = ref(storage, filePath)
        await uploadBytes(fileRef, file)
        const url = await getDownloadURL(fileRef)
        
        setGalleryImages(prev => [...prev, {
          id: fileName,
          name: fileName,
          url: url
        }])
      }
      
      notify.success("تم رفع الصور بنجاح")
    } catch (error) {
      console.error("Error uploading gallery images:", error)
      notify.error("حدث خطأ أثناء رفع الصور")
    } finally {
      setIsLoadingGallery(false)
    }
  }

  const handleGalleryImageDelete = async (image: GalleryImage) => {
    if (!formData.ID) return

    try {
      const filePath = `Application/Def_ProductStructure/${formData.ID}/${image.name}`
      const fileRef = ref(storage, filePath)
      await deleteObject(fileRef)
      
      setGalleryImages(prev => prev.filter(img => img.id !== image.id))
      notify.success("تم حذف الصورة بنجاح")
    } catch (error) {
      console.error("Error deleting gallery image:", error)
      notify.error("حدث خطأ أثناء حذف الصورة")
    }
  }

  const handleSave = async () => {
    try {
      // 0) حراسة أساسية
      if (!formData.ID || Number(formData.ID) <= 0) {
        notify.error("لا يمكن الحفظ بدون معرف للصنف")
        return false
      }

      if (!formData.Name || formData.Name.trim() === '') {
        alert("يرجى إدخال اسم الصنف")
        return false
      }

      if (!formData.BarCode || formData.BarCode <= 0 || !Number.isInteger(Number(formData.BarCode))) {
        alert("يرجى إدخال باركود صحيح (رقم صحيح أكبر من صفر)")
        return false
      }

      if (!formData.IDCategory || formData.IDCategory <= 0) {
        alert("يرجى اختيار تصنيف للصنف")
        return false
      }

      // التحقق من عدم تكرار الباركود
      const isBarCodeValid = await validateCodeWithMessage(
        DEFINITION_COLLECTIONS.products,
        formData.BarCode,
        id || undefined
      )
      
      if (!isBarCodeValid) {
        return false
      }

      // إضافة منصات الروابط إلى البيانات المحفوظة
      const dataToSave = {
        ...formData,
        LinkPlatforms: linkPlatforms
      }
      
      const docRef = doc(db, "Def_ProductStructure", String(formData.ID))
      await setDoc(docRef, dataToSave)
      setIsSaved(true)
      notify.success("تم حفظ الصنف بنجاح")
      
      // حفظ التوليفات (الألوان × المقاسات) في Collection فرعي Variants
      // ================= Variants Save (منظم وبخطوات) =================
      const productId = String(formData.ID)
      const variantsCol = collection(db, "Def_ProductStructure", productId, "Variants")

      // 1) حساب التوليفات الحالية بشكل موثوق
      let comboKeys = Object.keys(variantValues).filter(k => !excludedPairs.includes(k))
      if (comboKeys.length === 0) {
        comboKeys = selectedColorIds
          .flatMap(cid => selectedSizeIds.map(sid => `${cid}-${sid}`))
          .filter(k => !excludedPairs.includes(k))
      }

      // 2) جلب الموجود حالياً
      const existingSnap = await getDocs(variantsCol)
      const existingIds = new Set(existingSnap.docs.map(d => d.id))

      // 3) رفع صور وUpsert لكل توليفة
      for (const key of comboKeys) {
        try {
          const [cidStr, sidStr] = key.split('-')
          const cid = Number(cidStr)
          const sid = Number(sidStr)
          const color = colorDefs.find(c => c.ID === cid)
          const size = sizeDefs.find(s => s.ID === sid)
          const row = variantValues[key] || { qty: 0, price: 0 }

          // اجلب الموجود للحفاظ على الصورة إن لم تُرفع جديدة
          let imageUrl = ""
          let imageName = ""
          try {
            const cur = existingSnap.docs.find(d => d.id === key)
            const v = cur?.data() as any
            if (v) {
              imageUrl = v.ImageURL || ""
              imageName = v.ImageName || ""
            }
          } catch {}

          // رفع صورة جديدة إن وُجدت
          // لا ترفع صور أثناء الحفظ الأساسي

          // إذا تم اختيار صورة من الجاليري لهذه التوليفة، استخدمها بدلاً من القيمة الحالية
          const galleryPick = variantImages[key]
          const finalImageName = (galleryPick?.isFromGallery && galleryPick?.imageName) ? galleryPick.imageName : imageName
          const finalImageUrl = (galleryPick?.isFromGallery && galleryPick?.url) ? galleryPick.url : imageUrl

          await setDoc(doc(variantsCol, key), {
            IDProductStructure: Number(productId),
            Color: { ID: color?.ID || cid, Name: color?.Name || '', ColorHex: color?.ColorHex || '' },
            Size: { ID: size?.ID || sid, Name: size?.Name || '' },
            Qty: Number(row.qty) || 0,
            Price: Number(row.price) || 0,
            Fitting: String(row.fitting || ''),
            ImageName: finalImageName,
            ImageURL: finalImageUrl
          }, { merge: true })

          existingIds.delete(key) // لم يعد قديمًا، تم تحديثه/إنشاؤه
        } catch (variantErr) {
          console.error('Variant upsert failed, continuing with next:', variantErr)
        }
      }

      // 4) حذف أي وثائق قديمة لم تعد موجودة الآن مع حذف صورة التخزين إن وجدت
      if (existingIds.size > 0) {
        await Promise.all(
          Array.from(existingIds).map(async (id) => {
            try {
              // حاول حذف صورة التخزين المرتبطة بالتوليفة إن وجدت
              const removed = existingSnap.docs.find(d => d.id === id)
              const removedData = removed?.data() as any
              const imageName: string | undefined = removedData?.ImageName
              if (imageName) {
                const filePath = `Application/Def_ProductStructure/${productId}/variants/${imageName}`
                try {
                  const fileRef = ref(storage, filePath)
                  await deleteObject(fileRef)
                } catch (storageErr) {
                  console.warn('Storage image delete skipped/failed for variant:', id, storageErr)
                }
              }
            } catch {}
            // حذف وثيقة التوليفة من Firestore
            await deleteDoc(doc(variantsCol, id))
          })
        )
      }

      notify.success("تم حفظ التوليفات بنجاح")

      // الانتقال بعد الإكمال
      router.replace("/admin/definitions/products?refresh=true")
      return true
    } catch (error) {
      console.error("Error saving item:", error)
      notify.error("حدث خطأ أثناء حفظ الصنف")
      return false
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch categories
        const categoriesCollection = collection(db, "Def_Categories")
        const categoriesSnapshot = await getDocs(categoriesCollection)
        const categoriesData = categoriesSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            ID: parseInt(doc.id) || 0,
            Code: data.Code || 0,
            Name: data.Name || ''
          }
        }).sort((a, b) => a.ID - b.ID)
        setCategories(categoriesData)

        // Fetch units
        const unitsCollection = collection(db, "Def_Units")
        const unitsSnapshot = await getDocs(unitsCollection)
        const unitsData = unitsSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            ID: parseInt(doc.id) || 0,
            Name: data.Name || ''
          }
        }).sort((a, b) => a.ID - b.ID)
        setUnits(unitsData)

        // Fetch colors
        const colorsCollection = collection(db, "Def_Colors")
        const colorsSnapshot = await getDocs(colorsCollection)
        const colorsData = colorsSnapshot.docs.map(doc => {
          const data = doc.data() as any
          return {
            ID: parseInt(doc.id) || 0,
            Name: data.Name || '',
            ColorHex: data.ColorHex || '#000000'
          } as ColorDef
        }).sort((a, b) => a.ID - b.ID)
        setColorDefs(colorsData)

        // Fetch sizes
        const sizesCollection = collection(db, "Def_Sizes")
        const sizesSnapshot = await getDocs(sizesCollection)
        const sizesData = sizesSnapshot.docs.map(doc => {
          const data = doc.data() as any
          return {
            ID: parseInt(doc.id) || 0,
            Name: data.Name || ''
          } as SizeDef
        }).sort((a, b) => a.ID - b.ID)
        setSizeDefs(sizesData)

        // If editing, fetch item data and its categories
        if (id) {
          const itemDoc = await getDoc(doc(db, "Def_ProductStructure", id))
          if (itemDoc.exists()) {
            const itemData = itemDoc.data() as Product
            setFormData({
              ...itemData,
              IsShopUnavailable: itemData.IsShopUnavailable ?? false
            })
            if (itemData.ImageURL) {
              setImagePreview(itemData.ImageURL)
            }
            
            // تحميل منصات الروابط المحفوظة
            if (itemData.LinkPlatforms) {
              setLinkPlatforms(itemData.LinkPlatforms)
            }
            
            setIsSaved(true)
            setDefaultsSet(true) // تعيين true للعناصر الموجودة

            // Fetch selected categories
            const categoriesQuery = query(
              collection(db, "Def_ProductStructureCategoty"),
              where("IDProductStructure", "==", parseInt(id))
            )
            const categoriesSnapshot = await getDocs(categoriesQuery)
            const categoriesData = categoriesSnapshot.docs.map(doc => {
              const data = doc.data()
              console.log("Loading category doc:", doc.id, "data:", data)
              return {
                ID: doc.id,
                IDProductStructure: data.IDProductStructure,
                IDCategory: data.IDCategory,
                IsChecked: data.IsChecked
              } as ProductCategory
            })
            setSelectedCategories(categoriesData)
            // تهيئة الاختيارات من حقول المتجر إن وجدت
            if (itemData.ShopColors) {
              const names = itemData.ShopColors.split(',').map(s => s.trim()).filter(Boolean)
              const ids = colorsData.filter(c => names.includes(c.Name)).map(c => c.ID)
              if (ids.length) setSelectedColorIds(ids)
            }
            if (itemData.ShopSizes) {
              const names = itemData.ShopSizes.split(',').map(s => s.trim()).filter(Boolean)
              const ids = sizesData.filter(s => names.includes(s.Name)).map(s => s.ID)
              if (ids.length) setSelectedSizeIds(ids)
            }

            // تحميل التوليفات المحفوظة من Collection الفرعي
            try {
              const variantsCol = collection(db, "Def_ProductStructure", String(itemData.ID), "Variants")
              const variantsSnap = await getDocs(variantsCol)
              if (!variantsSnap.empty) {
                const colorIdSet = new Set<number>()
                const sizeIdSet = new Set<number>()
                const values: Record<string, { qty: number; price: number; fitting?: string }> = {}
                const images: Record<string, { url: string }> = {}

                variantsSnap.docs.forEach(d => {
                  const v = d.data() as any
                  const cid = Number(v?.Color?.ID) || 0
                  const sid = Number(v?.Size?.ID) || 0
                  if (cid > 0) colorIdSet.add(cid)
                  if (sid > 0) sizeIdSet.add(sid)
                  const key = `${cid}-${sid}`
                  values[key] = { qty: Number(v?.Qty) || 0, price: Number(v?.Price) || 0, fitting: String(v?.Fitting || '').trim() }
                  if (v?.ImageURL) {
                    images[key] = { url: v.ImageURL as string }
                  }
                })

                setSelectedColorIds(Array.from(colorIdSet).sort((a,b)=>a-b))
                setSelectedSizeIds(Array.from(sizeIdSet).sort((a,b)=>a-b))
                setVariantValues(values)
                setVariantImages(images)
              }
            } catch (e) {
              console.error('Error loading saved variants:', e)
            }
          }
        } else {
          // If new item, get max ID
          const productsRef = collection(db, "Def_ProductStructure")
          const q = query(productsRef, orderBy("ID", "desc"), limit(1))
          const querySnapshot = await getDocs(q)
          const maxId = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().ID
          setFormData(prev => ({ ...prev, ID: maxId + 1 }))
          setDefaultsSet(false) // إعادة تعيين لشاشة جديدة
          
          // Clear gallery images for new product
          setGalleryImages([])
          setImagePreview(null)
        }

      } catch (error) {
        console.error("Error fetching data:", error)
        notify.error("حدث خطأ أثناء تحميل البيانات")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // تعيين القيم الافتراضية للعنصر الجديد بعد تحميل الوحدات
  useEffect(() => {
    if (!id && units.length > 0 && formData.ID > 0 && !loading && !defaultsSet) {
      setFormData(prev => ({
        ...prev,
        // تعيين الوحدات الافتراضية (أول وحدة كبرى، ثاني وحدة صغرى)
        UnitBig_ID: units[0].ID,
        UnitSmall_ID: units.length > 1 ? units[1].ID : units[0].ID,
        // تعيين القيم الافتراضية الأخرى
        UnitCountOf: 12,
        LimitedQty: 0,
            ShopPriceBeforDiscount: 0,
    ShopDiscountPercent: 0,
    ShopDiscountValue: 0,
    ShopPrice: 0,
    ShopLink1: "",
    ShopLink2: "",
    ShopLink3: "",
    ShopLink4: "",
    ShopLink5: "",
    ShopVideoEmbed: "",
        IsShopUnavailable: false,
        DefaultSalesCommission: 0
      }))
      setDefaultsSet(true)
    }
  }, [id, units, formData.ID, loading, defaultsSet])

  // تعديل useEffect لتحميل صور الجاليري عند فتح التاب
  useEffect(() => {
    if (activeTab === "gallery" && formData.ID) {
      // تحميل صور الجاليري فقط إذا كان المنتج موجود (ليس جديد)
      if (id) {
        // حمّل صور الجاليري مبكرًا لاستخدامها في تبويب الألوان والمقاسات
        loadGalleryImages()
      } else {
        setGalleryImages([])
      }
    }
  }, [activeTab, formData.ID, id])

  // مسح الجاليري عند تغيير المنتج أو فتح منتج جديد
  useEffect(() => {
    // إذا كان منتج جديد (لا يوجد id في URL)، امسح الجاليري
    if (!id) {
      setGalleryImages([])
    }
  }, [id])

  // إضافة التصنيف الرئيسي تلقائياً إلى التصنيفات المحددة إذا لم يكن موجوداً
  useEffect(() => {
    const addMainCategoryIfNotExists = async () => {
      if (formData.IDCategory > 0 && formData.ID > 0 && selectedCategories.length > 0) {
        const isMainCategorySelected = selectedCategories.some(sc => sc.IDCategory === formData.IDCategory)
        
        if (!isMainCategorySelected) {
          try {
            // إضافة التصنيف الرئيسي إلى التصنيفات المحددة
            const newCategory: ProductCategory = {
              ID: String(Date.now()), // مؤقت حتى يتم الحفظ
              IDProductStructure: formData.ID,
              IDCategory: formData.IDCategory,
              IsChecked: true
            }

            const docRef = await addDoc(collection(db, "Def_ProductStructureCategoty"), newCategory)
            newCategory.ID = docRef.id
            
            setSelectedCategories(prev => [...prev, newCategory])
            console.log("تم إضافة التصنيف الرئيسي تلقائياً إلى التصنيفات المحددة")
          } catch (error) {
            console.error("Error adding main category automatically:", error)
          }
        }
      }
    }

    addMainCategoryIfNotExists()
  }, [formData.IDCategory, formData.ID, selectedCategories.length])

  const actionButtons = [
    { 
      label: "حفظ", 
      icon: Save, 
                      onClick: () => handleSave()
    },
    { label: "طباعة", icon: Printer, onClick: () => {} },
    { 
      label: "إغلاق", 
      icon: ArrowLeft, 
      onClick: () => router.push("/admin/definitions/products"),
      variant: "destructive" as const 
    },
  ]

  // تشخيص حقول العمولة
  console.log('حقول عمولة المندوب:', {
    SalesComission_PurchasePrice: formData.SalesComission_PurchasePrice,
    SalesComission_Sales1: formData.SalesComission_Sales1,
    SalesComission_Sales2: formData.SalesComission_Sales2,
    SalesComission_Sales3: formData.SalesComission_Sales3,
    SalesComission_Sales4: formData.SalesComission_Sales4,
    SalesComission_Sales5: formData.SalesComission_Sales5,
    DefaultSalesCommission: formData.DefaultSalesCommission
  })
  
  console.log('حقول عمولة المدير:', {
    AdminComission_PurchasePrice: formData.AdminComission_PurchasePrice,
    AdminComission_Sales1: formData.AdminComission_Sales1,
    AdminComission_Sales2: formData.AdminComission_Sales2,
    AdminComission_Sales3: formData.AdminComission_Sales3,
    AdminComission_Sales4: formData.AdminComission_Sales4,
    AdminComission_Sales5: formData.AdminComission_Sales5
  })

  if (loading) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-full">
      <PageHeader title="بيانات الصنف" actionButtons={actionButtons} />
      <Tabs value={activeTab} onValueChange={handleTabChange} dir="rtl" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-4 h-auto">
          <TabsTrigger value="data" className="text-xs sm:text-sm px-2 py-2">بيانات الصنف</TabsTrigger>
          <TabsTrigger value="main-image" className="text-xs sm:text-sm px-2 py-2">صورة رئيسية</TabsTrigger>
          <TabsTrigger value="gallery" className="text-xs sm:text-sm px-2 py-2">جاليري</TabsTrigger>
          <TabsTrigger value="variants" className="text-xs sm:text-sm px-2 py-2">الألوان والمقاسات</TabsTrigger>
          <TabsTrigger value="links" className="text-xs sm:text-sm px-2 py-2">الروابط</TabsTrigger>
          <TabsTrigger value="store" className="text-xs sm:text-sm px-2 py-2">المتجر</TabsTrigger>
          <TabsTrigger value="item-categories" className="text-xs sm:text-sm px-2 py-2 col-span-2 sm:col-span-1">تصنيفات الأصناف</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="w-full">
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="space-y-4">
                <ItemDataForm 
                  formData={formData}
                  categories={categories}
                  units={units}
                  handleInputChange={handleInputChange}
                  handleSelectChange={handleSelectChange}
                  handleCheckboxChange={handleCheckboxChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* روابط المنتج */}
        <TabsContent value="links" className="w-full">
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">روابط المنتج</h3>
                
                {/* الرابط الأول */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الرابط الأول</Label>
                  <div className="flex items-center gap-2">
                    <Select value={linkPlatforms.link1} onValueChange={(value) => handlePlatformChange('link1', value)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            YouTube
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            Instagram
                          </div>
                        </SelectItem>
                        <SelectItem value="facebook">
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            Facebook
                          </div>
                        </SelectItem>
                        <SelectItem value="twitter">
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-blue-400" />
                            Twitter
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-blue-700" />
                            LinkedIn
                          </div>
                        </SelectItem>
                        <SelectItem value="tiktok">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-black rounded text-white flex items-center justify-center text-xs font-bold">T</div>
                            TikTok
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-500" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="telegram">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-blue-500" />
                            Telegram
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            أخرى
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input 
                        name="ShopLink1"
                        value={formData.ShopLink1 || ""}
                        onChange={handleInputChange}
                        placeholder="رابط المنتج الأول"
                        className="text-sm"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => formData.ShopLink1 && window.open(formData.ShopLink1, '_blank')}
                      disabled={!formData.ShopLink1}
                      className="gap-1 h-8 text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      فتح
                    </Button>
                  </div>
                </div>

                {/* الرابط الثاني */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الرابط الثاني</Label>
                  <div className="flex items-center gap-2">
                    <Select value={linkPlatforms.link2} onValueChange={(value) => handlePlatformChange('link2', value)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            YouTube
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            Instagram
                          </div>
                        </SelectItem>
                        <SelectItem value="facebook">
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            Facebook
                          </div>
                        </SelectItem>
                        <SelectItem value="twitter">
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-blue-400" />
                            Twitter
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-blue-700" />
                            LinkedIn
                          </div>
                        </SelectItem>
                        <SelectItem value="tiktok">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-black rounded text-white flex items-center justify-center text-xs font-bold">T</div>
                            TikTok
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-500" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="telegram">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-blue-500" />
                            Telegram
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            أخرى
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input 
                        name="ShopLink2"
                        value={formData.ShopLink2 || ""}
                        onChange={handleInputChange}
                        placeholder="رابط المنتج الثاني"
                        className="text-sm"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => formData.ShopLink2 && window.open(formData.ShopLink2, '_blank')}
                      disabled={!formData.ShopLink2}
                      className="gap-1 h-8 text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      فتح
                    </Button>
                  </div>
                </div>

                {/* الرابط الثالث */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الرابط الثالث</Label>
                  <div className="flex items-center gap-2">
                    <Select value={linkPlatforms.link3} onValueChange={(value) => handlePlatformChange('link3', value)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            YouTube
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            Instagram
                          </div>
                        </SelectItem>
                        <SelectItem value="facebook">
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            Facebook
                          </div>
                        </SelectItem>
                        <SelectItem value="twitter">
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-blue-400" />
                            Twitter
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-blue-700" />
                            LinkedIn
                          </div>
                        </SelectItem>
                        <SelectItem value="tiktok">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-black rounded text-white flex items-center justify-center text-xs font-bold">T</div>
                            TikTok
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-500" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="telegram">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-blue-500" />
                            Telegram
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            أخرى
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input 
                        name="ShopLink3"
                        value={formData.ShopLink3 || ""}
                        onChange={handleInputChange}
                        placeholder="رابط المنتج الثالث"
                        className="text-sm"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => formData.ShopLink3 && window.open(formData.ShopLink3, '_blank')}
                      disabled={!formData.ShopLink3}
                      className="gap-1 h-8 text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      فتح
                    </Button>
                  </div>
                </div>

                {/* الرابط الرابع */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الرابط الرابع</Label>
                  <div className="flex items-center gap-2">
                    <Select value={linkPlatforms.link4} onValueChange={(value) => handlePlatformChange('link4', value)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            YouTube
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            Instagram
                          </div>
                        </SelectItem>
                        <SelectItem value="facebook">
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            Facebook
                          </div>
                        </SelectItem>
                        <SelectItem value="twitter">
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-blue-400" />
                            Twitter
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-blue-700" />
                            LinkedIn
                          </div>
                        </SelectItem>
                        <SelectItem value="tiktok">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-black rounded text-white flex items-center justify-center text-xs font-bold">T</div>
                            TikTok
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-500" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="telegram">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-blue-500" />
                            Telegram
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            أخرى
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input 
                        name="ShopLink4"
                        value={formData.ShopLink4 || ""}
                        onChange={handleInputChange}
                        placeholder="رابط المنتج الرابع"
                        className="text-sm"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => formData.ShopLink4 && window.open(formData.ShopLink4, '_blank')}
                      disabled={!formData.ShopLink4}
                      className="gap-1 h-8 text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      فتح
                    </Button>
                  </div>
                </div>

                {/* الرابط الخامس */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الرابط الخامس</Label>
                  <div className="flex items-center gap-2">
                    <Select value={linkPlatforms.link5} onValueChange={(value) => handlePlatformChange('link5', value)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            YouTube
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            Instagram
                          </div>
                        </SelectItem>
                        <SelectItem value="facebook">
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            Facebook
                          </div>
                        </SelectItem>
                        <SelectItem value="twitter">
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-blue-400" />
                            Twitter
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-blue-700" />
                            LinkedIn
                          </div>
                        </SelectItem>
                        <SelectItem value="tiktok">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-black rounded text-white flex items-center justify-center text-xs font-bold">T</div>
                            TikTok
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-500" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="telegram">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-blue-500" />
                            Telegram
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            أخرى
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input 
                        name="ShopLink5"
                        value={formData.ShopLink5 || ""}
                        onChange={handleInputChange}
                        placeholder="رابط المنتج الخامس"
                        className="text-sm"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => formData.ShopLink5 && window.open(formData.ShopLink5, '_blank')}
                      disabled={!formData.ShopLink5}
                      className="gap-1 h-8 text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      فتح
                    </Button>
                  </div>
                </div>

                {/* رابط الفيديو */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-blue-600">رابط الفيديو للمتجر</Label>
                    <div className="flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                      <Video className="h-3 w-3" />
                      سيتم عرضه في صفحة المنتج
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={linkPlatforms.video} onValueChange={(value) => handlePlatformChange('video', value)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            YouTube
                          </div>
                        </SelectItem>
                        <SelectItem value="vimeo">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">V</div>
                            Vimeo
                          </div>
                        </SelectItem>
                        <SelectItem value="tiktok">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-black rounded text-white flex items-center justify-center text-xs font-bold">T</div>
                            TikTok
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            Instagram
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-500" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="telegram">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-blue-500" />
                            Telegram
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            أخرى
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input 
                        name="ShopVideoEmbed"
                        value={formData.ShopVideoEmbed || ""}
                        onChange={handleInputChange}
                        placeholder="رابط الفيديو (YouTube, Vimeo, أو أي سيرفر آخر)"
                        className="text-sm border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => formData.ShopVideoEmbed && window.open(formData.ShopVideoEmbed, '_blank')}
                      disabled={!formData.ShopVideoEmbed}
                      className="gap-1 h-8 text-xs border-blue-200 hover:border-blue-400"
                    >
                      <ExternalLink className="h-3 w-3" />
                      فتح
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
         {/* صورة الصنف */}
        <TabsContent value="main-image" className="w-full">
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-sm aspect-square">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Product preview"
                      fill
                      className="object-contain rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-12 w-12" />
                      <p className="text-sm">لا توجد صورة</p>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file)
                    }
                  }}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-8 text-sm"
                  >
                    <Upload className="h-3 w-3 ml-1" />
                    {isUploading ? "جاري الرفع..." : "رفع صورة"}
                  </Button>

                  {imagePreview && (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleImageDelete}
                        disabled={isUploading}
                        className="h-8 text-sm"
                      >
                        <Trash className="h-3 w-3 ml-1" />
                        حذف
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.open(imagePreview, '_blank')}
                        className="h-8 text-sm"
                      >
                        <ImageIcon className="h-3 w-3 ml-1" />
                        عرض
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الألوان والمقاسات - تصميم فقط */}
        <TabsContent value="variants" className="w-full">
          <Card>
            <CardContent className="p-2 sm:p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* اختيار الألوان */}
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">اختيار الألوان</h4>
                    <span className="text-xs text-gray-500">{selectedColorIds.length} محدد</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                    {colorDefs.map(c => {
                      const checked = selectedColorIds.includes(c.ID)
                      return (
                        <label key={c.ID} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${checked ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
                          onClick={async (e) => {
                            e.preventDefault()
                            if (checked) {
                              // تأكيد حذف كل توليفات هذا اللون نهائيًا
                              const ok = window.confirm(`سيتم حذف جميع التوليفات الخاصة باللون "${c.Name}" نهائيًا من قاعدة البيانات ولا يمكن التراجع. المتابعة؟`)
                              if (!ok) return
                              await deleteVariantsByColor(c.ID)
                              setSelectedColorIds(prev => prev.filter(id => id !== c.ID))
                            } else {
                              setSelectedColorIds(prev => [...prev, c.ID])
                            }
                          }}
                        >
                          <span className="inline-block w-5 h-5 rounded border" style={{ backgroundColor: c.ColorHex || '#000' }} />
                          <span className="text-sm">{c.Name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* اختيار المقاسات */}
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">اختيار المقاسات</h4>
                    <span className="text-xs text-gray-500">{selectedSizeIds.length} محدد</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
                    {sizeDefs.map(s => {
                      const checked = selectedSizeIds.includes(s.ID)
                      return (
                        <label key={s.ID} className={`flex items-center justify-center gap-2 p-2 rounded border cursor-pointer text-sm ${checked ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
                          onClick={(e) => {
                            e.preventDefault()
                            setSelectedSizeIds(prev => checked ? prev.filter(id => id !== s.ID) : [...prev, s.ID])
                          }}
                        >
                          {s.Name}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* أدوات سريعة */}
              <div className="border rounded-lg p-3 bg-gray-50">
                {/* ربط صورة باللون فقط - تمت إزالته بناء على طلب الإرجاع */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-700">تعيين جماعي:</span>
                  <Input placeholder="الكمية" className="h-8 w-24 text-center" onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0
                    setVariantValues(prev => {
                      const next = { ...prev }
                      selectedColorIds.forEach(cid => selectedSizeIds.forEach(sid => {
                        const key = `${cid}-${sid}`
                        next[key] = { qty: v, price: (next[key]?.price || 0) }
                      }))
                      return next
                    })
                  }} />
                  <Input placeholder="السعر" className="h-8 w-24 text-center" onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0
                    setVariantValues(prev => {
                      const next = { ...prev }
                      selectedColorIds.forEach(cid => selectedSizeIds.forEach(sid => {
                        const key = `${cid}-${sid}`
                        next[key] = { qty: (next[key]?.qty || 0), price: v }
                      }))
                      return next
                    })
                  }} />
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={deleteAllVariants}
                  >
                    حذف كل التوليفات من الفايربيز
                  </Button>
                </div>
                
              </div>

              {/* جدول التباديل والتوافيق */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-right">اللون</th>
                      <th className="p-2 text-right">المقاس</th>
                      <th className="p-2 text-right">التلبيس</th>
                      <th className="p-2 text-center">الكمية</th>
                      <th className="p-2 text-center">السعر</th>
                      <th className="p-2 text-center">صورة خاصة</th>
                      <th className="p-2 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedColorIds.flatMap((cid) => selectedSizeIds.map((sid) => ({ cid, sid }))).filter(({cid, sid}) => !excludedPairs.includes(`${cid}-${sid}`)).map(({ cid, sid }) => {
                      const color = colorDefs.find(c => c.ID === cid)
                      const size = sizeDefs.find(s => s.ID === sid)
                      const key = `${cid}-${sid}`
                      const row = variantValues[key] || { qty: 0, price: 0 }
                      return (
                        <tr key={key} className="border-b">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-4 h-4 rounded border" style={{ backgroundColor: color?.ColorHex || '#000' }} />
                              <span>{color?.Name}</span>
                            </div>
                          </td>
                          <td className="p-2">{size?.Name}</td>
                          <td className="p-2">
                            <Input value={row.fitting || ''} onChange={(e) => {
                              const v = e.target.value
                              setVariantValues(prev => ({ ...prev, [key]: { qty: prev[key]?.qty || 0, price: prev[key]?.price || 0, fitting: v } }))
                            }} className="h-8 w-28 mx-auto text-center" />
                          </td>
                          <td className="p-2 text-center">
                            <Input value={row.qty} onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0
                              setVariantValues(prev => ({ ...prev, [key]: { qty: v, price: prev[key]?.price || 0 } }))
                            }} className="h-8 w-24 mx-auto text-center" />
                          </td>
                          <td className="p-2 text-center">
                            <Input value={row.price} onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0
                              setVariantValues(prev => ({ ...prev, [key]: { qty: prev[key]?.qty || 0, price: v } }))
                            }} className="h-8 w-24 mx-auto text-center" />
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {variantImages[key]?.url ? (
                                <img src={variantImages[key].url} alt="variant" className="w-10 h-10 rounded border object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded border flex items-center justify-center text-[10px] text-gray-500">[لا صورة]</div>
                              )}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center px-2 py-1 border rounded text-xs cursor-pointer hover:bg-gray-50"
                          onClick={() => { setActiveVariantKeyForGallery(key); setIsVariantGalleryOpen(true) }}
                        >
                          اختر من الجاليري
                        </button>
                      </div>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm" 
                                className="h-8 text-xs"
                                onClick={async () => {
                                  const ok = window.confirm("حذف هذه التوليفة نهائيًا من قاعدة البيانات؟")
                                  if (!ok) return
                                  await deleteVariantByKey(key)
                                }}
                              >
                                حذف فوري
                              </Button>
                              
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {(selectedColorIds.length === 0 || selectedSizeIds.length === 0) && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">اختر لوناً واحداً على الأقل ومقاساً واحداً لعرض التوليفات</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* جاليري الصنف */}
          <TabsContent value="gallery" className="w-full">
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="space-y-4">
                  {/* زر الرفع */}
                  <div className="flex justify-center">
                    <input
                      type="file"
                      ref={galleryInputRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleGalleryUpload(e.target.files)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                                              onClick={() => galleryInputRef.current?.click()}
                      disabled={isLoadingGallery}
                      className="gap-2 h-8 text-sm"
                    >
                      <Upload className="h-3 w-3" />
                      {isLoadingGallery ? "جاري الرفع..." : "رفع صور"}
                    </Button>
                  </div>

                  {/* عرض الصور */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {galleryImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="relative aspect-square">
                          <Image
                            src={image.url}
                            alt={image.name}
                            fill
                            className="object-cover rounded-lg border"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(image.url, '_blank')}
                            className="bg-white h-6 w-6 p-0"
                          >
                            <ImageIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleGalleryImageDelete(image)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* رسالة عند عدم وجود صور */}
                  {galleryImages.length === 0 && !isLoadingGallery && (
                    <div className="text-center text-muted-foreground py-4">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                      <p className="text-sm">لا توجد صور في المعرض</p>
                    </div>
                  )}


                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* المتجر */}
          <TabsContent value="store" className="w-full">
            <StoreTabContent formData={formData} onChange={handleInputChange} onCheckboxChange={handleCheckboxChange} />
          </TabsContent>

          {/* تصنيفات الأصناف */}
          <TabsContent value="item-categories" className="w-full">
            <ItemCategoriesTabContent 
              formData={formData}
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryChange={handleCategoryChange}
            />
          </TabsContent>
        </Tabs>

      {/* Dialog لاختيار صورة من الجاليري لتوليفة معينة */}
      {isVariantGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-[90vw] max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold">اختر صورة من الجاليري</h3>
              <button className="text-xs px-2 py-1 border rounded" onClick={() => setIsVariantGalleryOpen(false)}>إغلاق</button>
            </div>
            <div className="p-3 overflow-y-auto" style={{maxHeight: '65vh'}}>
              {isLoadingGallery && (
                <div className="text-center text-sm py-6">جاري التحميل...</div>
              )}
              {!isLoadingGallery && galleryImages.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-6">لا توجد صور في الجاليري لهذا الصنف</div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {galleryImages.map(img => (
                  <button
                    key={img.id}
                    type="button"
                    className="relative aspect-square border rounded overflow-hidden hover:ring-2 hover:ring-blue-500"
                    onClick={() => {
                      if (!activeVariantKeyForGallery) return
                      // استخرج اسم الملف من URL إذا لم يكن لدينا name
                      const fileName = img.name || img.url.split('/').pop()?.split('?')[0] || img.id
                      setVariantImages(prev => ({
                        ...prev,
                        [activeVariantKeyForGallery]: { url: img.url, imageName: fileName, isFromGallery: true }
                      }))
                      setIsVariantGalleryOpen(false)
                      setActiveVariantKeyForGallery(null)
                    }}
                  >
                    <img src={img.url} alt={img.name} className="absolute inset-0 w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    )
  }
