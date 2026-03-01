"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { MapPin, Phone, Clock, FileText, Image as ImageIcon, ExternalLink, Route, Navigation } from "lucide-react"

interface PlaceWithHierarchy {
  id: string
  ID?: number
  Name: string
  PlaceType?: string
  Address?: string
  Latitude?: number
  Longitude?: number
  LocationLink?: string
  Phone?: string
  Notes?: string
  ImageLink?: string
  ImageName?: string
  FullAddressText?: string
  governmentName?: string
  cityName?: string
  villageName?: string
  areaName?: string
  // Access Methods
  Method1?: string
  Method1TotalTime?: number
  Method1Notes?: string
  Method1Step1Data?: string
  Method1Step1TimeMinutes?: number
  Method1Step2Data?: string
  Method1Step2TimeMinutes?: number
  Method1Step3Data?: string
  Method1Step3TimeMinutes?: number
  Method1Step4Data?: string
  Method1Step4TimeMinutes?: number
  Method1Step5Data?: string
  Method1Step5TimeMinutes?: number
  Method2?: string
  Method2TotalTime?: number
  Method2Notes?: string
  Method2Step1Data?: string
  Method2Step1TimeMinutes?: number
  Method2Step2Data?: string
  Method2Step2TimeMinutes?: number
  Method2Step3Data?: string
  Method2Step3TimeMinutes?: number
  Method2Step4Data?: string
  Method2Step4TimeMinutes?: number
  Method2Step5Data?: string
  Method2Step5TimeMinutes?: number
  Method3?: string
  Method3TotalTime?: number
  Method3Notes?: string
  Method3Step1Data?: string
  Method3Step1TimeMinutes?: number
  Method3Step2Data?: string
  Method3Step2TimeMinutes?: number
  Method3Step3Data?: string
  Method3Step3TimeMinutes?: number
  Method3Step4Data?: string
  Method3Step4TimeMinutes?: number
  Method3Step5Data?: string
  Method3Step5TimeMinutes?: number
  Method4?: string
  Method4TotalTime?: number
  Method4Notes?: string
  Method4Step1Data?: string
  Method4Step1TimeMinutes?: number
  Method4Step2Data?: string
  Method4Step2TimeMinutes?: number
  Method4Step3Data?: string
  Method4Step3TimeMinutes?: number
  Method4Step4Data?: string
  Method4Step4TimeMinutes?: number
  Method4Step5Data?: string
  Method4Step5TimeMinutes?: number
}

interface PlaceDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  place: PlaceWithHierarchy | null
}

