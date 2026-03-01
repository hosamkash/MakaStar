import { NextRequest, NextResponse } from 'next/server'
import { BackupService } from '@/lib/services/backup-service'

export async function GET() {
  try {
    const backups = await BackupService.getBackups()
    const stats = await BackupService.getBackupStats()
    
    return NextResponse.json({
      success: true,
      data: {
        backups,
        stats
      }
    })
  } catch (error) {
    console.error('خطأ في جلب النسخ الاحتياطية:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب النسخ الاحتياطية' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'اسم النسخة الاحتياطية مطلوب' },
        { status: 400 }
      )
    }
    
    const metadata = await BackupService.createBackup(name, description)
    
    return NextResponse.json({
      success: true,
      data: metadata
    })
  } catch (error) {
    console.error('خطأ في إنشاء النسخة الاحتياطية:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء النسخة الاحتياطية' },
      { status: 500 }
    )
  }
}
