# استفاده از Node.js 18 LTS
FROM node:18-alpine

# تنظیم working directory
WORKDIR /app

# کپی کردن package files
COPY package.json yarn.lock ./

# نصب dependencies با yarn
RUN yarn install --frozen-lockfile --production

# کپی کردن کد اپلیکیشن
COPY . .

# ایجاد کاربر غیر root برای امنیت
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# تغییر مالکیت فایل‌ها
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["yarn", "start"]
