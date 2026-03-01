# كيفية نشر قواعد Firestore

## المشكلة الحالية
خطأ: `Missing or insufficient permissions` عند حفظ عروض المنتجات

## الحل المطلوب

### 1. نشر قواعد Firestore
```bash
# الطريقة الأولى
firebase deploy --only firestore:rules

# الطريقة الثانية
npx firebase deploy --only firestore:rules

# الطريقة الثالثة (إذا لم تعمل الطرق السابقة)
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 2. التحقق من القواعد في Firebase Console
1. اذهب إلى https://console.firebase.google.com
2. اختر مشروعك
3. اذهب إلى Firestore Database > Rules
4. تأكد من وجود القواعد التالية:

```javascript
// تعريفات العروض بالمنتجات
match /Def_OffersByProducts/{document} {
  allow read: if true;
  allow write: if true;
  
  // تفاصيل العروض بالمنتجات
  match /Def_OffersByProductsDetails/{detailDocument} {
    allow read: if true;
    allow write: if true;
  }
}
```

### 3. إذا لم تعمل الأوامر
يمكنك نسخ القواعد من ملف `firestore.rules` ولصقها يدوياً في Firebase Console

## القواعد المطلوبة
تم إضافة القواعد التالية في ملف `firestore.rules`:

```javascript
// تعريفات العروض بالمنتجات
match /Def_OffersByProducts/{document} {
  allow read: if true;
  allow write: if true;
  
  // تفاصيل العروض بالمنتجات
  match /Def_OffersByProductsDetails/{detailDocument} {
    allow read: if true;
    allow write: if true;
  }
}
```

## التحقق من النجاح
بعد نشر القواعد، جرب حفظ عرض منتجات جديد. يجب أن يعمل بدون أخطاء.
