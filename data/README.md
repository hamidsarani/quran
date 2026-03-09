# دیتای قرآن کریم

این پوشه برای ذخیره‌سازی محلی صفحات قرآن استفاده می‌شود.

## چرا نیاز به دانلود محلی داریم؟

API قرآن گاهی اوقات در دسترس نیست یا کند است. با دانلود و ذخیره محلی صفحات:
- ✅ سرعت بارگذاری بسیار بالاتر است
- ✅ وابستگی به API خارجی نداریم
- ✅ ربات حتی بدون اینترنت هم کار می‌کند (برای قسمت قرآن)
- ✅ هزینه bandwidth کمتر می‌شود

## دانلود صفحات

### روش 1: استفاده از اسکریپت Bash (ساده‌ترین)

```bash
chmod +x scripts/download-quran-simple.sh
./scripts/download-quran-simple.sh
```

### روش 2: اجرای مستقیم با Node.js

```bash
npm install
node scripts/download-quran.js
```

### روش 3: استفاده از npm script

```bash
npm run download-quran
```

## ساختار فایل‌ها

بعد از دانلود، ساختار به این شکل خواهد بود:

```
data/
└── quran-pages/
    ├── index.json          # فهرست تمام صفحات
    ├── page-1.json         # صفحه 1
    ├── page-2.json         # صفحه 2
    ├── ...
    └── page-604.json       # صفحه 604
```

## فرمت فایل‌ها

هر فایل JSON شامل اطلاعات کامل یک صفحه از قرآن است:

```json
{
  "number": 1,
  "ayahs": [
    {
      "number": 1,
      "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "numberInSurah": 1,
      "juz": 1,
      "manzil": 1,
      "page": 1,
      "ruku": 1,
      "hizbQuarter": 1,
      "sajda": false,
      "surah": {
        "number": 1,
        "name": "سُورَةُ ٱلْفَاتِحَةِ",
        "englishName": "Al-Faatiha",
        "englishNameTranslation": "The Opening",
        "revelationType": "Meccan",
        "numberOfAyahs": 7
      }
    }
  ]
}
```

## نحوه استفاده در ربات

ربات به صورت خودکار:
1. ابتدا سعی می‌کند صفحه را از فایل محلی بخواند
2. اگر فایل وجود نداشت، از API دانلود می‌کند
3. صفحه دانلود شده را برای دفعات بعد ذخیره می‌کند

کد مربوطه در `src/services/quranApi.js` قرار دارد.

## آپدیت کردن صفحات

اگر می‌خواهید صفحات را دوباره دانلود کنید:

```bash
# حذف فایل‌های قدیمی
rm -rf data/quran-pages/*

# دانلود مجدد
node scripts/download-quran.js
```

## حجم فایل‌ها

- هر فایل: حدود 5-15 کیلوبایت
- مجموع 604 فایل: حدود 5-8 مگابایت
- فشرده شده (zip): حدود 1-2 مگابایت

## نکات مهم

1. ⚠️ فایل‌های این پوشه را در `.gitignore` قرار دهید (حجم زیاد)
2. ✅ برای استقرار روی سرور، یک بار دانلود کنید
3. ✅ می‌توانید فایل‌ها را فشرده کنید و به سرور منتقل کنید
4. ✅ اسکریپت دانلود از صفحات موجود رد می‌شود (idempotent)

## انتقال به سرور

### روش 1: دانلود روی سرور

```bash
# روی سرور
cd /path/to/app
npm install
node scripts/download-quran.js
```

### روش 2: انتقال فایل‌های دانلود شده

```bash
# روی کامپیوتر محلی
cd data
tar -czf quran-pages.tar.gz quran-pages/
scp quran-pages.tar.gz user@server:/path/to/app/data/

# روی سرور
cd /path/to/app/data
tar -xzf quran-pages.tar.gz
rm quran-pages.tar.gz
```

## عیب‌یابی

### خطا: Cannot find module 'axios'

```bash
npm install
```

### خطا: ENOENT: no such file or directory

پوشه `data/quran-pages` به صورت خودکار ایجاد می‌شود. اگر خطا دیدید:

```bash
mkdir -p data/quran-pages
```

### برخی صفحات دانلود نشدند

اسکریپت را دوباره اجرا کنید. فقط صفحات ناموفق دانلود می‌شوند:

```bash
node scripts/download-quran.js
```

## منبع داده

صفحات قرآن از API زیر دریافت می‌شوند:
- API: https://api.alquran.cloud
- نسخه: quran-uthmani (خط عثمانی)
- مجوز: رایگان برای استفاده غیرتجاری

## پشتیبانی

برای مشکلات و سوالات:
- GitHub Issues: https://github.com/hamidsarani/quran/issues
- مستندات API: https://alquran.cloud/api
