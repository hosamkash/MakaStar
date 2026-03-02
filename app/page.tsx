'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function MainWebSitePage() {
  const STORE_URL = 'https://www.vigilhub.app/store?tenant=Maka'
  const REDIRECT_DELAY_MS = 5000
  const [progress, setProgress] = useState(0)

  const statusText =
    progress < 35
      ? 'جاري تجهيز بيانات المتجر'
      : progress < 75
        ? 'يرجى الانتظار، يتم تحميل المحتوى'
        : 'اكتمل التحميل، المتجر جاهز للعرض'

  const handleRedirectNow = () => {
    window.location.href = STORE_URL
  }

  useEffect(() => {
    const startTime = Date.now()

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const nextProgress = Math.min((elapsed / REDIRECT_DELAY_MS) * 100, 100)
      setProgress(nextProgress)
    }, 60)

    // Redirect after 5 seconds
    const redirectTimer = setTimeout(() => {
      window.location.href = STORE_URL
    }, REDIRECT_DELAY_MS)

    return () => {
      clearInterval(progressTimer)
      clearTimeout(redirectTimer)
    }
  }, [STORE_URL])

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        margin: 0,
        padding: '24px',
        gap: '20px'
      }}>
        <div className="loading-status" style={{
          textAlign: 'center',
          width: 'min(92vw, 420px)'
        }}>
          <p style={{
            margin: 0,
            marginBottom: '10px',
            fontSize: '15px',
            fontWeight: 700,
            color: '#0f172a'
          }}>
            {statusText}
          </p>
          <div style={{
            width: '100%',
            height: '8px',
            borderRadius: '999px',
            background: '#e2e8f0',
            overflow: 'hidden'
          }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: '999px',
                transition: 'width 120ms linear',
                background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)'
              }}
            />
          </div>
          <p style={{
            margin: '8px 0 0',
            fontSize: '13px',
            color: '#475569'
          }}>
            {Math.round(progress)}% - يتم تجهيز البيانات
          </p>
        </div>

        {/* Logo Container - Rotate Effect */}
        <button
          type="button"
          className="logo-shell"
          aria-label="عرض المتجر الآن"
          onClick={handleRedirectNow}
          style={{
            width: '220px',
            height: '220px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer'
          }}
        >
          <div className="logo-rotate" style={{
            width: '200px',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Image
              src="/maka-star-logo.png"
              alt="مكة ستار"
              width={200}
              height={200}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </button>

        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          انتظر ثوانٍ قليلة أو اضغط على اللوجو لعرض المتجر الآن
        </p>
      </div>

      <style jsx global>{`
        .logo-shell {
          border-radius: 9999px;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
          animation: pulseShadow 1.8s ease-in-out infinite;
        }

        .logo-rotate {
          animation: rotate 1.5s ease-out forwards;
        }

        @keyframes pulseShadow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 24px 60px rgba(239, 68, 68, 0.22);
          }
        }

        @keyframes rotate {
          0% {
            opacity: 0;
            transform: rotate(-180deg) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
        }

        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>
    </>
  )
}
