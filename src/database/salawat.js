const { Salawat, User } = require('../models');

class SalawatRepository {
  // افزایش تعداد صلوات کاربر
  async incrementSalawat(campaignId, userId, userName, callback) {
    try {
      // پیدا کردن یا ایجاد رکورد
      const [salawat, created] = await Salawat.findOrCreate({
        where: {
          campaignId: campaignId,
          userId: userId
        },
        defaults: {
          campaignId: campaignId,
          userId: userId,
          userName: userName,
          count: 0
        }
      });

      // افزایش تعداد
      salawat.count += 1;
      salawat.userName = userName; // آپدیت نام در صورت تغییر
      await salawat.save();

      if (callback) callback(null, salawat.count);
      return salawat.count;
    } catch (error) {
      console.error('Error incrementing salawat:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت تعداد صلوات کاربر در یک کمپین
  async getUserSalawatCount(campaignId, userId, callback) {
    try {
      const salawat = await Salawat.findOne({
        where: {
          campaignId: campaignId,
          userId: userId
        }
      });

      const count = salawat ? salawat.count : 0;
      if (callback) callback(null, count);
      return count;
    } catch (error) {
      console.error('Error getting user salawat count:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت مجموع صلوات یک کمپین
  async getCampaignTotalSalawat(campaignId, callback) {
    try {
      const result = await Salawat.sum('count', {
        where: { campaignId: campaignId }
      });

      const total = result || 0;
      if (callback) callback(null, total);
      return total;
    } catch (error) {
      console.error('Error getting campaign total salawat:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت رتبه‌بندی کاربران (top 20)
  async getTopUsers(campaignId, limit = 20, callback) {
    try {
      const topUsers = await Salawat.findAll({
        where: { campaignId: campaignId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['zaerCode'],
          required: false
        }],
        order: [['count', 'DESC']],
        limit: limit
      });

      const result = topUsers.map(s => ({
        user_id: s.userId,
        user_name: s.userName,
        count: s.count,
        zaer_code: s.user ? s.user.zaerCode : null
      }));

      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting top users:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت تعداد شرکت‌کنندگان
  async getParticipantsCount(campaignId, callback) {
    try {
      const count = await Salawat.count({
        where: { campaignId: campaignId }
      });

      if (callback) callback(null, count);
      return count;
    } catch (error) {
      console.error('Error getting participants count:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }
}

module.exports = SalawatRepository;
