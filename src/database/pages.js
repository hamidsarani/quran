const { QuranPage, Campaign } = require('../models');
const { getPagePair } = require('../utils/helpers');
const { Op } = require('sequelize');

class PageRepository {
  // دریافت صفحات خالی یک کمپین
  async getAvailablePages(campaignId, callback) {
    try {
      const pages = await QuranPage.findAll({
        where: {
          campaign_id: campaignId,
          reader_id: null
        },
        order: [['page_start', 'ASC']],
        limit: 30,
        raw: true
      });
      
      const result = pages.map(p => ({
        id: p.id,
        campaign_id: p.campaign_id,
        page_start: p.page_start,
        page_end: p.page_end,
        reader_id: p.reader_id,
        reader_name: p.reader_name
      }));
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting available pages:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // انتساب صفحه به کاربر
  async assignPage(pageId, userId, userName, callback) {
    try {
      const [updatedRowsCount] = await QuranPage.update(
        {
          reader_id: userId,
          reader_name: userName,
          assigned_at: new Date()
        },
        {
          where: {
            id: pageId,
            reader_id: null
          }
        }
      );
      
      const result = { changes: updatedRowsCount };
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error assigning page:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // تکمیل خواندن صفحه
  async completePage(pageId, userId, callback) {
    try {
      const [updatedRowsCount] = await QuranPage.update(
        {
          is_completed: true,
          completed_at: new Date()
        },
        {
          where: {
            id: pageId,
            reader_id: userId
          }
        }
      );
      
      const result = { changes: updatedRowsCount };
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error completing page:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // لغو انتخاب صفحه
  async cancelPage(pageId, userId, callback) {
    try {
      const [updatedRowsCount] = await QuranPage.update(
        {
          reader_id: null,
          reader_name: null,
          assigned_at: null
        },
        {
          where: {
            id: pageId,
            reader_id: userId,
            is_completed: false
          }
        }
      );
      
      const result = { changes: updatedRowsCount };
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error canceling page:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت صفحات تکمیل شده یک کمپین
  async getCompletedPages(campaignId, callback) {
    try {
      const pages = await QuranPage.findAll({
        where: {
          campaign_id: campaignId,
          is_completed: true
        },
        order: [['completed_at', 'DESC']],
        raw: true
      });
      
      const result = pages.map(p => ({
        id: p.id,
        campaign_id: p.campaign_id,
        page_start: p.page_start,
        page_end: p.page_end,
        reader_id: p.reader_id,
        reader_name: p.reader_name,
        completed_at: p.completed_at
      }));
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting completed pages:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت صفحه انتساب یافته به کاربر
  async getUserAssignedPage(userId, campaignId, callback) {
    try {
      const page = await QuranPage.findOne({
        where: {
          reader_id: userId,
          campaign_id: campaignId,
          is_completed: false
        },
        raw: true
      });
      
      const result = page ? {
        id: page.id,
        campaign_id: page.campaign_id,
        page_start: page.page_start,
        page_end: page.page_end,
        reader_id: page.reader_id,
        reader_name: page.reader_name,
        assigned_at: page.assigned_at
      } : null;
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting user assigned page:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت صفحه بر اساس شماره
  async getPageByNumber(campaignId, pageNumber, callback) {
    try {
      const { pageStart, pageEnd } = getPagePair(pageNumber);

      const page = await QuranPage.findOne({
        where: {
          campaign_id: campaignId,
          page_start: pageStart,
          page_end: pageEnd,
          reader_id: null
        },
        raw: true
      });
      
      const result = page ? {
        id: page.id,
        campaign_id: page.campaign_id,
        page_start: page.page_start,
        page_end: page.page_end
      } : null;
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting page by number:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت صفحه بر اساس ID
  async getPageById(pageId, callback) {
    try {
      const page = await QuranPage.findByPk(pageId, { raw: true });
      
      const result = page ? {
        id: page.id,
        campaign_id: page.campaign_id,
        page_start: page.page_start,
        page_end: page.page_end,
        reader_id: page.reader_id,
        reader_name: page.reader_name,
        assigned_at: page.assigned_at,
        completed_at: page.completed_at,
        is_completed: page.is_completed
      } : null;
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting page by id:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت آمار کاربر
  async getUserStats(userId, callback) {
    try {
      const completedPages = await QuranPage.count({
        where: { reader_id: userId, is_completed: true }
      });
      
      const readingPages = await QuranPage.count({
        where: { reader_id: userId, is_completed: false }
      });
      
      const recentPages = await QuranPage.findAll({
        where: { reader_id: userId, is_completed: true },
        include: [{
          model: Campaign,
          as: 'campaign',
          attributes: ['name']
        }],
        order: [['completed_at', 'DESC']],
        limit: 10,
        raw: true,
        nest: true
      });
      
      const stats = {
        completedPages,
        readingPages,
        recentPages: recentPages.map(p => ({
          page_start: p.page_start,
          page_end: p.page_end,
          campaign_name: p.campaign.name,
          completed_at: p.completed_at
        }))
      };
      
      if (callback) callback(null, stats);
      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت صفحات در حال خواندن (assigned ولی complete نشده)
  async getInProgressPages(campaignId, callback) {
    try {
      const pages = await QuranPage.findAll({
        where: {
          campaign_id: campaignId,
          reader_id: { [Op.ne]: null },
          is_completed: false
        },
        order: [['assigned_at', 'DESC']],
        raw: true
      });
      
      const result = pages.map(p => ({
        id: p.id,
        campaign_id: p.campaign_id,
        page_start: p.page_start,
        page_end: p.page_end,
        reader_id: p.reader_id,
        reader_name: p.reader_name,
        assigned_at: p.assigned_at
      }));
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting in-progress pages:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }
}

module.exports = PageRepository;
