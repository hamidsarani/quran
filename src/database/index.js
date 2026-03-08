const { sequelize, testConnection, syncModels } = require('../models');
const UserRepository = require('./users');
const CampaignRepository = require('./campaigns');
const PageRepository = require('./pages');

class DatabaseManager {
  constructor() {
    this.users = new UserRepository();
    this.campaigns = new CampaignRepository();
    this.pages = new PageRepository();
    
    this.init();
  }

  async init() {
    try {
      await testConnection();
      await syncModels();
      console.log('✓ دیتابیس آماده است');
    } catch (error) {
      console.error('✗ خطا در راه‌اندازی دیتابیس:', error.message);
    }
  }

  async close() {
    try {
      await sequelize.close();
      console.log('✓ اتصال دیتابیس بسته شد');
    } catch (error) {
      console.error('✗ خطا در بستن اتصال دیتابیس:', error.message);
    }
  }
}

module.exports = DatabaseManager;
