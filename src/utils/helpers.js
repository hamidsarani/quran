const config = require('../config/config');

/**
 * بررسی اینکه آیا کاربر ادمین است
 */
function isAdmin(userId) {
  return config.adminUserIds.includes(userId);
}

/**
 * تبدیل شماره صفحه به جفت صفحه
 */
function getPagePair(pageNumber) {
  let pageStart, pageEnd;
  
  if (pageNumber % 2 === 1) {
    // فرد
    pageStart = pageNumber;
    pageEnd = Math.min(pageNumber + 1, config.quran.totalPages);
  } else {
    // زوج
    pageStart = pageNumber - 1;
    pageEnd = pageNumber;
  }
  
  return { pageStart, pageEnd };
}

/**
 * ساخت لینک منشن کاربر برای Bale
 */
function createUserMention(userId, userName) {
  return `<a href="mention://${userId}">${userName}</a>`;
}

/**
 * محاسبه درصد پیشرفت
 */
function calculateProgress(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

module.exports = {
  isAdmin,
  getPagePair,
  createUserMention,
  calculateProgress
};
