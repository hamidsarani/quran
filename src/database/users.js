const { User, Campaign, QuranPage } = require('../models');

class UserRepository {
  // ثبت کاربر
  async registerUser(userId, username, firstName, lastName, callback) {
    try {
      const [user, created] = await User.upsert({
        id: userId,
        username,
        firstName,
        lastName
      });
      if (callback) callback(null, user);
      return user;
    } catch (error) {
      console.error('Error registering user:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // تنظیم کمپین انتخابی کاربر
  async setUserCampaign(userId, campaignId, callback) {
    try {
      const [updatedRowsCount] = await User.update(
        { selectedCampaignId: campaignId },
        { where: { id: userId } }
      );
      if (callback) callback(null);
      return updatedRowsCount > 0;
    } catch (error) {
      console.error('Error setting user campaign:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت کمپین انتخابی کاربر
  async getUserCampaign(userId, callback) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['selectedCampaignId']
      });
      const result = user ? { selected_campaign_id: user.selectedCampaignId } : null;
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting user campaign:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت لیست تمام کاربران با آمار
  async getAllUsers(callback) {
    try {
      const users = await User.findAll({
        attributes: [
          'id',
          'username', 
          ['first_name', 'firstName'],
          ['last_name', 'lastName'],
          ['joined_at', 'joinedAt']
        ],
        order: [['joined_at', 'DESC']],
        raw: true
      });

      // دریافت تعداد صفحات خوانده شده برای هر کاربر
      const usersWithStats = await Promise.all(users.map(async (user) => {
        const completedCount = await QuranPage.count({
          where: {
            reader_id: user.id,
            is_completed: true
          }
        });

        return {
          user_id: user.id,
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
          joined_at: user.joinedAt,
          completed_pages: completedCount
        };
      }));

      if (callback) callback(null, usersWithStats);
      return usersWithStats;
    } catch (error) {
      console.error('Error getting all users:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }
}

module.exports = UserRepository;
