const { createUserMention } = require('../utils/helpers');

/**
 * نمایش پنل ادمین
 */
function showAdminPanel(bot, chatId, messageId) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ ایجاد کمپین جدید', callback_data: 'create_campaign' }],
        [{ text: '⚙️ مدیریت کمپین‌ها', callback_data: 'manage_campaigns' }],
        [{ text: '👥 لیست کاربران', callback_data: 'list_users' }],
        [{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]
      ]
    }
  };

  bot.editMessageText('پنل مدیریت:', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: keyboard.reply_markup
  });
}

/**
 * نمایش لیست کمپین‌ها برای مدیریت
 */
function showManageCampaigns(bot, chatId, messageId, db) {
  db.campaigns.getAllCampaigns((err, campaigns) => {
    if (err || campaigns.length === 0) {
      bot.editMessageText('هیچ کمپینی وجود ندارد.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: 'admin_panel' }]]
        }
      });
      return;
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: campaigns.map(c => {
          const status = c.is_completed ? '✅' : (c.is_active ? '🟢' : '🔴');
          return [{ text: `${status} ${c.name}`, callback_data: `manage_camp_${c.id}` }];
        }).concat([[{ text: '🔙 بازگشت', callback_data: 'admin_panel' }]])
      }
    };

    bot.editMessageText('انتخاب کمپین برای مدیریت:\n\n🟢 فعال | 🔴 غیرفعال | ✅ پایان یافته', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard.reply_markup
    });
  });
}

/**
 * نمایش جزئیات مدیریت یک کمپین
 */
function showCampaignManagement(bot, chatId, messageId, campaignId, db) {
  db.campaigns.getCampaignById(campaignId, (err, campaign) => {
    if (err || !campaign) {
      bot.sendMessage(chatId, 'خطا در دریافت اطلاعات کمپین');
      return;
    }

    // دریافت آمار کمپین
    db.campaigns.getCampaignStats(campaignId, (err, stats) => {
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 مشاهده گزارش', callback_data: `report_summary_${campaignId}` }],
            [{ text: '📖 صفحات در حال خواندن', callback_data: `inprogress_pages_${campaignId}` }],
            [{ text: campaign.is_active ? '❌ مخفی کردن' : '✅ نمایش دادن', callback_data: `toggle_active_${campaignId}` }],
            [{ text: campaign.is_completed ? '🔄 تنظیم به عنوان جاری' : '✅ تنظیم به عنوان پایان یافته', callback_data: `toggle_complete_${campaignId}` }],
            [{ text: '🔙 بازگشت', callback_data: 'manage_campaigns' }]
          ]
        }
      };

      const statusText = campaign.is_completed ? 'پایان یافته' : (campaign.is_active ? 'فعال' : 'غیرفعال');
      
      let message = `مدیریت کمپین: ${campaign.name}\n\n`;
      message += `وضعیت: ${statusText}\n`;
      
      if (stats) {
        message += `\n📊 آمار کلی:\n`;
        message += `👥 تعداد کاربران: ${stats.activeUsers}\n`;
        message += `✅ خوانده شده: ${stats.completedPages} از ${stats.totalPages}\n`;
        message += `📖 باقی مانده: ${stats.remainingPages}`;
      }

      bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboard.reply_markup
      });
    });
  });
}

/**
 * نمایش گزارش کلی کمپین (خلاصه به تفکیک کاربر)
 */
function showCampaignSummaryReport(bot, chatId, messageId, campaignId, db) {
  db.campaigns.getCampaignById(campaignId, (err, campaign) => {
    if (err || !campaign) {
      bot.sendMessage(chatId, 'خطا در دریافت اطلاعات کمپین');
      return;
    }

    db.pages.getCompletedPagesWithUserInfo(campaignId, (err, pages) => {
      if (err) {
        bot.sendMessage(chatId, 'خطا در دریافت گزارش');
        return;
      }

      let report = `📊 گزارش کمپین: ${campaign.name}\n\n`;
      
      if (pages.length === 0) {
        report += 'هنوز صفحه‌ای خوانده نشده است.';
      } else {
        // گروه‌بندی بر اساس کاربر
        const userPages = {};
        pages.forEach(page => {
          if (!userPages[page.reader_id]) {
            userPages[page.reader_id] = {
              name: page.reader_name,
              zaer_code: page.zaer_code,
              pages: []
            };
          }
          userPages[page.reader_id].pages.push(`${page.page_start}-${page.page_end}`);
        });

        // تبدیل به آرایه و مرتب‌سازی بر اساس تعداد صفحات (از زیاد به کم)
        const sortedUsers = Object.entries(userPages)
          .map(([userId, userData]) => ({
            userId,
            name: userData.name,
            zaer_code: userData.zaer_code,
            pages: userData.pages,
            pageCount: userData.pages.length * 2 // هر جفت = 2 صفحه
          }))
          .sort((a, b) => b.pageCount - a.pageCount);

        // نمایش هر کاربر
        sortedUsers.forEach((user, index) => {
          const userMention = createUserMention(user.userId, user.name);
          const pagesList = user.pages.join(') (');
          
          report += `${index + 1}. ${userMention} (${user.pageCount} صفحه)\n`;
          
          // نمایش کد زائر اگر وجود داشته باشد
          if (user.zaer_code) {
            report += `   🕌 کد زائر: ${user.zaer_code}\n`;
          }
          
          report += `   (${pagesList})\n\n`;
        });
        
        const totalUsers = sortedUsers.length;
        report += `━━━━━━━━━━━━━━━━\n`;
        report += `👥 تعداد کاربران: ${totalUsers}\n`;
        report += `✅ مجموع: ${pages.length} از 302 جفت صفحه`;
      }

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 بازگشت', callback_data: `manage_camp_${campaignId}` }]
          ]
        }
      };

      bot.editMessageText(report, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: keyboard.reply_markup
      }).catch(err => {
        console.error('Error editing message:', err.message);
        bot.sendMessage(chatId, report, { parse_mode: 'HTML', ...keyboard });
      });
    });
  });
}

