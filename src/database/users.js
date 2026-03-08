const { User, Campaign, QuranPage } = require('../models');

class UserRepository {
  // ثبت کاربر
  async registerUser(userId, username, firstName, lastName) {
    try {
      const [user, created] = await User.upsert({
        id: userId,
        username,
        firstName,
        lastName
      });
      return user;
    } catch (error) {
      throw new Error(`Error registering user: ${error.message}`);
    }
  }

  // تنظیم کمپین انتخابی کاربر
  async setUserCampaign(userId, campaignId) {
    try {
      const [updatedRowsCount] = await User.update(
        { selectedCampaignId: campaignId },
        { where: { id: userId } }
      );
      return updatedRowsCount > 0;
    } catch (error) {
      throw new Error(`Error setting user campaign: ${error.message}`);
    }
  }

  // دریافت کمپین انتخابی کاربر
  async getUserCampaign(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['selectedCampaignId']
      });
      return user ? { selected_campaign_id: user.selectedCampaignId } : null;
    } catch (error) {
      throw new Error(`Error getting user campaign: ${error.message}`);
    }
  }

  // دریافت لیست تمام کاربران با آمار
  async getAllUsers() {
    try {
      const users = await User.findAll({
        attributes: [
          'id',
          'username', 
          'firstName',
          'lastName',
          'joinedAt',
          [
            User.sequelize.literal(`(
              SELECT COUNT(*)
              FROM quran_pages 
              WHERE reader_id = "User"."id" AND is_completed = true
            )`),
            'completedPages'
          ]
        ],
        order: [['joinedAt', 'DESC']]
      });

      return users.map(user => ({
        user_id: user.id,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        joined_at: user.joinedAt,
        completed_pages: user.dataValues.completedPages
      }));
    } catch (error) {
      throw new Error(`Error getting all users: ${error.message}`);
    }
  }
}

module.exports = UserRepository;
