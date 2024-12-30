const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'ai'],
    default: 'user'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Verimli sorgulama için bileşik indeks
messageSchema.index({ userId: 1, timestamp: -1 });

// Eski mesajları temizleme fonksiyonu
messageSchema.statics.cleanupOldMessages = async function() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const result = await this.deleteMany({ timestamp: { $lt: sevenDaysAgo } });
    console.log(`${result.deletedCount} eski mesaj temizlendi`);
    return result;
  } catch (error) {
    console.error('Mesaj temizleme hatası:', error);
    throw error;
  }
};

module.exports = mongoose.model('Message', messageSchema);