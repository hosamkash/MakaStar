'use client'

import { useEffect } from 'react'
import Image from 'next/image'

export default function MainWebSitePage() {
  useEffect(() => {
    // Redirect after 5 seconds
    const redirectTimer = setTimeout(() => {
    // window.location.href = 'http://localhost:5000/store?tenant=Maka'
      window.location.href = 'https://www.vigilhub.app/store?tenant=Maka'
    }, 5000)

    return () => {
      clearTimeout(redirectTimer)
    }
  }, [])

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        margin: 0,
        padding: 0
      }}>
        {/* Logo Container - Rotate Effect */}
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
      </div>

      <style jsx global>{`
        .logo-rotate {
          animation: rotate 1.5s ease-out forwards;
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
