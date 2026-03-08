const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'quran_khatm.db'));
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // جدول کمپین‌ها
      this.db.run(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1,
          is_completed BOOLEAN DEFAULT 0
        )
      `);

      // جدول صفحات قرآن
      this.db.run(`
        CREATE TABLE IF NOT EXISTS quran_pages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          campaign_id INTEGER,
          page_start INTEGER NOT NULL,
          page_end INTEGER NOT NULL,
          reader_id INTEGER,
          reader_name TEXT,
          assigned_at DATETIME,
          completed_at DATETIME,
          is_completed BOOLEAN DEFAULT 0,
          FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
        )
      `);

      // جدول کاربران
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          username TEXT,
          first_name TEXT,
          last_name TEXT,
          selected_campaign_id INTEGER,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (selected_campaign_id) REFERENCES campaigns (id)
        )
      `);

      // اضافه کردن ستون selected_campaign_id اگر وجود ندارد
      this.db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          console.error('Error checking table:', err);
          return;
        }
        
        const hasColumn = columns.some(col => col.name === 'selected_campaign_id');
        if (!hasColumn) {
          this.db.run('ALTER TABLE users ADD COLUMN selected_campaign_id INTEGER', (err) => {
            if (err) console.error('Error adding column:', err);
            else console.log('Added selected_campaign_id column to users table');
          });
        }
      });

      // اضافه کردن ستون is_completed به campaigns اگر وجود ندارد
      this.db.all("PRAGMA table_info(campaigns)", (err, columns) => {
        if (err) {
          console.error('Error checking campaigns table:', err);
          return;
        }
        
        const hasColumn = columns.some(col => col.name === 'is_completed');
        if (!hasColumn) {
          this.db.run('ALTER TABLE campaigns ADD COLUMN is_completed BOOLEAN DEFAULT 0', (err) => {
            if (err) console.error('Error adding is_completed column:', err);
            else console.log('Added is_completed column to campaigns table');
          });
        }
      });
    });
  }

  // ایجاد کمپین جدید
  createCampaign(name, callback) {
    const self = this;
    this.db.run(
      'INSERT INTO campaigns (name) VALUES (?)',
      [name],
      function(err) {
        if (err) return callback(err);
        
        const campaignId = this.lastID;
        
        // ایجاد 302 جفت صفحه (604 صفحه به صورت 2 تایی)
        const stmt = self.db.prepare(`
          INSERT INTO quran_pages (campaign_id, page_start, page_end) 
          VALUES (?, ?, ?)
        `);
        
        for (let i = 1; i <= 604; i += 2) {
          const pageEnd = Math.min(i + 1, 604);
          stmt.run(campaignId, i, pageEnd);
        }
        
        stmt.finalize();
        callback(null, campaignId);
      }
    );
  }

  // دریافت کمپین‌های فعال
  getActiveCampaigns(callback) {
    this.db.all(
      'SELECT * FROM campaigns WHERE is_active = 1 ORDER BY created_at DESC',
      callback
    );
  }

  // دریافت تمام کمپین‌ها (برای مدیریت)
  getAllCampaigns(callback) {
    this.db.all(
      'SELECT * FROM campaigns ORDER BY created_at DESC',
      callback
    );
  }

  // تغییر وضعیت نمایش کمپین
  toggleCampaignActive(campaignId, callback) {
    this.db.run(
      'UPDATE campaigns SET is_active = NOT is_active WHERE id = ?',
      [campaignId],
      callback
    );
  }

  // تنظیم کمپین به عنوان پایان یافته
  setCampaignCompleted(campaignId, isCompleted, callback) {
    this.db.run(
      'UPDATE campaigns SET is_completed = ? WHERE id = ?',
      [isCompleted ? 1 : 0, campaignId],
      callback
    );
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
      callback
    );
  }

  // تکمیل خواندن صفحه
  completePage(pageId, userId, callback) {
    this.db.run(
      `UPDATE quran_pages 
       SET is_completed = 1, completed_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND reader_id = ?`,
      [pageId, userId],
      callback
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

  // دریافت صفحه انتساب یافته به کاربر که هنوز تکمیل نشده
  getUserAssignedPage(userId, campaignId, callback) {
    this.db.get(
      `SELECT * FROM quran_pages 
       WHERE reader_id = ? AND campaign_id = ? AND is_completed = 0`,
      [userId, campaignId],
      callback
    );
  }

  // دریافت صفحه بر اساس شماره صفحه
  getPageByNumber(campaignId, pageNumber, callback) {
    // تبدیل به جفت صفحه (فرد با بعدی، زوج با قبلی)
    let pageStart, pageEnd;
    if (pageNumber % 2 === 1) {
      // فرد
      pageStart = pageNumber;
      pageEnd = Math.min(pageNumber + 1, 604);
    } else {
      // زوج
      pageStart = pageNumber - 1;
      pageEnd = pageNumber;
    }

    this.db.get(
      `SELECT * FROM quran_pages 
       WHERE campaign_id = ? AND page_start = ? AND page_end = ? AND reader_id IS NULL`,
      [campaignId, pageStart, pageEnd],
      callback
    );
  }

  // ثبت کاربر
  registerUser(userId, username, firstName, lastName, callback) {
    this.db.run(
      `INSERT OR REPLACE INTO users (id, username, first_name, last_name) 
       VALUES (?, ?, ?, ?)`,
      [userId, username, firstName, lastName],
      callback
    );
  }

  // تنظیم کمپین انتخابی کاربر
  setUserCampaign(userId, campaignId, callback) {
    this.db.run(
      `UPDATE users SET selected_campaign_id = ? WHERE id = ?`,
      [campaignId, userId],
      callback
    );
  }

  // دریافت کمپین انتخابی کاربر
  getUserCampaign(userId, callback) {
    this.db.get(
      `SELECT selected_campaign_id FROM users WHERE id = ?`,
      [userId],
      callback
    );
  }

  // دریافت آمار کمپین
  getCampaignStats(campaignId, callback) {
    const stats = {};
    
    // تعداد کل صفحات
    this.db.get(
      'SELECT COUNT(*) as total FROM quran_pages WHERE campaign_id = ?',
      [campaignId],
      (err, result) => {
        if (err) return callback(err);
        stats.totalPages = result.total;
        
        // تعداد صفحات خوانده شده
        this.db.get(
          'SELECT COUNT(*) as completed FROM quran_pages WHERE campaign_id = ? AND is_completed = 1',
          [campaignId],
          (err, result) => {
            if (err) return callback(err);
            stats.completedPages = result.completed;
            stats.remainingPages = stats.totalPages - stats.completedPages;
            
            // تعداد کاربران فعال (کسانی که حداقل یک صفحه خوانده‌اند)
            this.db.get(
              'SELECT COUNT(DISTINCT reader_id) as activeUsers FROM quran_pages WHERE campaign_id = ? AND reader_id IS NOT NULL',
              [campaignId],
              (err, result) => {
                if (err) return callback(err);
                stats.activeUsers = result.activeUsers;
                
                callback(null, stats);
              }
            );
          }
        );
      }
    );
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;