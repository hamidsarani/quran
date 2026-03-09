const axios = require('axios');
const fs = require('fs');
const path = require('path');

const QURAN_DATA_DIR = path.join(__dirname, '../../data/quran-pages');

/**
 * خواندن صفحه از فایل محلی
 */
function loadPageFromFile(pageNumber) {
  const filename = path.join(QURAN_DATA_DIR, `page-${pageNumber}.json`);
  
  if (fs.existsSync(filename)) {
    try {
      const data = fs.readFileSync(filename, 'utf8');
      const pageData = JSON.parse(data);
      console.log(`✓ صفحه ${pageNumber} از فایل محلی خوانده شد`);
      return pageData;
    } catch (error) {
      console.error(`خطا در خواندن فایل صفحه ${pageNumber}:`, error.message);
      return null;
    }
  }
  
  return null;
}

/**
 * دریافت متن یک صفحه از قرآن (اول از فایل محلی، بعد از API)
 */
async function getQuranPage(pageNumber) {
  // اول سعی می‌کنیم از فایل محلی بخونیم
  const localData = loadPageFromFile(pageNumber);
  if (localData) {
    return localData;
  }
  
  // اگر فایل محلی نبود، از API دریافت می‌کنیم
  console.log(`⬇️  دانلود صفحه ${pageNumber} از API...`);
  const url = `https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`;
  
  try {
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    console.log(`Received response for page ${pageNumber}, status: ${response.status}`);
    
    if (response.data && response.data.code === 200 && response.data.data) {
      console.log(`Successfully parsed page ${pageNumber}, ayahs count: ${response.data.data.ayahs?.length || 0}`);
      
      // ذخیره در فایل برای دفعات بعد
      savePageToFile(pageNumber, response.data.data);
      
      return response.data.data;
    } else {
      console.error(`Invalid response for page ${pageNumber}:`, response.data);
      throw new Error('Invalid response from Quran API');
    }
  } catch (err) {
    console.error(`Error fetching page ${pageNumber}:`, err.message);
    throw err;
  }
}

/**
 * ذخیره صفحه در فایل
 */
function savePageToFile(pageNumber, data) {
  try {
    // ایجاد پوشه اگر وجود ندارد
    if (!fs.existsSync(QURAN_DATA_DIR)) {
      fs.mkdirSync(QURAN_DATA_DIR, { recursive: true });
    }
    
    const filename = path.join(QURAN_DATA_DIR, `page-${pageNumber}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ صفحه ${pageNumber} در فایل ذخیره شد`);
  } catch (error) {
    console.error(`خطا در ذخیره صفحه ${pageNumber}:`, error.message);
  }
}

/**
 * فرمت کردن متن قرآن برای نمایش
 */
function formatQuranText(pageData) {
  if (!pageData || !pageData.ayahs) {
    console.error('Invalid pageData:', pageData);
    return '';
  }
  
  console.log(`Formatting page ${pageData.number} with ${pageData.ayahs.length} ayahs`);
  
  let text = `📖 صفحه ${pageData.number}\n\n`;
  
  // گروه‌بندی آیات بر اساس سوره
  const surahGroups = {};
  pageData.ayahs.forEach(ayah => {
    const surahNum = ayah.surah.number;
    if (!surahGroups[surahNum]) {
      surahGroups[surahNum] = {
        name: ayah.surah.name,
        ayahs: []
      };
    }
    surahGroups[surahNum].ayahs.push(ayah);
  });
  
  // نمایش هر سوره
  Object.keys(surahGroups).forEach(surahNum => {
    const group = surahGroups[surahNum];
    text += `﴿ ${group.name} ﴾\n\n`;
    
    group.ayahs.forEach(ayah => {
      text += `${ayah.text} ﴿${ayah.numberInSurah}﴾\n`;
    });
    text += '\n';
  });
  
  console.log(`Formatted text length: ${text.length} characters`);
  return text;
}

/**
 * دریافت و فرمت یک صفحه قرآن
 */
async function getQuranPageText(pageNumber, callback) {
  console.log(`Getting Quran page ${pageNumber}`);
  
  try {
    const data = await getQuranPage(pageNumber);
    if (!data) {
      callback(new Error('Failed to load page'));
      return;
    }
    
    const text = formatQuranText(data);
    
    if (!text || text.trim().length === 0) {
      console.error('Generated text is empty!');
      callback(new Error('Generated text is empty'));
      return;
    }
    
    callback(null, text);
  } catch (err) {
    console.error('Error in getQuranPageText:', err);
    callback(err);
  }
}

/**
 * دریافت و فرمت متن چند صفحه
 */
async function getQuranPages(pageStart, pageEnd, callback) {
  console.log(`Getting Quran pages from ${pageStart} to ${pageEnd}`);
  
  try {
    const pages = [];
    
    // دریافت تمام صفحات به صورت موازی
    for (let i = pageStart; i <= pageEnd; i++) {
      try {
        const data = await getQuranPage(i);
        if (data) {
          pages.push({ number: data.number, data });
        }
      } catch (err) {
        console.error(`Failed to get page ${i}:`, err.message);
      }
    }
    
    if (pages.length === 0) {
      console.error('All pages failed to load');
      callback(new Error('Failed to load Quran pages'));
      return;
    }
    
    // مرتب‌سازی بر اساس شماره صفحه
    pages.sort((a, b) => a.number - b.number);
    
    console.log(`Successfully loaded ${pages.length} out of ${pageEnd - pageStart + 1} pages`);
    
    let fullText = '';
    pages.forEach(page => {
      const pageText = formatQuranText(page.data);
      fullText += pageText;
      if (pages.length > 1 && page !== pages[pages.length - 1]) {
        fullText += '\n━━━━━━━━━━━━━━━━\n\n';
      }
    });
    
    console.log(`Final text length: ${fullText.length} characters`);
    
    if (!fullText || fullText.trim().length === 0) {
      console.error('Generated text is empty!');
      callback(new Error('Generated text is empty'));
      return;
    }
    
    callback(null, fullText);
  } catch (err) {
    console.error('Error in getQuranPages:', err);
    callback(err);
  }
}

module.exports = {
  getQuranPage,
  getQuranPageText,
  formatQuranText,
  getQuranPages
};
