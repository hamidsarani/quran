const config = require('../config/config');

class CampaignRepository {
  constructor(db) {
    this.db = db;
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
        
        for (let i = 1; i <= config.quran.totalPages; i += config.quran.pagesPerPair) {
          const pageEnd = Math.min(i + 1, config.quran.totalPages);
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

  // دریافت تمام کمپین‌ها
  getAllCampaigns(callback) {
    this.db.all(
      'SELECT * FROM campaigns ORDER BY created_at DESC',
      callback
    );
  }

  // دریافت یک کمپین
  getCampaignById(campaignId, callback) {
    this.db.get(
      'SELECT * FROM campaigns WHERE id = ?',
      [campaignId],
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

  // دریافت آمار کمپین
  getCampaignStats(campaignId, callback) {
    const stats = {};
    
    this.db.get(
      'SELECT COUNT(*) as total FROM quran_pages WHERE campaign_id = ?',
      [campaignId],
      (err, result) => {
        if (err) return callback(err);
        stats.totalPages = result.total;
        
        this.db.get(
          'SELECT COUNT(*) as completed FROM quran_pages WHERE campaign_id = ? AND is_completed = 1',
          [campaignId],
          (err, result) => {
            if (err) return callback(err);
            stats.completedPages = result.completed;
            stats.remainingPages = stats.totalPages - stats.completedPages;
            
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
}

module.exports = CampaignRepository;
