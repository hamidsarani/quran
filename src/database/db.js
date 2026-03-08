const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/config');

class Database {
  constructor() {
    this.db = new sqlite3.Database(config.database.path);
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

      // Migration: اضافه کردن ستون‌های جدید
      this._runMigrations();
    });
  }

  _runMigrations() {
    // اضافه کردن selected_campaign_id به users
    this.db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        console.error('Error checking users table:', err);
        return;
      }
      
      const hasColumn = columns.some(col => col.name === 'selected_campaign_id');
      if (!hasColumn) {
        this.db.run('ALTER TABLE users ADD COLUMN selected_campaign_id INTEGER', (err) => {
          if (err) console.error('Error adding selected_campaign_id:', err);
          else console.log('✓ Added selected_campaign_id column');
        });
      }
    });

    // اضافه کردن is_completed به campaigns
    this.db.all("PRAGMA table_info(campaigns)", (err, columns) => {
      if (err) {
        console.error('Error checking campaigns table:', err);
        return;
      }
      
      const hasColumn = columns.some(col => col.name === 'is_completed');
      if (!hasColumn) {
        this.db.run('ALTER TABLE campaigns ADD COLUMN is_completed BOOLEAN DEFAULT 0', (err) => {
          if (err) console.error('Error adding is_completed:', err);
          else console.log('✓ Added is_completed column');
        });
      }
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
