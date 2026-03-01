import { NextRequest, NextResponse } from 'next/server'
import { BackupService } from '@/lib/services/backup-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف النسخة الاحتياطية مطلوب' },
        { status: 400 }
      )
    }
    
    await BackupService.restoreBackup(id)
    
    return NextResponse.json({
      success: true,
      message: 'تم استعادة النسخة الاحتياطية بنجاح'
    })
  } catch (error) {
    console.error('خطأ في استعادة النسخة الاحتياطية:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في استعادة النسخة الاحتياطية' },
      { status: 500 }
    )
  }
}
