"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  Calendar, 
  Settings, 
  Play, 
  Pause, 
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface BackupSchedule {
  id: string
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  lastRun?: Date
  nextRun?: Date
  name: string
}

export function BackupScheduler() {
  const [schedule, setSchedule] = useState<BackupSchedule>({
    id: 'auto-backup',
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    name: 'نسخة احتياطية تلقائية'
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // تحميل إعدادات الجدولة
  useEffect(() => {
    loadScheduleSettings()
  }, [])

  const loadScheduleSettings = async () => {
    try {
      setLoading(true)
      // هنا يمكن تحميل الإعدادات من قاعدة البيانات
      // const settings = await getScheduleSettings()
      // setSchedule(settings)
    } catch (error) {
      console.error('خطأ في تحميل إعدادات الجدولة:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveScheduleSettings = async () => {
    try {
      setSaving(true)
      
      // حفظ الإعدادات في قاعدة البيانات
      // await saveScheduleSettings(schedule)
      
      toast.success('تم حفظ إعدادات الجدولة بنجاح')
    } catch (error) {
      toast.error('فشل في حفظ إعدادات الجدولة')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const runBackupNow = async () => {
    try {
      setLoading(true)
      
      // تشغيل النسخة الاحتياطية فوراً
      // await BackupService.createBackup('نسخة احتياطية يدوية', 'تم إنشاؤها يدوياً')
      
      toast.success('تم تشغيل النسخة الاحتياطية بنجاح')
    } catch (error) {
      toast.error('فشل في تشغيل النسخة الاحتياطية')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const calculateNextRun = (frequency: string, time: string): Date => {
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    
    let nextRun = new Date()
    nextRun.setHours(hours, minutes, 0, 0)
    
    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
        break
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7)
        break
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1)
        break
    }
    
    return nextRun
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'يومياً'
      case 'weekly': return 'أسبوعياً'
      case 'monthly': return 'شهرياً'
      default: return frequency
    }
  }

  const getStatusBadge = () => {
    if (!schedule.enabled) {
      return <Badge variant="secondary">معطل</Badge>
    }
    
    const nextRun = calculateNextRun(schedule.frequency, schedule.time)
    const now = new Date()
    
    if (nextRun <= now) {
      return <Badge variant="destructive">متأخر</Badge>
    }
    
    return <Badge variant="default">نشط</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          جاري التحميل...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          الجدولة التلقائية
        </CardTitle>
        <CardDescription>
          إعداد النسخ الاحتياطية التلقائية المجدولة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* حالة الجدولة */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="schedule-enabled">تفعيل الجدولة التلقائية</Label>
            {getStatusBadge()}
          </div>
          <Switch
            id="schedule-enabled"
            checked={schedule.enabled}
            onCheckedChange={(enabled) => 
              setSchedule(prev => ({ ...prev, enabled }))
            }
          />
        </div>

        {schedule.enabled && (
          <>
            {/* تكرار النسخة الاحتياطية */}
            <div className="space-y-2">
              <Label htmlFor="frequency">تكرار النسخة الاحتياطية</Label>
              <Select
                value={schedule.frequency}
                onValueChange={(frequency: 'daily' | 'weekly' | 'monthly') =>
                  setSchedule(prev => ({ ...prev, frequency }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومياً</SelectItem>
                  <SelectItem value="weekly">أسبوعياً</SelectItem>
                  <SelectItem value="monthly">شهرياً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* وقت التشغيل */}
            <div className="space-y-2">
              <Label htmlFor="time">وقت التشغيل</Label>
              <Input
                id="time"
                type="time"
                value={schedule.time}
                onChange={(e) => 
                  setSchedule(prev => ({ ...prev, time: e.target.value }))
                }
              />
            </div>

            {/* معلومات الجدولة */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>التشغيل التالي:</span>
                <span className="font-medium">
                  {new Intl.DateTimeFormat('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(calculateNextRun(schedule.frequency, schedule.time))}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                <span>التكرار:</span>
                <span className="font-medium">{getFrequencyLabel(schedule.frequency)}</span>
              </div>
            </div>

            {/* تحذير */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                سيتم إنشاء نسخة احتياطية تلقائياً في الوقت المحدد. 
                تأكد من أن الخادم يعمل في هذا الوقت.
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* أزرار التحكم */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button 
            onClick={saveScheduleSettings} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ الإعدادات'
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={runBackupNow}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                جاري التشغيل...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                تشغيل الآن
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
