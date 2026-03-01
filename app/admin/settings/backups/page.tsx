"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Calendar, 
  HardDrive, 
  Database, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { BackupService, BackupMetadata } from '@/lib/services/backup-service'
import { BackupScheduler } from '@/components/backup-scheduler'
import { toast } from 'sonner'

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalBackups: 0, totalSize: 0, lastBackup: undefined as Date | undefined })
  
  // نموذج إنشاء نسخة احتياطية
  const [backupForm, setBackupForm] = useState({
    name: '',
    description: ''
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // تحميل البيانات
  useEffect(() => {
    loadBackups()
    loadStats()
  }, [])

  const loadBackups = async () => {
    try {
      setLoading(true)
      const backupList = await BackupService.getBackups()
      setBackups(backupList)
    } catch (error) {
      toast.error('فشل في تحميل النسخ الاحتياطية')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const backupStats = await BackupService.getBackupStats()
      setStats(backupStats)
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error)
    }
  }

  const createBackup = async () => {
    if (!backupForm.name.trim()) {
      toast.error('يرجى إدخال اسم النسخة الاحتياطية')
      return
    }

    try {
      setCreating(true)
      const metadata = await BackupService.createBackup(backupForm.name, backupForm.description)
      
      toast.success('تم إنشاء النسخة الاحتياطية بنجاح')
      setBackupForm({ name: '', description: '' })
      setShowCreateDialog(false)
      
      // إعادة تحميل البيانات
      await loadBackups()
      await loadStats()
    } catch (error) {
      toast.error('فشل في إنشاء النسخة الاحتياطية')
      console.error(error)
    } finally {
      setCreating(false)
    }
  }

  const restoreBackup = async (backupId: string) => {
    try {
      setRestoring(backupId)
      await BackupService.restoreBackup(backupId)
      toast.success('تم استعادة النسخة الاحتياطية بنجاح')
    } catch (error) {
      toast.error('فشل في استعادة النسخة الاحتياطية')
      console.error(error)
    } finally {
      setRestoring(null)
    }
  }

  const deleteBackup = async (backupId: string) => {
    try {
      setDeleting(backupId)
      await BackupService.deleteBackup(backupId)
      toast.success('تم حذف النسخة الاحتياطية بنجاح')
      
      // إعادة تحميل البيانات
      await loadBackups()
      await loadStats()
    } catch (error) {
      toast.error('فشل في حذف النسخة الاحتياطية')
      console.error(error)
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت'
    const k = 1024
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">النسخ الاحتياطية</h1>
          <p className="text-muted-foreground mt-2">
            إدارة النسخ الاحتياطية لبيانات الفايربيز واستعادتها عند الحاجة
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء نسخة احتياطية
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء نسخة احتياطية جديدة</DialogTitle>
              <DialogDescription>
                سيتم نسخ جميع البيانات المهمة من الفايربيز
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="backup-name">اسم النسخة الاحتياطية *</Label>
                <Input
                  id="backup-name"
                  value={backupForm.name}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: نسخة احتياطية يومية"
                />
              </div>
              
              <div>
                <Label htmlFor="backup-description">وصف (اختياري)</Label>
                <Textarea
                  id="backup-description"
                  value={backupForm.description}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للنسخة الاحتياطية..."
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={createBackup} disabled={creating}>
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  'إنشاء النسخة'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي النسخ</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBackups}</div>
            <p className="text-xs text-muted-foreground">
              نسخة احتياطية
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحجم الإجمالي</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              من مساحة التخزين
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">آخر نسخة</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastBackup ? formatDate(stats.lastBackup) : 'لا توجد'}
            </div>
            <p className="text-xs text-muted-foreground">
              نسخة احتياطية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* تحذير مهم */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>تنبيه مهم:</strong> النسخ الاحتياطية تحتوي على جميع البيانات المهمة. 
          تأكد من إنشاء نسخ احتياطية منتظمة لحماية بياناتك.
        </AlertDescription>
      </Alert>

      {/* الجدولة التلقائية */}
      <BackupScheduler />

      {/* قائمة النسخ الاحتياطية */}
      <Card>
        <CardHeader>
          <CardTitle>النسخ الاحتياطية المتاحة</CardTitle>
          <CardDescription>
            قائمة بجميع النسخ الاحتياطية المحفوظة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              جاري التحميل...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد نسخ احتياطية بعد</p>
              <p className="text-sm">أنشئ أول نسخة احتياطية لحماية بياناتك</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{backup.name}</h3>
                        <Badge variant="secondary">v{backup.version}</Badge>
                      </div>
                      
                      {backup.description && (
                        <p className="text-sm text-muted-foreground">{backup.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(backup.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(backup.size)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {backup.collections.length} مجموعة
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {backup.storageFiles} ملف
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Upload className="h-3 w-3" />
                            استعادة
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الاستعادة</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من استعادة النسخة الاحتياطية "{backup.name}"؟ 
                              <br />
                              <strong className="text-destructive">تحذير:</strong> سيتم استبدال جميع البيانات الحالية.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => restoreBackup(backup.id)}
                              disabled={restoring === backup.id}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              {restoring === backup.id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  جاري الاستعادة...
                                </>
                              ) : (
                                'تأكيد الاستعادة'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-3 w-3" />
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف النسخة الاحتياطية "{backup.name}"؟ 
                              <br />
                              لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBackup(backup.id)}
                              disabled={deleting === backup.id}
                            >
                              {deleting === backup.id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  جاري الحذف...
                                </>
                              ) : (
                                'تأكيد الحذف'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


