# 📱 راهنمای Build اپلیکیشن Mora

این راهنما شامل دستورالعمل‌های کامل برای ساخت نسخه‌های **Mobile (iOS/Android)** و **Desktop (Windows)** اپلیکیشن Mora است.

---

## 🚀 پیش‌نیازها

### برای همه پلتفرم‌ها:
- Node.js 18 یا بالاتر
- Git
- حساب کاربری GitHub

### برای iOS:
- macOS با macOS 12 یا بالاتر
- Xcode 14 یا بالاتر
- Apple Developer Account (برای deploy روی دستگاه واقعی و App Store)

### برای Android:
- Android Studio (آخرین نسخه)
- Java Development Kit (JDK) 17
- Android SDK

### برای Windows:
- هر سیستم عاملی (Windows/Mac/Linux)
- دسترسی به Electron

---

## 📥 مرحله اول: آماده‌سازی پروژه

### 1. انتقال به GitHub و Clone کردن

```bash
# در Lovable روی دکمه "Export to GitHub" کلیک کنید
# سپس پروژه را clone کنید:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. نصب Dependencies

```bash
npm install
```

### 3. Build پروژه

```bash
npm run build
```

---

## 📱 بخش اول: Mobile Apps با Capacitor

### مرحله 1: اضافه کردن پلتفرم‌ها

#### برای iOS:
```bash
npx cap add ios
```

#### برای Android:
```bash
npx cap add android
```

### مرحله 2: Sync کردن

```bash
# برای iOS
npx cap sync ios

# برای Android
npx cap sync android
```

---

### 🍎 Build iOS App

#### روش 1: اجرا در شبیه‌ساز (Simulator)

```bash
npx cap open ios
```

در Xcode:
1. Product → Destination → انتخاب شبیه‌ساز (مثلاً iPhone 15 Pro)
2. Product → Run (یا Cmd+R)

#### روش 2: Build برای دستگاه واقعی

در Xcode:
1. Signing & Capabilities → انتخاب Team و Certificate
2. Product → Destination → انتخاب دستگاه متصل
3. Product → Run

#### روش 3: آماده‌سازی برای App Store

1. در Xcode: Product → Archive
2. پس از اتمام Archive: Window → Organizer
3. انتخاب Archive → Distribute App
4. انتخاب "App Store Connect"
5. تکمیل مراحل و آپلود

**فایل خروجی:** `.ipa`  
**محل:** `ios/App/build/`

---

### 🤖 Build Android App

#### روش 1: اجرا در Emulator

```bash
npx cap open android
```

در Android Studio:
1. Tools → Device Manager → ایجاد/اجرای Emulator
2. Run → Run 'app' (یا Shift+F10)

#### روش 2: Build برای دستگاه واقعی

1. فعال کردن Developer Options در گوشی:
   - Settings → About Phone → 7 بار روی Build Number ضربه بزنید
2. فعال کردن USB Debugging
3. اتصال گوشی به کامپیوتر
4. در Android Studio: Run → Run 'app'

#### روش 3: ساخت APK برای توزیع

```bash
# در پوشه android/
cd android
./gradlew assembleRelease
```

**فایل خروجی:** `android/app/build/outputs/apk/release/app-release.apk`

#### روش 4: ساخت AAB برای Google Play

```bash
cd android
./gradlew bundleRelease
```

**فایل خروجی:** `android/app/build/outputs/bundle/release/app-release.aab`

---

### 🔑 Sign کردن Android App

برای توزیع باید APK/AAB را sign کنید:

```bash
# ایجاد keystore (فقط یک بار)
keytool -genkey -v -keystore mora-release-key.keystore \
  -alias mora -keyalg RSA -keysize 2048 -validity 10000

# Sign کردن APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore mora-release-key.keystore \
  app-release-unsigned.apk mora

# Align کردن
zipalign -v 4 app-release-unsigned.apk mora-release.apk
```

---

## 🖥️ بخش دوم: Windows Desktop App با Electron

### مرحله 1: اضافه کردن Scripts به package.json

فایل `package.json` را باز کرده و بخش `scripts` را به این شکل ویرایش کنید:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "electron": "electron .",
  "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
  "electron:build": "npm run build && electron-builder",
  "electron:build:win": "ELECTRON=true npm run build && electron-builder --win"
}
```

### مرحله 2: نصب Dependencies اضافی (در صورت نیاز)

```bash
npm install --save-dev concurrently wait-on
```

