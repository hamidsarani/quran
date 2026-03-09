const { createUserMention } = require('../utils/helpers');

/**
 * نمایش صفحه صلوات شمار
 */
function showSalawatCounter(bot, chatId, messageId, campaignId, userId, db) {
  // دریافت تعداد صلوات کاربر
  db.salawat.getUserSalawatCount(campaignId, userId, (err, count) => {
    if (err) {
      console.error('Error getting salawat count:', err);
      count = 0;
    }

    const message = `
🌟 صلوات شمار 🌟

اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ

📊 تعداد صلوات شما: ${count}

هر بار که صلوات می‌فرستید، دکمه زیر را بزنید:
`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌟 صلوات فرستادم', callback_data: `salawat_send_${campaignId}` }],
          [{ text: '📊 رتبه‌بندی', callback_data: `salawat_rank_${campaignId}` }],
          [{ text: '🔄 تغییر کمپین', callback_data: 'change_campaign' }],
          [{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]
        ]
      }
    };

    if (messageId) {
      bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboard.reply_markup
      }).catch(err => {
        console.error('Error editing message:', err.message);
        bot.sendMessage(chatId, message, keyboard);
      });
    } else {
      bot.sendMessage(chatId, message, keyboard);
    }
  });
}

/**
 * افزایش تعداد صلوات
 */
function incrementSalawat(bot, query, db) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const messageId = query.message.message_id;
  const userName = `${query.from.first_name || ''} ${query.from.last_name || ''}`.trim();
  const campaignId = parseInt(query.data.split('_')[2]);

  db.salawat.incrementSalawat(campaignId, userId, userName, (err, newCount) => {
    if (err) {
      bot.answerCallbackQuery(query.id, { text: '❌ خطا در ثبت صلوات' });
      return;
    }

    // نمایش پیام تبریک
    bot.answerCallbackQuery(query.id, { 
      text: `✅ صلوات ${newCount} ثبت شد!`,
      show_alert: false
    });

    // آپدیت صفحه
    showSalawatCounter(bot, chatId, messageId, campaignId, userId, db);
  });
}

/**
 * نمایش رتبه‌بندی
 */
function showSalawatRanking(bot, chatId, messageId, campaignId, db) {
  db.campaigns.getCampaignById(campaignId, (err, campaign) => {
    if (err || !campaign) {
      bot.sendMessage(chatId, 'خطا در دریافت اطلاعات کمپین');
      return;
    }

    // دریافت مجموع صلوات
    db.salawat.getCampaignTotalSalawat(campaignId, (err, total) => {
      if (err) {
        console.error('Error getting total salawat:', err);
        total = 0;
      }

      // دریافت تعداد شرکت‌کنندگان
      db.salawat.getParticipantsCount(campaignId, (err, participants) => {
        if (err) {
          console.error('Error getting participants:', err);
          participants = 0;
        }

        // دریافت top 20
        db.salawat.getTopUsers(campaignId, 20, (err, topUsers) => {
          if (err) {
            console.error('Error getting top users:', err);
            topUsers = [];
          }

          let message = `📊 رتبه‌بندی صلوات - ${campaign.name}\n\n`;
          message += `🌟 مجموع صلوات: ${total.toLocaleString('fa-IR')}\n`;
          message += `👥 تعداد شرکت‌کنندگان: ${participants}\n\n`;

          if (topUsers.length === 0) {
            message += 'هنوز کسی صلوات ثبت نکرده است.';
          } else {
            message += '🏆 برترین‌ها:\n\n';

            topUsers.forEach((user, index) => {
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
              const userMention = createUserMention(user.user_id, user.user_name);
              
              message += `${medal} ${userMention} - ${user.count.toLocaleString('fa-IR')} صلوات\n`;
              
              if (user.zaer_code) {
                message += `   🕌 کد زائر: ${user.zaer_code}\n`;
              }
              
              message += '\n';
            });
          }

          const keyboard = {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 بازگشت', callback_data: `salawat_counter_${campaignId}` }]
              ]
            }
          };

          if (messageId) {
            bot.editMessageText(message, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: keyboard.reply_markup
            }).catch(err => {
              console.error('Error editing message:', err.message);
              bot.sendMessage(chatId, message, keyboard);
            });
          } else {
            bot.sendMessage(chatId, message, keyboard);
          }
        });
      });
    });
  });
}

module.exports = {
  showSalawatCounter,
  incrementSalawat,
  showSalawatRanking
};
