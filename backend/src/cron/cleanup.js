const cron = require('node-cron');
const Message = require('../models/Message');

// Her gün gece yarısı çalışacak cron job
function setupCleanupJob() {
  // Her gün saat 00:00'da çalış
  cron.schedule('0 0 * * *', async () => {
    console.log('Mesaj temizleme görevi başlatılıyor...');

    try {
      await Message.cleanupOldMessages();
      console.log('Mesaj temizleme görevi tamamlandı');
    } catch (error) {
      console.error('Mesaj temizleme görevi hatası:', error);
    }
  });

  console.log('Mesaj temizleme görevi planlandı');
}

module.exports = setupCleanupJob;