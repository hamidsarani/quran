const { Campaign, QuranPage } = require('../models');
const config = require('../config/config');

class CampaignRepository {
  // ایجاد کمپین جدید
  async createCampaign(name, type = 'zaerin', callback) {
    try {
      const campaign = await Campaign.create({ name, type });
      const campaignId = campaign.id;
      
      // فقط برای کمپین‌های زائرین (قرآن) صفحات ایجاد می‌کنیم
      if (type === 'zaerin') {
        // ایجاد 302 جفت صفحه (604 صفحه به صورت 2 تایی)
        const pages = [];
        for (let i = 1; i <= config.quran.totalPages; i += config.quran.pagesPerPair) {
          const pageEnd = Math.min(i + 1, config.quran.totalPages);
          pages.push({
            campaignId: campaignId,
            pageStart: i,
            pageEnd: pageEnd
          });
        }
        
        await QuranPage.bulkCreate(pages);
      }
      
      if (callback) callback(null, campaignId);
      return campaignId;
    } catch (error) {
      console.error('Error creating campaign:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت کمپین‌های فعال
  async getActiveCampaigns(callback) {
    try {
      const campaigns = await Campaign.findAll({
        where: { isActive: true },
        order: [['created_at', 'DESC']]
      });
      
      const result = campaigns.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        created_at: c.createdAt,
        is_active: c.isActive,
        is_completed: c.isCompleted
      }));
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting active campaigns:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت تمام کمپین‌ها
  async getAllCampaigns(callback) {
    try {
      const campaigns = await Campaign.findAll({
        order: [['created_at', 'DESC']]
      });
      
      const result = campaigns.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        created_at: c.createdAt,
        is_active: c.isActive,
        is_completed: c.isCompleted
      }));
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting all campaigns:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت یک کمپین
  async getCampaignById(campaignId, callback) {
    try {
      const campaign = await Campaign.findByPk(campaignId);
      
      const result = campaign ? {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        created_at: campaign.createdAt,
        is_active: campaign.isActive,
        is_completed: campaign.isCompleted
      } : null;
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting campaign by id:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // تغییر وضعیت نمایش کمپین
  async toggleCampaignActive(campaignId, callback) {
    try {
      const campaign = await Campaign.findByPk(campaignId);
      if (campaign) {
        campaign.isActive = !campaign.isActive;
        await campaign.save();
      }
      
      if (callback) callback(null);
      return true;
    } catch (error) {
      console.error('Error toggling campaign active:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // تنظیم کمپین به عنوان پایان یافته
  async setCampaignCompleted(campaignId, isCompleted, callback) {
    try {
      await Campaign.update(
        { isCompleted: isCompleted },
        { where: { id: campaignId } }
      );
      
      if (callback) callback(null);
      return true;
    } catch (error) {
      console.error('Error setting campaign completed:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت آمار کمپین
  async getCampaignStats(campaignId, callback) {
    try {
      const totalPages = await QuranPage.count({
        where: { campaignId: campaignId }
      });
      
      const completedPages = await QuranPage.count({
        where: { campaignId: campaignId, isCompleted: true }
      });
      
      const activeUsers = await QuranPage.count({
        where: { campaignId: campaignId, readerId: { [require('sequelize').Op.ne]: null } },
        distinct: true,
        col: 'readerId'
      });
      
      const stats = {
        totalPages,
        completedPages,
        remainingPages: totalPages - completedPages,
        activeUsers
      };
      
      if (callback) callback(null, stats);
      return stats;
    } catch (error) {
      console.error('Error getting campaign stats:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }
}

module.exports = CampaignRepository;
