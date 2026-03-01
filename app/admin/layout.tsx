"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  Settings,
  Users,
  DollarSign,
  Briefcase,
  Warehouse,
  ChevronUp,
  ChevronDown,
  FileText,
  ShoppingCart,
  Package,
  Store,
} from "lucide-react"
import AuthGuard from "@/components/auth-guard"

// Helper component for sidebar items
const SidebarLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname()
  // Check if current path starts with the href (for sub-pages)
  const isActive = pathname === href || (href !== '/admin' && pathname?.startsWith(href))
  return (
    <Link
      href={href}
      className={`block py-2 pr-10 text-right text-sm rounded-md ${
        isActive
          ? "text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/20"
          : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </Link>
  )
}

// Collapsible sidebar group
const SidebarGroup = ({
  title,
  icon: Icon,
  children,
  isExpanded,
  onToggle,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
}) => {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-gray-50 rounded-md transition-colors"
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 text-gray-500" />
          <span className="mr-3 font-medium text-gray-700">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="pl-4 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  
  // State for managing expanded groups
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    settings: false,
    adminSettings: false,
    shopManagement: false,
    definitions: false,
    dealings: false,
    financials: false,
    hr: false,
    warehouse: false,
    invoices: false,
    repInvoices: false,
  })

  // Auto-expand groups based on current path
  React.useEffect(() => {
    const newExpandedGroups = { ...expandedGroups }
    
    // Check which group should be expanded based on current path
    if (pathname?.startsWith('/admin/definitions')) {
      newExpandedGroups.definitions = true
    } else if (pathname?.startsWith('/admin/settings')) {
      if (pathname.includes('/admin/settings/firebase') || pathname.includes('/admin/settings/backups') || pathname.includes('/admin/settings/restore')) {
        newExpandedGroups.adminSettings = true
      } else {
        newExpandedGroups.settings = true
      }
    } else if (pathname?.startsWith('/admin/shop_manag')) {
      newExpandedGroups.shopManagement = true
    } else if (pathname?.startsWith('/admin/dealings')) {
      newExpandedGroups.dealings = true
    } else if (pathname?.startsWith('/admin/financials')) {
      newExpandedGroups.financials = true
    } else if (pathname?.startsWith('/admin/hr')) {
      newExpandedGroups.hr = true
    } else if (pathname?.startsWith('/admin/warehouse-management')) {
      newExpandedGroups.warehouse = true
    } else if (pathname?.startsWith('/admin/invoices')) {
      newExpandedGroups.invoices = true
    } else if (pathname?.startsWith('/admin/representative-invoices')) {
      newExpandedGroups.repInvoices = true
    }
    
    setExpandedGroups(newExpandedGroups)
  }, [pathname])

  // Keep sidebar open on desktop by default
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true)
      }
    }
    
    handleResize() // Set initial state
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  // استثناء شاشة لوجن الموظفين من AuthGuard
  if (pathname?.includes('/admin/dealings/employee-login')) {
    return <>{children}</>
  }

  return (
    <AuthGuard>
      <div className="flex flex-1 bg-gray-50" dir="rtl">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 right-0 z-50 
          w-64 lg:w-64 bg-white border-l border-gray-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex items-center justify-between h-16 lg:h-20 border-b px-4">
            <Link href="/admin" className="flex items-center gap-2 text-blue-600">
              <span className="text-lg lg:text-xl font-bold">لوحة التحكم</span>
              <LayoutGrid className="w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
            {/* Mobile close button */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronUp className="w-5 h-5 transform rotate-90" />
            </button>
          </div>
          <nav className="flex-1 px-2 lg:px-4 py-4 lg:py-6 space-y-1 lg:space-y-2 overflow-y-auto">
            <SidebarGroup 
              title="الإعدادات" 
              icon={Settings}
              isExpanded={expandedGroups.adminSettings}
              onToggle={() => toggleGroup('adminSettings')}
            >
              <SidebarLink href="/admin/settings/firebase">إعدادات الفايربيز (قاعدة البيانات)</SidebarLink>
              <SidebarLink href="/admin/settings/backups">النسخ الإحتياطية</SidebarLink>
              <SidebarLink href="/admin/settings/restore">إسترجاع البيانات</SidebarLink>
            </SidebarGroup>

            <SidebarGroup 
              title="إعدادات الموقع" 
              icon={Settings}
              isExpanded={expandedGroups.settings}
              onToggle={() => toggleGroup('settings')}
            >
              <SidebarLink href="/admin/settings/website">إعدادات الموقع</SidebarLink>
            </SidebarGroup>

            <SidebarGroup 
              title="إدارة المتجر" 
              icon={Store}
              isExpanded={expandedGroups.shopManagement}
              onToggle={() => toggleGroup('shopManagement')}
            >
              <SidebarLink href="/admin/shop_manag/orders">إدارة الطلبات</SidebarLink>
              <SidebarLink href="/admin/shop_manag/represent-account">حساب المندوب - الموظف</SidebarLink>
              <SidebarLink href="/admin/shop_manag/shop-buscet">سلة المشتريات</SidebarLink>
              <SidebarLink href="/admin/shop_manag/advanced-services">الخدمات المتقدمة</SidebarLink>
              <SidebarLink href="/admin/shop_manag/store-products-stock">رصيد منتجات المتجر</SidebarLink>
            </SidebarGroup> 

            <SidebarGroup 
              title="التعريفات (التأسيس)" 
              icon={Package}
              isExpanded={expandedGroups.definitions}
              onToggle={() => toggleGroup('definitions')}
            >
              <SidebarLink href="/admin/definitions/company-data">بيانات الشركة</SidebarLink>
              <SidebarLink href="/admin/definitions/units">الوحدات</SidebarLink>
              <SidebarLink href="/admin/definitions/productionCom">الشركات المنتجة</SidebarLink>
              <SidebarLink href="/admin/definitions/stocks">المخازن</SidebarLink>
              <SidebarLink href="/admin/definitions/categories">التصنيفات</SidebarLink>
              <SidebarLink href="/admin/definitions/products">الأصناف</SidebarLink>
              <SidebarLink href="/admin/definitions/FinancialCluses">البنود المالية</SidebarLink>
              <SidebarLink href="/admin/definitions/treasuries">الخزائن</SidebarLink>
              <SidebarLink href="/admin/definitions/sections">الأقسام</SidebarLink>
              <SidebarLink href="/admin/definitions/jobs">الوظائف</SidebarLink> 
              <SidebarLink href="/admin/definitions/colors">الألوان</SidebarLink>
              <SidebarLink href="/admin/definitions/sizes">المقاسات</SidebarLink>
              <SidebarLink href="/admin/definitions/geographic-locations">المواقع الجغرافية</SidebarLink>
              <SidebarLink href="/admin/definitions/Offers">عروض نقدية</SidebarLink>
              <SidebarLink href="/admin/definitions/OffersByProducts">عروض الأصناف</SidebarLink>
              <SidebarLink href="/admin/definitions/shopBanner">بنرات المتجر</SidebarLink>
              <SidebarLink href="/admin/definitions/shop-categories">تصنيفات المتجر</SidebarLink>
            </SidebarGroup>

            <SidebarGroup 
              title="جهات التعامل" 
              icon={Users}
              isExpanded={expandedGroups.dealings}
              onToggle={() => toggleGroup('dealings')}
            >
              <SidebarLink href="/admin/dealings/clients">العملاء</SidebarLink>
              <SidebarLink href="/admin/dealings/vendors">الموردين</SidebarLink>
              <SidebarLink href="/admin/dealings/employees">الموظفين</SidebarLink>
            </SidebarGroup>

            <SidebarGroup 
              title="المالية" 
              icon={DollarSign}
              isExpanded={expandedGroups.financials}
              onToggle={() => toggleGroup('financials')}
            >
              <SidebarLink href="/admin/financials/payment-vouchers">سندات الصرف</SidebarLink>
              <SidebarLink href="/admin/financials/receipt-vouchers">سندات القبض</SidebarLink>
              <SidebarLink href="/admin/financials/cash-count">جرد النقدية</SidebarLink>
              <SidebarLink href="/admin/financials/cash-transfer">تحويل نقدي</SidebarLink>
              <SidebarLink href="/admin/financials/daily-closing">إغلاق يومي</SidebarLink>
              <SidebarLink href="/admin/financials/link-vouchers-cash">ربط السندات بالنقدية</SidebarLink>
              <SidebarLink href="/admin/financials/treasury-movement-detailed">حركة الخزينة (تفصيلي)</SidebarLink>
              <SidebarLink href="/admin/financials/treasury-movement-by-date">حركة الخزينة (حسب التاريخ)</SidebarLink>
              <SidebarLink href="/admin/financials/treasury-movement-by-items">حركة الخزينة (حسب البنود)</SidebarLink>
              <SidebarLink href="/admin/financials/treasury-movement-by-date-item">حركة الخزينة (تاريخ وبند)</SidebarLink>
              <SidebarLink href="/admin/financials/treasury-movement-by-date-item-employee">
                حركة الخزينة (تاريخ وبند وموظف) 
              </SidebarLink>
            </SidebarGroup>

            <SidebarGroup 
              title="شؤون الموظفين" 
              icon={Briefcase}
              isExpanded={expandedGroups.hr}
              onToggle={() => toggleGroup('hr')}
            >
              <SidebarLink href="/admin/hr/employees">الموظفين</SidebarLink>
              <SidebarLink href="/admin/hr/bonuses">المكافآت</SidebarLink>
              <SidebarLink href="/admin/hr/deductions-penalties">الخصومات والعقوبات</SidebarLink>
              <SidebarLink href="/admin/hr/withdrawals">السلف</SidebarLink>
              <SidebarLink href="/admin/hr/advances">المقدمات</SidebarLink>
              <SidebarLink href="/admin/hr/fingerprints">البصمات</SidebarLink>
              <SidebarLink href="/admin/hr/attendance">الحضور والانصراف</SidebarLink>
              <SidebarLink href="/admin/hr/salary-calculation">احتساب الرواتب</SidebarLink>
            </SidebarGroup>

            <SidebarGroup 
              title="إدارة المستودعات" 
              icon={Warehouse}
              isExpanded={expandedGroups.warehouse}
              onToggle={() => toggleGroup('warehouse')}
            >
              <SidebarLink href="/admin/warehouse-management/add-permission">إذن إضافة</SidebarLink>
              <SidebarLink href="/admin/warehouse-management/discount-permission">إذن خصم</SidebarLink>
              <SidebarLink href="/admin/warehouse-management/item-adjustments">تسويات الأصناف</SidebarLink>
              <SidebarLink href="/admin/warehouse-management/continuous-inventory">جرد مستمر</SidebarLink>
              <SidebarLink href="/admin/warehouse-management/warehouse-transfers">تحويلات المستودعات</SidebarLink>
              <SidebarLink href="/admin/warehouse-management/transfer-receipts">أذونات التحويل</SidebarLink>
            </SidebarGroup>

            <SidebarGroup 
              title="الفواتير" 
              icon={FileText}
              isExpanded={expandedGroups.invoices}
              onToggle={() => toggleGroup('invoices')}
            >
              <SidebarLink href="/admin/invoices/purchase-invoices">فواتير المشتريات</SidebarLink>
              <SidebarLink href="/admin/invoices/purchase-returns">مرتجعات المشتريات</SidebarLink>
              <SidebarLink href="/admin/invoices/sales-invoices">فواتير المبيعات</SidebarLink>
              <SidebarLink href="/admin/invoices/sales-returns">مرتجعات المبيعات</SidebarLink>
            </SidebarGroup>

            <SidebarGroup 
              title="فواتير المندوبين" 
              icon={ShoppingCart}
              isExpanded={expandedGroups.repInvoices}
              onToggle={() => toggleGroup('repInvoices')}
            >
              <SidebarLink href="/admin/representative-invoices/sales-rep-invoices">فواتير مندوبي المبيعات</SidebarLink>
              <SidebarLink href="/admin/representative-invoices/rep-requests">طلبات المندوبين</SidebarLink>
              <SidebarLink href="/admin/representative-invoices/quick-add">إضافة سريعة</SidebarLink>
              <SidebarLink href="/admin/representative-invoices/rep-inventory">جرد المندوبين</SidebarLink>
              <SidebarLink href="/admin/representative-invoices/rep-sales">مبيعات المندوبين</SidebarLink>
              <SidebarLink href="/admin/representative-invoices/calculate-invoice-dues">
                احتساب استحقات الفواتير
              </SidebarLink>
            </SidebarGroup>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">لوحة التحكم</h1>
            <button
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </header>
          
          {/* Page Content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
