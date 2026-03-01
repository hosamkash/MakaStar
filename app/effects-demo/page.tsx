'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

// قائمة بجميع التأثيرات المتاحة
type EffectType = 
  | 'hourglass' 
  | 'split-4' 
  | 'fade-in' 
  | 'zoom-in' 
  | 'slide-up' 
  | 'rotate'
  | 'pixelate'
  | 'wave'

const effects: { name: EffectType; label: string; description: string }[] = [
  { name: 'hourglass', label: 'ساعة رملية', description: 'الصورة تظهر من الوسط للأعلى والأسفل' },
  { name: 'split-4', label: 'تقسيم 4 أجزاء', description: 'الصورة مقسمة لـ 4 أجزاء تظهر تدريجياً' },
  { name: 'fade-in', label: 'ظهور تدريجي', description: 'الصورة تظهر تدريجياً' },
  { name: 'zoom-in', label: 'تكبير', description: 'الصورة تكبر من الصغير للكبير' },
  { name: 'slide-up', label: 'انزلاق للأعلى', description: 'الصورة تنزلق من الأسفل للأعلى' },
  { name: 'rotate', label: 'دوران', description: 'الصورة تدور وتظهر' },
  { name: 'pixelate', label: 'بكسل', description: 'الصورة تظهر من ضبابي لواضح' },
  { name: 'wave', label: 'موجة', description: 'الصورة تظهر كموجة' },
]

