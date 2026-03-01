import { toast } from 'sonner'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationOptions {
  description?: string
  duration?: number
}

const defaultDuration = 3000 // 3 seconds

export const showNotification = (
  message: string,
  type: NotificationType = 'info',
  options: NotificationOptions = {}
) => {
  const { description, duration = defaultDuration } = options

  const toastOptions = {
    duration,
    style: {
      direction: 'rtl',
      textAlign: 'right' as const,
    }
  }

  switch (type) {
    case 'success':
      toast.success(message, {
        ...toastOptions,
        description,
        style: {
          ...toastOptions.style,
          background: '#dcfce7', // green-100
          border: '1px solid #86efac', // green-300
          color: '#166534', // green-800
        },
      })
      break
    case 'error':
      toast.error(message, {
        ...toastOptions,
        description,
        style: {
          ...toastOptions.style,
          background: '#fee2e2', // red-100
          border: '1px solid #fca5a5', // red-300
          color: '#991b1b', // red-800
        },
      })
      break
    case 'warning':
      toast(message, {
        ...toastOptions,
        description,
        style: {
          ...toastOptions.style,
          background: '#fef9c3', // yellow-100
          border: '1px solid #fde047', // yellow-300
          color: '#854d0e', // yellow-800
        },
      })
      break
    default:
      toast(message, {
        ...toastOptions,
        description,
        style: {
          ...toastOptions.style,
          background: '#e0f2fe', // blue-100
          border: '1px solid #7dd3fc', // blue-300
          color: '#075985', // blue-800
        },
      })
  }
}

// اختصارات للاستخدام السريع
export const notify = {
  success: (message: string, options?: NotificationOptions) => 
    showNotification(message, 'success', options),
  
  error: (message: string, options?: NotificationOptions) => 
    showNotification(message, 'error', options),
  
  warning: (message: string, options?: NotificationOptions) => 
    showNotification(message, 'warning', options),
  
  info: (message: string, options?: NotificationOptions) => 
    showNotification(message, 'info', options)
} 