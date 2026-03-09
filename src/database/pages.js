const { QuranPage, Campaign } = require('../models');
const { getPagePair } = require('../utils/helpers');
const { Op } = require('sequelize');

class PageRepository {
  // دریافت صفحات خالی یک کمپین
  async getAvailablePages(campaignId, callback) {
    try {
      const pages = await QuranPage.findAll({
        where: {
          campaignId: campaignId,
          readerId: null
        },
        order: [['page_start', 'ASC']],
        limit: 30
      });
      
      const result = pages.map(p => ({
        id: p.id,
        campaign_id: p.campaignId,
        page_start: p.pageStart,
        page_end: p.pageEnd,
        reader_id: p.readerId,
        reader_name: p.readerName
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
          readerId: userId,
          readerName: userName,
          assignedAt: new Date()
        },
        {
          where: {
            id: pageId,
            readerId: null
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
          isCompleted: true,
          completedAt: new Date()
        },
        {
          where: {
            id: pageId,
            readerId: userId
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
          readerId: null,
          readerName: null,
          assignedAt: null
        },
        {
          where: {
            id: pageId,
            readerId: userId,
            isCompleted: false
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

  // دریافت صفحات تکمیل شده یک کمپین با اطلاعات کاربر
  async getCompletedPagesWithUserInfo(campaignId, callback) {
    try {
      const { User } = require('../models');
      
      const pages = await QuranPage.findAll({
        where: {
          campaignId: campaignId,
          isCompleted: true
        },
        include: [{
          model: User,
          as: 'reader',
          attributes: ['id', 'username', 'firstName', 'lastName', 'zaerCode'],
          required: false
        }],
        order: [['completed_at', 'DESC']]
      });
      
      const result = pages.map(p => ({
        id: p.id,
        campaign_id: p.campaignId,
        page_start: p.pageStart,
        page_end: p.pageEnd,
        reader_id: p.readerId,
        reader_name: p.readerName,
        completed_at: p.completedAt,
        zaer_code: p.reader ? p.reader.zaerCode : null
      }));
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      console.error('Error getting completed pages with user info:', error.message);
      if (callback) callback(error);
      throw error;
    }
  }

  // دریافت صفحات تکمیل شده یک کمپین
  async getCompletedPages(campaignId, callback) {
    try {
      const pages = await QuranPage.findAll({
        where: {
          campaignId: campaignId,
          isCompleted: true
        },
        order: [['completed_at', 'DESC']]
      });
      
      const result = pages.map(p => ({
        id: p.id,
        campaign_id: p.campaignId,
        page_start: p.pageStart,
        page_end: p.pageEnd,
        reader_id: p.readerId,
        reader_name: p.readerName,
        completed_at: p.completedAt
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
          readerId: userId,
          campaignId: campaignId,
          isCompleted: false
        }
      });
      
      const result = page ? {
        id: page.id,
        campaign_id: page.campaignId,
        page_start: page.pageStart,
        page_end: page.pageEnd,
        reader_id: page.readerId,
        reader_name: page.readerName,
        assigned_at: page.assignedAt
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
          campaignId: campaignId,
          pageStart: pageStart,
          pageEnd: pageEnd,
          readerId: null
        }
      });
      
      const result = page ? {
        id: page.id,
        campaign_id: page.campaignId,
        page_start: page.pageStart,
        page_end: page.pageEnd
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
      const page = await QuranPage.findByPk(pageId);
      
      const result = page ? {
        id: page.id,
        campaign_id: page.campaignId,
        page_start: page.pageStart,
        page_end: page.pageEnd,
        reader_id: page.readerId,
        reader_name: page.readerName,
        assigned_at: page.assignedAt,
        completed_at: page.completedAt,
        is_completed: page.isCompleted
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
        where: { readerId: userId, isCompleted: true }
      });
      
      const readingPages = await QuranPage.count({
        where: { readerId: userId, isCompleted: false }
      });
      
      const recentPages = await QuranPage.findAll({
        where: { readerId: userId, isCompleted: true },
        include: [{
          model: Campaign,
          as: 'campaign',
          attributes: ['name']
        }],
        order: [['completed_at', 'DESC']],
        limit: 10
      });
      
      const stats = {
        completedPages,
        readingPages,
        recentPages: recentPages.map(p => ({
          page_start: p.pageStart,
          page_end: p.pageEnd,
          campaign_name: p.campaign.name,
          completed_at: p.completedAt
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
          campaignId: campaignId,
          readerId: { [Op.ne]: null },
          isCompleted: false
        },
        order: [['assigned_at', 'DESC']]
      });
      
      const result = pages.map(p => ({
        id: p.id,
        campaign_id: p.campaignId,
        page_start: p.pageStart,
        page_end: p.pageEnd,
        reader_id: p.readerId,
        reader_name: p.readerName,
        assigned_at: p.assignedAt
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
