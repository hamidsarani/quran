const TelegramBot = require('node-telegram-bot-api');
const config = require('./config/config');
const DatabaseManager = require('./database');
const { isAdmin } = require('./utils/helpers');
const { handleJoinKhatm, showCampaignSelection, showAvailablePages, showUserStatus } = require('./handlers/userHandlers');
const { showAdminPanel, showManageCampaigns, showCampaignManagement, showCampaignSummaryReport, showUsersList, showInProgressPages } = require('./handlers/adminHandlers');
const { getPagePair } = require('./utils/helpers');
const { showQuranPage, showPageInfo } = require('./utils/quranSender');

class QuranKhatmBot {
  constructor() {
    this.bot = new TelegramBot(config.botToken, {
      polling: true,
      baseApiUrl: config.baseApiUrl
    });
    
    this.db = new DatabaseManager();
    this.userStates = {};
    
    this.setupErrorHandlers();
    this.setupHandlers();
    
    console.log('✓ ربات ختم قرآن راه‌اندازی شد...');
  }

  setupErrorHandlers() {
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error.code);
      if (error.response && error.response.body) {
        console.error('Response body:', JSON.stringify(error.response.body, null, 2));
      } else {
        console.error('Error details:', error.message);
      }
    });

    this.bot.on('error', (error) => {
      console.error('Bot error:', error.code);
      if (error.response && error.response.body) {
        console.error('Response body:', JSON.stringify(error.response.body, null, 2));
      } else {
        console.error('Error details:', error.message);
      }
    });
  }

  setupHandlers() {
    // دستور /start
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    
    // دستور /help
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    
    // مدیریت callback queries
    this.bot.on('callback_query', (query) => this.handleCallbackQuery(query));
    
    // مدیریت پیام‌های متنی
    this.bot.on('message', (msg) => this.handleMessage(msg));
  }

  handleStart(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || '';
    const firstName = msg.from.first_name || '';
    const lastName = msg.from.last_name || '';

    console.log('======================');
    console.log('User Info:');
    console.log('User ID:', userId);
    console.log('Chat ID:', chatId);
    console.log('Username:', username);
    console.log('Name:', firstName, lastName);
    console.log('======================');

    // استفاده از async/await
    this.db.users.registerUser(userId, username, firstName, lastName)
      .then(() => {
        console.log('User registered successfully');
      })
      .catch(err => {
        console.error('Error registering user:', err.message);
      });

    const welcomeMessage = `سلام ${firstName} عزیز! 🌙\n\nبه ربات پویش‌های مذهبی خوش آمدید.\n\nبرای شرکت در پویش‌ها از دکمه‌های زیر استفاده کنید:`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📖 شرکت در پویش', callback_data: 'join_khatm' }],
          [{ text: '📊 وضعیت من', callback_data: 'my_status' }],
          ...(isAdmin(userId) ? [[{ text: '⚙️ پنل ادمین', callback_data: 'admin_panel' }]] : [])
        ]
      }
    };

    this.bot.sendMessage(chatId, welcomeMessage, keyboard);
  }

  handleHelp(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    let helpMessage = `📚 راهنمای استفاده از ربات پویش‌های مذهبی\n\n`;
    helpMessage += `🔹 برای کاربران:\n`;
    helpMessage += `• از دکمه "شرکت در پویش" برای انتخاب کمپین استفاده کنید\n`;
    helpMessage += `• در پویش ختم قرآن: هر بار 2 صفحه (یک جفت) به شما اختصاص داده می‌شود\n`;
    helpMessage += `• در پویش صلوات: هر بار که صلوات می‌فرستید، دکمه را بزنید\n`;
    helpMessage += `• می‌توانید متن قرآن را مشاهده کنید یا از منابع دیگر استفاده کنید\n`;
    helpMessage += `• بعد از خواندن هر دو صفحه، دکمه "هر دو صفحه را خواندم" را بزنید\n`;
    helpMessage += `• از دکمه "وضعیت من" برای مشاهده پیشرفت خود استفاده کنید\n\n`;
    
    if (isAdmin(userId)) {
      helpMessage += `🔹 برای ادمین:\n`;
      helpMessage += `• ایجاد کمپین جدید برای ختم‌های مختلف\n`;
      helpMessage += `• مدیریت کمپین‌ها (فعال/غیرفعال/تکمیل شده)\n`;
      helpMessage += `• مشاهده گزارش کامل هر کمپین\n`;
      helpMessage += `• مشاهده لیست کاربران و فعالیت‌ها\n\n`;
    }
    
    helpMessage += `❓ سوالات متداول:\n`;
    helpMessage += `• چگونه در پویش شرکت کنم؟ از منوی اصلی "شرکت در پویش" را بزنید\n`;
    helpMessage += `• چگونه کمپین عوض کنم؟ از دکمه "تغییر کمپین" استفاده کنید\n`;
    helpMessage += `• آیا می‌توانم در چند پویش شرکت کنم؟ بله، با تغییر کمپین\n`;
    helpMessage += `• متن قرآن از کجا می‌آید؟ از API رسمی قرآن کریم\n\n`;
    helpMessage += `📞 برای پشتیبانی با ادمین تماس بگیرید.`;

    this.bot.sendMessage(chatId, helpMessage);
  }

  handleCallbackQuery(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const messageId = query.message.message_id;

    // هندلرهای کاربر
    if (data === 'join_khatm') {
      handleJoinKhatm(this.bot, query, this.db, this.userStates);
    }
    else if (data.startsWith('select_campaign_')) {
      this.handleSelectCampaign(query);
    }
    else if (data === 'change_campaign') {
      this.bot.answerCallbackQuery(query.id);
      showCampaignSelection(this.bot, chatId, messageId, this.db);
    }
    else if (data.startsWith('assign_')) {
      this.handleAssignPage(query);
    }
    else if (data.startsWith('view_quran_')) {
      this.handleViewQuran(query);
    }
    else if (data.startsWith('close_quran_')) {
      this.handleCloseQuran(query);
    }
    else if (data.startsWith('quran_page_')) {
      this.handleQuranPageNavigation(query);
    }
    else if (data.startsWith('complete_')) {
      this.handleCompletePage(query);
    }
    else if (data.startsWith('cancel_page_')) {
      this.handleCancelPage(query);
    }
    else if (data.startsWith('manual_page_')) {
      this.handleManualPage(query);
    }
    else if (data.startsWith('confirm_page_')) {
      this.handleConfirmPage(query);
    }
    else if (data === 'my_status') {
      this.bot.answerCallbackQuery(query.id);
      showUserStatus(this.bot, chatId, userId, this.db);
    }
    
    // هندلرهای ادمین
    else if (data === 'admin_panel') {
      this.handleAdminPanel(query);
    }
    else if (data === 'create_campaign') {
      this.handleCreateCampaign(query);
    }
    else if (data.startsWith('create_camp_type_')) {
      this.handleSelectCampaignType(query);
    }
    else if (data === 'manage_campaigns') {
      this.handleManageCampaigns(query);
    }
    else if (data.startsWith('manage_camp_')) {
      this.handleManageCampaign(query);
    }
    else if (data.startsWith('toggle_active_')) {
      this.handleToggleActive(query);
    }
    else if (data.startsWith('toggle_complete_')) {
      this.handleToggleComplete(query);
    }
    else if (data.startsWith('report_summary_')) {
      this.handleShowSummaryReport(query);
    }
    else if (data === 'list_users') {
      this.handleListUsers(query);
    }
    else if (data.startsWith('inprogress_pages_')) {
      this.handleInProgressPages(query);
    }
    else if (data.startsWith('salawat_send_')) {
      const { incrementSalawat } = require('./handlers/salawatHandlers');
      incrementSalawat(this.bot, query, this.db);
    }
    else if (data.startsWith('salawat_counter_')) {
      const campaignId = parseInt(data.split('_')[2]);
      const { showSalawatCounter } = require('./handlers/salawatHandlers');
      showSalawatCounter(this.bot, chatId, messageId, campaignId, userId, this.db);
    }
    else if (data.startsWith('salawat_rank_')) {
      const campaignId = parseInt(data.split('_')[2]);
      const { showSalawatRanking } = require('./handlers/salawatHandlers');
      showSalawatRanking(this.bot, chatId, messageId, campaignId, this.db);
    }
    
    // بازگشت به منوی اصلی
    else if (data === 'back_to_main') {
      this.handleBackToMain(query);
    }
  }

  handleSelectCampaign(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const campaignId = parseInt(query.data.split('_')[2]);

    this.bot.answerCallbackQuery(query.id);

    // دریافت اطلاعات کمپین
    this.db.campaigns.getCampaignById(campaignId, (err, campaign) => {
      if (err || !campaign) {
        this.bot.sendMessage(chatId, 'خطا در دریافت اطلاعات کمپین');
        return;
      }

      // اگر کمپین از نوع زائرین است، کد زائر را چک کن
      if (campaign.type === 'zaerin') {
        this.db.users.getUserZaerCode(userId, (err, result) => {
          if (err) {
            console.error('Error getting zaer code:', err);
          }

          // اگر کد زائر ندارد، درخواست کن
          if (!result || !result.zaer_code) {
            this.userStates[userId] = { 
              waitingFor: 'zaer_code',
              campaignId: campaignId
            };
            this.bot.editMessageText(
              '🕌 این کمپین ویژه زائرین است.\n\nلطفاً کد زائر خود را وارد کنید:',
              {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                  inline_keyboard: [[
                    { text: '🔙 بازگشت', callback_data: 'join_khatm' }
                  ]]
                }
              }
            ).catch(err => {
              console.error('Error editing message:', err.message);
              this.bot.sendMessage(chatId, '🕌 این کمپین ویژه زائرین است.\n\nلطفاً کد زائر خود را وارد کنید:');
            });
            return;
          }

          // کد زائر دارد، ادامه بده
          this.continueSelectCampaign(userId, chatId, messageId, campaignId);
        });
      } else {
        // کمپین عادی است، ادامه بده
        this.continueSelectCampaign(userId, chatId, messageId, campaignId);
      }
    });
  }

  continueSelectCampaign(userId, chatId, messageId, campaignId) {
    this.userStates[userId] = { campaignId };

    this.db.users.setUserCampaign(userId, campaignId, (err) => {
      if (err) console.error('Error setting user campaign:', err);
    });

    // دریافت نوع کمپین
    this.db.campaigns.getCampaignById(campaignId, (err, campaign) => {
      if (err || !campaign) {
        this.bot.sendMessage(chatId, 'خطا در دریافت اطلاعات کمپین');
        return;
      }

      // اگر کمپین صلوات است
      if (campaign.type === 'salawat') {
        const { showSalawatCounter } = require('./handlers/salawatHandlers');
        showSalawatCounter(this.bot, chatId, messageId, campaignId, userId, this.db);
        return;
      }

      // کمپین زائرین (قرآن)
      this.db.pages.getUserAssignedPage(userId, campaignId, (err, assignedPage) => {
        if (err) {
          this.bot.sendMessage(chatId, 'خطا در بررسی وضعیت');
          return;
        }

        if (assignedPage) {
          // نمایش اطلاعات صفحه بدون متن
          showPageInfo(
            this.bot, 
            chatId, 
            messageId, 
            assignedPage.id, 
            assignedPage.page_start, 
            assignedPage.page_end
          );
          return;
        }

        showAvailablePages(this.bot, chatId, messageId, campaignId, this.db);
      });
    });
  }

  handleAssignPage(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const pageId = parseInt(query.data.split('_')[1]);
    const userName = `${query.from.first_name || ''} ${query.from.last_name || ''}`.trim();

    this.db.pages.assignPage(pageId, userId, userName, (err, result) => {
      if (err || result.changes === 0) {
        this.bot.answerCallbackQuery(query.id, { text: 'این صفحه قبلاً انتخاب شده است' });
        return;
      }

      this.db.pages.getPageById(pageId, (err, page) => {
        if (err || !page) {
          this.bot.answerCallbackQuery(query.id, { text: 'خطا در انتساب صفحه' });
          return;
        }

        this.bot.answerCallbackQuery(query.id, { text: 'موفق! 🌟' });

        // نمایش اطلاعات صفحه بدون متن
        showPageInfo(
          this.bot,
          chatId,
          messageId,
          page.id,
          page.page_start,
          page.page_end
        );
      });
    });
  }

  handleQuranPageNavigation(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const parts = query.data.split('_');
    const pageId = parseInt(parts[2]);
    const currentPage = parseInt(parts[3]);

    this.bot.answerCallbackQuery(query.id);

    this.db.pages.getPageById(pageId, (err, page) => {
      if (err || !page) {
        this.bot.answerCallbackQuery(query.id, { text: 'خطا در بارگذاری صفحه' });
        return;
      }

      showQuranPage(
        this.bot,
        chatId,
        messageId,
        page.id,
        page.page_start,
        page.page_end,
        currentPage
      );
    });
  }

  handleQuranPageNavigation(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const parts = query.data.split('_');
    const pageId = parseInt(parts[2]);
    const currentPage = parseInt(parts[3]);

    this.bot.answerCallbackQuery(query.id);

    this.db.pages.getPageById(pageId, (err, page) => {
      if (err || !page) {
        this.bot.answerCallbackQuery(query.id, { text: 'خطا در بارگذاری صفحه' });
        return;
      }

      showQuranPage(
        this.bot,
        chatId,
        messageId,
        page.id,
        page.page_start,
        page.page_end,
        currentPage
      );
    });
  }


  handleCompletePage(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const pageId = parseInt(query.data.split('_')[1]);

    this.db.pages.completePage(pageId, userId, (err, result) => {
      if (err || result.changes === 0) {
        this.bot.answerCallbackQuery(query.id, { text: 'خطا در ثبت' });
        return;
      }

      this.bot.answerCallbackQuery(query.id, { text: 'الحمدلله! خداوند قبول کند 🤲' });

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📖 انتخاب صفحه بعدی', callback_data: 'join_khatm' }],
            [{ text: '🏠 منوی اصلی', callback_data: 'back_to_main' }]
          ]
        }
      };

      this.bot.editMessageText(
        '✅ خواندن شما ثبت شد.\n\nمی‌توانید صفحه بعدی را انتخاب کنید.',
        { chat_id: chatId, message_id: messageId, reply_markup: keyboard.reply_markup }
      );
    });
  }

  handleCancelPage(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const pageId = parseInt(query.data.split('_')[2]);

    this.db.pages.cancelPage(pageId, userId, (err, result) => {
      if (err || result.changes === 0) {
        this.bot.answerCallbackQuery(query.id, { text: 'خطا در لغو انتخاب' });
        return;
      }

      this.bot.answerCallbackQuery(query.id, { text: 'انتخاب لغو شد' });

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📖 انتخاب صفحه جدید', callback_data: 'join_khatm' }],
            [{ text: '🏠 منوی اصلی', callback_data: 'back_to_main' }]
          ]
        }
      };

      this.bot.editMessageText(
        '❌ انتخاب صفحه لغو شد.\n\nمی‌توانید صفحه دیگری را انتخاب کنید.',
        { chat_id: chatId, message_id: messageId, reply_markup: keyboard.reply_markup }
      );
    });
  }

  handleManualPage(query) {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const campaignId = parseInt(query.data.split('_')[2]);

    this.bot.answerCallbackQuery(query.id);
    this.userStates[userId] = { waitingFor: 'page_number', campaignId };
    this.bot.sendMessage(chatId, 'لطفاً شماره صفحه مورد نظر را وارد کنید (1 تا 604):');
  }

  handleConfirmPage(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const pageId = parseInt(query.data.split('_')[2]);
    const userName = `${query.from.first_name || ''} ${query.from.last_name || ''}`.trim();

    this.db.pages.assignPage(pageId, userId, userName, (err, result) => {
      if (err || result.changes === 0) {
        this.bot.answerCallbackQuery(query.id, { text: 'این صفحه قبلاً انتخاب شده است' });
        return;
      }

      this.db.pages.getPageById(pageId, (err, page) => {
        if (err || !page) {
          this.bot.answerCallbackQuery(query.id, { text: 'خطا در انتساب صفحه' });
          return;
        }

        this.bot.answerCallbackQuery(query.id, { text: 'موفق! 🌟' });

        // نمایش اطلاعات صفحه بدون متن
        showPageInfo(
          this.bot,
          chatId,
          messageId,
          page.id,
          page.page_start,
          page.page_end
        );
      });
    });
  }

  handleViewQuran(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const parts = query.data.split('_');
    const pageId = parseInt(parts[2]);
    const currentPage = parseInt(parts[3]);

    this.bot.answerCallbackQuery(query.id);

    this.db.pages.getPageById(pageId, (err, page) => {
      if (err || !page) {
        this.bot.answerCallbackQuery(query.id, { text: 'خطا در بارگذاری صفحه' });
        return;
      }

      showQuranPage(
        this.bot,
        chatId,
        messageId,
        page.id,
        page.page_start,
        page.page_end,
        currentPage
      );
    });
  }

  handleCloseQuran(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const pageId = parseInt(query.data.split('_')[2]);

    this.bot.answerCallbackQuery(query.id);

    this.db.pages.getPageById(pageId, (err, page) => {
      if (err || !page) {
        this.bot.answerCallbackQuery(query.id, { text: 'خطا در بارگذاری صفحه' });
        return;
      }

      showPageInfo(
        this.bot,
        chatId,
        messageId,
        page.id,
        page.page_start,
        page.page_end
      );
    });
  }

  // هندلرهای ادمین
  handleAdminPanel(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;

    this.bot.answerCallbackQuery(query.id);

    if (!isAdmin(userId)) {
      this.bot.sendMessage(chatId, '⚠️ شما دسترسی ندارید');
      return;
    }

    showAdminPanel(this.bot, chatId, messageId);
  }

  handleCreateCampaign(query) {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    if (!isAdmin(userId)) {
      this.bot.answerCallbackQuery(query.id, { text: 'شما دسترسی ندارید' });
      return;
    }

    // نمایش انتخاب نوع کمپین
    const message = '📝 ایجاد کمپین جدید\n\nلطفاً نوع کمپین را انتخاب کنید:';
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📖 ختم قرآن (زائرین)', callback_data: 'create_camp_type_zaerin' }],
          [{ text: '🌟 صلوات شمار', callback_data: 'create_camp_type_salawat' }],
          [{ text: '🔙 بازگشت', callback_data: 'admin_panel' }]
        ]
      }
    };

    this.bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard.reply_markup
    }).catch(err => {
      console.error('Error editing message:', err.message);
      this.bot.sendMessage(chatId, message, keyboard);
    });

    this.bot.answerCallbackQuery(query.id);
  }

  handleSelectCampaignType(query) {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const campaignType = query.data.split('_')[3]; // zaerin یا salawat

    if (!isAdmin(userId)) {
      this.bot.answerCallbackQuery(query.id, { text: 'شما دسترسی ندارید' });
      return;
    }

    this.userStates[userId] = { 
      waitingFor: 'campaign_name',
      campaignType: campaignType
    };

    const typeText = campaignType === 'salawat' ? '🌟 صلوات شمار' : '📖 ختم قرآن (زائرین)';
    this.bot.sendMessage(chatId, `نوع کمپین: ${typeText}\n\nلطفاً نام کمپین را وارد کنید:`);
    this.bot.answerCallbackQuery(query.id);
  }

  handleManageCampaigns(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;

    this.bot.answerCallbackQuery(query.id);

    if (!isAdmin(userId)) {
      this.bot.sendMessage(chatId, '⚠️ شما دسترسی ندارید');
      return;
    }

    showManageCampaigns(this.bot, chatId, messageId, this.db);
  }

  handleManageCampaign(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const campaignId = parseInt(query.data.split('_')[2]);

    this.bot.answerCallbackQuery(query.id);

    if (!isAdmin(userId)) {
      this.bot.sendMessage(chatId, '⚠️ شما دسترسی ندارید');
      return;
    }

    showCampaignManagement(this.bot, chatId, messageId, campaignId, this.db);
  }

  handleToggleActive(query) {
    const userId = query.from.id;
    const campaignId = parseInt(query.data.split('_')[2]);

    this.bot.answerCallbackQuery(query.id);

    if (!isAdmin(userId)) {
      this.bot.sendMessage(query.message.chat.id, '⚠️ شما دسترسی ندارید');
      return;
    }

    this.db.campaigns.toggleCampaignActive(campaignId, (err) => {
      if (err) {
        this.bot.sendMessage(query.message.chat.id, 'خطا در تغییر وضعیت');
        return;
      }

      this.bot.emit('callback_query', {
        ...query,
        data: `manage_camp_${campaignId}`,
        id: query.id + '_refresh'
      });
    });
  }

  handleToggleComplete(query) {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const campaignId = parseInt(query.data.split('_')[2]);

    this.bot.answerCallbackQuery(query.id);

    if (!isAdmin(userId)) {
      this.bot.sendMessage(chatId, '⚠️ شما دسترسی ندارید');
      return;
    }

    this.db.campaigns.getCampaignById(campaignId, (err, campaign) => {
      if (err) {
        this.bot.sendMessage(chatId, 'خطا در تغییر وضعیت');
        return;
      }

      this.db.campaigns.setCampaignCompleted(campaignId, !campaign.is_completed, (err) => {
        if (err) {
          this.bot.sendMessage(chatId, 'خطا در تغییر وضعیت');
          return;
        }

        this.bot.emit('callback_query', {
          ...query,
          data: `manage_camp_${campaignId}`,
          id: query.id + '_refresh'
        });
      });
    });
  }

  handleShowSummaryReport(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const campaignId = parseInt(query.data.split('_')[2]);

    if (!isAdmin(userId)) {
      this.bot.answerCallbackQuery(query.id, { text: 'شما دسترسی ندارید' });
      return;
    }

    this.bot.answerCallbackQuery(query.id);
    showCampaignSummaryReport(this.bot, chatId, messageId, campaignId, this.db);
  }

  handleListUsers(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;

    if (!isAdmin(userId)) {
      this.bot.answerCallbackQuery(query.id, { text: 'شما دسترسی ندارید' });
      return;
    }

    this.bot.answerCallbackQuery(query.id);
    showUsersList(this.bot, chatId, messageId, this.db);
  }

  handleInProgressPages(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const campaignId = parseInt(query.data.split('_')[2]);

    if (!isAdmin(userId)) {
      this.bot.answerCallbackQuery(query.id, { text: 'شما دسترسی ندارید' });
      return;
    }

    this.bot.answerCallbackQuery(query.id);
    showInProgressPages(this.bot, chatId, messageId, campaignId, this.db);
  }

  handleBackToMain(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;

    this.bot.answerCallbackQuery(query.id);

    const welcomeMessage = `منوی اصلی:`;
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📖 شرکت در پویش', callback_data: 'join_khatm' }],
          [{ text: '📊 وضعیت من', callback_data: 'my_status' }],
          ...(isAdmin(userId) ? [[{ text: '⚙️ پنل ادمین', callback_data: 'admin_panel' }]] : [])
        ]
      }
    };

    this.bot.editMessageText(welcomeMessage, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard.reply_markup
    });
  }

  handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;

    if (this.userStates[userId]?.waitingFor === 'campaign_name') {
      const campaignType = this.userStates[userId]?.campaignType || 'zaerin';
      
      this.db.campaigns.createCampaign(text, campaignType, (err, campaignId) => {
        if (err) {
          this.bot.sendMessage(chatId, 'خطا در ایجاد کمپین');
          return;
        }

        const typeText = campaignType === 'salawat' ? '🌟 صلوات شمار' : '📖 ختم قرآن';
        this.bot.sendMessage(chatId, `✅ کمپین "${text}" (${typeText}) با موفقیت ایجاد شد!`);
        delete this.userStates[userId];
      });
    }
    else if (this.userStates[userId]?.waitingFor === 'zaer_code') {
      const zaerCode = text.trim();
      const campaignId = this.userStates[userId].campaignId;

      if (!zaerCode || zaerCode.length < 3) {
        this.bot.sendMessage(chatId, '❌ لطفاً یک کد زائر معتبر وارد کنید.');
        return;
      }

      this.db.users.setUserZaerCode(userId, zaerCode, (err) => {
        if (err) {
          this.bot.sendMessage(chatId, '❌ خطا در ذخیره کد زائر');
          return;
        }

        this.bot.sendMessage(chatId, `✅ کد زائر شما (${zaerCode}) ثبت شد!`);
        
        // ادامه فرآیند انتخاب کمپین
        this.continueSelectCampaign(userId, chatId, null, campaignId);
      });
    }
    else if (this.userStates[userId]?.waitingFor === 'page_number') {
      const pageNumber = parseInt(text);
      const campaignId = this.userStates[userId].campaignId;

      if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > config.quran.totalPages) {
        this.bot.sendMessage(chatId, `❌ لطفاً یک عدد بین 1 تا ${config.quran.totalPages} وارد کنید.`);
        return;
      }

      this.db.pages.getPageByNumber(campaignId, pageNumber, (err, page) => {
        if (err) {
          this.bot.sendMessage(chatId, '❌ خطا در بررسی صفحه');
          return;
        }

        if (!page) {
          const { pageStart, pageEnd } = getPagePair(pageNumber);
          this.bot.sendMessage(chatId, `❌ صفحات ${pageStart}-${pageEnd} قبلاً انتخاب شده است.\n\nلطفاً شماره دیگری وارد کنید یا از لیست انتخاب کنید.`);
          return;
        }

        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ تایید و انتخاب', callback_data: `confirm_page_${page.id}` }],
              [{ text: '🔙 بازگشت', callback_data: `select_campaign_${campaignId}` }]
            ]
          }
        };

        this.bot.sendMessage(
          chatId,
          `صفحات ${page.page_start} تا ${page.page_end} موجود است.\n\nآیا می‌خواهید این صفحات را انتخاب کنید؟`,
          keyboard
        );

        delete this.userStates[userId];
      });
    }
  }

  start() {
    process.on('unhandledRejection', (error) => {
      console.error('Unhandled promise rejection:', error);
    });

    process.on('SIGINT', () => {
      this.db.close();
      process.exit();
    });
  }
}

module.exports = QuranKhatmBot;
