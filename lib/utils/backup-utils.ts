/**
 * أدوات مساعدة للنسخ الاحتياطية
 * تشمل ضغط البيانات وتشفيرها
 */

// دالة ضغط البيانات باستخدام LZ-string
export function compressData(data: any): string {
  try {
    // استخدام JSON.stringify مع ضغط بسيط
    const jsonString = JSON.stringify(data)
    
    // ضغط بسيط باستخدام تقنية RLE (Run Length Encoding)
    return compressString(jsonString)
  } catch (error) {
    console.error('خطأ في ضغط البيانات:', error)
    return JSON.stringify(data)
  }
}

// دالة فك ضغط البيانات
export function decompressData(compressedData: string): any {
  try {
    const decompressedString = decompressString(compressedData)
    return JSON.parse(decompressedString)
  } catch (error) {
    console.error('خطأ في فك ضغط البيانات:', error)
    return JSON.parse(compressedData)
  }
}

// ضغط بسيط للنصوص
function compressString(str: string): string {
  let compressed = ''
  let count = 1
  
  for (let i = 0; i < str.length; i++) {
    if (str[i] === str[i + 1]) {
      count++
    } else {
      if (count > 3) {
        compressed += `[${count}${str[i]}]`
      } else {
        compressed += str[i].repeat(count)
      }
      count = 1
    }
  }
  
  return compressed
}

// فك ضغط بسيط للنصوص
function decompressString(compressed: string): string {
  return compressed.replace(/\[(\d+)(.)\]/g, (match, count, char) => {
    return char.repeat(parseInt(count))
  })
}

// تشفير بسيط للبيانات الحساسة
export function encryptData(data: string, key: string): string {
  try {
    // تشفير بسيط باستخدام XOR
    let encrypted = ''
    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i)
      const keyChar = key.charCodeAt(i % key.length)
      encrypted += String.fromCharCode(dataChar ^ keyChar)
    }
    
    // تحويل إلى Base64
    return btoa(encrypted)
  } catch (error) {
    console.error('خطأ في تشفير البيانات:', error)
    return data
  }
}

// فك تشفير البيانات
export function decryptData(encryptedData: string, key: string): string {
  try {
    // تحويل من Base64
    const encrypted = atob(encryptedData)
    
    // فك تشفير XOR
    let decrypted = ''
    for (let i = 0; i < encrypted.length; i++) {
      const encryptedChar = encrypted.charCodeAt(i)
      const keyChar = key.charCodeAt(i % key.length)
      decrypted += String.fromCharCode(encryptedChar ^ keyChar)
    }
    
    return decrypted
  } catch (error) {
    console.error('خطأ في فك تشفير البيانات:', error)
    return encryptedData
  }
}

// حساب حجم البيانات
export function calculateDataSize(data: any): number {
  return JSON.stringify(data).length
}

// تنسيق حجم الملف
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت'
  
  const k = 1024
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// إنشاء معرف فريد للنسخة الاحتياطية
export function generateBackupId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `backup_${timestamp}_${random}`
}

// التحقق من صحة البيانات
export function validateBackupData(data: any): boolean {
  try {
    if (!data || typeof data !== 'object') {
      return false
    }
    
    if (!data.metadata || !data.collections) {
      return false
    }
    
    if (!data.metadata.id || !data.metadata.name || !data.metadata.createdAt) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('خطأ في التحقق من صحة البيانات:', error)
    return false
  }
}

// تنظيف البيانات القديمة
export function cleanOldBackups(backups: any[], maxAge: number = 30): any[] {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - maxAge)
  
  return backups.filter(backup => {
    const backupDate = new Date(backup.createdAt)
    return backupDate > cutoffDate
  })
}

// إنشاء تقرير النسخة الاحتياطية
export function generateBackupReport(backupData: any): {
  summary: string
  details: string[]
  warnings: string[]
} {
  const details: string[] = []
  const warnings: string[] = []
  
  // إحصائيات المجموعات
  const collectionCount = Object.keys(backupData.collections).length
  details.push(`عدد المجموعات: ${collectionCount}`)
  
  // إحصائيات المستندات
  let totalDocuments = 0
  Object.values(backupData.collections).forEach((docs: any) => {
    totalDocuments += docs.length
  })
  details.push(`إجمالي المستندات: ${totalDocuments}`)
  
  // إحصائيات الملفات
  const fileCount = Object.keys(backupData.storageFiles || {}).length
  details.push(`عدد الملفات: ${fileCount}`)
  
  // حجم البيانات
  const size = calculateDataSize(backupData)
  details.push(`حجم البيانات: ${formatFileSize(size)}`)
  
  // تحذيرات
  if (size > 100 * 1024 * 1024) { // أكبر من 100 ميجابايت
    warnings.push('حجم النسخة الاحتياطية كبير جداً')
  }
  
  if (totalDocuments === 0) {
    warnings.push('لا توجد مستندات في النسخة الاحتياطية')
  }
  
  const summary = `تم إنشاء نسخة احتياطية تحتوي على ${collectionCount} مجموعة و ${totalDocuments} مستند`
  
  return {
    summary,
    details,
    warnings
  }
}
