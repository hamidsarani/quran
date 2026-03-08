const { Sequelize } = require('sequelize');
const config = require('../config/config');

// ایجاد اتصال به دیتابیس
const sequelize = new Sequelize(config.database);

// Import models
const User = require('./User')(sequelize);
const Campaign = require('./Campaign')(sequelize);
const QuranPage = require('./QuranPage')(sequelize);

// تعریف روابط
User.belongsTo(Campaign, { 
  foreignKey: 'selectedCampaignId', 
  as: 'selectedCampaign',
  allowNull: true 
});

Campaign.hasMany(User, { 
  foreignKey: 'selectedCampaignId', 
  as: 'users' 
});

Campaign.hasMany(QuranPage, { 
  foreignKey: 'campaignId', 
  as: 'pages' 
});

QuranPage.belongsTo(Campaign, { 
  foreignKey: 'campaignId', 
  as: 'campaign' 
});

QuranPage.belongsTo(User, { 
  foreignKey: 'readerId', 
  as: 'reader',
  allowNull: true 
});

User.hasMany(QuranPage, { 
  foreignKey: 'readerId', 
  as: 'assignedPages' 
});

// تست اتصال
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✓ اتصال به PostgreSQL برقرار شد');
  } catch (error) {
    console.error('✗ خطا در اتصال به دیتابیس:', error.message);
  }
}

// همگام‌سازی مدل‌ها
async function syncModels() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✓ مدل‌های دیتابیس همگام‌سازی شدند');
  } catch (error) {
    console.error('✗ خطا در همگام‌سازی مدل‌ها:', error.message);
  }
}

module.exports = {
  sequelize,
  User,
  Campaign,
  QuranPage,
  testConnection,
  syncModels
};