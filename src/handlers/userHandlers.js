const { calculateProgress } = require('../utils/helpers');
const { showPageInfo } = require('../utils/quranSender');

/**
 * هندلر دکمه "شرکت در ختم قرآن"
 */
async function handleJoinKhatm(bot, query, db, userStates) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const messageId = query.message.message_id;

  bot.answerCallbackQuery(query.id);

  db.users.getUserCampaign(userId, (err, userCampaign) => {
    if (err) {
      console.error('Error getting user campaign:', err);
      bot.sendMessage(chatId, 'خطا در دریافت اطلاعات کاربر');
      return;
    }

    if (userCampaign && userCampaign.selected_campaign_id) {
      // کاربر قبلاً کمپین انتخاب کرده
      const campaignId = userCampaign.selected_campaign_id;
      userStates[userId] = { campaignId };

      db.pages.getUserAssignedPage(userId, campaignId, (err, assignedPage) => {
        if (err) {
          console.error('Error getting assigned page:', err);
          bot.sendMessage(chatId, 'خطا در بررسی وضعیت');
          return;
        }

        if (assignedPage) {
          // نمایش اطلاعات صفحه بدون متن
          showPageInfo(
            bot,
            chatId,
            messageId,
            assignedPage.id,
            assignedPage.page_start,
            assignedPage.page_end
          );
          return;
        }

        showAvailablePages(bot, chatId, messageId, campaignId, db);
      });
    } else {
      // کاربر هنوز کمپین انتخاب نکرده
      showCampaignSelection(bot, chatId, messageId, db);
    }
  });
}

/**
 * نمایش لیست کمپین‌ها برای انتخاب
 */
function showCampaignSelection(bot, chatId, messageId, db) {
  db.campaigns.getActiveCampaigns((err, campaigns) => {
    if (err) {
      console.error('Error getting campaigns:', err);
      bot.sendMessage(chatId, 'خطا در دریافت کمپین‌ها');
      return;
    }

    if (campaigns.length === 0) {
      const message = '⚠️ هیچ کمپین فعالی وجود ندارد.\n\nلطفاً از ادمین بخواهید کمپین ایجاد کند.';
      const keyboard = {
        reply_markup: {
          inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]]
        }
      };
      
      bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboard.reply_markup
      }).catch(err => {
        console.error('Error editing message:', err.message);
        bot.sendMessage(chatId, message, keyboard);
      });
      return;
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: campaigns.map(c => [
          { text: c.name, callback_data: `select_campaign_${c.id}` }
        ]).concat([[{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]])
      }
    };

    const message = 'لطفاً یک کمپین را انتخاب کنید:';
    
    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard.reply_markup
    }).catch(err => {
      console.error('Error editing message:', err.message);
      bot.sendMessage(chatId, message, keyboard);
    });
  });
}

/**
 * نمایش صفحات موجود برای خواندن
 */
function showAvailablePages(bot, chatId, messageId, campaignId, db) {
  db.campaigns.getCampaignStats(campaignId, (err, stats) => {
    if (err) {
      console.error('Error getting campaign stats:', err);
    }

    db.pages.getAvailablePages(campaignId, (err, pages) => {
      if (err) {
        console.error('Error getting available pages:', err);
        bot.sendMessage(chatId, 'خطا در دریافت صفحات');
        return;
      }

      if (pages.length === 0) {
        const message = '🎉 تمام صفحات انتخاب شده‌اند!';
        const keyboard = {
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: 'join_khatm' }]]
          }
        };
        
        bot.editMessageText(message, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: keyboard.reply_markup
        }).catch(err => {
          console.error('Error editing message:', err.message);
          bot.sendMessage(chatId, message, keyboard);
        });
        return;
      }

      // تقسیم دکمه‌ها به سطرهای 3 تایی
      const buttons = [];
      for (let i = 0; i < pages.length; i += 3) {
        const row = pages.slice(i, i + 3).map(p => ({
          text: `${p.page_start}-${p.page_end}`,
          callback_data: `assign_${p.id}`
        }));
        buttons.push(row);
      }

      buttons.push([{ text: '✍️ وارد کردن شماره صفحه', callback_data: `manual_page_${campaignId}` }]);
      buttons.push([
        { text: '� تغییر کمپین', callback_data: 'change_campaign' },
        { text: '�🔙 بازگشت', callback_data: 'back_to_main' }
      ]);

      // ساخت پیام با آمار
      let message = '📊 وضعیت کمپین:\n';
      if (stats) {
        const percentage = calculateProgress(stats.completedPages, stats.totalPages);
        message += `👥 کاربران فعال: ${stats.activeUsers}\n`;
        message += `✅ خوانده شده: ${stats.completedPages} از ${stats.totalPages} (${percentage}%)\n`;
        message += `📖 باقی مانده: ${stats.remainingPages}\n`;
      }
      message += '\n📚 صفحات موجود برای خواندن:\n';
      message += 'یا شماره صفحه را وارد کنید:';

      bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: buttons }
      }).catch(err => {
        console.error('Error editing message:', err.message);
        bot.sendMessage(chatId, message, {
          reply_markup: { inline_keyboard: buttons }
        });
      });
    });
  });
}

module.exports = {
  handleJoinKhatm,
  showCampaignSelection,
  showAvailablePages
};

/**
 * نمایش وضعیت کاربر
 */
function showUserStatus(bot, chatId, userId, db) {
  db.pages.getUserStats(userId, (err, stats) => {
    if (err) {
      console.error('Error getting user stats:', err);
      bot.sendMessage(chatId, 'خطا در دریافت آمار');
      return;
    }

    let message = '📊 وضعیت شما:\n\n';
    message += `✅ صفحات خوانده شده: ${stats.completedPages}\n`;
    message += `📖 در حال خواندن: ${stats.readingPages}\n`;
    
    if (stats.recentPages && stats.recentPages.length > 0) {
      message += '\n📚 آخرین صفحات خوانده شده:\n';
      stats.recentPages.forEach((page, index) => {
        const date = new Date(page.completed_at);
        const dateStr = date.toLocaleDateString('fa-IR');
        message += `${index + 1}. صفحات ${page.page_start}-${page.page_end} (${page.campaign_name}) - ${dateStr}\n`;
      });
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📖 شرکت در ختم قرآن', callback_data: 'join_khatm' }],
          [{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]
        ]
      }
    };

    bot.sendMessage(chatId, message, keyboard);
  });
}

module.exports = {
  handleJoinKhatm,
  showCampaignSelection,
  showAvailablePages,
  showUserStatus
};
