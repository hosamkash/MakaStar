'use client'

import Image from 'next/image'

export default function MainWebSitePage() {
  const STORE_URL = 'https://www.vigilhub.app/store?tenant=Maka'
  const COMPANY_APP_URL = 'https://www.vigilhub.app/dashboard/login'

  const openStore = () => {
    window.location.href = STORE_URL
  }

  const openCompanyApp = () => {
    window.location.href = COMPANY_APP_URL
  }

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
        <button
          type="button"
          className="logo-shell"
          aria-label="متجر المنتجات"
          onClick={openStore}
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
          اختر وجهتك:
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: 'min(92vw, 280px)'
        }}>
          <button
            type="button"
            onClick={openStore}
            style={{
              padding: '10px 16px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            متجر المنتجات
          </button>

          <button
            type="button"
            onClick={openCompanyApp}
            style={{
              padding: '10px 16px',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            تطبيق الشركة (الإدارة)
          </button>
        </div>
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
