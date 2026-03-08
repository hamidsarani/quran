# ربات ختم قرآن دسته‌جمعی

ربات تلگرام برای مدیریت ختم قرآن دسته‌جمعی با قابلیت‌های پیشرفته

## ویژگی‌ها

- 📖 مدیریت کمپین‌های ختم قرآن
- 👥 سیستم کاربران و ادمین‌ها
- 📊 گزارش‌گیری پیشرفته
- 🔄 انتخاب و لغو صفحات
- 📱 رابط کاربری ساده و کاربردی
- 🗄️ پایگاه داده PostgreSQL
- 🐳 پشتیبانی از Docker

## نصب و راه‌اندازی

### روش 1: استفاده از Docker (توصیه شده)

```bash
# کلون کردن پروژه
git clone https://github.com/hamidsarani/quran.git
cd quran

# کپی کردن فایل محیط
cp .env.example .env

# ویرایش تنظیمات
nano .env

# اجرای با Docker Compose
docker-compose up -d
```

### روش 2: نصب دستی

```bash
# کلون کردن پروژه
git clone https://github.com/hamidsarani/quran.git
cd quran

# نصب dependencies
npm install

# نصب PostgreSQL
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# ایجاد دیتابیس
createdb quran_khatm_bot

# تنظیم متغیرهای محیط
cp .env.example .env
nano .env

# اجرای برنامه
npm start
```

## تنظیمات

فایل `.env` را ایجاد کنید:

```env
# Bot Configuration
BOT_TOKEN=your_bot_token_here
ADMIN_USER_IDS=123456789,987654321

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quran_khatm_bot
DB_USER=postgres
DB_PASSWORD=your_password
DB_DIALECT=postgres
```

## ساختار پروژه

```
├── src/
│   ├── bot.js              # کلاس اصلی ربات
│   ├── config/             # تنظیمات
│   ├── database/           # Repository pattern
│   ├── handlers/           # مدیریت callback ها
│   ├── models/             # مدل‌های Sequelize
│   ├── services/           # سرویس‌های خارجی
│   └── utils/              # توابع کمکی
├── docker-compose.yml      # Docker Compose
├── Dockerfile             # Docker image
└── package.json           # Dependencies
```

## استفاده

### برای کاربران:
- `/start` - شروع کار با ربات
- `/help` - راهنمای استفاده
- دکمه "شرکت در ختم قرآن" - انتخاب کمپین و صفحه
- دکمه "وضعیت من" - مشاهده پیشرفت

### برای ادمین‌ها:
- پنل ادمین برای مدیریت کمپین‌ها
- گزارش‌گیری از پیشرفت
- مدیریت کاربران
- مشاهده صفحات در حال خواندن

## API خارجی

ربات از API زیر برای دریافت متن قرآن استفاده می‌کند:
- https://api.alquran.cloud/v1/page/{pageNumber}/quran-uthmani

## مشارکت

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

## مجوز

این پروژه تحت مجوز MIT منتشر شده است.

## پشتیبانی

برای گزارش باگ یا درخواست ویژگی جدید، از GitHub Issues استفاده کنید.

---

**توسعه داده شده با ❤️ برای جامعه مسلمانان**