const { getPagePair } = require('../utils/helpers');

class PageRepository {
  constructor(db) {
    this.db = db;
  }

  // دریافت صفحات خالی یک کمپین
  getAvailablePages(campaignId, callback) {
    this.db.all(
      `SELECT * FROM quran_pages 
       WHERE campaign_id = ? AND reader_id IS NULL 
       ORDER BY page_start LIMIT 30`,
      [campaignId],
      callback
    );
  }

  // انتساب صفحه به کاربر
  assignPage(pageId, userId, userName, callback) {
    this.db.run(
      `UPDATE quran_pages 
       SET reader_id = ?, reader_name = ?, assigned_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND reader_id IS NULL`,
      [userId, userName, pageId],
      function(err) {
        callback(err, this);
      }
    );
  }

  // تکمیل خواندن صفحه
  completePage(pageId, userId, callback) {
    this.db.run(
      `UPDATE quran_pages 
       SET is_completed = 1, completed_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND reader_id = ?`,
      [pageId, userId],
      function(err) {
        callback(err, this);
      }
    );
  }

  // لغو انتخاب صفحه
  cancelPage(pageId, userId, callback) {
    this.db.run(
      `UPDATE quran_pages 
       SET reader_id = NULL, reader_name = NULL, assigned_at = NULL 
       WHERE id = ? AND reader_id = ? AND is_completed = 0`,
      [pageId, userId],
      function(err) {
        callback(err, this);
      }
    );
  }

  // دریافت صفحات تکمیل شده یک کمپین
  getCompletedPages(campaignId, callback) {
    this.db.all(
      `SELECT * FROM quran_pages 
       WHERE campaign_id = ? AND is_completed = 1 
       ORDER BY completed_at DESC`,
      [campaignId],
      callback
    );
  }

  // دریافت صفحه انتساب یافته به کاربر
  getUserAssignedPage(userId, campaignId, callback) {
    this.db.get(
      `SELECT * FROM quran_pages 
       WHERE reader_id = ? AND campaign_id = ? AND is_completed = 0`,
      [userId, campaignId],
      callback
    );
  }

  // دریافت صفحه بر اساس شماره
  getPageByNumber(campaignId, pageNumber, callback) {
    const { pageStart, pageEnd } = getPagePair(pageNumber);

    this.db.get(
      `SELECT * FROM quran_pages 
       WHERE campaign_id = ? AND page_start = ? AND page_end = ? AND reader_id IS NULL`,
      [campaignId, pageStart, pageEnd],
      callback
    );
  }

  // دریافت صفحه بر اساس ID
  getPageById(pageId, callback) {
    this.db.get(
      'SELECT * FROM quran_pages WHERE id = ?',
      [pageId],
      callback
    );
  }

  // دریافت آمار کاربر
  getUserStats(userId, callback) {
    const stats = {};
    
    // تعداد صفحات خوانده شده
    this.db.get(
      'SELECT COUNT(*) as completed FROM quran_pages WHERE reader_id = ? AND is_completed = 1',
      [userId],
      (err, result) => {
        if (err) return callback(err);
        stats.completedPages = result.completed;
        
        // تعداد صفحات در حال خواندن
        this.db.get(
          'SELECT COUNT(*) as reading FROM quran_pages WHERE reader_id = ? AND is_completed = 0',
          [userId],
          (err, result) => {
            if (err) return callback(err);
            stats.readingPages = result.reading;
            
            // لیست صفحات خوانده شده
            this.db.all(
              `SELECT qp.*, c.name as campaign_name 
               FROM quran_pages qp 
               JOIN campaigns c ON qp.campaign_id = c.id 
               WHERE qp.reader_id = ? AND qp.is_completed = 1 
               ORDER BY qp.completed_at DESC LIMIT 10`,
              [userId],
              (err, pages) => {
                if (err) return callback(err);
                stats.recentPages = pages;
                callback(null, stats);
              }
            );
          }
        );
      }
    );
  }

  // دریافت صفحات در حال خواندن (assigned ولی complete نشده)
  getInProgressPages(campaignId, callback) {
    this.db.all(
      `SELECT * FROM quran_pages 
       WHERE campaign_id = ? AND reader_id IS NOT NULL AND is_completed = 0 
       ORDER BY assigned_at DESC`,
      [campaignId],
      callback
    );
  }
}

module.exports = PageRepository;
