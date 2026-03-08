require('dotenv').config();

module.exports = {
  botToken: process.env.BOT_TOKEN,
  adminUserIds: process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(',').map(id => parseInt(id.trim())) : [],
  baseApiUrl: 'https://tapi.bale.ai',
  
  // تنظیمات پایگاه داده
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'quran_khatm_bot',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  // تنظیمات قرآن
  quran: {
    totalPages: 604,
    pagesPerPair: 2
  }
};