### مرحله 3: تست محلی Electron

```bash
# روش 1: اجرای مستقیم (بعد از build)
npm run build
npm run electron

# روش 2: Development mode با hot reload
npm run electron:dev
```

### مرحله 4: Build نهایی برای Windows

```bash
npm run electron:build:win
```

این دستور:
- پروژه React را Build می‌کند
- فایل‌های Electron را آماده می‌کند
- Installer Windows (.exe) ایجاد می‌کند

**فایل‌های خروجی:**
- `release/Mora-{version}-x64.exe` (NSIS Installer - 64-bit)
- `release/Mora-{version}-ia32.exe` (NSIS Installer - 32-bit)
- `release/Mora-{version}-portable.exe` (Portable Version)

---

## 📦 توزیع و انتشار

### iOS App Store:
1. ایجاد App در [App Store Connect](https://appstoreconnect.apple.com)
2. آپلود .ipa از طریق Xcode Organizer
3. تکمیل اطلاعات App (توضیحات، اسکرین‌شات‌ها، قیمت)
4. Submit برای Review

### Google Play Store:
1. ایجاد App در [Google Play Console](https://play.google.com/console)
2. آپلود .aab در بخش Production
3. تکمیل Store Listing (توضیحات، تصاویر، قیمت)
4. Submit برای Review

### Windows Desktop:
- توزیع مستقیم فایل .exe از طریق وب‌سایت
- آپلود در Microsoft Store (نیاز به حساب Developer)
- استفاده از سرویس‌هایی مثل GitHub Releases

---

## 🔧 مشکلات رایج و راه‌حل‌ها

### مشکل: Capacitor sync خطا می‌دهد
**راه‌حل:**
```bash
npm run build
npx cap sync
```

### مشکل: Xcode نمی‌تواند Certificate پیدا کند
**راه‌حل:**
- Xcode → Preferences → Accounts → دانلود Manual Profiles
- یا استفاده از Automatic Signing

### مشکل: Android build خطای Gradle
**راه‌حل:**
```bash
cd android
./gradlew clean
./gradlew build
```

### مشکل: Electron سفید/خالی است
**راه‌حل:**
- چک کنید که `npm run build` اجرا شده باشد
- در `electron/main.js` مسیر `loadFile` را بررسی کنید
- DevTools را باز کنید: `mainWindow.webContents.openDevTools()`

---

## 📱 آیکون‌ها و Assets

### نیازهای آیکون:

**iOS:**
- App Icon: 1024x1024 PNG (بدون شفافیت)
- محل: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Android:**
- Adaptive Icons: 432x432 PNG (foreground + background)
- محل: `android/app/src/main/res/mipmap-*/`

**Windows:**
- App Icon: 256x256 .ico
- محل: `public/favicon.ico`

### ابزارهای تولید آیکون:
- [Icon Kitchen](https://icon.kitchen/) - تولید خودکار برای Android
- [App Icon Generator](https://www.appicon.co/) - تولید برای iOS
- [ICO Convert](https://icoconvert.com/) - تبدیل به .ico

---

## 🎯 Checklist قبل از انتشار

- [ ] تست کامل روی دستگاه‌های واقعی
- [ ] بررسی عملکرد offline
- [ ] تست Authentication و Database
- [ ] آماده‌سازی Privacy Policy
- [ ] آماده‌سازی Terms of Service
- [ ] تهیه اسکرین‌شات‌های مناسب
- [ ] نوشتن توضیحات App
- [ ] تعیین قیمت (رایگان/پولی)
- [ ] بررسی نیازهای سنی و محتوایی

---

## 🔗 منابع مفید

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)
- [Lovable Capacitor Blog Post](https://docs.lovable.dev)

---

## 💡 نکات مهم

1. **همیشه قبل از build، `npm run build` را اجرا کنید**
2. **برای iOS حتماً macOS و Xcode لازم است**
3. **کلیدهای Keystore Android را در جای امن نگه دارید (backup)**
4. **برای تست، ابتدا در Emulator/Simulator تست کنید**
5. **قبل از submit، Guidelines پلتفرم مربوطه را مطالعه کنید**

---

## 📞 پشتیبانی

در صورت بروز مشکل:
- مستندات Lovable: https://docs.lovable.dev
- کامیونیتی Capacitor: https://forum.ionicframework.com
- GitHub Issues: https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/issues

---

**موفق باشید! 🚀**