export default function EffectsDemoPage() {
  const [selectedEffect, setSelectedEffect] = useState<EffectType>('hourglass')

  useEffect(() => {
    // Reset animation when effect changes
    const timer = setTimeout(() => {
      // Force re-render
    }, 100)
    return () => clearTimeout(timer)
  }, [selectedEffect])

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        margin: 0,
        padding: '20px',
        gap: '30px'
      }}>
        {/* Effect Selector */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center',
          maxWidth: '800px',
          width: '100%'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>اختر التأثير المفضل</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px',
            width: '100%'
          }}>
            {effects.map((effect) => (
              <button
                key={effect.name}
                onClick={() => setSelectedEffect(effect.name)}
                style={{
                  padding: '12px 16px',
                  border: selectedEffect === effect.name ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: selectedEffect === effect.name ? '#007bff' : '#fff',
                  color: selectedEffect === effect.name ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedEffect === effect.name ? 'bold' : 'normal',
                  transition: 'all 0.3s',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{effect.label}</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{effect.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Logo Container */}
        <div style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          backgroundColor: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Effect 1: Hourglass */}
          {selectedEffect === 'hourglass' && (
            <div style={{ position: 'relative', width: '200px', height: '200px', overflow: 'hidden' }}>
              <div className="effect-hourglass-top">
                <div className="effect-image-wrapper">
                  <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
                </div>
              </div>
              <div className="effect-hourglass-bottom">
                <div className="effect-image-wrapper">
                  <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
                </div>
              </div>
            </div>
          )}

          {/* Effect 2: Split into 4 parts */}
          {selectedEffect === 'split-4' && (
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              <div className="effect-split effect-split-1">
                <div className="effect-image-wrapper">
                  <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
                </div>
              </div>
              <div className="effect-split effect-split-2">
                <div className="effect-image-wrapper">
                  <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
                </div>
              </div>
              <div className="effect-split effect-split-3">
                <div className="effect-image-wrapper">
                  <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
                </div>
              </div>
              <div className="effect-split effect-split-4">
                <div className="effect-image-wrapper">
                  <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
                </div>
              </div>
            </div>
          )}

          {/* Effect 3: Fade In */}
          {selectedEffect === 'fade-in' && (
            <div className="effect-fade-in" style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/maka-star-logo.png" alt="مكة ستار" width={200} height={200} style={{ objectFit: 'contain' }} priority />
            </div>
          )}

          {/* Effect 4: Zoom In */}
          {selectedEffect === 'zoom-in' && (
            <div className="effect-zoom-in" style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/maka-star-logo.png" alt="مكة ستار" width={200} height={200} style={{ objectFit: 'contain' }} priority />
            </div>
          )}

          {/* Effect 5: Slide Up */}
          {selectedEffect === 'slide-up' && (
            <div className="effect-slide-up" style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/maka-star-logo.png" alt="مكة ستار" width={200} height={200} style={{ objectFit: 'contain' }} priority />
            </div>
          )}

          {/* Effect 6: Rotate */}
          {selectedEffect === 'rotate' && (
            <div className="effect-rotate" style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/maka-star-logo.png" alt="مكة ستار" width={200} height={200} style={{ objectFit: 'contain' }} priority />
            </div>
          )}

          {/* Effect 7: Pixelate */}
          {selectedEffect === 'pixelate' && (
            <div className="effect-pixelate" style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/maka-star-logo.png" alt="مكة ستار" width={200} height={200} style={{ objectFit: 'contain' }} priority />
            </div>
          )}

          {/* Effect 8: Wave */}
          {selectedEffect === 'wave' && (
            <div className="effect-wave" style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/maka-star-logo.png" alt="مكة ستار" width={200} height={200} style={{ objectFit: 'contain' }} priority />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
          maxWidth: '600px'
        }}>
          <p>اضغط على أي زر أعلاه لتجربة التأثير</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            بعد اختيار التأثير المفضل، يمكنك نسخ الكود من ملف <code>app/page.tsx</code>
          </p>
        </div>
      </div>

      <style jsx global>{`
        /* Hourglass Effect */
        .effect-hourglass-top {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 50%;
          overflow: hidden;
          animation: hourglassTop 2s ease-in-out forwards;
        }

        .effect-hourglass-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 50%;
          overflow: hidden;
          animation: hourglassBottom 2s ease-in-out forwards;
        }

        @keyframes hourglassTop {
          0% {
            clip-path: polygon(50% 100%, 50% 100%, 50% 100%, 50% 100%);
            opacity: 0;
            transform: translateY(100%);
          }
          50% {
            clip-path: polygon(0 100%, 100% 100%, 100% 50%, 0 50%);
            opacity: 0.8;
            transform: translateY(50%);
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes hourglassBottom {
          0% {
            clip-path: polygon(50% 0%, 50% 0%, 50% 0%, 50% 0%);
            opacity: 0;
            transform: translateY(-100%);
          }
          50% {
            clip-path: polygon(0 0%, 100% 0%, 100% 50%, 0 50%);
            opacity: 0.8;
            transform: translateY(-50%);
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Split 4 Parts Effect */
        .effect-split {
          position: absolute;
          width: 50%;
          height: 50%;
          overflow: hidden;
        }

        .effect-split-1 {
          top: 0;
          left: 0;
          animation: split1 1.2s ease-out forwards;
        }

        .effect-split-2 {
          top: 0;
          right: 0;
          animation: split2 1.2s ease-out 0.3s forwards;
          opacity: 0;
        }

        .effect-split-3 {
          bottom: 0;
          left: 0;
          animation: split3 1.2s ease-out 0.6s forwards;
          opacity: 0;
        }

        .effect-split-4 {
          bottom: 0;
          right: 0;
          animation: split4 1.2s ease-out 0.9s forwards;
          opacity: 0;
        }

        @keyframes split1 {
          0% {
            opacity: 0;
            transform: translateX(-30px) translateY(-30px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        @keyframes split2 {
          0% {
            opacity: 0;
            transform: translateX(30px) translateY(-30px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        @keyframes split3 {
          0% {
            opacity: 0;
            transform: translateX(-30px) translateY(30px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        @keyframes split4 {
          0% {
            opacity: 0;
            transform: translateX(30px) translateY(30px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        /* Fade In Effect */
        .effect-fade-in {
          animation: fadeIn 1.5s ease-out forwards;
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        /* Zoom In Effect */
        .effect-zoom-in {
          animation: zoomIn 1.5s ease-out forwards;
        }

        @keyframes zoomIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Slide Up Effect */
        .effect-slide-up {
          animation: slideUp 1.5s ease-out forwards;
        }

        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(50px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Rotate Effect */
        .effect-rotate {
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

        /* Pixelate Effect */
        .effect-pixelate {
          animation: pixelate 2s ease-out forwards;
        }

        @keyframes pixelate {
          0% {
            filter: blur(20px);
            opacity: 0;
          }
          50% {
            filter: blur(5px);
            opacity: 0.5;
          }
          100% {
            filter: blur(0px);
            opacity: 1;
          }
        }

        /* Wave Effect */
        .effect-wave {
          animation: wave 2s ease-in-out forwards;
        }

        @keyframes wave {
          0% {
            opacity: 0;
            transform: scaleY(0) scaleX(0);
          }
          25% {
            opacity: 0.5;
            transform: scaleY(0.3) scaleX(1);
          }
          50% {
            opacity: 0.7;
            transform: scaleY(0.7) scaleX(1);
          }
          75% {
            opacity: 0.9;
            transform: scaleY(0.9) scaleX(1);
          }
          100% {
            opacity: 1;
            transform: scaleY(1) scaleX(1);
          }
        }

        .effect-image-wrapper {
          position: absolute;
          width: 200px;
          height: 200px;
        }

        .effect-hourglass-top .effect-image-wrapper {
          top: 0;
          left: 0;
        }

        .effect-hourglass-bottom .effect-image-wrapper {
          bottom: 0;
          left: 0;
        }

        .effect-split-1 .effect-image-wrapper {
          top: 0;
          left: 0;
        }

        .effect-split-2 .effect-image-wrapper {
          top: 0;
          right: 0;
        }

        .effect-split-3 .effect-image-wrapper {
          bottom: 0;
          left: 0;
        }

        .effect-split-4 .effect-image-wrapper {
          bottom: 0;
          right: 0;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </>
  )
}
