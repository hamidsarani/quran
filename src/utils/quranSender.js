const { getQuranPageText } = require('../services/quranApi');

/**
 * نمایش اطلاعات صفحه بدون متن قرآن
 */
function showPageInfo(bot, chatId, messageId, pageId, pageStart, pageEnd) {
  console.log(`Showing page info for pages ${pageStart}-${pageEnd}`);
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📖 مشاهده متن قرآن', callback_data: `view_quran_${pageId}_${pageStart}` }],
        [{ text: '✅ هر دو صفحه را خواندم', callback_data: `complete_${pageId}` }],
        [{ text: '❌ لغو انتخاب', callback_data: `cancel_page_${pageId}` }],
        [
          { text: '🔄 تغییر کمپین', callback_data: 'change_campaign' },
          { text: '🔙 بازگشت', callback_data: 'back_to_main' }
        ]
      ]
    }
  };
  
  const message = `✅ صفحات ${pageStart} تا ${pageEnd} به شما اختصاص یافت.\n\n📖 برای مشاهده متن قرآن، دکمه زیر را بزنید.\nبعد از خواندن هر دو صفحه، دکمه "هر دو صفحه را خواندم" را بزنید.`;
  
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
}

/**
 * نمایش صفحه قرآن با دکمه‌های navigation
 */
function showQuranPage(bot, chatId, messageId, pageId, pageStart, pageEnd, currentPage) {
  console.log(`Showing Quran page ${currentPage} (range: ${pageStart}-${pageEnd})`);
  
  getQuranPageText(currentPage, (err, quranText) => {
    if (err) {
      console.error('Error fetching Quran text:', err);
      bot.sendMessage(chatId, '⚠️ خطا در دریافت متن قرآن. لطفاً دوباره تلاش کنید.');
      return;
    }
    
    // ساخت دکمه‌های navigation
    const navButtons = [];
    const pageButtons = [];
    
    // دکمه صفحه قبل
    if (currentPage > pageStart) {
      pageButtons.push({ 
        text: '◀️ صفحه قبل', 
        callback_data: `quran_page_${pageId}_${currentPage - 1}` 
      });
    }
    
    // دکمه صفحه بعد
    if (currentPage < pageEnd) {
      pageButtons.push({ 
        text: 'صفحه بعد ▶️', 
        callback_data: `quran_page_${pageId}_${currentPage + 1}` 
      });
    }
    
    if (pageButtons.length > 0) {
      navButtons.push(pageButtons);
    }
    
    // دکمه بستن متن
    navButtons.push([{ text: '❌ بستن متن', callback_data: `close_quran_${pageId}` }]);
    
    // دکمه‌های اصلی
    navButtons.push([{ text: '✅ هر دو صفحه را خواندم', callback_data: `complete_${pageId}` }]);
    navButtons.push([{ text: '❌ لغو انتخاب', callback_data: `cancel_page_${pageId}` }]);
    navButtons.push([
      { text: '🔄 تغییر کمپین', callback_data: 'change_campaign' },
      { text: '🔙 بازگشت', callback_data: 'back_to_main' }
    ]);
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: navButtons
      }
    };
    
    const message = quranText + `\n━━━━━━━━━━━━━━━━\n📖 صفحات ${pageStart} تا ${pageEnd}\nصفحه فعلی: ${currentPage}`;
    
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

module.exports = {
  showPageInfo,
  showQuranPage
};