export default function PlaceDetailsDialog({ open, onOpenChange, place }: PlaceDetailsDialogProps) {
  if (!place) return null

  // Function to get filled steps for a method
  const getFilledSteps = (methodNum: number) => {
    const steps = []
    for (let i = 1; i <= 5; i++) {
      const stepData = place[`Method${methodNum}Step${i}Data` as keyof PlaceWithHierarchy] as string
      const stepTime = place[`Method${methodNum}Step${i}TimeMinutes` as keyof PlaceWithHierarchy] as number
      if (stepData && stepData.trim()) {
        steps.push({ data: stepData, time: stepTime || 0 })
      }
    }
    return steps
  }

  // Function to check if any access method has data
  const hasAccessMethods = () => {
    for (let i = 1; i <= 4; i++) {
      const methodName = place[`Method${i}` as keyof PlaceWithHierarchy] as string
      const steps = getFilledSteps(i)
      if (methodName && methodName.trim() || steps.length > 0) {
        return true
      }
    }
    return false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        {/* Header with title */}
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800">
            إدارة المصالح - {place.governmentName || ''} - {place.cityName || ''} - {place.villageName || ''} - {place.areaName || ''}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">عرض وتفاصيل المصلحة المختارة</p>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              البيانات الأساسية
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              الموقع والعنوان
            </TabsTrigger>
            <TabsTrigger value="access" className="flex items-center gap-2">
              طريقة الوصول
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">صورة المصلحة</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  {place.ImageLink ? (
                    <img
                      src={place.ImageLink}
                      alt={place.Name}
                      className="max-w-full h-auto rounded-lg mx-auto"
                      style={{ maxHeight: '200px' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : (
                    <div className="text-gray-400">
                      <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                      <p>لا توجد صورة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">الاسم *</label>
                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                    {place.Name}
                  </div>
                </div>

                {/* Place Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">نوع المصلحة</label>
                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                    {place.PlaceType || 'غير محدد'}
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">الهاتف</label>
                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                    {place.Phone || 'غير محدد'}
                  </div>
                </div>

                {/* Neighborhood */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">الحي *</label>
                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                    {place.areaName || 'الشارع الرئيسي'}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800 min-h-[80px]">
                    {place.Notes || 'أدخل أي ملاحظات إضافية'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Full Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">العنوان الكامل</label>
                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                    {place.FullAddressText || `${place.governmentName || ''} - ${place.cityName || ''} - ${place.villageName || ''} - ${place.areaName || ''}`}
                  </div>
                </div>

                {/* Address Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">العنوان</label>
                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                    {place.Address || 'اسم العنوان المحدد في خريطة جوجل'}
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">خط العرض</label>
                    <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                      {place.Latitude || '0.0'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">خط الطول</label>
                    <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                      {place.Longitude || '0.0'}
                    </div>
                  </div>
                </div>

                {/* Location Link */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">رابط الموقع</label>
                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                    {place.LocationLink ? (
                      <a
                        href={place.LocationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        عرض على الخريطة
                      </a>
                    ) : (
                      'لم يتم تحديد الموقع'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Access Methods Tab */}
          <TabsContent value="access" className="space-y-6">
            {hasAccessMethods() ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((methodNum) => {
                  const methodName = place[`Method${methodNum}` as keyof PlaceWithHierarchy] as string
                  const methodTotalTime = place[`Method${methodNum}TotalTime` as keyof PlaceWithHierarchy] as number
                  const methodNotes = place[`Method${methodNum}Notes` as keyof PlaceWithHierarchy] as string
                  const steps = getFilledSteps(methodNum)

                  if (!methodName?.trim() && steps.length === 0) return null

                  const methodColors = [
                    { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800', accent: 'bg-blue-600' },
                    { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800', accent: 'bg-green-600' },
                    { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800', accent: 'bg-yellow-600' },
                    { bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-800', accent: 'bg-purple-600' }
                  ][methodNum - 1]

                  return (
                    <Card key={methodNum} className={`${methodColors.border} border-2 ${methodColors.bg}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-8 h-8 ${methodColors.accent} rounded-full flex items-center justify-center text-white font-bold`}>
                            {methodNum}
                          </div>
                          <h3 className={`text-xl font-bold ${methodColors.text}`}>
                            {methodName || `الطريقة ${methodNum}`}
                          </h3>
                          {methodTotalTime && (
                            <Badge variant="secondary" className={`${methodColors.bg} ${methodColors.text} border-0`}>
                              <Clock className="w-3 h-3 mr-1" />
                              {methodTotalTime} دقيقة
                            </Badge>
                          )}
                        </div>

                        {/* Method Info Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Method Name and Time */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">اسم الطريقة</label>
                              <div className="p-3 bg-white border border-gray-300 rounded-md">
                                {methodName || `الطريقة ${methodNum}`}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">الوقت الكلي (بالدقائق)</label>
                              <div className="p-3 bg-white border border-gray-300 rounded-md">
                                {methodTotalTime || '0'}
                              </div>
                            </div>
                          </div>

                          {/* Method Notes */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">ملاحظات عامة</label>
                            <div className="p-3 bg-white border border-gray-300 rounded-md min-h-[80px]">
                              {methodNotes || 'لا توجد ملاحظات'}
                            </div>
                          </div>
                        </div>

                        {/* Steps */}
                        {steps.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">الخطوات التفصيلية:</h4>
                            <div className="space-y-4">
                              {steps.map((step, index) => (
                                <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                      <div className={`w-6 h-6 ${methodColors.accent} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
                                        {index + 1}
                                      </div>
                                      وصف الخطوة
                                    </label>
                                    <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-sm">
                                      {step.data}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">الوقت (دقائق)</label>
                                    <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-sm">
                                      {step.time || '0'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="border-2 border-gray-200 bg-gray-50">
                <CardContent className="p-8 text-center">
                  <Route className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد طرق وصول محفوظة</h3>
                  <p className="text-gray-500">لم يتم تعريف أي طرق وصول لهذه المصلحة حتى الآن</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
