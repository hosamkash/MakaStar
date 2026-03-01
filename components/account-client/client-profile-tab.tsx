'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Hash, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Lock, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Users,
  MessageCircle
} from 'lucide-react'

interface ClientProfileTabProps {
  clientData: {
    code: string
    name: string
    mobile: string
    phone: string
    username: string
    email: string
    notes: string
    createdDate?: string
    createdTime?: string
    personalSponsorID?: string
    personalSponsorName?: string
    personalSponsorCode?: string
    personalSponsorMobile?: string
  }
  locationData: {
    latitude: string
    longitude: string
    address: string
  }
  onClientDataChange: (data: any) => void
  onLocationDataChange: (data: any) => void
  onSaveChanges: () => void
  onGetLocation: () => void
  onClearLocation: () => void
  onOpenMap: () => void
  onGetAddressFromLocation: () => void
}

export default function ClientProfileTab({
  clientData,
  locationData,
  onClientDataChange,
  onLocationDataChange,
  onSaveChanges,
  onGetLocation,
  onClearLocation,
  onOpenMap,
  onGetAddressFromLocation
}: ClientProfileTabProps) {
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  // دالة الاتصال العادي
  const handleCall = (mobile: string) => {
    if (mobile) {
      window.open(`tel:${mobile}`, '_self')
    }
  }

  // دالة الواتس آب
  const handleWhatsApp = (mobile: string) => {
    if (mobile) {
      // تنظيف رقم الموبيل من المسافات والرموز
      const cleanMobile = mobile.replace(/\s+/g, '').replace(/[^\d]/g, '')
      // إضافة رمز مصر إذا لم يكن موجوداً
      const formattedMobile = cleanMobile.startsWith('20') ? cleanMobile : `20${cleanMobile}`
      
      // إنشاء رسالة ترحيبية مع بيانات العميل
      const clientName = clientData.name || 'العميل'
      const clientAddress = locationData.address || 'لم يتم تحديد العنوان'
      const clientCode = clientData.code || ''
      const clientMobile = clientData.mobile || ''
      
      const welcomeMessage = `مرحباً ${clientData.personalSponsorName || 'السيد/ة'}،

أنا ${clientName}${clientCode ? ` (كود العميل: ${clientCode})` : ''} وأريد التواصل معك.

بياناتي:
- الاسم: ${clientName}
- الموبيل: ${clientMobile}
- العنوان: ${clientAddress}

أشكرك على خدمتك المتميزة.`

      // ترميز الرسالة للرابط
      const encodedMessage = encodeURIComponent(welcomeMessage)
      const whatsappUrl = `https://wa.me/${formattedMobile}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
    }
  }

  const handleChangePassword = () => {
    setIsChangePasswordDialogOpen(true)
  }

  const handleSavePassword = () => {
    // TODO: Implement password change logic
    console.log('Saving password:', passwordForm)
    setIsChangePasswordDialogOpen(false)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  return (
    <>
      {/* الراعي الشخصي */}
      {clientData.personalSponsorName && (
        <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">الراعي الشخصي</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">{clientData.personalSponsorName}</span>
                  </div>
                  
                  {clientData.personalSponsorCode && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600">كود: {clientData.personalSponsorCode}</span>
                    </div>
                  )}
                  
                  {clientData.personalSponsorMobile && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600">{clientData.personalSponsorMobile}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCall(clientData.personalSponsorMobile || '')}
                          className="h-7 px-2 text-xs bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                        >
                          <Phone className="w-3 h-3 ml-1" />
                          اتصال
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWhatsApp(clientData.personalSponsorMobile || '')}
                          className="h-7 px-2 text-xs bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                        >
                          <MessageCircle className="w-3 h-3 ml-1" />
                          واتس آب
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-blue-500 mt-2">مندوب مخصص لخدمتك</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Client Identification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  الكود
                </Label>
                <Input
                  value={clientData.code}
                  onChange={(e) => onClientDataChange({...clientData, code: e.target.value})}
                  className="text-right"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  الإسم
                </Label>
                <Input
                  value={clientData.name}
                  onChange={(e) => onClientDataChange({...clientData, name: e.target.value})}
                  className="text-right"
                />
              </div>
            </div>

            {/* Personal Data */}
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Mobile and Phone in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">الموبيل</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={clientData.mobile}
                        onChange={(e) => onClientDataChange({...clientData, mobile: e.target.value})}
                        className="pr-10 pl-10 text-right"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">الهاتف</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={clientData.phone}
                        onChange={(e) => onClientDataChange({...clientData, phone: e.target.value})}
                        className="pr-10 pl-10 text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Username and Email in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">المستخدم</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={clientData.username}
                        onChange={(e) => onClientDataChange({...clientData, username: e.target.value})}
                        className="pr-10 text-right"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">الإيميل</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={clientData.email}
                        onChange={(e) => onClientDataChange({...clientData, email: e.target.value})}
                        className="pr-10 pl-10 text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">ملاحظات</Label>
                  <Input
                    value={clientData.notes}
                    onChange={(e) => onClientDataChange({...clientData, notes: e.target.value})}
                    placeholder="أدخل الملاحظات"
                    className="text-right"
                  />
                </div>

                {/* تاريخ الإنشاء */}
                {clientData.createdDate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span className="text-gray-500">📅</span>
                        تاريخ الإنشاء
                      </Label>
                      <Input
                        value={clientData.createdDate}
                        readOnly
                        className="text-right bg-gray-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span className="text-gray-500">🕐</span>
                        وقت الإنشاء
                      </Label>
                      <Input
                        value={clientData.createdTime}
                        readOnly
                        className="text-right bg-gray-50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address and Location */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                العنوان والموقع
              </h4>
              
              <div className="space-y-3">
                {/* Get Location Button */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={onClearLocation}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={onGetLocation}>
                    <MapPin className="w-4 h-4 ml-2" />
                    الحصول على اللوكيشن
                  </Button>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">خط الطول</Label>
                    <Input
                      value={locationData.longitude}
                      onChange={(e) => onLocationDataChange({...locationData, longitude: e.target.value})}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">خط العرض</Label>
                    <Input
                      value={locationData.latitude}
                      onChange={(e) => onLocationDataChange({...locationData, latitude: e.target.value})}
                      className="text-right"
                    />
                  </div>
                </div>

                {/* Location URL */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">اللوكيشن</Label>
                  <Input
                    value={`https://www.google.com/maps/search/?api=1&query=${locationData.latitude},${locationData.longitude}`}
                    className="text-right text-xs"
                    readOnly
                  />
                </div>

                {/* Detailed Address */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">العنوان تفصيلي من الخريطة</Label>
                  <Input
                    value={locationData.address}
                    onChange={(e) => onLocationDataChange({...locationData, address: e.target.value})}
                    className="text-right text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  {/* Open Map Button */}
                  <Button 
                    variant="outline" 
                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={onOpenMap}
                  >
                    <MapPin className="w-4 h-4 ml-2" />
                    فتح الخريطة
                  </Button>
                
                  {/* Get Address Button */}
                  <Button 
                    variant="outline" 
                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={onGetAddressFromLocation}
                  >
                    <MapPin className="w-4 h-4 ml-2" />
                    جلب العنوان من اللوكيشن
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={onSaveChanges}
              >
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
             
              <Button 
                variant="outline" 
                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={handleChangePassword}
              >
                <Lock className="w-4 h-4 ml-2" />
                تغيير كلمة المرور
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:bg-blue-50 p-1"
                onClick={() => setIsChangePasswordDialogOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
              <DialogTitle className="text-blue-600 font-bold">تغيير الباسورد</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1">
              <Label className="text-right block text-sm">الباسورد الحالي</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="pr-10 pl-10 text-right"
                  placeholder="أدخل كلمة المرور الحالية"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <Label className="text-right block text-sm">كلمة السر الجديدة</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="pr-10 pl-10 text-right"
                  placeholder="أدخل كلمة المرور الجديدة"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label className="text-right block text-sm">تأكيد الباسورد</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <RotateCcw className="w-4 h-4 text-gray-400" />
                </div>
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="pr-10 pl-10 text-right"
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              onClick={handleSavePassword}
            >
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
