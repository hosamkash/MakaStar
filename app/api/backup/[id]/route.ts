import { NextRequest, NextResponse } from 'next/server'
import { BackupService } from '@/lib/services/backup-service'

export async function DELETE(
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
    
    await BackupService.deleteBackup(id)
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف النسخة الاحتياطية بنجاح'
    })
  } catch (error) {
    console.error('خطأ في حذف النسخة الاحتياطية:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف النسخة الاحتياطية' },
      { status: 500 }
    )
  }
}
