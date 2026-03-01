"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

export default function ProductSearchFilter() {
  return (
    <div className="bg-white dark:bg-card p-6 rounded-xl shadow-lg mb-12 flex flex-col md:flex-row items-center gap-6">
      <div className="relative flex-grow w-full md:w-auto">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-medium" />
        <Input
          type="text"
          placeholder="ابحث عن المنتجات..."
          className="w-full pr-10 pl-4 py-2 rounded-lg border border-neutral-300 dark:border-primary-dark focus:ring-primary focus:border-primary"
        />
      </div>
      <div className="w-full md:w-auto">
        <Select>
          <SelectTrigger className="w-full md:w-[200px] pr-10 pl-4 py-2 rounded-lg border border-neutral-300 dark:border-primary-dark focus:ring-primary focus:border-primary">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-medium" />
            <SelectValue placeholder="جميع الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المنتجات</SelectItem>
            <SelectItem value="men">ملابس رجالية</SelectItem>
            <SelectItem value="women">ملابس نسائية</SelectItem>
            <SelectItem value="kids">ملابس أطفال</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
