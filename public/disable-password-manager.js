// إزالة رسائل مدير كلمات المرور
(function() {
  // إزالة رسائل Google Password Manager
  const removePasswordManagerDialogs = () => {
    // البحث عن عناصر مدير كلمات المرور وإزالتها
    const passwordManagerElements = document.querySelectorAll(
      '[data-google-password-manager], ' +
      '[data-password-manager], ' +
      '.password-manager-dialog, ' +
      '[role="dialog"][aria-label*="password"], ' +
      '[role="dialog"][aria-label*="Password"]'
    );
    
    passwordManagerElements.forEach(element => {
      element.style.display = 'none';
      element.remove();
    });
  };

  // تشغيل فوري
  removePasswordManagerDialogs();

  // مراقبة التغييرات في DOM
  const observer = new MutationObserver(() => {
    removePasswordManagerDialogs();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // إزالة رسائل المتصفح الأخرى
  const removeBrowserDialogs = () => {
    // إزالة رسائل Chrome/Edge
    const browserDialogs = document.querySelectorAll(
      '[data-testid*="password"], ' +
      '[aria-label*="password"], ' +
      '[aria-label*="Password"], ' +
      '.browser-password-dialog'
    );
    
    browserDialogs.forEach(dialog => {
      if (dialog.textContent.includes('Check your saved passwords') ||
          dialog.textContent.includes('password') ||
          dialog.textContent.includes('Password')) {
        dialog.style.display = 'none';
        dialog.remove();
      }
    });
  };

  // تشغيل دوري
  setInterval(removeBrowserDialogs, 1000);
})();