/**
 * نمایش لیست کاربران
 */
function showUsersList(bot, chatId, messageId, db) {
  db.users.getAllUsers((err, users) => {
    if (err) {
      console.error('Error getting users:', err);
      bot.editMessageText('خطا در دریافت لیست کاربران.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: 'admin_panel' }]]
        }
      });
      return;
    }

    console.log('Users found:', users ? users.length : 0);

    if (!users || users.length === 0) {
      bot.editMessageText('هیچ کاربری ثبت نشده است.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: 'admin_panel' }]]
        }
      });
      return;
    }

    let message = `👥 لیست کاربران (${users.length} نفر):\n\n`;
    
    users.forEach((user, index) => {
      const userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
      const userMention = createUserMention(user.user_id, userName);
      const joinDate = user.joined_at ? new Date(user.joined_at).toLocaleDateString('fa-IR') : 'نامشخص';
      message += `${index + 1}. ${userMention}\n`;
      message += `   📅 عضویت: ${joinDate}\n`;
      if (user.completed_pages > 0) {
        message += `   ✅ خوانده: ${user.completed_pages} صفحه\n`;
      }
      message += `\n`;
    });

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 بازگشت', callback_data: 'admin_panel' }]
        ]
      }
    };

    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: keyboard.reply_markup
    }).catch(err => {
      console.error('Error editing message:', err.message);
      bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...keyboard });
    });
  });
}

/**
 * نمایش صفحات در حال خواندن
 */
function showInProgressPages(bot, chatId, messageId, campaignId, db) {
  db.campaigns.getCampaignById(campaignId, (err, campaign) => {
    if (err || !campaign) {
      bot.sendMessage(chatId, 'خطا در دریافت اطلاعات کمپین');
      return;
    }

    db.pages.getInProgressPages(campaignId, (err, pages) => {
      if (err) {
        console.error('Error getting in-progress pages:', err);
        bot.editMessageText('خطا در دریافت لیست صفحات.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: `manage_camp_${campaignId}` }]]
          }
        });
        return;
      }

      let message = `📖 صفحات در حال خواندن\nکمپین: ${campaign.name}\n\n`;
      
      if (!pages || pages.length === 0) {
        message += 'هیچ صفحه‌ای در حال خواندن نیست.';
      } else {
        // گروه‌بندی بر اساس کاربر
        const userPages = {};
        pages.forEach(page => {
          if (!userPages[page.reader_id]) {
            userPages[page.reader_id] = {
              name: page.reader_name,
              pages: []
            };
          }
          userPages[page.reader_id].pages.push({
            id: page.id,
            range: `${page.page_start}-${page.page_end}`,
            assigned_at: page.assigned_at
          });
        });

        // نمایش هر کاربر
        Object.keys(userPages).forEach((userId, index) => {
          const userData = userPages[userId];
          const userMention = createUserMention(userId, userData.name);
          const assignedDate = userData.pages[0].assigned_at ? 
            new Date(userData.pages[0].assigned_at).toLocaleDateString('fa-IR') : 'نامشخص';
          
          message += `${index + 1}. ${userMention}\n`;
          message += `   📅 انتخاب: ${assignedDate}\n`;
          message += `   📄 صفحات: ${userData.pages.map(p => p.range).join(', ')}\n\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━\n`;
        message += `📊 مجموع: ${pages.length} جفت صفحه در حال خواندن`;
      }

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 بازگشت', callback_data: `manage_camp_${campaignId}` }]
          ]
        }
      };

      bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: keyboard.reply_markup
      }).catch(err => {
        console.error('Error editing message:', err.message);
        bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...keyboard });
      });
    });
  });
}

module.exports = {
  showAdminPanel,
  showManageCampaigns,
  showCampaignManagement,
  showCampaignSummaryReport,
  showUsersList,
  showInProgressPages
};
