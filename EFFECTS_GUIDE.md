# دليل تطبيق التأثيرات على صفحة Loading

## 📍 الملف المطلوب التعديل عليه:
`app/page.tsx`

---

## 🎨 التأثيرات المتاحة:

### 1️⃣ تأثير الساعة الرملية (Hourglass) - الحالي
**الكود المطلوب:**

```tsx
{/* Logo Container - Hourglass Effect */}
<div style={{
  position: 'relative',
  width: '200px',
  height: '200px',
  overflow: 'hidden'
}}>
  {/* Top Half */}
  <div className="logo-part logo-part-top">
    <div className="logo-image-wrapper">
      <Image
        src="/maka-star-logo.png"
        alt="مكة ستار"
        fill
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  </div>
  {/* Bottom Half */}
  <div className="logo-part logo-part-bottom">
    <div className="logo-image-wrapper">
      <Image
        src="/maka-star-logo.png"
        alt="مكة ستار"
        fill
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  </div>
</div>
```

**CSS المطلوب (في `<style jsx global>`):**
```css
.logo-part {
  position: absolute;
  width: 100%;
  height: 50%;
  overflow: hidden;
}

.logo-part-top {
  top: 0;
  left: 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  animation: revealTop 2s ease-in-out forwards;
}

.logo-part-bottom {
  bottom: 0;
  left: 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  animation: revealBottom 2s ease-in-out forwards;
}

@keyframes revealTop {
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

@keyframes revealBottom {
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
```

---

### 2️⃣ تأثير التقسيم 4 أجزاء (Split-4)

**استبدل الكود من السطر 30-62 بهذا:**

```tsx
{/* Logo Container - Split 4 Parts */}
<div style={{
  position: 'relative',
  width: '200px',
  height: '200px'
}}>
  {/* Part 1: Top Left */}
  <div className="logo-part logo-part-1">
    <div className="logo-image-wrapper">
      <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
    </div>
  </div>
  {/* Part 2: Top Right */}
  <div className="logo-part logo-part-2">
    <div className="logo-image-wrapper">
      <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
    </div>
  </div>
  {/* Part 3: Bottom Left */}
  <div className="logo-part logo-part-3">
    <div className="logo-image-wrapper">
      <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
    </div>
  </div>
  {/* Part 4: Bottom Right */}
  <div className="logo-part logo-part-4">
    <div className="logo-image-wrapper">
      <Image src="/maka-star-logo.png" alt="مكة ستار" fill style={{ objectFit: 'contain' }} priority />
    </div>
  </div>
</div>
```

**استبدل CSS من السطر 65-137 بهذا:**

```css
.logo-part {
  position: absolute;
  width: 50%;
  height: 50%;
  overflow: hidden;
}

.logo-part-1 {
  top: 0;
  left: 0;
  animation: split1 1.2s ease-out forwards;
}

.logo-part-2 {
  top: 0;
  right: 0;
  animation: split2 1.2s ease-out 0.3s forwards;
  opacity: 0;
}

.logo-part-3 {
  bottom: 0;
  left: 0;
  animation: split3 1.2s ease-out 0.6s forwards;
  opacity: 0;
}

.logo-part-4 {
  bottom: 0;
  right: 0;
  animation: split4 1.2s ease-out 0.9s forwards;
  opacity: 0;
}

.logo-image-wrapper {
  position: absolute;
  width: 200px;
  height: 200px;
}

.logo-part-1 .logo-image-wrapper {
  top: 0;
  left: 0;
}

.logo-part-2 .logo-image-wrapper {
  top: 0;
  right: 0;
}

.logo-part-3 .logo-image-wrapper {
  bottom: 0;
  left: 0;
}

.logo-part-4 .logo-image-wrapper {
  bottom: 0;
  right: 0;
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
```

---

### 3️⃣ تأثير الظهور التدريجي (Fade-in)

**استبدل الكود من السطر 30-62 بهذا:**

```tsx
{/* Logo Container - Fade In */}
<div className="logo-fade-in" style={{
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
```

**استبدل CSS بهذا:**

```css
.logo-fade-in {
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
```

---

### 4️⃣ تأثير التكبير (Zoom-in)

**استبدل الكود من السطر 30-62 بهذا:**

```tsx
{/* Logo Container - Zoom In */}
<div className="logo-zoom-in" style={{
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
```

**استبدل CSS بهذا:**

```css
.logo-zoom-in {
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
```

---

### 5️⃣ تأثير الانزلاق للأعلى (Slide-up)

**استبدل الكود من السطر 30-62 بهذا:**

```tsx
{/* Logo Container - Slide Up */}
<div className="logo-slide-up" style={{
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
```

**استبدل CSS بهذا:**

```css
.logo-slide-up {
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
```

---

### 6️⃣ تأثير الدوران (Rotate)

**استبدل الكود من السطر 30-62 بهذا:**

```tsx
{/* Logo Container - Rotate */}
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
```

**استبدل CSS بهذا:**

```css
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
```

---

### 7️⃣ تأثير البكسل (Pixelate)

**استبدل الكود من السطر 30-62 بهذا:**

```tsx
{/* Logo Container - Pixelate */}
<div className="logo-pixelate" style={{
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
```

**استبدل CSS بهذا:**

```css
.logo-pixelate {
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
```

---

### 8️⃣ تأثير الموجة (Wave)

**استبدل الكود من السطر 30-62 بهذا:**

```tsx
{/* Logo Container - Wave */}
<div className="logo-wave" style={{
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
```

**استبدل CSS بهذا:**

```css
.logo-wave {
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
```

---

## 📝 خطوات التطبيق:

1. **افتح ملف** `app/page.tsx`
2. **ابحث عن القسم** الذي يحتوي على `{/* Logo Container */}` (حوالي السطر 30)
3. **استبدل الكود** بالكود المطلوب للتأثير الذي تريده
4. **ابحث عن القسم** `<style jsx global>` (حوالي السطر 65)
5. **استبدل CSS** بالـ CSS المطلوب للتأثير
6. **احفظ الملف** وسترى التأثير مباشرة

---

## 💡 نصائح:

- يمكنك تغيير **مدة التأثير** بتعديل القيمة في `animation` (مثلاً: `2s` → `3s`)
- يمكنك تغيير **سرعة التأثير** بتعديل `ease-out` (مثلاً: `ease-in`, `ease-in-out`, `linear`)
- يمكنك **دمج تأثيرات** مختلفة بإنشاء تأثير جديد

---

## 🎯 للتجربة السريعة:

افتح: `http://localhost:3001/effects-demo` لرؤية جميع التأثيرات وتجربتها قبل التطبيق!
